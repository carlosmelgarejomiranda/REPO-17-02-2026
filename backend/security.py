"""
Security Hardening Module for Avenue
- MFA (TOTP) for Admin/Owner
- Rate Limiting
- Audit Logging
- Security Headers
"""

import pyotp
import qrcode
import io
import base64
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import Request, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class MFASetupResponse(BaseModel):
    secret: str
    qr_code: str  # Base64 encoded QR code image
    recovery_codes: List[str]

class MFAVerifyRequest(BaseModel):
    code: str

class MFARecoveryRequest(BaseModel):
    recovery_code: str

# ==================== MFA (TOTP) ====================

def generate_totp_secret() -> str:
    """Generate a new TOTP secret"""
    return pyotp.random_base32()

def generate_recovery_codes(count: int = 10) -> List[str]:
    """Generate recovery codes for MFA backup"""
    return [secrets.token_hex(4).upper() for _ in range(count)]

def get_totp_uri(secret: str, email: str, issuer: str = "Avenue") -> str:
    """Generate TOTP provisioning URI for QR code"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)

def generate_qr_code_base64(uri: str) -> str:
    """Generate QR code as base64 encoded image"""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def verify_totp(secret: str, code: str) -> bool:
    """Verify a TOTP code"""
    totp = pyotp.TOTP(secret)
    # Allow 1 window before and after for clock drift
    return totp.verify(code, valid_window=1)

def verify_recovery_code(code: str, recovery_codes: List[str]) -> tuple[bool, List[str]]:
    """
    Verify a recovery code and return updated list
    Returns (is_valid, updated_codes)
    """
    code_upper = code.upper().replace("-", "").replace(" ", "")
    for i, rc in enumerate(recovery_codes):
        if rc == code_upper:
            # Remove used code
            updated = recovery_codes[:i] + recovery_codes[i+1:]
            return True, updated
    return False, recovery_codes

def is_admin_role(role: str) -> bool:
    """Check if role requires MFA"""
    return role in ["admin", "superadmin"]

# ==================== AUDIT LOGGING ====================

class AuditAction:
    # Authentication
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"
    MFA_VERIFIED = "mfa_verified"
    MFA_FAILED = "mfa_failed"
    PASSWORD_CHANGED = "password_changed"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    
    # User Management
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_ROLE_CHANGED = "user_role_changed"
    USER_DELETED = "user_deleted"
    
    # Orders/Commerce
    ORDER_STATUS_CHANGED = "order_status_changed"
    ORDER_CANCELLED = "order_cancelled"
    REFUND_PROCESSED = "refund_processed"
    PRICE_CHANGED = "price_changed"
    STOCK_CHANGED = "stock_changed"
    COUPON_CREATED = "coupon_created"
    COUPON_DELETED = "coupon_deleted"
    
    # Reservations
    RESERVATION_STATUS_CHANGED = "reservation_status_changed"
    RESERVATION_CANCELLED = "reservation_cancelled"
    
    # Settings/Config
    SETTINGS_CHANGED = "settings_changed"
    INTEGRATION_CHANGED = "integration_changed"
    
    # Data Export
    DATA_EXPORTED = "data_exported"

async def create_audit_log(
    db,
    action: str,
    user_id: Optional[str],
    user_email: Optional[str],
    user_role: Optional[str],
    ip_address: str,
    user_agent: str,
    details: dict = None,
    target_type: str = None,
    target_id: str = None
):
    """Create an audit log entry"""
    log_entry = {
        "id": secrets.token_hex(12),
        "action": action,
        "user_id": user_id,
        "user_email": user_email,
        "user_role": user_role,
        "ip_address": ip_address,
        "user_agent": user_agent[:500] if user_agent else None,  # Limit length
        "target_type": target_type,
        "target_id": target_id,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        await db.audit_logs.insert_one(log_entry)
        logger.info(f"Audit: {action} by {user_email} from {ip_address}")
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")

def get_client_ip(request: Request) -> str:
    """Extract client IP from request"""
    # Check for forwarded headers (behind proxy/load balancer)
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"

def get_user_agent(request: Request) -> str:
    """Extract user agent from request"""
    return request.headers.get("user-agent", "unknown")

# ==================== RATE LIMITING ====================

# In-memory store for rate limiting (for simple cases)
# In production, consider using Redis
_rate_limit_store = {}

class RateLimitExceeded(HTTPException):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            status_code=429, 
            detail=f"Too many requests. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )

def check_rate_limit(
    key: str, 
    max_requests: int, 
    window_seconds: int,
    block_seconds: int = None
) -> tuple[bool, int]:
    """
    Check if rate limit is exceeded
    Returns (is_allowed, remaining_requests)
    """
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(seconds=window_seconds)
    
    if key not in _rate_limit_store:
        _rate_limit_store[key] = {"requests": [], "blocked_until": None}
    
    store = _rate_limit_store[key]
    
    # Check if blocked
    if store["blocked_until"]:
        if now < store["blocked_until"]:
            return False, 0
        else:
            store["blocked_until"] = None
            store["requests"] = []
    
    # Clean old requests
    store["requests"] = [
        req_time for req_time in store["requests"] 
        if req_time > window_start
    ]
    
    # Check limit
    if len(store["requests"]) >= max_requests:
        if block_seconds:
            store["blocked_until"] = now + timedelta(seconds=block_seconds)
        return False, 0
    
    # Add new request
    store["requests"].append(now)
    remaining = max_requests - len(store["requests"])
    
    return True, remaining

def get_rate_limit_key(request: Request, prefix: str) -> str:
    """Generate rate limit key based on IP"""
    ip = get_client_ip(request)
    return f"{prefix}:{ip}"

# ==================== LOGIN ATTEMPT TRACKING ====================

_login_attempts = {}

class LoginAttemptResult:
    SUCCESS = "success"
    FAILED = "failed"
    BLOCKED = "blocked"

def track_login_attempt(email: str, success: bool) -> tuple[str, int]:
    """
    Track login attempt and return status
    Returns (result, lockout_seconds)
    """
    now = datetime.now(timezone.utc)
    key = email.lower()
    
    if key not in _login_attempts:
        _login_attempts[key] = {
            "failed_count": 0,
            "last_attempt": None,
            "locked_until": None
        }
    
    attempt = _login_attempts[key]
    
    # Check if locked
    if attempt["locked_until"]:
        if now < attempt["locked_until"]:
            remaining = int((attempt["locked_until"] - now).total_seconds())
            return LoginAttemptResult.BLOCKED, remaining
        else:
            # Reset after lockout
            attempt["failed_count"] = 0
            attempt["locked_until"] = None
    
    if success:
        # Reset on success
        attempt["failed_count"] = 0
        attempt["locked_until"] = None
        return LoginAttemptResult.SUCCESS, 0
    
    # Failed attempt
    attempt["failed_count"] += 1
    attempt["last_attempt"] = now
    
    # Progressive lockout
    if attempt["failed_count"] >= 10:
        # 30 minute lockout after 10 attempts
        attempt["locked_until"] = now + timedelta(minutes=30)
        return LoginAttemptResult.BLOCKED, 1800
    elif attempt["failed_count"] >= 5:
        # 5 minute cooldown after 5 attempts
        attempt["locked_until"] = now + timedelta(minutes=5)
        return LoginAttemptResult.BLOCKED, 300
    
    return LoginAttemptResult.FAILED, 0

def is_login_blocked(email: str) -> tuple[bool, int]:
    """Check if login is blocked for email"""
    key = email.lower()
    
    if key not in _login_attempts:
        return False, 0
    
    attempt = _login_attempts[key]
    
    if attempt["locked_until"]:
        now = datetime.now(timezone.utc)
        if now < attempt["locked_until"]:
            remaining = int((attempt["locked_until"] - now).total_seconds())
            return True, remaining
    
    return False, 0

# ==================== PASSWORD VALIDATION ====================

# Common passwords list (subset for demo - in production use a larger list)
COMMON_PASSWORDS = {
    "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
    "letmein", "trustno1", "dragon", "baseball", "iloveyou", "master", "sunshine",
    "ashley", "bailey", "passw0rd", "shadow", "123123", "654321", "superman",
    "qazwsx", "michael", "football", "password1", "password123", "welcome",
    "welcome1", "admin", "admin123", "root", "toor", "pass", "test", "guest",
    "master", "changeme", "123456789", "12345", "1234", "password!", "avenue",
    "avenue123", "studio", "studio123"
}

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength
    Returns (is_valid, error_message)
    """
    if len(password) < 12:
        return False, "La contraseña debe tener al menos 12 caracteres"
    
    if password.lower() in COMMON_PASSWORDS:
        return False, "Esta contraseña es muy común. Por favor elige otra"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    if not (has_upper and has_lower and has_digit):
        return False, "La contraseña debe incluir mayúsculas, minúsculas y números"
    
    return True, ""

# ==================== SECURITY HEADERS MIDDLEWARE ====================

def get_security_headers() -> dict:
    """Get security headers to add to responses"""
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache"
    }

# ==================== SESSION MANAGEMENT ====================

# Admin session settings
ADMIN_SESSION_HOURS = 12  # Max session duration for admins
ADMIN_IDLE_TIMEOUT_MINUTES = 30  # Idle timeout for admin panel

def should_require_reauth(last_auth_time: datetime, is_admin: bool) -> bool:
    """Check if user should re-authenticate"""
    if not is_admin:
        return False
    
    now = datetime.now(timezone.utc)
    idle_threshold = timedelta(minutes=ADMIN_IDLE_TIMEOUT_MINUTES)
    
    return (now - last_auth_time) > idle_threshold
