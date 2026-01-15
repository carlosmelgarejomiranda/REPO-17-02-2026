"""
Transactional Email Service for Avenue
Handles all automated emails for ecommerce, studio, UGC, and brands
"""

import resend
import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY')

# Email sender addresses
EMAIL_SENDERS = {
    'ecommerce': 'AVENUE Pedidos <pedidos@avenue.com.py>',
    'studio': 'AVENUE Studio <reservas@avenue.com.py>',
    'ugc': 'AVENUE UGC <creadoresUGC@avenue.com.py>',
    'brands': 'AVENUE UGC Marcas <infobrands@avenue.com.py>',
}

# Admin email for notifications
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'avenuepy@gmail.com')

# Base URL for links
BASE_URL = os.environ.get('FRONTEND_URL', 'https://avenue.com.py')

# Company info for footer
COMPANY_INFO = {
    'name': 'AVENUE MALL EAS',
    'ruc': '80152251-0',
    'address': 'Paseo Los Árboles, Av. San Martín entre Sucre y Moisés Bertoni',
    'city': 'Asunción, Paraguay',
    'whatsapp': '+595973666000',
    'email': 'avenuepy@gmail.com'
}

# ==================== EMAIL TEMPLATES ====================

def get_base_template(content: str, preview_text: str = "") -> str:
    """Base HTML template with Avenue branding"""
    return f'''
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>AVENUE</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {{font-family: Arial, Helvetica, sans-serif !important;}}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <!-- Preview text -->
    <div style="display: none; max-height: 0; overflow: hidden;">
        {preview_text}
    </div>
    
    <!-- Main container -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0d0d0d;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Content card -->
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #1a1a1a; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px; border-bottom: 1px solid rgba(212, 169, 104, 0.2);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 0.3em; color: #d4a968;">AVENUE</h1>
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
                        <td style="padding: 30px 40px; background-color: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 10px; color: #888; font-size: 12px; line-height: 1.6;">
                                            <strong style="color: #d4a968;">{COMPANY_INFO['name']}</strong><br>
                                            RUC: {COMPANY_INFO['ruc']}<br>
                                            {COMPANY_INFO['address']}<br>
                                            {COMPANY_INFO['city']}
                                        </p>
                                        <p style="margin: 15px 0 0; font-size: 11px; color: #666;">
                                            <a href="{BASE_URL}/politica-privacidad" style="color: #888; text-decoration: underline;">Política de Privacidad</a>
                                            &nbsp;|&nbsp;
                                            <a href="{BASE_URL}/shop/terminos-condiciones" style="color: #888; text-decoration: underline;">Términos y Condiciones</a>
                                        </p>
                                        <p style="margin: 15px 0 0; font-size: 11px; color: #555;">
                                            Este es un email transaccional. Si tienes dudas, contáctanos por 
                                            <a href="https://wa.me/{COMPANY_INFO['whatsapp'].replace('+', '')}" style="color: #d4a968; text-decoration: none;">WhatsApp</a>
                                            o escríbenos a <a href="mailto:{COMPANY_INFO['email']}" style="color: #d4a968; text-decoration: none;">{COMPANY_INFO['email']}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''

def format_price(amount: float) -> str:
    """Format price in Guaranies"""
    return f"₲ {amount:,.0f}".replace(",", ".")

def format_date(date_str: str) -> str:
    """Format date for display"""
    try:
        if isinstance(date_str, str):
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        else:
            date_obj = date_str
        return date_obj.strftime("%d/%m/%Y")
    except:
        return date_str

def format_datetime(date_str: str) -> str:
    """Format datetime for display"""
    try:
        if isinstance(date_str, str):
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        else:
            date_obj = date_str
        return date_obj.strftime("%d/%m/%Y a las %H:%M")
    except:
        return date_str

# ==================== ECOMMERCE EMAILS ====================

def order_confirmation_email(order: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate order confirmation email"""
    items_html = ""
    for item in order.get('items', []):
        items_html += f'''
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="margin: 0; color: #fff; font-size: 14px;">{item.get('name', 'Producto')}</p>
                <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Cantidad: {item.get('quantity', 1)}</p>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                <p style="margin: 0; color: #d4a968; font-size: 14px;">{format_price(item.get('price', 0) * item.get('quantity', 1))}</p>
            </td>
        </tr>
        '''
    
    delivery_info = ""
    if order.get('delivery_type') == 'delivery':
        addr = order.get('delivery_address', {})
        delivery_info = f'''
        <div style="margin-top: 20px; padding: 15px; background-color: rgba(255,255,255,0.05); border-radius: 8px;">
            <p style="margin: 0 0 8px; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Dirección de entrega</p>
            <p style="margin: 0; color: #fff; font-size: 14px;">{addr.get('address', 'No especificada')}</p>
        </div>
        '''
    else:
        delivery_info = '''
        <div style="margin-top: 20px; padding: 15px; background-color: rgba(255,255,255,0.05); border-radius: 8px;">
            <p style="margin: 0 0 8px; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Retiro en tienda</p>
            <p style="margin: 0; color: #fff; font-size: 14px;">Paseo Los Árboles, Av. San Martín entre Sucre y Moisés Bertoni, Asunción</p>
        </div>
        '''
    
    subtotal = order.get('subtotal', 0)
    delivery_cost = order.get('delivery_cost', 0)
    discount = order.get('discount', 0)
    total = order.get('total', subtotal + delivery_cost - discount)
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; margin: 0 auto 20px; background-color: rgba(212, 169, 104, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">✓</span>
        </div>
        <h2 style="margin: 0; color: #fff; font-size: 24px; font-weight: 400;">¡Pedido Confirmado!</h2>
        <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Gracias por tu compra en AVENUE</p>
    </div>
    
    <div style="background-color: rgba(212, 169, 104, 0.1); border: 1px solid rgba(212, 169, 104, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td>
                    <p style="margin: 0; color: #888; font-size: 12px;">Nº de Pedido</p>
                    <p style="margin: 4px 0 0; color: #d4a968; font-size: 18px; font-weight: 600;">{order.get('order_id', 'N/A')}</p>
                </td>
                <td style="text-align: right;">
                    <p style="margin: 0; color: #888; font-size: 12px;">Fecha</p>
                    <p style="margin: 4px 0 0; color: #fff; font-size: 14px;">{format_date(order.get('created_at', ''))}</p>
                </td>
            </tr>
        </table>
    </div>
    
    <p style="margin: 0 0 15px; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Resumen del pedido</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        {items_html}
        <tr>
            <td style="padding: 12px 0;"><p style="margin: 0; color: #888; font-size: 14px;">Subtotal</p></td>
            <td style="padding: 12px 0; text-align: right;"><p style="margin: 0; color: #fff; font-size: 14px;">{format_price(subtotal)}</p></td>
        </tr>
        <tr>
            <td style="padding: 12px 0;"><p style="margin: 0; color: #888; font-size: 14px;">Envío</p></td>
            <td style="padding: 12px 0; text-align: right;"><p style="margin: 0; color: #fff; font-size: 14px;">{format_price(delivery_cost) if delivery_cost > 0 else 'Gratis'}</p></td>
        </tr>
        {f'<tr><td style="padding: 12px 0;"><p style="margin: 0; color: #4ade80; font-size: 14px;">Descuento</p></td><td style="padding: 12px 0; text-align: right;"><p style="margin: 0; color: #4ade80; font-size: 14px;">-{format_price(discount)}</p></td></tr>' if discount > 0 else ''}
        <tr>
            <td style="padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.2);"><p style="margin: 0; color: #fff; font-size: 16px; font-weight: 600;">Total</p></td>
            <td style="padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.2); text-align: right;"><p style="margin: 0; color: #d4a968; font-size: 20px; font-weight: 600;">{format_price(total)}</p></td>
        </tr>
    </table>
    
    {delivery_info}
    
    <div style="margin-top: 30px; text-align: center;">
        <a href="{BASE_URL}/shop" style="display: inline-block; padding: 14px 30px; background-color: #d4a968; color: #000; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Ver más productos</a>
    </div>
    
    <p style="margin: 30px 0 0; color: #888; font-size: 13px; text-align: center;">
        ¿Tienes alguna pregunta? <a href="https://wa.me/{COMPANY_INFO['whatsapp'].replace('+', '')}?text=Hola! Tengo una consulta sobre mi pedido {order.get('order_id', '')}" style="color: #d4a968; text-decoration: none;">Escríbenos por WhatsApp</a>
    </p>
    '''
    
    subject = f"✓ Pedido #{order.get('order_id', '')} confirmado - AVENUE"
    preview = f"Tu pedido por {format_price(total)} ha sido confirmado"
    html = get_base_template(content, preview)
    
    return subject, html, preview


