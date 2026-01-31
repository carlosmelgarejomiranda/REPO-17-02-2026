# E-commerce routes for Avenue Online
# Uses MongoDB for fast local queries, syncs from ERP periodically

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, UploadFile, File, Form, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import httpx
import os
import googlemaps
from datetime import datetime, timezone, timedelta
import uuid
import asyncio
import math
import re
import logging
import unicodedata
from io import BytesIO
from PIL import Image as PILImage
from dotenv import load_dotenv

# Import security functions
from security import check_rate_limit, get_rate_limit_key, RateLimitExceeded, get_client_ip

# Import GridFS storage service (legacy - keeping for backwards compatibility)
from services.gridfs_storage import (
    upload_image as gridfs_upload,
    get_image as gridfs_get,
    delete_image as gridfs_delete
)

# Import Cloudinary storage service (new)
from services.cloudinary_storage import (
    upload_image as cloudinary_upload,
    delete_asset as cloudinary_delete,
    CLOUDINARY_CONFIGURED
)

# Import migration helper
from services.image_migration_helper import (
    CLOUDINARY_ENABLED,
    get_product_image_url,
    get_product_all_images,
    is_cloudinary_url
)

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize router
ecommerce_router = APIRouter(prefix="/api/shop")

# Configuration
ENCOM_API_URL = os.environ.get('ENCOM_API_URL', 'https://api.cloud.encom.com.py')
ENCOM_API_TOKEN = os.environ.get('ENCOM_API_TOKEN', '')
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')
# AVENUE store location - Paseo Los Árboles, Asunción
STORE_LAT = float(os.environ.get('STORE_LAT', '-25.2921064'))
STORE_LNG = float(os.environ.get('STORE_LNG', '-57.5738759'))
DELIVERY_PRICE_PER_KM = float(os.environ.get('DELIVERY_PRICE_PER_KM', '2500'))
DELIVERY_MIN_PRICE = float(os.environ.get('DELIVERY_MIN_PRICE', '20000'))
SYNC_INTERVAL_SECONDS = 300  # 5 minutes
WHATSAPP_COMMERCIAL = os.environ.get('NOTIFICATION_WHATSAPP_ECOMMERCE', '+595973666000')

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
    """Create grouped products collection from individual products
    Preserves custom images when re-syncing
    """
    logger.info("Creating grouped products...")
    
    # First, get existing custom images to preserve them
    existing_custom_images = {}
    existing_products = await db.shop_products_grouped.find(
        {"custom_image": {"$exists": True, "$ne": None}},
        {"_id": 0, "base_model": 1, "custom_image": 1, "image_updated_at": 1}
    ).to_list(5000)
    
    for p in existing_products:
        if p.get("base_model"):
            existing_custom_images[p["base_model"]] = {
                "custom_image": p.get("custom_image"),
                "image_updated_at": p.get("image_updated_at")
            }
    
    logger.info(f"Preserving {len(existing_custom_images)} custom images")
    
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
        # Add a unique ID to each grouped product and restore custom images
        for i, g in enumerate(grouped):
            g["grouped_id"] = f"grp_{i}"
            g.pop("_id", None)
            
            # Restore custom image if it exists
            base_model = g.get("base_model")
            if base_model and base_model in existing_custom_images:
                g["custom_image"] = existing_custom_images[base_model]["custom_image"]
                g["image_updated_at"] = existing_custom_images[base_model].get("image_updated_at")
        
        await db.shop_products_grouped.insert_many(grouped)
        logger.info(f"Created {len(grouped)} grouped products, restored {len([g for g in grouped if g.get('custom_image')])} custom images")
    
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
    payment_method: str = "bancard"
    notes: Optional[str] = None

class DeliveryCalculation(BaseModel):
    lat: float
    lng: float

class InventoryValidationItem(BaseModel):
    product_id: str
    sku: Optional[str] = None
    quantity: int
    name: Optional[str] = None
    size: Optional[str] = None

class InventoryValidationRequest(BaseModel):
    items: List[InventoryValidationItem]

# ==================== INVENTORY VALIDATION ====================

