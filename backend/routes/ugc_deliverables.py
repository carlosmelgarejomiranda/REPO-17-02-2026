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
    
    return {"success": True, "message": message}
