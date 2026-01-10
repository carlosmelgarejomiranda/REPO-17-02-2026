"""
UGC Platform - Deliverable Routes
"""

from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging

from models.ugc_models import (
    Deliverable, DeliverableSubmit, DeliverableReview, DeliverableStatus
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ugc/deliverables", tags=["UGC Deliverables"])

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

# ==================== CREATOR: MANAGE DELIVERABLES ====================

@router.get("/me", response_model=dict)
async def get_my_deliverables(
    status: Optional[DeliverableStatus] = None,
    request: Request = None
):
    """Get creator's deliverables"""
    db = await get_db()
    user, creator = await require_creator(request)
    
    query = {"creator_id": creator["id"]}
    if status:
        query["status"] = status
    
    deliverables = await db.ugc_deliverables.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with campaign info
    for d in deliverables:
        campaign = await db.ugc_campaigns.find_one(
            {"id": d["campaign_id"]},
            {"_id": 0, "name": 1, "requirements": 1, "canje": 1, "timeline": 1}
        )
        brand = await db.ugc_brands.find_one(
            {"id": d["brand_id"]},
            {"_id": 0, "company_name": 1, "logo_url": 1}
        )
        d["campaign"] = campaign
        d["brand"] = brand
    
    return {"deliverables": deliverables}

@router.get("/{deliverable_id}", response_model=dict)
async def get_deliverable_detail(
    deliverable_id: str,
    request: Request
):
    """Get deliverable detail"""
    db = await get_db()
    await require_auth(request)
    
    deliverable = await db.ugc_deliverables.find_one({"id": deliverable_id}, {"_id": 0})
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    # Get campaign and brand info
    campaign = await db.ugc_campaigns.find_one(
        {"id": deliverable["campaign_id"]},
        {"_id": 0}
    )
    brand = await db.ugc_brands.find_one(
        {"id": deliverable["brand_id"]},
        {"_id": 0, "company_name": 1, "logo_url": 1}
    )
    
    deliverable["campaign"] = campaign
    deliverable["brand"] = brand
    
    # Get metrics if exists
    metrics = await db.ugc_metrics.find_one(
        {"deliverable_id": deliverable_id},
        {"_id": 0}
    )
    deliverable["metrics"] = metrics
    
    return deliverable

@router.post("/{deliverable_id}/publish", response_model=dict)
async def mark_as_published(
    deliverable_id: str,
    post_url: str,
    request: Request
):
    """Creator marks content as published (registers the post URL)"""
    db = await get_db()
    user, creator = await require_creator(request)
    
    deliverable = await db.ugc_deliverables.find_one({
        "id": deliverable_id,
        "creator_id": creator["id"]
    })
    
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    if deliverable["status"] != DeliverableStatus.AWAITING_PUBLISH:
        raise HTTPException(status_code=400, detail="El contenido ya fue marcado como publicado")
    
    now = datetime.now(timezone.utc)
    
    # Calculate metrics window (7-14 days from publish)
    metrics_opens = now + timedelta(days=7)
    metrics_closes = now + timedelta(days=14)
    
    await db.ugc_deliverables.update_one(
        {"id": deliverable_id},
        {
            "$set": {
                "status": DeliverableStatus.PUBLISHED,
                "post_url": post_url,
                "published_at": now.isoformat(),
                "metrics_window_opens": metrics_opens.isoformat(),
                "metrics_window_closes": metrics_closes.isoformat(),
                "updated_at": now.isoformat()
            },
            "$push": {
                "status_history": {
                    "status": DeliverableStatus.PUBLISHED,
                    "timestamp": now.isoformat(),
                    "by": "creator"
                }
            }
        }
    )
    
    return {"success": True, "message": "Contenido marcado como publicado"}

@router.post("/{deliverable_id}/submit", response_model=dict)
async def submit_deliverable(
    deliverable_id: str,
    data: DeliverableSubmit,
    request: Request
):
    """Creator submits deliverable for review"""
    db = await get_db()
    user, creator = await require_creator(request)
    
    deliverable = await db.ugc_deliverables.find_one({
        "id": deliverable_id,
        "creator_id": creator["id"]
    })
    
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    allowed_statuses = [
        DeliverableStatus.PUBLISHED,
        DeliverableStatus.CHANGES_REQUESTED
    ]
    if deliverable["status"] not in allowed_statuses:
        raise HTTPException(status_code=400, detail="No podés enviar en este estado")
    
    now = datetime.now(timezone.utc)
    
    # Calculate delivery lag
    delivery_lag_hours = None
    is_on_time = True
    if deliverable.get("published_at"):
        published = datetime.fromisoformat(deliverable["published_at"].replace('Z', '+00:00'))
        lag = now - published
        delivery_lag_hours = lag.total_seconds() / 3600
        
        # Get campaign SLA
        campaign = await db.ugc_campaigns.find_one({"id": deliverable["campaign_id"]})
        sla_hours = campaign.get("timeline", {}).get("delivery_sla_hours", 48)
        is_on_time = delivery_lag_hours <= sla_hours
    
    new_status = DeliverableStatus.SUBMITTED
    if deliverable["status"] == DeliverableStatus.CHANGES_REQUESTED:
        new_status = DeliverableStatus.RESUBMITTED
    
    await db.ugc_deliverables.update_one(
        {"id": deliverable_id},
        {
            "$set": {
                "status": new_status,
                "post_url": data.post_url,
                "file_url": data.file_url,
                "evidence_urls": data.evidence_urls,
                "submitted_at": now.isoformat(),
                "delivery_lag_hours": delivery_lag_hours,
                "is_on_time": is_on_time,
                "updated_at": now.isoformat()
            },
            "$push": {
                "status_history": {
                    "status": new_status,
                    "timestamp": now.isoformat(),
                    "by": "creator"
                }
            }
        }
    )
    
    # Send WhatsApp notification to admin
    try:
        campaign = await db.ugc_campaigns.find_one({"id": deliverable["campaign_id"]}, {"_id": 0, "name": 1})
        delivery_number = deliverable.get("delivery_number", 1)
        from services.ugc_emails import notify_deliverable_submitted
        await notify_deliverable_submitted(
            campaign_name=campaign.get("name", "Campaña") if campaign else "Campaña",
            creator_name=creator.get("name", "Creator"),
            delivery_number=delivery_number,
            content_url=data.post_url or data.file_url or "Sin URL"
        )
    except Exception as e:
        logger.error(f"Failed to send submit notification: {e}")
    
    return {"success": True, "message": "Entrega enviada para revisión"}

# ==================== BRAND: REVIEW DELIVERABLES ====================

@router.get("/campaign/{campaign_id}", response_model=dict)
async def get_campaign_deliverables(
    campaign_id: str,
    status: Optional[DeliverableStatus] = None,
    request: Request = None
):
    """Get all deliverables for a campaign (brand only)"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Verify brand owns the campaign
    campaign = await db.ugc_campaigns.find_one({"id": campaign_id, "brand_id": brand["id"]})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    query = {"campaign_id": campaign_id}
    if status:
        query["status"] = status
    
    deliverables = await db.ugc_deliverables.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with creator info
    for d in deliverables:
        creator = await db.ugc_creators.find_one(
            {"id": d["creator_id"]},
            {"_id": 0, "name": 1, "profile_picture": 1, "social_networks": 1, "level": 1}
        )
        d["creator"] = creator
        
        # Get metrics if exists
        metrics = await db.ugc_metrics.find_one(
            {"deliverable_id": d["id"]},
            {"_id": 0}
        )
        d["metrics"] = metrics
    
    return {"deliverables": deliverables}

@router.post("/{deliverable_id}/review", response_model=dict)
async def review_deliverable(
    deliverable_id: str,
    data: DeliverableReview,
    request: Request
):
    """Brand reviews a deliverable (approve/request changes/reject)"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    deliverable = await db.ugc_deliverables.find_one({
        "id": deliverable_id,
        "brand_id": brand["id"]
    })
    
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    allowed_statuses = [
        DeliverableStatus.SUBMITTED,
        DeliverableStatus.RESUBMITTED
    ]
    if deliverable["status"] not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Este contenido no está pendiente de revisión")
    
    now = datetime.now(timezone.utc).isoformat()
    current_round = deliverable.get("review_round", 0) + 1
    
    if data.action == "approve":
        new_status = DeliverableStatus.APPROVED
        
        # Check if metrics window is open
        if deliverable.get("metrics_window_opens"):
            metrics_opens = datetime.fromisoformat(deliverable["metrics_window_opens"].replace('Z', '+00:00'))
            if datetime.now(timezone.utc) >= metrics_opens:
                new_status = DeliverableStatus.METRICS_PENDING
        
        await db.ugc_deliverables.update_one(
            {"id": deliverable_id},
            {
                "$set": {
                    "status": new_status,
                    "review_round": current_round,
                    "approved_at": now,
                    "updated_at": now
                },
                "$push": {
                    "status_history": {"status": new_status, "timestamp": now, "by": user["user_id"]},
                    "review_notes": {
                        "round": current_round,
                        "action": "approve",
                        "note": data.notes,
                        "by": user["user_id"],
                        "timestamp": now
                    }
                }
            }
        )
        
        # Decrement package deliveries
        package = await db.ugc_packages.find_one({"brand_id": brand["id"], "status": "active"})
        if package:
            await db.ugc_packages.update_one(
                {"id": package["id"]},
                {
                    "$inc": {"deliveries_used": 1, "deliveries_remaining": -1}
                }
            )
        
        message = "Contenido aprobado"
        
    elif data.action == "request_changes":
        if current_round >= 2:
            raise HTTPException(
                status_code=400,
                detail="Ya se solicitaron cambios una vez. Debés aprobar o rechazar."
            )
        
        await db.ugc_deliverables.update_one(
            {"id": deliverable_id},
            {
                "$set": {
                    "status": DeliverableStatus.CHANGES_REQUESTED,
                    "review_round": current_round,
                    "updated_at": now
                },
                "$push": {
                    "status_history": {"status": DeliverableStatus.CHANGES_REQUESTED, "timestamp": now, "by": user["user_id"]},
                    "review_notes": {
                        "round": current_round,
                        "action": "request_changes",
                        "note": data.notes,
                        "by": user["user_id"],
                        "timestamp": now
                    }
                }
            }
        )
        message = "Cambios solicitados"
        
    elif data.action == "reject":
        await db.ugc_deliverables.update_one(
            {"id": deliverable_id},
            {
                "$set": {
                    "status": DeliverableStatus.REJECTED,
                    "review_round": current_round,
                    "updated_at": now
                },
                "$push": {
                    "status_history": {"status": DeliverableStatus.REJECTED, "timestamp": now, "by": user["user_id"]},
                    "review_notes": {
                        "round": current_round,
                        "action": "reject",
                        "note": data.notes,
                        "by": user["user_id"],
                        "timestamp": now
                    }
                }
            }
        )
        message = "Contenido rechazado"
    else:
        raise HTTPException(status_code=400, detail="Acción inválida")
    
    # Send email + WhatsApp notification to creator
    try:
        from services.ugc_emails import (
            notify_deliverable_approved, notify_deliverable_changes_requested
        )
        creator = await db.ugc_creators.find_one({"id": deliverable["creator_id"]})
        campaign = await db.ugc_campaigns.find_one({"id": deliverable["campaign_id"]})
        if creator and creator.get("email") and campaign:
            if data.action == "approve":
                await notify_deliverable_approved(
                    creator_email=creator["email"],
                    creator_name=creator.get("name", "Creator"),
                    creator_phone=creator.get("phone"),
                    campaign_name=campaign.get("name", ""),
                    brand_name=brand.get("company_name", "")
                )
            elif data.action == "request_changes":
                await notify_deliverable_changes_requested(
                    creator_email=creator["email"],
                    creator_name=creator.get("name", "Creator"),
                    creator_phone=creator.get("phone"),
                    campaign_name=campaign.get("name", ""),
                    feedback=data.notes or "Sin comentarios adicionales"
                )
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
    
    return {"success": True, "message": message}

