"""
UGC Platform - Email Notifications Service
Sistema completo de notificaciones por email para Avenue UGC
"""

import os
import asyncio
import logging
import resend
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY')

# Senders por tipo de destinatario
SENDER_CREATORS = 'AVENUE UGC <creadoresUGC@avenue.com.py>'
SENDER_BRANDS = 'AVENUE Marcas <infobrands@avenue.com.py>'
# Admin emails by type
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'avenuepy@gmail.com')
ADMIN_EMAIL_UGC = os.environ.get('ADMIN_EMAIL_UGC', 'avenue.ugc@gmail.com')

# Base template - Dark theme design - MOBILE OPTIMIZED
def get_base_template(content: str, title: str = "Avenue UGC") -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
            <tr>
                <td style="padding: 15px 10px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #111111; border-radius: 12px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 15px 20px; border-bottom: 1px solid #222222;">
                                <span style="color: #d4a968; font-size: 20px; font-style: italic;">Avenue</span>
                                <span style="color: #ffffff; font-size: 20px;"> UGC</span>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 20px;">
                                {content}
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 15px 20px; background-color: #0a0a0a; border-top: 1px solid #222222;">
                                <p style="color: #555555; font-size: 11px; margin: 0;">
                                    © {datetime.now().year} Avenue UGC
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


async def send_email(to_email: str, subject: str, html_content: str, sender: str = None) -> dict:
    """Send email using Resend"""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return {"status": "skipped", "reason": "API key not configured"}
    
    try:
        params = {
            "from": sender or SENDER_CREATORS,
            "to": [to_email],
            "subject": subject,
            "html": get_base_template(html_content)
        }
        
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {subject}")
        return {"status": "success", "email_id": result.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"status": "error", "error": str(e)}


async def send_admin_notification(subject: str, html_content: str, sender: str = None) -> dict:
    """Send notification to Avenue UGC admin"""
    return await send_email(ADMIN_EMAIL_UGC, f"[AVENUE UGC] {subject}", html_content, sender)


# ============================================================================
# CREADORES UGC - Emails (sender: creadoresUGC@avenue.com.py)
# ============================================================================

async def send_creator_welcome(to_email: str, creator_name: str):
    """1. Cuando crean su perfil de creadores UGC"""
    subject = "¡Bienvenido a Avenue UGC!"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Hola {creator_name}! 👋
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Tu perfil de creador ha sido creado exitosamente. ¡Bienvenido a la comunidad de creadores de Avenue UGC!
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Ahora podés explorar campañas disponibles y aplicar a las que más te interesen.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver campañas disponibles
            </a>
        </div>
        <p style="color: #888888; font-size: 14px; margin-top: 30px;">
            Si tenés alguna consulta, no dudes en contactarnos.
        </p>
    """
    
    # Email al creador
    result = await send_email(to_email, subject, content, SENDER_CREATORS)
    
    # Notificación a Avenue
    admin_content = f"""
        <h2 style="color: #d4a968; margin: 0 0 15px 0;">📸 Nuevo Creador Registrado</h2>
        <p style="color: #cccccc;"><strong>Nombre:</strong> {creator_name}</p>
        <p style="color: #cccccc;"><strong>Email:</strong> {to_email}</p>
        <p style="color: #888888; font-size: 14px; margin-top: 20px;">
            Revisá su perfil en el panel de administración.
        </p>
    """
    await send_admin_notification(f"Nuevo Creador: {creator_name}", admin_content, SENDER_CREATORS)
    
    return result


async def send_application_submitted(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """2. Cuando realizan una aplicación a una campaña"""
    subject = f"Aplicación enviada - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Aplicación enviada! 📨
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, tu aplicación a la campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            de <strong>{brand_name}</strong> ha sido enviada correctamente.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Revisaremos tu perfil y te notificaremos cuando haya una actualización sobre tu aplicación.
        </p>
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #888888; margin: 0 0 5px 0; font-size: 12px;">CAMPAÑA</p>
            <p style="color: #ffffff; margin: 0; font-size: 18px;">{campaign_name}</p>
            <p style="color: #d4a968; margin: 5px 0 0 0;">{brand_name}</p>
        </div>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/applications" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver mis aplicaciones
            </a>
        </div>
    """
    
    # Email al creador
    result = await send_email(to_email, subject, content, SENDER_CREATORS)
    
    # Notificación a Avenue
    admin_content = f"""
        <h2 style="color: #d4a968; margin: 0 0 15px 0;">📩 Nueva Aplicación UGC</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name} ({to_email})</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
    """
    await send_admin_notification(f"Nueva Aplicación: {creator_name} → {campaign_name}", admin_content, SENDER_CREATORS)
    
    return result


