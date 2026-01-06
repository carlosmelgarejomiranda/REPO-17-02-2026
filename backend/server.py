from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
import resend
import httpx
from twilio.rest import Client as TwilioClient

# Import security module
from security import (
    generate_totp_secret, generate_recovery_codes, get_totp_uri,
    generate_qr_code_base64, verify_totp, verify_recovery_code,
    is_admin_role, AuditAction, create_audit_log, get_client_ip,
    get_user_agent, check_rate_limit, get_rate_limit_key,
    RateLimitExceeded, track_login_attempt, is_login_blocked,
    LoginAttemptResult, validate_password_strength, get_security_headers,
    MFASetupResponse, MFAVerifyRequest
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Twilio configuration for WhatsApp
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+595976750974')
TWILIO_ADMIN_WHATSAPP = os.environ.get('TWILIO_ADMIN_WHATSAPP', 'whatsapp:+595976750974')

# Initialize Twilio client
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret_key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 168  # 7 days for regular users
JWT_EXPIRATION_HOURS_ADMIN = 12  # 12 hours for admins

# Admin email
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'avenuepy@gmail.com')

# Create the main app
app = FastAPI()

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Add security headers
        headers = get_security_headers()
        for key, value in headers.items():
            response.headers[key] = value
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    company: Optional[str] = None
    razon_social: Optional[str] = None
    ruc: Optional[str] = None

# UGC Application Model
class UGCApplication(BaseModel):
    campaign_id: str
    email: EmailStr
    nombre: str
    apellido: str
    sexo: str
    fecha_nacimiento: str
    instagram_url: Optional[str] = None
    instagram_privado: Optional[str] = None
    instagram_seguidores: Optional[str] = None
    tiktok_url: Optional[str] = None
    tiktok_privado: Optional[str] = None
    tiktok_seguidores: Optional[str] = None
    video_link_1: str
    video_link_2: str
    confirma_grabar_tienda: bool
    ciudad: str
    whatsapp: str
    acepta_condiciones: bool
    acepta_whatsapp: Optional[bool] = False
    autoriza_contenido: bool

# Brand Inquiry Model (for "Tu Marca" form)
class BrandInquiry(BaseModel):
    brand_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    interest: str
    message: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    company: Optional[str] = None
    razon_social: Optional[str] = None
    ruc: Optional[str] = None
    picture: Optional[str] = None
    role: str = "user"  # user, creator, brand, staff, designer, admin, superadmin
    created_at: datetime

# Role hierarchy: superadmin > admin > staff > designer > brand > creator > user
# Permissions:
# - superadmin: Everything (only avenuepy@gmail.com)
# - admin: Everything except managing admins
# - staff: Everything except web editor
# - designer: Only web editor and image management
# - brand: UGC brand access (campaigns, deliverables, reports)
# - creator: UGC creator access (apply, deliver, metrics)
# - user: Basic user access
ROLE_HIERARCHY = {
    "superadmin": 7,
    "admin": 6,
    "staff": 5,
    "designer": 4,
    "brand": 3,
    "creator": 2,
    "user": 1
}

class RoleUpdate(BaseModel):
    role: str

class ReservationCreate(BaseModel):
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM (24h format)
    duration_hours: int  # 2, 4, 6, or 8
    name: str
    phone: str
    email: EmailStr
    company: Optional[str] = None
    razon_social: Optional[str] = None
    ruc: Optional[str] = None

class Reservation(BaseModel):
    reservation_id: str
    user_id: Optional[str] = None  # None for guest reservations
    date: str
    start_time: str
    end_time: str
    duration_hours: int
    price: int
    name: str
    phone: str
    email: str
    company: Optional[str] = None
    razon_social: Optional[str] = None
    ruc: Optional[str] = None
    status: str = "confirmed"  # confirmed, cancelled
    created_at: datetime

class ReservationUpdate(BaseModel):
    status: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    razon_social: Optional[str] = None
    ruc: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

# Pricing based on duration
PRICING = {
    2: 250000,
    4: 450000,
    6: 650000,
    8: 800000
}

def calculate_end_time(start_time: str, duration_hours: int) -> str:
    """Calculate end time based on start time and duration"""
    hour, minute = map(int, start_time.split(':'))
    end_hour = hour + duration_hours
    return f"{end_hour:02d}:{minute:02d}"

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str, mfa_verified: bool = False) -> str:
    """Create a JWT token with appropriate expiration based on role"""
    # Shorter session for admins
    expiration_hours = JWT_EXPIRATION_HOURS_ADMIN if is_admin_role(role) else JWT_EXPIRATION_HOURS
    
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "mfa_verified": mfa_verified,
        "exp": datetime.now(timezone.utc) + timedelta(hours=expiration_hours),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from token (cookie or header)"""
    # Try cookie first
    token = request.cookies.get("session_token")
    
    # Try Authorization header as fallback
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        return None
    
    try:
        payload = decode_jwt_token(token)
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        return user
    except:
        return None

async def require_auth(request: Request) -> dict:
    """Require authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> dict:
    """Require admin authentication (admin or superadmin)"""
    user = await require_auth(request)
    if user.get("role") not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_superadmin(request: Request) -> dict:
    """Require superadmin authentication"""
    user = await require_auth(request)
    if user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

async def require_staff_or_above(request: Request) -> dict:
    """Require staff, admin, or superadmin authentication"""
    user = await require_auth(request)
    if user.get("role") not in ["staff", "admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Staff access required")
    return user

async def require_designer_or_above(request: Request) -> dict:
    """Require designer, staff, admin, or superadmin authentication"""
    user = await require_auth(request)
    if user.get("role") not in ["designer", "staff", "admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Designer access required")
    return user

def can_edit_website(role: str) -> bool:
    """Check if role can edit website"""
    return role in ["superadmin", "admin", "designer"]

def can_manage_orders(role: str) -> bool:
    """Check if role can manage orders"""
    return role in ["superadmin", "admin", "staff"]

def can_manage_users(role: str) -> bool:
    """Check if role can manage user roles"""
    return role in ["superadmin"]

async def send_confirmation_email(reservation: dict):
    """Send confirmation email for a reservation"""
    try:
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #f5ede4; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #d4a968; font-style: italic; font-weight: 300; margin: 0;">Avenue Studio</h1>
                <p style="color: #a8a8a8; margin-top: 10px;">Confirmación de Reserva</p>
            </div>
            
            <div style="background-color: #1a1a1a; padding: 30px; border: 1px solid #d4a968; margin-bottom: 20px;">
                <h2 style="color: #d4a968; margin-top: 0;">¡Reserva Confirmada!</h2>
                <p style="color: #f5ede4;">Hola {reservation['name']},</p>
                <p style="color: #a8a8a8;">Tu reserva en Avenue Studio ha sido confirmada con los siguientes detalles:</p>
                
                <table style="width: 100%; margin-top: 20px; color: #f5ede4;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #333;"><strong>Fecha:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #d4a968;">{reservation['date']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #333;"><strong>Horario:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #d4a968;">{reservation['start_time']} - {reservation['end_time']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #333;"><strong>Duración:</strong></td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #d4a968;">{reservation['duration_hours']} horas</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0;"><strong>Precio:</strong></td>
                        <td style="padding: 10px 0; color: #d4a968; font-size: 18px;">{reservation['price']:,} Gs</td>
                    </tr>
                </table>
            </div>
            
            <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #333;">
                <p style="color: #a8a8a8; margin: 0; font-size: 14px;">
                    <strong style="color: #d4a968;">Importante:</strong> El pago se realiza en Avenue antes de ingresar al estudio.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px;">
                    Avenue Studio - Paseo Los Árboles, Av. San Martín, Asunción<br>
                    WhatsApp: +595 976 691 520
                </p>
            </div>
        </div>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [reservation['email']],
            "subject": f"✅ Reserva Confirmada - Avenue Studio - {reservation['date']}",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Confirmation email sent to {reservation['email']}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")

# ==================== NOTIFICATION FUNCTIONS ====================

