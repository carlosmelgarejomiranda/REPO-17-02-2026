"""
WhatsApp Notification Service for Avenue
Handles all WhatsApp notifications via Twilio
"""

import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from twilio.rest import Client as TwilioClient

logger = logging.getLogger(__name__)

# Twilio configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+595976750974')

# Notification recipients by type
NOTIFY_ECOMMERCE = os.environ.get('TWILIO_NOTIFY_ECOMMERCE', 'whatsapp:+595973666000')
NOTIFY_STUDIO = os.environ.get('TWILIO_NOTIFY_STUDIO', 'whatsapp:+595973666000')
NOTIFY_UGC = os.environ.get('TWILIO_NOTIFY_UGC', 'whatsapp:+595976691520')
NOTIFY_BRANDS = os.environ.get('TWILIO_NOTIFY_BRANDS', 'whatsapp:+595976691520')

# Initialize Twilio client
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Twilio client: {e}")


def format_price(price: int) -> str:
    """Format price in Guaraníes"""
    return f"{price:,}".replace(",", ".") + " Gs"


def format_whatsapp_number(phone: str) -> str:
    """Format phone number for WhatsApp"""
    # Remove spaces, dashes, and other characters
    clean = ''.join(filter(str.isdigit, phone))
    
    # Add country code if missing
    if not clean.startswith('595'):
        if clean.startswith('0'):
            clean = '595' + clean[1:]
        else:
            clean = '595' + clean
    
    return f"whatsapp:+{clean}"


async def send_whatsapp_message(to: str, message: str) -> Dict[str, Any]:
    """
    Send a WhatsApp message via Twilio
    
    Args:
        to: Phone number in format 'whatsapp:+595XXXXXXXXX' or just the number
        message: Message text to send
    
    Returns:
        Dict with success status and message SID or error
    """
    if not twilio_client:
        logger.warning("Twilio client not initialized - WhatsApp message not sent")
        return {"success": False, "error": "Twilio not configured"}
    
    try:
        # Format the destination number
        if not to.startswith('whatsapp:'):
            to = format_whatsapp_number(to)
        
        # Send the message
        result = twilio_client.messages.create(
            body=message,
            from_=TWILIO_WHATSAPP_FROM,
            to=to
        )
        
        logger.info(f"WhatsApp message sent successfully: {result.sid}")
        return {
            "success": True,
            "message_sid": result.sid,
            "status": result.status
        }
    
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        return {"success": False, "error": str(e)}


async def send_admin_notification(message: str, notification_type: str = 'ecommerce') -> Dict[str, Any]:
    """Send notification to appropriate admin WhatsApp based on type"""
    recipients = {
        'ecommerce': NOTIFY_ECOMMERCE,
        'studio': NOTIFY_STUDIO,
        'ugc': NOTIFY_UGC,
        'brands': NOTIFY_BRANDS
    }
    to = recipients.get(notification_type, NOTIFY_ECOMMERCE)
    return await send_whatsapp_message(to, message)


# ==================== ORDER NOTIFICATIONS ====================

async def notify_new_order(order: Dict[str, Any]) -> Dict[str, Any]:
    """Send WhatsApp notification for new order"""
    
    order_id = order.get('order_id', 'N/A')
    customer_name = order.get('customer_name', 'Cliente')
    customer_phone = order.get('customer_phone', 'N/A')
    total = order.get('total', 0)
    delivery_method = order.get('delivery_method', 'N/A')
    
    # Build items list
    items = order.get('items', [])
    items_text = ""
    for item in items[:5]:  # Limit to 5 items
        items_text += f"\n  • {item.get('name', 'Producto')} x{item.get('quantity', 1)}"
    if len(items) > 5:
        items_text += f"\n  ... y {len(items) - 5} más"
    
    message = f"""🛒 *NUEVA ORDEN*

📦 *Orden:* {order_id}
👤 *Cliente:* {customer_name}
📞 *Teléfono:* {customer_phone}

*Productos:*{items_text}

💰 *Total:* {format_price(total)}
🚚 *Entrega:* {delivery_method}

Ver detalles en el panel de administración."""

    return await send_admin_notification(message, 'ecommerce')


# ==================== BOOKING NOTIFICATIONS ====================

