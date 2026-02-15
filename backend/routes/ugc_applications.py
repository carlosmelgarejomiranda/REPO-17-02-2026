"""
UGC Platform - Application Routes
"""

from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging

from models.ugc_models import (
    Application, ApplicationCreate, ApplicationStatus, ApplicationStatusUpdate,
    CampaignStatus, DeliverableStatus, ContentPlatform
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ugc/applications", tags=["UGC Applications"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def require_auth(request: Request):
    from server import require_auth as auth
    return await auth(request)

async def require_creator(request: Request):
    from server import db
    user = await require_auth(request)
    creator = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not creator:
        raise HTTPException(status_code=403, detail="Creator profile required")
    return user, creator

async def require_brand(request: Request):
    from server import db
    user = await require_auth(request)
    brand = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=403, detail="Brand profile required")
    return user, brand

# ==================== CREATOR: APPLY TO CAMPAIGN ====================

@router.post("/apply", response_model=dict)
async def apply_to_campaign(
    data: ApplicationCreate,
    request: Request
):
    """Creator applies to a campaign"""
    db = await get_db()
    user, creator = await require_creator(request)
    
    # Get campaign by id
    campaign = await db.ugc_campaigns.find_one({"id": data.campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    campaign_id = campaign["id"]
    
    if campaign["status"] != CampaignStatus.LIVE:
        raise HTTPException(status_code=400, detail="Esta campaña no está aceptando aplicaciones")
    
    # Check slots
    slots_filled = campaign.get("slots_filled", 0) or 0
    total_slots = campaign.get("slots", 0) or 0
    if slots_filled >= total_slots:
        raise HTTPException(status_code=400, detail="Esta campaña ya tiene todos los cupos llenos")
    
    # Check if already applied
    existing = await db.ugc_applications.find_one({
        "campaign_id": campaign_id,
        "creator_id": creator["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Ya aplicaste a esta campaña")
    
    # Check follower requirements
    requirements = campaign.get("requirements", {})
    min_followers = requirements.get("min_followers")
    
    if min_followers:
        # Get creator's max followers across platforms
        max_followers = 0
        for sn in creator.get("social_networks", []):
            if sn.get("followers") and sn["followers"] > max_followers:
                max_followers = sn["followers"]
        
        if max_followers < min_followers:
            raise HTTPException(
                status_code=400,
                detail=f"Esta campaña requiere mínimo {min_followers:,} seguidores. Tu máximo es {max_followers:,}"
            )
    
    # Check platform requirements
    required_platforms = requirements.get("platforms", [])
    creator_platforms = [sn["platform"] for sn in creator.get("social_networks", [])]
    
    if required_platforms:
        has_required = any(p in creator_platforms for p in required_platforms)
        if not has_required:
            raise HTTPException(
                status_code=400,
                detail=f"Esta campaña requiere una cuenta en: {', '.join(required_platforms)}"
            )
    
    # Get primary social info
    primary_social = creator.get("social_networks", [{}])[0] if creator.get("social_networks") else {}
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Use note if motivation is not provided
    motivation_text = data.motivation or data.note or ""
    
    # Get creator name from users table if not in creator profile
    creator_name = creator.get("name")
    if not creator_name:
        user_data = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "name": 1})
        creator_name = user_data.get("name", "") if user_data else ""
    
    application = {
        "id": str(uuid.uuid4()),
        "campaign_id": campaign_id,
        "creator_id": creator["id"],
        "creator_name": creator_name,
        "creator_username": primary_social.get("username", ""),
        "creator_followers": primary_social.get("followers", 0),
        "creator_rating": creator.get("stats", {}).get("avg_rating", 0),
        "creator_level": creator.get("level", "rookie"),
        "motivation": motivation_text,
        "proposed_content": data.proposed_content,
        "portfolio_links": data.portfolio_links,
        "status": ApplicationStatus.APPLIED,
        "status_history": [{
            "status": ApplicationStatus.APPLIED,
            "timestamp": now,
            "by": "creator"
        }],
        "applied_at": now,
        "updated_at": now,
        "confirmed_at": None,
        "rejected_at": None,
        "rejection_reason": None
    }
    
    await db.ugc_applications.insert_one(application)
    
    # Get brand info for notifications
    brand = await db.ugc_brands.find_one({"id": campaign["brand_id"]}, {"_id": 0, "company_name": 1, "email": 1})
    brand_name = brand.get("company_name", "Marca") if brand else "Marca"
    brand_email = brand.get("email") if brand else None
    
    # Get creator email from users table
    creator_email = user.get("email")
    
    # Send notifications
    try:
        from services.ugc_emails import (
            send_application_submitted, 
            send_new_application_to_brand,
            notify_new_campaign_application
        )
        
        # 1. Email al creador confirmando su aplicación
        await send_application_submitted(
            to_email=creator_email,
            creator_name=creator_name,
            campaign_name=campaign["name"],
            brand_name=brand_name
        )
        
        # 2. Email a la marca notificando nueva aplicación
        if brand_email:
            await send_new_application_to_brand(
                to_email=brand_email,
                brand_name=brand_name,
                campaign_name=campaign["name"],
                creator_name=creator["name"],
                creator_username=primary_social.get("username"),
                creator_followers=primary_social.get("followers", 0)
            )
        
        # 3. WhatsApp notification to admin
        await notify_new_campaign_application(
            campaign_name=campaign["name"],
            brand_name=brand_name,
            creator_name=creator["name"],
            creator_level=creator.get("level", "rookie"),
            creator_followers=primary_social.get("followers", 0)
        )
    except Exception as e:
        logger.error(f"Failed to send application notification: {e}")
    
    return {"success": True, "application_id": application["id"], "message": "Aplicación enviada"}

@router.delete("/{application_id}", response_model=dict)
async def withdraw_application(
    application_id: str,
    request: Request
):
    """Creator withdraws their application"""
    db = await get_db()
    user, creator = await require_creator(request)
    
    # Find by id
    application = await db.ugc_applications.find_one({
        "id": application_id,
        "creator_id": creator["id"]
    })
    
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    
    if application["status"] == ApplicationStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="No podés retirar una aplicación confirmada")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.ugc_applications.update_one(
        {"id": application_id},
        {
            "$set": {
                "status": ApplicationStatus.WITHDRAWN,
                "updated_at": now
            },
            "$push": {
                "status_history": {
                    "status": ApplicationStatus.WITHDRAWN,
                    "timestamp": now,
                    "by": "creator"
                }
            }
        }
    )
    
    return {"success": True, "message": "Aplicación retirada"}

# ==================== BRAND: MANAGE APPLICATIONS ====================

@router.get("/campaign/{campaign_id}", response_model=dict)
async def get_campaign_applications(
    campaign_id: str,
    status: Optional[ApplicationStatus] = None,
    request: Request = None
):
    """Get all applications for a campaign (brand only)"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Verify brand owns the campaign
    campaign = await db.ugc_campaigns.find_one({"id": campaign_id, "brand_id": brand["id"]})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    query = {"campaign_id": campaign_id}
    if status:
        query["status"] = status
    
    applications = await db.ugc_applications.find(
        query,
        {"_id": 0}
    ).sort("applied_at", -1).to_list(200)
    
    # Enrich with creator profiles
    for app in applications:
        creator = await db.ugc_creators.find_one(
            {"id": app["creator_id"]},
            {"_id": 0, "email": 0}
        )
        # Get name from users if not in creator
        if creator and not creator.get("name"):
            user_data = await db.users.find_one({"user_id": creator.get("user_id")}, {"_id": 0, "name": 1})
            if user_data:
                creator["name"] = user_data.get("name", "")
        app["creator"] = creator
    
    return {"applications": applications, "total": len(applications)}

@router.put("/{application_id}/status", response_model=dict)
async def update_application_status(
    application_id: str,
    data: ApplicationStatusUpdate,
    request: Request
):
    """Update application status (brand: shortlist/confirm/reject)"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Find application by id
    application = await db.ugc_applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    
    # Verify brand owns the campaign
    campaign = await db.ugc_campaigns.find_one({
        "id": application["campaign_id"],
        "brand_id": brand["id"]
    })
    if not campaign:
        raise HTTPException(status_code=403, detail="No tenés permiso para esta campaña")
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "status": data.status,
        "updated_at": now
    }
    
    campaign_id = campaign["id"]
    app_id = application["id"]
    
    if data.status == ApplicationStatus.CONFIRMED:
        # Check slots
        slots_filled = campaign.get("slots_filled", 0) or 0
        total_slots = campaign.get("slots", 0) or 0
        if slots_filled >= total_slots:
            raise HTTPException(status_code=400, detail="No hay más cupos disponibles")
        
        update_data["confirmed_at"] = now
        
        # Increment slots_filled
        await db.ugc_campaigns.update_one(
            {"id": campaign_id},
            {"$inc": {"slots_filled": 1}}
        )
        
        # Create deliverable for this creator
        # Determine platform from creator's social networks
        creator = await db.ugc_creators.find_one({"id": application["creator_id"]})
        platform = ContentPlatform.INSTAGRAM  # Default
        if creator and creator.get("social_networks"):
            platform = creator["social_networks"][0].get("platform", ContentPlatform.INSTAGRAM)
        
        deliverable = {
            "id": str(uuid.uuid4()),
            "application_id": app_id,
            "campaign_id": campaign_id,
            "creator_id": application["creator_id"],
            "brand_id": brand["id"],
            "platform": platform,
            "status": DeliverableStatus.AWAITING_PUBLISH,
            "status_history": [{
                "status": DeliverableStatus.AWAITING_PUBLISH,
                "timestamp": now,
                "by": "system"
            }],
            "post_url": None,
            "file_url": None,
            "evidence_urls": [],
            "published_at": None,
            "submitted_at": None,
            "delivery_lag_hours": None,
            "is_on_time": None,
            "review_round": 0,
            "review_notes": [],
            "approved_at": None,
            "metrics_window_opens": None,
            "metrics_window_closes": None,
            "metrics_submitted_at": None,
            "metrics_is_late": False,
            "created_at": now,
            "updated_at": now
        }
        
        await db.ugc_deliverables.insert_one(deliverable)
        
    elif data.status == ApplicationStatus.REJECTED:
        update_data["rejected_at"] = now
        update_data["rejection_reason"] = data.reason
    
    # Update application
    await db.ugc_applications.update_one(
        {"id": app_id},
        {
            "$set": update_data,
            "$push": {
                "status_history": {
                    "status": data.status,
                    "timestamp": now,
                    "by": user["user_id"],
                    "reason": data.reason
                }
            }
        }
    )
    
    # Send email notification to creator
    try:
        from services.ugc_emails import (
            send_application_confirmed, send_application_rejected,
            notify_creator_application_confirmed, notify_creator_application_rejected
        )
        creator = await db.ugc_creators.find_one({"id": application["creator_id"]})
        # Get email from users table
        creator_email = None
        creator_name = creator.get("name") if creator else "Creator"
        if creator and creator.get("user_id"):
            user_data = await db.users.find_one({"user_id": creator["user_id"]}, {"_id": 0, "email": 1, "name": 1})
            if user_data:
                creator_email = user_data.get("email")
                if not creator_name:
                    creator_name = user_data.get("name", "Creator")
        
        if creator_email:
            brand_name = brand.get("company_name", "")
            if data.status == ApplicationStatus.CONFIRMED:
                # Send email + WhatsApp notification
                deadline = campaign.get("timeline", {}).get("publish_deadline", "A definir")
                await notify_creator_application_confirmed(
                    creator_email=creator_email,
                    creator_name=creator_name,
                    creator_phone=creator.get("phone") if creator else None,
                    campaign_name=campaign.get("name", ""),
                    brand_name=brand_name,
                    deadline=deadline
                )
            elif data.status == ApplicationStatus.REJECTED:
                await notify_creator_application_rejected(
                    creator_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign.get("name", "")
                )
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
    
    return {"success": True, "message": f"Estado actualizado a {data.status}"}

