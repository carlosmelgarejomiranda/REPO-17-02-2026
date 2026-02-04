"""
UGC Platform - Campaign Contract Jobs
Automated tasks for:
1. Monthly slot reloading based on contract
2. Auto-rejection of pending applications 30 days after contract expiration
3. Email notifications to brands and admins
"""

from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import resend

# Configure Resend
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'avenuepy@gmail.com')

async def get_db():
    """Get database connection"""
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    return client['test_database']

def add_month(date: datetime) -> datetime:
    """Add one month to a date, handling month boundaries."""
    month = date.month + 1
    year = date.year
    day = date.day
    
    if month > 12:
        month = 1
        year += 1
    
    # Handle end of month cases
    import calendar
    max_day = calendar.monthrange(year, month)[1]
    if day > max_day:
        day = max_day
    
    return date.replace(year=year, month=month, day=day)

async def send_brand_notification(brand_email: str, brand_name: str, campaign_name: str, slots_added: int):
    """Send email notification to brand when slots are reloaded"""
    if not resend.api_key:
        print(f"[Email] Skipped - no API key. Would notify {brand_email}")
        return
    
    try:
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #d4a968; font-weight: 300; margin: 0;">
                    <em>Avenue</em> UGC
                </h1>
            </div>
            
            <p style="color: #333; font-size: 16px;">
                Hola <strong>{brand_name}</strong>,
            </p>
            
            <p style="color: #333; font-size: 16px;">
                Te informamos que se han activado <strong>{slots_added} nuevos cupos</strong> 
                para tu campaña <strong>"{campaign_name}"</strong>.
            </p>
            
            <div style="background: #f8f4ef; border-left: 4px solid #d4a968; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #555;">
                    Nuestro equipo se encargará de seleccionar los mejores creadores 
                    para representar tu marca. Te notificaremos cuando haya novedades 
                    sobre las entregas de contenido.
                </p>
            </div>
            
            <p style="color: #333; font-size: 16px;">
                Podés acceder a los reportes de tu campaña en cualquier momento desde 
                tu panel de marca.
            </p>
            
            <p style="color: #888; font-size: 14px; margin-top: 30px;">
                Saludos,<br>
                El equipo de Avenue UGC
            </p>
        </div>
        """
        
        resend.emails.send({
            "from": SENDER_EMAIL,
            "to": brand_email,
            "subject": f"🎯 Nuevos cupos activados para {campaign_name}",
            "html": html_content
        })
        print(f"[Email] Sent brand notification to {brand_email}")
    except Exception as e:
        print(f"[Email] Failed to send to {brand_email}: {e}")

async def send_admin_notification(campaigns_reloaded: list):
    """Send summary email to admin with all reloaded campaigns"""
    if not resend.api_key or not campaigns_reloaded:
        return
    
    try:
        campaigns_html = ""
        for c in campaigns_reloaded:
            campaigns_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{c['campaign_name']}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{c['brand_name']}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    <strong style="color: #d4a968;">+{c['slots_added']}</strong>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    {c['available_slots']}
                </td>
            </tr>
            """
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #d4a968; font-weight: 300; margin: 0;">
                    <em>Avenue</em> UGC - Admin
                </h1>
            </div>
            
            <h2 style="color: #333; font-weight: 400;">📊 Resumen de Recarga de Cupos</h2>
            
            <p style="color: #555;">
                Se han recargado cupos en <strong>{len(campaigns_reloaded)} campaña(s)</strong>.
                A continuación el detalle:
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #f8f4ef;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d4a968;">Campaña</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d4a968;">Marca</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #d4a968;">Cupos Añadidos</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #d4a968;">Disponibles</th>
                    </tr>
                </thead>
                <tbody>
                    {campaigns_html}
                </tbody>
            </table>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                    <strong>⚡ Acción requerida:</strong> Revisá las campañas con cupos disponibles 
                    para confirmar creadores pendientes.
                </p>
            </div>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px;">
                Este es un mensaje automático del sistema de Avenue UGC.
            </p>
        </div>
        """
        
        resend.emails.send({
            "from": SENDER_EMAIL,
            "to": ADMIN_EMAIL,
            "subject": f"⚡ [{len(campaigns_reloaded)}] Campañas con cupos recargados - Acción requerida",
            "html": html_content
        })
        print(f"[Email] Sent admin summary to {ADMIN_EMAIL}")
    except Exception as e:
        print(f"[Email] Failed to send admin summary: {e}")

async def send_rejection_notification(creator_email: str, creator_name: str, campaign_name: str):
    """Send email to creator when application is auto-rejected"""
    if not resend.api_key:
        return
    
    try:
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #d4a968; font-weight: 300; margin: 0;">
                    <em>Avenue</em> UGC
                </h1>
            </div>
            
            <p style="color: #333; font-size: 16px;">
                Hola <strong>{creator_name}</strong>,
            </p>
            
            <p style="color: #333; font-size: 16px;">
                Te informamos que tu aplicación a la campaña <strong>"{campaign_name}"</strong> 
                ha sido cerrada debido a que el período de la campaña ha finalizado.
            </p>
            
            <p style="color: #555; font-size: 15px;">
                ¡No te preocupes! Hay muchas más oportunidades esperándote. 
                Revisá las campañas disponibles en tu panel de creador.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://ugc-system-manual.preview.emergentagent.com/ugc/campaigns" 
                   style="background: #d4a968; color: #000; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Ver Campañas Disponibles
                </a>
            </div>
            
            <p style="color: #888; font-size: 14px; margin-top: 30px;">
                Saludos,<br>
                El equipo de Avenue UGC
            </p>
        </div>
        """
        
        resend.emails.send({
            "from": SENDER_EMAIL,
            "to": creator_email,
            "subject": f"Actualización sobre tu aplicación a {campaign_name}",
            "html": html_content
        })
        print(f"[Email] Sent rejection notification to {creator_email}")
    except Exception as e:
        print(f"[Email] Failed to send rejection to {creator_email}: {e}")

