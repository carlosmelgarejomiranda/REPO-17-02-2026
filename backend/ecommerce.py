# E-commerce routes for Avenue Online
# This file contains all e-commerce related endpoints

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import httpx
import os
import stripe
import googlemaps
from datetime import datetime, timezone
import uuid
import asyncio
import math
import re

# Initialize router
ecommerce_router = APIRouter(prefix="/api/shop")

# Configuration
ENCOM_API_URL = os.environ.get('ENCOM_API_URL', 'https://api.cloud.encom.com.py')
ENCOM_API_TOKEN = os.environ.get('ENCOM_API_TOKEN', '')
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')
STORE_LAT = float(os.environ.get('STORE_LAT', '-25.2867'))
STORE_LNG = float(os.environ.get('STORE_LNG', '-57.6474'))
DELIVERY_PRICE_PER_KM = float(os.environ.get('DELIVERY_PRICE_PER_KM', '2500'))
DELIVERY_MIN_PRICE = float(os.environ.get('DELIVERY_MIN_PRICE', '15000'))

# Initialize Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')

# Initialize Google Maps client
gmaps = None
if GOOGLE_MAPS_API_KEY:
    gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

# Gender mapping based on category/brand keywords
FEMALE_KEYWORDS = ['malva', 'santal', 'ina clothing', 'efimera', 'thula', 'mariela', 'sarelly', 'cristaline']
MALE_KEYWORDS = ['bro fitwear', 'lacoste', 'immortal']
UNISEX_KEYWORDS = ['aguara', 'ds', 'mp suplementos', 'ugg']

def extract_size_from_name(name: str) -> Optional[str]:
    """Extract size from product name"""
    # Common patterns: -38-, -M-, -XL-, -U- (único)
    match = re.search(r'-([XSML]{1,3}|[0-9]{1,2}|U)-', name, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    # Also check at the end of name
    match = re.search(r'-([XSML]{1,3}|[0-9]{1,2}|U)$', name, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    return None

def determine_gender(category: str, brand: str) -> str:
    """Determine gender based on category/brand"""
    cat_lower = (category or '').lower()
    brand_lower = (brand or '').lower()
    
    for keyword in FEMALE_KEYWORDS:
        if keyword in cat_lower or keyword in brand_lower:
            return 'mujer'
    
    for keyword in MALE_KEYWORDS:
        if keyword in cat_lower or keyword in brand_lower:
            return 'hombre'
    
    return 'unisex'

# ==================== MODELS ====================

class CartItem(BaseModel):
    product_id: str
    quantity: int
    name: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None

class DeliveryAddress(BaseModel):
    lat: float
    lng: float
    address: str
    city: Optional[str] = None
    reference: Optional[str] = None

class CheckoutData(BaseModel):
    items: List[CartItem]
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    delivery_type: str  # 'delivery' or 'pickup'
    delivery_address: Optional[DeliveryAddress] = None
    payment_method: str  # 'stripe' or 'bancard'
    notes: Optional[str] = None

class DeliveryCalculation(BaseModel):
    lat: float
    lng: float

# ==================== FILTERS ENDPOINT ====================

@ecommerce_router.get("/filters")
async def get_filters():
    """Get available filter options"""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{ENCOM_API_URL}/products",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ENCOM_API_TOKEN}"
                },
                json={"limit": 500, "page": 1}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Error connecting to ERP")
            
            data = response.json()
            products = data.get('data', [])
            
            # Filter products with stock
            products = [p for p in products if float(p.get('stock', 0)) > 0]
            
            # Collect unique values
            categories = {}
            sizes = set()
            genders = {'mujer': 0, 'hombre': 0, 'unisex': 0}
            
            for p in products:
                # Categories
                cat = p.get('category', '').strip()
                if cat:
                    categories[cat] = categories.get(cat, 0) + 1
                
                # Sizes from name
                size = extract_size_from_name(p.get('Name', ''))
                if size:
                    sizes.add(size)
                
                # Gender
                gender = determine_gender(p.get('category', ''), p.get('brand', ''))
                genders[gender] += 1
            
            # Sort sizes (numeric first, then alpha)
            numeric_sizes = sorted([s for s in sizes if s.isdigit()], key=int)
            alpha_sizes = sorted([s for s in sizes if not s.isdigit()])
            sorted_sizes = numeric_sizes + alpha_sizes
            
            return {
                "categories": [{"name": k, "count": v} for k, v in sorted(categories.items(), key=lambda x: -x[1])],
                "sizes": sorted_sizes,
                "genders": [
                    {"value": "mujer", "label": "Mujer", "count": genders['mujer']},
                    {"value": "hombre", "label": "Hombre", "count": genders['hombre']},
                    {"value": "unisex", "label": "Unisex", "count": genders['unisex']}
                ]
            }
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"ERP connection error: {str(e)}")