async def send_application_confirmed(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    campaign_data: dict = None,
    creator_level: str = None
):
    """3. Cuando se les confirma una aplicación - with AI-generated content"""
    from services.ai_email_service import generate_confirmation_email
    
    subject = f"¡Felicitaciones! Fuiste seleccionado - {campaign_name}"
    
    # Generate personalized email content using AI
    if campaign_data:
        content = await generate_confirmation_email(
            creator_name=creator_name,
            campaign_name=campaign_name,
            brand_name=brand_name,
            campaign_data=campaign_data,
            creator_level=creator_level
        )
    else:
        # Fallback to basic template if no campaign data
        from datetime import datetime, timedelta
        
        confirmation_date = datetime.now()
        content_deadline = confirmation_date + timedelta(days=7)
        deadline_formatted = content_deadline.strftime("%A %d/%m/%Y").replace(
            "Monday", "Lunes"
        ).replace("Tuesday", "Martes").replace("Wednesday", "Miércoles").replace(
            "Thursday", "Jueves"
        ).replace("Friday", "Viernes").replace("Saturday", "Sábado").replace("Sunday", "Domingo")
        
        # Mensaje especial para rookies sobre el retiro de canjes
        rookie_notice = ""
        if creator_level and creator_level.lower() == "rookie":
            rookie_notice = """
            <div style="background-color: #1a1a0a; border: 2px solid #d4a968; border-radius: 8px; padding: 12px; margin: 15px 0;">
                <p style="color: #d4a968; font-size: 14px; margin: 0; line-height: 1.4;">
                    <strong>Rookie:</strong> El canje se retira después de subir contenido, URL y métricas.
                </p>
            </div>
            """
        
        content = f"""
            <p style="color: #ffffff; font-size: 20px; margin: 0 0 10px 0;">
                ¡Hola {creator_name}!
            </p>
            <p style="color: #cccccc; font-size: 15px; line-height: 1.4; margin: 0 0 15px 0;">
                Confirmado para <strong style="color: #d4a968;">{campaign_name}</strong> de {brand_name}.
            </p>
            
            <div style="background: #22c55e; border-radius: 8px; padding: 15px; margin: 0 0 15px 0; text-align: center;">
                <p style="color: #ffffff; font-size: 12px; margin: 0 0 5px 0;">FECHA LÍMITE PARA SUBIR URL</p>
                <p style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0;">{deadline_formatted}</p>
            </div>
            
            <p style="color: #888888; font-size: 13px; margin: 0 0 10px 0;">
                Tenés 14 días desde hoy para subir métricas.
            </p>
            
            {rookie_notice}
            
            <div style="text-align: center; margin: 20px 0 10px 0;">
                <a href="https://avenue.com.py/login?redirect=/ugc/creator/workspace" 
                   style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                    Ir a mi Workspace
                </a>
            </div>
        """
    
    return await send_email(to_email, subject, content, SENDER_CREATORS)


async def send_application_rejected(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    reason: str = None
):
    """4. Cuando se les rechaza una aplicación"""
    subject = f"Actualización sobre tu aplicación - {campaign_name}"
    reason_text = f"<p style='color: #888888; font-size: 14px; margin-top: 15px;'><em>Motivo: {reason}</em></p>" if reason else ""
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {creator_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Lamentablemente, tu aplicación a la campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            no ha sido seleccionada en esta ocasión.
        </p>
        {reason_text}
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ¡No te desanimes! Hay muchas más campañas esperándote.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver otras campañas
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_CREATORS)


async def send_application_cancelled_by_admin(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    reason: str = None
):
    """NUEVO: Cuando el admin cancela una aplicación previamente confirmada"""
    subject = f"Aplicación cancelada - {campaign_name}"
    reason_text = f"<p style='color: #888888; font-size: 14px; margin-top: 15px;'><em>Motivo: {reason}</em></p>" if reason else ""
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {creator_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Lamentamos informarte que tu participación en la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong> de <strong>{brand_name}</strong> 
            ha sido <span style="color: #ef4444;">cancelada</span> por el equipo de Avenue.
        </p>
        {reason_text}
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Si tenés alguna consulta sobre esta decisión, no dudes en contactarnos.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver otras campañas
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_CREATORS)