async def notify_new_booking(reservation: Dict[str, Any]) -> Dict[str, Any]:
    """Send WhatsApp notification for new studio booking"""
    
    reservation_id = reservation.get('reservation_id', 'N/A')
    customer_name = reservation.get('customer_name', 'Cliente')
    customer_phone = reservation.get('customer_phone', 'N/A')
    date = reservation.get('date', 'N/A')
    start_time = reservation.get('start_time', 'N/A')
    duration = reservation.get('duration_hours', 0)
    total = reservation.get('total_price', 0)
    
    message = f"""📅 *NUEVA RESERVA DE STUDIO*

🎫 *Reserva:* {reservation_id}
👤 *Cliente:* {customer_name}
📞 *Teléfono:* {customer_phone}

📆 *Fecha:* {date}
🕐 *Hora:* {start_time}
⏱️ *Duración:* {duration} horas

💰 *Total:* {format_price(total)}

Ver detalles en el panel de administración."""

    return await send_admin_notification(message, 'studio')


# ==================== UGC APPLICATION NOTIFICATIONS ====================

async def notify_new_ugc_application(application: Dict[str, Any]) -> Dict[str, Any]:
    """Send WhatsApp notification for new UGC creator application"""
    
    name = application.get('full_name', 'Aplicante')
    phone = application.get('phone', 'N/A')
    city = application.get('city', 'N/A')
    instagram = application.get('instagram_username', 'N/A')
    tiktok = application.get('tiktok_username', 'N/A')
    
    social = ""
    if instagram:
        social += f"\n📸 Instagram: @{instagram}"
    if tiktok:
        social += f"\n🎵 TikTok: @{tiktok}"
    
    message = f"""👤 *NUEVA APLICACIÓN UGC*

🧑 *Nombre:* {name}
📞 *Teléfono:* {phone}
📍 *Ciudad:* {city}
{social}

Ver perfil completo en el panel de administración."""

    return await send_admin_notification(message, 'ugc')


# ==================== BRAND INQUIRY NOTIFICATIONS ====================

async def notify_new_brand_inquiry(inquiry: Dict[str, Any]) -> Dict[str, Any]:
    """Send WhatsApp notification for new brand inquiry"""
    
    brand_name = inquiry.get('brand_name', 'Marca')
    contact_name = inquiry.get('contact_name', 'Contacto')
    phone = inquiry.get('phone', 'N/A')
    email = inquiry.get('email', 'N/A')
    interest = inquiry.get('interest_type', 'General')
    
    message = f"""🏷️ *NUEVA CONSULTA DE MARCA*

🏢 *Marca:* {brand_name}
👤 *Contacto:* {contact_name}
📞 *Teléfono:* {phone}
📧 *Email:* {email}
💼 *Interés:* {interest}

Ver detalles en el panel de administración."""

    return await send_admin_notification(message)


# ==================== BOOKING CANCELLATION NOTIFICATIONS ====================

async def notify_booking_cancellation(reservation: Dict[str, Any]) -> Dict[str, Any]:
    """Send WhatsApp notification for booking cancellation"""
    
    reservation_id = reservation.get('reservation_id', 'N/A')
    customer_name = reservation.get('customer_name', 'Cliente')
    date = reservation.get('date', 'N/A')
    start_time = reservation.get('start_time', 'N/A')
    
    message = f"""❌ *RESERVA CANCELADA*

🎫 *Reserva:* {reservation_id}
👤 *Cliente:* {customer_name}
📆 *Fecha:* {date}
🕐 *Hora:* {start_time}

La reserva ha sido cancelada."""

    return await send_admin_notification(message)


# ==================== ORDER STATUS NOTIFICATIONS ====================

async def notify_order_status_change(order: Dict[str, Any], new_status: str) -> Dict[str, Any]:
    """Send WhatsApp notification to customer about order status change"""
    
    customer_phone = order.get('customer_phone')
    if not customer_phone:
        return {"success": False, "error": "No customer phone"}
    
    order_id = order.get('order_id', 'N/A')
    
    status_messages = {
        'confirmado': '✅ Tu pedido ha sido confirmado y está siendo preparado.',
        'en_preparacion': '📦 Tu pedido está siendo preparado.',
        'listo_retiro': '🏪 Tu pedido está listo para retirar en tienda.',
        'en_camino': '🚚 Tu pedido está en camino.',
        'entregado': '🎉 Tu pedido ha sido entregado. ¡Gracias por tu compra!',
        'cancelado': '❌ Tu pedido ha sido cancelado. Contactanos para más información.'
    }
    
    status_text = status_messages.get(new_status, f'Estado actualizado: {new_status}')
    
    message = f"""*AVENUE - Actualización de Pedido*

📦 Orden: {order_id}

{status_text}

Para consultas: wa.me/595973666000"""

    return await send_whatsapp_message(customer_phone, message)