def order_status_update_email(order: Dict[str, Any], new_status: str) -> tuple[str, str, str]:
    """Generate order status update email"""
    
    status_config = {
        'preparing': {
            'icon': '📦',
            'title': 'Tu pedido está en preparación',
            'message': 'Estamos preparando tu pedido con mucho cuidado.',
            'subject': '📦 Tu pedido está siendo preparado'
        },
        'ready': {
            'icon': '✅',
            'title': '¡Tu pedido está listo!',
            'message': 'Tu pedido está listo para retiro en nuestra tienda.',
            'subject': '✅ Tu pedido está listo para retirar'
        },
        'shipped': {
            'icon': '🚚',
            'title': '¡Tu pedido fue despachado!',
            'message': 'Tu pedido está en camino a tu dirección.',
            'subject': '🚚 Tu pedido está en camino'
        },
        'delivered': {
            'icon': '🎉',
            'title': '¡Pedido entregado!',
            'message': 'Tu pedido ha sido entregado. ¡Esperamos que lo disfrutes!',
            'subject': '🎉 Tu pedido fue entregado'
        },
        'cancelled': {
            'icon': '❌',
            'title': 'Pedido cancelado',
            'message': 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
            'subject': '❌ Tu pedido fue cancelado'
        }
    }
    
    config = status_config.get(new_status, {
        'icon': '📋',
        'title': f'Actualización de pedido',
        'message': f'El estado de tu pedido ha cambiado a: {new_status}',
        'subject': f'Actualización de tu pedido'
    })
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 20px;">{config['icon']}</div>
        <h2 style="margin: 0; color: #fff; font-size: 24px; font-weight: 400;">{config['title']}</h2>
        <p style="margin: 10px 0 0; color: #888; font-size: 14px;">{config['message']}</p>
    </div>
    
    <div style="background-color: rgba(212, 169, 104, 0.1); border: 1px solid rgba(212, 169, 104, 0.3); border-radius: 8px; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #888; font-size: 12px;">Nº de Pedido</p>
        <p style="margin: 8px 0 0; color: #d4a968; font-size: 24px; font-weight: 600;">{order.get('order_id', 'N/A')}</p>
    </div>
    
    <p style="margin: 30px 0 0; color: #888; font-size: 13px; text-align: center;">
        ¿Tienes alguna pregunta? <a href="https://wa.me/{COMPANY_INFO['whatsapp'].replace('+', '')}?text=Hola! Tengo una consulta sobre mi pedido {order.get('order_id', '')}" style="color: #d4a968; text-decoration: none;">Escríbenos por WhatsApp</a>
    </p>
    '''
    
    subject = f"{config['subject']} - #{order.get('order_id', '')}"
    preview = config['message']
    html = get_base_template(content, preview)
    
    return subject, html, preview


# ==================== STUDIO EMAILS ====================

def booking_confirmation_email(reservation: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate studio booking confirmation email"""
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; margin: 0 auto 20px; background-color: rgba(212, 169, 104, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">📸</span>
        </div>
        <h2 style="margin: 0; color: #fff; font-size: 24px; font-weight: 400;">¡Reserva Confirmada!</h2>
        <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Tu sesión en AVENUE Studio está confirmada</p>
    </div>
    
    <div style="background-color: rgba(212, 169, 104, 0.1); border: 1px solid rgba(212, 169, 104, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="text-align: center;">
                    <p style="margin: 0; color: #888; font-size: 12px;">FECHA Y HORA</p>
                    <p style="margin: 8px 0 0; color: #d4a968; font-size: 22px; font-weight: 600;">{reservation.get('date', '')}</p>
                    <p style="margin: 4px 0 0; color: #fff; font-size: 18px;">{reservation.get('time', '')} - {reservation.get('end_time', '')}</p>
                </td>
            </tr>
        </table>
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 25px;">
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="margin: 0; color: #888; font-size: 12px;">Duración</p>
                <p style="margin: 4px 0 0; color: #fff; font-size: 14px;">{reservation.get('duration', 1)} hora(s)</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="margin: 0; color: #888; font-size: 12px;">Total</p>
                <p style="margin: 4px 0 0; color: #d4a968; font-size: 16px; font-weight: 600;">{format_price(reservation.get('total_price', 0))}</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 12px 0;">
                <p style="margin: 0; color: #888; font-size: 12px;">Ubicación</p>
                <p style="margin: 4px 0 0; color: #fff; font-size: 14px;">AVENUE Studio - Paseo Los Árboles, Av. San Martín entre Sucre y Moisés Bertoni, Asunción</p>
            </td>
        </tr>
    </table>
    
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <p style="margin: 0 0 12px; color: #d4a968; font-size: 14px; font-weight: 600;">📋 Recordatorios importantes</p>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #888; font-size: 13px; line-height: 1.8;">
            <li>Llega 10 minutos antes de tu hora reservada</li>
            <li>El estudio admite máximo 10 personas</li>
            <li>Revisa los <a href="{BASE_URL}/studio/terminos-condiciones" style="color: #d4a968;">términos y condiciones</a></li>
        </ul>
    </div>
    
    <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <p style="margin: 0; color: #f87171; font-size: 13px;">
            <strong>Política de cancelación:</strong> Cancela con al menos 72 horas de anticipación para reembolso completo. Menos de 24 horas no tiene reembolso.
        </p>
    </div>
    
    <p style="margin: 0; color: #888; font-size: 13px; text-align: center;">
        ¿Necesitas cambiar o cancelar? <a href="https://wa.me/{COMPANY_INFO['whatsapp'].replace('+', '')}?text=Hola! Necesito gestionar mi reserva del {reservation.get('date', '')}" style="color: #d4a968; text-decoration: none;">Escríbenos por WhatsApp</a>
    </p>
    '''
    
    subject = f"📸 Reserva confirmada - {reservation.get('date', '')} - AVENUE Studio"
    preview = f"Tu sesión el {reservation.get('date', '')} a las {reservation.get('time', '')} está confirmada"
    html = get_base_template(content, preview)
    
    return subject, html, preview