async def send_whatsapp_notification(to_number: str, message: str):
    """Send WhatsApp notification via Twilio"""
    if not twilio_client:
        logger.warning("Twilio client not configured, skipping WhatsApp notification")
        return False
    
    try:
        # Format the destination number for WhatsApp
        formatted_to = f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number
        
        msg = await asyncio.to_thread(
            twilio_client.messages.create,
            body=message,
            from_=TWILIO_WHATSAPP_FROM,
            to=formatted_to
        )
        logger.info(f"WhatsApp notification sent to {to_number}, SID: {msg.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification to {to_number}: {str(e)}")
        return False

async def send_admin_email_notification(subject: str, html_content: str):
    """Send email notification to admin"""
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "subject": subject,
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Admin email notification sent: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send admin email notification: {str(e)}")
        return False

async def notify_new_reservation(reservation: dict):
    """Send notifications for new studio reservation"""
    # Use new WhatsApp service
    try:
        from whatsapp_service import notify_new_booking
        await notify_new_booking({
            "reservation_id": reservation.get('reservation_id'),
            "customer_name": reservation.get('name'),
            "customer_phone": reservation.get('phone', 'N/A'),
            "date": reservation.get('date'),
            "start_time": reservation.get('start_time'),
            "duration_hours": reservation.get('duration_hours'),
            "total_price": reservation.get('price', 0)
        })
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification: {e}")
    
    # Email notification
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #f5ede4; padding: 40px;">
        <h1 style="color: #d4a968;">🎬 Nueva Reserva de Studio</h1>
        <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #d4a968;">
            <p><strong>Cliente:</strong> {reservation['name']}</p>
            <p><strong>Email:</strong> {reservation['email']}</p>
            <p><strong>Teléfono:</strong> {reservation.get('phone', 'N/A')}</p>
            <p><strong>Empresa:</strong> {reservation.get('company', 'N/A')}</p>
            <hr style="border-color: #333;">
            <p><strong>Fecha:</strong> {reservation['date']}</p>
            <p><strong>Horario:</strong> {reservation['start_time']} - {reservation['end_time']}</p>
            <p><strong>Duración:</strong> {reservation['duration_hours']} horas</p>
            <p><strong style="color: #d4a968;">Precio: {reservation['price']:,} Gs</strong></p>
        </div>
    </div>
    """
    await send_admin_email_notification(f"🎬 Nueva Reserva - {reservation['name']} - {reservation['date']}", email_html)

async def notify_new_ugc_application(application: dict):
    """Send notifications for new UGC application"""
    nombre_completo = f"{application.get('nombre', '')} {application.get('apellido', '')}".strip()
    if not nombre_completo:
        nombre_completo = application.get('full_name', 'Aplicante')
    
    # WhatsApp notification using new service
    try:
        from whatsapp_service import notify_new_ugc_application as whatsapp_notify_ugc
        await whatsapp_notify_ugc({
            "full_name": nombre_completo,
            "phone": application.get('whatsapp') or application.get('phone', 'N/A'),
            "city": application.get('ciudad') or application.get('city', 'N/A'),
            "instagram_username": application.get('instagram_username') or application.get('instagram_url', ''),
            "tiktok_username": application.get('tiktok_username') or application.get('tiktok_url', '')
        })
    except Exception as e:
        logger.error(f"Failed to send UGC WhatsApp notification: {e}")
    
    # Email notification
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #f5ede4; padding: 40px;">
        <h1 style="color: #d4a968;">📸 Nueva Aplicación UGC</h1>
        <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #d4a968;">
            <p><strong>Nombre:</strong> {nombre_completo}</p>
            <p><strong>Email:</strong> {application['email']}</p>
            <p><strong>WhatsApp:</strong> {application.get('whatsapp', 'N/A')}</p>
            <p><strong>Ciudad:</strong> {application.get('ciudad', 'N/A')}</p>
            <hr style="border-color: #333;">
            <p><strong>Instagram:</strong> {application.get('instagram_url', 'N/A')} ({application.get('instagram_seguidores', '0')} seguidores)</p>
            <p><strong>TikTok:</strong> {application.get('tiktok_url', 'N/A')} ({application.get('tiktok_seguidores', '0')} seguidores)</p>
            <hr style="border-color: #333;">
            <p><strong>Estado:</strong> {application.get('status', 'pendiente')}</p>
            <p><strong>Campaña:</strong> {application.get('campaign_id', 'N/A')}</p>
            <hr style="border-color: #333;">
            <p><strong>Videos:</strong></p>
            <p>• <a href="{application.get('video_link_1', '#')}" style="color: #d4a968;">Video 1</a></p>
            <p>• <a href="{application.get('video_link_2', '#')}" style="color: #d4a968;">Video 2</a></p>
        </div>
    </div>
    """
    await send_admin_email_notification(f"📸 Nueva Aplicación UGC - {nombre_completo}", email_html)