async def reload_campaign_slots():
    """
    Check all active campaigns and reload slots if reload date has passed.
    """
    db = await get_db()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # Find campaigns with active contracts where reload date has passed
    campaigns = await db.ugc_campaigns.find({
        "contract.is_active": True,
        "contract.next_reload_date": {"$lte": now_iso},
        "status": {"$in": ["live", "in_production"]}
    }, {"_id": 0}).to_list(100)
    
    reloaded_campaigns = []
    
    for campaign in campaigns:
        contract = campaign.get("contract", {})
        end_date_str = contract.get("end_date")
        
        if not end_date_str:
            continue
            
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        
        # Check if contract has expired
        if now > end_date:
            # Contract expired - deactivate and make invisible to creators
            await db.ugc_campaigns.update_one(
                {"id": campaign["id"]},
                {
                    "$set": {
                        "contract.is_active": False,
                        "visible_to_creators": False,
                        "updated_at": now_iso
                    }
                }
            )
            print(f"Campaign {campaign['id']} contract expired - deactivated")
            continue
        
        # Reload slots
        monthly_deliverables = contract.get("monthly_deliverables", 0)
        current_available = campaign.get("available_slots", 0)
        current_total = campaign.get("total_slots_loaded", 0)
        
        # Calculate next reload date (same day next month)
        current_reload = datetime.fromisoformat(contract["next_reload_date"].replace('Z', '+00:00'))
        next_reload = add_month(current_reload)
        
        # Don't set next reload if it would be after contract end
        if next_reload > end_date:
            next_reload_str = None
        else:
            next_reload_str = next_reload.isoformat()
        
        new_available = current_available + monthly_deliverables
        new_total = current_total + monthly_deliverables
        
        # Update campaign with new slots
        await db.ugc_campaigns.update_one(
            {"id": campaign["id"]},
            {
                "$set": {
                    "available_slots": new_available,
                    "total_slots_loaded": new_total,
                    "slots": new_total,
                    "contract.next_reload_date": next_reload_str,
                    "contract.total_slots_loaded": new_total,
                    "updated_at": now_iso
                }
            }
        )
        
        # Get brand info for notification
        brand = await db.ugc_brands.find_one(
            {"id": campaign["brand_id"]},
            {"_id": 0, "company_name": 1, "email": 1, "contact_name": 1}
        )
        
        if brand:
            # Send notification to brand
            await send_brand_notification(
                brand_email=brand.get("email", ""),
                brand_name=brand.get("contact_name", brand.get("company_name", "")),
                campaign_name=campaign["name"],
                slots_added=monthly_deliverables
            )
            
            reloaded_campaigns.append({
                "campaign_id": campaign["id"],
                "campaign_name": campaign["name"],
                "brand_name": brand.get("company_name", ""),
                "slots_added": monthly_deliverables,
                "available_slots": new_available
            })
        
        print(f"Campaign {campaign['id']}: Reloaded {monthly_deliverables} slots. Next reload: {next_reload_str}")
    
    # Send admin summary if any campaigns were reloaded
    if reloaded_campaigns:
        await send_admin_notification(reloaded_campaigns)
    
    return len(reloaded_campaigns)