def booking_cancelled_email(reservation: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate booking cancellation email"""
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
        <h2 style="margin: 0; color: #fff; font-size: 24px; font-weight: 400;">Reserva Cancelada</h2>
        <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Tu reserva en AVENUE Studio ha sido cancelada</p>
    </div>
    
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td>
                    <p style="margin: 0; color: #888; font-size: 12px;">Fecha original</p>
                    <p style="margin: 4px 0 0; color: #fff; font-size: 16px;">{reservation.get('date', '')} a las {reservation.get('time', '')}</p>
                </td>
            </tr>
        </table>
    </div>
    
    <p style="margin: 0 0 20px; color: #888; font-size: 14px; text-align: center;">
        Si el reembolso aplica según nuestra política, será procesado en los próximos días hábiles.
    </p>
    
    <div style="text-align: center;">
        <a href="{BASE_URL}/studio/reservar" style="display: inline-block; padding: 14px 30px; background-color: #d4a968; color: #000; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Hacer nueva reserva</a>
    </div>
    '''
    
    subject = f"❌ Reserva cancelada - AVENUE Studio"
    preview = f"Tu reserva del {reservation.get('date', '')} ha sido cancelada"
    html = get_base_template(content, preview)
    
    return subject, html, preview


# ==================== UGC & BRANDS EMAILS ====================

def ugc_application_received_email(application: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate UGC application confirmation email"""
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; margin: 0 auto 20px; background-color: rgba(212, 169, 104, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">🎬</span>
        </div>
        <h2 style="margin: 0; color: #fff; font-size: 24px; font-weight: 400;">¡Aplicación Recibida!</h2>
        <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Gracias por tu interés en ser UGC Creator de AVENUE</p>
    </div>
    
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <p style="margin: 0; color: #fff; font-size: 14px;">
            Hola <strong>{application.get('name', 'Creator')}</strong>,
        </p>
        <p style="margin: 15px 0 0; color: #888; font-size: 14px; line-height: 1.6;">
            Hemos recibido tu aplicación para unirte a nuestro programa de UGC Creators. 
            Nuestro equipo revisará tu perfil y portfolio, y te contactaremos pronto si hay una oportunidad que encaje con tu estilo.
        </p>
    </div>
    
    <div style="background-color: rgba(212, 169, 104, 0.1); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <p style="margin: 0 0 10px; color: #d4a968; font-size: 14px; font-weight: 600;">Resumen de tu aplicación:</p>
        <p style="margin: 0; color: #888; font-size: 13px;">Instagram: @{application.get('instagram', 'N/A')}</p>
        {f"<p style='margin: 5px 0 0; color: #888; font-size: 13px;'>TikTok: @{application.get('tiktok', '')}</p>" if application.get('tiktok') else ''}
    </div>
    
    <p style="margin: 0; color: #888; font-size: 13px; text-align: center;">
        ¿Tienes preguntas? <a href="https://wa.me/595976691520" style="color: #d4a968; text-decoration: none;">Escríbenos por WhatsApp</a>
    </p>
    '''
    
    subject = f"🎬 Aplicación UGC recibida - AVENUE"
    preview = "Recibimos tu aplicación para ser UGC Creator de AVENUE"
    html = get_base_template(content, preview)
    
    return subject, html, preview


def brand_inquiry_received_email(inquiry: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate brand inquiry confirmation email"""
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; margin: 0 auto 20px; background-color: rgba(212, 169, 104, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">🏢</span>
        </div>
        <h2 style="margin: 0; color: #fff; font-size: 24px; font-weight: 400;">¡Consulta Recibida!</h2>
        <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Gracias por tu interés en ser parte de AVENUE</p>
    </div>
    
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <p style="margin: 0; color: #fff; font-size: 14px;">
            Hola <strong>{inquiry.get('contact_name', inquiry.get('brand_name', 'Amigo'))}</strong>,
        </p>
        <p style="margin: 15px 0 0; color: #888; font-size: 14px; line-height: 1.6;">
            Hemos recibido tu consulta sobre <strong>{inquiry.get('brand_name', 'tu marca')}</strong>. 
            Nuestro equipo comercial revisará la información y te contactará en las próximas 48 horas hábiles para conversar sobre las oportunidades de colaboración.
        </p>
    </div>
    
    <p style="margin: 0; color: #888; font-size: 13px; text-align: center;">
        ¿Necesitas una respuesta más rápida? <a href="https://wa.me/595976691520" style="color: #d4a968; text-decoration: none;">Escríbenos por WhatsApp</a>
    </p>
    '''
    
    subject = f"🏢 Consulta recibida - {inquiry.get('brand_name', 'Tu marca')} - AVENUE"
    preview = f"Recibimos tu consulta sobre {inquiry.get('brand_name', 'tu marca')}"
    html = get_base_template(content, preview)
    
    return subject, html, preview


# ==================== ADMIN NOTIFICATION EMAILS ====================

def admin_new_order_email(order: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate admin notification for new order"""
    
    items_list = "\n".join([f"• {item.get('name', 'Producto')} x{item.get('quantity', 1)}" for item in order.get('items', [])])
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; color: #4ade80; font-size: 24px; font-weight: 400;">💰 Nuevo Pedido</h2>
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 20px;">
        <tr>
            <td style="padding: 20px;">
                <p style="margin: 0; color: #888; font-size: 12px;">Pedido</p>
                <p style="margin: 4px 0 0; color: #d4a968; font-size: 18px; font-weight: 600;">#{order.get('order_id', 'N/A')}</p>
            </td>
            <td style="padding: 20px; text-align: right;">
                <p style="margin: 0; color: #888; font-size: 12px;">Total</p>
                <p style="margin: 4px 0 0; color: #4ade80; font-size: 18px; font-weight: 600;">{format_price(order.get('total', 0))}</p>
            </td>
        </tr>
    </table>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Cliente:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{order.get('customer_name', 'N/A')}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Email:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{order.get('customer_email', 'N/A')}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Teléfono:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{order.get('customer_phone', 'N/A')}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Entrega:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{'Delivery' if order.get('delivery_type') == 'delivery' else 'Retiro en tienda'}</td>
        </tr>
    </table>
    
    <div style="margin-top: 20px; text-align: center;">
        <a href="{BASE_URL}/admin" style="display: inline-block; padding: 14px 30px; background-color: #d4a968; color: #000; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Ver en Admin</a>
    </div>
    '''
    
    subject = f"💰 Nuevo Pedido #{order.get('order_id', '')} - {format_price(order.get('total', 0))}"
    preview = f"Nuevo pedido de {order.get('customer_name', 'cliente')} por {format_price(order.get('total', 0))}"
    html = get_base_template(content, preview)
    
    return subject, html, preview


def admin_new_booking_email(reservation: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate admin notification for new studio booking"""
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; color: #4ade80; font-size: 24px; font-weight: 400;">📸 Nueva Reserva Studio</h2>
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 20px;">
        <tr>
            <td style="padding: 20px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px;">FECHA Y HORA</p>
                <p style="margin: 8px 0 0; color: #d4a968; font-size: 22px; font-weight: 600;">{reservation.get('date', '')}</p>
                <p style="margin: 4px 0 0; color: #fff; font-size: 18px;">{reservation.get('time', '')} - {reservation.get('end_time', '')}</p>
            </td>
        </tr>
    </table>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Cliente:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{reservation.get('customer_name', 'N/A')}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Email:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{reservation.get('customer_email', 'N/A')}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Teléfono:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{reservation.get('customer_phone', 'N/A')}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Duración:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{reservation.get('duration', 1)} hora(s)</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Total:</strong></td>
            <td style="padding: 10px 0; color: #4ade80; font-weight: 600;">{format_price(reservation.get('total_price', 0))}</td>
        </tr>
    </table>
    
    <div style="margin-top: 20px; text-align: center;">
        <a href="{BASE_URL}/admin" style="display: inline-block; padding: 14px 30px; background-color: #d4a968; color: #000; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Ver en Admin</a>
    </div>
    '''
    
    subject = f"📸 Nueva Reserva - {reservation.get('date', '')} {reservation.get('time', '')}"
    preview = f"Nueva reserva de {reservation.get('customer_name', 'cliente')} para el {reservation.get('date', '')}"
    html = get_base_template(content, preview)
    
    return subject, html, preview


def admin_new_lead_email(lead_type: str, data: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate admin notification for new lead (UGC or Brand)"""
    
    if lead_type == 'ugc':
        title = "🎬 Nueva Aplicación UGC"
        details = f'''
        <tr><td style="padding: 10px 0;"><strong style="color: #888;">Nombre:</strong></td><td style="padding: 10px 0; color: #fff;">{data.get('name', 'N/A')}</td></tr>
        <tr><td style="padding: 10px 0;"><strong style="color: #888;">Instagram:</strong></td><td style="padding: 10px 0; color: #fff;">@{data.get('instagram', 'N/A')}</td></tr>
        <tr><td style="padding: 10px 0;"><strong style="color: #888;">TikTok:</strong></td><td style="padding: 10px 0; color: #fff;">@{data.get('tiktok', 'N/A')}</td></tr>
        <tr><td style="padding: 10px 0;"><strong style="color: #888;">Email:</strong></td><td style="padding: 10px 0; color: #fff;">{data.get('email', 'N/A')}</td></tr>
        '''
        subject = f"🎬 Nueva Aplicación UGC - {data.get('name', 'Creator')}"
    else:
        title = "🏢 Nueva Consulta de Marca"
        details = f'''
        <tr><td style="padding: 10px 0;"><strong style="color: #888;">Marca:</strong></td><td style="padding: 10px 0; color: #fff;">{data.get('brand_name', 'N/A')}</td></tr>
        <tr><td style="padding: 10px 0;"><strong style="color: #888;">Contacto:</strong></td><td style="padding: 10px 0; color: #fff;">{data.get('contact_name', 'N/A')}</td></tr>
        <tr><td style="padding: 10px 0;"><strong style="color: #888;">Email:</strong></td><td style="padding: 10px 0; color: #fff;">{data.get('email', 'N/A')}</td></tr>
        <tr><td style="padding: 10px 0;"><strong style="color: #888;">Teléfono:</strong></td><td style="padding: 10px 0; color: #fff;">{data.get('phone', 'N/A')}</td></tr>
        '''
        subject = f"🏢 Nueva Consulta - {data.get('brand_name', 'Marca')}"
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; color: #4ade80; font-size: 24px; font-weight: 400;">{title}</h2>
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        {details}
    </table>
    
    <div style="margin-top: 20px; text-align: center;">
        <a href="{BASE_URL}/admin" style="display: inline-block; padding: 14px 30px; background-color: #d4a968; color: #000; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Ver en Admin</a>
    </div>
    '''
    
    preview = f"Nuevo lead recibido"
    html = get_base_template(content, preview)
    
    return subject, html, preview


# ==================== EMAIL SENDING & LOGGING ====================

async def send_email(
    db: AsyncIOMotorDatabase,
    to_email: str,
    subject: str,
    html_content: str,
    sender_type: str = 'ecommerce',
    entity_type: str = None,
    entity_id: str = None,
    plain_text: str = None,
    retry_count: int = 3
) -> Dict[str, Any]:
    """
    Send email and log the result
    Returns: {'success': bool, 'message_id': str or None, 'error': str or None}
    """
    import asyncio
    
    sender = EMAIL_SENDERS.get(sender_type, EMAIL_SENDERS['ecommerce'])
    
    # Create log entry
    log_entry = {
        "id": f"email_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{entity_id or 'general'}",
        "to_email": to_email,
        "from_email": sender,
        "subject": subject,
        "sender_type": sender_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "status": "queued",
        "error_message": None,
        "message_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sent_at": None
    }
    
    last_error = None
    
    for attempt in range(retry_count):
        try:
            # Send email via Resend
            response = resend.Emails.send({
                "from": sender,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
                "text": plain_text or subject  # Fallback plain text
            })
            
            # Update log with success
            log_entry["status"] = "sent"
            log_entry["message_id"] = response.get("id")
            log_entry["sent_at"] = datetime.now(timezone.utc).isoformat()
            
            logger.info(f"Email sent successfully to {to_email}: {subject}")
            
            result = {
                "success": True,
                "message_id": response.get("id"),
                "error": None
            }
            break
            
        except Exception as e:
            last_error = str(e)
            
            # Check if it's a rate limit error
            if "rate" in str(e).lower() and attempt < retry_count - 1:
                logger.warning(f"Rate limited, retrying in {1 + attempt}s... (attempt {attempt + 1}/{retry_count})")
                await asyncio.sleep(1 + attempt)  # Exponential backoff
                continue
            
            # Update log with error
            log_entry["status"] = "failed"
            log_entry["error_message"] = str(e)
            
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            
            result = {
                "success": False,
                "message_id": None,
                "error": str(e)
            }
            break
    else:
        # All retries exhausted
        log_entry["status"] = "failed"
        log_entry["error_message"] = last_error
        result = {
            "success": False,
            "message_id": None,
            "error": last_error
        }
    
    # Save log to database
    try:
        await db.email_logs.insert_one(log_entry)
    except Exception as e:
        logger.error(f"Failed to log email: {str(e)}")
    
    return result


async def send_order_confirmation(db: AsyncIOMotorDatabase, order: Dict[str, Any]) -> Dict[str, Any]:
    """Send order confirmation to customer and notification to admin"""
    import asyncio
    results = []
    
    # Send to customer
    customer_email = order.get('customer_email')
    if customer_email:
        subject, html, _ = order_confirmation_email(order)
        result = await send_email(
            db, customer_email, subject, html,
            sender_type='ecommerce',
            entity_type='order',
            entity_id=order.get('order_id')
        )
        results.append(('customer', result))
    
    # Small delay to avoid rate limiting
    await asyncio.sleep(0.6)
    
    # Send to admin
    admin_subject, admin_html, _ = admin_new_order_email(order)
    admin_result = await send_email(
        db, ADMIN_EMAIL, admin_subject, admin_html,
        sender_type='ecommerce',
        entity_type='order',
        entity_id=order.get('order_id')
    )
    results.append(('admin', admin_result))
    
    return {'results': results}


async def send_booking_confirmation(db: AsyncIOMotorDatabase, reservation: Dict[str, Any]) -> Dict[str, Any]:
    """Send booking confirmation to customer and notification to admin"""
    import asyncio
    results = []
    
    # Send to customer
    customer_email = reservation.get('customer_email')
    if customer_email:
        subject, html, _ = booking_confirmation_email(reservation)
        result = await send_email(
            db, customer_email, subject, html,
            sender_type='studio',
            entity_type='reservation',
            entity_id=reservation.get('reservation_id')
        )
        results.append(('customer', result))
    
    # Small delay to avoid rate limiting
    await asyncio.sleep(0.6)
    
    # Send to admin
    admin_subject, admin_html, _ = admin_new_booking_email(reservation)
    admin_result = await send_email(
        db, ADMIN_EMAIL, admin_subject, admin_html,
        sender_type='studio',
        entity_type='reservation',
        entity_id=reservation.get('reservation_id')
    )
    results.append(('admin', admin_result))
    
    return {'results': results}


async def send_order_status_update(db: AsyncIOMotorDatabase, order: Dict[str, Any], new_status: str) -> Dict[str, Any]:
    """Send order status update to customer"""
    customer_email = order.get('customer_email')
    if not customer_email:
        return {'success': False, 'error': 'No customer email'}
    
    subject, html, _ = order_status_update_email(order, new_status)
    return await send_email(
        db, customer_email, subject, html,
        sender_type='ecommerce',
        entity_type='order',
        entity_id=order.get('order_id')
    )


async def send_ugc_application_confirmation(db: AsyncIOMotorDatabase, application: Dict[str, Any]) -> Dict[str, Any]:
    """Send UGC application confirmation to applicant and notification to admin"""
    import asyncio
    results = []
    
    # Send to applicant
    applicant_email = application.get('email')
    if applicant_email:
        subject, html, _ = ugc_application_received_email(application)
        result = await send_email(
            db, applicant_email, subject, html,
            sender_type='ugc',
            entity_type='ugc_application',
            entity_id=application.get('id')
        )
        results.append(('applicant', result))
    
    # Small delay to avoid rate limiting
    await asyncio.sleep(0.6)
    
    # Send to admin
    admin_subject, admin_html, _ = admin_new_lead_email('ugc', application)
    admin_result = await send_email(
        db, ADMIN_EMAIL, admin_subject, admin_html,
        sender_type='ugc',
        entity_type='ugc_application',
        entity_id=application.get('id')
    )
    results.append(('admin', admin_result))
    
    return {'results': results}


async def send_brand_inquiry_confirmation(db: AsyncIOMotorDatabase, inquiry: Dict[str, Any]) -> Dict[str, Any]:
    """Send brand inquiry confirmation to brand and notification to admin"""
    import asyncio
    results = []
    
    # Send to brand
    brand_email = inquiry.get('email')
    if brand_email:
        subject, html, _ = brand_inquiry_received_email(inquiry)
        result = await send_email(
            db, brand_email, subject, html,
            sender_type='brands',
            entity_type='brand_inquiry',
            entity_id=inquiry.get('inquiry_id')
        )
        results.append(('brand', result))
    
    # Small delay to avoid rate limiting
    await asyncio.sleep(0.6)
    
    # Send to admin
    admin_subject, admin_html, _ = admin_new_lead_email('brand', inquiry)
    admin_result = await send_email(
        db, ADMIN_EMAIL, admin_subject, admin_html,
        sender_type='brands',
        entity_type='brand_inquiry',
        entity_id=inquiry.get('inquiry_id')
    )
    results.append(('admin', admin_result))
    
    return {'results': results}


async def send_booking_cancellation(db: AsyncIOMotorDatabase, reservation: Dict[str, Any]) -> Dict[str, Any]:
    """Send booking cancellation to customer"""
    customer_email = reservation.get('customer_email')
    if not customer_email:
        return {'success': False, 'error': 'No customer email'}
    
    subject, html, _ = booking_cancelled_email(reservation)
    return await send_email(
        db, customer_email, subject, html,
        sender_type='studio',
        entity_type='reservation',
        entity_id=reservation.get('reservation_id')
    )


# ==================== UGC CAMPAIGN EMAILS ====================

def campaign_created_email(campaign: Dict[str, Any], brand: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate email for brand when admin creates their campaign"""
    
    # Format contract dates
    contract = campaign.get('contract', {})
    start_date = contract.get('start_date', '')[:10] if contract.get('start_date') else 'N/A'
    end_date = contract.get('end_date', '')[:10] if contract.get('end_date') else 'N/A'
    next_reload = contract.get('next_reload_date', '')[:10] if contract.get('next_reload_date') else 'N/A'
    
    # Format canje details
    canje = campaign.get('canje', {})
    canje_tipo = canje.get('tipo', 'producto')
    canje_valor = canje.get('valor_estimado', 0)
    canje_descripcion = canje.get('descripcion', 'A definir')
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; margin: 0 auto 20px; background-color: rgba(74, 222, 128, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">🎬</span>
        </div>
        <h2 style="margin: 0; color: #fff; font-size: 24px; font-weight: 400;">¡Tu Campaña está Activa!</h2>
        <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Los creadores ya pueden aplicar</p>
    </div>
    
    <div style="background-color: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px; color: #4ade80; font-size: 18px;">{campaign.get('name', 'Tu Campaña')}</h3>
        <p style="margin: 0; color: #888; font-size: 14px;">{campaign.get('description', '')[:200]}{'...' if len(campaign.get('description', '')) > 200 else ''}</p>
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 25px;">
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="margin: 0; color: #888; font-size: 12px;">Categoría</p>
                <p style="margin: 4px 0 0; color: #fff; font-size: 14px;">{campaign.get('category', 'N/A')}</p>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                <p style="margin: 0; color: #888; font-size: 12px;">Ciudad</p>
                <p style="margin: 4px 0 0; color: #fff; font-size: 14px;">{campaign.get('city', 'N/A')}</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="margin: 0; color: #888; font-size: 12px;">Cupos Disponibles</p>
                <p style="margin: 4px 0 0; color: #4ade80; font-size: 16px; font-weight: 600;">{campaign.get('available_slots', 0)}</p>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                <p style="margin: 0; color: #888; font-size: 12px;">Entregables Mensuales</p>
                <p style="margin: 4px 0 0; color: #d4a968; font-size: 16px; font-weight: 600;">{contract.get('monthly_deliverables', 0)}</p>
            </td>
        </tr>
    </table>
    
    <div style="background-color: rgba(212, 169, 104, 0.1); border: 1px solid rgba(212, 169, 104, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <p style="margin: 0 0 12px; color: #d4a968; font-size: 14px; font-weight: 600;">📦 Canje para Creadores</p>
        <p style="margin: 0; color: #fff; font-size: 14px;"><strong>Tipo:</strong> {canje_tipo.capitalize()}</p>
        <p style="margin: 8px 0 0; color: #fff; font-size: 14px;"><strong>Valor estimado:</strong> {format_price(canje_valor)}</p>
        <p style="margin: 8px 0 0; color: #888; font-size: 13px;">{canje_descripcion}</p>
    </div>
    
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <p style="margin: 0 0 12px; color: #fff; font-size: 14px; font-weight: 600;">📅 Contrato</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="padding: 6px 0; color: #888; font-size: 13px;">Inicio:</td>
                <td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right;">{start_date}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #888; font-size: 13px;">Fin:</td>
                <td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right;">{end_date}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #888; font-size: 13px;">Próxima recarga de cupos:</td>
                <td style="padding: 6px 0; color: #4ade80; font-size: 13px; text-align: right;">{next_reload}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #888; font-size: 13px;">Duración:</td>
                <td style="padding: 6px 0; color: #fff; font-size: 13px; text-align: right;">{contract.get('duration_months', 0)} meses</td>
            </tr>
        </table>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
        <a href="{BASE_URL}/ugc/marca/dashboard" style="display: inline-block; padding: 14px 30px; background-color: #4ade80; color: #000; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Ver Mi Campaña</a>
    </div>
    
    <p style="margin: 30px 0 0; color: #888; font-size: 13px; text-align: center;">
        ¿Tenés dudas? <a href="https://wa.me/{COMPANY_INFO['whatsapp'].replace('+', '')}?text=Hola! Tengo una consulta sobre mi campaña UGC: {campaign.get('name', '')}" style="color: #d4a968; text-decoration: none;">Escribinos por WhatsApp</a>
    </p>
    '''
    
    subject = f"🎬 ¡Tu campaña '{campaign.get('name', '')}' está activa! - AVENUE UGC"
    preview = f"Los creadores ya pueden aplicar a tu campaña. Cupos disponibles: {campaign.get('available_slots', 0)}"
    html = get_base_template(content, preview)
    
    return subject, html, preview


async def send_campaign_created_notification(db: AsyncIOMotorDatabase, campaign: Dict[str, Any], brand: Dict[str, Any]) -> Dict[str, Any]:
    """Send campaign creation notification to brand"""
    brand_email = brand.get('email') or brand.get('contact_email')
    if not brand_email:
        return {'success': False, 'error': 'No brand email'}
    
    subject, html, _ = campaign_created_email(campaign, brand)
    return await send_email(
        db, brand_email, subject, html,
        sender_type='brands',
        entity_type='ugc_campaign',
        entity_id=campaign.get('id')
    )

def booking_request_received_email(reservation: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate email for customer when booking request is received (before confirmation)"""
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; margin: 0 auto 20px; background-color: rgba(212, 169, 104, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">📩</span>
        </div>
        <h2 style="margin: 0; color: #fff; font-size: 24px; font-weight: 400;">¡Solicitud Recibida!</h2>
        <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Estamos revisando tu solicitud de reserva</p>
    </div>
    
    <div style="background-color: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="text-align: center;">
                    <p style="margin: 0; color: #888; font-size: 12px;">FECHA Y HORA SOLICITADA</p>
                    <p style="margin: 8px 0 0; color: #fbbf24; font-size: 22px; font-weight: 600;">{reservation.get('date', '')}</p>
                    <p style="margin: 4px 0 0; color: #fff; font-size: 18px;">{reservation.get('time', reservation.get('start_time', ''))} - {reservation.get('end_time', '')}</p>
                </td>
            </tr>
        </table>
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 25px;">
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="margin: 0; color: #888; font-size: 12px;">Duración</p>
                <p style="margin: 4px 0 0; color: #fff; font-size: 14px;">{reservation.get('duration', reservation.get('duration_hours', 1))} hora(s)</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="margin: 0; color: #888; font-size: 12px;">Total estimado</p>
                <p style="margin: 4px 0 0; color: #d4a968; font-size: 16px; font-weight: 600;">{format_price(reservation.get('total_price', reservation.get('price', 0)))}</p>
            </td>
        </tr>
    </table>
    
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <p style="margin: 0 0 12px; color: #fbbf24; font-size: 14px; font-weight: 600;">⏳ ¿Qué sigue?</p>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #888; font-size: 13px; line-height: 1.8;">
            <li>Nuestro equipo revisará la disponibilidad</li>
            <li>Te enviaremos un email de confirmación</li>
            <li>También recibirás un mensaje de WhatsApp</li>
            <li>El proceso toma normalmente menos de 24 horas</li>
        </ul>
    </div>
    
    <p style="margin: 0; color: #888; font-size: 13px; text-align: center;">
        ¿Tienes alguna pregunta? <a href="https://wa.me/{COMPANY_INFO['whatsapp'].replace('+', '')}?text=Hola! Tengo una consulta sobre mi solicitud de reserva del {reservation.get('date', '')}" style="color: #d4a968; text-decoration: none;">Escríbenos por WhatsApp</a>
    </p>
    '''
    
    subject = f"📩 Solicitud recibida - {reservation.get('date', '')} - AVENUE Studio"
    preview = f"Tu solicitud de reserva para el {reservation.get('date', '')} ha sido recibida"
    html = get_base_template(content, preview)
    
    return subject, html, preview


def admin_booking_request_email(reservation: Dict[str, Any]) -> tuple[str, str, str]:
    """Generate admin notification for new booking REQUEST (pending approval)"""
    
    content = f'''
    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; color: #fbbf24; font-size: 24px; font-weight: 400;">⏳ Nueva Solicitud de Reserva</h2>
        <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Requiere aprobación</p>
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(251, 191, 36, 0.1); border-radius: 8px; margin-bottom: 20px;">
        <tr>
            <td style="padding: 20px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px;">FECHA Y HORA</p>
                <p style="margin: 8px 0 0; color: #fbbf24; font-size: 22px; font-weight: 600;">{reservation.get('date', '')}</p>
                <p style="margin: 4px 0 0; color: #fff; font-size: 18px;">{reservation.get('time', reservation.get('start_time', ''))} - {reservation.get('end_time', '')}</p>
            </td>
        </tr>
    </table>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Cliente:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{reservation.get('customer_name', reservation.get('name', 'N/A'))}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Email:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{reservation.get('customer_email', reservation.get('email', 'N/A'))}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Teléfono:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{reservation.get('customer_phone', reservation.get('phone', 'N/A'))}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Empresa:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{reservation.get('company', 'N/A')}</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Duración:</strong></td>
            <td style="padding: 10px 0; color: #fff;">{reservation.get('duration', reservation.get('duration_hours', 1))} hora(s)</td>
        </tr>
        <tr>
            <td style="padding: 10px 0;"><strong style="color: #888;">Total:</strong></td>
            <td style="padding: 10px 0; color: #4ade80; font-weight: 600;">{format_price(reservation.get('total_price', reservation.get('price', 0)))}</td>
        </tr>
    </table>
    
    <div style="margin-top: 25px; text-align: center;">
        <a href="{BASE_URL}/admin" style="display: inline-block; padding: 14px 30px; background-color: #fbbf24; color: #000; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">Revisar y Confirmar</a>
    </div>
    '''
    
    subject = f"⏳ Nueva Solicitud - {reservation.get('date', '')} {reservation.get('time', reservation.get('start_time', ''))}"
    preview = f"Nueva solicitud de reserva de {reservation.get('customer_name', reservation.get('name', 'cliente'))} para el {reservation.get('date', '')}"
    html = get_base_template(content, preview)
    
    return subject, html, preview


async def send_booking_request_notification(db: AsyncIOMotorDatabase, reservation: Dict[str, Any]) -> Dict[str, Any]:
    """Send booking request notification to customer and admin when a new request is created"""
    import asyncio
    results = []
    
    # Send to customer
    customer_email = reservation.get('customer_email') or reservation.get('email')
    if customer_email:
        subject, html, _ = booking_request_received_email(reservation)
        result = await send_email(
            db, customer_email, subject, html,
            sender_type='studio',
            entity_type='reservation',
            entity_id=reservation.get('reservation_id')
        )
        results.append(('customer', result))
    
    # Small delay to avoid rate limiting
    await asyncio.sleep(0.6)
    
    # Send to admin
    admin_subject, admin_html, _ = admin_booking_request_email(reservation)
    admin_result = await send_email(
        db, ADMIN_EMAIL, admin_subject, admin_html,
        sender_type='studio',
        entity_type='reservation',
        entity_id=reservation.get('reservation_id')
    )
    results.append(('admin', admin_result))
    
    return {'results': results}
