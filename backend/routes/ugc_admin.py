"""
UGC Platform - Admin Routes
"""

from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import csv
import io

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
    """Get all creators with filters and enriched data (social accounts, metrics, reviews)"""
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
    
    # Enrich each creator with metrics and reviews
    for creator in creators:
        creator_id = creator.get("id")
        
        # Get verified social accounts (from AI verification)
        social_accounts = creator.get("social_accounts", {})
        creator["verified_instagram"] = social_accounts.get("instagram")
        creator["verified_tiktok"] = social_accounts.get("tiktok")
        
        # Get unverified social networks (from onboarding)
        social_networks = creator.get("social_networks", [])
        unverified_ig = None
        unverified_tt = None
        for sn in social_networks:
            if sn.get("platform") == "instagram" and not creator["verified_instagram"]:
                unverified_ig = {
                    "username": sn.get("username"),
                    "url": sn.get("url"),
                    "followers": sn.get("followers"),
                    "verified": False
                }
            elif sn.get("platform") == "tiktok" and not creator["verified_tiktok"]:
                unverified_tt = {
                    "username": sn.get("username"),
                    "url": sn.get("url"),
                    "followers": sn.get("followers"),
                    "verified": False
                }
        
        creator["unverified_instagram"] = unverified_ig
        creator["unverified_tiktok"] = unverified_tt
        
        # Get campaigns participated count
        campaigns_participated = await db.ugc_applications.count_documents({
            "creator_id": creator_id,
            "status": {"$in": ["confirmed", "completed"]}
        })
        creator["campaigns_participated"] = campaigns_participated
        
        # Get creator metrics for averages
        all_metrics = await db.ugc_metrics.find(
            {"creator_id": creator_id},
            {"_id": 0, "views": 1, "reach": 1, "likes": 1, "comments": 1, "shares": 1, "saves": 1}
        ).to_list(100)
        
        num_metrics = len(all_metrics) or 1
        total_views = sum((m.get("views") or 0) for m in all_metrics)
        total_reach = sum((m.get("reach") or 0) for m in all_metrics)
        total_interactions = sum(
            (m.get("likes") or 0) + (m.get("comments") or 0) + (m.get("shares") or 0) + (m.get("saves") or 0)
            for m in all_metrics
        )
        
        creator["avg_views"] = round(total_views / num_metrics) if all_metrics else 0
        creator["avg_reach"] = round(total_reach / num_metrics) if all_metrics else 0
        creator["avg_interactions"] = round(total_interactions / num_metrics) if all_metrics else 0
        creator["total_metrics"] = len(all_metrics)
        
        # Get creator ratings/reviews
        ratings = await db.ugc_ratings.find(
            {"creator_id": creator_id},
            {"_id": 0, "rating": 1}
        ).to_list(100)
        creator["avg_rating"] = round(sum(r.get("rating", 0) for r in ratings) / len(ratings), 1) if ratings else 0
        creator["total_reviews"] = len(ratings)
    
    total = await db.ugc_creators.count_documents(query)
    
    return {"creators": creators, "total": total}


