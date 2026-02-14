from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
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
import sentry_sdk

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

# Initialize Sentry for error monitoring
sentry_dsn = os.environ.get('SENTRY_DSN')
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        environment="production",
        send_default_pii=False,  # Don't send personally identifiable information
    )
    logging.info("Sentry initialized successfully")

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

# Admin emails by type
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'avenuepy@gmail.com')
ADMIN_EMAIL_UGC = os.environ.get('ADMIN_EMAIL_UGC', 'avenue.ugc@gmail.com')
ADMIN_EMAIL_STUDIO = os.environ.get('ADMIN_EMAIL_STUDIO', 'avenue.studio@gmail.com')

def get_admin_email(sender_type: str = 'general') -> str:
    """Get the appropriate admin email based on sender type"""
    if sender_type == 'ugc':
        return ADMIN_EMAIL_UGC
    elif sender_type == 'studio':
        return ADMIN_EMAIL_STUDIO
    else:
        return ADMIN_EMAIL

# Create the main app
app = FastAPI()

# Health check endpoint for Kubernetes/deployment probes
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment readiness probes"""
    return {"status": "healthy"}

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
    brand_name: Optional[str] = None
    contact_name: Optional[str] = None
    name: Optional[str] = None  # For UGC form
    brand: Optional[str] = None  # For UGC form
    email: EmailStr
    phone: Optional[str] = None
    interest: Optional[str] = None
    message: Optional[str] = None
    product_type: Optional[str] = None
    selected_plan: Optional[str] = None
    questionnaire: Optional[dict] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    acceptTerms: Optional[bool] = False

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
    """Send confirmation email for a reservation to both customer and admin"""
    try:
        # Email content for customer
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
        
        # 1. Send to customer
        params = {
            "from": "AVENUE Studio <reservas@avenue.com.py>",
            "to": [reservation['email']],
            "subject": f"✅ Reserva Confirmada - Avenue Studio - {reservation['date']}",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Confirmation email sent to customer: {reservation['email']}")
        
        # 2. Send confirmation to admin (studio)
        admin_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #f5ede4; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #d4a968; font-style: italic; font-weight: 300; margin: 0;">Avenue Studio</h1>
                <p style="color: #22c55e; margin-top: 10px;">✅ Reserva Confirmada</p>
            </div>
            
            <div style="background-color: #1a1a1a; padding: 30px; border: 1px solid #22c55e; margin-bottom: 20px;">
                <h2 style="color: #22c55e; margin-top: 0;">Reserva Confirmada</h2>
                
                <h3 style="color: #d4a968; margin-top: 20px;">Datos del Cliente:</h3>
                <table style="width: 100%; color: #f5ede4;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Nombre:</strong></td>
                        <td style="padding: 8px 0; color: #d4a968;">{reservation['name']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Email:</strong></td>
                        <td style="padding: 8px 0;">{reservation['email']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Teléfono:</strong></td>
                        <td style="padding: 8px 0;">{reservation.get('phone', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Empresa:</strong></td>
                        <td style="padding: 8px 0;">{reservation.get('company', 'N/A')}</td>
                    </tr>
                </table>
                
                <h3 style="color: #d4a968; margin-top: 20px;">Detalles de la Reserva:</h3>
                <table style="width: 100%; color: #f5ede4;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Fecha:</strong></td>
                        <td style="padding: 8px 0; color: #d4a968;">{reservation['date']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Horario:</strong></td>
                        <td style="padding: 8px 0; color: #d4a968;">{reservation['start_time']} - {reservation['end_time']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Duración:</strong></td>
                        <td style="padding: 8px 0;">{reservation['duration_hours']} horas</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Precio:</strong></td>
                        <td style="padding: 8px 0; color: #22c55e; font-size: 18px;">{reservation['price']:,} Gs</td>
                    </tr>
                </table>
            </div>
        </div>
        """
        
        admin_params = {
            "from": "AVENUE Studio <reservas@avenue.com.py>",
            "to": [ADMIN_EMAIL_STUDIO],
            "subject": f"✅ CONFIRMADA - {reservation['name']} - {reservation['date']} {reservation['start_time']}",
            "html": admin_html
        }
        
        await asyncio.to_thread(resend.Emails.send, admin_params)
        logger.info(f"Confirmation email sent to admin: {ADMIN_EMAIL_STUDIO}")
        
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

