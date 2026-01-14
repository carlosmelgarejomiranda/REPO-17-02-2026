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

from models.ugc_models import CampaignCreate, CampaignContractRenewal, CampaignContract

@router.post("/campaigns", response_model=dict)
async def admin_create_campaign(
    data: CampaignCreate,
    request: Request
):
    """Admin creates a campaign for a brand with contract configuration"""
    user = await require_admin(request)
    db = await get_db()
    
    # Verify brand exists
    brand = await db.ugc_brands.find_one({"id": data.brand_id}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    now = datetime.now(timezone.utc)
    
    # Calculate contract dates
    start_date = datetime.fromisoformat(data.contract_start_date.replace('Z', '+00:00'))
    end_date = start_date
    for _ in range(data.contract_duration_months):
        month = end_date.month + 1
        year = end_date.year
        if month > 12:
            month = 1
            year += 1
        import calendar
        max_day = calendar.monthrange(year, month)[1]
        day = min(end_date.day, max_day)
        end_date = end_date.replace(year=year, month=month, day=day)
    
    # First reload is one month after start
    first_reload = start_date
    month = first_reload.month + 1
    year = first_reload.year
    if month > 12:
        month = 1
        year += 1
    import calendar
    max_day = calendar.monthrange(year, month)[1]
    day = min(first_reload.day, max_day)
    next_reload = first_reload.replace(year=year, month=month, day=day)
    
    # Create contract
    contract = {
        "monthly_deliverables": data.monthly_deliverables,
        "duration_months": data.contract_duration_months,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "next_reload_date": next_reload.isoformat(),
        "total_slots_loaded": data.monthly_deliverables,  # First month's slots
        "is_active": True,
        "renewed_at": None,
        "renewal_count": 0
    }
    
    campaign_id = str(uuid.uuid4())
    
    campaign = {
        "id": campaign_id,
        "brand_id": data.brand_id,
        "package_id": None,
        "name": data.name,
        "description": data.description,
        "category": data.category,
        "city": data.city,
        "available_slots": data.monthly_deliverables,  # First month's slots available
        "total_slots_loaded": data.monthly_deliverables,
        "slots_filled": 0,
        "slots": data.monthly_deliverables,  # For backwards compat
        "contract": contract,
        "requirements": data.requirements.model_dump(),
        "canje": data.canje.model_dump(),
        "timeline": data.timeline.model_dump(),
        "assets": data.assets,
        "status": CampaignStatus.LIVE,
        "visible_to_creators": True,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "published_at": now.isoformat(),
        "completed_at": None,
        "admin_notes": data.admin_notes,
        "created_by_admin": user["user_id"]
    }
    
    await db.ugc_campaigns.insert_one(campaign)
    
    # Send email notification to brand
    try:
        from email_service import send_campaign_created_notification
        await send_campaign_created_notification(db, campaign, brand)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send campaign created email: {e}")
    
    return {
        "success": True,
        "campaign_id": campaign_id,
        "message": f"Campaña creada con {data.monthly_deliverables} cupos iniciales. Próxima recarga: {next_reload.strftime('%d/%m/%Y')}"
    }

@router.post("/campaigns/{campaign_id}/renew", response_model=dict)
async def admin_renew_campaign(
    campaign_id: str,
    data: CampaignContractRenewal,
    request: Request
):
    """Admin renews a campaign contract"""
    await require_admin(request)
    db = await get_db()
    
    campaign = await db.ugc_campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    now = datetime.now(timezone.utc)
    
    # Calculate new contract dates
    start_date = datetime.fromisoformat(data.start_date.replace('Z', '+00:00'))
    end_date = start_date
    for _ in range(data.duration_months):
        month = end_date.month + 1
        year = end_date.year
        if month > 12:
            month = 1
            year += 1
        import calendar
        max_day = calendar.monthrange(year, month)[1]
        day = min(end_date.day, max_day)
        end_date = end_date.replace(year=year, month=month, day=day)
    
    # Calculate next reload (one month from start)
    next_reload = start_date
    month = next_reload.month + 1
    year = next_reload.year
    if month > 12:
        month = 1
        year += 1
    import calendar
    max_day = calendar.monthrange(year, month)[1]
    day = min(next_reload.day, max_day)
    next_reload = next_reload.replace(year=year, month=month, day=day)
    
    current_contract = campaign.get("contract", {})
    current_total = campaign.get("total_slots_loaded", 0)
    current_available = campaign.get("available_slots", 0)
    
    # Update with renewal data
    await db.ugc_campaigns.update_one(
        {"id": campaign_id},
        {
            "$set": {
                "contract.monthly_deliverables": data.monthly_deliverables,
                "contract.duration_months": data.duration_months,
                "contract.start_date": start_date.isoformat(),
                "contract.end_date": end_date.isoformat(),
                "contract.next_reload_date": next_reload.isoformat(),
                "contract.is_active": True,
                "contract.renewed_at": now.isoformat(),
                "contract.renewal_count": current_contract.get("renewal_count", 0) + 1,
                "available_slots": current_available + data.monthly_deliverables,
                "total_slots_loaded": current_total + data.monthly_deliverables,
                "slots": current_total + data.monthly_deliverables,
                "visible_to_creators": True,
                "status": CampaignStatus.LIVE,
                "updated_at": now.isoformat()
            }
        }
    )
    
    return {
        "success": True,
        "message": f"Contrato renovado. {data.monthly_deliverables} cupos añadidos. Próxima recarga: {next_reload.strftime('%d/%m/%Y')}"
    }

@router.put("/campaigns/{campaign_id}", response_model=dict)
async def admin_update_campaign(
    campaign_id: str,
    request: Request
):
    """Admin updates a campaign's details"""
    await require_admin(request)
    db = await get_db()
    
    campaign = await db.ugc_campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    data = await request.json()
    
    # Build update object
    update_fields = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update basic fields
    if "name" in data:
        update_fields["name"] = data["name"]
    if "description" in data:
        update_fields["description"] = data["description"]
    if "category" in data:
        update_fields["category"] = data["category"]
    if "city" in data:
        update_fields["city"] = data["city"]
    if "admin_notes" in data:
        update_fields["admin_notes"] = data["admin_notes"]
    
    # Update nested objects
    if "requirements" in data:
        update_fields["requirements"] = data["requirements"]
    if "canje" in data:
        update_fields["canje"] = data["canje"]
    if "timeline" in data:
        update_fields["timeline"] = data["timeline"]
    if "assets" in data:
        # Merge with existing assets
        existing_assets = campaign.get("assets", {})
        existing_assets.update(data["assets"])
        update_fields["assets"] = existing_assets
    
    await db.ugc_campaigns.update_one(
        {"id": campaign_id},
        {"$set": update_fields}
    )
    
    return {
        "success": True,
        "message": "Campaña actualizada exitosamente"
    }

@router.put("/campaigns/{campaign_id}/add-slots", response_model=dict)
async def admin_add_slots(
    campaign_id: str,
    slots: int,
    request: Request
):
    """Admin manually adds slots to a campaign"""
    await require_admin(request)
    db = await get_db()
    
    campaign = await db.ugc_campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    current_available = campaign.get("available_slots", 0)
    current_total = campaign.get("total_slots_loaded", 0)
    
    await db.ugc_campaigns.update_one(
        {"id": campaign_id},
        {
            "$set": {
                "available_slots": current_available + slots,
                "total_slots_loaded": current_total + slots,
                "slots": current_total + slots,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "message": f"{slots} cupos añadidos a la campaña"}

@router.put("/campaigns/{campaign_id}/visibility", response_model=dict)
async def admin_toggle_campaign_visibility(
    campaign_id: str,
    visible: bool,
    request: Request
):
    """Admin toggles campaign visibility for creators"""
    await require_admin(request)
    db = await get_db()
    
    result = await db.ugc_campaigns.update_one(
        {"id": campaign_id},
        {
            "$set": {
                "visible_to_creators": visible,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {"success": True, "message": f"Visibilidad actualizada a {visible}"}

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

# ==================== DETAILED STATS ====================

@router.get("/stats", response_model=dict)
async def get_detailed_stats(
    request: Request,
    period: str = "30d"  # 7d, 30d, 90d, all
):
    """Get detailed platform statistics"""
    await require_admin(request)
    db = await get_db()
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:
        start_date = None
    
    start_date_str = start_date.isoformat() if start_date else None
    
    # Users stats
    total_creators = await db.ugc_creators.count_documents({})
    active_creators = await db.ugc_creators.count_documents({"is_active": True})
    total_brands = await db.ugc_brands.count_documents({})
    active_brands = await db.ugc_brands.count_documents({"is_active": True})
    
    # Creators by level
    creators_by_level = {
        "rookie": await db.ugc_creators.count_documents({"level": "rookie"}),
        "trusted": await db.ugc_creators.count_documents({"level": "trusted"}),
        "pro": await db.ugc_creators.count_documents({"level": "pro"}),
        "elite": await db.ugc_creators.count_documents({"level": "elite"})
    }
    
    # Campaign stats
    total_campaigns = await db.ugc_campaigns.count_documents({})
    live_campaigns = await db.ugc_campaigns.count_documents({"status": CampaignStatus.LIVE})
    in_production = await db.ugc_campaigns.count_documents({"status": CampaignStatus.IN_PRODUCTION})
    
    # Application stats
    app_query = {}
    if start_date_str:
        app_query["applied_at"] = {"$gte": start_date_str}
    total_applications = await db.ugc_applications.count_documents(app_query)
    pending_applications = await db.ugc_applications.count_documents({**app_query, "status": ApplicationStatus.APPLIED})
    confirmed_applications = await db.ugc_applications.count_documents({**app_query, "status": ApplicationStatus.CONFIRMED})
    
    # Deliverable stats with breakdown
    del_query = {}
    if start_date_str:
        del_query["created_at"] = {"$gte": start_date_str}
    
    total_deliverables = await db.ugc_deliverables.count_documents(del_query)
    deliverables_breakdown = {
        "pending_review": await db.ugc_deliverables.count_documents({
            **del_query, 
            "status": {"$in": [DeliverableStatus.SUBMITTED, DeliverableStatus.RESUBMITTED]}
        }),
        "submitted": await db.ugc_deliverables.count_documents({**del_query, "status": DeliverableStatus.SUBMITTED}),
        "approved": await db.ugc_deliverables.count_documents({**del_query, "status": DeliverableStatus.APPROVED}),
        "changes_requested": await db.ugc_deliverables.count_documents({**del_query, "status": DeliverableStatus.CHANGES_REQUESTED}),
        "completed": await db.ugc_deliverables.count_documents({**del_query, "status": DeliverableStatus.COMPLETED}),
        "rejected": await db.ugc_deliverables.count_documents({**del_query, "status": DeliverableStatus.REJECTED})
    }
    
    # Metrics stats
    metrics_query = {}
    if start_date_str:
        metrics_query["submitted_at"] = {"$gte": start_date_str}
    
    all_metrics = await db.ugc_metrics.find(metrics_query, {"_id": 0}).to_list(1000)
    
    total_views = sum(m.get("views", 0) or 0 for m in all_metrics)
    total_likes = sum(m.get("likes", 0) or 0 for m in all_metrics)
    total_engagement = sum(m.get("total_interactions", 0) or 0 for m in all_metrics)
    avg_engagement = sum(m.get("engagement_rate", 0) or 0 for m in all_metrics) / len(all_metrics) if all_metrics else 0
    
    # Rating stats
    all_rated_deliverables = await db.ugc_deliverables.find(
        {"brand_rating.rating": {"$exists": True}},
        {"_id": 0, "brand_rating.rating": 1}
    ).to_list(1000)
    
    avg_rating = 0
    if all_rated_deliverables:
        ratings = [d["brand_rating"]["rating"] for d in all_rated_deliverables if d.get("brand_rating", {}).get("rating")]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
    
    # On-time rate
    on_time_deliverables = await db.ugc_deliverables.count_documents({"is_on_time": True})
    total_delivered = await db.ugc_deliverables.count_documents({"is_on_time": {"$exists": True}})
    on_time_rate = (on_time_deliverables / total_delivered * 100) if total_delivered > 0 else 0
    
    # Revenue
    packages = await db.ugc_packages.find(
        {"status": {"$in": ["active", "exhausted"]}},
        {"_id": 0, "price_paid": 1}
    ).to_list(1000)
    total_revenue = sum(p.get("price_paid", 0) for p in packages)
    
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_packages = await db.ugc_packages.find(
        {
            "status": {"$in": ["active", "exhausted"]},
            "purchased_at": {"$gte": month_start.isoformat()}
        },
        {"_id": 0, "price_paid": 1}
    ).to_list(100)
    monthly_revenue = sum(p.get("price_paid", 0) for p in monthly_packages)
    packages_sold = len(packages)
    
    # Top creators
    top_creators = await db.ugc_creators.find(
        {"is_active": True},
        {"_id": 0, "id": 1, "name": 1, "level": 1, "stats": 1}
    ).sort([
        ("stats.avg_rating", -1),
        ("stats.total_completed", -1)
    ]).limit(10).to_list(10)
    
    top_creators_formatted = []
    for c in top_creators:
        stats = c.get("stats", {})
        top_creators_formatted.append({
            "id": c["id"],
            "name": c.get("name"),
            "level": c.get("level", "rookie"),
            "avg_rating": stats.get("avg_rating", 0),
            "total_deliveries": stats.get("total_completed", 0)
        })
    
    return {
        "users": {
            "total_creators": total_creators,
            "active_creators": active_creators,
            "total_brands": total_brands,
            "active_brands": active_brands
        },
        "creators_by_level": creators_by_level,
        "campaigns": {
            "total": total_campaigns,
            "live": live_campaigns,
            "in_production": in_production
        },
        "applications": {
            "total": total_applications,
            "pending": pending_applications,
            "confirmed": confirmed_applications
        },
        "deliverables": {
            "total": total_deliverables,
            **deliverables_breakdown
        },
        "metrics": {
            "total_views": total_views,
            "total_likes": total_likes,
            "total_engagement": total_engagement,
            "avg_engagement": round(avg_engagement, 2),
            "avg_rating": round(avg_rating, 2),
            "on_time_rate": round(on_time_rate, 1)
        },
        "revenue": {
            "total": total_revenue,
            "monthly": monthly_revenue,
            "packages_sold": packages_sold
        },
        "top_creators": top_creators_formatted,
        "period": period
    }



# ==================== DELIVERABLES MANAGEMENT ====================

@router.get("/deliverables", response_model=dict)
async def get_all_deliverables(
    request: Request,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get all deliverables with optional status filter"""
    await require_admin(request)
    db = await get_db()
    
    query = {}
    if status:
        if status == "pending_review":
            query["status"] = {"$in": [DeliverableStatus.SUBMITTED, DeliverableStatus.RESUBMITTED]}
        else:
            query["status"] = status
    
    deliverables = await db.ugc_deliverables.find(
        query,
        {"_id": 0}
    ).sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with creator and campaign info
    for del_item in deliverables:
        creator = await db.ugc_creators.find_one(
            {"id": del_item.get("creator_id")},
            {"_id": 0, "name": 1, "email": 1}
        )
        campaign = await db.ugc_campaigns.find_one(
            {"id": del_item.get("campaign_id")},
            {"_id": 0, "name": 1, "brand_id": 1}
        )
        del_item["creator"] = creator
        del_item["campaign"] = campaign
    
    total = await db.ugc_deliverables.count_documents(query)
    
    return {"deliverables": deliverables, "total": total}

@router.put("/deliverables/{deliverable_id}/review", response_model=dict)
async def admin_review_deliverable(
    deliverable_id: str,
    action: str,  # "approve" or "request_changes"
    feedback: Optional[str] = None,
    request: Request = None
):
    """Admin reviews a deliverable"""
    await require_admin(request)
    db = await get_db()
    
    deliverable = await db.ugc_deliverables.find_one({"id": deliverable_id})
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    if action == "approve":
        new_status = DeliverableStatus.APPROVED
    elif action == "request_changes":
        new_status = DeliverableStatus.CHANGES_REQUESTED
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    update_data = {
        "status": new_status,
        "updated_at": now
    }
    
    if feedback:
        update_data["admin_feedback"] = feedback
    
    await db.ugc_deliverables.update_one(
        {"id": deliverable_id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": f"Deliverable {action}d"}