@router.get("/creators/export", response_class=StreamingResponse)
async def export_creators_csv(
    request: Request,
    level: Optional[str] = None,
    is_active: Optional[str] = None
):
    """Export all creators to CSV file"""
    await require_admin(request)
    db = await get_db()
    
    # Build query
    query = {}
    if level and level != "all":
        query["level"] = level
    if is_active and is_active != "all":
        query["is_active"] = is_active == "true"
    
    # Fetch all creators
    creators = await db.ugc_creators.find(query, {"_id": 0}).sort("created_at", -1).to_list(5000)
    
    # Prepare CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row
    writer.writerow([
        "Nombre",
        "Email",
        "Teléfono",
        "Ciudad",
        "Nivel",
        "Verificado",
        "Activo",
        "Instagram",
        "IG Seguidores",
        "IG Verificado",
        "TikTok",
        "TT Seguidores", 
        "TT Verificado",
        "Campañas Participadas",
        "Rating Promedio",
        "Total Reviews",
        "Fecha Registro"
    ])
    
    # Data rows
    for creator in creators:
        # Get social accounts
        social_accounts = creator.get("social_accounts", {})
        ig_verified = social_accounts.get("instagram")
        tt_verified = social_accounts.get("tiktok")
        
        # Get unverified from social_networks
        social_networks = creator.get("social_networks", [])
        ig_unverified = next((sn for sn in social_networks if sn.get("platform") == "instagram"), None)
        tt_unverified = next((sn for sn in social_networks if sn.get("platform") == "tiktok"), None)
        
        # Best available data
        ig_username = ig_verified.get("username") if ig_verified else (ig_unverified.get("username") if ig_unverified else "")
        ig_followers = ig_verified.get("followers") if ig_verified else (ig_unverified.get("followers") if ig_unverified else "")
        tt_username = tt_verified.get("username") if tt_verified else (tt_unverified.get("username") if tt_unverified else "")
        tt_followers = tt_verified.get("followers") if tt_verified else (tt_unverified.get("followers") if tt_unverified else "")
        
        # Get campaigns count
        campaigns_count = await db.ugc_applications.count_documents({
            "creator_id": creator.get("id"),
            "status": {"$in": ["confirmed", "completed"]}
        })
        
        # Get rating
        ratings = await db.ugc_ratings.find(
            {"creator_id": creator.get("id")},
            {"_id": 0, "rating": 1}
        ).to_list(100)
        avg_rating = round(sum(r.get("rating", 0) for r in ratings) / len(ratings), 1) if ratings else 0
        
        writer.writerow([
            creator.get("name", ""),
            creator.get("email", ""),
            creator.get("phone", ""),
            creator.get("city", ""),
            creator.get("level", "rookie"),
            "Sí" if creator.get("is_verified") else "No",
            "Sí" if creator.get("is_active", True) else "No",
            f"@{ig_username}" if ig_username else "",
            ig_followers if ig_followers else "",
            "Sí" if ig_verified else "No",
            f"@{tt_username}" if tt_username else "",
            tt_followers if tt_followers else "",
            "Sí" if tt_verified else "No",
            campaigns_count,
            avg_rating,
            len(ratings),
            creator.get("created_at", "")[:10] if creator.get("created_at") else ""
        ])
    
    # Prepare response
    output.seek(0)
    
    # Generate filename with date
    filename = f"creators_avenue_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/csv; charset=utf-8"
        }
    )


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