# ==================== CREATOR: MY APPLICATIONS ====================

@router.post("/{application_id}/withdraw", response_model=dict)
async def withdraw_confirmed_application(
    application_id: str,
    request: Request
):
    """Creator withdraws their CONFIRMED application (cancels participation)"""
    db = await get_db()
    user, creator = await require_creator(request)
    
    # Find application by id
    application = await db.ugc_applications.find_one({
        "id": application_id,
        "creator_id": creator["id"]
    })
    
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    
    app_id = application["id"]
    
    # Only allow withdrawal of confirmed applications
    if application["status"] != ApplicationStatus.CONFIRMED:
        raise HTTPException(
            status_code=400, 
            detail="Solo podés cancelar aplicaciones confirmadas. Para retirar una aplicación pendiente, usá el botón de retirar."
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Get campaign to update slots
    campaign = await db.ugc_campaigns.find_one({"id": application["campaign_id"]})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    campaign_id = campaign["id"]
    
    # Update application status to CANCELLED
    await db.ugc_applications.update_one(
        {"id": app_id},
        {
            "$set": {
                "status": ApplicationStatus.CANCELLED,
                "updated_at": now,
                "cancelled_at": now,
                "cancelled_by": "creator"
            },
            "$push": {
                "status_history": {
                    "status": ApplicationStatus.CANCELLED,
                    "timestamp": now,
                    "by": "creator"
                }
            }
        }
    )
    
    # Decrement slots_filled to free up the slot
    await db.ugc_campaigns.update_one(
        {"id": campaign_id},
        {"$inc": {"slots_filled": -1}}
    )
    
    # Mark any deliverables as cancelled
    await db.ugc_deliverables.update_many(
        {"application_id": app_id},
        {"$set": {"status": "cancelled", "cancelled_at": now}}
    )
    
    # Get creator name
    creator_name = creator.get("name")
    if not creator_name:
        user_data = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "name": 1})
        creator_name = user_data.get("name", "Creator") if user_data else "Creator"
    
    # Send email notification to admin
    try:
        from services.ugc_emails import notify_application_cancelled
        brand = await db.ugc_brands.find_one({"id": campaign["brand_id"]}, {"_id": 0, "company_name": 1})
        await notify_application_cancelled(
            creator_name=creator_name,
            campaign_name=campaign.get("name", ""),
            brand_name=brand.get("company_name", "") if brand else "",
            cancelled_by="creator"
        )
    except Exception as e:
        logger.error(f"Failed to send cancellation notification: {e}")
    
    return {"success": True, "message": "Tu participación ha sido cancelada"}


@router.get("/me", response_model=dict)
async def get_my_applications(
    status: Optional[ApplicationStatus] = None,
    request: Request = None
):
    """Get current creator's applications"""
    db = await get_db()
    user, creator = await require_creator(request)
    
    query = {"creator_id": creator["id"]}
    if status:
        query["status"] = status
    
    applications = await db.ugc_applications.find(
        query,
        {"_id": 0}
    ).sort("applied_at", -1).to_list(100)
    
    # Enrich with campaign info
    for app in applications:
        campaign = await db.ugc_campaigns.find_one(
            {"id": app["campaign_id"]},
            {"_id": 0}
        )
        if campaign:
            brand = await db.ugc_brands.find_one(
                {"id": campaign["brand_id"]},
                {"_id": 0, "company_name": 1, "logo_url": 1}
            )
            campaign["brand"] = brand
        app["campaign"] = campaign
    
    return {"applications": applications}