async def send_content_submitted_to_creator(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    metrics_deadline: str = None
):
    """5. Cuando suben el link de su entrega de contenido - ACTUALIZADO con info de métricas"""
    deadline_text = ""
    if metrics_deadline:
        deadline_text = f"""
        <div style="background-color: #0d3320; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #22c55e; margin: 0 0 10px 0; font-size: 16px;">📊 ¡Ya podés subir tus métricas!</h3>
            <p style="color: #cccccc; font-size: 14px; margin: 0; line-height: 1.5;">
                Tenés tiempo hasta el <strong style="color: #ffffff;">{metrics_deadline}</strong> para subir 
                los screenshots con las estadísticas de tu publicación.
            </p>
        </div>
        """
    
    subject = f"Contenido enviado - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Contenido recibido! ✅
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, tu entrega de contenido para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong> ha sido recibida correctamente.
        </p>
        {deadline_text}
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Subir métricas ahora
            </a>
        </div>
    """
    
    # Email al creador
    result = await send_email(to_email, subject, content, SENDER_CREATORS)
    
    # Notificación a Avenue
    admin_content = f"""
        <h2 style="color: #d4a968; margin: 0 0 15px 0;">📤 Nuevo Contenido Entregado</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name}</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
    """
    await send_admin_notification(f"Contenido Entregado: {creator_name} - {campaign_name}", admin_content, SENDER_CREATORS)
    
    return result


async def send_metrics_submitted_to_creator(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """6. Cuando suben las métricas de su entrega de contenido"""
    subject = f"Métricas recibidas - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Métricas recibidas! 📊
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, las métricas de tu contenido para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong> han sido recibidas correctamente.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            La marca <strong>{brand_name}</strong> revisará los resultados.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver mi Workspace
            </a>
        </div>
    """
    
    # Email al creador
    result = await send_email(to_email, subject, content, SENDER_CREATORS)
    
    # Notificación a Avenue
    admin_content = f"""
        <h2 style="color: #d4a968; margin: 0 0 15px 0;">📊 Métricas Entregadas</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name}</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
    """
    await send_admin_notification(f"Métricas: {creator_name} - {campaign_name}", admin_content, SENDER_CREATORS)
    
    return result


