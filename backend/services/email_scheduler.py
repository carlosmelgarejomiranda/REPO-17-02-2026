"""
UGC Platform - Scheduled Email Jobs
Sistema de recordatorios automáticos diarios a las 12:00 PM Paraguay
"""

import os
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
import pytz

logger = logging.getLogger(__name__)

# Paraguay timezone
PARAGUAY_TZ = pytz.timezone('America/Asuncion')

async def get_db():
    """Get database connection"""
    from server import db
    return db


def format_date_spanish(date: datetime) -> str:
    """Format date in Spanish"""
    days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
              'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    
    day_name = days[date.weekday()]
    month_name = months[date.month - 1]
    return f"{day_name} {date.day} de {month_name}"


async def process_url_delivery_reminders():
    """
    Proceso de recordatorios de entrega de URL
    - 2 días antes hasta 6 días después de la fecha límite
    - Advertencia especial día 7 y 8
    """
    from services.ugc_emails import (
        send_url_delivery_reminder,
        send_url_warning_day7,
        send_url_warning_day8,
        send_admin_url_delay_reminder
    )
    
    db = await get_db()
    now = datetime.now(timezone.utc)
    
    # Find deliverables awaiting URL (status: awaiting_publish, changes_requested)
    # that have a content deadline set
    deliverables = await db.ugc_deliverables.find({
        "status": {"$in": ["awaiting_publish", "changes_requested"]},
        "content_deadline": {"$exists": True}
    }).to_list(None)
    
    logger.info(f"[URL REMINDERS] Processing {len(deliverables)} deliverables awaiting URL")
    
    for deliverable in deliverables:
        try:
            # Get deadline
            deadline_str = deliverable.get("content_deadline")
            if not deadline_str:
                continue
                
            deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
            days_until = (deadline.date() - now.date()).days
            
            # Only send reminders from -6 to +8 days
            if days_until < -8 or days_until > 2:
                continue
            
            # Get application to find creator and campaign
            application = await db.ugc_applications.find_one(
                {"application_id": deliverable["application_id"]},
                {"_id": 0, "creator_id": 1, "campaign_id": 1}
            )
            if not application:
                continue
            
            # Get creator info
            creator = await db.ugc_creators.find_one({"creator_id": application["creator_id"]}, {"_id": 0})
            if not creator:
                continue
            
            # Get user email
            user = await db.users.find_one({"user_id": creator.get("user_id")}, {"_id": 0})
            creator_email = user.get("email") if user else creator.get("email")
            if not creator_email:
                continue
            
            # Get campaign and brand
            campaign = await db.ugc_campaigns.find_one({"campaign_id": application["campaign_id"]}, {"_id": 0})
            brand = await db.ugc_brands.find_one({"brand_id": campaign.get("brand_id")}, {"_id": 0}) if campaign else None
            
            creator_name = creator.get("name")
            if not creator_name and user:
                creator_name = user.get("name", "Creador")
            campaign_name = campaign.get("name", "Campaña") if campaign else "Campaña"
            brand_name = brand.get("brand_name", "Marca") if brand else "Marca"
            deadline_formatted = format_date_spanish(deadline)
            
            # Send appropriate email based on days
            if days_until == -7:
                # Day 7 late - Warning
                await send_url_warning_day7(
                    to_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign_name,
                    brand_name=brand_name
                )
                logger.info(f"[URL REMINDERS] Sent day 7 warning to {creator_email}")
            elif days_until == -8:
                # Day 8 late - Final warning
                await send_url_warning_day8(
                    to_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign_name,
                    brand_name=brand_name
                )
                logger.info(f"[URL REMINDERS] Sent day 8 FINAL warning to {creator_email}")
            elif days_until >= -6:
                # Regular reminder (2 days before to 6 days after)
                await send_url_delivery_reminder(
                    to_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign_name,
                    brand_name=brand_name,
                    days_until_deadline=days_until,
                    deadline_date=deadline_formatted
                )
                # Also notify admin
                await send_admin_url_delay_reminder(
                    creator_name=creator_name,
                    creator_email=creator_email,
                    campaign_name=campaign_name,
                    brand_name=brand_name,
                    days_until_deadline=days_until,
                    deadline_date=deadline_formatted
                )
                logger.info(f"[URL REMINDERS] Sent reminder to {creator_email} - {days_until} days")
                
        except Exception as e:
            logger.error(f"[URL REMINDERS] Error processing deliverable {deliverable.get('id')}: {e}")
            continue
    
    return {"processed": len(deliverables)}