@router.get("/creators/{creator_id}/reviews", response_model=dict)
async def get_creator_reviews(
    creator_id: str,
    request: Request
):
    """Get all reviews for a specific creator"""
    await require_admin(request)
    db = await get_db()
    
    # Verify creator exists
    creator = await db.ugc_creators.find_one({"id": creator_id})
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    # Get all ratings/reviews for this creator
    reviews = await db.ugc_ratings.find(
        {"creator_id": creator_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with brand names
    for review in reviews:
        if review.get("brand_id"):
            brand = await db.ugc_brands.find_one(
                {"id": review["brand_id"]},
                {"_id": 0, "company_name": 1, "contact_name": 1}
            )
            if brand:
                review["brand_name"] = brand.get("company_name") or brand.get("contact_name")
    
    return {
        "reviews": reviews,
        "total": len(reviews),
        "creator_name": creator.get("name")
    }

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


@router.get("/campaigns/{campaign_id}/applications", response_model=dict)
async def admin_get_campaign_applications(
    campaign_id: str,
    status: Optional[str] = None,
    request: Request = None
):
    """Admin gets all applications for a campaign with enriched creator data"""
    await require_admin(request)
    db = await get_db()
    
    # Verify campaign exists
    campaign = await db.ugc_campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    # Build query
    query = {"campaign_id": campaign_id}
    if status:
        query["status"] = status
    
    # Get applications
    applications = await db.ugc_applications.find(
        query,
        {"_id": 0}
    ).sort("applied_at", -1).to_list(500)
    
    # Enrich with creator profiles and social accounts
    for app in applications:
        creator = await db.ugc_creators.find_one(
            {"id": app["creator_id"]},
            {"_id": 0}
        )
        if creator:
            creator_id = creator.get("id")
            
            # Include verified social accounts info
            social_accounts = creator.get("social_accounts", {})
            creator["verified_instagram"] = social_accounts.get("instagram")
            creator["verified_tiktok"] = social_accounts.get("tiktok")
            
            # Get campaigns participated count
            campaigns_participated = await db.ugc_applications.count_documents({
                "creator_id": creator_id,
                "status": {"$in": ["confirmed", "completed"]}
            })
            creator["campaigns_participated"] = campaigns_participated
            
            # Get creator metrics for averages
            all_metrics = await db.ugc_metrics.find(
                {"creator_id": creator_id},
                {"_id": 0, "views": 1, "reach": 1, "likes": 1, "comments": 1, "shares": 1, "saves": 1}
            ).to_list(100)
            
            num_metrics = len(all_metrics) or 1
            total_views = sum(m.get("views", 0) for m in all_metrics)
            total_reach = sum(m.get("reach", 0) for m in all_metrics)
            total_interactions = sum(
                m.get("likes", 0) + m.get("comments", 0) + m.get("shares", 0) + m.get("saves", 0)
                for m in all_metrics
            )
            
            creator["avg_views"] = round(total_views / num_metrics) if all_metrics else 0
            creator["avg_reach"] = round(total_reach / num_metrics) if all_metrics else 0
            creator["avg_interactions"] = round(total_interactions / num_metrics) if all_metrics else 0
            creator["total_metrics"] = len(all_metrics)
            
            # Get creator rating
            ratings = await db.ugc_ratings.find(
                {"creator_id": creator_id},
                {"_id": 0, "rating": 1}
            ).to_list(100)
            creator["avg_rating"] = round(sum(r.get("rating", 0) for r in ratings) / len(ratings), 1) if ratings else 0
            creator["total_reviews"] = len(ratings)
            
            app["creator"] = creator
        else:
            app["creator"] = None
    
    return {
        "applications": applications, 
        "total": len(applications),
        "campaign_name": campaign.get("name")
    }


@router.put("/applications/{application_id}/status", response_model=dict)
async def admin_update_application_status(
    application_id: str,
    status: str,
    reason: Optional[str] = None,
    request: Request = None
):
    """Admin updates application status (shortlist/confirm/reject/cancel)"""
    await require_admin(request)
    db = await get_db()
    
    application = await db.ugc_applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    
    campaign = await db.ugc_campaigns.find_one({"id": application["campaign_id"]})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    old_status = application.get("status")
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "status": status,
        "updated_at": now
    }
    
    if reason:
        update_data["cancellation_reason"] = reason
    
    # Handle confirmation
    if status == "confirmed" and old_status != "confirmed":
        # Check slots
        slots_filled = campaign.get("slots_filled", 0) or 0
        total_slots = campaign.get("slots", 0) or 0
        available = campaign.get("available_slots", total_slots - slots_filled)
        
        if available <= 0:
            raise HTTPException(status_code=400, detail="No hay más cupos disponibles")
        
        update_data["confirmed_at"] = now
        
        # Increment slots_filled
        await db.ugc_campaigns.update_one(
            {"id": campaign["id"]},
            {"$inc": {"slots_filled": 1}}
        )
        
        # Create deliverable for this creator
        from models.ugc_models import DeliverableStatus
        
        creator = await db.ugc_creators.find_one({"id": application["creator_id"]})
        platform = "instagram"  # Default
        if creator:
            social_accounts = creator.get("social_accounts", {})
            if social_accounts.get("instagram"):
                platform = "instagram"
            elif social_accounts.get("tiktok"):
                platform = "tiktok"
            elif creator.get("social_networks"):
                platform = creator["social_networks"][0].get("platform", "instagram")
        
        deliverable = {
            "id": str(uuid.uuid4()),
            "campaign_id": campaign["id"],
            "application_id": application_id,
            "creator_id": application["creator_id"],
            "brand_id": campaign["brand_id"],
            "platform": platform,
            "status": DeliverableStatus.AWAITING_PUBLISH,
            "created_at": now,
            "updated_at": now
        }
        
        await db.ugc_deliverables.insert_one(deliverable)
    
    # Handle cancellation of confirmed creator
    if status == "cancelled" and old_status == "confirmed":
        update_data["cancelled_at"] = now
        update_data["cancelled_by"] = "admin"
        
        # Decrement slots_filled to free up the slot
        await db.ugc_campaigns.update_one(
            {"id": campaign["id"]},
            {"$inc": {"slots_filled": -1}}
        )
        
        # Mark deliverable as cancelled
        await db.ugc_deliverables.update_many(
            {"application_id": application_id},
            {"$set": {"status": "cancelled", "cancelled_at": now}}
        )
    
    await db.ugc_applications.update_one(
        {"id": application_id},
        {"$set": update_data}
    )
    
    # Send email notifications
    try:
        from services.ugc_emails import (
            send_application_confirmed, 
            send_application_rejected,
            send_application_cancelled_by_admin,
            send_creator_confirmed_to_brand,
            send_admin_notification,
            send_admin_creator_cancelled
        )
        
        creator = await db.ugc_creators.find_one({"id": application["creator_id"]})
        if creator:
            creator_email = creator.get("email")
            creator_name = creator.get("name", "Creador")
            campaign_name = campaign.get("name", "Campaña")
            
            # Get brand info
            brand = await db.ugc_brands.find_one({"id": campaign["brand_id"]})
            brand_name = brand.get("company_name", "Avenue") if brand else "Avenue"
            brand_email = brand.get("email") if brand else None
            
            if status == "confirmed" and creator_email:
                # Get creator level
                creator_level = creator.get("level", "rookie")
                
                # Email al creador con datos de campaña para IA
                await send_application_confirmed(
                    to_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign_name,
                    brand_name=brand_name,
                    campaign_data=campaign,  # Pass full campaign data for AI email generation
                    creator_level=creator_level
                )
                print(f"[Email] Confirmation sent to {creator_email} (level: {creator_level})")
                
                # Email a la marca notificando que se confirmó
                if brand_email:
                    await send_creator_confirmed_to_brand(
                        to_email=brand_email,
                        brand_name=brand_name,
                        campaign_name=campaign_name,
                        creator_name=creator_name
                    )
                    print(f"[Email] Brand notified: {brand_email}")
                
                # Email al admin UGC notificando la confirmación
                admin_content = f"""
                    <h2 style="color: #22c55e; margin: 0 0 15px 0;">✅ Creador Confirmado</h2>
                    <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name} ({creator_email})</p>
                    <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
                    <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
                """
                await send_admin_notification(f"✅ Confirmado: {creator_name} → {campaign_name}", admin_content)
                print(f"[Email] Admin UGC notified of confirmation")
                    
            elif status == "rejected" and creator_email:
                await send_application_rejected(
                    to_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign_name,
                    reason=reason
                )
                print(f"[Email] Rejection sent to {creator_email}")
            elif status == "cancelled" and creator_email:
                # Send cancellation email usando la nueva función
                await send_application_cancelled_by_admin(
                    to_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign_name,
                    brand_name=brand_name,
                    reason=reason
                )
                print(f"[Email] Cancellation sent to {creator_email}")
                
                # Notificar al admin también
                await send_admin_creator_cancelled(
                    creator_name=creator_name,
                    creator_email=creator_email,
                    campaign_name=campaign_name,
                    brand_name=brand_name
                )
    except Exception as e:
        print(f"[Email Error] Failed to send notification: {e}")
    
    return {
        "success": True,
        "message": f"Aplicación actualizada a {status}",
        "application_id": application_id
    }


@router.put("/campaigns/{campaign_id}/transfer", response_model=dict)
async def admin_transfer_campaign_ownership(
    campaign_id: str,
    new_brand_email: str,
    request: Request = None
):
    """Admin transfers campaign ownership to a different brand (by email)"""
    await require_admin(request)
    db = await get_db()
    
    # Find the campaign
    campaign = await db.ugc_campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    # Find the user by email
    user = await db.users.find_one({"email": new_brand_email})
    if not user:
        raise HTTPException(status_code=404, detail=f"Usuario con email {new_brand_email} no encontrado")
    
    user_id = user.get("user_id") or user.get("id")
    
    # Find or create brand profile for this user
    brand = await db.ugc_brands.find_one({"user_id": user_id})
    if not brand:
        raise HTTPException(status_code=404, detail=f"El usuario {new_brand_email} no tiene perfil de marca. Debe registrarse como marca primero.")
    
    old_brand_id = campaign.get("brand_id")
    new_brand_id = brand["id"]
    
    # Update campaign
    await db.ugc_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "brand_id": new_brand_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Also update any deliverables associated with this campaign
    await db.ugc_deliverables.update_many(
        {"campaign_id": campaign_id},
        {"$set": {"brand_id": new_brand_id}}
    )
    
    return {
        "success": True,
        "message": f"Campaña transferida a {new_brand_email}",
        "campaign_id": campaign_id,
        "old_brand_id": old_brand_id,
        "new_brand_id": new_brand_id,
        "new_brand_name": brand.get("company_name")
    }


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



# ==================== CREATORS REPORT ====================

@router.get("/creators-report", response_model=dict)
async def get_creators_report(
    request: Request,
    level: Optional[str] = None,
    search: Optional[str] = None,
    platform: Optional[str] = None  # instagram, tiktok, all
):
    """Get detailed report of all creators with their metrics (averages and totals)"""
    await require_admin(request)
    db = await get_db()
    import random
    
    # Build query
    query = {}
    if level:
        query["level"] = level
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"instagram_handle": {"$regex": search, "$options": "i"}},
            {"tiktok_handle": {"$regex": search, "$options": "i"}}
        ]
    
    # Get all creators
    creators = await db.ugc_creators.find(
        query,
        {"_id": 0}
    ).sort("name", 1).to_list(1000)
    
    creators_report = []
    
    for creator in creators:
        creator_id = creator.get("id")
        
        # Build metrics query with platform filter
        metrics_query = {"creator_id": creator_id}
        if platform and platform != 'all':
            metrics_query["platform"] = platform
        
        # Get all metrics for this creator
        all_metrics = await db.ugc_metrics.find(
            metrics_query,
            {"_id": 0}
        ).to_list(500)
        
        # Count campaigns
        campaigns_count = len(set(m.get("campaign_id") for m in all_metrics if m.get("campaign_id")))
        
        # Calculate TOTALS
        total_views = sum(m.get("views", 0) for m in all_metrics)
        total_reach = sum(m.get("reach", 0) for m in all_metrics)
        total_likes = sum(m.get("likes", 0) for m in all_metrics)
        total_comments = sum(m.get("comments", 0) for m in all_metrics)
        total_shares = sum(m.get("shares", 0) for m in all_metrics)
        total_saves = sum(m.get("saves", 0) for m in all_metrics)
        total_interactions = total_likes + total_comments + total_shares + total_saves
        total_watch_time = sum(m.get("watch_time", m.get("views", 0) * 0.5) for m in all_metrics)
        
        # Calculate AVERAGES
        num_metrics = len(all_metrics) or 1
        avg_views = total_views / num_metrics
        avg_reach = total_reach / num_metrics
        avg_likes = total_likes / num_metrics
        avg_comments = total_comments / num_metrics
        avg_shares = total_shares / num_metrics
        avg_saves = total_saves / num_metrics
        avg_interactions = total_interactions / num_metrics
        avg_watch_time = total_watch_time / num_metrics
        
        # Calculate rates
        avg_interaction_rate = (avg_interactions / avg_reach * 100) if avg_reach > 0 else 0
        total_interaction_rate = (total_interactions / total_reach * 100) if total_reach > 0 else 0
        
        # Calculate retention rate (assuming 30s avg video length)
        avg_video_length = 30
        avg_watch_per_view = avg_watch_time / (avg_views or 1)
        avg_retention_rate = min((avg_watch_per_view / avg_video_length * 100), 100) if avg_video_length > 0 else 0
        
        # Get average rating
        ratings = await db.ugc_ratings.find(
            {"creator_id": creator_id},
            {"_id": 0, "rating": 1}
        ).to_list(100)
        avg_rating = sum(r.get("rating", 0) for r in ratings) / len(ratings) if ratings else 0
        
        # Calculate DOT% (Delivery On Time Percentage)
        deliverables = await db.ugc_deliverables.find(
            {"creator_id": creator_id},
            {"_id": 0, "is_on_time": 1, "status": 1}
        ).to_list(100)
        
        total_deliveries = 0
        on_time_deliveries = 0
        total_delay_days = 0
        late_count = 0
        
        for d in deliverables:
            if d.get("status") in ["submitted", "approved", "completed", "metrics_submitted", "metrics_pending"]:
                total_deliveries += 1
                if d.get("is_on_time", True):
                    on_time_deliveries += 1
                else:
                    late_count += 1
                    total_delay_days += random.uniform(1, 5)
        
        total_events = total_deliveries * 2
        on_time_events = on_time_deliveries * 2 + (total_deliveries - on_time_deliveries)
        
        dot_percent = (on_time_events / total_events * 100) if total_events > 0 else 100
        avg_delay = total_delay_days / late_count if late_count > 0 else 0
        
        # Count confirmed campaigns
        confirmed_campaigns = await db.ugc_applications.count_documents({
            "creator_id": creator_id,
            "status": {"$in": ["confirmed", "completed"]}
        })
        
        creators_report.append({
            "id": creator_id,
            "name": creator.get("name", "Sin nombre"),
            "instagram_handle": creator.get("instagram_handle"),
            "tiktok_handle": creator.get("tiktok_handle"),
            "level": creator.get("level", "rookie"),
            "is_active": creator.get("is_active", True),
            "campaigns_count": confirmed_campaigns,
            "metrics_count": len(all_metrics),
            # Totals
            "total_views": round(total_views, 0),
            "total_reach": round(total_reach, 0),
            "total_likes": round(total_likes, 0),
            "total_comments": round(total_comments, 0),
            "total_shares": round(total_shares, 0),
            "total_saves": round(total_saves, 0),
            "total_interactions": round(total_interactions, 0),
            "total_watch_time": round(total_watch_time, 1),
            "total_interaction_rate": round(total_interaction_rate, 2),
            # Averages
            "avg_views": round(avg_views, 0),
            "avg_reach": round(avg_reach, 0),
            "avg_likes": round(avg_likes, 0),
            "avg_comments": round(avg_comments, 0),
            "avg_shares": round(avg_shares, 0),
            "avg_saves": round(avg_saves, 0),
            "avg_interactions": round(avg_interactions, 0),
            "avg_watch_time": round(avg_watch_time, 1),
            "avg_interaction_rate": round(avg_interaction_rate, 2),
            "avg_retention_rate": round(avg_retention_rate, 2),
            # Other
            "avg_rating": round(avg_rating, 2),
            "dot_percent": round(dot_percent, 1),
            "avg_delay": round(avg_delay, 1)
        })
    
    return {
        "creators": creators_report,
        "total": len(creators_report)
    }


