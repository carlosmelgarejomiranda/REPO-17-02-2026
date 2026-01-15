"""
UGC Platform - Notification Service
Handles email notifications for all UGC events
"""

import asyncio
import os
import resend
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'AVENUE UGC <creadoresUGC@avenue.com.py>')
BASE_URL = os.environ.get('FRONTEND_URL', 'https://avenue.com.py')

# Email templates
EMAIL_STYLES = """
<style>
    .email-container {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        background-color: #0d0d0d;
        color: #f5ede4;
        padding: 40px;
    }
    .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 1px solid #333;
        padding-bottom: 20px;
    }
    .header h1 {
        color: #d4a968;
        font-style: italic;
        font-weight: 300;
        margin: 0;
    }
    .content {
        padding: 20px 0;
    }
    .highlight {
        color: #d4a968;
    }
    .button {
        display: inline-block;
        background-color: #d4a968;
        color: #0d0d0d;
        padding: 12px 24px;
        text-decoration: none;
        font-weight: 500;
        margin-top: 20px;
    }
    .footer {
        text-align: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #333;
        color: #666;
        font-size: 12px;
    }
    .card {
        background-color: #1a1a1a;
        padding: 20px;
        border: 1px solid #333;
        margin: 20px 0;
    }
</style>
"""


def email_template(title: str, content: str, button_text: str = None, button_url: str = None) -> str:
    """Generate email HTML from template"""
    button_html = ""
    if button_text and button_url:
        button_html = f'<a href="{button_url}" class="button">{button_text}</a>'
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>{EMAIL_STYLES}</head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Avenue UGC</h1>
                <p style="color: #a8a8a8; margin-top: 10px;">{title}</p>
            </div>
            <div class="content">
                {content}
                {button_html}
            </div>
            <div class="footer">
                <p>Avenue - Paseo Los Árboles, Asunción</p>
                <p>© 2024 Avenue. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """


async def send_email(to: str, subject: str, html: str):
    """Send email via Resend"""
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


# ==================== CREATOR NOTIFICATIONS ====================

async def notify_creator_shortlisted(creator_email: str, creator_name: str, campaign_name: str, brand_name: str):
    """Notify creator they've been shortlisted"""
    content = f"""
    <p>Hola <span class="highlight">{creator_name}</span>,</p>
    <p>¡Buenas noticias! Fuiste preseleccionado/a para la campaña:</p>
    <div class="card">
        <h3 style="color: #d4a968; margin: 0;">{campaign_name}</h3>
        <p style="color: #a8a8a8; margin: 10px 0 0 0;">Por {brand_name}</p>
    </div>
    <p>La marca está revisando tu perfil. Te notificaremos cuando confirmen tu participación.</p>
    """
    
    html = email_template(
        "Preseleccionado/a",
        content,
        "Ver Mis Aplicaciones",
        f"{BASE_URL}/ugc/creator/applications"
    )
    
    await send_email(creator_email, f"⭐ Preseleccionado para {campaign_name}", html)


async def notify_creator_confirmed(creator_email: str, creator_name: str, campaign_name: str, brand_name: str, campaign_id: str):
    """Notify creator they've been confirmed"""
    content = f"""
    <p>Hola <span class="highlight">{creator_name}</span>,</p>
    <p>¡Felicitaciones! Tu participación fue confirmada para:</p>
    <div class="card">
        <h3 style="color: #d4a968; margin: 0;">{campaign_name}</h3>
        <p style="color: #a8a8a8; margin: 10px 0 0 0;">Por {brand_name}</p>
    </div>
    <p>Ya podés ver los detalles del canje y los requisitos del contenido en tu workspace.</p>
    <p><strong>Próximos pasos:</strong></p>
    <ol>
        <li>Coordiná el canje con la marca</li>
        <li>Creá y publicá tu contenido</li>
        <li>Subi el link a la plataforma</li>
    </ol>
    """
    
    html = email_template(
        "¡Confirmado!",
        content,
        "Ir a Mi Workspace",
        f"{BASE_URL}/ugc/creator/workspace"
    )
    
    await send_email(creator_email, f"✅ Confirmado para {campaign_name}", html)


async def notify_creator_rejected(creator_email: str, creator_name: str, campaign_name: str, reason: str = None):
    """Notify creator their application was rejected"""
    reason_text = f"<p><em>Motivo: {reason}</em></p>" if reason else ""
    
    content = f"""
    <p>Hola <span class="highlight">{creator_name}</span>,</p>
    <p>Lamentablemente tu aplicación para <strong>{campaign_name}</strong> no fue seleccionada en esta ocasión.</p>
    {reason_text}
    <p>No te desanimes, hay muchas más campañas disponibles. ¡Seguí aplicando!</p>
    """
    
    html = email_template(
        "Aplicación No Seleccionada",
        content,
        "Ver Campañas Disponibles",
        f"{BASE_URL}/ugc/campaigns"
    )
    
    await send_email(creator_email, f"Actualización sobre {campaign_name}", html)


async def notify_creator_content_approved(creator_email: str, creator_name: str, campaign_name: str):
    """Notify creator their content was approved"""
    content = f"""
    <p>Hola <span class="highlight">{creator_name}</span>,</p>
    <p>¡Tu contenido para <strong>{campaign_name}</strong> fue aprobado! 🎉</p>
    <p>Ahora solo falta subir las métricas. Recordá que tenés una ventana de 7-14 días desde la publicación para enviar el screenshot de tus estadísticas.</p>
    """
    
    html = email_template(
        "Contenido Aprobado",
        content,
        "Subir Métricas",
        f"{BASE_URL}/ugc/creator/workspace"
    )
    
    await send_email(creator_email, f"✅ Contenido aprobado - {campaign_name}", html)