async def send_deliverable_rated(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    rating: int,
    comment: str = None
):
    """7. Cuando reciben calificación por parte de la marca"""
    stars = "⭐" * rating
    comment_html = f"<p style='color: #888888; font-style: italic; margin-top: 15px;'>\"{comment}\"</p>" if comment else ""
    subject = f"Nueva calificación recibida - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Recibiste una calificación! {stars}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, <strong>{brand_name}</strong> ha calificado tu trabajo 
            en la campaña <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #888888; margin: 0 0 10px 0; font-size: 12px;">CALIFICACIÓN</p>
            <p style="color: #d4a968; margin: 0; font-size: 32px;">{stars}</p>
            <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 24px;">{rating}/5</p>
            {comment_html}
        </div>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/dashboard" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver mi perfil
            </a>
        </div>
    """
    
    # Email al creador
    result = await send_email(to_email, subject, content, SENDER_CREATORS)
    
    # Notificación a Avenue
    admin_content = f"""
        <h2 style="color: #d4a968; margin: 0 0 15px 0;">{stars} Nueva Calificación</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name}</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: #cccccc;"><strong>Rating:</strong> {rating}/5</p>
    """
    await send_admin_notification(f"Calificación: {creator_name} - {rating}/5", admin_content, SENDER_CREATORS)
    
    return result


async def send_level_up(
    to_email: str,
    creator_name: str,
    new_level: str,
    benefits: list = None
):
    """8. Cuando suben de nivel"""
    benefits_html = ""
    if benefits:
        benefits_items = "".join([f"<li style='color: #cccccc; margin: 5px 0;'>{b}</li>" for b in benefits])
        benefits_html = f"<ul style='margin: 20px 0; padding-left: 20px;'>{benefits_items}</ul>"
    
    subject = f"¡Subiste de nivel! - {new_level}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Felicitaciones {creator_name}! 🚀
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Has alcanzado un nuevo nivel en Avenue UGC:
        </p>
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center;">
            <p style="color: #d4a968; margin: 0; font-size: 36px; font-weight: bold;">{new_level}</p>
        </div>
        {benefits_html}
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/dashboard" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver mi perfil
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_CREATORS)


async def send_deliverable_approved(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """Cuando se aprueba el contenido del creador"""
    subject = f"¡Contenido aprobado! - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Excelente trabajo {creator_name}! ✨
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Tu contenido para la campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            de <strong>{brand_name}</strong> ha sido <span style="color: #22c55e;">APROBADO</span>.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ¡Seguí así! Ya podés publicar tu contenido según las instrucciones de la campaña.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #22c55e; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ir a mi Workspace
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_CREATORS)


async def send_changes_requested(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    notes: str = None
):
    """Cuando la marca solicita cambios en el contenido"""
    notes_html = f"<div style='background-color: #1a1a1a; border-left: 3px solid #d4a968; padding: 15px; margin: 20px 0;'><p style='color: #cccccc; margin: 0;'>{notes}</p></div>" if notes else ""
    subject = f"Cambios solicitados - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {creator_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            La marca <strong>{brand_name}</strong> ha solicitado algunos cambios en tu contenido 
            para la campaña <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        {notes_html}
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Por favor, revisá los comentarios y subí una nueva versión de tu contenido.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ir a mi Workspace
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_CREATORS)


# ============================================================================
# RECORDATORIOS DE ENTREGA DE URL - CREADORES
# ============================================================================

async def send_url_delivery_reminder(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    days_until_deadline: int,
    deadline_date: str
):
    """Recordatorio diario de entrega de URL (2 días antes hasta 6 días después)"""
    
    if days_until_deadline > 0:
        # Antes de la fecha límite
        urgency_color = "#d4a968" if days_until_deadline > 1 else "#f59e0b"
        title = f"Recordatorio: {days_until_deadline} día{'s' if days_until_deadline > 1 else ''} para entregar tu contenido"
        message = f"""
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola {creator_name}, te recordamos que tenés <strong style="color: {urgency_color};">{days_until_deadline} día{'s' if days_until_deadline > 1 else ''}</strong> 
                para subir el URL de tu contenido para la campaña <strong style="color: #d4a968;">{campaign_name}</strong>.
            </p>
        """
    elif days_until_deadline == 0:
        # Hoy es la fecha límite
        urgency_color = "#ef4444"
        title = "⚠️ ¡HOY es tu fecha límite!"
        message = f"""
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola {creator_name}, <strong style="color: #ef4444;">HOY</strong> es la fecha límite 
                para subir el URL de tu contenido para la campaña <strong style="color: #d4a968;">{campaign_name}</strong>.
            </p>
        """
    else:
        # Después de la fecha límite
        days_late = abs(days_until_deadline)
        urgency_color = "#ef4444"
        title = f"⚠️ Entrega atrasada - {days_late} día{'s' if days_late > 1 else ''}"
        message = f"""
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola {creator_name}, tu entrega de contenido para la campaña 
                <strong style="color: #d4a968;">{campaign_name}</strong> está 
                <strong style="color: #ef4444;">{days_late} día{'s' if days_late > 1 else ''} atrasada</strong>.
            </p>
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Por favor, subí tu URL lo antes posible para evitar sanciones.
            </p>
        """
    
    subject = f"{title} - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            {title}
        </h1>
        {message}
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #888888; margin: 0 0 5px 0; font-size: 12px;">FECHA LÍMITE</p>
            <p style="color: {urgency_color}; margin: 0; font-size: 18px; font-weight: bold;">{deadline_date}</p>
            <p style="color: #888888; margin: 10px 0 0 0; font-size: 12px;">MARCA</p>
            <p style="color: #ffffff; margin: 0; font-size: 16px;">{brand_name}</p>
        </div>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Subir URL ahora
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_CREATORS)


async def send_url_warning_day7(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """Advertencia día 7 de retraso - Riesgo de cancelación en 24hs"""
    subject = f"⚠️ URGENTE: Riesgo de cancelación - {campaign_name}"
    content = f"""
        <h1 style="color: #ef4444; font-size: 28px; margin: 0 0 20px 0;">
            ⚠️ ATENCIÓN URGENTE
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, tu entrega de contenido para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong> de <strong>{brand_name}</strong> 
            lleva <strong style="color: #ef4444;">7 días de retraso</strong>.
        </p>
        
        <div style="background-color: #2d1b1b; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #ef4444; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                ⏰ Tenés 24 horas para:
            </p>
            <ul style="color: #cccccc; margin: 10px 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Subir el URL de tu contenido a la plataforma, o</li>
                <li style="margin: 8px 0;">Comunicarte urgentemente con el equipo de Avenue</li>
            </ul>
            <p style="color: #ef4444; font-size: 14px; margin: 15px 0 0 0;">
                De lo contrario, tu aplicación será <strong>CANCELADA</strong> y podrías recibir una sanción.
            </p>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">
                Subir URL ahora
            </a>
            <a href="https://wa.me/595976691520" 
               style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Contactar a Avenue
            </a>
        </div>
    """
    
    # También notificar al admin
    admin_content = f"""
        <h2 style="color: #ef4444; margin: 0 0 15px 0;">⚠️ Creador Advertido (Día 7)</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name} ({to_email})</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: #ef4444;"><strong>Estado:</strong> 7 días de retraso - Advertido de cancelación en 24hs</p>
    """
    await send_admin_notification(f"⚠️ Advertencia Día 7: {creator_name} - {campaign_name}", admin_content, SENDER_CREATORS)
    
    return await send_email(to_email, subject, content, SENDER_CREATORS)


async def send_url_warning_day8(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """Advertencia día 8 de retraso - Última advertencia"""
    subject = f"🚨 ÚLTIMA ADVERTENCIA: Cancelación inminente - {campaign_name}"
    content = f"""
        <h1 style="color: #ef4444; font-size: 28px; margin: 0 0 20px 0;">
            🚨 ÚLTIMA ADVERTENCIA
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, tu entrega de contenido para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong> de <strong>{brand_name}</strong> 
            lleva <strong style="color: #ef4444;">8 días de retraso</strong>.
        </p>
        
        <div style="background-color: #2d1b1b; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #ef4444; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                🚨 ACCIÓN INMEDIATA REQUERIDA
            </p>
            <p style="color: #cccccc; font-size: 15px; margin: 10px 0;">
                Si <strong>HOY</strong> no subís el URL a la plataforma o te comunicás con el equipo de Avenue:
            </p>
            <ul style="color: #ef4444; margin: 10px 0; padding-left: 20px; font-weight: bold;">
                <li style="margin: 8px 0;">Tu aplicación será CANCELADA</li>
                <li style="margin: 8px 0;">Podrías recibir una SANCIÓN en tu perfil</li>
            </ul>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">
                Subir URL AHORA
            </a>
            <a href="https://wa.me/595976691520" 
               style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Contactar URGENTE
            </a>
        </div>
    """
    
    # También notificar al admin
    admin_content = f"""
        <h2 style="color: #ef4444; margin: 0 0 15px 0;">🚨 Creador Advertido (Día 8) - ÚLTIMA</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name} ({to_email})</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: #ef4444;"><strong>Estado:</strong> 8 días de retraso - ÚLTIMA ADVERTENCIA enviada</p>
    """
    await send_admin_notification(f"🚨 ÚLTIMA Advertencia Día 8: {creator_name} - {campaign_name}", admin_content, SENDER_CREATORS)
    
    return await send_email(to_email, subject, content, SENDER_CREATORS)


# ============================================================================
# RECORDATORIOS DE ENTREGA DE MÉTRICAS - CREADORES
# ============================================================================

async def send_metrics_delivery_reminder(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    days_until_deadline: int,
    deadline_date: str
):
    """Recordatorio diario de entrega de métricas (2 días antes hasta 6 días después)"""
    
    if days_until_deadline > 0:
        urgency_color = "#d4a968" if days_until_deadline > 1 else "#f59e0b"
        title = f"Recordatorio: {days_until_deadline} día{'s' if days_until_deadline > 1 else ''} para subir métricas"
        message = f"""
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola {creator_name}, te recordamos que tenés <strong style="color: {urgency_color};">{days_until_deadline} día{'s' if days_until_deadline > 1 else ''}</strong> 
                para subir las métricas de tu contenido para la campaña <strong style="color: #d4a968;">{campaign_name}</strong>.
            </p>
        """
    elif days_until_deadline == 0:
        urgency_color = "#ef4444"
        title = "⚠️ ¡HOY es tu fecha límite para métricas!"
        message = f"""
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola {creator_name}, <strong style="color: #ef4444;">HOY</strong> es la fecha límite 
                para subir las métricas de tu contenido para la campaña <strong style="color: #d4a968;">{campaign_name}</strong>.
            </p>
        """
    else:
        days_late = abs(days_until_deadline)
        urgency_color = "#ef4444"
        title = f"⚠️ Métricas atrasadas - {days_late} día{'s' if days_late > 1 else ''}"
        message = f"""
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola {creator_name}, tus métricas para la campaña 
                <strong style="color: #d4a968;">{campaign_name}</strong> están 
                <strong style="color: #ef4444;">{days_late} día{'s' if days_late > 1 else ''} atrasadas</strong>.
            </p>
        """
    
    subject = f"{title} - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            {title}
        </h1>
        {message}
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #888888; margin: 0 0 5px 0; font-size: 12px;">FECHA LÍMITE MÉTRICAS</p>
            <p style="color: {urgency_color}; margin: 0; font-size: 18px; font-weight: bold;">{deadline_date}</p>
        </div>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Subir métricas ahora
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_CREATORS)


async def send_metrics_warning_day7(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """Advertencia día 7 de retraso de métricas"""
    subject = f"⚠️ URGENTE: Métricas pendientes - {campaign_name}"
    content = f"""
        <h1 style="color: #ef4444; font-size: 28px; margin: 0 0 20px 0;">
            ⚠️ ATENCIÓN URGENTE
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, tus métricas para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong> de <strong>{brand_name}</strong> 
            llevan <strong style="color: #ef4444;">7 días de retraso</strong>.
        </p>
        
        <div style="background-color: #2d1b1b; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #ef4444; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                ⏰ Tenés 24 horas para:
            </p>
            <ul style="color: #cccccc; margin: 10px 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Subir las métricas de tu contenido, o</li>
                <li style="margin: 8px 0;">Comunicarte urgentemente con el equipo de Avenue</li>
            </ul>
            <p style="color: #ef4444; font-size: 14px; margin: 15px 0 0 0;">
                De lo contrario, tu aplicación será <strong>CANCELADA</strong> y podrías recibir una sanción.
            </p>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">
                Subir métricas ahora
            </a>
            <a href="https://wa.me/595976691520" 
               style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Contactar a Avenue
            </a>
        </div>
    """
    
    admin_content = f"""
        <h2 style="color: #ef4444; margin: 0 0 15px 0;">⚠️ Métricas Atrasadas (Día 7)</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name} ({to_email})</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
    """
    await send_admin_notification(f"⚠️ Métricas Día 7: {creator_name} - {campaign_name}", admin_content, SENDER_CREATORS)
    
    return await send_email(to_email, subject, content, SENDER_CREATORS)


async def send_metrics_warning_day8(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """Advertencia día 8 de retraso de métricas - Última advertencia"""
    subject = f"🚨 ÚLTIMA ADVERTENCIA: Métricas pendientes - {campaign_name}"
    content = f"""
        <h1 style="color: #ef4444; font-size: 28px; margin: 0 0 20px 0;">
            🚨 ÚLTIMA ADVERTENCIA
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, tus métricas para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong> de <strong>{brand_name}</strong> 
            llevan <strong style="color: #ef4444;">8 días de retraso</strong>.
        </p>
        
        <div style="background-color: #2d1b1b; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #ef4444; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                🚨 ACCIÓN INMEDIATA REQUERIDA
            </p>
            <p style="color: #cccccc; font-size: 15px; margin: 10px 0;">
                Si <strong>HOY</strong> no subís las métricas o te comunicás con Avenue:
            </p>
            <ul style="color: #ef4444; margin: 10px 0; padding-left: 20px; font-weight: bold;">
                <li style="margin: 8px 0;">Tu aplicación será CANCELADA</li>
                <li style="margin: 8px 0;">Podrías recibir una SANCIÓN</li>
            </ul>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">
                Subir métricas AHORA
            </a>
            <a href="https://wa.me/595976691520" 
               style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Contactar URGENTE
            </a>
        </div>
    """
    
    admin_content = f"""
        <h2 style="color: #ef4444; margin: 0 0 15px 0;">🚨 Métricas Atrasadas (Día 8) - ÚLTIMA</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name} ({to_email})</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
    """
    await send_admin_notification(f"🚨 Métricas ÚLTIMA Día 8: {creator_name} - {campaign_name}", admin_content, SENDER_CREATORS)
    
    return await send_email(to_email, subject, content, SENDER_CREATORS)


# ============================================================================
# MARCAS UGC - Emails (sender: infobrands@avenue.com.py)
# ============================================================================

async def send_brand_welcome(to_email: str, brand_name: str):
    """1. Cuando crean su perfil de marcas UGC"""
    subject = "¡Bienvenido a Avenue UGC!"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Hola {brand_name}! 👋
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Tu perfil de marca ha sido creado exitosamente en Avenue UGC.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Ahora podés crear campañas y conectar con creadores de contenido de alta calidad.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/brand/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Crear mi primera campaña
            </a>
        </div>
    """
    
    # Email a la marca
    result = await send_email(to_email, subject, content, SENDER_BRANDS)
    
    # Notificación a Avenue
    admin_content = f"""
        <h2 style="color: #d4a968; margin: 0 0 15px 0;">🏢 Nueva Marca Registrada</h2>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: #cccccc;"><strong>Email:</strong> {to_email}</p>
    """
    await send_admin_notification(f"Nueva Marca UGC: {brand_name}", admin_content, SENDER_BRANDS)
    
    return result