@router.get("/creators/{creator_id}/metrics-detail", response_model=dict)
async def get_creator_metrics_detail(
    request: Request,
    creator_id: str,
    platform: Optional[str] = None  # instagram, tiktok, all
):
    """Get detailed metrics for a specific creator, grouped by campaign"""
    await require_admin(request)
    db = await get_db()
    
    # Get creator info
    creator = await db.ugc_creators.find_one(
        {"id": creator_id},
        {"_id": 0}
    )
    
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    # Build metrics query with platform filter
    metrics_query = {"creator_id": creator_id}
    if platform and platform != 'all':
        metrics_query["platform"] = platform
    
    # Get all metrics
    all_metrics = await db.ugc_metrics.find(
        metrics_query,
        {"_id": 0}
    ).sort("submitted_at", -1).to_list(500)
    
    # Group metrics by campaign
    campaign_ids = list(set(m.get("campaign_id") for m in all_metrics if m.get("campaign_id")))
    
    campaigns_data = []
    
    for campaign_id in campaign_ids:
        # Get campaign info
        campaign = await db.ugc_campaigns.find_one(
            {"id": campaign_id},
            {"_id": 0, "id": 1, "title": 1, "brand_id": 1}
        )
        
        if not campaign:
            continue
        
        # Get brand info
        brand = await db.ugc_brands.find_one(
            {"id": campaign.get("brand_id")},
            {"_id": 0, "company_name": 1}
        )
        
        # Get metrics for this campaign
        campaign_metrics = [m for m in all_metrics if m.get("campaign_id") == campaign_id]
        
        for m in campaign_metrics:
            interactions = (m.get("likes", 0) + m.get("comments", 0) + 
                          m.get("shares", 0) + m.get("saves", 0))
            reach = m.get("reach", 0)
            interaction_rate = (interactions / reach * 100) if reach > 0 else 0
            
            campaigns_data.append({
                "campaign_id": campaign_id,
                "campaign_title": campaign.get("title", "Campaña"),
                "brand_name": brand.get("company_name", "Marca") if brand else "Marca",
                "metric_id": m.get("id"),
                "platform": m.get("platform", "instagram"),
                "post_url": m.get("post_url"),
                "submitted_at": m.get("submitted_at"),
                "views": m.get("views", 0),
                "reach": reach,
                "likes": m.get("likes", 0),
                "comments": m.get("comments", 0),
                "shares": m.get("shares", 0),
                "saves": m.get("saves", 0),
                "interactions": interactions,
                "watch_time": m.get("watch_time", 0),
                "interaction_rate": round(interaction_rate, 2)
            })
    
    # Calculate totals and averages
    num_metrics = len(campaigns_data) or 1
    
    totals = {
        "views": sum(m["views"] for m in campaigns_data),
        "reach": sum(m["reach"] for m in campaigns_data),
        "likes": sum(m["likes"] for m in campaigns_data),
        "comments": sum(m["comments"] for m in campaigns_data),
        "shares": sum(m["shares"] for m in campaigns_data),
        "saves": sum(m["saves"] for m in campaigns_data),
        "interactions": sum(m["interactions"] for m in campaigns_data),
        "watch_time": sum(m["watch_time"] for m in campaigns_data)
    }
    
    totals["interaction_rate"] = round(
        (totals["interactions"] / totals["reach"] * 100) if totals["reach"] > 0 else 0, 2
    )
    
    averages = {
        "views": round(totals["views"] / num_metrics, 0),
        "reach": round(totals["reach"] / num_metrics, 0),
        "likes": round(totals["likes"] / num_metrics, 0),
        "comments": round(totals["comments"] / num_metrics, 0),
        "shares": round(totals["shares"] / num_metrics, 0),
        "saves": round(totals["saves"] / num_metrics, 0),
        "interactions": round(totals["interactions"] / num_metrics, 0),
        "watch_time": round(totals["watch_time"] / num_metrics, 1),
        "interaction_rate": round(sum(m["interaction_rate"] for m in campaigns_data) / num_metrics, 2)
    }
    
    return {
        "creator": {
            "id": creator_id,
            "name": creator.get("name"),
            "instagram_handle": creator.get("instagram_handle"),
            "tiktok_handle": creator.get("tiktok_handle"),
            "level": creator.get("level")
        },
        "campaigns_count": len(campaign_ids),
        "metrics_count": len(campaigns_data),
        "metrics": campaigns_data,
        "totals": totals,
        "averages": averages
    }