async def auto_reject_expired_applications():
    """
    Reject pending applications 30 days after campaign contract expiration.
    """
    db = await get_db()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # Date 30 days ago
    cutoff_date = (now - timedelta(days=30)).isoformat()
    
    # Find expired campaigns (contract ended more than 30 days ago)
    expired_campaigns = await db.ugc_campaigns.find({
        "contract.is_active": False,
        "contract.end_date": {"$lte": cutoff_date}
    }, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    
    rejected_count = 0
    
    for campaign in expired_campaigns:
        # Find pending applications for this campaign
        pending_apps = await db.ugc_applications.find({
            "campaign_id": campaign["id"],
            "status": {"$in": ["applied", "shortlisted"]},
            "auto_rejected": {"$ne": True}
        }, {"_id": 0, "id": 1, "creator_id": 1}).to_list(100)
        
        for app in pending_apps:
            # Get creator info for notification
            creator = await db.ugc_creators.find_one(
                {"id": app["creator_id"]},
                {"_id": 0, "name": 1, "email": 1, "user_id": 1}
            )
            
            # Update application
            await db.ugc_applications.update_one(
                {"id": app["id"]},
                {
                    "$set": {
                        "status": "rejected",
                        "rejection_reason": "Campaña finalizada - cierre automático",
                        "rejected_at": now_iso,
                        "auto_rejected": True
                    }
                }
            )
            
            # Send notification to creator
            if creator:
                # Get creator email from users collection
                user = await db.users.find_one(
                    {"user_id": creator.get("user_id")},
                    {"_id": 0, "email": 1}
                )
                if user and user.get("email"):
                    await send_rejection_notification(
                        creator_email=user["email"],
                        creator_name=creator.get("name", "Creador"),
                        campaign_name=campaign["name"]
                    )
            
            rejected_count += 1
        
        if pending_apps:
            print(f"Campaign {campaign['id']}: Auto-rejected {len(pending_apps)} applications")
    
    return rejected_count

async def run_all_contract_jobs():
    """Run all contract-related jobs."""
    print(f"[{datetime.now()}] Running contract jobs...")
    
    reloaded = await reload_campaign_slots()
    print(f"  - Reloaded slots for {reloaded} campaigns")
    
    rejected = await auto_reject_expired_applications()
    print(f"  - Auto-rejected {rejected} applications")
    
    return {"reloaded_campaigns": reloaded, "rejected_applications": rejected}

# Entry point for manual execution
if __name__ == "__main__":
    asyncio.run(run_all_contract_jobs())
