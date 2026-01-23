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

# Base template - Dark theme design
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
                <td style="padding: 30px 15px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 25px 30px; border-bottom: 1px solid #222222;">
                                <span style="color: #d4a968; font-size: 24px; font-style: italic;">Avenue</span>
                                <span style="color: #ffffff; font-size: 24px;"> UGC</span>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px;">
                                {content}
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 25px 30px; background-color: #0a0a0a; border-top: 1px solid #222222;">
                                <p style="color: #666666; font-size: 12px; margin: 0;">
                                    © {datetime.now().year} Avenue UGC. Todos los derechos reservados.
                                </p>
                                <p style="color: #666666; font-size: 11px; margin: 8px 0 0 0;">
                                    Este es un email automático.
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
    """Send notification to Avenue admin"""
    return await send_email(ADMIN_EMAIL, f"[AVENUE] {subject}", html_content, sender)


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
    campaign_data: dict = None
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
            campaign_data=campaign_data
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
        
        content = f"""
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
                ¡Felicitaciones {creator_name}! 🎉
            </h1>
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Tu aplicación a la campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
                de <strong>{brand_name}</strong> ha sido <span style="color: #22c55e;">CONFIRMADA</span>.
            </p>
            
            <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #d4a968; margin: 0 0 15px 0; font-size: 16px;">📅 Fechas importantes:</h3>
                <p style="color: #ffffff; font-size: 15px; margin: 0 0 10px 0;">
                    <strong>Fecha límite para subir contenido:</strong> {deadline_formatted}
                </p>
                <p style="color: #888888; font-size: 14px; margin: 0; line-height: 1.5;">
                    Tenés <strong style="color: #22c55e;">7 días</strong> desde hoy para crear y subir tu contenido a tus redes sociales.
                </p>
            </div>
            
            <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #d4a968; margin: 0 0 15px 0; font-size: 16px;">📊 Sobre las métricas:</h3>
                <p style="color: #888888; font-size: 14px; margin: 0; line-height: 1.5;">
                    Una vez que subas el URL de tu contenido a la plataforma, tendrás <strong style="color: #22c55e;">7 días adicionales</strong> 
                    para subir los screenshots de las métricas de tu publicación.
                </p>
            </div>
            
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Ingresá a tu workspace para ver los detalles completos de la campaña.
            </p>
            
            <div style="margin: 30px 0;">
                <a href="https://avenue.com.py/login?redirect=/ugc/creator/workspace" 
                   style="display: inline-block; background-color: #22c55e; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                    Ir a mi Workspace
                </a>
            </div>
            
            <p style="color: #666666; font-size: 12px; margin-top: 20px;">
                Si ya tenés sesión iniciada, el botón te llevará directamente a tu workspace.
            </p>
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


async def send_content_submitted_to_creator(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """5. Cuando suben el link de su entrega de contenido - confirmación al creador"""
    subject = f"Contenido enviado - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Contenido recibido! ✅
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, tu entrega de contenido para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong> ha sido recibida correctamente.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            La marca <strong>{brand_name}</strong> revisará tu contenido y te notificaremos cuando haya novedades.
        </p>
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #22c55e; margin: 0; font-size: 14px;">⏳ Estado: Pendiente de revisión</p>
        </div>
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
    """6. Cuando suben las métricas de su entrega de contenido - confirmación al creador"""
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
    """7. Cuando reciben calificación y comentarios por parte de la marca"""
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


async def send_metrics_window_open(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """Cuando se abre la ventana para subir métricas"""
    subject = f"¡Subí tus métricas! - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Es hora de subir tus métricas! 📊
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, ya podés subir las métricas de tu contenido para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong> de <strong>{brand_name}</strong>.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Recordá incluir capturas de pantalla con las estadísticas de tu publicación.
        </p>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/creator/workspace" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Subir métricas
            </a>
        </div>
    """
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


