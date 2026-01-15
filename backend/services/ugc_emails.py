"""
UGC Platform - Email Notifications Service
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
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'Avenue UGC <onboarding@resend.dev>')

# Email Templates
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
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 30px 40px; border-bottom: 1px solid #222222;">
                                <span style="color: #d4a968; font-size: 24px; font-style: italic;">Avenue</span>
                                <span style="color: #ffffff; font-size: 24px;"> UGC</span>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                {content}
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid #222222;">
                                <p style="color: #666666; font-size: 12px; margin: 0;">
                                    © {datetime.now().year} Avenue UGC. Todos los derechos reservados.
                                </p>
                                <p style="color: #666666; font-size: 12px; margin: 10px 0 0 0;">
                                    Este es un email automático, por favor no respondas directamente.
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

async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """Send email using Resend (non-blocking)"""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return {"status": "skipped", "reason": "API key not configured"}
    
    try:
        params = {
            "from": SENDER_EMAIL,
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

# ==================== CREATOR NOTIFICATIONS ====================

async def send_application_confirmed(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str
):
    """Send when creator's application is confirmed"""
    subject = "🎉 ¡Felicitaciones! Tu aplicación fue confirmada"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Felicitaciones, {creator_name}!
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Tu aplicación a la campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            de <strong>{brand_name}</strong> ha sido confirmada.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Ya podés comenzar a crear contenido. Revisá los requisitos y fechas límite en tu workspace.
        </p>
        <a href="https://avenue.com.py/ugc/creator/workspace" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ir a mi Workspace
        </a>
    """
    return await send_email(to_email, subject, content)

async def send_application_rejected(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    reason: Optional[str] = None
):
    """Send when creator's application is rejected"""
    subject = "Actualización sobre tu aplicación"
    reason_text = f"<p style='color: #999999; font-size: 14px; margin: 20px 0;'>Motivo: {reason}</p>" if reason else ""
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {creator_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Lamentablemente, tu aplicación a la campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            no fue seleccionada en esta ocasión.
        </p>
        {reason_text}
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            ¡No te desanimes! Hay muchas más campañas esperando por vos.
        </p>
        <a href="https://avenue.com.py/ugc/campaigns" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ver otras campañas
        </a>
    """
    return await send_email(to_email, subject, content)

async def send_deliverable_approved(
    to_email: str,
    creator_name: str,
    campaign_name: str
):
    """Send when deliverable is approved"""
    subject = "✅ Tu entrega fue aprobada"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Excelente trabajo, {creator_name}!
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Tu entrega para la campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            ha sido aprobada por la marca.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Pronto se abrirá la ventana para que subas tus métricas de rendimiento.
        </p>
        <a href="https://avenue.com.py/ugc/creator/workspace" 
           style="display: inline-block; padding: 14px 28px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ver mi workspace
        </a>
    """
    return await send_email(to_email, subject, content)

async def send_changes_requested(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    feedback: Optional[str] = None
):
    """Send when brand requests changes"""
    subject = "📝 Cambios solicitados en tu entrega"
    feedback_text = f"""
        <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="color: #f59e0b; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Feedback de la marca:</p>
            <p style="color: #cccccc; font-size: 14px; margin: 0;">{feedback}</p>
        </div>
    """ if feedback else ""
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {creator_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            La marca ha solicitado algunos cambios en tu entrega para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        {feedback_text}
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Por favor revisá los comentarios y reenviá tu entrega actualizada.
        </p>
        <a href="https://avenue.com.py/ugc/creator/workspace" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Revisar y reenviar
        </a>
    """
    return await send_email(to_email, subject, content)

async def send_level_up(
    to_email: str,
    creator_name: str,
    new_level: str,
    benefits: dict
):
    """Send when creator levels up"""
    level_colors = {
        "trusted": "#3b82f6",
        "pro": "#8b5cf6",
        "elite": "#eab308"
    }
    level_icons = {
        "trusted": "✅",
        "pro": "💼",
        "elite": "👑"
    }
    color = level_colors.get(new_level, "#d4a968")
    icon = level_icons.get(new_level, "🌟")
    
    subject = f"{icon} ¡Subiste de nivel! Ahora sos {new_level.upper()}"
    content = f"""
        <div style="text-align: center; padding: 20px 0;">
            <span style="font-size: 64px;">{icon}</span>
        </div>
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
            ¡Felicitaciones, {creator_name}!
        </h1>
        <p style="color: #cccccc; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
            Subiste a nivel <strong style="color: {color};">{new_level.upper()}</strong>
        </p>
        <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #d4a968; font-size: 14px; margin: 0 0 15px 0; font-weight: 600;">Tus nuevos beneficios:</p>
            <ul style="color: #cccccc; font-size: 14px; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Máximo {benefits.get('max_active_campaigns', 4)} campañas activas</li>
                {'<li style="margin-bottom: 8px;">Prioridad en aplicaciones</li>' if benefits.get('priority_applications') else ''}
                {'<li style="margin-bottom: 8px;">Destacado en el catálogo de creators</li>' if benefits.get('featured_in_catalog') else ''}
            </ul>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://avenue.com.py/ugc/creator/dashboard" 
               style="display: inline-block; padding: 14px 28px; background-color: {color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver mi perfil
            </a>
        </div>
    """
    return await send_email(to_email, subject, content)

async def send_metrics_window_open(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    days_left: int
):
    """Send when metrics window opens"""
    subject = f"📊 Ventana de métricas abierta - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {creator_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            La ventana de métricas para tu entrega en <strong style="color: #d4a968;">{campaign_name}</strong> 
            ya está abierta.
        </p>
        <div style="background-color: #0891b2; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #ffffff; font-size: 14px; margin: 0 0 5px 0;">Tenés</p>
            <p style="color: #ffffff; font-size: 36px; font-weight: bold; margin: 0;">{days_left} días</p>
            <p style="color: #ffffff; font-size: 14px; margin: 5px 0 0 0;">para subir tus métricas</p>
        </div>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Subí un screenshot de las estadísticas de tu publicación para completar la entrega.
        </p>
        <a href="https://avenue.com.py/ugc/creator/workspace" 
           style="display: inline-block; padding: 14px 28px; background-color: #06b6d4; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Subir métricas
        </a>
    """
    return await send_email(to_email, subject, content)

# ==================== BRAND NOTIFICATIONS ====================

async def send_new_application(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    creator_name: str,
    creator_level: str,
    applications_count: int
):
    """Send when brand receives new application"""
    subject = f"📥 Nueva aplicación para {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {brand_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Tenés una nueva aplicación para tu campaña <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">{creator_name}</p>
            <p style="color: #8b5cf6; font-size: 14px; margin: 0;">Nivel: {creator_level.upper()}</p>
        </div>
        <p style="color: #666666; font-size: 14px; margin: 0 0 30px 0;">
            Total de aplicaciones: {applications_count}
        </p>
        <a href="https://avenue.com.py/ugc/brand/campaigns" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ver aplicaciones
        </a>
    """
    return await send_email(to_email, subject, content)

async def send_deliverable_submitted(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    creator_name: str
):
    """Send when creator submits deliverable for review"""
    subject = f"📦 Nueva entrega para revisar - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {brand_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            <strong>{creator_name}</strong> ha enviado su entrega para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Revisá el contenido y aprobalo o solicitá cambios.
        </p>
        <a href="https://avenue.com.py/ugc/brand/campaigns" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Revisar entrega
        </a>
    """
    return await send_email(to_email, subject, content)

async def send_campaign_completed(
    to_email: str,
    brand_name: str,
    campaign_name: str,
    total_deliverables: int,
    total_views: int
):
    """Send when campaign is completed"""
    subject = f"🎉 Campaña completada - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Felicitaciones, {brand_name}!
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Tu campaña <strong style="color: #d4a968;">{campaign_name}</strong> ha sido completada exitosamente.
        </p>
        <div style="display: flex; gap: 20px; margin: 30px 0;">
            <div style="flex: 1; background-color: #1a1a1a; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="color: #d4a968; font-size: 32px; font-weight: bold; margin: 0;">{total_deliverables}</p>
                <p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;">Entregas</p>
            </div>
            <div style="flex: 1; background-color: #1a1a1a; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="color: #22c55e; font-size: 32px; font-weight: bold; margin: 0;">{total_views:,}</p>
                <p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;">Views totales</p>
            </div>
        </div>
        <a href="https://avenue.com.py/ugc/brand/campaigns" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ver reporte completo
        </a>
    """
    return await send_email(to_email, subject, content)

# ==================== WELCOME EMAILS ====================

async def send_creator_welcome(to_email: str, creator_name: str):
    """Send welcome email to new creator"""
    subject = f"🎬 ¡Bienvenido a Avenue UGC, {creator_name}!"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Bienvenido a Avenue UGC!
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {creator_name}, nos alegra que te hayas unido a nuestra comunidad de creadores de contenido.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Ahora podés:
        </p>
        <ul style="color: #cccccc; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>Explorar campañas disponibles</li>
            <li>Aplicar a colaboraciones con marcas</li>
            <li>Crear contenido y ganar experiencia</li>
            <li>Subir de nivel y desbloquear beneficios</li>
        </ul>
        <a href="https://avenue.com.py/ugc/campaigns" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ver campañas disponibles
        </a>
    """
    return await send_email(to_email, subject, content)

async def send_brand_welcome(to_email: str, brand_name: str):
    """Send welcome email to new brand"""
    subject = f"🏢 ¡Bienvenido a Avenue UGC, {brand_name}!"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Bienvenido a Avenue UGC!
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola {brand_name}, gracias por unirte a nuestra plataforma de creadores de contenido UGC.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Para comenzar:
        </p>
        <ol style="color: #cccccc; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>Elegí un paquete de deliveries</li>
            <li>Creá tu primera campaña</li>
            <li>Recibí aplicaciones de creators verificados</li>
            <li>Revisá y aprobá el contenido</li>
        </ol>
        <a href="https://avenue.com.py/ugc/brand/packages" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ver paquetes
        </a>
    """
    return await send_email(to_email, subject, content)

# ==================== RATING NOTIFICATION ====================

async def send_deliverable_rated(
    to_email: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    rating: int,
    comment: Optional[str] = None
):
    """Send notification to creator when their deliverable is rated by a brand"""
    subject = f"⭐ Tu entrega fue calificada - {campaign_name}"
    
    # Generate star display
    stars_html = ""
    for i in range(5):
        if i < rating:
            stars_html += '<span style="color: #f59e0b; font-size: 24px;">★</span>'
        else:
            stars_html += '<span style="color: #666666; font-size: 24px;">☆</span>'
    
    comment_html = ""
    if comment:
        comment_html = f"""
        <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #d4a968; margin: 20px 0;">
            <p style="color: #d4a968; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Comentario de la marca:</p>
            <p style="color: #cccccc; font-size: 14px; margin: 0; font-style: italic;">"{comment}"</p>
        </div>
        """
    
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Hola {creator_name}!
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            <strong style="color: #d4a968;">{brand_name}</strong> ha calificado tu entrega para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        
        <div style="text-align: center; padding: 30px 0;">
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Tu calificación:</p>
            <div style="margin-bottom: 10px;">
                {stars_html}
            </div>
            <p style="color: #d4a968; font-size: 32px; font-weight: bold; margin: 0;">{rating}/5</p>
        </div>
        
        {comment_html}
        
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 20px 0 30px 0;">
            Esta calificación se suma a tu perfil y ayuda a construir tu reputación en la plataforma.
        </p>
        
        <a href="https://avenue.com.py/ugc/creator/feedback" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ver todas mis calificaciones
        </a>
    """
    return await send_email(to_email, subject, content)


# ==================== WHATSAPP NOTIFICATIONS ====================
# Import WhatsApp service for dual notifications

async def send_whatsapp_ugc_notification(message: str, notification_type: str = 'ugc'):
    """Send WhatsApp notification to UGC admin"""
    try:
        from whatsapp_service import send_admin_notification
        return await send_admin_notification(message, notification_type)
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification: {e}")
        return {"success": False, "error": str(e)}


async def notify_creator_application_confirmed(
    creator_email: str,
    creator_name: str,
    creator_phone: Optional[str],
    campaign_name: str,
    brand_name: str,
    deadline: str
):
    """Notify creator when their application is confirmed - Email + WhatsApp"""
    # Send Email
    subject = f"🎉 ¡Felicitaciones! Fuiste seleccionado - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Felicitaciones {creator_name}!
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            <strong style="color: #d4a968;">{brand_name}</strong> te ha seleccionado para participar en la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #d4a968; font-size: 14px; margin: 0 0 10px 0;">📅 Fecha límite de entrega:</p>
            <p style="color: #ffffff; font-size: 18px; margin: 0; font-weight: 600;">{deadline}</p>
        </div>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Ingresá a tu workspace para ver los detalles de la campaña y comenzar a crear contenido.
        </p>
        <a href="https://avenue.com.py/ugc/creator/workspace" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ir a mi Workspace
        </a>
    """
    email_result = await send_email(creator_email, subject, content)
    
    # Send WhatsApp to creator
    if creator_phone:
        try:
            from whatsapp_service import send_whatsapp_message
            wa_message = f"""🎉 *¡FELICITACIONES {creator_name.upper()}!*

Fuiste seleccionado para la campaña:
📸 *{campaign_name}*
🏢 Marca: {brand_name}

📅 *Fecha límite:* {deadline}

Ingresá a tu workspace para ver los detalles:
👉 avenue.com.py/ugc/creator/workspace"""
            await send_whatsapp_message(creator_phone, wa_message)
        except Exception as e:
            logger.error(f"WhatsApp to creator failed: {e}")
    
    return email_result


async def notify_creator_application_rejected(
    creator_email: str,
    creator_name: str,
    campaign_name: str
):
    """Notify creator when their application is rejected - Email only"""
    subject = f"Actualización sobre tu aplicación - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {creator_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Gracias por tu interés en la campaña <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            En esta ocasión, la marca ha decidido avanzar con otros perfiles que se ajustan mejor a sus necesidades actuales.
        </p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            ¡No te desanimes! Hay muchas más oportunidades esperándote. Seguí aplicando a campañas y mejorando tu perfil.
        </p>
        <a href="https://avenue.com.py/ugc/campaigns" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ver otras campañas
        </a>
    """
    return await send_email(creator_email, subject, content)


async def notify_deliverable_submitted(
    campaign_name: str,
    creator_name: str,
    delivery_number: int,
    content_url: str
):
    """Notify admin when creator submits a deliverable - WhatsApp"""
    wa_message = f"""📤 *NUEVA ENTREGA RECIBIDA*

📸 *Campaña:* {campaign_name}
👤 *Creator:* {creator_name}
🔢 *Entrega #:* {delivery_number}

🔗 Contenido: {content_url}

Revisá en el panel de admin."""
    
    return await send_whatsapp_ugc_notification(wa_message, 'ugc')


async def notify_deliverable_approved(
    creator_email: str,
    creator_name: str,
    creator_phone: Optional[str],
    campaign_name: str,
    brand_name: str
):
    """Notify creator when deliverable is approved - Email + WhatsApp"""
    subject = f"✅ Tu entrega fue aprobada - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Excelente trabajo {creator_name}!
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            <strong style="color: #d4a968;">{brand_name}</strong> ha aprobado tu entrega para la campaña 
            <strong style="color: #d4a968;">{campaign_name}</strong>.
        </p>
        <div style="background-color: #22c55e20; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
            <p style="color: #22c55e; font-size: 16px; margin: 0;">✅ Entrega aprobada exitosamente</p>
        </div>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Ahora podés publicar el contenido en tus redes y subir las métricas una vez que tengas resultados.
        </p>
        <a href="https://avenue.com.py/ugc/creator/workspace" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ver mi Workspace
        </a>
    """
    email_result = await send_email(creator_email, subject, content)
    
    # Send WhatsApp to creator
    if creator_phone:
        try:
            from whatsapp_service import send_whatsapp_message
            wa_message = f"""✅ *¡ENTREGA APROBADA!*

Tu contenido para *{campaign_name}* fue aprobado por {brand_name}.

📤 Ahora podés publicarlo en tus redes.
📊 No olvides subir las métricas después.

👉 avenue.com.py/ugc/creator/workspace"""
            await send_whatsapp_message(creator_phone, wa_message)
        except Exception as e:
            logger.error(f"WhatsApp to creator failed: {e}")
    
    return email_result


async def notify_deliverable_changes_requested(
    creator_email: str,
    creator_name: str,
    creator_phone: Optional[str],
    campaign_name: str,
    feedback: str
):
    """Notify creator when changes are requested - Email + WhatsApp"""
    subject = f"📝 Cambios solicitados - {campaign_name}"
    content = f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            Hola {creator_name}
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            La marca ha revisado tu entrega para <strong style="color: #d4a968;">{campaign_name}</strong> y solicita algunos ajustes.
        </p>
        <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="color: #f59e0b; font-size: 14px; margin: 0 0 10px 0;">📝 Feedback de la marca:</p>
            <p style="color: #cccccc; font-size: 14px; margin: 0; font-style: italic;">"{feedback}"</p>
        </div>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Por favor revisá los comentarios y volvé a subir tu contenido actualizado.
        </p>
        <a href="https://avenue.com.py/ugc/creator/workspace" 
           style="display: inline-block; padding: 14px 28px; background-color: #d4a968; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Revisar y reenviar
        </a>
    """
    email_result = await send_email(creator_email, subject, content)
    
    # Send WhatsApp to creator
    if creator_phone:
        try:
            from whatsapp_service import send_whatsapp_message
            wa_message = f"""📝 *CAMBIOS SOLICITADOS*

Tu entrega para *{campaign_name}* necesita ajustes.

💬 Feedback: "{feedback[:100]}{'...' if len(feedback) > 100 else ''}"

Por favor revisá y reenviá tu contenido.
👉 avenue.com.py/ugc/creator/workspace"""
            await send_whatsapp_message(creator_phone, wa_message)
        except Exception as e:
            logger.error(f"WhatsApp to creator failed: {e}")
    
    return email_result


async def notify_metrics_submitted(
    campaign_name: str,
    creator_name: str,
    platform: str,
    views: int,
    likes: int
):
    """Notify admin when metrics are submitted - WhatsApp"""
    wa_message = f"""📊 *MÉTRICAS ENVIADAS*

📸 *Campaña:* {campaign_name}
👤 *Creator:* {creator_name}
📱 *Plataforma:* {platform}

📈 Views: {views:,}
❤️ Likes: {likes:,}

Verificá en el panel de admin."""
    
    return await send_whatsapp_ugc_notification(wa_message, 'ugc')


async def notify_new_campaign_application(
    campaign_name: str,
    brand_name: str,
    creator_name: str,
    creator_level: str,
    creator_followers: int
):
    """Notify admin when new application is received - WhatsApp"""
    wa_message = f"""👤 *NUEVA APLICACIÓN*

📸 *Campaña:* {campaign_name}
🏢 *Marca:* {brand_name}

*Aplicante:*
👤 {creator_name}
⭐ Nivel: {creator_level}
👥 Seguidores: {creator_followers:,}

Revisá en el panel de admin."""
    
    return await send_whatsapp_ugc_notification(wa_message, 'ugc')


async def notify_application_cancelled(
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    cancelled_by: str = "creator"
):
    """Notify admin when a confirmed application is cancelled - WhatsApp"""
    by_label = "creador" if cancelled_by == "creator" else "admin"
    wa_message = f"""❌ *PARTICIPACIÓN CANCELADA*

📸 *Campaña:* {campaign_name}
🏢 *Marca:* {brand_name}
👤 *Creator:* {creator_name}

⚠️ Cancelado por: {by_label}

Se liberó un cupo en la campaña."""
    
    return await send_whatsapp_ugc_notification(wa_message, 'ugc')


async def notify_deliverable_rated_whatsapp(
    creator_phone: str,
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    rating: int,
    comment: Optional[str] = None
):
    """Send WhatsApp notification when deliverable is rated"""
    if not creator_phone:
        return {"success": False, "error": "No phone number"}
    
    stars = "⭐" * rating + "☆" * (5 - rating)
    
    comment_text = ""
    if comment:
        comment_text = f'\n\n💬 Comentario: "{comment[:80]}{"..." if len(comment) > 80 else ""}"'
    
    wa_message = f"""⭐ *NUEVA CALIFICACIÓN*

{brand_name} calificó tu trabajo en:
📸 *{campaign_name}*

{stars} ({rating}/5){comment_text}

Ver todas tus calificaciones:
👉 avenue.com.py/ugc/creator/feedback"""
    
    try:
        from whatsapp_service import send_whatsapp_message
        return await send_whatsapp_message(creator_phone, wa_message)
    except Exception as e:
        logger.error(f"WhatsApp rating notification failed: {e}")
        return {"success": False, "error": str(e)}