async def process_metrics_delivery_reminders():
    """
    Proceso de recordatorios de entrega de métricas
    - 2 días antes hasta 6 días después de la fecha límite
    - Advertencia especial día 7 y 8
    """
    from services.ugc_emails import (
        send_metrics_delivery_reminder,
        send_metrics_warning_day7,
        send_metrics_warning_day8,
        send_admin_metrics_delay_reminder
    )
    
    db = await get_db()
    now = datetime.now(timezone.utc)
    
    # Find deliverables with URL submitted but no metrics (status: published, submitted, etc.)
    deliverables = await db.ugc_deliverables.find({
        "status": {"$in": ["published", "submitted", "resubmitted", "under_review", "approved"]},
        "metrics_window_closes": {"$exists": True},
        "metrics_submitted_at": {"$exists": False}
    }).to_list(None)
    
    logger.info(f"[METRICS REMINDERS] Processing {len(deliverables)} deliverables awaiting metrics")
    
    for deliverable in deliverables:
        try:
            # Get deadline
            deadline_str = deliverable.get("metrics_window_closes")
            if not deadline_str:
                continue
                
            deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
            days_until = (deadline.date() - now.date()).days
            
            # Only send reminders from -6 to +8 days
            if days_until < -8 or days_until > 2:
                continue
            
            # Get creator info
            creator = await db.ugc_creators.find_one({"id": deliverable["creator_id"]}, {"_id": 0})
            if not creator:
                continue
            
            # Get user email
            user = await db.users.find_one({"user_id": creator.get("user_id")}, {"_id": 0})
            creator_email = user.get("email") if user else creator.get("email")
            if not creator_email:
                continue
            
            # Get campaign and brand
            campaign = await db.ugc_campaigns.find_one({"id": deliverable["campaign_id"]}, {"_id": 0})
            brand = await db.ugc_brands.find_one({"id": campaign.get("brand_id")}, {"_id": 0}) if campaign else None
            
            creator_name = creator.get("name", "Creador")
            campaign_name = campaign.get("name", "Campaña") if campaign else "Campaña"
            brand_name = brand.get("company_name", "Marca") if brand else "Marca"
            deadline_formatted = format_date_spanish(deadline)
            
            # Send appropriate email based on days
            if days_until == -7:
                await send_metrics_warning_day7(
                    to_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign_name,
                    brand_name=brand_name
                )
                logger.info(f"[METRICS REMINDERS] Sent day 7 warning to {creator_email}")
            elif days_until == -8:
                await send_metrics_warning_day8(
                    to_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign_name,
                    brand_name=brand_name
                )
                logger.info(f"[METRICS REMINDERS] Sent day 8 FINAL warning to {creator_email}")
            elif days_until >= -6:
                await send_metrics_delivery_reminder(
                    to_email=creator_email,
                    creator_name=creator_name,
                    campaign_name=campaign_name,
                    brand_name=brand_name,
                    days_until_deadline=days_until,
                    deadline_date=deadline_formatted
                )
                # Also notify admin
                await send_admin_metrics_delay_reminder(
                    creator_name=creator_name,
                    creator_email=creator_email,
                    campaign_name=campaign_name,
                    brand_name=brand_name,
                    days_until_deadline=days_until,
                    deadline_date=deadline_formatted
                )
                logger.info(f"[METRICS REMINDERS] Sent reminder to {creator_email} - {days_until} days")
                
        except Exception as e:
            logger.error(f"[METRICS REMINDERS] Error processing deliverable {deliverable.get('id')}: {e}")
            continue
    
    return {"processed": len(deliverables)}


async def run_daily_reminders():
    """
    Run all daily reminder jobs
    Called at 12:00 PM Paraguay time
    """
    logger.info("=" * 50)
    logger.info("[DAILY REMINDERS] Starting daily reminder job...")
    logger.info(f"[DAILY REMINDERS] Current time (Paraguay): {datetime.now(PARAGUAY_TZ)}")
    logger.info("=" * 50)
    
    try:
        # Process URL delivery reminders
        url_result = await process_url_delivery_reminders()
        logger.info(f"[DAILY REMINDERS] URL reminders processed: {url_result}")
        
        # Process metrics delivery reminders
        metrics_result = await process_metrics_delivery_reminders()
        logger.info(f"[DAILY REMINDERS] Metrics reminders processed: {metrics_result}")
        
        logger.info("[DAILY REMINDERS] Daily reminder job completed successfully")
        return {
            "status": "success",
            "url_reminders": url_result,
            "metrics_reminders": metrics_result,
            "timestamp": datetime.now(PARAGUAY_TZ).isoformat()
        }
        
    except Exception as e:
        logger.error(f"[DAILY REMINDERS] Error running daily reminders: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}


async def schedule_daily_job():
    """
    Scheduler that runs the daily reminders at 12:00 PM Paraguay time
    This should be started when the server starts
    """
    while True:
        try:
            now = datetime.now(PARAGUAY_TZ)
            
            # Calculate next 12:00 PM
            target_hour = 12
            target_minute = 0
            
            if now.hour < target_hour or (now.hour == target_hour and now.minute < target_minute):
                # Today at 12:00 PM
                next_run = now.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
            else:
                # Tomorrow at 12:00 PM
                next_run = (now + timedelta(days=1)).replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
            
            # Calculate seconds until next run
            wait_seconds = (next_run - now).total_seconds()
            
            logger.info(f"[SCHEDULER] Next daily reminders run at {next_run} (in {wait_seconds/3600:.1f} hours)")
            
            # Wait until next run time
            await asyncio.sleep(wait_seconds)
            
            # Run the daily reminders
            await run_daily_reminders()
            
            # Wait a bit to avoid running twice
            await asyncio.sleep(60)
            
        except asyncio.CancelledError:
            logger.info("[SCHEDULER] Daily reminder scheduler cancelled")
            break
        except Exception as e:
            logger.error(f"[SCHEDULER] Error in scheduler: {e}", exc_info=True)
            # Wait before retrying
            await asyncio.sleep(300)


# For manual testing via API
async def trigger_daily_reminders_manual():
    """Trigger daily reminders manually (for testing)"""
    return await run_daily_reminders()