async def send_new_application_to_brand(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    creator_name: str,
    creator_username: str = None,
    creator_followers: int = None
):
    """4. Cuando se recibe una nueva aplicación"""
    followers_text = f"<p style='color: #cccccc;'><strong>Seguidores:</strong> {creator_followers:,}</p>" if creator_followers else ""
    username_text = f" (@{creator_username})" if creator_username else ""
    
    subject = f"Nueva aplicación - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Nueva aplicación! 📩
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {brand_name}, un nuevo creador ha aplicado a tu campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #888888; margin: 0 0 5px 0; font-size: 12px;">APLICANTE</p>
            <p style="color: #ffffff; margin: 0; font-size: 18px;">{creator_name}{username_text}</p>
            {followers_text}
        </div>
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/brand/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Revisar aplicación
            </a>
        </div>
    """
    
    # Email a la marca
    result = await send_email(to_email, subject, content, SENDER_BRANDS)
    
    # Notificación a Avenue (ya se envía desde send_application_submitted)
    
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
    
    # Email a la marca
    result = await send_email(to_email, subject, content, SENDER_BRANDS)
    
    # Notificación a Avenue (ya se envía desde send_content_submitted_to_creator)
    
    return result


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
    
    # Email a la marca
    result = await send_email(to_email, subject, content, SENDER_BRANDS)
    
    # Notificación a Avenue
    admin_content = f"""
        <h2 style="color: #d4a968; margin: 0 0 15px 0;">📊 Métricas Recibidas</h2>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: #cccccc;"><strong>Campaña:</strong> {campaign_name}</p>
        <p style="color: #cccccc;"><strong>Creador:</strong> {creator_name}</p>
    """
    await send_admin_notification(f"Métricas: {creator_name} - {campaign_name}", admin_content, SENDER_BRANDS)
    
    return result


async def send_plan_selected(
    to_email: str,
    brand_name: str,
    plan_name: str,
    plan_price: str = None
):
    """8. Cuando eligen un plan"""
    price_text = f"<p style='color: #22c55e; font-size: 24px; margin: 10px 0;'>{plan_price}</p>" if plan_price else ""
    subject = f"Plan seleccionado - {plan_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Plan seleccionado! 🎯
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {brand_name}, has seleccionado el plan <strong style="color: #d4a968;">{plan_name}</strong>.
        </p>
        <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">{plan_name}</p>
            {price_text}
        </div>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Nos pondremos en contacto contigo para coordinar los próximos pasos.
        </p>
    """
    
    # Email a la marca
    result = await send_email(to_email, subject, content, SENDER_BRANDS)
    
    # Notificación a Avenue
    admin_content = f"""
        <h2 style="color: #d4a968; margin: 0 0 15px 0;">🎯 Plan Seleccionado</h2>
        <p style="color: #cccccc;"><strong>Marca:</strong> {brand_name}</p>
        <p style="color: #cccccc;"><strong>Email:</strong> {to_email}</p>
        <p style="color: #cccccc;"><strong>Plan:</strong> {plan_name}</p>
        <p style="color: #22c55e; font-weight: bold;">¡Contactar para cerrar venta!</p>
    """
    await send_admin_notification(f"💰 Plan Seleccionado: {brand_name} - {plan_name}", admin_content, SENDER_BRANDS)
    
    return result


async def send_campaign_completed_to_brand(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    total_creators: int = None
):
    """Cuando se completa una campaña"""
    creators_text = f"<p style='color: #cccccc;'><strong>Creadores participantes:</strong> {total_creators}</p>" if total_creators else ""
    subject = f"¡Campaña completada! - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Campaña finalizada! 🎉
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {brand_name}, tu campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            ha sido completada exitosamente.
        </p>
        {creators_text}
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/ugc/brand/campaigns" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver resultados
            </a>
        </div>
    """
    return await send_email(to_email, subject, content, SENDER_BRANDS)


# ============================================================================
# WHATSAPP NOTIFICATIONS (via Twilio)
# ============================================================================

async def send_whatsapp_ugc_notification(message: str, notification_type: str = 'ugc'):
    """Send WhatsApp notification to admin"""
    try:
        from whatsapp_service import send_ugc_notification
        return await send_ugc_notification(message)
    except Exception as e:
        logger.error(f"WhatsApp notification failed: {e}")
        return {"success": False, "error": str(e)}


# ============================================================================
# COMBINED NOTIFICATIONS (Email + WhatsApp to Avenue)
# ============================================================================

async def notify_new_campaign_application(
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    creator_level: str = None,
    creator_followers: int = None
):
    """WhatsApp notification for new application"""
    followers_text = f"👥 Seguidores: {creator_followers:,}" if creator_followers else ""
    level_text = f"⭐ Nivel: {creator_level}" if creator_level else ""
    
    wa_message = f"""👤 *NUEVA APLICACIÓN*

📸 *Campaña:* {campaign_name}
🏢 *Marca:* {brand_name}

*Aplicante:*
👤 {creator_name}
{level_text}
{followers_text}

Revisá en el panel de admin."""
    
    return await send_whatsapp_ugc_notification(wa_message, 'ugc')


async def notify_application_cancelled(
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    cancelled_by: str = "creator"
):
    """WhatsApp notification when application is cancelled"""
    by_label = "creador" if cancelled_by == "creator" else "admin"
    wa_message = f"""❌ *PARTICIPACIÓN CANCELADA*

📸 *Campaña:* {campaign_name}
🏢 *Marca:* {brand_name}
👤 *Creator:* {creator_name}

⚠️ Cancelado por: {by_label}

Se liberó un cupo en la campaña."""
    
    return await send_whatsapp_ugc_notification(wa_message, 'ugc')


async def notify_deliverable_submitted_whatsapp(
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """WhatsApp notification when content is submitted"""
    wa_message = f"""📤 *CONTENIDO ENTREGADO*

📸 *Campaña:* {campaign_name}
🏢 *Marca:* {brand_name}
👤 *Creator:* {creator_name}

Revisá en el panel de admin."""
    
    return await send_whatsapp_ugc_notification(wa_message, 'ugc')


async def notify_metrics_submitted_whatsapp(
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """WhatsApp notification when metrics are submitted"""
    wa_message = f"""📊 *MÉTRICAS ENTREGADAS*

📸 *Campaña:* {campaign_name}
🏢 *Marca:* {brand_name}
👤 *Creator:* {creator_name}

Revisá en el panel de admin."""
    
    return await send_whatsapp_ugc_notification(wa_message, 'ugc')


async def notify_deliverable_rated_whatsapp(
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    rating: int
):
    """WhatsApp notification when deliverable is rated"""
    stars = "⭐" * rating
    wa_message = f"""{stars} *CALIFICACIÓN*

📸 *Campaña:* {campaign_name}
🏢 *Marca:* {brand_name}
👤 *Creator:* {creator_name}
⭐ *Rating:* {rating}/5"""
    
    return await send_whatsapp_ugc_notification(wa_message, 'ugc')