async def send_campaign_enabled(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    slots: int
):
    """2. Cuando se les habilita una Campaña nueva"""
    subject = f"¡Tu campaña está activa! - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Campaña activada! 🚀
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {brand_name}, tu campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            ha sido habilitada y ya está visible para los creadores.
        </p>
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #888888; margin: 0 0 5px 0; font-size: 12px;">CUPOS DISPONIBLES</p>
            <p style="color: #d4a968; margin: 0; font-size: 36px; font-weight: bold;">{slots}</p>
        </div>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/brand/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver mi campaña
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_BRANDS)


async def send_slots_recharged(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    new_slots: int,
    total_slots: int
):
    """3. Cuando se les recargan Cupos"""
    subject = f"Cupos recargados - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Cupos recargados! ➕
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {brand_name}, se han agregado <strong style="color: #22c55e;">{new_slots} cupos</strong> 
            a tu campaña <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #888888; margin: 0 0 5px 0; font-size: 12px;">CUPOS TOTALES DISPONIBLES</p>
            <p style="color: #d4a968; margin: 0; font-size: 36px; font-weight: bold;">{total_slots}</p>
        </div>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/brand/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver mi campaña
            </a>
        </div>
    """
    
    # Email a la marca
    result = await send_email(to_email, subject, content, SENDER_BRANDS)
    
    # Notificación a Avenue
    admin_content = f"""
        <h2 style="color: #d4a968; margin: 0 0 15px 0;">➕ Cupos Recargados</h2>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Cupos agregados:</strong> {new_slots}</p>
        <p style="color: #cccccc;"><strong>Total disponible:</strong> {total_slots}</p>
    """
    await send_admin_notification(f"Cupos Recargados: {campaign_name} (+{new_slots})", admin_content, SENDER_BRANDS)
    
    return result


async def send_creator_confirmed_to_brand(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    creator_name: str
):
    """5. Cuando el administrador confirma un postulante"""
    subject = f"Creador confirmado - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Creador confirmado ✅
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {brand_name}, el creador <strong style="color: #d4a968;">{creator_name}</strong> 
            ha sido confirmado para tu campaña <strong>{campaign_name}</strong>.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            El creador ya fue notificado y comenzará a trabajar en el contenido.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/brand/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver mi campaña
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_BRANDS)


async def send_content_submitted_to_brand(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    creator_name: str
):
    """6. Cuando el postulante entrega su contenido subiendo el link"""
    subject = f"Nuevo contenido para revisar - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Nuevo contenido! 📸
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {brand_name}, el creador <strong style="color: #d4a968;">{creator_name}</strong> 
            ha entregado contenido para tu campaña <strong>{campaign_name}</strong>.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Revisá el contenido y aprobalo o solicitá cambios.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/brand/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Revisar contenido
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_BRANDS)


async def send_metrics_submitted_to_brand(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    creator_name: str
):
    """7. Cuando el candidato entrega las métricas"""
    subject = f"Métricas recibidas - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Métricas disponibles! 📊
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {brand_name}, el creador <strong style="color: #d4a968;">{creator_name}</strong> 
            ha subido las métricas de su contenido para la campaña <strong>{campaign_name}</strong>.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/brand/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver métricas
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_BRANDS)


async def send_campaign_slots_depleted(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    total_delivered: int
):
    """NUEVO: Cuando la campaña se queda sin cupos - Confirmación de entrega completa + CTA"""
    subject = f"🎉 ¡Campaña completada! - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Felicitaciones {brand_name}! 🎉
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Todos los cupos de tu campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            han sido completados exitosamente.
        </p>
        
        <div style="background-color: #0d3320; border: 1px solid #22c55e; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center;">
            <p style="color: #22c55e; margin: 0 0 5px 0; font-size: 14px;">CONTENIDOS ENTREGADOS</p>
            <p style="color: #ffffff; margin: 0; font-size: 48px; font-weight: bold;">{total_delivered}</p>
            <p style="color: #22c55e; margin: 10px 0 0 0; font-size: 16px;">✅ Todo lo contratado fue entregado</p>
        </div>
        
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            ¿Querés seguir generando contenido de calidad con más creadores? 
            <strong style="color: #d4a968;">¡Recargá cupos ahora!</strong>
        </p>
        
        <div style="margin: 30px 0; text-align: center;">
            <a href="https://avenue.com.py/ugc/brand/campaigns" 
               style="display: inline-block; background-color: #22c55e; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px;">
                🚀 Contratar más cupos
            </a>
        </div>
        
        <p style="color: #888888; font-size: 14px; margin-top: 30px; text-align: center;">
            Contactanos para planes especiales y descuentos por volumen.
        </p>
    """
    
    # Email a la marca
    result = await send_email(to_email, subject, content, SENDER_BRANDS)
    
    # Notificación a Avenue - Oportunidad de venta
    admin_content = f"""
        <h2 style="color: #22c55e; margin: 0 0 15px 0;">🎯 Campaña Sin Cupos - Oportunidad de Venta</h2>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name} ({to_email})</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Entregas completadas:</strong> {total_delivered}</p>
        <p style="color: #22c55e; margin-top: 15px;"><strong>💡 Oportunidad:</strong> Contactar para ofrecer más cupos</p>
    """
    await send_admin_notification(f"🎯 Sin Cupos: {brand_name} - {campaign_name}", admin_content, SENDER_BRANDS)
    
    return result


