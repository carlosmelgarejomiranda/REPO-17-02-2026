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



# ==================== SYSTEM NOTIFICATIONS (ADMIN) ====================

class SystemNotificationType:
    BACKUP_SUCCESS = "backup_success"
    BACKUP_FAILED = "backup_failed"
    ERROR_ALERT = "error_alert"
    UPTIME_ALERT = "uptime_alert"
    SECURITY_ALERT = "security_alert"
    SYSTEM_INFO = "system_info"

async def create_system_notification(
    notification_type: str,
    title: str,
    message: str,
    severity: str = "info",  # info, warning, error, critical
    metadata: Optional[dict] = None
) -> dict:
    """Create a system notification visible to all admins"""
    db = await get_db()
    
    notification = {
        "id": str(uuid.uuid4()),
        "type": notification_type,
        "title": title,
        "message": message,
        "severity": severity,
        "metadata": metadata or {},
        "is_read": False,
        "read_by": [],  # List of admin user_ids who have read this
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.system_notifications.insert_one(notification)
    return notification

@router.get("/system", response_model=dict)
async def get_system_notifications(
    request: Request,
    unread_only: bool = False,
    limit: int = 50
):
    """Get system notifications (admin only)"""
    db = await get_db()
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Only admins can see system notifications
    if user.get("role") not in ["admin", "superadmin", "staff"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if unread_only:
        # Unread means user hasn't read it yet
        query["read_by"] = {"$ne": user["user_id"]}
    
    notifications = await db.system_notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Count unread for this user
    unread_count = await db.system_notifications.count_documents({
        "read_by": {"$ne": user["user_id"]}
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total": len(notifications)
    }

@router.post("/system/{notification_id}/mark-read", response_model=dict)
async def mark_system_notification_read(
    notification_id: str,
    request: Request
):
    """Mark a system notification as read by current admin"""
    db = await get_db()
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user.get("role") not in ["admin", "superadmin", "staff"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Add user to read_by list
    result = await db.system_notifications.update_one(
        {"id": notification_id},
        {"$addToSet": {"read_by": user["user_id"]}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True}

@router.post("/system/mark-all-read", response_model=dict)
async def mark_all_system_notifications_read(request: Request):
    """Mark all system notifications as read by current admin"""
    db = await get_db()
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user.get("role") not in ["admin", "superadmin", "staff"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.system_notifications.update_many(
        {"read_by": {"$ne": user["user_id"]}},
        {"$addToSet": {"read_by": user["user_id"]}}
    )
    
    return {"marked_count": result.modified_count}

@router.delete("/system/{notification_id}", response_model=dict)
async def delete_system_notification(
    notification_id: str,
    request: Request
):
    """Delete a system notification (superadmin only)"""
    db = await get_db()
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    
    result = await db.system_notifications.delete_one({"id": notification_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True}



# ==================== EXTERNAL WEBHOOKS ====================

@router.post("/webhooks/sentry", response_model=dict)
async def sentry_webhook(request: Request):
    """
    Webhook endpoint for Sentry alerts.
    Configure in Sentry: Settings > Integrations > Webhooks
    URL: https://your-domain.com/api/notifications/webhooks/sentry
    """
    try:
        payload = await request.json()
        
        # Extract relevant info from Sentry webhook
        event_data = payload.get("data", {})
        event = event_data.get("event", {})
        
        # Get error details
        title = event.get("title", payload.get("message", "Error en Sentry"))
        culprit = event.get("culprit", "Desconocido")
        url = payload.get("url", "")
        project = payload.get("project_name", payload.get("project", "Avenue"))
        level = event.get("level", payload.get("level", "error"))
        
        # Determine severity
        severity_map = {
            "fatal": "critical",
            "error": "error",
            "warning": "warning",
            "info": "info"
        }
        severity = severity_map.get(level, "error")
        
        # Create notification
        await create_system_notification(
            notification_type=SystemNotificationType.ERROR_ALERT,
            title=f"🚨 Sentry: {title[:50]}{'...' if len(title) > 50 else ''}",
            message=f"Error en {culprit}. Proyecto: {project}",
            severity=severity,
            metadata={
                "source": "sentry",
                "project": project,
                "culprit": culprit,
                "level": level,
                "url": url,
                "raw_event": event.get("event_id")
            }
        )
        
        return {"status": "ok", "message": "Notification created"}
        
    except Exception as e:
        # Log but don't fail - webhooks should return 200
        import logging
        logging.error(f"Sentry webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/webhooks/uptimerobot", response_model=dict)
async def uptimerobot_webhook(request: Request):
    """
    Webhook endpoint for UptimeRobot alerts.
    Configure in UptimeRobot: My Settings > Add Alert Contact > Webhook
    URL: https://your-domain.com/api/notifications/webhooks/uptimerobot
    POST Type: Send as JSON
    """
    try:
        # UptimeRobot can send form data or JSON
        content_type = request.headers.get("content-type", "")
        
        if "application/json" in content_type:
            payload = await request.json()
        else:
            form = await request.form()
            payload = dict(form)
        
        # Extract UptimeRobot fields
        monitor_name = payload.get("monitorFriendlyName", payload.get("monitor", "Monitor"))
        alert_type = payload.get("alertType", payload.get("alertTypeFriendlyName", "unknown"))
        alert_details = payload.get("alertDetails", payload.get("alertDetail", ""))
        monitor_url = payload.get("monitorURL", "")
        
        # Determine if it's down (1) or up (2)
        alert_type_id = payload.get("alertType", 0)
        try:
            alert_type_id = int(alert_type_id)
        except:
            alert_type_id = 0
        
        is_down = alert_type_id == 1 or "down" in str(alert_type).lower()
        
        if is_down:
            title = f"🔴 CAÍDO: {monitor_name}"
            message = f"El servicio {monitor_name} está caído. {alert_details}"
            severity = "critical"
        else:
            title = f"🟢 RECUPERADO: {monitor_name}"
            message = f"El servicio {monitor_name} está funcionando nuevamente."
            severity = "info"
        
        # Create notification
        await create_system_notification(
            notification_type=SystemNotificationType.UPTIME_ALERT,
            title=title,
            message=message,
            severity=severity,
            metadata={
                "source": "uptimerobot",
                "monitor_name": monitor_name,
                "monitor_url": monitor_url,
                "alert_type": alert_type,
                "alert_details": alert_details,
                "is_down": is_down
            }
        )
        
        return {"status": "ok", "message": "Notification created"}
        
    except Exception as e:
        import logging
        logging.error(f"UptimeRobot webhook error: {e}")
        return {"status": "error", "message": str(e)}
