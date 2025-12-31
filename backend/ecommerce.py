# E-commerce routes for Avenue Online
# Uses MongoDB for fast local queries, syncs from ERP periodically

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import httpx
import os
import googlemaps
from datetime import datetime, timezone
import uuid
import asyncio
import math
import re
import logging
import unicodedata
from io import BytesIO
from PIL import Image as PILImage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import Stripe checkout from emergentintegrations
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutStatusResponse, 
    CheckoutSessionRequest
)

logger = logging.getLogger(__name__)

# Initialize router
ecommerce_router = APIRouter(prefix="/api/shop")

# Configuration
ENCOM_API_URL = os.environ.get('ENCOM_API_URL', 'https://api.cloud.encom.com.py')
ENCOM_API_TOKEN = os.environ.get('ENCOM_API_TOKEN', '')
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
STORE_LAT = float(os.environ.get('STORE_LAT', '-25.2867'))
STORE_LNG = float(os.environ.get('STORE_LNG', '-57.6474'))
DELIVERY_PRICE_PER_KM = float(os.environ.get('DELIVERY_PRICE_PER_KM', '2500'))
DELIVERY_MIN_PRICE = float(os.environ.get('DELIVERY_MIN_PRICE', '15000'))
SYNC_INTERVAL_SECONDS = 300  # 5 minutes

# Initialize Google Maps client
gmaps = None
if GOOGLE_MAPS_API_KEY:
    gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

# Database reference (will be set from server.py)
db = None

def set_database(database):
    global db
    db = database

# Gender mapping based on category/brand keywords
FEMALE_KEYWORDS = ['malva', 'santal', 'ina clothing', 'efimera', 'thula', 'mariela', 'sarelly', 'cristaline', 'bravisima', 'olivia']
MALE_KEYWORDS = ['bro fitwear', 'lacoste', 'immortal']
UNISEX_KEYWORDS = ['aguara', 'ds', 'mp suplementos', 'ugg']

# Sync status
sync_status = {
    "last_sync": None,
    "syncing": False,
    "product_count": 0
}

# ==================== HELPER FUNCTIONS ====================

