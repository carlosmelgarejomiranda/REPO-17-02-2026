"""
In-App Notifications System for Avenue UGC Platform
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from models.ugc_models import NotificationType

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def get_current_user(request: Request):
    from server import get_current_user as get_user
    return await get_user(request)

# ==================== PYDANTIC MODELS ====================

class CreateNotificationRequest(BaseModel):
    user_id: str
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    metadata: Optional[dict] = None

class MarkReadRequest(BaseModel):
    notification_ids: List[str]

# ==================== HELPER: CREATE NOTIFICATION ====================

async def create_notification(
    user_id: str,
    notification_type: NotificationType,
    title: str,
    message: str,
    link: Optional[str] = None,
    metadata: Optional[dict] = None
) -> dict:
    """Create a new in-app notification for a user"""
    db = await get_db()
    
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "link": link,
        "metadata": metadata or {},
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notification)
    return notification

# ==================== NOTIFICATION CREATORS ====================

async def notify_changes_requested(
    creator_user_id: str,
    campaign_name: str,
    brand_name: str,
    deliverable_id: str,
    notes: Optional[str] = None
):
    """Notify creator when brand requests changes"""
    message = f"La marca {brand_name} ha solicitado cambios en tu contenido para '{campaign_name}'."
    if notes:
        message += f" Nota: {notes[:100]}..."
    
    return await create_notification(
        user_id=creator_user_id,
        notification_type=NotificationType.DELIVERABLE_CHANGES_REQUESTED,
        title="Cambios Solicitados",
        message=message,
        link=f"/ugc/creator/deliverable/{deliverable_id}",
        metadata={
            "campaign_name": campaign_name,
            "brand_name": brand_name,
            "deliverable_id": deliverable_id,
            "notes": notes
        }
    )

async def notify_deliverable_approved(
    creator_user_id: str,
    campaign_name: str,
    brand_name: str,
    deliverable_id: str
):
    """Notify creator when deliverable is approved"""
    return await create_notification(
        user_id=creator_user_id,
        notification_type=NotificationType.DELIVERABLE_APPROVED,
        title="Contenido Aprobado",
        message=f"¡Tu contenido para '{campaign_name}' fue aprobado por {brand_name}!",
        link=f"/ugc/creator/deliverable/{deliverable_id}",
        metadata={
            "campaign_name": campaign_name,
            "brand_name": brand_name,
            "deliverable_id": deliverable_id
        }
    )

async def notify_application_approved(
    creator_user_id: str,
    campaign_name: str,
    brand_name: str,
    campaign_id: str
):
    """Notify creator when application is approved"""
    return await create_notification(
        user_id=creator_user_id,
        notification_type=NotificationType.CAMPAIGN_APPLICATION_APPROVED,
        title="Aplicación Aceptada",
        message=f"¡Felicitaciones! Fuiste seleccionado para la campaña '{campaign_name}' de {brand_name}.",
        link=f"/ugc/creator/campaigns",
        metadata={
            "campaign_name": campaign_name,
            "brand_name": brand_name,
            "campaign_id": campaign_id
        }
    )

async def notify_application_rejected(
    creator_user_id: str,
    campaign_name: str,
    brand_name: str
):
    """Notify creator when application is rejected"""
    return await create_notification(
        user_id=creator_user_id,
        notification_type=NotificationType.CAMPAIGN_APPLICATION_REJECTED,
        title="Aplicación No Seleccionada",
        message=f"Tu aplicación para '{campaign_name}' de {brand_name} no fue seleccionada. ¡Seguí aplicando a otras campañas!",
        link="/ugc/creator/campaigns",
        metadata={
            "campaign_name": campaign_name,
            "brand_name": brand_name
        }
    )

async def notify_new_rating(
    creator_user_id: str,
    campaign_name: str,
    brand_name: str,
    rating: float,
    feedback: Optional[str] = None
):
    """Notify creator when they receive a new rating"""
    return await create_notification(
        user_id=creator_user_id,
        notification_type=NotificationType.NEW_RATING_RECEIVED,
        title="Nueva Calificación",
        message=f"Recibiste una calificación de {rating}⭐ de {brand_name} por '{campaign_name}'",
        link="/ugc/creator/reports",
        metadata={
            "campaign_name": campaign_name,
            "brand_name": brand_name,
            "rating": rating,
            "feedback": feedback
        }
    )

async def notify_level_up(
    creator_user_id: str,
    new_level: str
):
    """Notify creator when they level up"""
    level_names = {
        "trusted": "Trusted",
        "pro": "Pro",
        "elite": "Elite"
    }
    level_name = level_names.get(new_level, new_level.capitalize())
    
    return await create_notification(
        user_id=creator_user_id,
        notification_type=NotificationType.LEVEL_UP,
        title="¡Subiste de Nivel!",
        message=f"¡Felicitaciones! Ahora sos un Creator {level_name}. Desbloqueas nuevos beneficios.",
        link="/ugc/creator/profile",
        metadata={"new_level": new_level}
    )

async def notify_metrics_submitted_to_brand(
    brand_user_id: str,
    creator_name: str,
    campaign_name: str,
    deliverable_id: str
):
    """Notify brand when creator submits metrics"""
    return await create_notification(
        user_id=brand_user_id,
        notification_type=NotificationType.METRICS_SUBMITTED,
        title="Métricas Recibidas",
        message=f"{creator_name} envió las métricas para la campaña '{campaign_name}'",
        link=f"/ugc/brand/deliverables/{deliverable_id}",
        metadata={
            "creator_name": creator_name,
            "campaign_name": campaign_name,
            "deliverable_id": deliverable_id
        }
    )

async def notify_deliverable_submitted_to_brand(
    brand_user_id: str,
    creator_name: str,
    campaign_name: str,
    deliverable_id: str
):
    """Notify brand when creator submits deliverable"""
    return await create_notification(
        user_id=brand_user_id,
        notification_type=NotificationType.DELIVERABLE_SUBMITTED,
        title="Entrega Recibida",
        message=f"{creator_name} envió su contenido para '{campaign_name}'",
        link=f"/ugc/brand/deliverables",
        metadata={
            "creator_name": creator_name,
            "campaign_name": campaign_name,
            "deliverable_id": deliverable_id
        }
    )

# ==================== API ENDPOINTS ====================

@router.get("/me", response_model=dict)
async def get_my_notifications(
    request: Request,
    unread_only: bool = False,
    limit: int = 50
):
    """Get current user's notifications"""
    db = await get_db()
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {"user_id": user["user_id"]}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get unread count
    unread_count = await db.notifications.count_documents({
        "user_id": user["user_id"],
        "is_read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.get("/unread-count", response_model=dict)
async def get_unread_count(request: Request):
    """Get count of unread notifications"""
    db = await get_db()
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    count = await db.notifications.count_documents({
        "user_id": user["user_id"],
        "is_read": False
    })
    
    return {"unread_count": count}

@router.post("/mark-read", response_model=dict)
async def mark_notifications_read(
    request: Request,
    body: MarkReadRequest
):
    """Mark specific notifications as read"""
    db = await get_db()
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.notifications.update_many(
        {
            "id": {"$in": body.notification_ids},
            "user_id": user["user_id"]
        },
        {"$set": {"is_read": True}}
    )
    
    return {"marked_count": result.modified_count}

@router.post("/mark-all-read", response_model=dict)
async def mark_all_read(request: Request):
    """Mark all notifications as read"""
    db = await get_db()
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.notifications.update_many(
        {"user_id": user["user_id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"marked_count": result.modified_count}

@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str,
    request: Request
):
    """Delete a notification"""
    db = await get_db()
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.notifications.delete_one({
        "id": notification_id,
        "user_id": user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True}