# ==================== PRODUCTS ENDPOINTS ====================

@ecommerce_router.get("/products")
async def get_products(
    page: int = 1,
    limit: int = 20,
    category: Optional[str] = None,
    gender: Optional[str] = None,
    size: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    """Get products from Encom ERP"""
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{ENCOM_API_URL}/products",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ENCOM_API_TOKEN}"
                },
                json={"limit": 500, "page": 1}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Error connecting to ERP: status {response.status_code}")
            
            data = response.json()
            products = data.get('data', [])
            
            # Filter products with stock > 0
            products = [p for p in products if float(p.get('stock', 0)) > 0]
            
            # Apply filters
            if search:
                search_lower = search.lower()
                products = [p for p in products if search_lower in p.get('Name', '').lower()]
            
            if category:
                products = [p for p in products if p.get('category', '').strip().lower() == category.lower()]
            
            if gender:
                products = [p for p in products if determine_gender(p.get('category', ''), p.get('brand', '')) == gender]
            
            if size:
                products = [p for p in products if extract_size_from_name(p.get('Name', '')) == size.upper()]
            
            if min_price:
                products = [p for p in products if float(p.get('price', 0)) >= min_price]
            
            if max_price:
                products = [p for p in products if float(p.get('price', 0)) <= max_price]
            
            # Pagination
            total = len(products)
            start = (page - 1) * limit
            end = start + limit
            paginated_products = products[start:end]
            
            # Transform products for frontend
            transformed = []
            for p in paginated_products:
                product_size = extract_size_from_name(p.get('Name', ''))
                product_gender = determine_gender(p.get('category', ''), p.get('brand', ''))
                
                transformed.append({
                    "id": p.get('ID'),
                    "name": p.get('Name'),
                    "sku": p.get('sku'),
                    "price": float(p.get('price', 0)),
                    "stock": float(p.get('stock', 0)),
                    "discount": float(p.get('discount', 0)),
                    "description": p.get('description', ''),
                    "image": p.get('img_url', ''),
                    "category": p.get('category', '').strip(),
                    "brand": p.get('brand', '').strip(),
                    "size": product_size,
                    "gender": product_gender,
                    "featured": p.get('featured', False)
                })
            
            return {
                "products": transformed,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": math.ceil(total / limit)
            }
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"ERP connection error: {str(e)}")