def extract_size_from_name(name: str) -> Optional[str]:
    """Extract size from product name
    
    Handles multiple size conventions:
    - Standard: XS, S, M, L, XL, XXL, XXXL
    - Brazilian/Spanish: PP, P, M, G, GG, XG, XXG, XXXG, XP (extra pequeño)
    - Numeric: 34, 36, 38, 40, 42, etc. (including single digits 8, 10, 12, 14, 16 for kids)
    - US sizes: US5, US6, US7, etc.
    - Combined: S/M, M/L, etc.
    - Dot notation: .M, .G, .XG (used by some brands)
    """
    if not name:
        return None
    
    # Normalize name for easier matching
    name_upper = name.upper()
    
    # Comprehensive size patterns (order matters - more specific first)
    patterns = [
        # US sizes
        r'[-\s](US\d{1,2})(?:[-\s]|$)',     # -US8, -US10, US8-, " US8 "
        
        # Combined sizes with slash
        r'[-\s]([XSMLPG]{1,3}/[XSMLPG]{1,3})(?:[-\s]|$)',  # S/M, M/L
        
        # Extended alpha sizes with X prefix (XXL, XXXL, XXG, XXXG, XP, XS, XL, etc.)
        r'[-\s\.](X{1,3}[SLGP])(?:[-\s\.]|$)',  # XS, XXS, XXXS, XL, XXL, XXXL, XG, XXG, XXXG, XP
        
        # Brazilian/Spanish double sizes - PP, GG (not ambiguous with color codes)
        r'[-\s\.](PP)(?:[-\s\.]|$)',              # PP (extra small)
        
        # Single letter sizes at specific positions - P, M, G, S, L
        # Be more specific to avoid matching color codes
        r'-([PMGSL])-[A-Z]',                # -P-, -M- etc. followed by color name
        r'[-\s\.]([PMGSL])(?:[-\s\.]|$)',   # P, M, G, S, L (single letter) at boundaries
        
        # Numeric sizes (2 digits) - common clothing sizes
        r'[-\s](\d{2})(?:[-\s]|$)',              # 34, 36, 38, etc.
        
        # Numeric sizes for kids (single digits 8-16)
        r'-([8]|1[0246])(?:-|$)',                # 8, 10, 12, 14, 16 for kids
        
        # At end of string patterns
        r'-(US\d{1,2})$',                        # ends with -US8
        r'[-\.](X{1,3}[SLGP])$',                 # ends with -XL, -XXL, -XG, -XXG, -XP, .XG
        r'-(PP)$',                               # ends with -PP
        r'-([PMGSL])$',                          # ends with -P, -M, -G, -S, -L
        r'\.([PMGSL])$',                         # ends with .P, .M, .G (dot notation)
        r'-(\d{2})$',                            # ends with -38
        
        # Space separated at end
        r'\s(X{1,3}[SLGP])$',                    # ends with " XL", " XP"
        r'\s(PP)$',                              # ends with " PP"
        r'\s([PMGSL])$',                         # ends with " M"
        r'\s(\d{2})$',                           # ends with " 38"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, name_upper)
        if match:
            size = match.group(1).upper()
            return size
    
    return None


def normalize_size(size: str) -> str:
    """Normalize size to standard format for grouping purposes
    
    Converts Brazilian/Spanish sizes to standard equivalents:
    - PP -> XS, P -> S, G -> L, GG -> XL, XG -> XL, XXG -> XXL, etc.
    """
    if not size:
        return size
    
    size = size.upper()
    
    # Brazilian to Standard mapping
    size_map = {
        'PP': 'XS',      # Extra pequeno -> Extra small
        'P': 'S',        # Pequeno -> Small
        # M stays M
        'G': 'L',        # Grande -> Large
        'GG': 'XL',      # Extra grande -> Extra large
        'XG': 'XL',      # Extra grande -> Extra large  
        'XXG': 'XXL',    # Extra extra grande -> XXL
        'XXXG': 'XXXL',  # XXXG -> XXXL
    }
    
    return size_map.get(size, size)

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

def extract_base_model(name: str) -> str:
    """Extract base model name by removing size from product name
    
    Removes all size patterns to get the base product model name
    for grouping variants together.
    
    Handles complex patterns like:
    - Wuarani: 100394-BP- (Blanco Pequeño), 100394-NM- (Negro Mediano)
    - OKI: REM.PREM.BLA.M (ends with .M for size)
    - Standard: -P-, -M-, -G-, -XL-, etc.
    """
    if not name:
        return name
    
    # Pre-normalize: fix inconsistent spacing around dashes
    base = name
    base = re.sub(r'\s+', ' ', base)    # multiple spaces to one
    base = re.sub(r'\s*-\s*', '-', base)  # " - " or "- " or " -" → "-"
    
    # Patterns to remove sizes (order matters - more specific first)
    patterns = [
        # ===========================================
        # PRODUCT CODE PATTERNS (Wuarani style)
        # Format: XXXXX-[COLOR][SIZE]- where COLOR is letter(s) and SIZE is P/M/G/XL/etc
        # ===========================================
        # Color codes: N=Negro, B=Blanco, R=Rosa/Rojo, G=Gris, C=Celeste, V=Verde, F=Fucsia, L=Lila, O=Ocre, P=Petroleo/Piel
        # Size codes: XP, P, M, G, XL, XXL, XG, XXG
        
        # Extended sizes with X prefix: NXP, BXL, GXXL, PXL, etc.
        (r'(\d{5,6}-\d?[NBRGCVFLOAP])(X{1,2}[PLG])(-)', r'\1-'),  # 100394-BXP-, 100100-PXL- → remove size
        
        # Single letter sizes: NP, NM, NG, BP, BM, BG, PP, PM, PG etc.
        (r'(\d{5,6}-\d?[NBRGCVFLOAP])([PMGSL])(-)', r'\1-'),      # 100394-BP-, 100100-PM- → remove size
        
        # ===========================================
        # DOT NOTATION (OKI style: REM.PREM.BLA.M)
        # ===========================================
        (r'\.(X{1,2}[SLGP])$', ''),           # .XL, .XG, .XP at end → remove
        (r'\.([PMGSL])$', ''),                # .P, .M, .G at end → remove
        (r'\.(X{1,2}[SLGP])-', '-'),          # .XL- → -
        (r'\.([PMGSL])-', '-'),               # .M- → -
        
        # ===========================================
        # US SIZES
        # ===========================================
        (r'-(US\d{1,2})$', ''),           # -US8 at end → remove
        (r'-(US\d{1,2})-', '-'),          # -US8- → keep one dash
        (r'\s(US\d{1,2})(?:\s|$)', ' '),  # space US8 → space
        
        # ===========================================
        # COMBINED SIZES WITH SLASH
        # ===========================================
        (r'-([XSMLPG]{1,3}/[XSMLPG]{1,3})$', ''),      # -S/M at end → remove
        (r'-([XSMLPG]{1,3}/[XSMLPG]{1,3})-', '-'),     # -S/M- → -
        
        # ===========================================
        # EXTENDED ALPHA SIZES (XS, XL, XXL, XG, XXG, XP)
        # ===========================================
        (r'-(X{1,3}[SLGP])$', ''),         # -XXL, -XXG, -XP at end → remove
        (r'-(X{1,3}[SLGP])-', '-'),        # -XXL-, -XXG-, -XP- → -
        (r'\s(X{1,3}[SLGP])$', ''),        # space XXL at end → remove
        (r'\s(X{1,3}[SLGP])\s', ' '),      # space XXL space → space
        
        # ===========================================
        # DOUBLE LETTER SIZES (PP, GG)
        # ===========================================
        (r'-(PP)$', ''),                   # -PP at end → remove
        (r'-(PP)-', '-'),                  # -PP- → -
        (r'\s(PP)$', ''),                  # space PP at end → remove
        (r'\s(PP)\s', ' '),                # space PP space → space
        # Note: GG is ambiguous (could be Gris Grande) - handle in context
        
        # ===========================================
        # SINGLE LETTER SIZES (P, M, G, S, L)
        # ===========================================
        (r'-([PMGSL])$', ''),              # -P, -M, -G, -S, -L at end → remove
        (r'-([PMGSL])-', '-'),             # -P-, -M- etc → -
        (r'\s([PMGSL])$', ''),             # space P at end → remove
        (r'\s([PMGSL])\s', ' '),           # space P space → space (P in middle of name)
        
        # ===========================================
        # NUMERIC SIZES (kids: 8-16, adults: 34-50)
        # ===========================================
        (r'-([8]|1[0246])$', ''),          # -8, -10, -12, -14, -16 at end (kids)
        (r'-([8]|1[0246])-', '-'),         # -8-, -10- etc (kids) → -
        (r'-(\d{2})$', ''),                # -38 at end → remove
        (r'-(\d{2})-', '-'),               # -38- → -
        (r'\s(\d{2})$', ''),               # space 38 at end → remove
        (r'\s(\d{2})\s', ' '),             # space 38 space → space
    ]
    
    for pattern, replacement in patterns:
        base = re.sub(pattern, replacement, base, flags=re.IGNORECASE)
    
    # Post-normalize and clean up
    base = re.sub(r'-+', '-', base)    # multiple dashes to one
    base = re.sub(r'\s+', ' ', base)   # multiple spaces to one
    base = re.sub(r'-(\d{4})$', '', base)  # remove trailing product codes like -3721, -3723
    base = base.strip('-').strip()
    
    return base

def transform_product(p: dict) -> dict:
    """Transform ERP product to our format"""
    product_size = extract_size_from_name(p.get('Name', ''))
    product_gender = determine_gender(p.get('category', ''), p.get('brand', ''))
    base_model = extract_base_model(p.get('Name', ''))
    
    return {
        "product_id": p.get('ID'),
        "name": p.get('Name', ''),
        "base_model": base_model,
        "sku": p.get('sku', ''),
        "price": float(p.get('price', 0) or 0),
        "stock": float(p.get('stock', 0) or 0),
        "discount": float(p.get('discount', 0) or 0),
        "description": p.get('description', ''),
        "image": p.get('img_url', ''),
        "category": (p.get('category', '') or '').strip(),
        "brand": (p.get('brand', '') or '').strip(),
        "size": product_size,
        "gender": product_gender,
        "featured": bool(p.get('featured')),
        "online": bool(p.get('online')),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

async def create_grouped_products():
    """Create grouped products collection from individual products"""
    logger.info("Creating grouped products...")
    
    # Aggregate products by base_model
    pipeline = [
        {"$match": {"stock": {"$gt": 0}}},
        {"$group": {
            "_id": "$base_model",
            "name": {"$first": "$name"},
            "base_model": {"$first": "$base_model"},
            "price": {"$min": "$price"},  # Minimum price
            "max_price": {"$max": "$price"},
            "total_stock": {"$sum": "$stock"},
            "category": {"$first": "$category"},
            "brand": {"$first": "$brand"},
            "gender": {"$first": "$gender"},
            "image": {"$first": "$image"},
            "description": {"$first": "$description"},
            "discount": {"$max": "$discount"},
            "variants": {
                "$push": {
                    "product_id": "$product_id",
                    "size": "$size",
                    "stock": "$stock",
                    "price": "$price",
                    "sku": "$sku"
                }
            }
        }},
        {"$addFields": {
            "available_sizes": {
                "$filter": {
                    "input": "$variants",
                    "as": "v",
                    "cond": {"$gt": ["$$v.stock", 0]}
                }
            }
        }},
        {"$addFields": {
            "sizes_list": {
                "$map": {
                    "input": "$available_sizes",
                    "as": "s",
                    "in": "$$s.size"
                }
            },
            "variant_count": {"$size": "$available_sizes"}
        }}
    ]
    
    grouped = await db.shop_products.aggregate(pipeline).to_list(5000)
    
    # Clear and recreate grouped products collection
    await db.shop_products_grouped.delete_many({})
    
    if grouped:
        # Add a unique ID to each grouped product
        for i, g in enumerate(grouped):
            g["grouped_id"] = f"grp_{i}"
            g.pop("_id", None)
        
        await db.shop_products_grouped.insert_many(grouped)
        logger.info(f"Created {len(grouped)} grouped products")
    
    return len(grouped)

# ==================== SYNC FUNCTIONS ====================

async def sync_products_from_erp():
    """Sync ALL products from ERP to MongoDB with pagination"""
    global sync_status
    
    if sync_status["syncing"]:
        logger.info("Sync already in progress, skipping")
        return
    
    sync_status["syncing"] = True
    logger.info("Starting FULL product sync from ERP...")
    
    try:
        all_products = []
        page = 1
        per_page = 500  # Products per page
        
        async with httpx.AsyncClient(timeout=180) as client:
            # First, get total count
            response = await client.post(
                f"{ENCOM_API_URL}/products",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ENCOM_API_TOKEN}"
                },
                json={"limit": 1, "page": 1}
            )
            
            if response.status_code != 200:
                logger.error(f"ERP API error: {response.status_code}")
                return
            
            data = response.json()
            total_products = data.get('total', 0)
            total_pages = math.ceil(total_products / per_page)
            
            logger.info(f"ERP has {total_products} products in {total_pages} pages")
            
            # Fetch all pages
            for page in range(1, total_pages + 1):
                logger.info(f"Fetching page {page}/{total_pages}...")
                
                response = await client.post(
                    f"{ENCOM_API_URL}/products",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {ENCOM_API_TOKEN}"
                    },
                    json={"limit": per_page, "page": page}
                )
                
                if response.status_code != 200:
                    logger.error(f"ERP API error on page {page}: {response.status_code}")
                    continue
                
                page_data = response.json()
                products = page_data.get('data', [])
                all_products.extend(products)
                
                # Small delay to not overwhelm the API
                await asyncio.sleep(0.5)
            
            if not all_products:
                logger.warning("No products received from ERP")
                return
            
            logger.info(f"Fetched {len(all_products)} products, saving to MongoDB...")
            
            # Transform and upsert products in batches
            for i, p in enumerate(all_products):
                transformed = transform_product(p)
                await db.shop_products.update_one(
                    {"product_id": transformed["product_id"]},
                    {"$set": transformed},
                    upsert=True
                )
                
                # Log progress every 500 products
                if (i + 1) % 500 == 0:
                    logger.info(f"Saved {i + 1}/{len(all_products)} products...")
            
            # Create grouped products
            grouped_count = await create_grouped_products()
            
            sync_status["last_sync"] = datetime.now(timezone.utc).isoformat()
            sync_status["product_count"] = len(all_products)
            sync_status["grouped_count"] = grouped_count
            
            logger.info(f"Product sync completed: {len(all_products)} products, {grouped_count} grouped")
            
    except Exception as e:
        logger.error(f"Error syncing products: {str(e)}")
    finally:
        sync_status["syncing"] = False