async def send_admin_email_notification(subject: str, html_content: str, sender_type: str = 'ecommerce'):
    """Send email notification to admin with appropriate sender based on type"""
    # Map sender types to email addresses
    senders = {
        'ecommerce': 'AVENUE Pedidos <pedidos@avenue.com.py>',
        'studio': 'AVENUE Studio <reservas@avenue.com.py>',
        'ugc': 'AVENUE UGC <creadoresUGC@avenue.com.py>',
        'brands': 'AVENUE Marcas <infobrands@avenue.com.py>',
    }
    sender = senders.get(sender_type, senders['ecommerce'])
    
    # Get the appropriate admin email based on type
    admin_email = get_admin_email(sender_type)
    
    try:
        params = {
            "from": sender,
            "to": [admin_email],
            "subject": subject,
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Admin email notification sent to {admin_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send admin email notification to {admin_email}: {str(e)}")
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
    await send_admin_email_notification(f"🎬 Nueva Reserva - {reservation['name']} - {reservation['date']}", email_html, sender_type='studio')

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
    await send_admin_email_notification(f"📸 Nueva Aplicación UGC - {nombre_completo}", email_html, sender_type='ugc')

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
    await send_admin_email_notification(f"🛒 Nuevo Pedido #{order.get('order_id', 'N/A')} - {order.get('total', 0):,.0f} Gs", email_html, sender_type='ecommerce')
    
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
            "from": "AVENUE Pedidos <pedidos@avenue.com.py>",
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
async def register(user_data: UserCreate, request: Request, response: Response):
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
        "password_hash": hashed_password,
        "picture": None,
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Record terms acceptance if user accepted
    if user_data.acceptTerms:
        try:
            ip_address = get_client_ip(request)
            user_agent = get_user_agent(request)
            
            # Accept privacy policy and general terms
            terms_to_accept = [
                {"slug": "privacy-policy", "version": "1.0"},
                {"slug": "terms-ecommerce", "version": "1.0"}
            ]
            
            for term in terms_to_accept:
                acceptance_doc = {
                    "user_id": user_id,
                    "terms_slug": term["slug"],
                    "terms_version": term["version"],
                    "accepted_at": datetime.now(timezone.utc).isoformat(),
                    "ip_address": ip_address,
                    "user_agent": user_agent
                }
                await db.terms_acceptances.insert_one(acceptance_doc)
        except Exception as e:
            # Log but don't fail registration if terms recording fails
            print(f"Failed to record terms acceptance: {e}")
    
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
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
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
    
    # MFA DISABLED - Skip MFA verification for now
    # TODO: Re-enable MFA when needed
    # if is_admin_role(role) and has_mfa:
    #     # Return partial token - MFA verification required
    #     partial_token = create_jwt_token(user["user_id"], user["email"], role, mfa_verified=False)
    #     
    #     await create_audit_log(
    #         db, AuditAction.LOGIN_SUCCESS, user["user_id"], user["email"], role,
    #         ip_address, user_agent, {"mfa_required": True}
    #     )
    #     
    #     return {
    #         "user_id": user["user_id"],
    #         "email": user["email"],
    #         "name": user["name"],
    #         "role": role,
    #         "mfa_required": True,
    #         "partial_token": partial_token
    #     }
    
    # Create full token
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
    
    # Check for UGC profiles
    has_creator_profile = await db.ugc_creators.find_one({"user_id": user["user_id"]}) is not None
    has_brand_profile = await db.ugc_brands.find_one({"user_id": user["user_id"]}) is not None
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": role,
        "token": token,
        "has_creator_profile": has_creator_profile,
        "has_brand_profile": has_brand_profile
    }

@api_router.post("/auth/google/callback")
async def google_callback(request: Request, response: Response):
    """Handle Google OAuth callback - exchange session_id for user data"""
    try:
        body = await request.json()
        session_id = body.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id required")
        
        logger.info(f"Google callback: Processing session_id {session_id[:8]}...")
        
        # Call Emergent auth API to get user data
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                auth_response = await client.get(
                    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                    headers={"X-Session-ID": session_id}
                )
                
                logger.info(f"Google callback: Emergent API response status: {auth_response.status_code}")
                
                if auth_response.status_code != 200:
                    logger.error(f"Google callback: Invalid session - status {auth_response.status_code}, body: {auth_response.text[:200]}")
                    raise HTTPException(status_code=401, detail="Invalid or expired session. Please try again.")
                
                google_data = auth_response.json()
                logger.info(f"Google callback: Got user data for {google_data.get('email', 'unknown')}")
            except httpx.TimeoutException:
                logger.error("Google callback: Timeout calling Emergent API")
                raise HTTPException(status_code=504, detail="Authentication server timeout. Please try again.")
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Google callback: Error calling Emergent API: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")
        
        email = google_data.get("email")
        name = google_data.get("name")
        picture = google_data.get("picture")
        
        if not email:
            logger.error("Google callback: No email in response")
            raise HTTPException(status_code=400, detail="No email received from Google")
        
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
            user_phone = existing_user.get("phone")
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            role = "superadmin" if email == ADMIN_EMAIL else "user"
            
            user_doc = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "phone": None,
                "password_hash": None,
                "picture": picture,
                "role": role,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
            user_phone = None
        
        # Create JWT token
        token = create_jwt_token(user_id, email, role)
        
        # Track if this is a new user
        is_new_user = not existing_user
        
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
        
        # Check for UGC profiles
        has_creator_profile = await db.ugc_creators.find_one({"user_id": user_id}) is not None
        has_brand_profile = await db.ugc_brands.find_one({"user_id": user_id}) is not None
        
        # Check if user has accepted terms
        has_accepted_terms = await db.terms_acceptances.find_one({"user_id": user_id}) is not None
        
        logger.info(f"Google callback: Success for {email}, is_new_user={is_new_user}")
        
        return {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "token": token,
            "has_creator_profile": has_creator_profile,
            "has_brand_profile": has_brand_profile,
            "is_new_user": is_new_user,
            "needs_terms_acceptance": is_new_user and not has_accepted_terms
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google callback: Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user with UGC profile info"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Remove password from response
    user_response = {k: v for k, v in user.items() if k not in ["password", "password_hash"]}
    
    # Check for UGC profiles
    has_creator_profile = await db.ugc_creators.find_one({"user_id": user["user_id"]}) is not None
    has_brand_profile = await db.ugc_brands.find_one({"user_id": user["user_id"]}) is not None
    
    user_response["has_creator_profile"] = has_creator_profile
    user_response["has_brand_profile"] = has_brand_profile
    
    return user_response

@api_router.post("/auth/logout")
async def logout(response: Response):
    """Logout - clear session cookie"""
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== USER PROFILE ROUTES ====================

@api_router.get("/user/profile")
async def get_user_profile(request: Request):
    """Get complete user profile with billing and addresses"""
    user = await require_auth(request)
    
    user_data = await db.users.find_one(
        {"user_id": user["user_id"]}, 
        {"_id": 0, "password": 0, "password_hash": 0}
    )
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for UGC profiles
    has_creator_profile = await db.ugc_creators.find_one({"user_id": user["user_id"]}) is not None
    has_brand_profile = await db.ugc_brands.find_one({"user_id": user["user_id"]}) is not None
    
    return {
        **user_data,
        "billing_info": user_data.get("billing_info", {}),
        "shipping_addresses": user_data.get("shipping_addresses", []),
        "has_creator_profile": has_creator_profile,
        "has_brand_profile": has_brand_profile
    }

@api_router.put("/user/profile")
async def update_user_profile(request: Request):
    """Update user profile with billing info"""
    user = await require_auth(request)
    updates = await request.json()
    
    # Allowed fields to update
    allowed_fields = ["name", "phone", "city", "billing_info"]
    update_data = {}
    
    for field in allowed_fields:
        if field in updates:
            update_data[field] = updates[field]
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_data}
        )
    
    return {"success": True, "message": "Profile updated"}

@api_router.get("/user/addresses")
async def get_user_addresses(request: Request):
    """Get user's shipping addresses"""
    user = await require_auth(request)
    
    user_data = await db.users.find_one(
        {"user_id": user["user_id"]}, 
        {"_id": 0, "shipping_addresses": 1}
    )
    
    return {"addresses": user_data.get("shipping_addresses", [])}

@api_router.post("/user/addresses")
async def add_user_address(request: Request):
    """Add a new shipping address"""
    user = await require_auth(request)
    address_data = await request.json()
    
    # Create address with ID
    address = {
        "id": str(uuid.uuid4()),
        "alias": address_data.get("alias", ""),
        "direccion": address_data.get("direccion", ""),
        "ciudad": address_data.get("ciudad", ""),
        "referencia": address_data.get("referencia", ""),
        "is_default": address_data.get("is_default", False),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # If this is set as default, unset other defaults
    if address["is_default"]:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"shipping_addresses.$[].is_default": False}}
        )
    
    # Add new address
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$push": {"shipping_addresses": address}}
    )
    
    return {"success": True, "address": address}

@api_router.delete("/user/addresses/{address_id}")
async def delete_user_address(address_id: str, request: Request):
    """Delete a shipping address"""
    user = await require_auth(request)
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$pull": {"shipping_addresses": {"id": address_id}}}
    )
    
    return {"success": True}

@api_router.get("/user/orders")
async def get_user_orders(request: Request):
    """Get user's order history"""
    user = await require_auth(request)
    
    orders = await db.orders.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {"orders": orders}