# ==================== BRAND: RATE DELIVERABLE ====================

from pydantic import BaseModel as PydanticBaseModel

class RatingInput(PydanticBaseModel):
    rating: int  # 1-5
    comment: Optional[str] = None

@router.post("/{deliverable_id}/rate", response_model=dict)
async def rate_deliverable(
    deliverable_id: str,
    data: RatingInput,
    request: Request
):
    """Brand rates a deliverable (1-5 stars) with optional private comment"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Validate rating
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="La calificación debe ser entre 1 y 5")
    
    deliverable = await db.ugc_deliverables.find_one({
        "id": deliverable_id,
        "brand_id": brand["id"]
    })
    
    if not deliverable:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    
    # Only approved deliverables can be rated
    if deliverable["status"] not in ["approved", "completed", "metrics_pending", "metrics_submitted"]:
        raise HTTPException(status_code=400, detail="Solo se pueden calificar entregas aprobadas")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Save rating
    rating_data = {
        "rating": data.rating,
        "comment": data.comment,
        "rated_by": user["user_id"],
        "rated_by_brand": brand["id"],
        "rated_at": now
    }
    
    await db.ugc_deliverables.update_one(
        {"id": deliverable_id},
        {
            "$set": {
                "brand_rating": rating_data,
                "updated_at": now
            }
        }
    )
    
    # Update creator's average rating
    creator_id = deliverable["creator_id"]
    
    # Get all ratings for this creator
    all_deliverables = await db.ugc_deliverables.find(
        {"creator_id": creator_id, "brand_rating.rating": {"$exists": True}},
        {"_id": 0, "brand_rating.rating": 1}
    ).to_list(500)
    
    if all_deliverables:
        total_ratings = sum(d["brand_rating"]["rating"] for d in all_deliverables)
        avg_rating = total_ratings / len(all_deliverables)
        
        await db.ugc_creators.update_one(
            {"id": creator_id},
            {
                "$set": {
                    "stats.avg_rating": round(avg_rating, 2),
                    "stats.total_ratings": len(all_deliverables)
                }
            }
        )
    
    # Send email notification to creator
    try:
        from services.ugc_emails import send_deliverable_rated
        creator = await db.ugc_creators.find_one({"id": creator_id}, {"_id": 0, "email": 1, "name": 1})
        campaign = await db.ugc_campaigns.find_one({"id": deliverable["campaign_id"]}, {"_id": 0, "name": 1})
        
        if creator and creator.get("email"):
            await send_deliverable_rated(
                to_email=creator["email"],
                creator_name=creator.get("name", "Creator"),
                campaign_name=campaign.get("name", "Campaña") if campaign else "Campaña",
                brand_name=brand.get("company_name", "Marca"),
                rating=data.rating,
                comment=data.comment
            )
    except Exception as e:
        logger.error(f"Failed to send rating notification email: {e}")
    
    return {"success": True, "message": "Calificación guardada"}

@router.get("/{deliverable_id}/rating", response_model=dict)
async def get_deliverable_rating(
    deliverable_id: str,
    request: Request
):
    """Get rating for a deliverable (brand, admin, or creator can see)"""
    db = await get_db()
    user = await require_auth(request)
    
    deliverable = await db.ugc_deliverables.find_one(
        {"id": deliverable_id},
        {"_id": 0, "brand_rating": 1, "creator_id": 1, "brand_id": 1}
    )
    
    if not deliverable:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    
    # Check permission: admin, brand owner, or creator
    is_admin = user.get("role") in ["admin", "superadmin"]
    
    brand = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0, "id": 1})
    is_brand_owner = brand and brand["id"] == deliverable.get("brand_id")
    
    creator = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0, "id": 1})
    is_creator = creator and creator["id"] == deliverable.get("creator_id")
    
    if not (is_admin or is_brand_owner or is_creator):
        raise HTTPException(status_code=403, detail="No tenés permiso para ver esta calificación")
    
    return {"rating": deliverable.get("brand_rating")}