async def notify_new_order_legacy(order: dict):
    """Send notifications for new e-commerce order to admin - uses new WhatsApp service"""
    # Use new WhatsApp service for notifications
    try:
        from whatsapp_service import notify_new_order as whatsapp_notify_order
        await whatsapp_notify_order(order)
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification: {e}")
    
    # Admin Email notification
    items_text = "\n".join([
        f"• {item.get('name', 'Producto')}" + 
        (f" - Talle: {item.get('size')}" if item.get('size') else "") + 
        f" x{item.get('quantity', 1)} - {item.get('price', 0):,.0f} Gs" 
        for item in order.get('items', [])
    ])
    
    items_html = "".join([
        f"<tr><td style='padding: 8px; border-bottom: 1px solid #333;'>{item.get('name', 'Producto')}" +
        (f"<br><small style='color: #a8a8a8;'>Talle: {item.get('size')}</small>" if item.get('size') else "") +
        f"</td><td style='padding: 8px; border-bottom: 1px solid #333;'>{item.get('quantity', 1)}</td><td style='padding: 8px; border-bottom: 1px solid #333; color: #d4a968;'>{item.get('price', 0):,.0f} Gs</td></tr>" 
        for item in order.get('items', [])
    ])
    
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #f5ede4; padding: 40px;">
        <h1 style="color: #d4a968;">🛒 Nuevo Pedido - Avenue Online</h1>
        <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #d4a968; margin-bottom: 20px;">
            <p><strong>Pedido:</strong> {order.get('order_id', 'N/A')}</p>
            <p><strong>Estado de pago:</strong> <span style="color: #22c55e;">{order.get('payment_status', 'pending').upper()}</span></p>
            <hr style="border-color: #333;">
            <p><strong>Cliente:</strong> {order.get('customer_name', 'N/A')}</p>
            <p><strong>Email:</strong> {order.get('customer_email', 'N/A')}</p>
            <p><strong>Teléfono:</strong> {order.get('customer_phone', 'N/A')}</p>
        </div>
        
        <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #333; margin-bottom: 20px;">
            <h3 style="color: #d4a968; margin-top: 0;">Productos</h3>
            <table style="width: 100%; color: #f5ede4;">
                <thead>
                    <tr style="border-bottom: 1px solid #d4a968;">
                        <th style="text-align: left; padding: 8px;">Producto</th>
                        <th style="text-align: left; padding: 8px;">Cant.</th>
                        <th style="text-align: left; padding: 8px;">Precio</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
        </div>
        
        <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #333;">
            <p><strong>Subtotal:</strong> {order.get('subtotal', 0):,.0f} Gs</p>
            <p><strong>Envío:</strong> {order.get('delivery_cost', 0):,.0f} Gs</p>
            <p style="font-size: 18px; color: #d4a968;"><strong>TOTAL: {order.get('total', 0):,.0f} Gs</strong></p>
        </div>
    </div>
    """
    await send_admin_email_notification(f"🛒 Nuevo Pedido #{order.get('order_id', 'N/A')} - {order.get('total', 0):,.0f} Gs", email_html)
    
    # ========== CUSTOMER NOTIFICATIONS ==========
    
    customer_email = order.get('customer_email')
    if customer_email:
        await send_customer_order_confirmation(order)

async def send_customer_order_confirmation(order: dict):
    """Send order confirmation email to customer"""
    try:
        items_html = "".join([
            f"""<tr>
                <td style='padding: 12px; border-bottom: 1px solid #333;'>
                    {item.get('name', 'Producto')}
                    {f"<br><span style='color: #a8a8a8; font-size: 12px;'>Talle: {item.get('size')}</span>" if item.get('size') else ""}
                </td>
                <td style='padding: 12px; border-bottom: 1px solid #333; text-align: center;'>{item.get('quantity', 1)}</td>
                <td style='padding: 12px; border-bottom: 1px solid #333; text-align: right; color: #d4a968;'>{item.get('price', 0):,.0f} Gs</td>
            </tr>""" 
            for item in order.get('items', [])
        ])
        
        delivery_html = ""
        if order.get('delivery_type') == 'delivery' and order.get('delivery_address'):
            addr = order['delivery_address']
            delivery_html = f"""
            <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #333; margin-bottom: 20px; border-radius: 8px;">
                <h3 style="color: #d4a968; margin-top: 0;">📍 Dirección de Entrega</h3>
                <p style="margin: 0;">{addr.get('address', 'N/A')}</p>
                {f"<p style='color: #a8a8a8; margin: 5px 0 0 0;'>Referencia: {addr.get('reference')}</p>" if addr.get('reference') else ""}
            </div>
            """
        else:
            delivery_html = """
            <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #333; margin-bottom: 20px; border-radius: 8px;">
                <h3 style="color: #d4a968; margin-top: 0;">🏪 Retiro en Tienda</h3>
                <p style="margin: 0;">Av. San Martín, Asunción</p>
                <p style="color: #a8a8a8; margin: 5px 0 0 0;">Te notificaremos cuando tu pedido esté listo.</p>
            </div>
            """
        
        customer_email_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #d4a968; font-size: 28px; font-weight: 300; font-style: italic; margin: 0;">Avenue</h1>
                    <p style="color: #a8a8a8; margin: 10px 0 0 0;">Tu tienda de moda</p>
                </div>
                
                <!-- Success Message -->
                <div style="background-color: #22c55e20; border: 1px solid #22c55e; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #22c55e; margin: 0 0 10px 0;">✅ ¡Gracias por tu compra!</h2>
                    <p style="color: #f5ede4; margin: 0;">Tu pedido ha sido confirmado exitosamente.</p>
                </div>
                
                <!-- Order Info -->
                <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #d4a968; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 10px 0; color: #f5ede4;"><strong>Pedido:</strong> <span style="color: #d4a968;">{order.get('order_id', 'N/A')}</span></p>
                    <p style="margin: 0; color: #a8a8a8;">Fecha: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}</p>
                </div>
                
                <!-- Products -->
                <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #333; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #d4a968; margin: 0 0 15px 0;">🛍️ Tu Pedido</h3>
                    <table style="width: 100%; color: #f5ede4; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #d4a968;">
                                <th style="text-align: left; padding: 12px; color: #a8a8a8;">Producto</th>
                                <th style="text-align: center; padding: 12px; color: #a8a8a8;">Cant.</th>
                                <th style="text-align: right; padding: 12px; color: #a8a8a8;">Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                </div>
                
                <!-- Delivery -->
                {delivery_html}
                
                <!-- Totals -->
                <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #333; border-radius: 8px; margin-bottom: 20px;">
                    <table style="width: 100%; color: #f5ede4;">
                        <tr>
                            <td style="padding: 8px 0;">Subtotal:</td>
                            <td style="text-align: right; padding: 8px 0;">{order.get('subtotal', 0):,.0f} Gs</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">Envío:</td>
                            <td style="text-align: right; padding: 8px 0;">{order.get('delivery_cost', 0):,.0f} Gs</td>
                        </tr>
                        <tr style="border-top: 2px solid #d4a968;">
                            <td style="padding: 15px 0; font-size: 18px;"><strong>TOTAL:</strong></td>
                            <td style="text-align: right; padding: 15px 0; font-size: 20px; color: #d4a968;"><strong>{order.get('total', 0):,.0f} Gs</strong></td>
                        </tr>
                    </table>
                </div>
                
                <!-- Customer Info -->
                <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #333; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #d4a968; margin: 0 0 15px 0;">👤 Datos de Contacto</h3>
                    <p style="color: #f5ede4; margin: 5px 0;"><strong>Nombre:</strong> {order.get('customer_name', 'N/A')}</p>
                    <p style="color: #f5ede4; margin: 5px 0;"><strong>Email:</strong> {order.get('customer_email', 'N/A')}</p>
                    <p style="color: #f5ede4; margin: 5px 0;"><strong>Teléfono:</strong> {order.get('customer_phone', 'N/A')}</p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
                    <p style="color: #a8a8a8; margin: 0 0 10px 0;">¿Tienes preguntas? Contáctanos:</p>
                    <p style="color: #d4a968; margin: 0;">WhatsApp: +595 973 666 000</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">© 2025 Avenue - Todos los derechos reservados</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [order.get('customer_email')],
            "subject": f"✅ Confirmación de Pedido #{order.get('order_id')} - Avenue Online",
            "html": customer_email_html
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Customer confirmation email sent to {order.get('customer_email')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send customer confirmation email: {str(e)}")
        return False

# ==================== GENERATED FLYERS ====================

from fastapi.responses import FileResponse
import zipfile
from io import BytesIO

FLYERS_DIR = ROOT_DIR / "generated_flyers"

@api_router.get("/admin/flyers")
async def list_generated_flyers():
    """List all generated Instagram flyers"""
    if not FLYERS_DIR.exists():
        return {"flyers": [], "message": "No flyers generated yet"}
    
    flyers = []
    for f in sorted(FLYERS_DIR.iterdir()):
        if f.suffix.lower() in ['.jpg', '.jpeg', '.png']:
            flyers.append({
                "filename": f.name,
                "url": f"/api/admin/flyers/{f.name}",
                "size_kb": round(f.stat().st_size / 1024, 1)
            })
    
    return {
        "flyers": flyers,
        "total": len(flyers),
        "download_all": "/api/admin/flyers-zip"
    }

@api_router.get("/admin/flyers-zip")
async def download_all_flyers():
    """Download all flyers as a ZIP file"""
    if not FLYERS_DIR.exists():
        raise HTTPException(status_code=404, detail="No flyers available")
    
    # Create ZIP in memory
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for f in FLYERS_DIR.iterdir():
            if f.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                zip_file.write(f, f.name)
    
    zip_buffer.seek(0)
    
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=avenue_studio_flyers.zip"}
    )

@api_router.get("/admin/flyers/{filename}")
async def get_flyer_image(filename: str):
    """Get a specific flyer image"""
    filepath = FLYERS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Flyer not found")
    
    media_type = "image/jpeg" if filename.lower().endswith('.jpg') else "image/png"
    return FileResponse(filepath, media_type=media_type)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    """Register a new user with email/password"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)
    
    # Check if this is the superadmin email
    role = "superadmin" if user_data.email == ADMIN_EMAIL else "user"
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "phone": user_data.phone,
        "password": hashed_password,
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create welcome coupon (10% off) for new users
    welcome_coupon_code = f"BIENVENIDO{uuid.uuid4().hex[:6].upper()}"
    welcome_coupon = {
        "id": str(uuid.uuid4()),
        "code": welcome_coupon_code,
        "discount_type": "percentage",
        "discount_value": 10,
        "min_purchase": None,
        "max_uses": 1,
        "current_uses": 0,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "is_active": True,
        "description": f"Cupón de bienvenida para {user_data.email}",
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shop_coupons.insert_one(welcome_coupon)
    
    # Create token
    token = create_jwt_token(user_id, user_data.email, role)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRATION_HOURS * 3600,
        path="/"
    )
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": role,
        "token": token,
        "welcome_coupon": welcome_coupon_code
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, request: Request, response: Response):
    """Login with email/password - with rate limiting and audit logging"""
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # Check rate limit
    rate_key = get_rate_limit_key(request, "login")
    is_allowed, _ = check_rate_limit(rate_key, max_requests=10, window_seconds=60)
    if not is_allowed:
        await create_audit_log(
            db, AuditAction.LOGIN_FAILED, None, credentials.email, None,
            ip_address, user_agent, {"reason": "rate_limited"}
        )
        raise RateLimitExceeded(retry_after=60)
    
    # Check if account is locked
    is_blocked, lockout_seconds = is_login_blocked(credentials.email)
    if is_blocked:
        await create_audit_log(
            db, AuditAction.LOGIN_FAILED, None, credentials.email, None,
            ip_address, user_agent, {"reason": "account_locked", "lockout_seconds": lockout_seconds}
        )
        raise HTTPException(
            status_code=423, 
            detail=f"Cuenta bloqueada temporalmente. Intenta de nuevo en {lockout_seconds // 60} minutos."
        )
    
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user.get("password", "")):
        # Track failed attempt
        result, lockout = track_login_attempt(credentials.email, success=False)
        
        await create_audit_log(
            db, AuditAction.LOGIN_FAILED, 
            user.get("user_id") if user else None, 
            credentials.email, 
            user.get("role") if user else None,
            ip_address, user_agent, {"reason": "invalid_credentials"}
        )
        
        if result == LoginAttemptResult.BLOCKED:
            raise HTTPException(
                status_code=423, 
                detail=f"Demasiados intentos fallidos. Cuenta bloqueada por {lockout // 60} minutos."
            )
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    # Successful login - reset attempts
    track_login_attempt(credentials.email, success=True)
    
    role = user.get("role", "user")
    has_mfa = user.get("mfa_enabled", False)
    
    # Check if admin needs MFA
    if is_admin_role(role) and has_mfa:
        # Return partial token - MFA verification required
        partial_token = create_jwt_token(user["user_id"], user["email"], role, mfa_verified=False)
        
        await create_audit_log(
            db, AuditAction.LOGIN_SUCCESS, user["user_id"], user["email"], role,
            ip_address, user_agent, {"mfa_required": True}
        )
        
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": role,
            "mfa_required": True,
            "partial_token": partial_token
        }
    
    # DEVELOPMENT MODE: Skip MFA setup requirement for admins
    # TODO: Re-enable MFA enforcement for production
    # if is_admin_role(role) and not has_mfa:
    #     partial_token = create_jwt_token(user["user_id"], user["email"], role, mfa_verified=False)
    #     await create_audit_log(
    #         db, AuditAction.LOGIN_SUCCESS, user["user_id"], user["email"], role,
    #         ip_address, user_agent, {"mfa_setup_required": True}
    #     )
    #     return {
    #         "user_id": user["user_id"],
    #         "email": user["email"],
    #         "name": user["name"],
    #         "role": role,
    #         "mfa_setup_required": True,
    #         "partial_token": partial_token
    #     }
    
    # Create full token for non-admin users
    token = create_jwt_token(user["user_id"], user["email"], role, mfa_verified=True)
    
    # Set cookie
    expiration_hours = JWT_EXPIRATION_HOURS_ADMIN if is_admin_role(role) else JWT_EXPIRATION_HOURS
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=expiration_hours * 3600,
        path="/"
    )
    
    await create_audit_log(
        db, AuditAction.LOGIN_SUCCESS, user["user_id"], user["email"], role,
        ip_address, user_agent, {}
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": role,
        "token": token
    }