async def background_sync_loop():
    """Background task that syncs products periodically"""
    while True:
        await asyncio.sleep(SYNC_INTERVAL_SECONDS)
        await sync_products_from_erp()

async def start_sync_on_startup():
    """Initial sync and start background loop"""
    # Check if we have grouped products
    grouped_count = await db.shop_products_grouped.count_documents({})
    
    if grouped_count == 0:
        # Check individual products
        count = await db.shop_products.count_documents({})
        if count > 0:
            logger.info(f"Found {count} products, creating grouped products...")
            await create_grouped_products()
        else:
            logger.info("No products in database, performing initial sync...")
            await sync_products_from_erp()
    else:
        logger.info(f"Found {grouped_count} grouped products, starting background sync...")
        # Sync in background to not block startup
        asyncio.create_task(sync_products_from_erp())
    
    # Start periodic sync
    asyncio.create_task(background_sync_loop())

# ==================== MODELS ====================

class CartItem(BaseModel):
    product_id: str
    quantity: int
    name: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    size: Optional[str] = None
    sku: Optional[str] = None

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
    delivery_type: str
    delivery_address: Optional[DeliveryAddress] = None
    payment_method: str
    notes: Optional[str] = None

class DeliveryCalculation(BaseModel):
    lat: float
    lng: float