@ecommerce_router.post("/validate-inventory")
async def validate_inventory_before_checkout(data: InventoryValidationRequest):
    """
    Validate inventory in real-time before checkout.
    Checks local DB for latest stock, then validates each item.
    Returns which items are available and which are out of stock.
    
    Supports both:
    - Individual products (shop_products) with SKU
    - Grouped products (shop_products_grouped) with grouped_id (e.g., grp_96)
    """
    logger.info(f"Validating inventory for {len(data.items)} items before checkout...")
    
    try:
        all_available = True
        out_of_stock_items = []
        available_items = []
        
        for item in data.items:
            product = None
            stock = 0
            is_grouped = False
            
            # Check if it's a grouped product ID (starts with 'grp_')
            if item.product_id and item.product_id.startswith('grp_'):
                is_grouped = True
                # Search in grouped products collection
                product = await db.shop_products_grouped.find_one(
                    {"grouped_id": item.product_id},
                    {"_id": 0, "grouped_id": 1, "base_model": 1, "total_stock": 1, "price": 1}
                )
                if product:
                    stock = product.get('total_stock', 0)
                    if isinstance(stock, str):
                        try:
                            stock = int(float(stock))
                        except (ValueError, TypeError):
                            stock = 0
            else:
                # Search by SKU if available (individual product)
                if item.sku:
                    product = await db.shop_products.find_one(
                        {"sku": item.sku},
                        {"_id": 0, "sku": 1, "name": 1, "stock": 1, "existencia": 1, "price": 1}
                    )
                
                # If not found by SKU, try by product_id in individual products
                if not product and item.product_id:
                    product = await db.shop_products.find_one(
                        {"$or": [
                            {"product_id": item.product_id},
                            {"sku": item.product_id}
                        ]},
                        {"_id": 0, "sku": 1, "name": 1, "stock": 1, "existencia": 1, "price": 1}
                    )
                
                # Get stock value for individual products
                if product:
                    stock = product.get('stock', product.get('existencia', 0))
                    if isinstance(stock, str):
                        try:
                            stock = int(float(stock))
                        except (ValueError, TypeError):
                            stock = 0
            
            # Check if enough stock
            if stock < item.quantity:
                all_available = False
                product_name = item.name
                if product and not product_name:
                    product_name = product.get('base_model') if is_grouped else product.get('name', 'Producto')
                
                out_of_stock_items.append({
                    "product_id": item.product_id,
                    "sku": item.sku,
                    "name": product_name or 'Producto',
                    "size": item.size,
                    "requested_quantity": item.quantity,
                    "available_stock": max(0, stock),
                    "reason": "out_of_stock" if stock == 0 else "insufficient_stock"
                })
                logger.warning(f"Insufficient stock for {item.sku or item.product_id}: requested {item.quantity}, available {stock}")
            else:
                available_items.append({
                    "product_id": item.product_id,
                    "sku": item.sku,
                    "name": item.name,
                    "size": item.size,
                    "quantity": item.quantity,
                    "available_stock": stock
                })
        
        return {
            "valid": all_available,
            "available_items": available_items,
            "out_of_stock_items": out_of_stock_items,
            "message": "Todos los productos están disponibles" if all_available else "Algunos productos no tienen stock suficiente"
        }
            
    except Exception as e:
        logger.error(f"Error validating inventory: {str(e)}")
        return {
            "valid": True,
            "available_items": [{"product_id": item.product_id, "sku": item.sku, "name": item.name, "quantity": item.quantity} for item in data.items],
            "out_of_stock_items": [],
            "message": "No se pudo validar el inventario, pero se permitirá continuar",
            "warning": "inventory_validation_failed"
        }

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
    brand: Optional[str] = None,
    gender: Optional[str] = None,
    size: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    """Get GROUPED products from local MongoDB - shows unique models with sizes"""
    try:
        # Get admin settings for show_only_products_with_images
        settings = await db.admin_settings.find_one({"_id": "global"})
        show_only_with_images = settings.get("show_only_products_with_images", False) if settings else False
        
        # Build query for grouped products
        query = {"total_stock": {"$gt": 0}}
        
        # If setting is enabled, only show products with images
        if show_only_with_images:
            query["$and"] = query.get("$and", [])
            query["$and"].append({
                "$or": [
                    {"custom_image": {"$exists": True, "$type": "string", "$ne": ""}},
                    {"images.0": {"$exists": True, "$type": "string", "$ne": ""}}
                ]
            })
        
        if search:
            # Search in multiple fields: base_model, category, brand, description
            search_regex = {"$regex": search, "$options": "i"}
            search_conditions = [
                {"base_model": search_regex},
                {"category": search_regex},
                {"brand": search_regex},
                {"description": search_regex}
            ]
            # Combine with existing $and or create new
            if "$and" in query:
                query["$and"].append({"$or": search_conditions})
            else:
                query["$or"] = search_conditions
        
        # Support both 'category' and 'brand' parameters - search in both fields
        brand_filter = brand or category
        if brand_filter:
            # Brand unification mappings - maps display names to actual ERP category patterns
            BRAND_UNIFICATION = {
                # AVENUE OUTLET - all outlet brands
                'AVENUE OUTLET': [
                    'AVENUE', 'AVENUE AK', 'BDA FACTORY', 'FRAME', 'GOOD AMERICAN',
                    'JAZMIN CHEBAR', 'JUICY', 'KOSIUKO', 'LACOSTE', 'MARIA CHER',
                    'MERSEA', 'QUIKSILVER', 'RICARDO ALMEIDA', 'ROTUNDA', 'RUSTY',
                    'TOP DESIGN', 'VOYAGEUR', 'VITAMINA', 'HOWICK', 'EST1985'
                ],
                # SUN68 - all SUN variants
                'SUN68': ['SUN68', 'SUN69', 'SUN70', 'SUN71', 'SUN72'],
                # BODY SCULPT - variations
                'BODY SCULPT': ['BODY SCULPT', 'BODYCULPT'],
                # UNDISTURBED - variations
                'UNDISTURBED': ['UNDISTURB3D', 'UNDISTURBED'],
                # MARIA E MAKE UP - variations
                'MARIA E MAKE UP': ['MARIA E MAKEUP', 'MARIA E MAKE UP'],
                # AGUARA
                'AGUARA': ['AGUARA FITWEAR', 'AGUARA'],
                # DAVID SANDOVAL
                'DAVID SANDOVAL': ['DS'],
                # KARLA
                'KARLA': ['KARLA RUIZ', 'KARLA'],
            }
            
            # Check if this brand has a unification mapping
            brand_upper = brand_filter.upper()
            brand_or_conditions = []
            if brand_upper in BRAND_UNIFICATION:
                # Build $or query for all variants
                variants = BRAND_UNIFICATION[brand_upper]
                for variant in variants:
                    brand_or_conditions.append({"category": {"$regex": f"^{variant}$", "$options": "i"}})
                    brand_or_conditions.append({"brand": {"$regex": f"^{variant}$", "$options": "i"}})
            else:
                # Standard search in both category and brand fields
                brand_or_conditions = [
                    {"category": {"$regex": brand_filter, "$options": "i"}},
                    {"brand": {"$regex": brand_filter, "$options": "i"}}
                ]
            
            # Add brand filter to $and conditions to combine with search
            if "$and" not in query:
                query["$and"] = []
            query["$and"].append({"$or": brand_or_conditions})
        
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
            
            # Use Cloudinary URL if available, then custom_image, then ERP image
            display_image = p.get("cloudinary_url") or p.get("custom_image") or p.get("image")
            # Get all images (up to 3) - prefer cloudinary_images
            all_images = p.get("cloudinary_images") or p.get("images", [])
            if not all_images or not isinstance(all_images, list):
                all_images = [display_image] if display_image else []
            # Filter None values
            all_images = [img for img in all_images if img]
            
            result.append({
                "id": p.get("grouped_id"),
                "name": p.get("custom_name") or p.get("base_model"),  # Use custom name if available
                "full_name": p.get("name"),
                "price": p.get("custom_price") or p.get("price"),
                "max_price": p.get("max_price"),
                "stock": p.get("total_stock"),
                "image": display_image,
                "images": all_images,  # All product images (up to 3)
                "category": p.get("category"),
                "brand": p.get("brand"),
                "gender": p.get("gender"),
                "discount": p.get("discount", 0),
                "description": p.get("custom_description") or p.get("description"),
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
            
            # Use Cloudinary URL if available, then custom_image, then ERP image
            display_image = product.get("cloudinary_url") or product.get("custom_image") or product.get("image")
            # Get all images (up to 3) - prefer cloudinary_images
            all_images = product.get("cloudinary_images") or product.get("images", [])
            if not all_images or not isinstance(all_images, list):
                all_images = [display_image] if display_image else []
            all_images = [img for img in all_images if img]
            
            return {
                "id": product.get("grouped_id"),
                "name": product.get("custom_name") or product.get("base_model"),
                "full_name": product.get("name"),
                "price": product.get("custom_price") or product.get("price"),
                "max_price": product.get("max_price"),
                "stock": product.get("total_stock"),
                "image": display_image,
                "images": all_images,  # All product images (up to 3)
                "category": product.get("category"),
                "brand": product.get("brand"),
                "gender": product.get("gender"),
                "discount": product.get("discount", 0),
                "description": product.get("custom_description") or product.get("description"),
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
            # Use Cloudinary URL if available, then custom_image, then ERP image
            display_image = p.get("cloudinary_url") or p.get("custom_image") or p.get("image")
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

# ==================== DIAGNOSTIC ENDPOINT ====================

@ecommerce_router.get("/debug/products-status")
async def debug_products_status():
    """Diagnostic endpoint to check product and image status"""
    try:
        # Get admin settings
        settings = await db.admin_settings.find_one({"_id": "global"})
        show_only_with_images = settings.get("show_only_products_with_images", False) if settings else False
        
        # Count products
        total_grouped = await db.shop_products_grouped.count_documents({})
        total_with_stock = await db.shop_products_grouped.count_documents({"total_stock": {"$gt": 0}})
        
        # Count products with images (correct query - field must exist AND be a non-empty string)
        with_custom_image = await db.shop_products_grouped.count_documents({
            "custom_image": {"$exists": True, "$type": "string", "$ne": ""}
        })
        with_images_array = await db.shop_products_grouped.count_documents({
            "images.0": {"$exists": True, "$type": "string", "$ne": ""}
        })
        
        # Sample products with images
        sample_with_images = await db.shop_products_grouped.find(
            {"$or": [
                {"custom_image": {"$exists": True, "$type": "string", "$ne": ""}},
                {"images.0": {"$exists": True, "$type": "string", "$ne": ""}}
            ]},
            {"_id": 0, "grouped_id": 1, "base_model": 1, "custom_image": 1, "images": 1, "total_stock": 1}
        ).limit(10).to_list(10)
        
        return {
            "admin_settings": {
                "show_only_products_with_images": show_only_with_images,
                "settings_exists": settings is not None
            },
            "counts": {
                "total_grouped_products": total_grouped,
                "with_stock_gt_0": total_with_stock,
                "with_custom_image": with_custom_image,
                "with_images_array": with_images_array
            },
            "sample_products_with_images": sample_with_images
        }
    except Exception as e:
        return {"error": str(e)}

@ecommerce_router.get("/debug/storage-status")
async def debug_storage_status():
    """Check storage/filesystem status for image uploads"""
    import shutil
    
    base_upload_dir = "/app/backend/uploads"
    products_dir = os.path.join(base_upload_dir, "products")
    temp_dir = os.path.join(base_upload_dir, "temp_batch")
    
    results = {
        "base_dir": {
            "path": base_upload_dir,
            "exists": os.path.exists(base_upload_dir),
            "is_writable": False,
            "error": None
        },
        "products_dir": {
            "path": products_dir,
            "exists": os.path.exists(products_dir),
            "is_writable": False,
            "error": None
        },
        "temp_dir": {
            "path": temp_dir,
            "exists": os.path.exists(temp_dir),
            "is_writable": False,
            "error": None
        }
    }
    
    # Check if directories are writable
    for key, info in results.items():
        if info["exists"]:
            try:
                test_file = os.path.join(info["path"], ".write_test")
                with open(test_file, "w") as f:
                    f.write("test")
                os.remove(test_file)
                info["is_writable"] = True
            except Exception as e:
                info["error"] = str(e)
        else:
            # Try to create
            try:
                os.makedirs(info["path"], exist_ok=True)
                info["exists"] = True
                # Test write
                test_file = os.path.join(info["path"], ".write_test")
                with open(test_file, "w") as f:
                    f.write("test")
                os.remove(test_file)
                info["is_writable"] = True
            except Exception as e:
                info["error"] = str(e)
    
    # Get disk space
    try:
        total, used, free = shutil.disk_usage(base_upload_dir if os.path.exists(base_upload_dir) else "/app")
        results["disk_space"] = {
            "total_gb": round(total / (1024**3), 2),
            "used_gb": round(used / (1024**3), 2),
            "free_gb": round(free / (1024**3), 2)
        }
    except Exception as e:
        results["disk_space"] = {"error": str(e)}
    
    return results

# ==================== DELIVERY CALCULATION ====================

# Paraguay bounding box coordinates
PARAGUAY_BOUNDS = {
    "min_lat": -27.6,  # Southern border
    "max_lat": -19.2,  # Northern border
    "min_lng": -62.7,  # Western border
    "max_lng": -54.2   # Eastern border
}

def is_within_paraguay(lat: float, lng: float) -> bool:
    """Check if coordinates are within Paraguay's borders"""
    return (PARAGUAY_BOUNDS["min_lat"] <= lat <= PARAGUAY_BOUNDS["max_lat"] and
            PARAGUAY_BOUNDS["min_lng"] <= lng <= PARAGUAY_BOUNDS["max_lng"])

@ecommerce_router.post("/calculate-delivery")
async def calculate_delivery(data: DeliveryCalculation):
    """Calculate delivery cost based on distance - Only within Paraguay"""
    
    # Validate destination is within Paraguay
    if not is_within_paraguay(data.lat, data.lng):
        raise HTTPException(
            status_code=400, 
            detail="Lo sentimos, solo realizamos entregas dentro de Paraguay."
        )
    
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
    
    # Round distance to nearest whole km (standard rounding)
    # e.g., 10.2 km -> 10 km, 10.5 km -> 11 km (Python rounds 10.5 to 10, use manual rounding)
    rounded_distance_km = round(distance_km)
    
    # Calculate delivery cost: 2,500 Gs per km, always in multiples of 2,500
    delivery_cost = rounded_distance_km * DELIVERY_PRICE_PER_KM
    
    # Apply minimum delivery cost of 20,000 Gs
    delivery_cost = max(delivery_cost, DELIVERY_MIN_PRICE)
    
    # Apply maximum delivery cost of 50,000 Gs
    delivery_cost = min(delivery_cost, 50000)
    
    return {
        "distance_km": round(distance_km, 2),
        "rounded_distance_km": rounded_distance_km,
        "delivery_cost": int(delivery_cost),
        "price_per_km": int(DELIVERY_PRICE_PER_KM),
        "min_price": int(DELIVERY_MIN_PRICE),
        "max_price": 50000
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

async def get_admin_settings_for_checkout():
    """Get admin settings for checkout process"""
    settings = await db.admin_settings.find_one({"_id": "global"})
    return {
        "payment_gateway_enabled": settings.get("payment_gateway_enabled", False) if settings else False,
        "whatsapp_commercial": settings.get("whatsapp_commercial", WHATSAPP_COMMERCIAL) if settings else WHATSAPP_COMMERCIAL
    }

@ecommerce_router.post("/checkout")
async def create_checkout(data: CheckoutData, request: Request):
    """Create order - handles both payment gateway and request mode"""
    from server import notify_new_order, send_whatsapp_notification
    
    # Rate limiting - 5 checkouts per minute per IP
    rate_key = get_rate_limit_key(request, "checkout")
    is_allowed, _ = check_rate_limit(rate_key, max_requests=5, window_seconds=60)
    if not is_allowed:
        raise RateLimitExceeded(retry_after=60)
    
    # Get admin settings to check if payment gateway is enabled
    settings = await get_admin_settings_for_checkout()
    payment_enabled = settings.get("payment_gateway_enabled", False)
    whatsapp_commercial = settings.get("whatsapp_commercial", WHATSAPP_COMMERCIAL)
    
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
    
    # Determine initial status based on payment gateway setting
    # If gateway disabled: status = "solicitud" (request)
    # If gateway enabled: status = "pending" (will be "pagado" after payment)
    initial_status = "solicitud" if not payment_enabled else "pending"
    
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
        "payment_method": data.payment_method,
        "payment_status": "pending",
        "order_status": initial_status,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Build items list for notification
    items_text = "\n".join([
        f"• {item.name or 'Producto'}" + 
        (f" - Talle: {item.size}" if item.size else "") + 
        f" x{item.quantity} - {(item.price or 0):,.0f} Gs" 
        for item in data.items
    ])
    
    # Build delivery info
    delivery_info = ""
    location_link = ""
    if data.delivery_type == 'delivery' and data.delivery_address:
        addr = data.delivery_address
        delivery_info = f"""
📍 *Dirección de entrega:*
{addr.address}
{addr.reference or ''}
🚚 *Costo de envío:* {delivery_cost:,.0f} Gs"""
        
        # Create Google Maps link
        location_link = f"https://maps.google.com/?q={addr.lat},{addr.lng}"
    else:
        delivery_info = "🏪 *Retiro en tienda*"
    
    # Send notifications
    await notify_new_order(order_doc)
    
    # Send WhatsApp to admin
    whatsapp_message = f"""🛒 *NUEVA SOLICITUD DE COMPRA*

📦 *Pedido:* {order_id}
👤 *Cliente:* {data.customer_name}
📧 *Email:* {data.customer_email}
📱 *Teléfono:* {data.customer_phone}

🛍️ *Productos:*
{items_text}

{delivery_info}

💰 *Subtotal:* {subtotal:,.0f} Gs
💰 *TOTAL:* {total:,.0f} Gs

📝 *Notas:* {data.notes or 'Sin notas'}

{location_link}"""

    await send_whatsapp_notification(whatsapp_commercial, whatsapp_message)
    
    # Import email service and send order confirmation email
    try:
        from email_service import send_order_confirmation
        await send_order_confirmation(db, order_doc)
    except Exception as e:
        logger.error(f"Failed to send order confirmation email: {e}")
    
    # Send WhatsApp notification to admin
    try:
        from whatsapp_service import notify_new_order
        await notify_new_order(order_doc)
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification: {e}")
    
    # Return response based on payment gateway setting
    if not payment_enabled:
        # CASE 1: Payment gateway disabled - create order as "solicitud"
        order_doc.pop("_id", None)
        
        return {
            "success": True,
            "order_id": order_id,
            "status": "solicitud",
            "message": "Tu solicitud de compra fue enviada. Te contactaremos por WhatsApp para confirmar la recepción.",
            "total": total
        }
    else:
        # CASE 2: Payment gateway enabled - redirect to Bancard (placeholder for now)
        # TODO: Integrate Bancard when credentials are available
        order_doc.pop("_id", None)
        
        return {
            "success": True,
            "order_id": order_id,
            "status": "pending",
            "message": "Redirigiendo a pasarela de pago...",
            "total": total,
            "payment_url": None,  # Will be Bancard URL when integrated
            "payment_gateway": "bancard"
        }


# ==================== COUPON SYSTEM ====================

class CouponCreate(BaseModel):
    code: str
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float
    min_purchase: Optional[float] = None
    max_uses: Optional[int] = None
    expires_at: Optional[str] = None
    is_active: bool = True
    description: Optional[str] = None

class CouponApply(BaseModel):
    code: str
    subtotal: float

@ecommerce_router.get("/coupons")
async def get_all_coupons():
    """Get all coupons (admin)"""
    coupons = await db.shop_coupons.find({}, {"_id": 0}).to_list(1000)
    return coupons

@ecommerce_router.post("/coupons")
async def create_coupon(coupon: CouponCreate):
    """Create a new coupon (admin)"""
    # Check if code already exists
    existing = await db.shop_coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un cupón con ese código")
    
    coupon_data = {
        "id": str(uuid.uuid4()),
        "code": coupon.code.upper().strip(),
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_purchase": coupon.min_purchase,
        "max_uses": coupon.max_uses,
        "current_uses": 0,
        "expires_at": coupon.expires_at,
        "is_active": coupon.is_active,
        "description": coupon.description,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.shop_coupons.insert_one(coupon_data)
    return {"success": True, "coupon": {k: v for k, v in coupon_data.items() if k != "_id"}}

@ecommerce_router.put("/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon: CouponCreate):
    """Update an existing coupon (admin)"""
    existing = await db.shop_coupons.find_one({"id": coupon_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    
    # Check if new code conflicts with another coupon
    if coupon.code.upper() != existing.get("code"):
        conflict = await db.shop_coupons.find_one({"code": coupon.code.upper(), "id": {"$ne": coupon_id}})
        if conflict:
            raise HTTPException(status_code=400, detail="Ya existe otro cupón con ese código")
    
    update_data = {
        "code": coupon.code.upper().strip(),
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_purchase": coupon.min_purchase,
        "max_uses": coupon.max_uses,
        "expires_at": coupon.expires_at,
        "is_active": coupon.is_active,
        "description": coupon.description,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.shop_coupons.update_one({"id": coupon_id}, {"$set": update_data})
    return {"success": True, "message": "Cupón actualizado"}

@ecommerce_router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str):
    """Delete a coupon (admin)"""
    result = await db.shop_coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    return {"success": True, "message": "Cupón eliminado"}

@ecommerce_router.post("/apply-coupon")
async def apply_coupon(data: CouponApply, request: Request):
    """Validate and apply a coupon code"""
    # Rate limiting - 10 coupon attempts per minute per IP
    rate_key = get_rate_limit_key(request, "coupon")
    is_allowed, _ = check_rate_limit(rate_key, max_requests=10, window_seconds=60)
    if not is_allowed:
        raise RateLimitExceeded(retry_after=60)
    
    code = data.code.upper().strip()
    subtotal = data.subtotal
    
    coupon = await db.shop_coupons.find_one({"code": code}, {"_id": 0})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón no válido")
    
    if not coupon.get("is_active", True):
        raise HTTPException(status_code=400, detail="Este cupón ya no está activo")
    
    # Check expiration
    if coupon.get("expires_at"):
        expires = datetime.fromisoformat(coupon["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Este cupón ha expirado")
    
    # Check max uses
    if coupon.get("max_uses") and coupon.get("current_uses", 0) >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="Este cupón ha alcanzado el límite de usos")
    
    # Check minimum purchase
    if coupon.get("min_purchase") and subtotal < coupon["min_purchase"]:
        min_purchase = coupon["min_purchase"]
        raise HTTPException(
            status_code=400, 
            detail=f"El pedido mínimo para este cupón es de {int(min_purchase):,} Gs".replace(",", ".")
        )
    
    # Calculate discount
    if coupon["discount_type"] == "percentage":
        discount_amount = subtotal * (coupon["discount_value"] / 100)
    else:
        discount_amount = coupon["discount_value"]
    
    # Ensure discount doesn't exceed subtotal
    discount_amount = min(discount_amount, subtotal)
    
    return {
        "valid": True,
        "coupon": {
            "code": coupon["code"],
            "discount_type": coupon["discount_type"],
            "discount_value": coupon["discount_value"],
            "description": coupon.get("description")
        },
        "discount_amount": discount_amount,
        "new_subtotal": subtotal - discount_amount
    }

@ecommerce_router.post("/use-coupon/{code}")
async def increment_coupon_use(code: str):
    """Increment coupon usage count (called after successful order)"""
    code = code.upper().strip()
    await db.shop_coupons.update_one(
        {"code": code},
        {"$inc": {"current_uses": 1}}
    )
    return {"success": True}

@ecommerce_router.post("/checkout/confirm-payment/{order_id}")
async def confirm_order_payment(order_id: str, request: Request):
    """Confirm payment for an order (called after successful Bancard payment)"""
    from server import send_whatsapp_notification
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get admin settings
    settings = await get_admin_settings_for_checkout()
    whatsapp_commercial = settings.get("whatsapp_commercial", WHATSAPP_COMMERCIAL)
    
    # Update order status to paid
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "payment_status": "paid",
            "order_status": "pagado",
            "paid_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Build items text
    items_text = "\n".join([
        f"• {item.get('name', 'Producto')}" + 
        (f" - Talle: {item.get('size')}" if item.get('size') else "") + 
        f" x{item.get('quantity', 1)}" 
        for item in order.get('items', [])
    ])
    
    # Build delivery info
    delivery_info = ""
    location_link = ""
    if order.get('delivery_type') == 'delivery' and order.get('delivery_address'):
        addr = order['delivery_address']
        delivery_info = f"📍 *Dirección de entrega:*\n{addr.get('address', '')}\n{addr.get('reference', '')}"
        location_link = f"\n🗺️ *Link ubicación:* https://maps.google.com/?q={addr.get('lat')},{addr.get('lng')}"
    else:
        delivery_info = "🏪 *Retiro en tienda*"
    
    # Send WhatsApp confirmation to commercial
    commercial_message = f"""✅ *PAGO CONFIRMADO - Avenue Online*

📦 *Pedido:* {order_id}
💳 *Estado:* PAGADO

👤 *Cliente:* {order.get('customer_name', '')}
📧 *Email:* {order.get('customer_email', '')}
📱 *Teléfono:* {order.get('customer_phone', '')}

🛍️ *Productos:*
{items_text}

{delivery_info}{location_link}

💰 *TOTAL PAGADO:* {order.get('total', 0):,.0f} Gs"""

    await send_whatsapp_notification(whatsapp_commercial, commercial_message)
    
    # Send WhatsApp confirmation to customer
    customer_phone = order.get('customer_phone', '')
    if customer_phone:
        customer_message = f"""✅ *PAGO CONFIRMADO - Avenue Online*

¡Hola {order.get('customer_name', '')}!

Tu pago ha sido procesado correctamente.

📦 *Pedido:* {order_id}
💰 *Total:* {order.get('total', 0):,.0f} Gs

{delivery_info}

Te avisaremos cuando tu pedido esté listo para {('entregar' if order.get('delivery_type') == 'delivery' else 'retirar')}.

¡Gracias por tu compra!

_Avenue - Donde las marcas brillan_"""

        await send_whatsapp_notification(customer_phone, customer_message)
    
    updated_order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    return updated_order

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

# Legacy: Directory for uploaded images (backwards compatibility)
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

async def process_and_save_image(file_content: bytes, filename: str, product_id: str) -> dict:
    """
    Process image (resize if needed) and save to Cloudinary (preferred) or GridFS (fallback).
    Returns dict with 'url' and 'cloudinary_url' (if applicable).
    """
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
        
        output.seek(0)
        processed_content = output.read()
        safe_filename = re.sub(r'[^a-zA-Z0-9_-]', '_', product_id) + '.jpg'
        
        # Try Cloudinary first (if enabled and configured)
        if CLOUDINARY_ENABLED and CLOUDINARY_CONFIGURED:
            try:
                result = await cloudinary_upload(
                    file_content=processed_content,
                    filename=safe_filename,
                    folder="avenue/products",
                    public=True,
                    metadata={
                        "product_id": product_id,
                        "original_filename": filename
                    }
                )
                
                if result.get("success"):
                    logger.info(f"Product image uploaded to Cloudinary: {result.get('url')}")
                    return {
                        "url": result.get("url"),
                        "cloudinary_url": result.get("url"),
                        "public_id": result.get("public_id"),
                        "storage": "cloudinary"
                    }
                else:
                    logger.warning(f"Cloudinary upload failed, falling back to GridFS: {result.get('error')}")
            except Exception as e:
                logger.warning(f"Cloudinary error, falling back to GridFS: {e}")
        
        # Fallback to GridFS (legacy)
        file_id = await gridfs_upload(
            file_content=processed_content,
            filename=safe_filename,
            content_type="image/jpeg",
            metadata={
                "product_id": product_id,
                "original_filename": filename,
                "type": "product_image"
            },
            bucket_name="product_images"
        )
        
        gridfs_url = f"/api/shop/images/gridfs/{file_id}"
        logger.info(f"Product image uploaded to GridFS: {gridfs_url}")
        return {
            "url": gridfs_url,
            "cloudinary_url": None,
            "storage": "gridfs"
        }
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")
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
    product_id: str = Form(...),
    file: UploadFile = File(...),
    image_index: int = Form(0)  # 0, 1, or 2 for up to 3 images
):
    """Upload a single product image (up to 3 per product)"""
    
    # Validate image index (0-2 for 3 images max)
    if image_index < 0 or image_index > 2:
        raise HTTPException(status_code=400, detail="image_index must be 0, 1, or 2 (max 3 images per product)")
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {allowed_types}")
    
    # Read file content
    content = await file.read()
    
    # Check size (5MB max before processing)
    if len(content) > 10 * 1024 * 1024:  # 10MB max upload, will be reduced
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB")
    
    # Process and save image (returns dict with url and cloudinary_url)
    image_result = await process_and_save_image(content, file.filename, f"{product_id}_{image_index}")
    image_url = image_result.get("url")
    cloudinary_url = image_result.get("cloudinary_url")
    
    # Get current product
    product = await db.shop_products_grouped.find_one({"grouped_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get or create images array
    images = product.get("images", [None, None, None])
    if not isinstance(images, list):
        images = [product.get("custom_image"), None, None]
    
    # Ensure array has 3 elements
    while len(images) < 3:
        images.append(None)
    
    # Update the image at the specified index
    images[image_index] = image_url
    
    # Get or create cloudinary_images array (for migration tracking)
    cloudinary_images = product.get("cloudinary_images", [None, None, None])
    if not isinstance(cloudinary_images, list):
        cloudinary_images = [None, None, None]
    while len(cloudinary_images) < 3:
        cloudinary_images.append(None)
    
    # Update cloudinary URL if we used Cloudinary
    if cloudinary_url:
        cloudinary_images[image_index] = cloudinary_url
    
    # Update product in database
    update_data = {
        "images": images,
        "cloudinary_images": cloudinary_images,
        "custom_image": images[0] if images[0] else product.get("custom_image"),  # Keep first as main
        "cloudinary_url": cloudinary_images[0] if cloudinary_images[0] else product.get("cloudinary_url"),
        "image_updated_at": datetime.now(timezone.utc).isoformat(),
        "image_storage": image_result.get("storage", "unknown")
    }
    
    await db.shop_products_grouped.update_one(
        {"grouped_id": product_id},
        {"$set": update_data}
    )
    
    return {
        "message": "Image uploaded successfully",
        "image_url": image_url,
        "cloudinary_url": cloudinary_url,
        "image_index": image_index,
        "all_images": images,
        "storage": image_result.get("storage")
    }

@ecommerce_router.delete("/admin/product-image/{product_id}/{image_index}")
async def delete_product_image(product_id: str, image_index: int):
    """Delete a specific product image"""
    
    if image_index < 0 or image_index > 2:
        raise HTTPException(status_code=400, detail="image_index must be 0, 1, or 2")
    
    # Get current product
    product = await db.shop_products_grouped.find_one({"grouped_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get images array
    images = product.get("images", [None, None, None])
    if not isinstance(images, list):
        images = [product.get("custom_image"), None, None]
    
    # Ensure array has 3 elements
    while len(images) < 3:
        images.append(None)
    
    # Clear the image at the specified index
    images[image_index] = None
    
    # Update database
    update_data = {
        "images": images,
        "custom_image": images[0],  # First image is the main one
        "image_updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.shop_products_grouped.update_one(
        {"grouped_id": product_id},
        {"$set": update_data}
    )
    
    return {"message": "Image deleted", "all_images": images}

@ecommerce_router.put("/admin/product/{product_id}")
async def update_product_details(product_id: str, updates: dict):
    """Update product details (name, description, price, images)"""
    
    allowed_fields = ["custom_name", "custom_description", "custom_price", "images", "is_featured"]
    update_data = {}
    
    for key, value in updates.items():
        if key in allowed_fields:
            update_data[key] = value
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # Validate images array if provided
    if "images" in update_data:
        images = update_data["images"]
        if not isinstance(images, list) or len(images) > 3:
            raise HTTPException(status_code=400, detail="images must be an array of max 3 URLs")
        # Ensure 3 elements
        while len(images) < 3:
            images.append(None)
        update_data["images"] = images
        update_data["custom_image"] = images[0] if images[0] else None
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.shop_products_grouped.update_one(
        {"grouped_id": product_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await db.shop_products_grouped.find_one({"grouped_id": product_id}, {"_id": 0})
    return updated_product

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

@ecommerce_router.delete("/admin/delete-product-all-images/{product_id}")
async def delete_all_product_images(product_id: str):
    """Delete all custom images for a product"""
    # Get product to find image paths
    product = await db.shop_products_grouped.find_one({"grouped_id": product_id}, {"_id": 0, "custom_image": 1, "images": 1})
    
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
    """Serve uploaded product images from MongoDB or filesystem"""
    import base64
    from fastapi.responses import Response
    
    # Extract image_id from filename (remove extension)
    image_id = filename.rsplit('.', 1)[0] if '.' in filename else filename
    
    # First try to find in MongoDB (new storage)
    image_doc = await db.product_images_data.find_one({"image_id": image_id})
    
    if image_doc and image_doc.get("data"):
        try:
            image_data = base64.b64decode(image_doc["data"])
            return Response(
                content=image_data,
                media_type=image_doc.get("content_type", "image/jpeg")
            )
        except Exception as e:
            logger.error(f"Error decoding product image: {e}")
    
    # Fallback to filesystem (legacy storage)
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="image/jpeg")
    
    raise HTTPException(status_code=404, detail="Image not found")


@ecommerce_router.get("/images/gridfs/{file_id}")
async def serve_gridfs_product_image(file_id: str):
    """Serve product images from GridFS persistent storage"""
    content, content_type, filename = await gridfs_get(file_id, bucket_name="product_images")
    
    if content is None:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Cache-Control": "public, max-age=31536000"  # Cache for 1 year
        }
    )


@ecommerce_router.get("/admin/export-products-for-images")
async def export_products_for_images(
    has_image: Optional[bool] = None,
    category: Optional[str] = None
):
    """Export grouped products list for image naming
    Returns CSV-ready data with product names for bulk image upload
    """
    query = {}
    
    if has_image is not None:
        if has_image:
            query["custom_image"] = {"$exists": True, "$ne": None}
        else:
            query["$or"] = [
                {"custom_image": {"$exists": False}},
                {"custom_image": None}
            ]
    
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    
    # Get all grouped products
    products = await db.shop_products_grouped.find(
        query,
        {"_id": 0, "grouped_id": 1, "base_model": 1, "category": 1, "brand": 1, 
         "total_stock": 1, "variant_count": 1, "custom_image": 1}
    ).sort("base_model", 1).to_list(10000)
    
    # Format for export - the base_model is the name to use for images
    export_data = []
    for p in products:
        export_data.append({
            "nombre_para_imagen": p.get("base_model", ""),  # THIS IS THE NAME TO USE FOR IMAGE FILES
            "categoria": p.get("category", ""),
            "marca": p.get("brand", ""),
            "stock_total": p.get("total_stock", 0),
            "variantes": p.get("variant_count", 1),
            "tiene_imagen_custom": "Sí" if p.get("custom_image") else "No",
            "id_producto": p.get("grouped_id", "")
        })
    
    return {
        "products": export_data,
        "total": len(export_data),
        "columns": [
            {"key": "nombre_para_imagen", "label": "Nombre para Imagen (usar este nombre para el archivo)"},
            {"key": "categoria", "label": "Categoría"},
            {"key": "marca", "label": "Marca"},
            {"key": "stock_total", "label": "Stock Total"},
            {"key": "variantes", "label": "Variantes/Talles"},
            {"key": "tiene_imagen_custom", "label": "Tiene Imagen Custom"},
            {"key": "id_producto", "label": "ID Producto"}
        ],
        "instructions": "Para subir imágenes: 1) Copia el nombre de la columna 'nombre_para_imagen', 2) Renombra tu imagen con ese nombre exacto (ej: CAMISA DAVID SANDOVAL.jpg), 3) Sube las imágenes en 'Carga Masiva'"
    }


# ==================== VISUAL BATCH IMAGE ASSIGNMENT ====================

# Supported image formats
SUPPORTED_IMAGE_FORMATS = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/avif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif'
]

# Extension to MIME type mapping
EXT_TO_MIME = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'avif': 'image/avif',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'svg': 'image/svg+xml',
    'heic': 'image/heic',
    'heif': 'image/heif'
}

@ecommerce_router.get("/admin/brands-categories")
async def get_brands_categories():
    """Get list of all unique brands/categories for dropdown selection"""
    # Get distinct categories from grouped products
    categories = await db.shop_products_grouped.distinct("category")
    
    # Filter out None and empty values, sort alphabetically
    brands = sorted([c for c in categories if c and c.strip()])
    
    return {
        "brands": brands,
        "total": len(brands)
    }

@ecommerce_router.get("/admin/products-with-images")
async def get_products_with_images():
    """Get all products that have images assigned"""
    query = {
        "$or": [
            {"custom_image": {"$exists": True, "$type": "string", "$ne": ""}},
            {"images.0": {"$exists": True, "$type": "string", "$ne": ""}}
        ]
    }
    
    products = await db.shop_products_grouped.find(
        query,
        {"_id": 0, "grouped_id": 1, "base_model": 1, "category": 1, "brand": 1, 
         "custom_image": 1, "images": 1, "price": 1, "total_stock": 1}
    ).sort("base_model", 1).to_list(5000)
    
    return {
        "products": products,
        "total": len(products)
    }

@ecommerce_router.get("/admin/products-without-images")
async def get_products_without_images(
    brand: Optional[str] = None,
    limit: int = 100
):
    """Get products without images, optionally filtered by brand/category"""
    query = {
        "$and": [
            {"total_stock": {"$gt": 0}},
            {
                "$or": [
                    {"custom_image": {"$exists": False}},
                    {"custom_image": None},
                    {"custom_image": ""},
                    {"images": {"$exists": False}},
                    {"images": None},
                    {"images": []},
                    {"images": [None, None, None]}
                ]
            }
        ]
    }
    
    if brand:
        query["$and"].append({
            "$or": [
                {"category": {"$regex": f"^{brand}$", "$options": "i"}},
                {"brand": {"$regex": f"^{brand}$", "$options": "i"}}
            ]
        })
    
    products = await db.shop_products_grouped.find(
        query,
        {"_id": 0, "grouped_id": 1, "base_model": 1, "category": 1, "brand": 1, 
         "price": 1, "total_stock": 1}
    ).sort("base_model", 1).limit(limit).to_list(limit)
    
    # Get total count without images for this brand
    total_without_images = await db.shop_products_grouped.count_documents(query)
    
    return {
        "products": products,
        "total": total_without_images,
        "brand_filter": brand
    }

@ecommerce_router.post("/admin/upload-batch-temp")
async def upload_batch_temp(request: Request, files: List[UploadFile] = File(...)):
    """Upload batch of images to MongoDB for visual assignment (persistent in production)"""
    import base64
    
    # Generate batch ID
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"
    
    uploaded_images = []
    errors = []
    
    for file in files:
        try:
            # Get file extension
            ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'jpg'
            
            # Validate file type - check both content_type and extension
            is_valid = False
            if file.content_type and file.content_type.lower() in SUPPORTED_IMAGE_FORMATS:
                is_valid = True
            elif ext in EXT_TO_MIME:
                is_valid = True
            
            if not is_valid:
                errors.append(f"{file.filename}: Formato no soportado ({file.content_type or ext})")
                continue
            
            # Read content
            content = await file.read()
            
            if len(content) > 15 * 1024 * 1024:  # 15MB max
                errors.append(f"{file.filename}: Archivo muy grande (máx 15MB)")
                continue
            
            # Generate unique image ID
            image_id = uuid.uuid4().hex[:8]
            temp_filename = f"{image_id}.{ext}"
            
            # Store image in MongoDB as base64
            image_doc = {
                "image_id": image_id,
                "batch_id": batch_id,
                "filename": file.filename,
                "temp_filename": temp_filename,
                "extension": ext,
                "content_type": EXT_TO_MIME.get(ext, 'image/jpeg'),
                "data": base64.b64encode(content).decode('utf-8'),
                "size": len(content),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.temp_images.insert_one(image_doc)
            
            # Generate URL for preview
            image_url = f"/api/shop/temp-images/{batch_id}/{temp_filename}"
            
            uploaded_images.append({
                "id": image_id,
                "filename": file.filename,
                "temp_filename": temp_filename,
                "url": image_url,
                "batch_id": batch_id,
                "size": len(content),
                "extension": ext
            })
            
        except Exception as e:
            logger.error(f"Error uploading {file.filename}: {str(e)}")
            errors.append(f"{file.filename}: Error - {str(e)}")
    
    # Store batch info in database
    await db.temp_image_batches.update_one(
        {"batch_id": batch_id},
        {"$set": {
            "batch_id": batch_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "image_count": len(uploaded_images),
            "images": [img["temp_filename"] for img in uploaded_images]
        }},
        upsert=True
    )
    
    return {
        "batch_id": batch_id,
        "uploaded": len(uploaded_images),
        "errors": len(errors),
        "images": uploaded_images,
        "error_details": errors
    }

@ecommerce_router.get("/temp-images/{batch_id}/{filename}")
async def serve_temp_image(batch_id: str, filename: str):
    """Serve temporary batch images from MongoDB"""
    import base64
    
    # Extract image_id from filename
    image_id = filename.rsplit('.', 1)[0] if '.' in filename else filename
    
    # Find image in MongoDB
    image_doc = await db.temp_images.find_one({
        "batch_id": batch_id,
        "image_id": image_id
    })
    
    if not image_doc:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Decode base64 data
    try:
        image_data = base64.b64decode(image_doc["data"])
    except Exception as e:
        logger.error(f"Error decoding image: {e}")
        raise HTTPException(status_code=500, detail="Error decoding image")
    
    # Return image with correct content type
    from fastapi.responses import Response
    return Response(
        content=image_data,
        media_type=image_doc.get("content_type", "image/jpeg")
    )

@ecommerce_router.get("/debug/batch-images/{batch_id}")
async def debug_batch_images(batch_id: str):
    """Debug endpoint to check batch images status in MongoDB"""
    # Find images in MongoDB
    images = await db.temp_images.find(
        {"batch_id": batch_id},
        {"_id": 0, "image_id": 1, "filename": 1, "temp_filename": 1, "size": 1, "extension": 1, "created_at": 1}
    ).to_list(100)
    
    if not images:
        return {"error": f"No images found for batch: {batch_id}", "exists": False, "storage": "mongodb"}
    
    return {
        "batch_id": batch_id,
        "storage": "mongodb",
        "exists": True,
        "file_count": len(images),
        "files": images
    }

class ImageAssignment(BaseModel):
    product_id: str
    image_ids: List[str]  # List of temp image IDs to assign
    batch_id: str

@ecommerce_router.post("/admin/assign-images")
async def assign_images_to_product(assignment: ImageAssignment):
    """Assign temporary images to a product (max 3) - stores in MongoDB"""
    import base64
    
    # Log the incoming request for debugging
    logger.info(f"ASSIGN-IMAGES REQUEST: product_id={assignment.product_id}, batch_id={assignment.batch_id}, image_ids={assignment.image_ids}")
    
    if len(assignment.image_ids) > 3:
        raise HTTPException(status_code=400, detail="Máximo 3 imágenes por producto")
    
    if len(assignment.image_ids) < 1:
        raise HTTPException(status_code=400, detail="Debe asignar al menos 1 imagen")
    
    # Get product
    product = await db.shop_products_grouped.find_one(
        {"grouped_id": assignment.product_id}, 
        {"_id": 0}
    )
    if not product:
        logger.error(f"ASSIGN-IMAGES ERROR: Product not found: {assignment.product_id}")
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    product_name = product.get('base_model', 'Unknown')
    product_brand = product.get('brand') or product.get('category', 'Unknown')
    
    logger.info(f"ASSIGN-IMAGES PRODUCT FOUND: {product_name} | Brand: {product_brand} | ID: {assignment.product_id}")
    
    # Save audit log for debugging
    await db.image_assignment_logs.insert_one({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "product_id": assignment.product_id,
        "product_name": product_name,
        "product_brand": product_brand,
        "batch_id": assignment.batch_id,
        "image_ids": assignment.image_ids,
        "action": "assign"
    })
    
    # Process each temp image from MongoDB
    assigned_images = []
    cloudinary_images = []
    
    for idx, img_id in enumerate(assignment.image_ids):
        # Find the temp image in MongoDB
        temp_image = await db.temp_images.find_one({
            "batch_id": assignment.batch_id,
            "image_id": img_id
        })
        
        if not temp_image:
            logger.warning(f"Temp image not found: {img_id} in batch {assignment.batch_id}")
            continue
        
        # Get image data and decode from base64
        import base64
        image_data = temp_image.get("data")
        if not image_data:
            logger.warning(f"Temp image has no data: {img_id}")
            continue
        
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception as e:
            logger.error(f"Failed to decode image {img_id}: {e}")
            continue
        
        # Use process_and_save_image which uses Cloudinary
        permanent_image_id = f"{assignment.product_id}_{idx}"
        filename = temp_image.get("filename", f"{permanent_image_id}.jpg")
        
        image_result = await process_and_save_image(image_bytes, filename, permanent_image_id)
        
        image_url = image_result.get("url")
        cloudinary_url = image_result.get("cloudinary_url")
        
        if image_url:
            assigned_images.append(image_url)
            if cloudinary_url:
                cloudinary_images.append(cloudinary_url)
            else:
                cloudinary_images.append(None)
            
            logger.info(f"Assigned image {idx} to product {assignment.product_id}: {image_url} (storage: {image_result.get('storage')})")
    
    if not assigned_images:
        raise HTTPException(status_code=400, detail="No se pudieron procesar las imágenes")
    
    # Update product with image URLs
    # Pad arrays to 3 elements
    images_array = assigned_images + [None] * (3 - len(assigned_images))
    cloudinary_array = cloudinary_images + [None] * (3 - len(cloudinary_images))
    
    update_result = await db.shop_products_grouped.update_one(
        {"grouped_id": assignment.product_id},
        {"$set": {
            "images": images_array[:3],
            "cloudinary_images": cloudinary_array[:3],
            "custom_image": assigned_images[0] if assigned_images else None,
            "cloudinary_url": cloudinary_images[0] if cloudinary_images and cloudinary_images[0] else None,
            "image_updated_at": datetime.now(timezone.utc).isoformat(),
            "image_storage": "cloudinary" if cloudinary_images and cloudinary_images[0] else "gridfs"
        }}
    )
    
    if update_result.modified_count == 0:
        logger.warning(f"Product not updated: {assignment.product_id}")
    
    # Clean up temp images for this batch/product
    await db.temp_images.delete_many({
        "batch_id": assignment.batch_id,
        "image_id": {"$in": assignment.image_ids}
    })
    
    logger.info(f"ASSIGN-IMAGES SUCCESS: {product_name} ({assignment.product_id}) - {len(assigned_images)} images")
    
    return {
        "success": True,
        "product_id": assignment.product_id,
        "product_name": product_name,
        "product_brand": product_brand,
        "images_assigned": len(assigned_images),
        "images": images_array[:3],
        "cloudinary_images": cloudinary_array[:3],
        "storage": "cloudinary" if cloudinary_images and cloudinary_images[0] else "gridfs"
    }


@ecommerce_router.get("/debug/assignment-logs")
async def get_assignment_logs(limit: int = 50):
    """Get recent image assignment logs for debugging"""
    logs = await db.image_assignment_logs.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {
        "logs": logs,
        "total": len(logs)
    }


@ecommerce_router.delete("/admin/unlink-images/{product_id}")
async def unlink_images_from_product(product_id: str):
    """Remove all images from a product"""
    
    # Get product
    product = await db.shop_products_grouped.find_one(
        {"grouped_id": product_id}, 
        {"_id": 0}
    )
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Delete images from MongoDB
    await db.product_images_data.delete_many({"product_id": product_id})
    
    # Also try to delete from filesystem (legacy)
    current_images = product.get("images", [])
    base_upload_dir = "/app/backend/uploads/products"
    
    for img_url in current_images:
        if img_url:
            filename = img_url.split("/")[-1] if "/" in img_url else img_url
            filepath = os.path.join(base_upload_dir, filename)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as e:
                    logger.warning(f"Could not delete image file {filepath}: {e}")
    
    # Update product to remove images
    await db.shop_products_grouped.update_one(
        {"grouped_id": product_id},
        {"$set": {
            "images": [None, None, None],
            "custom_image": None,
            "image_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "Imágenes desvinculadas correctamente",
        "product_id": product_id,
        "product_name": product.get("base_model")
    }


@ecommerce_router.delete("/admin/reset-all-product-images")
async def reset_all_product_images():
    """Reset ALL product images - clears custom_image from all products and deletes image data"""
    
    # Count affected products
    affected = await db.shop_products_grouped.count_documents({
        "$or": [
            {"custom_image": {"$exists": True, "$ne": None, "$ne": ""}},
            {"images.0": {"$exists": True, "$ne": None, "$ne": ""}}
        ]
    })
    
    # Clear all product images
    result = await db.shop_products_grouped.update_many(
        {},
        {"$set": {
            "images": [None, None, None],
            "custom_image": None,
            "image_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Delete all image data from MongoDB
    deleted_images = await db.product_images_data.delete_many({})
    deleted_temp = await db.temp_images.delete_many({})
    deleted_batches = await db.temp_image_batches.delete_many({})
    
    return {
        "message": "Todas las imágenes de productos han sido reseteadas",
        "products_affected": affected,
        "products_updated": result.modified_count,
        "images_deleted": deleted_images.deleted_count,
        "temp_images_deleted": deleted_temp.deleted_count,
        "batches_deleted": deleted_batches.deleted_count
    }


@ecommerce_router.delete("/admin/delete-product-image/{product_id}")
async def delete_product_custom_image(product_id: str):
    """Delete custom image from a product (used by ProductImagesManager)"""
    
    # Get product
    product = await db.shop_products_grouped.find_one(
        {"grouped_id": product_id}, 
        {"_id": 0}
    )
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Get current custom image to delete from filesystem
    custom_image = product.get("custom_image")
    if custom_image:
        base_upload_dir = "/app/backend/uploads/products"
        filename = custom_image.split("/")[-1] if "/" in custom_image else custom_image
        filepath = os.path.join(base_upload_dir, filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                logger.warning(f"Could not delete image file {filepath}: {e}")
    
    # Also delete images array
    current_images = product.get("images", [])
    base_upload_dir = "/app/backend/uploads/products"
    for img_url in current_images:
        if img_url:
            filename = img_url.split("/")[-1] if "/" in img_url else img_url
            filepath = os.path.join(base_upload_dir, filename)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as e:
                    logger.warning(f"Could not delete image file {filepath}: {e}")
    
    # Update product to remove images
    await db.shop_products_grouped.update_one(
        {"grouped_id": product_id},
        {"$set": {
            "images": [None, None, None],
            "custom_image": None,
            "image_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "Imagen eliminada correctamente",
        "product_id": product_id,
        "product_name": product.get("base_model")
    }


@ecommerce_router.delete("/admin/temp-batch/{batch_id}")
async def delete_temp_batch(batch_id: str):
    """Clean up a temporary batch (delete all unassigned images)"""
    import shutil
    
    base_upload_dir = "/app/backend/uploads"
    temp_dir = os.path.join(base_upload_dir, "temp_batch", batch_id)
    
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    
    await db.temp_image_batches.delete_one({"batch_id": batch_id})
    
    return {"message": "Batch eliminado correctamente"}



# ==================== FIRST PURCHASE DISCOUNT ====================

@ecommerce_router.get("/first-purchase-discount")
async def get_first_purchase_discount(request: Request):
    """
    Check if user is eligible for first purchase discount.
    Returns existing coupon if available, or creates one if eligible.
    """
    from server import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return {"eligible": False, "reason": "not_logged_in"}
    
    user_id = user.get("user_id")
    email = user.get("email")
    
    # Check if user has made any previous purchases
    previous_orders = await db.orders.count_documents({
        "$or": [
            {"user_id": user_id},
            {"customer_email": email}
        ],
        "payment_status": {"$in": ["paid", "completed"]}
    })
    
    if previous_orders > 0:
        return {"eligible": False, "reason": "has_previous_purchases"}
    
    # Check if user already has an active welcome coupon
    existing_coupon = await db.shop_coupons.find_one({
        "user_id": user_id,
        "is_active": True,
        "current_uses": {"$lt": 1}  # Not used yet
    }, {"_id": 0})
    
    if existing_coupon:
        # Check if not expired
        if existing_coupon.get("expires_at"):
            expires = datetime.fromisoformat(existing_coupon["expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires:
                return {"eligible": False, "reason": "coupon_expired"}
        
        return {
            "eligible": True,
            "coupon": {
                "code": existing_coupon["code"],
                "discount_type": existing_coupon["discount_type"],
                "discount_value": existing_coupon["discount_value"],
                "description": existing_coupon.get("description", "Descuento primera compra")
            },
            "message": "¡Tienes 10% de descuento en tu primera compra!"
        }
    
    # Create a new welcome coupon if none exists
    welcome_coupon_code = f"BIENVENIDO{uuid.uuid4().hex[:6].upper()}"
    welcome_coupon = {
        "id": str(uuid.uuid4()),
        "code": welcome_coupon_code,
        "discount_type": "percentage",
        "discount_value": 10,
        "min_purchase": None,
        "max_uses": 1,
        "current_uses": 0,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "is_active": True,
        "description": f"Cupón de bienvenida para {email}",
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shop_coupons.insert_one(welcome_coupon)
    
    return {
        "eligible": True,
        "coupon": {
            "code": welcome_coupon_code,
            "discount_type": "percentage",
            "discount_value": 10,
            "description": "Cupón de bienvenida - 10% OFF"
        },
        "message": "¡Tienes 10% de descuento en tu primera compra!"
    }


@ecommerce_router.post("/auto-apply-first-purchase")
async def auto_apply_first_purchase(request: Request):
    """
    Auto-apply first purchase discount.
    Called when user logs in during checkout.
    Returns the discount details to apply automatically.
    """
    from server import get_current_user
    
    body = await request.json()
    subtotal = body.get("subtotal", 0)
    
    user = await get_current_user(request)
    if not user:
        return {"applied": False, "reason": "not_logged_in"}
    
    # Get first purchase discount eligibility
    user_id = user.get("user_id")
    email = user.get("email")
    
    # Check for previous purchases
    previous_orders = await db.orders.count_documents({
        "$or": [
            {"user_id": user_id},
            {"customer_email": email}
        ],
        "payment_status": {"$in": ["paid", "completed"]}
    })
    
    if previous_orders > 0:
        return {"applied": False, "reason": "has_previous_purchases"}
    
    # Find or create welcome coupon
    coupon = await db.shop_coupons.find_one({
        "user_id": user_id,
        "is_active": True,
        "current_uses": {"$lt": 1}
    }, {"_id": 0})
    
    if not coupon:
        # Create new coupon
        welcome_coupon_code = f"BIENVENIDO{uuid.uuid4().hex[:6].upper()}"
        coupon = {
            "id": str(uuid.uuid4()),
            "code": welcome_coupon_code,
            "discount_type": "percentage",
            "discount_value": 10,
            "min_purchase": None,
            "max_uses": 1,
            "current_uses": 0,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "is_active": True,
            "description": f"Cupón de bienvenida para {email}",
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.shop_coupons.insert_one(coupon)
    
    # Check expiration
    if coupon.get("expires_at"):
        expires = datetime.fromisoformat(coupon["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            return {"applied": False, "reason": "coupon_expired"}
    
    # Calculate discount
    discount_amount = subtotal * (coupon["discount_value"] / 100)
    discount_amount = min(discount_amount, subtotal)
    
    return {
        "applied": True,
        "coupon": {
            "code": coupon["code"],
            "discount_type": coupon["discount_type"],
            "discount_value": coupon["discount_value"],
            "description": coupon.get("description", "Descuento primera compra")
        },
        "discount_amount": discount_amount,
        "new_subtotal": subtotal - discount_amount,
        "message": "¡10% de descuento aplicado automáticamente!"
    }