@api_router.post("/auth/google/callback")
async def google_callback(request: Request, response: Response):
    """Handle Google OAuth callback - exchange session_id for user data"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent auth API to get user data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            google_data = auth_response.json()
        except Exception as e:
            logger.error(f"Google auth error: {str(e)}")
            raise HTTPException(status_code=500, detail="Authentication failed")
    
    email = google_data.get("email")
    name = google_data.get("name")
    picture = google_data.get("picture")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        # Update existing user
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
        user_id = existing_user["user_id"]
        role = existing_user.get("role", "user")
        # Ensure superadmin email always has superadmin role
        if email == ADMIN_EMAIL and role != "superadmin":
            role = "superadmin"
            await db.users.update_one({"email": email}, {"$set": {"role": "superadmin"}})
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "superadmin" if email == ADMIN_EMAIL else "user"
        
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create JWT token
    token = create_jwt_token(user_id, email, role)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRATION_HOURS * 3600,
        path="/"
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": role,
        "token": token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Remove password from response
    user_response = {k: v for k, v in user.items() if k != "password"}
    return user_response

@api_router.post("/auth/logout")
async def logout(response: Response):
    """Logout - clear session cookie"""
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.put("/auth/profile")
async def update_profile(request: Request, updates: dict):
    """Update user profile"""
    user = await require_auth(request)
    
    # Only allow updating certain fields
    allowed_fields = ["name", "phone", "company", "razon_social", "ruc"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password": 0})
    return updated_user

# ==================== RESERVATION ROUTES ====================

@api_router.get("/reservations/availability/{date}")
async def get_availability(date: str):
    """Get available time slots for a specific date"""
    # Validate date format
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get all confirmed reservations for this date
    reservations = await db.reservations.find(
        {"date": date, "status": "confirmed"},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate booked time slots
    booked_slots = []
    for res in reservations:
        start_hour = int(res["start_time"].split(":")[0])
        end_hour = int(res["end_time"].split(":")[0])
        for hour in range(start_hour, end_hour):
            booked_slots.append(hour)
    
    # Generate available slots (9:00 to 22:00)
    available_slots = []
    for hour in range(9, 22):
        is_available = hour not in booked_slots
        available_slots.append({
            "hour": hour,
            "time": f"{hour:02d}:00",
            "available": is_available
        })
    
    return {
        "date": date,
        "slots": available_slots,
        "reservations": reservations
    }

@api_router.post("/reservations")
async def create_reservation(reservation_data: ReservationCreate, request: Request):
    """Create a new reservation request (guest or authenticated)"""
    # Validate duration
    if reservation_data.duration_hours not in PRICING:
        raise HTTPException(status_code=400, detail="Invalid duration. Choose 2, 4, 6, or 8 hours")
    
    # Validate time
    start_hour = int(reservation_data.start_time.split(":")[0])
    end_hour = start_hour + reservation_data.duration_hours
    
    if start_hour < 9 or end_hour > 22:
        raise HTTPException(status_code=400, detail="Reservations must be between 9:00 and 22:00")
    
    # Get current user if authenticated
    user = await get_current_user(request)
    user_id = user["user_id"] if user else None
    is_admin = user and user.get("role") in ["admin", "superadmin", "staff"]
    
    # Validate date - must be at least 1 day in advance (except for admin)
    reservation_date = datetime.strptime(reservation_data.date, "%Y-%m-%d").date()
    today = datetime.now(timezone.utc).date()
    
    if not is_admin:
        if reservation_date <= today:
            raise HTTPException(
                status_code=400, 
                detail="Las reservas deben hacerse con al menos 1 día de anticipación. Para reservas del mismo día, contacta por WhatsApp: +595 976 691 520"
            )
    
    # Check availability (only check confirmed reservations)
    existing_confirmed = await db.reservations.find(
        {"date": reservation_data.date, "status": "confirmed"},
        {"_id": 0}
    ).to_list(100)
    
    booked_slots = []
    for res in existing_confirmed:
        res_start = int(res["start_time"].split(":")[0])
        res_end = int(res["end_time"].split(":")[0])
        for hour in range(res_start, res_end):
            booked_slots.append(hour)
    
    for hour in range(start_hour, end_hour):
        if hour in booked_slots:
            raise HTTPException(status_code=400, detail=f"El horario de las {hour}:00 no está disponible")
    
    # Create reservation with "pending" status (solicitud)
    # Admin-created reservations are auto-confirmed
    reservation_id = f"res_{uuid.uuid4().hex[:12]}"
    end_time = calculate_end_time(reservation_data.start_time, reservation_data.duration_hours)
    price = PRICING[reservation_data.duration_hours]
    
    initial_status = "confirmed" if is_admin else "pending"  # pending = solicitud
    
    reservation_doc = {
        "reservation_id": reservation_id,
        "user_id": user_id,
        "date": reservation_data.date,
        "start_time": reservation_data.start_time,
        "end_time": end_time,
        "duration_hours": reservation_data.duration_hours,
        "price": price,
        "name": reservation_data.name,
        "phone": reservation_data.phone,
        "email": reservation_data.email,
        "company": reservation_data.company,
        "razon_social": reservation_data.razon_social,
        "ruc": reservation_data.ruc,
        "status": initial_status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reservations.insert_one(reservation_doc)
    
    if is_admin:
        # Admin creates confirmed reservation - send confirmation
        await send_confirmation_email(reservation_doc)
        await notify_new_reservation(reservation_doc)
    else:
        # Regular user creates request - send notification to admin
        await notify_reservation_request(reservation_doc)
    
    # Remove MongoDB _id before returning
    reservation_doc.pop("_id", None)
    
    return {
        **reservation_doc,
        "message": "Reserva confirmada" if is_admin else "Solicitud de reserva enviada. Te contactaremos para confirmar."
    }

async def notify_reservation_request(reservation: dict):
    """Send WhatsApp notification for new reservation REQUEST to admin"""
    # Use new WhatsApp service
    try:
        from whatsapp_service import notify_new_booking
        await notify_new_booking({
            "reservation_id": reservation.get('reservation_id'),
            "customer_name": reservation.get('name'),
            "customer_phone": reservation.get('phone', 'N/A'),
            "date": reservation.get('date'),
            "start_time": reservation.get('start_time'),
            "duration_hours": reservation.get('duration_hours'),
            "total_price": reservation.get('price', 0)
        })
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification: {e}")

@api_router.put("/admin/reservations/{reservation_id}/confirm")
async def admin_confirm_reservation(reservation_id: str, request: Request):
    """Confirm a pending reservation (staff and above)"""
    await require_staff_or_above(request)
    
    reservation = await db.reservations.find_one({"reservation_id": reservation_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Solo se pueden confirmar reservas pendientes")
    
    # Update status to confirmed
    await db.reservations.update_one(
        {"reservation_id": reservation_id},
        {"$set": {"status": "confirmed", "confirmed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    updated = await db.reservations.find_one({"reservation_id": reservation_id}, {"_id": 0})
    
    # Send confirmation email to customer
    await send_confirmation_email(updated)
    
    # Send booking confirmation email via email service
    try:
        from email_service import send_booking_confirmation
        # Map reservation fields to expected format
        email_reservation = {
            "reservation_id": updated.get("reservation_id"),
            "date": updated.get("date"),
            "time": updated.get("start_time"),
            "end_time": updated.get("end_time"),
            "duration": updated.get("duration_hours"),
            "total_price": updated.get("price"),
            "customer_name": updated.get("name"),
            "customer_email": updated.get("email"),
            "customer_phone": updated.get("phone")
        }
        await send_booking_confirmation(db, email_reservation)
    except Exception as e:
        logger.error(f"Failed to send booking confirmation email: {e}")
    
    # Send WhatsApp notification to admin
    try:
        from whatsapp_service import notify_new_booking
        whatsapp_reservation = {
            "reservation_id": updated.get("reservation_id"),
            "date": updated.get("date"),
            "start_time": updated.get("start_time"),
            "duration_hours": updated.get("duration_hours"),
            "total_price": updated.get("price"),
            "customer_name": updated.get("name"),
            "customer_phone": updated.get("phone")
        }
        await notify_new_booking(whatsapp_reservation)
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification: {e}")
    
    # Send WhatsApp confirmation to customer
    await send_reservation_confirmed_notification(updated)
    
    return updated

async def send_reservation_confirmed_notification(reservation: dict):
    """Send WhatsApp notification to customer when reservation is confirmed"""
    customer_phone = reservation.get('phone', '')
    if not customer_phone:
        logger.warning(f"No customer phone for reservation {reservation.get('reservation_id')}")
        return
    
    message = f"""✅ *RESERVA CONFIRMADA - Avenue Studio*