# ==================== ADMIN DELIVERABLE MANAGEMENT ====================

from pydantic import BaseModel

class UpdateUrlsRequest(BaseModel):
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None

class ResetDeliverableRequest(BaseModel):
    urls: bool = True
    metrics: bool = True

@router.post("/deliverables/{deliverable_id}/update-urls", response_model=dict)
async def admin_update_deliverable_urls(
    deliverable_id: str,
    data: UpdateUrlsRequest,
    request: Request
):
    """Admin updates the URLs of a deliverable (to fix incorrect URLs)"""
    await require_admin(request)
    db = await get_db()
    
    deliverable = await db.ugc_deliverables.find_one({"id": deliverable_id}, {"_id": 0})
    if not deliverable:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    
    # Build combined post_url
    urls = []
    if data.instagram_url:
        urls.append(data.instagram_url)
    if data.tiktok_url:
        urls.append(data.tiktok_url)
    
    post_url = " | ".join(urls) if urls else None
    
    update_data = {
        "instagram_url": data.instagram_url,
        "tiktok_url": data.tiktok_url,
        "post_url": post_url,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "admin_edited_urls_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ugc_deliverables.update_one(
        {"id": deliverable_id},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": "URLs actualizados correctamente",
        "instagram_url": data.instagram_url,
        "tiktok_url": data.tiktok_url
    }


