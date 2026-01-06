"""
UGC Platform - Package Routes
"""

from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid

from models.ugc_models import (
    Package, PackagePurchase, PackageType, PackageConfig, PACKAGE_CONFIGS,
    EnterpriseQuoteRequest, EnterpriseQuote
)

router = APIRouter(prefix="/api/ugc/packages", tags=["UGC Packages"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def require_auth(request: Request):
    from server import require_auth as auth
    return await auth(request)

async def require_brand(request: Request):
    from server import db
    user = await require_auth(request)
    brand = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=403, detail="Brand profile required")
    return user, brand

# ==================== PACKAGE INFO ====================

@router.get("/pricing", response_model=dict)
async def get_package_pricing():
    """Get all package pricing information"""
    packages = []
    for pkg_type, config in PACKAGE_CONFIGS.items():
        packages.append({
            "type": config.type,
            "name": config.name,
            "deliveries": config.deliveries,
            "price": config.price,
            "promo_price": config.promo_price,
            "description": config.description,
            "features": config.features,
            "is_promo_active": config.promo_price is not None
        })
    
    return {
        "packages": packages,
        "promo_active": True,  # Launch promo
        "promo_end_date": None  # No end date yet
    }

@router.post("/enterprise/quote", response_model=dict)
async def get_enterprise_quote(data: EnterpriseQuoteRequest):
    """Calculate enterprise package quote"""
    if data.duration_months < 3 or data.duration_months > 12:
        raise HTTPException(status_code=400, detail="Duration must be between 3 and 12 months")
    
    if data.deliveries_per_month not in [16, 24, 30]:
        raise HTTPException(status_code=400, detail="Deliveries per month must be 16, 24, or 30")
    
    total_deliveries = data.duration_months * data.deliveries_per_month
    price_per_delivery = 150000
    total_price = total_deliveries * price_per_delivery
    monthly_payment = total_price // data.duration_months
    
    quote = EnterpriseQuote(
        duration_months=data.duration_months,
        deliveries_per_month=data.deliveries_per_month,
        total_deliveries=total_deliveries,
        price_per_delivery=price_per_delivery,
        total_price=total_price,
        monthly_payment=monthly_payment
    )
    
    return quote.model_dump()

# ==================== PURCHASE ====================

@router.post("/purchase", response_model=dict)
async def purchase_package(
    data: PackagePurchase,
    request: Request
):
    """Purchase a package (creates pending payment)"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Check for existing active package
    existing = await db.ugc_packages.find_one(
        {"brand_id": brand["id"], "status": "active"}
    )
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Ya tenés un paquete activo. Debés usar todas las entregas antes de comprar otro."
        )
    
    # Calculate pricing
    if data.package_type == PackageType.ENTERPRISE:
        if not data.enterprise_quote:
            raise HTTPException(status_code=400, detail="Enterprise quote required")
        
        quote = data.enterprise_quote
        total_deliveries = quote.duration_months * quote.deliveries_per_month
        price = total_deliveries * 150000
        monthly_payment = price // quote.duration_months
        
        package = {
            "id": str(uuid.uuid4()),
            "brand_id": brand["id"],
            "type": PackageType.ENTERPRISE,
            "deliveries_total": total_deliveries,
            "deliveries_used": 0,
            "deliveries_remaining": total_deliveries,
            "price_paid": price,
            "is_promo": False,
            "duration_months": quote.duration_months,
            "deliveries_per_month": quote.deliveries_per_month,
            "monthly_payment": monthly_payment,
            "status": "pending_payment",
            "purchased_at": None,
            "expires_at": None,
            "created_at": now
        }
    else:
        config = PACKAGE_CONFIGS.get(data.package_type)
        if not config:
            raise HTTPException(status_code=400, detail="Invalid package type")
        
        price = config.promo_price if data.use_promo and config.promo_price else config.price
        
        package = {
            "id": str(uuid.uuid4()),
            "brand_id": brand["id"],
            "type": data.package_type,
            "deliveries_total": config.deliveries,
            "deliveries_used": 0,
            "deliveries_remaining": config.deliveries,
            "price_paid": price,
            "is_promo": data.use_promo and config.promo_price is not None,
            "duration_months": None,
            "deliveries_per_month": None,
            "monthly_payment": None,
            "status": "pending_payment",
            "purchased_at": None,
            "expires_at": None,
            "created_at": now
        }
    
    await db.ugc_packages.insert_one(package)
    
    return {
        "success": True,
        "package_id": package["id"],
        "price": package["price_paid"],
        "message": "Paquete creado. Procede al pago para activarlo."
    }

@router.post("/{package_id}/confirm-payment", response_model=dict)
async def confirm_package_payment(
    package_id: str,
    request: Request
):
    """Confirm payment for a package (admin action or after payment gateway)"""
    db = await get_db()
    user = await require_auth(request)
    
    # For now, allow brand to confirm (later this will be admin/payment gateway)
    package = await db.ugc_packages.find_one({"id": package_id})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    if package["status"] != "pending_payment":
        raise HTTPException(status_code=400, detail="Package is not pending payment")
    
    now = datetime.now(timezone.utc)
    
    # Calculate expiry (for enterprise: duration_months, for others: 6 months default)
    if package.get("duration_months"):
        expires_at = now + timedelta(days=30 * package["duration_months"])
    else:
        expires_at = now + timedelta(days=180)  # 6 months
    
    await db.ugc_packages.update_one(
        {"id": package_id},
        {
            "$set": {
                "status": "active",
                "purchased_at": now.isoformat(),
                "expires_at": expires_at.isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Paquete activado"}

# ==================== BRAND PACKAGES ====================

@router.get("/me", response_model=dict)
async def get_my_packages(request: Request):
    """Get current brand's packages"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    packages = await db.ugc_packages.find(
        {"brand_id": brand["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return {"packages": packages}

@router.get("/me/active", response_model=dict)
async def get_active_package(request: Request):
    """Get current brand's active package"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    package = await db.ugc_packages.find_one(
        {"brand_id": brand["id"], "status": "active"},
        {"_id": 0}
    )
    
    if not package:
        return {"active_package": None, "message": "No active package"}
    
    return {"active_package": package}