async def notify_creator_changes_requested(creator_email: str, creator_name: str, campaign_name: str, notes: str):
    """Notify creator that changes were requested"""
    content = f"""
    <p>Hola <span class="highlight">{creator_name}</span>,</p>
    <p>La marca solicitó algunos ajustes en tu entrega para <strong>{campaign_name}</strong>:</p>
    <div class="card">
        <p style="margin: 0;">{notes}</p>
    </div>
    <p>Por favor realizá los cambios y volvé a enviar tu entrega.</p>
    """
    
    html = email_template(
        "Cambios Solicitados",
        content,
        "Ver Detalles",
        f"{BASE_URL}/ugc/creator/workspace"
    )
    
    await send_email(creator_email, f"⚠️ Cambios solicitados - {campaign_name}", html)


async def notify_creator_metrics_window(creator_email: str, creator_name: str, campaign_name: str):
    """Notify creator that metrics window is open"""
    content = f"""
    <p>Hola <span class="highlight">{creator_name}</span>,</p>
    <p>Ya pasó una semana desde que publicaste tu contenido para <strong>{campaign_name}</strong>.</p>
    <p>¡Es momento de subir tus métricas! Tenés hasta el día 14 para enviar el screenshot de tus estadísticas.</p>
    """
    
    html = email_template(
        "Ventana de Métricas Abierta",
        content,
        "Subir Métricas",
        f"{BASE_URL}/ugc/creator/workspace"
    )
    
    await send_email(creator_email, f"📊 Subi tus métricas - {campaign_name}", html)


async def notify_creator_new_review(creator_email: str, creator_name: str, campaign_name: str, rating: int, comment: str = None):
    """Notify creator of new review"""
    stars = "⭐" * rating
    comment_text = f'<p style="color: #a8a8a8;"><em>"{comment}"</em></p>' if comment else ""
    
    content = f"""
    <p>Hola <span class="highlight">{creator_name}</span>,</p>
    <p>Recibiste una nueva calificación por tu trabajo en <strong>{campaign_name}</strong>:</p>
    <div class="card" style="text-align: center;">
        <p style="font-size: 24px; margin: 0;">{stars}</p>
        {comment_text}
    </div>
    """
    
    html = email_template(
        "Nueva Calificación",
        content,
        "Ver Mi Perfil",
        f"{BASE_URL}/ugc/creator/profile"
    )
    
    await send_email(creator_email, f"{stars} Nueva calificación recibida", html)


# ==================== BRAND NOTIFICATIONS ====================

async def notify_brand_new_application(brand_email: str, brand_name: str, campaign_name: str, creator_name: str, creator_username: str):
    """Notify brand of new application"""
    content = f"""
    <p>Hola <span class="highlight">{brand_name}</span>,</p>
    <p>Tenés una nueva aplicación para tu campaña <strong>{campaign_name}</strong>:</p>
    <div class="card">
        <h3 style="color: #d4a968; margin: 0;">@{creator_username}</h3>
        <p style="color: #a8a8a8; margin: 10px 0 0 0;">{creator_name}</p>
    </div>
    """
    
    html = email_template(
        "Nueva Aplicación",
        content,
        "Ver Aplicaciones",
        f"{BASE_URL}/ugc/brand/campaigns"
    )
    
    await send_email(brand_email, f"👤 Nueva aplicación - {campaign_name}", html)


async def notify_brand_content_submitted(brand_email: str, brand_name: str, campaign_name: str, creator_name: str):
    """Notify brand of submitted content"""
    content = f"""
    <p>Hola <span class="highlight">{brand_name}</span>,</p>
    <p><strong>{creator_name}</strong> envió su contenido para revisión en la campaña <strong>{campaign_name}</strong>.</p>
    <p>Tenés 48 horas para revisarlo y dar feedback.</p>
    """
    
    html = email_template(
        "Contenido Para Revisar",
        content,
        "Revisar Ahora",
        f"{BASE_URL}/ugc/brand/deliverables"
    )
    
    await send_email(brand_email, f"📸 Nuevo contenido para revisar - {campaign_name}", html)


async def notify_brand_metrics_received(brand_email: str, brand_name: str, campaign_name: str):
    """Notify brand that metrics were received"""
    content = f"""
    <p>Hola <span class="highlight">{brand_name}</span>,</p>
    <p>Se recibieron nuevas métricas para tu campaña <strong>{campaign_name}</strong>.</p>
    <p>Podés ver el reporte actualizado en tu dashboard.</p>
    """
    
    html = email_template(
        "Métricas Actualizadas",
        content,
        "Ver Reporte",
        f"{BASE_URL}/ugc/brand/reports"
    )
    
    await send_email(brand_email, f"📊 Métricas actualizadas - {campaign_name}", html)


async def notify_brand_campaign_completed(brand_email: str, brand_name: str, campaign_name: str):
    """Notify brand that campaign is completed"""
    content = f"""
    <p>Hola <span class="highlight">{brand_name}</span>,</p>
    <p>¡Tu campaña <strong>{campaign_name}</strong> fue completada! 🎉</p>
    <p>Todas las entregas fueron aprobadas y las métricas fueron recibidas.</p>
    <p>No olvides calificar a los creadores que participaron.</p>
    """
    
    html = email_template(
        "¡Campaña Completada!",
        content,
        "Ver Reporte Final",
        f"{BASE_URL}/ugc/brand/reports"
    )
    
    await send_email(brand_email, f"🎉 Campaña completada - {campaign_name}", html)