@api_router.put("/auth/profile")
async def update_profile(request: Request, updates: dict):
    """Update user profile (legacy endpoint)"""
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
        # Regular user creates request - send notification to admin and customer
        await notify_reservation_request(reservation_doc)
        # Send email notification to both customer and admin
        try:
            from email_service import send_booking_request_notification
            await send_booking_request_notification(db, reservation_doc)
        except Exception as e:
            logger.error(f"Failed to send booking request emails: {e}")
    
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
    """Submit a brand inquiry from Tu Marca or UGC Marcas page"""
    # Handle field variations between forms
    brand_name = inquiry.brand_name or inquiry.brand or ""
    contact_name = inquiry.contact_name or inquiry.name or ""
    
    inquiry_doc = {
        "inquiry_id": f"BRD-{str(uuid.uuid4())[:8].upper()}",
        "brand_name": brand_name,
        "contact_name": contact_name,
        "email": inquiry.email,
        "phone": inquiry.phone or "",
        "interest": inquiry.interest or "",
        "interest_label": INTEREST_LABELS.get(inquiry.interest, inquiry.interest) if inquiry.interest else "",
        "message": inquiry.message or "",
        "product_type": inquiry.product_type or "",
        "selected_plan": inquiry.selected_plan or "",
        "questionnaire": inquiry.questionnaire or {},
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
            "brand_name": brand_name,
            "contact_name": contact_name,
            "phone": inquiry.phone or 'N/A',
            "email": inquiry.email,
            "interest_type": INTEREST_LABELS.get(inquiry.interest, inquiry.interest) if inquiry.interest else inquiry.selected_plan or 'Consulta'
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

# ==================== FILE UPLOAD ====================
from fastapi import UploadFile, File
import base64
import hashlib

# GridFS-based persistent image storage (legacy - keeping for backwards compatibility)
from services.gridfs_storage import (
    upload_image as gridfs_upload,
    get_image as gridfs_get,
    delete_image as gridfs_delete,
    get_image_url as gridfs_url,
    get_storage_stats as gridfs_stats,
    list_images as gridfs_list
)

# Cloudinary storage (new - preferred)
from services.cloudinary_storage import (
    upload_image as cloudinary_upload,
    delete_asset as cloudinary_delete,
    CLOUDINARY_CONFIGURED
)

# Legacy: Keep uploads directory for backwards compatibility during migration
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    folder: str = "avenue/general"
):
    """Upload a file to Cloudinary. Retries on failure."""
    import asyncio
    user = await require_auth(request)
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Solo imágenes.")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande. Máximo 5MB.")
    
    # Check Cloudinary is configured
    if not CLOUDINARY_CONFIGURED:
        raise HTTPException(status_code=503, detail="Cloudinary no está configurado. Contacte al administrador.")
    
    # Upload with retries
    last_error = None
    for attempt in range(3):
        try:
            result = await cloudinary_upload(
                file_content=contents,
                filename=file.filename,
                folder=folder,
                public=True,
                metadata={"uploaded_by": user.get("user_id", "unknown")}
            )
            
            if result.get("success"):
                return {
                    "url": result.get("url"),
                    "cloudinary_url": result.get("url"),
                    "public_id": result.get("public_id"),
                    "storage": "cloudinary",
                    "filename": file.filename
                }
            else:
                last_error = result.get("error", "Error desconocido")
                logger.warning(f"Upload attempt {attempt + 1} failed: {last_error}")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Upload attempt {attempt + 1} exception: {e}")
        
        if attempt < 2:
            await asyncio.sleep(1 * (attempt + 1))
    
    # All retries failed
    raise HTTPException(
        status_code=503,
        detail=f"No se pudo subir el archivo después de 3 intentos. Error: {last_error}. Por favor intente de nuevo."
    )

@api_router.get("/images/{file_id}")
async def serve_gridfs_image(file_id: str):
    """Serve images from GridFS persistent storage"""
    content, content_type, filename = await gridfs_get(file_id)
    
    if content is None:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Cache-Control": "public, max-age=31536000"  # Cache for 1 year
        }
    )

@api_router.delete("/images/{file_id}")
async def delete_gridfs_image(file_id: str, request: Request):
    """Delete an image from GridFS storage"""
    user = await require_auth(request)
    
    # Only admins can delete images
    if not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    success = await gridfs_delete(file_id)
    if not success:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    
    return {"message": "Imagen eliminada", "file_id": file_id}

@api_router.get("/storage/stats")
async def get_storage_statistics(request: Request):
    """Get storage statistics (admin only)"""
    user = await require_auth(request)
    if not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="No autorizado")
    
    stats = await gridfs_stats()
    return stats