# ============================================================================
# NOTIFICACIONES ADMIN - Cancelaciones y Alertas
# ============================================================================

async def send_admin_creator_cancelled(
    creator_name: str,
    creator_email: str,
    campaign_name: str,
    brand_name: str
):
    """NUEVO: Notificar al admin cuando un creador confirmado cancela su participación"""
    admin_content = f"""
        <h2 style="color: #ef4444; margin: 0 0 15px 0;">❌ Creador Canceló Participación</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name} ({creator_email})</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: #888888; margin-top: 15px;">El creador canceló voluntariamente su participación.</p>
    """
    return await send_admin_notification(f"❌ Creador Canceló: {creator_name} - {campaign_name}", admin_content, SENDER_CREATORS)


async def send_admin_url_delay_reminder(
    creator_name: str,
    creator_email: str,
    campaign_name: str,
    brand_name: str,
    days_until_deadline: int,
    deadline_date: str
):
    """Recordatorio diario al admin sobre retrasos de URL"""
    if days_until_deadline >= 0:
        status = f"{days_until_deadline} días para la fecha límite"
        color = "#f59e0b"
    else:
        days_late = abs(days_until_deadline)
        status = f"{days_late} día{'s' if days_late > 1 else ''} de retraso"
        color = "#ef4444"
    
    admin_content = f"""
        <h2 style="color: {color}; margin: 0 0 15px 0;">📅 Recordatorio Entrega URL</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name} ({creator_email})</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: {color};"><strong>Estado:</strong> {status}</p>
        <p style="color: #888888;"><strong>Fecha límite:</strong> {deadline_date}</p>
    """
    return await send_admin_notification(f"📅 URL: {creator_name} - {status}", admin_content, SENDER_CREATORS)


async def send_admin_metrics_delay_reminder(
    creator_name: str,
    creator_email: str,
    campaign_name: str,
    brand_name: str,
    days_until_deadline: int,
    deadline_date: str
):
    """Recordatorio diario al admin sobre retrasos de métricas"""
    if days_until_deadline >= 0:
        status = f"{days_until_deadline} días para la fecha límite"
        color = "#f59e0b"
    else:
        days_late = abs(days_until_deadline)
        status = f"{days_late} día{'s' if days_late > 1 else ''} de retraso"
        color = "#ef4444"
    
    admin_content = f"""
        <h2 style="color: {color}; margin: 0 0 15px 0;">📊 Recordatorio Métricas</h2>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name} ({creator_email})</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: {color};"><strong>Estado:</strong> {status}</p>
        <p style="color: #888888;"><strong>Fecha límite:</strong> {deadline_date}</p>
    """
    return await send_admin_notification(f"📊 Métricas: {creator_name} - {status}", admin_content, SENDER_CREATORS)
