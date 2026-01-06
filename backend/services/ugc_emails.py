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
    subject = f"🎉 ¡Felicitaciones! Tu aplicación fue confirmada"
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
    subject = f"Actualización sobre tu aplicación"
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
    subject = f"✅ Tu entrega fue aprobada"
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
    subject = f"📝 Cambios solicitados en tu entrega"
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