¡Hola {reservation['name']}! 

Tu reserva ha sido confirmada.

📅 *Fecha:* {reservation['date']}
⏰ *Horario:* {reservation['start_time']} - {reservation['end_time']}
⏱️ *Duración:* {reservation['duration_hours']} horas
💰 *Precio:* {reservation['price']:,} Gs

📍 *Dirección:* Paseo Los Árboles, Av. San Martín, Asunción

⚠️ *Importante:* El pago se realiza en Avenue antes de ingresar al estudio.

¡Te esperamos! 🎬

_Avenue Studio_"""

    await send_whatsapp_notification(customer_phone, message)

@api_router.get("/reservations/my")
async def get_my_reservations(request: Request):
    """Get reservations for current authenticated user"""
    user = await require_auth(request)
    
    reservations = await db.reservations.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(100)
    
    return reservations

@api_router.get("/reservations/{reservation_id}")
async def get_reservation(reservation_id: str, request: Request):
    """Get a specific reservation"""
    reservation = await db.reservations.find_one(
        {"reservation_id": reservation_id},
        {"_id": 0}
    )
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check if user has access
    user = await get_current_user(request)
    if user:
        if user.get("role") != "admin" and reservation.get("user_id") != user["user_id"]:
            # Allow access if email matches
            if reservation.get("email") != user.get("email"):
                raise HTTPException(status_code=403, detail="Access denied")
    
    return reservation

@api_router.put("/reservations/{reservation_id}/cancel")
async def cancel_reservation(reservation_id: str, request: Request):
    """Cancel a reservation"""
    reservation = await db.reservations.find_one(
        {"reservation_id": reservation_id},
        {"_id": 0}
    )
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check if user has access
    user = await get_current_user(request)
    if user:
        if user.get("role") != "admin" and reservation.get("user_id") != user["user_id"]:
            if reservation.get("email") != user.get("email"):
                raise HTTPException(status_code=403, detail="Access denied")
    
    await db.reservations.update_one(
        {"reservation_id": reservation_id},
        {"$set": {"status": "cancelled"}}
    )
    
    return {"message": "Reservation cancelled successfully"}

# ==================== UGC ROUTES ====================

ELIGIBLE_FOLLOWER_RANGES = ['3000-5000', '5000-10000', '10000+']

def check_ugc_eligibility(data: dict) -> tuple:
    """Check if UGC application is eligible"""
    reasons = []
    
    # Check age
    birth_date = datetime.strptime(data['fecha_nacimiento'], "%Y-%m-%d")
    today = datetime.now()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    if age < 18:
        reasons.append('menor_de_edad')
    
    # Check social networks
    has_eligible_network = False
    
    # Check Instagram
    if data.get('instagram_url'):
        if data.get('instagram_privado') == 'privado':
            reasons.append('perfil_privado_ig')
        elif data.get('instagram_seguidores') in ELIGIBLE_FOLLOWER_RANGES:
            has_eligible_network = True
        else:
            reasons.append('sin_minimo_seguidores_ig')
    
    # Check TikTok
    if data.get('tiktok_url'):
        if data.get('tiktok_privado') == 'privado':
            reasons.append('perfil_privado_tk')
        elif data.get('tiktok_seguidores') in ELIGIBLE_FOLLOWER_RANGES:
            has_eligible_network = True
        else:
            reasons.append('sin_minimo_seguidores_tk')
    
    # Must have at least one network
    if not data.get('instagram_url') and not data.get('tiktok_url'):
        reasons.append('sin_redes')
    
    # Must have at least one eligible network
    if not has_eligible_network and 'sin_redes' not in reasons:
        if 'sin_minimo_seguidores_ig' not in reasons and 'sin_minimo_seguidores_tk' not in reasons:
            reasons.append('sin_minimo_seguidores')
    
    # Check video samples
    if not data.get('video_link_1') or not data.get('video_link_2'):
        reasons.append('sin_muestras')
    
    # Check filming confirmation
    if not data.get('confirma_grabar_tienda'):
        reasons.append('no_confirma_grabar_en_tienda')
    
    # Determine status
    # Filter out the specific platform reasons if they have an eligible one
    if has_eligible_network:
        reasons = [r for r in reasons if r not in ['sin_minimo_seguidores_ig', 'sin_minimo_seguidores_tk', 'perfil_privado_ig', 'perfil_privado_tk']]
    
    if reasons:
        return 'no_elegible', reasons
    return 'pendiente', []

@api_router.post("/ugc/aplicar")
async def ugc_apply(application: UGCApplication):
    """Submit a UGC creator application"""
    # Check if email already applied
    existing = await db.ugc_applications.find_one({"email": application.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una solicitud con este email")
    
    # Check eligibility
    app_data = application.model_dump()
    status, reasons = check_ugc_eligibility(app_data)
    
    # Create application
    application_id = f"ugc_{uuid.uuid4().hex[:12]}"
    
    app_doc = {
        "application_id": application_id,
        **app_data,
        "status": status,  # pendiente, no_elegible, preseleccionada
        "motivo_no_elegible": reasons if reasons else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ugc_applications.insert_one(app_doc)
    app_doc.pop("_id", None)
    
    # Send admin notification (WhatsApp + Email)
    await notify_new_ugc_application(app_doc)
    
    # Send confirmation email to applicant via email service
    try:
        from email_service import send_ugc_application_confirmation
        await send_ugc_application_confirmation(db, app_doc)
    except Exception as e:
        logger.error(f"Failed to send UGC application email: {e}")
    
    return {
        "application_id": application_id,
        "status": status,
        "message": "Solicitud recibida correctamente" if status == 'pendiente' else "Solicitud recibida pero no cumple con los requisitos mínimos"
    }

@api_router.get("/admin/ugc")
async def admin_get_ugc_applications(request: Request, status: Optional[str] = None):
    """Get all UGC applications (admin only)"""
    await require_admin(request)
    
    query = {}
    if status:
        query["status"] = status
    
    applications = await db.ugc_applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return applications

@api_router.put("/admin/ugc/{application_id}")
async def admin_update_ugc(application_id: str, updates: dict, request: Request):
    """Update UGC application status (admin only)"""
    await require_admin(request)
    
    application = await db.ugc_applications.find_one({"application_id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Only allow updating status
    allowed_fields = ["status", "notas"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if update_data:
        await db.ugc_applications.update_one(
            {"application_id": application_id},
            {"$set": update_data}
        )
    
    updated = await db.ugc_applications.find_one({"application_id": application_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/ugc/{application_id}")
async def admin_delete_ugc(application_id: str, request: Request):
    """Delete UGC application (admin only)"""
    await require_admin(request)
    
    result = await db.ugc_applications.delete_one({"application_id": application_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"message": "Application deleted successfully"}

# ==================== ADMIN ROUTES ====================

@api_router.post("/admin/test-email")
async def admin_test_email(request: Request):
    """Send a test confirmation email (admin only)"""
    await require_admin(request)
    
    # Create a sample reservation for the test email
    test_reservation = {
        "reservation_id": "res_test123456",
        "date": "2025-01-15",
        "start_time": "10:00",
        "end_time": "14:00",
        "duration_hours": 4,
        "price": 450000,
        "name": "Cliente de Prueba",
        "phone": "+595 971 234 567",
        "email": "carlos.melgarejo.miranda@gmail.com",  # Send to Resend registered email
        "company": "Marca Premium SRL",
        "razon_social": "Marca Premium SRL",
        "ruc": "80012345-6",
        "status": "confirmed"
    }
    
    await send_confirmation_email(test_reservation)
    
    return {"message": "Email de prueba enviado a carlos.melgarejo.miranda@gmail.com"}

@api_router.get("/admin/reservations")
async def admin_get_all_reservations(request: Request, date: Optional[str] = None, status: Optional[str] = None):
    """Get all reservations (admin only)"""
    await require_admin(request)
    
    query = {}
    if date:
        query["date"] = date
    if status:
        query["status"] = status
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return reservations

@api_router.post("/admin/reservations")
async def admin_create_reservation(reservation_data: ReservationCreate, request: Request):
    """Create a reservation manually (admin only)"""
    await require_admin(request)
    
    # Use the same logic as regular reservation creation
    return await create_reservation(reservation_data, request)

@api_router.put("/admin/reservations/{reservation_id}")
async def admin_update_reservation(reservation_id: str, updates: ReservationUpdate, request: Request):
    """Update a reservation (admin only)"""
    await require_admin(request)
    
    reservation = await db.reservations.find_one({"reservation_id": reservation_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    if update_data:
        await db.reservations.update_one(
            {"reservation_id": reservation_id},
            {"$set": update_data}
        )
    
    updated = await db.reservations.find_one({"reservation_id": reservation_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/reservations/{reservation_id}")
async def admin_delete_reservation(reservation_id: str, request: Request):
    """Delete a reservation (admin only)"""
    await require_admin(request)
    
    result = await db.reservations.delete_one({"reservation_id": reservation_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    return {"message": "Reservation deleted successfully"}

@api_router.get("/admin/users")
async def admin_get_users(request: Request):
    """Get all users (staff and above only)"""
    await require_staff_or_above(request)
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}/role")
async def admin_update_user_role(user_id: str, role_data: RoleUpdate, request: Request):
    """Update user role (superadmin only)"""
    current_user = await require_superadmin(request)
    
    # Check if user exists
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate role
    valid_roles = ["user", "designer", "staff", "admin"]
    if role_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    # Cannot change superadmin's role (avenuepy@gmail.com)
    if user.get("email") == ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Cannot change superadmin role")
    
    # Update role
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": role_data.role}}
    )
    
    updated_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    return updated_user

# ==================== ADMIN SETTINGS ====================

class AdminSettings(BaseModel):
    payment_gateway_enabled: Optional[bool] = None
    show_only_products_with_images: Optional[bool] = None
    whatsapp_commercial: Optional[str] = None
    whatsapp_marcas: Optional[str] = None

@api_router.get("/admin/settings")
async def get_admin_settings(request: Request):
    """Get admin settings"""
    await require_staff_or_above(request)
    
    settings = await db.admin_settings.find_one({"_id": "global"})
    if not settings:
        # Create default settings
        default_settings = {
            "_id": "global",
            "payment_gateway_enabled": False,  # Start with gateway disabled
            "show_only_products_with_images": False,
            "whatsapp_commercial": "+595973666000",
            "whatsapp_marcas": "+595976691520"
        }
        await db.admin_settings.insert_one(default_settings)
        settings = default_settings
    
    # Remove MongoDB _id for response
    return {
        "payment_gateway_enabled": settings.get("payment_gateway_enabled", False),
        "show_only_products_with_images": settings.get("show_only_products_with_images", False),
        "whatsapp_commercial": settings.get("whatsapp_commercial", "+595973666000"),
        "whatsapp_marcas": settings.get("whatsapp_marcas", "+595976691520")
    }

@api_router.put("/admin/settings")
async def update_admin_settings(settings_update: AdminSettings, request: Request):
    """Update admin settings (admin only)"""
    await require_admin(request)
    
    update_data = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.admin_settings.update_one(
            {"_id": "global"},
            {"$set": update_data},
            upsert=True
        )
    
    return await get_admin_settings(request)

@api_router.get("/admin/permissions")
async def get_user_permissions(request: Request):
    """Get current user's permissions based on role"""
    user = await require_auth(request)
    role = user.get("role", "user")
    
    return {
        "role": role,
        "permissions": {
            "can_manage_users": role == "superadmin",
            "can_edit_website": role in ["superadmin", "admin", "designer"],
            "can_manage_orders": role in ["superadmin", "admin", "staff"],
            "can_manage_reservations": role in ["superadmin", "admin", "staff"],
            "can_manage_ugc": role in ["superadmin", "admin", "staff"],
            "can_manage_images": role in ["superadmin", "admin", "designer"],
            "can_change_settings": role in ["superadmin", "admin"],
            "can_view_analytics": role in ["superadmin", "admin", "staff"]
        }
    }