# ==================== SYNC ENDPOINTS ====================

@ecommerce_router.get("/sync-status")
async def get_sync_status():
    """Get product sync status"""
    count = await db.shop_products.count_documents({})
    return {
        "last_sync": sync_status["last_sync"],
        "syncing": sync_status["syncing"],
        "products_in_db": count
    }

@ecommerce_router.post("/sync")
async def force_sync():
    """Force sync products from ERP"""
    asyncio.create_task(sync_products_from_erp())
    return {"message": "Sync started in background"}

# ==================== FILTERS ENDPOINT ====================

@ecommerce_router.get("/filters")
async def get_filters():
    """Get available filter options from local DB - FAST"""
    try:
        # Get unique categories with count
        categories_pipeline = [
            {"$match": {"stock": {"$gt": 0}}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$match": {"_id": {"$ne": ""}}},
            {"$sort": {"count": -1}}
        ]
        categories_result = await db.shop_products.aggregate(categories_pipeline).to_list(100)
        categories = [{"name": c["_id"], "count": c["count"]} for c in categories_result if c["_id"]]
        
        # Get unique sizes
        sizes_pipeline = [
            {"$match": {"stock": {"$gt": 0}, "size": {"$ne": None}}},
            {"$group": {"_id": "$size"}}
        ]
        sizes_result = await db.shop_products.aggregate(sizes_pipeline).to_list(100)
        all_sizes = [s["_id"] for s in sizes_result if s["_id"]]
        
        # Sort sizes
        numeric_sizes = sorted([s for s in all_sizes if s.isdigit()], key=int)
        alpha_sizes = sorted([s for s in all_sizes if not s.isdigit()])
        sorted_sizes = numeric_sizes + alpha_sizes
        
        # Get gender counts
        gender_pipeline = [
            {"$match": {"stock": {"$gt": 0}}},
            {"$group": {"_id": "$gender", "count": {"$sum": 1}}}
        ]
        gender_result = await db.shop_products.aggregate(gender_pipeline).to_list(10)
        gender_counts = {g["_id"]: g["count"] for g in gender_result}
        
        return {
            "categories": categories,
            "sizes": sorted_sizes,
            "genders": [
                {"value": "mujer", "label": "Mujer", "count": gender_counts.get('mujer', 0)},
                {"value": "hombre", "label": "Hombre", "count": gender_counts.get('hombre', 0)},
                {"value": "unisex", "label": "Unisex", "count": gender_counts.get('unisex', 0)}
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting filters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
    """Get GROUPED products from local MongoDB - shows unique models with sizes"""
    try:
        # Build query for grouped products
        query = {"total_stock": {"$gt": 0}}
        
        if search:
            query["base_model"] = {"$regex": search, "$options": "i"}
        
        if category:
            query["category"] = {"$regex": f"^{category}$", "$options": "i"}
        
        if gender:
            query["gender"] = gender
        
        if size:
            # Filter products that have this size available
            query["sizes_list"] = size.upper()
        
        if min_price:
            query["price"] = {"$gte": min_price}
        
        if max_price:
            if "price" in query:
                query["price"]["$lte"] = max_price
            else:
                query["price"] = {"$lte": max_price}
        
        # Get total count from grouped collection
        total = await db.shop_products_grouped.count_documents(query)
        
        # Get paginated grouped products
        skip = (page - 1) * limit
        products = await db.shop_products_grouped.find(
            query,
            {"_id": 0}
        ).sort("base_model", 1).skip(skip).limit(limit).to_list(limit)
        
        # Transform for frontend
        result = []
        for p in products:
            # Sort available sizes (handle None values)
            available_sizes = p.get("available_sizes", [])
            sizes_sorted = []
            for s in available_sizes:
                size_val = s.get("size") if s else None
                if size_val:
                    sizes_sorted.append(s)
            
            # Sort: numeric first, then alphabetic
            sizes_sorted.sort(key=lambda x: (
                0 if (x.get("size") or "").isdigit() else 1,
                int(x.get("size") or "0") if (x.get("size") or "").isdigit() else (x.get("size") or "")
            ))
            
            # Filter None from sizes_list
            sizes_list = [s for s in p.get("sizes_list", []) if s]
            
            # Use custom image if available, otherwise use ERP image
            display_image = p.get("custom_image") or p.get("image")
            
            result.append({
                "id": p.get("grouped_id"),
                "name": p.get("base_model"),  # Use base model as display name
                "full_name": p.get("name"),
                "price": p.get("price"),
                "max_price": p.get("max_price"),
                "stock": p.get("total_stock"),
                "image": display_image,
                "category": p.get("category"),
                "brand": p.get("brand"),
                "gender": p.get("gender"),
                "discount": p.get("discount", 0),
                "description": p.get("description"),
                "available_sizes": sizes_sorted,
                "sizes_list": sizes_list,
                "variant_count": p.get("variant_count", 1)
            })
        
        return {
            "products": result,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total / limit) if total > 0 else 1
        }
        
    except Exception as e:
        logger.error(f"Error getting products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@ecommerce_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single grouped product with all variants"""
    try:
        # First try grouped products
        product = await db.shop_products_grouped.find_one(
            {"grouped_id": product_id},
            {"_id": 0}
        )
        
        if product:
            available_sizes = product.get("available_sizes", [])
            sizes_sorted = []
            for s in available_sizes:
                size_val = s.get("size") if s else None
                if size_val:
                    sizes_sorted.append(s)
            sizes_sorted.sort(key=lambda x: (
                0 if (x.get("size") or "").isdigit() else 1,
                int(x.get("size") or "0") if (x.get("size") or "").isdigit() else (x.get("size") or "")
            ))
            
            # Use custom image if available
            display_image = product.get("custom_image") or product.get("image")
            
            return {
                "id": product.get("grouped_id"),
                "name": product.get("base_model"),
                "full_name": product.get("name"),
                "price": product.get("price"),
                "max_price": product.get("max_price"),
                "stock": product.get("total_stock"),
                "image": display_image,
                "category": product.get("category"),
                "brand": product.get("brand"),
                "gender": product.get("gender"),
                "discount": product.get("discount", 0),
                "description": product.get("description"),
                "available_sizes": sizes_sorted,
                "variants": product.get("variants", [])
            }
        
        # Fallback to individual product
        product = await db.shop_products.find_one(
            {"product_id": product_id},
            {"_id": 0}
        )
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product["id"] = product.pop("product_id", None)
        return product
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ecommerce_router.get("/featured")
async def get_featured_products():
    """Get featured grouped products"""
    try:
        products = await db.shop_products_grouped.find(
            {"total_stock": {"$gt": 0}},
            {"_id": 0}
        ).limit(8).to_list(8)
        
        result = []
        for p in products:
            # Use custom image if available
            display_image = p.get("custom_image") or p.get("image")
            result.append({
                "id": p.get("grouped_id"),
                "name": p.get("base_model"),
                "price": p.get("price"),
                "image": display_image,
                "discount": p.get("discount", 0),
                "sizes_list": p.get("sizes_list", [])
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DELIVERY CALCULATION ====================

@ecommerce_router.post("/calculate-delivery")
async def calculate_delivery(data: DeliveryCalculation):
    """Calculate delivery cost based on distance"""
    if not gmaps:
        distance_km = haversine_distance(STORE_LAT, STORE_LNG, data.lat, data.lng)
    else:
        try:
            result = gmaps.distance_matrix(
                origins=[(STORE_LAT, STORE_LNG)],
                destinations=[(data.lat, data.lng)],
                mode="driving"
            )
            
            if result['rows'][0]['elements'][0]['status'] == 'OK':
                distance_meters = result['rows'][0]['elements'][0]['distance']['value']
                distance_km = distance_meters / 1000
            else:
                distance_km = haversine_distance(STORE_LAT, STORE_LNG, data.lat, data.lng)
        except Exception:
            distance_km = haversine_distance(STORE_LAT, STORE_LNG, data.lat, data.lng)
    
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
    R = 6371
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
    from server import notify_new_order
    
    subtotal = sum(item.price * item.quantity for item in data.items if item.price)
    delivery_cost = 0
    
    if data.delivery_type == 'delivery' and data.delivery_address:
        delivery_result = await calculate_delivery(DeliveryCalculation(
            lat=data.delivery_address.lat,
            lng=data.delivery_address.lng
        ))
        delivery_cost = delivery_result['delivery_cost']
    
    total = subtotal + delivery_cost
    
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
        # Build dynamic URLs from request origin
        base_url = str(request.base_url).rstrip('/')
        if 'localhost' not in base_url:
            base_url = os.environ.get('REACT_APP_BACKEND_URL', base_url)
        
        frontend_url = base_url.replace('/api', '').replace(':8001', ':3000')
        
        # Create webhook URL for Stripe
        webhook_url = f"{base_url}api/shop/webhook/stripe"
        
        # Initialize Stripe checkout with emergentintegrations
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Build items description for metadata
        items_desc = ", ".join([
            f"{item.name or 'Producto'}" + (f" ({item.size})" if item.size else "") + f" x{item.quantity}"
            for item in data.items
        ])[:500]  # Stripe metadata limit
        
        # Create checkout session with total amount in USD (Stripe requires)
        # Convert PYG to USD approximately (1 USD = ~7300 PYG)
        amount_usd = round(total / 7300, 2)
        
        checkout_request = CheckoutSessionRequest(
            amount=amount_usd,
            currency="usd",
            success_url=f"{frontend_url}/shop/order-success?order_id={order_id}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/shop/cart",
            metadata={
                "order_id": order_id,
                "customer_email": data.customer_email,
                "items": items_desc,
                "total_pyg": str(int(total))
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Update order with session ID
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"stripe_session_id": session.session_id}}
        )
        
        # Create payment transaction record
        await db.payment_transactions.insert_one({
            "transaction_id": f"TXN-{uuid.uuid4().hex[:8].upper()}",
            "order_id": order_id,
            "session_id": session.session_id,
            "amount_usd": amount_usd,
            "amount_pyg": total,
            "currency": "usd",
            "customer_email": data.customer_email,
            "payment_status": "pending",
            "metadata": checkout_request.metadata,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "checkout_url": session.url,
            "order_id": order_id,
            "session_id": session.session_id
        }
        
    except Exception as e:
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"payment_status": "failed", "error": str(e)}}
        )
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")

@ecommerce_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    from server import notify_new_order
    
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    
    try:
        # Initialize Stripe checkout
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(payload, sig_header)
        
        if webhook_response.event_type == "checkout.session.completed":
            session_id = webhook_response.session_id
            order_id = webhook_response.metadata.get("order_id") if webhook_response.metadata else None
            
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
                
                # Update payment transaction
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Send notifications
                order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
                if order:
                    await notify_new_order(order)
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@ecommerce_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get checkout session status (for polling from frontend)"""
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # If payment is successful, update order
        if status.payment_status == "paid":
            order_id = status.metadata.get("order_id") if status.metadata else None
            if order_id:
                # Check if already processed
                order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
                if order and order.get("payment_status") != "paid":
                    from server import notify_new_order
                    
                    await db.orders.update_one(
                        {"order_id": order_id},
                        {"$set": {
                            "payment_status": "paid",
                            "order_status": "confirmed",
                            "paid_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    
                    await db.payment_transactions.update_one(
                        {"session_id": session_id},
                        {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    
                    # Send notifications
                    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
                    if order:
                        await notify_new_order(order)
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "metadata": status.metadata
        }
    except Exception as e:
        logger.error(f"Checkout status error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@ecommerce_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order details"""
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


# ==================== ADMIN: ORDER MANAGEMENT ====================

class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, preparing, shipped, delivered, cancelled

class OrderFilters(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None

@ecommerce_router.get("/admin/orders")
async def get_admin_orders(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Get all orders with filters for admin"""
    query = {}
    
    if status:
        query["order_status"] = status
    if payment_status:
        query["payment_status"] = payment_status
    if date_from:
        query["created_at"] = {"$gte": date_from}
    if date_to:
        if "created_at" in query:
            query["created_at"]["$lte"] = date_to
        else:
            query["created_at"] = {"$lte": date_to}
    
    skip = (page - 1) * limit
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    return {
        "orders": orders,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1
    }

@ecommerce_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate):
    """Update order status"""
    valid_statuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"]
    
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "order_status": data.status,
            "status_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # If cancelled, also update payment status
    if data.status == "cancelled":
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"payment_status": "cancelled"}}
        )
    
    return {"message": "Order status updated", "order_id": order_id, "new_status": data.status}

@ecommerce_router.get("/admin/orders/{order_id}")
async def get_admin_order_detail(order_id: str):
    """Get detailed order info for admin"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

# ==================== ADMIN: SALES METRICS & REPORTS ====================

@ecommerce_router.get("/admin/metrics/summary")
async def get_sales_summary(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Get sales summary metrics"""
    query = {"payment_status": "paid"}
    
    if date_from or date_to:
        query["created_at"] = {}
        if date_from:
            query["created_at"]["$gte"] = date_from
        if date_to:
            query["created_at"]["$lte"] = date_to
    
    # Get all paid orders
    orders = await db.orders.find(query, {"_id": 0}).to_list(10000)
    
    # Calculate metrics
    total_revenue = sum(order.get("total", 0) for order in orders)
    total_orders = len(orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Count by status
    status_counts = {}
    all_orders = await db.orders.find({}, {"_id": 0, "order_status": 1}).to_list(10000)
    for order in all_orders:
        status = order.get("order_status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Count by payment status
    payment_counts = {}
    for order in all_orders:
        status = order.get("payment_status", "unknown")
        payment_counts[status] = payment_counts.get(status, 0) + 1
    
    # Delivery vs pickup
    delivery_counts = {"delivery": 0, "pickup": 0}
    for order in orders:
        dtype = order.get("delivery_type", "pickup")
        delivery_counts[dtype] = delivery_counts.get(dtype, 0) + 1
    
    return {
        "total_revenue": round(total_revenue),
        "total_orders": total_orders,
        "avg_order_value": round(avg_order_value),
        "orders_by_status": status_counts,
        "orders_by_payment": payment_counts,
        "delivery_breakdown": delivery_counts,
        "period": {
            "from": date_from,
            "to": date_to
        }
    }

@ecommerce_router.get("/admin/metrics/daily")
async def get_daily_metrics(days: int = 30):
    """Get daily sales for the last N days"""
    from datetime import timedelta
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    orders = await db.orders.find({
        "payment_status": "paid",
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0, "created_at": 1, "total": 1}).to_list(10000)
    
    # Group by date
    daily_data = {}
    for order in orders:
        date_str = order.get("created_at", "")[:10]  # Get YYYY-MM-DD
        if date_str:
            if date_str not in daily_data:
                daily_data[date_str] = {"revenue": 0, "orders": 0}
            daily_data[date_str]["revenue"] += order.get("total", 0)
            daily_data[date_str]["orders"] += 1
    
    # Fill missing dates with zeros
    result = []
    current = start_date
    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        data = daily_data.get(date_str, {"revenue": 0, "orders": 0})
        result.append({
            "date": date_str,
            "revenue": data["revenue"],
            "orders": data["orders"]
        })
        current += timedelta(days=1)
    
    return {"daily_metrics": result, "days": days}

@ecommerce_router.get("/admin/metrics/top-products")
async def get_top_products(limit: int = 10):
    """Get top selling products"""
    orders = await db.orders.find(
        {"payment_status": "paid"},
        {"_id": 0, "items": 1}
    ).to_list(10000)
    
    product_sales = {}
    for order in orders:
        for item in order.get("items", []):
            name = item.get("name", "Unknown")
            size = item.get("size", "")
            key = f"{name} ({size})" if size else name
            
            if key not in product_sales:
                product_sales[key] = {"quantity": 0, "revenue": 0, "name": name, "size": size}
            
            product_sales[key]["quantity"] += item.get("quantity", 1)
            product_sales[key]["revenue"] += item.get("price", 0) * item.get("quantity", 1)
    
    # Sort by quantity
    sorted_products = sorted(product_sales.values(), key=lambda x: x["quantity"], reverse=True)
    
    return {"top_products": sorted_products[:limit]}

@ecommerce_router.get("/admin/reports/export")
async def export_orders_report(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None
):
    """Export orders for reporting (CSV-ready format)"""
    query = {}
    
    if status:
        query["order_status"] = status
    if date_from or date_to:
        query["created_at"] = {}
        if date_from:
            query["created_at"]["$gte"] = date_from
        if date_to:
            query["created_at"]["$lte"] = date_to
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    # Format for export
    export_data = []
    for order in orders:
        items_str = "; ".join([
            f"{item.get('name', '')} x{item.get('quantity', 1)} ({item.get('size', '')})"
            for item in order.get("items", [])
        ])
        
        export_data.append({
            "order_id": order.get("order_id"),
            "created_at": order.get("created_at"),
            "customer_name": order.get("customer_name"),
            "customer_email": order.get("customer_email"),
            "customer_phone": order.get("customer_phone"),
            "items": items_str,
            "subtotal": order.get("subtotal", 0),
            "delivery_cost": order.get("delivery_cost", 0),
            "total": order.get("total", 0),
            "delivery_type": order.get("delivery_type"),
            "order_status": order.get("order_status"),
            "payment_status": order.get("payment_status"),
            "payment_method": order.get("payment_method")
        })
    
    return {
        "report": export_data,
        "total_records": len(export_data),
        "filters_applied": {
            "date_from": date_from,
            "date_to": date_to,
            "status": status
        }
    }


# ==================== ADMIN: PRODUCT IMAGE MANAGEMENT ====================

# Directory for uploaded images
UPLOAD_DIR = "/app/backend/uploads/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def normalize_text_for_matching(text: str) -> str:
    """Normalize text for flexible matching
    - Remove accents/diacritics
    - Lowercase
    - Remove extra spaces
    - Remove special characters
    """
    if not text:
        return ""
    # Remove file extension if present
    text = re.sub(r'\.[^.]+$', '', text)
    # Normalize unicode (remove accents)
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('ASCII')
    # Lowercase
    text = text.lower()
    # Replace special chars with spaces
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    # Multiple spaces to one
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def find_matching_product(filename: str, products: list) -> Optional[dict]:
    """Find a product that matches the filename using flexible matching"""
    normalized_filename = normalize_text_for_matching(filename)
    
    best_match = None
    best_score = 0
    
    for product in products:
        base_model = product.get('base_model', '')
        normalized_product = normalize_text_for_matching(base_model)
        
        # Exact match after normalization
        if normalized_filename == normalized_product:
            return product
        
        # Check if one contains the other
        if normalized_filename in normalized_product or normalized_product in normalized_filename:
            # Score based on length similarity
            score = len(normalized_product) / max(len(normalized_filename), 1)
            if score > best_score:
                best_score = score
                best_match = product
    
    # Return match if score is good enough (>0.7)
    if best_score > 0.7:
        return best_match
    
    return None

async def process_and_save_image(file_content: bytes, filename: str, product_id: str) -> str:
    """Process image (resize if needed) and save to disk"""
    try:
        # Open image with PIL
        img = PILImage.open(BytesIO(file_content))
        
        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Check file size - if > 5MB, reduce quality
        max_size = 5 * 1024 * 1024  # 5MB
        output = BytesIO()
        
        # Start with high quality
        quality = 90
        
        while True:
            output.seek(0)
            output.truncate()
            
            # Resize if image is very large
            max_dimension = 1500
            if max(img.size) > max_dimension:
                ratio = max_dimension / max(img.size)
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, PILImage.Resampling.LANCZOS)
            
            img.save(output, format='JPEG', quality=quality, optimize=True)
            
            if output.tell() <= max_size or quality <= 30:
                break
            
            quality -= 10
        
        # Save to disk
        safe_filename = re.sub(r'[^a-zA-Z0-9_-]', '_', product_id) + '.jpg'
        filepath = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(filepath, 'wb') as f:
            output.seek(0)
            f.write(output.read())
        
        # Return relative URL
        return f"/api/shop/images/{safe_filename}"
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

@ecommerce_router.get("/admin/products-images")
async def get_products_for_images(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    has_image: Optional[bool] = None
):
    """Get grouped products for image management"""
    query = {}
    
    if search:
        query["base_model"] = {"$regex": search, "$options": "i"}
    
    if has_image is not None:
        if has_image:
            query["custom_image"] = {"$exists": True, "$ne": None}
        else:
            query["$or"] = [
                {"custom_image": {"$exists": False}},
                {"custom_image": None}
            ]
    
    skip = (page - 1) * limit
    
    # Get products
    products = await db.shop_products_grouped.find(query, {"_id": 0}).sort("base_model", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.shop_products_grouped.count_documents(query)
    
    # Get stats
    total_products = await db.shop_products_grouped.count_documents({})
    with_image = await db.shop_products_grouped.count_documents({"custom_image": {"$exists": True, "$ne": None}})
    
    return {
        "products": products,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
        "stats": {
            "total": total_products,
            "with_image": with_image,
            "without_image": total_products - with_image
        }
    }

@ecommerce_router.post("/admin/upload-product-image")
async def upload_product_image(
    product_id: str = None,
    file: UploadFile = File(...)
):
    """Upload a single product image"""
    if not product_id:
        raise HTTPException(status_code=400, detail="product_id is required")
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {allowed_types}")
    
    # Read file content
    content = await file.read()
    
    # Check size (5MB max before processing)
    if len(content) > 10 * 1024 * 1024:  # 10MB max upload, will be reduced
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB")
    
    # Process and save image
    image_url = await process_and_save_image(content, file.filename, product_id)
    
    # Update product in database
    await db.shop_products_grouped.update_one(
        {"grouped_id": product_id},
        {"$set": {"custom_image": image_url, "image_updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Image uploaded successfully", "image_url": image_url}

@ecommerce_router.post("/admin/bulk-upload-images")
async def bulk_upload_images(files: List[UploadFile] = File(...)):
    """Bulk upload images with automatic product matching"""
    # Get all products for matching
    all_products = await db.shop_products_grouped.find({}, {"_id": 0, "grouped_id": 1, "base_model": 1}).to_list(5000)
    
    matched = []
    not_matched = []
    errors = []
    
    for file in files:
        try:
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                errors.append(f"{file.filename}: Invalid file type")
                continue
            
            # Read content
            content = await file.read()
            
            if len(content) > 10 * 1024 * 1024:
                errors.append(f"{file.filename}: File too large")
                continue
            
            # Find matching product
            product = find_matching_product(file.filename, all_products)
            
            if product:
                # Process and save image
                image_url = await process_and_save_image(content, file.filename, product['grouped_id'])
                
                # Update database
                await db.shop_products_grouped.update_one(
                    {"grouped_id": product['grouped_id']},
                    {"$set": {"custom_image": image_url, "image_updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                matched.append({
                    "filename": file.filename,
                    "product": product['base_model'],
                    "image_url": image_url
                })
            else:
                not_matched.append(file.filename)
                
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {str(e)}")
            errors.append(f"{file.filename}: {str(e)}")
    
    return {
        "matched": len(matched),
        "not_matched": len(not_matched),
        "errors": len(errors),
        "matched_details": matched,
        "not_matched_details": not_matched,
        "error_details": errors
    }

@ecommerce_router.delete("/admin/delete-product-image/{product_id}")
async def delete_product_image(product_id: str):
    """Delete custom image for a product"""
    # Get product to find image path
    product = await db.shop_products_grouped.find_one({"grouped_id": product_id}, {"_id": 0, "custom_image": 1})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.get('custom_image'):
        # Try to delete file
        try:
            filename = product['custom_image'].split('/')[-1]
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
    
    # Remove from database
    await db.shop_products_grouped.update_one(
        {"grouped_id": product_id},
        {"$unset": {"custom_image": "", "image_updated_at": ""}}
    )
    
    return {"message": "Image deleted successfully"}

@ecommerce_router.get("/images/{filename}")
async def serve_product_image(filename: str):
    """Serve uploaded product images"""
    from fastapi.responses import FileResponse
    
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(filepath, media_type="image/jpeg")