# Legacy endpoint: Serve uploads from local filesystem (backwards compatibility)
@api_router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Serve uploaded files from local storage (legacy, for backwards compatibility)"""
    from fastapi.responses import FileResponse
    
    # Sanitize filename
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    # Determine content type
    ext = safe_filename.split(".")[-1].lower()
    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
        "avif": "image/avif"
    }
    content_type = content_types.get(ext, "application/octet-stream")
    
    return FileResponse(file_path, media_type=content_type)

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
from routes.ugc_reputation import router as ugc_reputation_router
from routes.ugc_brand_reports import router as ugc_brand_reports_router
from routes.social_verification import router as social_verification_router
from routes.notifications import router as notifications_router
from routes.terms import router as terms_router
from routes.cloudinary_routes import router as cloudinary_router

app.include_router(ugc_creators_router)
app.include_router(ugc_brands_router)
app.include_router(ugc_campaigns_router)
app.include_router(ugc_packages_router)
app.include_router(ugc_applications_router)
app.include_router(ugc_deliverables_router)
app.include_router(ugc_metrics_router)
app.include_router(ugc_admin_router)
app.include_router(ugc_reputation_router)
app.include_router(ugc_brand_reports_router)
app.include_router(social_verification_router)
app.include_router(notifications_router)
app.include_router(terms_router)
app.include_router(cloudinary_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import contract jobs and scheduler
from services.contract_jobs import run_all_contract_jobs
from services.email_scheduler import run_daily_reminders
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

# Initialize scheduler
scheduler = AsyncIOScheduler()

async def scheduled_contract_jobs():
    """Wrapper for scheduled execution"""
    logger.info("Running scheduled contract jobs...")
    try:
        result = await run_all_contract_jobs()
        logger.info(f"Scheduled contract jobs completed: {result}")
    except Exception as e:
        logger.error(f"Scheduled contract jobs failed: {e}")

async def scheduled_email_reminders():
    """Wrapper for scheduled email reminders at 12:00 PM Paraguay"""
    logger.info("Running scheduled email reminders...")
    try:
        result = await run_daily_reminders()
        logger.info(f"Email reminders completed: {result}")
    except Exception as e:
        logger.error(f"Email reminders failed: {e}")

async def scheduled_database_backup():
    """Daily database backup to Cloudinary at 3:00 AM Paraguay"""
    logger.info("Running scheduled database backup...")
    try:
        from scripts.daily_backup import run_backup
        import asyncio
        # Run backup in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_backup)
        if result:
            logger.info("Scheduled database backup completed successfully")
        else:
            logger.error("Scheduled database backup failed")
    except Exception as e:
        logger.error(f"Scheduled database backup failed: {e}")
        # Capture in Sentry
        sentry_sdk.capture_exception(e)

@api_router.post("/admin/trigger-reminders")
async def admin_trigger_reminders(request: Request):
    """Manually trigger email reminders (admin only)"""
    await require_admin(request)
    
    try:
        result = await run_daily_reminders()
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Manual reminder trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Global backup status tracking
_backup_status = {
    "running": False,
    "last_run": None,
    "last_result": None,
    "last_error": None,
    "cloudinary_url": None
}

@api_router.post("/admin/backup/run")
async def admin_run_backup(request: Request):
    """Run 100% complete database backup (admin only)"""
    await require_admin(request)
    
    global _backup_status
    
    # Check if backup is already running
    if _backup_status["running"]:
        return {
            "success": False,
            "message": "Ya hay un backup en ejecución. Esperá a que termine.",
            "status": "running"
        }
    
    import threading
    import traceback
    
    def run_backup_task():
        """Background thread to run backup"""
        global _backup_status
        _backup_status["running"] = True
        _backup_status["last_run"] = datetime.now(timezone.utc).isoformat()
        _backup_status["last_error"] = None
        _backup_status["cloudinary_url"] = None
        _backup_status["last_result"] = None
        
        try:
            logger.info("🚀 Starting background backup task...")
            from scripts.daily_backup import run_backup
            
            logger.info("📦 Calling run_backup()...")
            result = run_backup()
            logger.info(f"📋 run_backup() returned: {result}")
            
            # Check if result indicates success
            if result and isinstance(result, dict):
                if result.get("success") == True:
                    _backup_status["last_result"] = "success"
                    _backup_status["cloudinary_url"] = result.get("cloudinary_url")
                    logger.info(f"✅ Backup completado exitosamente: {result.get('cloudinary_url')}")
                else:
                    _backup_status["last_result"] = "error"
                    _backup_status["last_error"] = result.get("error", "Error en el proceso de backup")
                    logger.error(f"❌ Backup failed: {result.get('error')}")
            elif result == True:
                # Legacy: run_backup returned True
                _backup_status["last_result"] = "success"
                logger.info(f"✅ Backup completado exitosamente (legacy)")
            else:
                _backup_status["last_result"] = "error"
                _backup_status["last_error"] = f"El backup retornó: {result}"
                logger.error(f"❌ Backup returned invalid result: {result}")
                
        except ImportError as e:
            _backup_status["last_result"] = "error"
            _backup_status["last_error"] = f"Error de importación: {str(e)}"
            logger.error(f"❌ Import error: {e}")
        except Exception as e:
            _backup_status["last_result"] = "error"
            error_msg = f"{type(e).__name__}: {str(e)}"
            _backup_status["last_error"] = error_msg
            logger.error(f"❌ Background backup exception: {error_msg}")
            logger.error(traceback.format_exc())
        finally:
            _backup_status["running"] = False
            logger.info(f"🏁 Backup task finished. Status: {_backup_status}")
    
    # Start backup in background thread
    backup_thread = threading.Thread(target=run_backup_task, daemon=True)
    backup_thread.start()
    
    # Get current DB stats for immediate response
    try:
        collections = await db.list_collection_names()
        total_docs = 0
        for coll in collections:
            total_docs += await db[coll].count_documents({})
        
        return {
            "success": True,
            "message": "Backup iniciado. Se ejecuta en segundo plano y se subirá a Cloudinary.",
            "status": "started",
            "collections": len(collections),
            "documents": total_docs
        }
    except Exception as e:
        return {
            "success": True,
            "message": "Backup iniciado en segundo plano.",
            "status": "started",
            "collections": 33,
            "documents": 7498
        }

@api_router.get("/admin/backup/status")
async def admin_backup_status(request: Request):
    """Check backup status (admin only)"""
    await require_admin(request)
    
    global _backup_status
    return {
        "running": _backup_status["running"],
        "last_run": _backup_status["last_run"],
        "last_result": _backup_status["last_result"],
        "last_error": _backup_status["last_error"],
        "cloudinary_url": _backup_status["cloudinary_url"]
    }

@api_router.get("/admin/backup/diagnose")
async def admin_backup_diagnose(request: Request):
    """Diagnose backup configuration and connectivity (admin only)"""
    await require_admin(request)
    
    import cloudinary
    import cloudinary.api
    
    results = {
        "mongodb": {"status": "unknown", "details": {}},
        "cloudinary": {"status": "unknown", "details": {}},
        "environment": {"status": "unknown", "details": {}}
    }
    
    # 1. Check MongoDB
    try:
        mongo_url = os.environ.get('MONGO_URL', 'NOT SET')
        db_name = os.environ.get('DB_NAME', 'NOT SET')
        
        results["mongodb"]["details"]["MONGO_URL"] = mongo_url[:50] + "..." if len(mongo_url) > 50 else mongo_url
        results["mongodb"]["details"]["DB_NAME"] = db_name
        
        # Count documents
        collections = await db.list_collection_names()
        total_docs = 0
        coll_counts = {}
        for coll in collections:
            count = await db[coll].count_documents({})
            total_docs += count
            coll_counts[coll] = count
        
        results["mongodb"]["details"]["collections"] = len(collections)
        results["mongodb"]["details"]["total_documents"] = total_docs
        results["mongodb"]["details"]["top_collections"] = dict(sorted(coll_counts.items(), key=lambda x: x[1], reverse=True)[:10])
        results["mongodb"]["status"] = "ok"
    except Exception as e:
        results["mongodb"]["status"] = "error"
        results["mongodb"]["details"]["error"] = str(e)
    
    # 2. Check Cloudinary
    try:
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
        api_key = os.environ.get('CLOUDINARY_API_KEY', '')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET', '')
        
        results["cloudinary"]["details"]["cloud_name"] = cloud_name if cloud_name else "NOT SET"
        results["cloudinary"]["details"]["api_key_set"] = bool(api_key)
        results["cloudinary"]["details"]["api_secret_set"] = bool(api_secret)
        
        if all([cloud_name, api_key, api_secret]):
            # Try to ping Cloudinary
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret
            )
            usage = cloudinary.api.usage()
            results["cloudinary"]["details"]["used_percent"] = usage.get("used_percent", "unknown")
            results["cloudinary"]["details"]["plan"] = usage.get("plan", "unknown")
            results["cloudinary"]["status"] = "ok"
        else:
            results["cloudinary"]["status"] = "error"
            results["cloudinary"]["details"]["error"] = "Missing credentials"
    except Exception as e:
        results["cloudinary"]["status"] = "error"
        results["cloudinary"]["details"]["error"] = str(e)
    
    # 3. Check environment
    results["environment"]["details"]["RESEND_API_KEY_set"] = bool(os.environ.get('RESEND_API_KEY'))
    results["environment"]["details"]["ADMIN_EMAIL"] = os.environ.get('ADMIN_EMAIL', 'NOT SET')
    results["environment"]["status"] = "ok"
    
    return results

@api_router.get("/admin/backup/download-direct-py")
async def admin_backup_download_direct_python(request: Request):
    """Create backup using Python and return for direct download (no Cloudinary) - admin only"""
    await require_admin(request)
    
    import tarfile
    import tempfile
    import shutil
    import hashlib
    from bson import json_util
    from fastapi.responses import FileResponse
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Collections to EXCLUDE from backup (GridFS - too large)
    EXCLUDED_COLLECTIONS = ['images.chunks', 'images.files', 'fs.chunks', 'fs.files']
    
    try:
        logger.info("=== PYTHON DIRECT BACKUP START ===")
        
        # Create temp directory
        temp_dir = Path(tempfile.mkdtemp())
        backup_name = f"backup_{db_name}_{timestamp}"
        backup_path = temp_dir / backup_name
        backup_path.mkdir(exist_ok=True)
        
        # Get all collections except excluded ones
        all_collections = await db.list_collection_names()
        collections = sorted([c for c in all_collections if c not in EXCLUDED_COLLECTIONS])
        
        logger.info(f"Total colecciones: {len(all_collections)}, A respaldar: {len(collections)}")
        
        # Initialize manifest
        manifest = {
            "backup_info": {
                "type": "PYTHON_BACKUP_NO_GRIDFS",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "database": db_name,
                "backup_name": backup_name,
                "excluded_collections": EXCLUDED_COLLECTIONS,
            },
            "statistics": {
                "total_collections": len(collections),
                "total_documents": 0,
                "total_size_bytes": 0,
            },
            "collections": {},
            "checksums": {},
        }
        
        total_docs = 0
        
        # Export each collection
        for coll_name in collections:
            try:
                collection = db[coll_name]
                documents = await collection.find({}).to_list(length=None)
                doc_count = len(documents)
                total_docs += doc_count
                
                # Serialize to JSON
                json_data = json.dumps(documents, default=json_util.default, ensure_ascii=False)
                
                # Calculate checksum and size
                checksum = hashlib.md5(json_data.encode('utf-8')).hexdigest()
                size_bytes = len(json_data.encode('utf-8'))
                
                # Write to file
                output_file = backup_path / f"{coll_name}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(json_data)
                
                # Update manifest
                manifest["collections"][coll_name] = {
                    "count": doc_count,
                    "size_bytes": size_bytes,
                    "checksum_md5": checksum,
                }
                manifest["checksums"][coll_name] = checksum
                manifest["statistics"]["total_size_bytes"] += size_bytes
                
                logger.info(f"✅ {coll_name}: {doc_count} docs ({size_bytes/1024:.1f} KB)")
                
            except Exception as e:
                logger.error(f"❌ ERROR en {coll_name}: {e}")
                manifest["collections"][coll_name] = {"count": 0, "error": str(e)}
        
        # Update manifest statistics
        manifest["statistics"]["total_documents"] = total_docs
        manifest["statistics"]["total_size_kb"] = round(manifest["statistics"]["total_size_bytes"] / 1024, 2)
        manifest["statistics"]["total_size_mb"] = round(manifest["statistics"]["total_size_bytes"] / (1024 * 1024), 2)
        
        # Write manifest
        manifest_file = backup_path / "_MANIFEST.json"
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        # Compress using tarfile
        archive_path = temp_dir / f"{backup_name}.tar.gz"
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(backup_path, arcname=backup_name)
        
        # Clean up uncompressed directory
        shutil.rmtree(backup_path)
        
        # Get file size
        file_size = archive_path.stat().st_size
        size_mb = round(file_size / (1024 * 1024), 2)
        
        logger.info(f"=== PYTHON DIRECT BACKUP SUCCESS: {size_mb} MB ===")
        
        # Return file for download
        return FileResponse(
            path=str(archive_path),
            filename=f"{backup_name}.tar.gz",
            media_type="application/gzip",
            headers={
                "Content-Disposition": f"attachment; filename={backup_name}.tar.gz",
                "X-Backup-Size": str(file_size),
                "X-Collections-Count": str(len(collections)),
                "X-Documents-Count": str(total_docs)
            }
        )
        
    except Exception as e:
        logger.error(f"Python direct backup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Error creando backup: {str(e)}")

@api_router.post("/admin/backup/create-download")
async def admin_backup_create_download(request: Request):
    """Create backup using mongodump and return for direct download - admin only"""
    await require_admin(request)
    
    import subprocess
    import tempfile
    from pathlib import Path
    from fastapi.responses import FileResponse
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Collect diagnostic info
    diagnostics = {
        "timestamp": timestamp,
        "db_name": db_name,
        "mongo_url_prefix": mongo_url[:40] + "..." if len(mongo_url) > 40 else mongo_url,
        "checks": {}
    }
    
    try:
        # CHECK 1: Verify mongodump is in PATH
        logger.info("=== BACKUP DIAGNOSTIC START ===")
        
        which_result = subprocess.run(['which', 'mongodump'], capture_output=True, text=True)
        diagnostics["checks"]["which_mongodump"] = {
            "command": "which mongodump",
            "returncode": which_result.returncode,
            "stdout": which_result.stdout.strip(),
            "stderr": which_result.stderr.strip()
        }
        logger.info(f"which mongodump: returncode={which_result.returncode}, path={which_result.stdout.strip()}")
        
        if which_result.returncode != 0:
            # Try alternative paths
            alt_paths = ['/usr/bin/mongodump', '/usr/local/bin/mongodump', '/opt/mongodb/bin/mongodump']
            for alt_path in alt_paths:
                if os.path.exists(alt_path):
                    diagnostics["checks"]["alt_path_found"] = alt_path
                    logger.info(f"Found mongodump at alternative path: {alt_path}")
                    break
            else:
                diagnostics["checks"]["mongodump_installed"] = False
                error_msg = f"mongodump no está instalado. Diagnóstico: {json.dumps(diagnostics, indent=2)}"
                logger.error(error_msg)
                
                # Save diagnostic to DB for later review
                try:
                    await db.backup_diagnostics.insert_one({
                        "type": "mongodump_not_found",
                        "diagnostics": diagnostics,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
                except:
                    pass
                
                raise HTTPException(status_code=500, detail=error_msg)
        
        mongodump_path = which_result.stdout.strip() or diagnostics["checks"].get("alt_path_found", "mongodump")
        
        # CHECK 2: Get mongodump version
        version_result = subprocess.run([mongodump_path, '--version'], capture_output=True, text=True)
        diagnostics["checks"]["mongodump_version"] = {
            "command": f"{mongodump_path} --version",
            "returncode": version_result.returncode,
            "stdout": version_result.stdout[:200] if version_result.stdout else "",
            "stderr": version_result.stderr[:200] if version_result.stderr else ""
        }
        logger.info(f"mongodump version: {version_result.stdout[:100] if version_result.stdout else 'N/A'}")
        
        # CHECK 3: Test MongoDB connection
        test_cmd = subprocess.run(
            ['mongosh', '--quiet', '--eval', 'db.runCommand({ping:1})', mongo_url],
            capture_output=True, text=True, timeout=30
        )
        diagnostics["checks"]["mongodb_connection"] = {
            "command": "mongosh ping test",
            "returncode": test_cmd.returncode,
            "success": test_cmd.returncode == 0
        }
        logger.info(f"MongoDB connection test: {'OK' if test_cmd.returncode == 0 else 'FAILED'}")
        
        # CREATE BACKUP
        backup_filename = f"mongodump_{db_name}_{timestamp}.gz"
        backup_path = Path(tempfile.gettempdir()) / backup_filename
        
        logger.info(f"Creating backup: {backup_path}")
        
        cmd = [
            mongodump_path,
            f'--uri={mongo_url}',
            f'--db={db_name}',
            f'--archive={backup_path}',
            '--gzip'
        ]
        
        diagnostics["checks"]["mongodump_command"] = f"{mongodump_path} --uri=*** --db={db_name} --archive={backup_path} --gzip"
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600
        )
        
        diagnostics["checks"]["mongodump_execution"] = {
            "returncode": result.returncode,
            "stdout": result.stdout[:500] if result.stdout else "",
            "stderr": result.stderr[:500] if result.stderr else ""
        }
        
        logger.info(f"mongodump returncode: {result.returncode}")
        if result.stdout:
            logger.info(f"mongodump stdout: {result.stdout[:300]}")
        if result.stderr:
            logger.info(f"mongodump stderr: {result.stderr[:300]}")
        
        if result.returncode != 0:
            error_detail = f"mongodump falló (code {result.returncode}). stderr: {result.stderr[:300]}"
            diagnostics["error"] = error_detail
            
            # Save diagnostic to DB
            try:
                await db.backup_diagnostics.insert_one({
                    "type": "mongodump_failed",
                    "diagnostics": diagnostics,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            except:
                pass
            
            raise HTTPException(status_code=500, detail=f"{error_detail}\n\nDiagnóstico completo: {json.dumps(diagnostics, indent=2)}")
        
        # CHECK 4: Verify output file
        if not backup_path.exists():
            diagnostics["error"] = "Output file not created"
            raise HTTPException(status_code=500, detail=f"mongodump no creó archivo. Diagnóstico: {json.dumps(diagnostics, indent=2)}")
        
        file_size = backup_path.stat().st_size
        diagnostics["result"] = {
            "file_path": str(backup_path),
            "file_size_bytes": file_size,
            "file_size_mb": round(file_size / (1024*1024), 2)
        }
        
        logger.info(f"=== BACKUP SUCCESS: {file_size / (1024*1024):.2f} MB ===")
        
        # Save success diagnostic
        try:
            await db.backup_diagnostics.insert_one({
                "type": "backup_success",
                "diagnostics": diagnostics,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        except:
            pass
        
        return FileResponse(
            path=str(backup_path),
            filename=backup_filename,
            media_type="application/gzip",
            headers={
                "Content-Disposition": f"attachment; filename={backup_filename}",
                "X-Backup-Size": str(file_size)
            }
        )
        
    except subprocess.TimeoutExpired as e:
        diagnostics["error"] = f"Timeout: {str(e)}"
        logger.error(f"mongodump timeout: {e}")
        try:
            await db.backup_diagnostics.insert_one({
                "type": "timeout",
                "diagnostics": diagnostics,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Timeout después de 10 minutos. Diagnóstico: {json.dumps(diagnostics, indent=2)}")
    
    except HTTPException:
        raise
    
    except Exception as e:
        diagnostics["error"] = f"{type(e).__name__}: {str(e)}"
        logger.error(f"Backup exception: {type(e).__name__}: {e}")
        import traceback
        diagnostics["traceback"] = traceback.format_exc()
        
        try:
            await db.backup_diagnostics.insert_one({
                "type": "exception",
                "diagnostics": diagnostics,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Error: {type(e).__name__}: {str(e)}\n\nDiagnóstico: {json.dumps(diagnostics, indent=2)}")

@api_router.get("/admin/backup/diagnostics")
async def get_backup_diagnostics(request: Request):
    """Get recent backup diagnostics - admin only"""
    await require_admin(request)
    
    try:
        diagnostics = await db.backup_diagnostics.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(None)
        return {"diagnostics": diagnostics}
    except Exception as e:
        return {"error": str(e), "diagnostics": []}

@api_router.post("/admin/backup/reset")
async def admin_backup_reset(request: Request):
    """Reset backup status if stuck (admin only)"""
    await require_admin(request)
    
    global _backup_status
    _backup_status = {
        "running": False,
        "last_run": _backup_status.get("last_run"),
        "last_result": "reset",
        "last_error": "Estado reseteado manualmente",
        "cloudinary_url": None
    }
    logger.warning("⚠️ Backup status manually reset by admin")
    return {"success": True, "message": "Estado de backup reseteado"}

@api_router.get("/admin/debug/collections-check")
async def admin_debug_collections_check(request: Request):
    """Debug endpoint to check ALL critical collections content (admin only)
    
    Returns content of collections that might be empty or have issues,
    useful for verifying backup integrity.
    """
    await require_admin(request)
    
    # Collections to inspect with full content
    collections_to_inspect = [
        # Original ones
        "ugc_ratings",
        "ugc_notifications",
        # Potentially empty collections
        "page_content",
        "notifications",
        "image_assignment_logs",
        "ugc_audit_logs",
        "ugc_reviews",
        # Legacy/special collections
        "payment_transactions",
        "migration_backups",
    ]
    
    result = {
        "inspected_collections": {},
        "all_collections": {},
        "summary": {
            "total_collections": 0,
            "empty_collections": [],
            "collections_with_data": []
        }
    }
    
    # Inspect each collection with full content (up to 50 docs)
    for coll_name in collections_to_inspect:
        try:
            docs = await db[coll_name].find({}, {"_id": 0}).to_list(50)
            count = await db[coll_name].count_documents({})
            result["inspected_collections"][coll_name] = {
                "count": count,
                "documents": docs,
                "status": "with_data" if count > 0 else "empty"
            }
        except Exception as e:
            result["inspected_collections"][coll_name] = {
                "count": 0,
                "documents": [],
                "error": str(e),
                "status": "error"
            }
    
    # Get count of ALL collections
    try:
        collections = await db.list_collection_names()
        result["summary"]["total_collections"] = len(collections)
        
        for coll_name in sorted(collections):
            count = await db[coll_name].count_documents({})
            result["all_collections"][coll_name] = count
            
            if count == 0:
                result["summary"]["empty_collections"].append(coll_name)
            else:
                result["summary"]["collections_with_data"].append(coll_name)
    except Exception as e:
        result["all_collections"]["error"] = str(e)
    
    return result

# ==================== EXCEL EXPORT ENDPOINTS ====================

@api_router.get("/admin/export/collections")
async def get_collections_list(request: Request):
    """Get list of all collections for export dropdown (admin only)"""
    await require_admin(request)
    
    try:
        collections = await db.list_collection_names()
        # Filter out GridFS chunks and sort alphabetically
        filtered = sorted([c for c in collections if not c.endswith('.chunks')])
        return {"collections": filtered}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/export/collections/{collection_name}/fields")
async def get_collection_fields(collection_name: str, request: Request):
    """Get list of all fields in a collection (admin only)"""
    await require_admin(request)
    
    try:
        # Get all documents to find all possible fields
        all_docs = await db[collection_name].find({}, {"_id": 0}).to_list(None)
        
        all_fields = set()
        for doc in all_docs:
            all_fields.update(doc.keys())
        
        return {"fields": sorted(list(all_fields))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/export/download")
async def export_collection_to_excel(request: Request):
    """Export collection data to Excel file (admin only)"""
    await require_admin(request)
    
    import io
    import xlsxwriter
    from fastapi.responses import StreamingResponse
    
    try:
        body = await request.json()
        collection_name = body.get("collection")
        fields = body.get("fields", [])
        
        if not collection_name:
            raise HTTPException(status_code=400, detail="Collection name required")
        
        # Build projection
        projection = {"_id": 0}
        if fields:
            for field in fields:
                projection[field] = 1
        
        # Get data
        docs = await db[collection_name].find({}, projection).to_list(None)
        
        if not docs:
            raise HTTPException(status_code=404, detail="No data found in collection")
        
        # Get all fields from documents if no specific fields requested
        if not fields:
            fields = set()
            for doc in docs:
                fields.update(doc.keys())
            fields = sorted(list(fields))
        
        # Create Excel file in memory
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet(collection_name[:31])  # Sheet name max 31 chars
        
        # Formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4CAF50',
            'font_color': 'white',
            'border': 1
        })
        cell_format = workbook.add_format({'border': 1})
        date_format = workbook.add_format({'border': 1, 'num_format': 'yyyy-mm-dd hh:mm:ss'})
        
        # Write headers
        for col, field in enumerate(fields):
            worksheet.write(0, col, field, header_format)
        
        # Write data
        for row, doc in enumerate(docs, start=1):
            for col, field in enumerate(fields):
                value = doc.get(field, "")
                
                # Handle different types
                if isinstance(value, dict):
                    value = str(value)
                elif isinstance(value, list):
                    value = ", ".join([str(v) for v in value])
                elif value is None:
                    value = ""
                
                worksheet.write(row, col, value, cell_format)
        
        # Auto-adjust column widths
        for col, field in enumerate(fields):
            max_len = max(len(str(field)), 
                         max((len(str(doc.get(field, ""))) for doc in docs), default=10))
            worksheet.set_column(col, col, min(max_len + 2, 50))
        
        workbook.close()
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{collection_name}_{timestamp}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Excel export error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CAMPAIGN APPLICATIONS EXPORT ====================

@api_router.get("/ugc/campaigns/{campaign_id}/applications/export")
async def export_campaign_applications_excel(campaign_id: str, request: Request):
    """Export campaign applications to Excel with full details"""
    # Verify user has access (brand owner or admin)
    user = await require_auth(request)
    
    import io
    import xlsxwriter
    from fastapi.responses import StreamingResponse
    
    try:
        # Get campaign
        campaign = await db.ugc_campaigns.find_one({"id": campaign_id}, {"_id": 0})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaña no encontrada")
        
        # Check if user is admin or brand owner
        is_admin = user.get("role") in ["admin", "superadmin"]
        if not is_admin:
            brand = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
            if not brand or brand.get("id") != campaign.get("brand_id"):
                raise HTTPException(status_code=403, detail="No tienes acceso a esta campaña")
        
        # Get all applications for this campaign
        applications = await db.ugc_applications.find(
            {"campaign_id": campaign_id},
            {"_id": 0}
        ).to_list(None)
        
        if not applications:
            raise HTTPException(status_code=404, detail="No hay aplicaciones para exportar")
        
        # Get all creator IDs and deliverable info
        creator_ids = [app.get("creator_id") for app in applications if app.get("creator_id")]
        
        # Get creators info (for phone and social networks)
        creators_dict = {}
        if creator_ids:
            creators = await db.ugc_creators.find(
                {"id": {"$in": creator_ids}},
                {"_id": 0, "id": 1, "phone": 1, "phone_full": 1, "phone_country_code": 1, "social_networks": 1, "social_accounts": 1}
            ).to_list(None)
            creators_dict = {c["id"]: c for c in creators}
        
        # Get deliverables for each application
        app_ids = [app.get("id") or app.get("application_id") for app in applications]
        deliverables = await db.ugc_deliverables.find(
            {"application_id": {"$in": app_ids}},
            {"_id": 0, "application_id": 1, "status": 1, "post_url": 1, "instagram_url": 1, "tiktok_url": 1, "metrics_submitted_at": 1}
        ).to_list(None)
        deliverables_dict = {}
        for d in deliverables:
            app_id = d.get("application_id")
            if app_id:
                if app_id not in deliverables_dict:
                    deliverables_dict[app_id] = []
                deliverables_dict[app_id].append(d)
        
        # Create Excel file in memory
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet("Aplicaciones")
        
        # Formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#d4a968',
            'font_color': 'black',
            'border': 1,
            'text_wrap': True,
            'valign': 'vcenter'
        })
        cell_format = workbook.add_format({'border': 1, 'valign': 'vcenter'})
        date_format = workbook.add_format({'border': 1, 'valign': 'vcenter', 'num_format': 'dd/mm/yyyy'})
        
        # Define columns
        columns = [
            ("Nombre", 25),
            ("Username", 18),
            ("Estado Aplicación", 18),
            ("Estado Entrega", 20),
            ("Entregó URL", 12),
            ("Entregó Métricas", 15),
            ("Teléfono", 18),
            ("Fecha Aplicación", 15),
            ("Fecha Confirmación", 16),
            ("Fecha Límite URL", 15),
            ("Fecha Límite Métricas", 18),
            ("Seguidores IG", 14),
            ("Seguidores TikTok", 16),
            ("Nivel", 10),
            ("Rating", 8),
        ]
        
        # Write headers
        for col, (name, width) in enumerate(columns):
            worksheet.write(0, col, name, header_format)
            worksheet.set_column(col, col, width)
        
        # Helper function to get phone
        def get_phone(creator):
            if not creator:
                return ""
            phone = creator.get("phone_full") or creator.get("phone") or ""
            code = creator.get("phone_country_code", "")
            if phone and code and not phone.startswith("+"):
                return f"+{code}{phone}"
            return phone
        
        # Helper function to get followers from social networks
        def get_followers(creator, platform):
            if not creator:
                return 0
            # Try social_networks array first
            for sn in creator.get("social_networks", []):
                if sn.get("platform", "").lower() == platform.lower():
                    return sn.get("followers", 0)
            # Try social_accounts object (legacy)
            sa = creator.get("social_accounts", {}).get(platform, {})
            return sa.get("followers", 0)
        
        # Helper to format date
        def format_date_excel(date_str):
            if not date_str:
                return ""
            try:
                from datetime import datetime
                if isinstance(date_str, str):
                    # Try parsing ISO format
                    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    return dt.strftime("%d/%m/%Y")
                return str(date_str)
            except:
                return str(date_str) if date_str else ""
        
        # Write data rows
        for row, app in enumerate(applications, start=1):
            creator_id = app.get("creator_id")
            creator = creators_dict.get(creator_id, {})
            app_id = app.get("id") or app.get("application_id")
            app_deliverables = deliverables_dict.get(app_id, [])
            
            # Determine delivery status
            has_url = any(d.get("post_url") or d.get("instagram_url") or d.get("tiktok_url") for d in app_deliverables)
            has_metrics = any(d.get("metrics_submitted_at") for d in app_deliverables)
            
            # Get deliverable status (combine if multiple)
            delivery_statuses = [d.get("status", "") for d in app_deliverables]
            delivery_status = ", ".join(set(delivery_statuses)) if delivery_statuses else "Sin entrega"
            
            # Status translation
            status_map = {
                "applied": "Pendiente",
                "shortlisted": "Preseleccionado",
                "confirmed": "Confirmado",
                "rejected": "Rechazado",
                "cancelled": "Cancelado"
            }
            delivery_status_map = {
                "awaiting_publish": "Esperando URL",
                "published": "URL Subida",
                "submitted": "Enviado",
                "under_review": "En Revisión",
                "approved": "Aprobado",
                "metrics_pending": "Métricas Pendientes",
                "metrics_submitted": "Métricas Enviadas",
                "completed": "Completado",
                "cancelled": "Cancelado"
            }
            
            # Translate delivery statuses
            translated_delivery = ", ".join([
                delivery_status_map.get(s, s) for s in delivery_statuses
            ]) if delivery_statuses else "Sin entrega"
            
            row_data = [
                app.get("creator_name", ""),
                app.get("creator_username", ""),
                status_map.get(app.get("status", ""), app.get("status", "")),
                translated_delivery,
                "Sí" if has_url else "No",
                "Sí" if has_metrics else "No",
                get_phone(creator),
                format_date_excel(app.get("applied_at")),
                format_date_excel(app.get("confirmed_at")),
                format_date_excel(app.get("url_deadline")),
                format_date_excel(app.get("metrics_deadline")),
                get_followers(creator, "instagram"),
                get_followers(creator, "tiktok"),
                app.get("creator_level", "rookie"),
                app.get("creator_rating", 0),
            ]
            
            for col, value in enumerate(row_data):
                worksheet.write(row, col, value, cell_format)
        
        # Add autofilter
        worksheet.autofilter(0, 0, len(applications), len(columns) - 1)
        
        # Freeze first row
        worksheet.freeze_panes(1, 0)
        
        workbook.close()
        output.seek(0)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = campaign.get("name", "campaign").replace(" ", "_")[:30]
        filename = f"aplicaciones_{safe_name}_{timestamp}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Campaign applications export error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== BACKUP VERIFICATION ENDPOINTS ====================

@api_router.get("/admin/backup/verify-current")
async def verify_current_db_state(request: Request):
    """Get current DB state for backup verification (admin only)"""
    await require_admin(request)
    
    try:
        collections = await db.list_collection_names()
        stats = {}
        total_docs = 0
        
        for coll_name in sorted(collections):
            count = await db[coll_name].count_documents({})
            stats[coll_name] = count
            total_docs += count
        
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": db.name,
            "total_collections": len(collections),
            "total_documents": total_docs,
            "collections": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/backup/verify-file")
async def verify_backup_file(request: Request):
    """
    Verify an uploaded backup file against current DB
    Expects JSON with backup manifest or collection counts
    """
    await require_admin(request)
    
    try:
        body = await request.json()
        backup_counts = body.get("collections", {})
        
        if not backup_counts:
            raise HTTPException(status_code=400, detail="No collection counts provided")
        
        # Get current DB state
        collections = await db.list_collection_names()
        current_stats = {}
        for coll_name in collections:
            current_stats[coll_name] = await db[coll_name].count_documents({})
        
        # Compare
        all_colls = set(backup_counts.keys()) | set(current_stats.keys())
        
        issues = []
        details = {}
        
        for coll_name in sorted(all_colls):
            backup_count = backup_counts.get(coll_name, 0)
            db_count = current_stats.get(coll_name, 0)
            
            status = "OK"
            if coll_name not in backup_counts:
                status = "MISSING_IN_BACKUP"
                if db_count > 0:
                    issues.append({
                        "type": "MISSING_COLLECTION",
                        "collection": coll_name,
                        "db_count": db_count,
                        "severity": "HIGH"
                    })
            elif coll_name not in current_stats:
                status = "EXTRA_IN_BACKUP"
            elif backup_count != db_count:
                status = "COUNT_MISMATCH"
                diff = db_count - backup_count
                issues.append({
                    "type": "RECORD_MISMATCH",
                    "collection": coll_name,
                    "db_count": db_count,
                    "backup_count": backup_count,
                    "difference": diff,
                    "severity": "MEDIUM" if diff > 0 else "INFO"
                })
            
            details[coll_name] = {
                "status": status,
                "db_count": db_count,
                "backup_count": backup_count
            }
        
        return {
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "is_complete": len(issues) == 0,
            "summary": {
                "collections_in_db": len(current_stats),
                "collections_in_backup": len(backup_counts),
                "missing_in_backup": [c for c in current_stats if c not in backup_counts],
                "issues_count": len(issues)
            },
            "issues": issues,
            "details": details
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backup verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/backup/create-full")
async def create_full_backup_endpoint(request: Request):
    """Create a FULL backup of ALL collections (admin only)"""
    await require_admin(request)
    
    import sys
    sys.path.insert(0, '/app/backend/scripts')
    from backup_manager import BackupManager
    
    try:
        manager = BackupManager()
        result = manager.create_full_backup(output_dir="/tmp")
        
        if result['success']:
            # Return the file for download
            from fastapi.responses import FileResponse
            return FileResponse(
                path=result['archive_path'],
                filename=os.path.basename(result['archive_path']),
                media_type='application/gzip'
            )
        else:
            raise HTTPException(status_code=500, detail="Backup creation failed")
    except Exception as e:
        logger.error(f"Full backup error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app (moved here to include backup endpoint)
app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting e-commerce product sync...")
    await start_sync_on_startup()
    
    # Run contract jobs immediately on startup
    logger.info("Running UGC contract jobs...")
    try:
        result = await run_all_contract_jobs()
        logger.info(f"Contract jobs completed: {result}")
    except Exception as e:
        logger.error(f"Contract jobs failed: {e}")
    
    # Schedule daily contract jobs at 6:00 AM (Paraguay time, UTC-3)
    scheduler.add_job(
        scheduled_contract_jobs,
        CronTrigger(hour=9, minute=0),  # 9:00 UTC = 6:00 AM Paraguay
        id="contract_jobs",
        replace_existing=True
    )
    
    # Schedule daily email reminders at 12:00 PM (Paraguay time, UTC-3 = 15:00 UTC)
    scheduler.add_job(
        scheduled_email_reminders,
        CronTrigger(hour=15, minute=0),  # 15:00 UTC = 12:00 PM Paraguay
        id="email_reminders",
        replace_existing=True
    )
    
    # Schedule daily database backup at 3:00 AM (Paraguay time, UTC-3 = 6:00 UTC)
    scheduler.add_job(
        scheduled_database_backup,
        CronTrigger(hour=6, minute=0),  # 6:00 UTC = 3:00 AM Paraguay
        id="database_backup",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started:")
    logger.info("  - Contract jobs: daily at 6:00 AM Paraguay time")
    logger.info("  - Email reminders: daily at 12:00 PM Paraguay time")
    logger.info("  - Database backup: daily at 3:00 AM Paraguay time")

@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client.close()