# ==================== ADMIN ORDERS ====================

@api_router.get("/admin/orders")
async def admin_get_orders(request: Request, status: Optional[str] = None):
    """Get all orders (staff and above)"""
    await require_staff_or_above(request)
    
    query = {}
    if status:
        query["order_status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.put("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, updates: dict, request: Request):
    """Update order status (staff and above)"""
    await require_staff_or_above(request)
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    allowed_fields = ["order_status", "notes"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    old_status = order.get("order_status")
    new_status = update_data.get("order_status")
    
    if update_data:
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": update_data}
        )
    
    updated = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    # Send WhatsApp notification to customer when order is marked as "facturado"
    if new_status == "facturado" and old_status != "facturado":
        await send_order_invoiced_notification(updated)
    
    return updated

async def send_order_invoiced_notification(order: dict):
    """Send WhatsApp notification to customer when order is invoiced"""
    customer_phone = order.get('customer_phone', '')
    if not customer_phone:
        logger.warning(f"No customer phone for order {order.get('order_id')}")
        return
    
    items_text = "\n".join([
        f"• {item.get('name', 'Producto')}" + 
        (f" - Talle: {item.get('size')}" if item.get('size') else "") + 
        f" x{item.get('quantity', 1)}" 
        for item in order.get('items', [])
    ])
    
    delivery_type = order.get('delivery_type', '')
    delivery_address = order.get('delivery_address', {})
    
    if delivery_type == 'delivery':
        delivery_info = f"📍 *Envío a:* {delivery_address.get('address', 'Dirección no especificada')}"
        if delivery_address.get('lat') and delivery_address.get('lng'):
            delivery_info += f"\n🗺️ *Ubicación:* https://maps.google.com/?q={delivery_address['lat']},{delivery_address['lng']}"
        action_text = "Tu pedido está siendo preparado para envío. ¡Pronto estará en camino! 🚚"
    else:
        delivery_info = "🏪 *Retiro en tienda*\n📍 Avda. Gral Santos esq. Concordia - Asunción"
        action_text = "Tu pedido está listo para retirar en nuestra tienda. 🛍️"
    
    message = f"""🎉 *¡PEDIDO CONFIRMADO! - Avenue Online*

¡Hola {order.get('customer_name', '')}! 

Tu pedido ha sido facturado y confirmado.

📦 *Pedido:* {order.get('order_id', '')}

🛍️ *Productos:*
{items_text}

💰 *Total:* {order.get('total', 0):,.0f} Gs

{delivery_info}

{action_text}

¡Gracias por elegir Avenue! 🙏

_Avenue - Donde las marcas brillan_
WhatsApp: +595 973 666 000"""

    try:
        await send_whatsapp_notification(customer_phone, message)
        logger.info(f"Invoiced notification sent to {customer_phone} for order {order.get('order_id')}")
    except Exception as e:
        logger.error(f"Failed to send invoiced notification to {customer_phone}: {e}")

