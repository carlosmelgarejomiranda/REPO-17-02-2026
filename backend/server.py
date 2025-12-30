from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
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
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')
NOTIFICATION_WHATSAPP_STUDIO = os.environ.get('NOTIFICATION_WHATSAPP_STUDIO', '+595973666000')
NOTIFICATION_WHATSAPP_UGC = os.environ.get('NOTIFICATION_WHATSAPP_UGC', '+595976691520')

# Initialize Twilio client
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret_key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 168  # 7 days

# Admin email
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'avenuepy@gmail.com')

# Create the main app
app = FastAPI()

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
    role: str = "user"  # user or admin
    created_at: datetime

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

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    """Create a JWT token"""
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
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
    """Require admin authentication"""
    user = await require_auth(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

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
    # WhatsApp notification
    whatsapp_message = f"""🎬 *NUEVA RESERVA - Avenue Studio*

👤 *Cliente:* {reservation['name']}
📧 *Email:* {reservation['email']}
📱 *Teléfono:* {reservation.get('phone', 'N/A')}
🏢 *Empresa:* {reservation.get('company', 'N/A')}

📅 *Fecha:* {reservation['date']}
⏰ *Horario:* {reservation['start_time']} - {reservation['end_time']}
⏱️ *Duración:* {reservation['duration_hours']} horas
💰 *Precio:* {reservation['price']:,} Gs

ID: {reservation['reservation_id']}"""

    await send_whatsapp_notification(NOTIFICATION_WHATSAPP_STUDIO, whatsapp_message)
    
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
    nombre_completo = f"{application.get('nombre', '')} {application.get('apellido', '')}"
    
    # WhatsApp notification
    whatsapp_message = f"""📸 *NUEVA APLICACIÓN UGC*

👤 *Nombre:* {nombre_completo}
📧 *Email:* {application['email']}
📱 *WhatsApp:* {application.get('whatsapp', 'N/A')}
📍 *Ciudad:* {application.get('ciudad', 'N/A')}

📱 *Instagram:* {application.get('instagram_url', 'N/A')} ({application.get('instagram_seguidores', '0')} seg.)
🎵 *TikTok:* {application.get('tiktok_url', 'N/A')} ({application.get('tiktok_seguidores', '0')} seg.)

📊 *Estado:* {application.get('status', 'pendiente')}
🎯 *Campaña:* {application.get('campaign_id', 'N/A')}

🔗 *Videos:*
• {application.get('video_link_1', 'N/A')}
• {application.get('video_link_2', 'N/A')}"""

    await send_whatsapp_notification(NOTIFICATION_WHATSAPP_UGC, whatsapp_message)
    
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

async def notify_new_order(order: dict):
    """Send notifications for new e-commerce order"""
    items_text = "\n".join([f"• {item.get('name', 'Producto')} x{item.get('quantity', 1)} - {item.get('price', 0):,.0f} Gs" for item in order.get('items', [])])
    
    delivery_info = ""
    if order.get('delivery_type') == 'delivery' and order.get('delivery_address'):
        addr = order['delivery_address']
        delivery_info = f"""
📍 *Dirección de entrega:*
{addr.get('address', 'N/A')}
{addr.get('reference', '')}
🚚 *Costo de envío:* {order.get('delivery_cost', 0):,.0f} Gs"""
    else:
        delivery_info = "🏪 *Retiro en tienda*"
    
    # WhatsApp notification
    whatsapp_message = f"""🛒 *NUEVO PEDIDO - Avenue Online*

📦 *Pedido:* {order.get('order_id', 'N/A')}
💳 *Estado:* {order.get('payment_status', 'pending').upper()}

👤 *Cliente:* {order.get('customer_name', 'N/A')}
📧 *Email:* {order.get('customer_email', 'N/A')}
📱 *Teléfono:* {order.get('customer_phone', 'N/A')}

🛍️ *Productos:*
{items_text}

{delivery_info}

💰 *Subtotal:* {order.get('subtotal', 0):,.0f} Gs
💰 *TOTAL:* {order.get('total', 0):,.0f} Gs

📝 *Notas:* {order.get('notes', 'Sin notas')}"""

    await send_whatsapp_notification(NOTIFICATION_WHATSAPP_STUDIO, whatsapp_message)
    
    # Email notification
    items_html = "".join([f"<tr><td style='padding: 8px; border-bottom: 1px solid #333;'>{item.get('name', 'Producto')}</td><td style='padding: 8px; border-bottom: 1px solid #333;'>{item.get('quantity', 1)}</td><td style='padding: 8px; border-bottom: 1px solid #333; color: #d4a968;'>{item.get('price', 0):,.0f} Gs</td></tr>" for item in order.get('items', [])])
    
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
    
    # Check if this is the admin email
    role = "admin" if user_data.email == ADMIN_EMAIL else "user"
    
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
        "token": token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = create_jwt_token(user["user_id"], user["email"], user.get("role", "user"))
    
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
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "user"),
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
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "admin" if email == ADMIN_EMAIL else "user"
        
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
    """Create a new reservation (guest or authenticated)"""
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
    is_admin = user and user.get("role") == "admin"
    
    # Validate date - must be at least 1 day in advance (except for admin)
    reservation_date = datetime.strptime(reservation_data.date, "%Y-%m-%d").date()
    today = datetime.now(timezone.utc).date()
    
    if not is_admin:
        if reservation_date <= today:
            raise HTTPException(
                status_code=400, 
                detail="Las reservas deben hacerse con al menos 1 día de anticipación. Para reservas del mismo día, contacta por WhatsApp: +595 976 691 520"
            )
    
    # Check availability
    availability = await get_availability(reservation_data.date)
    for slot in availability["slots"]:
        if slot["hour"] >= start_hour and slot["hour"] < end_hour:
            if not slot["available"]:
                raise HTTPException(status_code=400, detail=f"Time slot {slot['time']} is not available")
    
    # Create reservation
    reservation_id = f"res_{uuid.uuid4().hex[:12]}"
    end_time = calculate_end_time(reservation_data.start_time, reservation_data.duration_hours)
    price = PRICING[reservation_data.duration_hours]
    
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
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reservations.insert_one(reservation_doc)
    
    # Send confirmation email
    await send_confirmation_email(reservation_doc)
    
    # Send admin notification (WhatsApp + Email)
    await notify_new_reservation(reservation_doc)
    
    # Remove MongoDB _id before returning
    reservation_doc.pop("_id", None)
    
    return reservation_doc

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
    """Get all users (admin only)"""
    await require_admin(request)
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

# ==================== BASIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Avenue Studio API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