@ecommerce_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product details"""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{ENCOM_API_URL}/products",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ENCOM_API_TOKEN}"
                },
                json={"limit": 500, "page": 1}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Error connecting to ERP")
            
            data = response.json()
            products = data.get('data', [])
            
            # Find the product
            product = next((p for p in products if p.get('ID') == product_id), None)
            
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
            
            return {
                "id": product.get('ID'),
                "name": product.get('Name'),
                "sku": product.get('sku'),
                "price": float(product.get('price', 0)),
                "stock": float(product.get('stock', 0)),
                "discount": float(product.get('discount', 0)),
                "description": product.get('description', ''),
                "image": product.get('img_url', ''),
                "category_id": product.get('categoryID'),
                "brand_id": product.get('brandID'),
                "featured": product.get('featured', False)
            }
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"ERP connection error: {str(e)}")

@ecommerce_router.get("/featured")
async def get_featured_products():
    """Get featured products for homepage"""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{ENCOM_API_URL}/products",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ENCOM_API_TOKEN}"
                },
                json={"limit": 100, "page": 1}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Error connecting to ERP")
            
            data = response.json()
            products = data.get('data', [])
            
            # Filter featured products with stock
            featured = [p for p in products if p.get('featured') and float(p.get('stock', 0)) > 0][:8]
            
            # If not enough featured, get products with stock
            if len(featured) < 8:
                with_stock = [p for p in products if float(p.get('stock', 0)) > 0][:8]
                featured = with_stock
            
            transformed = []
            for p in featured:
                transformed.append({
                    "id": p.get('ID'),
                    "name": p.get('Name'),
                    "price": float(p.get('price', 0)),
                    "image": p.get('img_url', ''),
                    "discount": float(p.get('discount', 0))
                })
            
            return transformed
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"ERP connection error: {str(e)}")

# ==================== DELIVERY CALCULATION ====================

@ecommerce_router.post("/calculate-delivery")
async def calculate_delivery(data: DeliveryCalculation):
    """Calculate delivery cost based on distance"""
    if not gmaps:
        # Fallback: calculate using Haversine formula
        distance_km = haversine_distance(STORE_LAT, STORE_LNG, data.lat, data.lng)
    else:
        try:
            # Use Google Maps Distance Matrix
            result = gmaps.distance_matrix(
                origins=[(STORE_LAT, STORE_LNG)],
                destinations=[(data.lat, data.lng)],
                mode="driving"
            )
            
            if result['rows'][0]['elements'][0]['status'] == 'OK':
                distance_meters = result['rows'][0]['elements'][0]['distance']['value']
                distance_km = distance_meters / 1000
            else:
                # Fallback to Haversine
                distance_km = haversine_distance(STORE_LAT, STORE_LNG, data.lat, data.lng)
        except Exception:
            distance_km = haversine_distance(STORE_LAT, STORE_LNG, data.lat, data.lng)
    
    # Calculate cost
    delivery_cost = distance_km * DELIVERY_PRICE_PER_KM
    delivery_cost = max(delivery_cost, DELIVERY_MIN_PRICE)
    
    return {
        "distance_km": round(distance_km, 2),
        "delivery_cost": round(delivery_cost),
        "price_per_km": DELIVERY_PRICE_PER_KM,
        "min_price": DELIVERY_MIN_PRICE
    }

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

# ==================== CHECKOUT & ORDERS ====================

@ecommerce_router.post("/checkout/stripe")
async def create_stripe_checkout(data: CheckoutData, request: Request):
    """Create Stripe checkout session"""
    from server import db, notify_new_order
    
    # Calculate totals
    subtotal = sum(item.price * item.quantity for item in data.items if item.price)
    delivery_cost = 0
    
    if data.delivery_type == 'delivery' and data.delivery_address:
        delivery_result = await calculate_delivery(DeliveryCalculation(
            lat=data.delivery_address.lat,
            lng=data.delivery_address.lng
        ))
        delivery_cost = delivery_result['delivery_cost']
    
    total = subtotal + delivery_cost
    
    # Create order in database
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    order_doc = {
        "order_id": order_id,
        "items": [item.model_dump() for item in data.items],
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "customer_phone": data.customer_phone,
        "delivery_type": data.delivery_type,
        "delivery_address": data.delivery_address.model_dump() if data.delivery_address else None,
        "delivery_cost": delivery_cost,
        "subtotal": subtotal,
        "total": total,
        "payment_method": "stripe",
        "payment_status": "pending",
        "order_status": "pending",
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    try:
        # Create Stripe checkout session
        line_items = []
        
        for item in data.items:
            line_items.append({
                "price_data": {
                    "currency": "pyg",
                    "product_data": {
                        "name": item.name or f"Producto {item.product_id}",
                        "images": [item.image] if item.image else []
                    },
                    "unit_amount": int(item.price) if item.price else 0
                },
                "quantity": item.quantity
            })
        
        # Add delivery cost if applicable
        if delivery_cost > 0:
            line_items.append({
                "price_data": {
                    "currency": "pyg",
                    "product_data": {
                        "name": "Costo de envío"
                    },
                    "unit_amount": int(delivery_cost)
                },
                "quantity": 1
            })
        
        # Get base URL
        base_url = str(request.base_url).rstrip('/')
        if 'localhost' not in base_url:
            base_url = os.environ.get('REACT_APP_BACKEND_URL', base_url)
        
        frontend_url = base_url.replace('/api', '').replace(':8001', ':3000')
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=f"{frontend_url}/shop/order-success?order_id={order_id}",
            cancel_url=f"{frontend_url}/shop/cart",
            metadata={
                "order_id": order_id
            }
        )
        
        # Update order with Stripe session ID
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"stripe_session_id": session.id}}
        )
        
        return {
            "checkout_url": session.url,
            "order_id": order_id,
            "session_id": session.id
        }
        
    except stripe.error.StripeError as e:
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"payment_status": "failed", "error": str(e)}}
        )
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")

@ecommerce_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    from server import db, notify_new_order
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Event.construct_from(
            stripe.util.json.loads(payload), stripe.api_key
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        order_id = session.get('metadata', {}).get('order_id')
        
        if order_id:
            # Update order status
            await db.orders.update_one(
                {"order_id": order_id},
                {"$set": {
                    "payment_status": "paid",
                    "order_status": "confirmed",
                    "paid_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Get order and send notification
            order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
            if order:
                await notify_new_order(order)
    
    return {"status": "success"}

@ecommerce_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order details"""
    from server import db
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@ecommerce_router.get("/store-location")
async def get_store_location():
    """Get store location for map"""
    return {
        "lat": STORE_LAT,
        "lng": STORE_LNG,
        "address": "Paseo Los Árboles, Av. San Martín, Asunción",
        "name": "Avenue Store"
    }