# ==================== BRAND INQUIRIES ROUTES ====================

INTEREST_LABELS = {
    "venta_tienda": "Venta en tienda física",
    "tienda_online": "Presencia en tienda online",
    "estudio": "Sesiones fotográficas",
    "ugc": "Campañas con creators/UGC",
    "eventos": "Eventos y activaciones",
    "todo": "Todo lo anterior"
}

@api_router.post("/contact/brands")
async def submit_brand_inquiry(inquiry: BrandInquiry):
    """Submit a brand inquiry from Tu Marca page"""
    inquiry_doc = {
        "inquiry_id": f"BRD-{str(uuid.uuid4())[:8].upper()}",
        "brand_name": inquiry.brand_name,
        "contact_name": inquiry.contact_name,
        "email": inquiry.email,
        "phone": inquiry.phone or "",
        "interest": inquiry.interest,
        "interest_label": INTEREST_LABELS.get(inquiry.interest, inquiry.interest),
        "message": inquiry.message or "",
        "status": "nuevo",  # nuevo, contactado, en_proceso, cerrado
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notes": ""
    }
    
    await db.brand_inquiries.insert_one(inquiry_doc)
    inquiry_doc.pop("_id", None)
    
    # Send WhatsApp notification to admin using new service
    try:
        from whatsapp_service import notify_new_brand_inquiry
        await notify_new_brand_inquiry({
            "brand_name": inquiry.brand_name,
            "contact_name": inquiry.contact_name,
            "phone": inquiry.phone or 'N/A',
            "email": inquiry.email,
            "interest_type": INTEREST_LABELS.get(inquiry.interest, inquiry.interest)
        })
    except Exception as e:
        logger.error(f"Failed to send WhatsApp for brand inquiry: {e}")
    
    # Send confirmation email to brand via email service
    try:
        from email_service import send_brand_inquiry_confirmation
        await send_brand_inquiry_confirmation(db, inquiry_doc)
    except Exception as e:
        logger.error(f"Failed to send brand inquiry email: {e}")
    
    return {"success": True, "inquiry_id": inquiry_doc["inquiry_id"]}

@api_router.get("/admin/brand-inquiries")
async def get_brand_inquiries(status: Optional[str] = None):
    """Get all brand inquiries for admin panel"""
    query = {}
    if status:
        query["status"] = status
    
    inquiries = await db.brand_inquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return inquiries

@api_router.put("/admin/brand-inquiries/{inquiry_id}")
async def update_brand_inquiry(inquiry_id: str, data: dict):
    """Update a brand inquiry status or notes"""
    allowed_fields = ["status", "notes"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.brand_inquiries.update_one(
        {"inquiry_id": inquiry_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    
    return {"message": "Consulta actualizada", "inquiry_id": inquiry_id}

@api_router.delete("/admin/brand-inquiries/{inquiry_id}")
async def delete_brand_inquiry(inquiry_id: str):
    """Delete a brand inquiry"""
    result = await db.brand_inquiries.delete_one({"inquiry_id": inquiry_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    
    return {"message": "Consulta eliminada"}

# ==================== MFA ENDPOINTS ====================

@api_router.post("/auth/mfa/setup")
async def setup_mfa(request: Request):
    """Initialize MFA setup - generate secret and QR code"""
    user = await require_auth(request)
    
    # Generate TOTP secret
    secret = generate_totp_secret()
    recovery_codes = generate_recovery_codes()
    
    # Store temporarily (will be confirmed when user verifies)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "mfa_temp_secret": secret,
            "mfa_temp_recovery_codes": recovery_codes
        }}
    )
    
    # Generate QR code
    uri = get_totp_uri(secret, user["email"])
    qr_code = generate_qr_code_base64(uri)
    
    return MFASetupResponse(
        secret=secret,
        qr_code=qr_code,
        recovery_codes=recovery_codes
    )

@api_router.post("/auth/mfa/verify-setup")
async def verify_mfa_setup(data: MFAVerifyRequest, request: Request, response: Response):
    """Verify MFA setup with TOTP code"""
    user = await require_auth(request)
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    temp_secret = user.get("mfa_temp_secret")
    if not temp_secret:
        raise HTTPException(status_code=400, detail="No hay configuración MFA pendiente")
    
    if not verify_totp(temp_secret, data.code):
        await create_audit_log(
            db, AuditAction.MFA_FAILED, user["user_id"], user["email"], user.get("role"),
            ip_address, user_agent, {"type": "setup_verification"}
        )
        raise HTTPException(status_code=400, detail="Código inválido")
    
    # Activate MFA
    temp_recovery = user.get("mfa_temp_recovery_codes", [])
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {
                "mfa_enabled": True,
                "mfa_secret": temp_secret,
                "mfa_recovery_codes": temp_recovery,
                "mfa_enabled_at": datetime.now(timezone.utc).isoformat()
            },
            "$unset": {
                "mfa_temp_secret": "",
                "mfa_temp_recovery_codes": ""
            }
        }
    )
    
    await create_audit_log(
        db, AuditAction.MFA_ENABLED, user["user_id"], user["email"], user.get("role"),
        ip_address, user_agent, {}
    )
    
    # Create new token with MFA verified
    token = create_jwt_token(user["user_id"], user["email"], user.get("role", "user"), mfa_verified=True)
    
    # Set cookie
    role = user.get("role", "user")
    expiration_hours = JWT_EXPIRATION_HOURS_ADMIN if is_admin_role(role) else JWT_EXPIRATION_HOURS
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=expiration_hours * 3600,
        path="/"
    )
    
    return {
        "success": True,
        "message": "MFA activado correctamente",
        "token": token,
        "recovery_codes_count": len(temp_recovery)
    }

