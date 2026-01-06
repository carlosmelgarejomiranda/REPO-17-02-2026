"""
UGC Platform - Admin Routes
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid

from models.ugc_models import (
    CampaignStatus, ApplicationStatus, DeliverableStatus, CreatorLevel
)

router = APIRouter(prefix="/api/ugc/admin", tags=["UGC Admin"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def require_admin(request: Request):
    from server import require_admin as admin
    return await admin(request)

# ==================== DASHBOARD ====================

@router.get("/dashboard", response_model=dict)
async def get_admin_dashboard(request: Request):
    """Get admin dashboard with platform metrics"""
    await require_admin(request)
    db = await get_db()
    
    # Users stats
    total_creators = await db.ugc_creators.count_documents({})
    active_creators = await db.ugc_creators.count_documents({"is_active": True})
    total_brands = await db.ugc_brands.count_documents({})
    active_brands = await db.ugc_brands.count_documents({"is_active": True})
    
    # Campaign stats
    total_campaigns = await db.ugc_campaigns.count_documents({})
    live_campaigns = await db.ugc_campaigns.count_documents({"status": CampaignStatus.LIVE})
    in_production = await db.ugc_campaigns.count_documents({"status": CampaignStatus.IN_PRODUCTION})
    
    # Application stats
    total_applications = await db.ugc_applications.count_documents({})
    pending_applications = await db.ugc_applications.count_documents({"status": ApplicationStatus.APPLIED})
    
    # Deliverable stats
    total_deliverables = await db.ugc_deliverables.count_documents({})
    pending_review = await db.ugc_deliverables.count_documents({
        "status": {"$in": [DeliverableStatus.SUBMITTED, DeliverableStatus.RESUBMITTED]}
    })
    completed = await db.ugc_deliverables.count_documents({"status": DeliverableStatus.COMPLETED})
    
    # Revenue (from packages)
    packages = await db.ugc_packages.find(
        {"status": {"$in": ["active", "exhausted"]}},
        {"_id": 0, "price_paid": 1}
    ).to_list(1000)
    total_revenue = sum(p.get("price_paid", 0) for p in packages)
    
    # Monthly revenue
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_packages = await db.ugc_packages.find(
        {
            "status": {"$in": ["active", "exhausted"]},
            "purchased_at": {"$gte": month_start.isoformat()}
        },
        {"_id": 0, "price_paid": 1}
    ).to_list(100)
    monthly_revenue = sum(p.get("price_paid", 0) for p in monthly_packages)
    
    # Metrics pending verification
    metrics_pending = await db.ugc_metrics.count_documents({
        "manually_verified": False,
        "ai_confidence": {"$lt": 0.7}
    })
    
    return {
        "users": {
            "total_creators": total_creators,
            "active_creators": active_creators,
            "total_brands": total_brands,
            "active_brands": active_brands
        },
        "campaigns": {
            "total": total_campaigns,
            "live": live_campaigns,
            "in_production": in_production
        },
        "applications": {
            "total": total_applications,
            "pending": pending_applications
        },
        "deliverables": {
            "total": total_deliverables,
            "pending_review": pending_review,
            "completed": completed
        },
        "revenue": {
            "total": total_revenue,
            "monthly": monthly_revenue
        },
        "pending_actions": {
            "metrics_verification": metrics_pending
        }
    }

# ==================== CREATORS MANAGEMENT ====================

@router.get("/creators", response_model=dict)
async def get_all_creators(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    level: Optional[CreatorLevel] = None,
    city: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Get all creators with filters"""
    await require_admin(request)
    db = await get_db()
    
    query = {}
    if level:
        query["level"] = level
    if city:
        query["city"] = city
    if is_active is not None:
        query["is_active"] = is_active
    
    creators = await db.ugc_creators.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.ugc_creators.count_documents(query)
    
    return {"creators": creators, "total": total}