@router.post("/deliverables/{deliverable_id}/reset", response_model=dict)
async def admin_reset_deliverable(
    deliverable_id: str,
    data: ResetDeliverableRequest,
    request: Request
):
    """Admin resets a deliverable so creator can re-submit"""
    await require_admin(request)
    db = await get_db()
    
    deliverable = await db.ugc_deliverables.find_one({"id": deliverable_id}, {"_id": 0})
    if not deliverable:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    
    update_data = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "admin_reset_at": datetime.now(timezone.utc).isoformat()
    }
    
    reset_items = []
    
    if data.urls:
        update_data["post_url"] = None
        update_data["instagram_url"] = None
        update_data["tiktok_url"] = None
        update_data["status"] = "awaiting_publish"
        reset_items.append("URLs")
    
    if data.metrics:
        update_data["metrics_submitted_at"] = None
        reset_items.append("Métricas")
        
        # Also delete associated metrics documents
        await db.ugc_metrics.delete_many({"deliverable_id": deliverable_id})
    
    await db.ugc_deliverables.update_one(
        {"id": deliverable_id},
        {"$set": update_data}
    )
    
    # TODO: Send notification to creator about the reset
    
    return {
        "success": True,
        "message": f"Entrega reseteada: {', '.join(reset_items)}",
        "reset_urls": data.urls,
        "reset_metrics": data.metrics
    }