@api_router.post("/auth/mfa/verify")
async def verify_mfa(data: MFAVerifyRequest, request: Request, response: Response):
    """Verify MFA code during login"""
    # Get user from partial token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = decode_jwt_token(token)
    except:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    secret = user.get("mfa_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="MFA no configurado")
    
    if not verify_totp(secret, data.code):
        await create_audit_log(
            db, AuditAction.MFA_FAILED, user["user_id"], user["email"], user.get("role"),
            ip_address, user_agent, {"type": "login_verification"}
        )
        raise HTTPException(status_code=400, detail="Código inválido")
    
    # Create full token with MFA verified
    role = user.get("role", "user")
    new_token = create_jwt_token(user["user_id"], user["email"], role, mfa_verified=True)
    
    # Set cookie
    expiration_hours = JWT_EXPIRATION_HOURS_ADMIN if is_admin_role(role) else JWT_EXPIRATION_HOURS
    response.set_cookie(
        key="session_token",
        value=new_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=expiration_hours * 3600,
        path="/"
    )
    
    await create_audit_log(
        db, AuditAction.MFA_VERIFIED, user["user_id"], user["email"], role,
        ip_address, user_agent, {}
    )
    
    return {
        "success": True,
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": role,
        "token": new_token
    }

@api_router.post("/auth/mfa/recovery")
async def use_recovery_code(request: Request, response: Response):
    """Use recovery code when TOTP is unavailable"""
    body = await request.json()
    recovery_code = body.get("recovery_code")
    
    if not recovery_code:
        raise HTTPException(status_code=400, detail="Código de recuperación requerido")
    
    # Get user from partial token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = decode_jwt_token(token)
    except:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    recovery_codes = user.get("mfa_recovery_codes", [])
    is_valid, updated_codes = verify_recovery_code(recovery_code, recovery_codes)
    
    if not is_valid:
        await create_audit_log(
            db, AuditAction.MFA_FAILED, user["user_id"], user["email"], user.get("role"),
            ip_address, user_agent, {"type": "recovery_code_invalid"}
        )
        raise HTTPException(status_code=400, detail="Código de recuperación inválido")
    
    # Update recovery codes (remove used one)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"mfa_recovery_codes": updated_codes}}
    )
    
    # Create full token
    role = user.get("role", "user")
    new_token = create_jwt_token(user["user_id"], user["email"], role, mfa_verified=True)
    
    # Set cookie
    expiration_hours = JWT_EXPIRATION_HOURS_ADMIN if is_admin_role(role) else JWT_EXPIRATION_HOURS
    response.set_cookie(
        key="session_token",
        value=new_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=expiration_hours * 3600,
        path="/"
    )
    
    await create_audit_log(
        db, AuditAction.MFA_VERIFIED, user["user_id"], user["email"], role,
        ip_address, user_agent, {"type": "recovery_code", "codes_remaining": len(updated_codes)}
    )
    
    return {
        "success": True,
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": role,
        "token": new_token,
        "recovery_codes_remaining": len(updated_codes)
    }

@api_router.get("/auth/mfa/status")
async def get_mfa_status(request: Request):
    """Get MFA status for current user"""
    user = await require_auth(request)
    
    return {
        "mfa_enabled": user.get("mfa_enabled", False),
        "mfa_enabled_at": user.get("mfa_enabled_at"),
        "recovery_codes_remaining": len(user.get("mfa_recovery_codes", []))
    }

@api_router.post("/auth/mfa/regenerate-recovery")
async def regenerate_recovery_codes(data: MFAVerifyRequest, request: Request):
    """Regenerate recovery codes (requires MFA verification)"""
    user = await require_auth(request)
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    if not user.get("mfa_enabled"):
        raise HTTPException(status_code=400, detail="MFA no está habilitado")
    
    # Verify current MFA code
    if not verify_totp(user.get("mfa_secret", ""), data.code):
        await create_audit_log(
            db, AuditAction.MFA_FAILED, user["user_id"], user["email"], user.get("role"),
            ip_address, user_agent, {"type": "regenerate_recovery_verification"}
        )
        raise HTTPException(status_code=400, detail="Código MFA inválido")
    
    # Generate new recovery codes
    new_codes = generate_recovery_codes()
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"mfa_recovery_codes": new_codes}}
    )
    
    await create_audit_log(
        db, AuditAction.MFA_ENABLED, user["user_id"], user["email"], user.get("role"),
        ip_address, user_agent, {"type": "recovery_codes_regenerated"}
    )
    
    return {
        "success": True,
        "recovery_codes": new_codes
    }

# ==================== AUDIT LOG ENDPOINTS ====================

@api_router.get("/admin/audit-logs")
async def get_audit_logs(
    request: Request,
    action: Optional[str] = None,
    user_email: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get audit logs (admin only)"""
    await require_admin(request)
    
    # Build query
    query = {}
    
    if action:
        query["action"] = action
    if user_email:
        query["user_email"] = {"$regex": user_email, "$options": "i"}
    if start_date:
        query["timestamp"] = {"$gte": start_date}
    if end_date:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = end_date
        else:
            query["timestamp"] = {"$lte": end_date}
    
    # Get logs
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.audit_logs.count_documents(query)
    
    return {
        "logs": logs,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@api_router.get("/admin/audit-logs/actions")
async def get_audit_action_types(request: Request):
    """Get list of audit action types"""
    await require_admin(request)
    
    return {
        "actions": [
            {"value": AuditAction.LOGIN_SUCCESS, "label": "Login exitoso"},
            {"value": AuditAction.LOGIN_FAILED, "label": "Login fallido"},
            {"value": AuditAction.LOGOUT, "label": "Logout"},
            {"value": AuditAction.MFA_ENABLED, "label": "MFA activado"},
            {"value": AuditAction.MFA_DISABLED, "label": "MFA desactivado"},
            {"value": AuditAction.MFA_VERIFIED, "label": "MFA verificado"},
            {"value": AuditAction.MFA_FAILED, "label": "MFA fallido"},
            {"value": AuditAction.PASSWORD_CHANGED, "label": "Contraseña cambiada"},
            {"value": AuditAction.USER_ROLE_CHANGED, "label": "Rol de usuario cambiado"},
            {"value": AuditAction.ORDER_STATUS_CHANGED, "label": "Estado de pedido cambiado"},
            {"value": AuditAction.SETTINGS_CHANGED, "label": "Configuración cambiada"},
            {"value": AuditAction.COUPON_CREATED, "label": "Cupón creado"},
            {"value": AuditAction.COUPON_DELETED, "label": "Cupón eliminado"},
        ]
    }

# ==================== BASIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Avenue Studio API"}

# Include the router in the main app
app.include_router(api_router)

# Include e-commerce router and set database
from ecommerce import ecommerce_router, set_database, start_sync_on_startup
set_database(db)
app.include_router(ecommerce_router)

# Include website builder router
from website_builder import router as builder_router
app.include_router(builder_router)

# Include SEO router (robots.txt, sitemap.xml)
from seo import seo_router
app.include_router(seo_router)

# Include UGC Platform routers
from routes.ugc_creators import router as ugc_creators_router
from routes.ugc_brands import router as ugc_brands_router
from routes.ugc_campaigns import router as ugc_campaigns_router
from routes.ugc_packages import router as ugc_packages_router
from routes.ugc_applications import router as ugc_applications_router
from routes.ugc_deliverables import router as ugc_deliverables_router
from routes.ugc_metrics import router as ugc_metrics_router
from routes.ugc_admin import router as ugc_admin_router

app.include_router(ugc_creators_router)
app.include_router(ugc_brands_router)
app.include_router(ugc_campaigns_router)
app.include_router(ugc_packages_router)
app.include_router(ugc_applications_router)
app.include_router(ugc_deliverables_router)
app.include_router(ugc_metrics_router)
app.include_router(ugc_admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize e-commerce product sync"""
    logger.info("Starting e-commerce product sync...")
    await start_sync_on_startup()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