@router.put("/creators/{creator_id}/level", response_model=dict)
async def update_creator_level(
    creator_id: str,
    level: CreatorLevel,
    request: Request
):
    """Manually update a creator's level"""
    await require_admin(request)
    db = await get_db()
    
    result = await db.ugc_creators.update_one(
        {"id": creator_id},
        {
            "$set": {
                "level": level,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    return {"success": True, "message": f"Nivel actualizado a {level}"}

@router.put("/creators/{creator_id}/verify", response_model=dict)
async def verify_creator(
    creator_id: str,
    verified: bool,
    request: Request
):
    """Verify/unverify a creator"""
    await require_admin(request)
    db = await get_db()
    
    result = await db.ugc_creators.update_one(
        {"id": creator_id},
        {
            "$set": {
                "is_verified": verified,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    return {"success": True, "message": "Verificación actualizada"}

# ==================== BRANDS MANAGEMENT ====================

@router.get("/brands", response_model=dict)
async def get_all_brands(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    is_active: Optional[bool] = None
):
    """Get all brands"""
    await require_admin(request)
    db = await get_db()
    
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    
    brands = await db.ugc_brands.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with package info
    for brand in brands:
        active_pkg = await db.ugc_packages.find_one(
            {"brand_id": brand["id"], "status": "active"},
            {"_id": 0}
        )
        brand["active_package"] = active_pkg
    
    total = await db.ugc_brands.count_documents(query)
    
    return {"brands": brands, "total": total}

@router.put("/brands/{brand_id}/verify", response_model=dict)
async def verify_brand(
    brand_id: str,
    verified: bool,
    request: Request
):
    """Verify/unverify a brand"""
    await require_admin(request)
    db = await get_db()
    
    result = await db.ugc_brands.update_one(
        {"id": brand_id},
        {
            "$set": {
                "is_verified": verified,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    return {"success": True, "message": "Verificación actualizada"}

# ==================== PACKAGES MANAGEMENT ====================

@router.get("/packages", response_model=dict)
async def get_all_packages(
    request: Request,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get all packages"""
    await require_admin(request)
    db = await get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    packages = await db.ugc_packages.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with brand info
    for pkg in packages:
        brand = await db.ugc_brands.find_one(
            {"id": pkg["brand_id"]},
            {"_id": 0, "company_name": 1}
        )
        pkg["brand"] = brand
    
    total = await db.ugc_packages.count_documents(query)
    
    return {"packages": packages, "total": total}

@router.put("/packages/{package_id}/activate", response_model=dict)
async def admin_activate_package(
    package_id: str,
    request: Request
):
    """Admin manually activates a package (confirms payment)"""
    await require_admin(request)
    db = await get_db()
    
    package = await db.ugc_packages.find_one({"id": package_id})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    now = datetime.now(timezone.utc)
    
    # Calculate expiry
    if package.get("duration_months"):
        expires_at = now + timedelta(days=30 * package["duration_months"])
    else:
        expires_at = now + timedelta(days=180)
    
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

# ==================== CAMPAIGNS MANAGEMENT ====================

@router.get("/campaigns", response_model=dict)
async def get_all_campaigns(
    request: Request,
    status: Optional[CampaignStatus] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get all campaigns"""
    await require_admin(request)
    db = await get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    campaigns = await db.ugc_campaigns.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with brand info and counts
    for campaign in campaigns:
        brand = await db.ugc_brands.find_one(
            {"id": campaign["brand_id"]},
            {"_id": 0, "company_name": 1}
        )
        campaign["brand"] = brand
        
        app_count = await db.ugc_applications.count_documents({"campaign_id": campaign["id"]})
        campaign["applications_count"] = app_count
    
    total = await db.ugc_campaigns.count_documents(query)
    
    return {"campaigns": campaigns, "total": total}

# ==================== REVIEWS MODERATION ====================

@router.get("/reviews", response_model=dict)
async def get_all_reviews(
    request: Request,
    skip: int = 0,
    limit: int = 50
):
    """Get all reviews for moderation"""
    await require_admin(request)
    db = await get_db()
    
    reviews = await db.ugc_reviews.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich
    for review in reviews:
        creator = await db.ugc_creators.find_one(
            {"id": review["creator_id"]},
            {"_id": 0, "name": 1}
        )
        brand = await db.ugc_brands.find_one(
            {"id": review["brand_id"]},
            {"_id": 0, "company_name": 1}
        )
        review["creator"] = creator
        review["brand"] = brand
    
    total = await db.ugc_reviews.count_documents({})
    
    return {"reviews": reviews, "total": total}

@router.delete("/reviews/{review_id}", response_model=dict)
async def delete_review(
    review_id: str,
    request: Request
):
    """Delete a review (moderation)"""
    await require_admin(request)
    db = await get_db()
    
    review = await db.ugc_reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.ugc_reviews.delete_one({"id": review_id})
    
    # Recalculate creator rating
    creator_id = review["creator_id"]
    remaining_reviews = await db.ugc_reviews.find(
        {"creator_id": creator_id},
        {"_id": 0, "rating": 1}
    ).to_list(100)
    
    if remaining_reviews:
        avg_rating = sum(r["rating"] for r in remaining_reviews) / len(remaining_reviews)
        await db.ugc_creators.update_one(
            {"id": creator_id},
            {
                "$set": {
                    "stats.avg_rating": round(avg_rating, 2),
                    "stats.total_ratings": len(remaining_reviews)
                }
            }
        )
    else:
        await db.ugc_creators.update_one(
            {"id": creator_id},
            {
                "$set": {
                    "stats.avg_rating": 0,
                    "stats.total_ratings": 0
                }
            }
        )
    
    return {"success": True, "message": "Review eliminada"}

# ==================== AUDIT LOGS ====================

@router.get("/audit-logs", response_model=dict)
async def get_audit_logs(
    request: Request,
    skip: int = 0,
    limit: int = 100
):
    """Get audit logs"""
    await require_admin(request)
    db = await get_db()
    
    logs = await db.ugc_audit_logs.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    return {"logs": logs}
