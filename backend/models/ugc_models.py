"""
UGC Platform - Database Models
All Pydantic models for the UGC Creator/Brand platform
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# ==================== ENUMS ====================

class UserRole(str, Enum):
    USER = "user"
    CREATOR = "creator"
    BRAND = "brand"
    STAFF = "staff"
    DESIGNER = "designer"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    LIVE = "live"
    CLOSED = "closed"  # Applications closed
    IN_PRODUCTION = "in_production"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SHORTLISTED = "shortlisted"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"  # Creator cancels their own application
    CANCELLED = "cancelled"  # Admin cancels a confirmed creator

class DeliverableStatus(str, Enum):
    AWAITING_PUBLISH = "awaiting_publish"
    PUBLISHED = "published"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    CHANGES_REQUESTED = "changes_requested"
    RESUBMITTED = "resubmitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    METRICS_PENDING = "metrics_pending"
    METRICS_SUBMITTED = "metrics_submitted"
    METRICS_LATE = "metrics_late"
    METRICS_VERIFIED = "metrics_verified"
    COMPLETED = "completed"

class PackageType(str, Enum):
    STARTER = "starter"
    STANDARD = "standard"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class ContentPlatform(str, Enum):
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"

class CreatorLevel(str, Enum):
    ROOKIE = "rookie"
    TRUSTED = "trusted"
    PRO = "pro"
    ELITE = "elite"

class CanjeType(str, Enum):
    PRODUCT = "product"  # Physical product
    SERVICE = "service"  # Experience/service
    EXPERIENCE = "experience"  # Alias for service

class DeliveryMethod(str, Enum):
    DELIVERY = "delivery"  # Product shipped to creator
    PICKUP = "pickup"  # Creator picks up at location
    NOT_APPLICABLE = "not_applicable"  # For experiences at specific location

# ==================== CREATOR MODELS ====================

class SocialNetwork(BaseModel):
    platform: ContentPlatform
    username: str
    url: str
    followers: Optional[int] = None
    verified: bool = False
    screenshot_url: Optional[str] = None
    last_updated: Optional[str] = None

class CreatorStats(BaseModel):
    total_campaigns: int = 0
    completed_campaigns: int = 0
    avg_rating: float = 0.0
    total_ratings: int = 0
    avg_views: Dict[str, float] = {}  # Per platform
    avg_reach: Dict[str, float] = {}
    avg_interactions: Dict[str, float] = {}
    max_views: Dict[str, int] = {}
    max_reach: Dict[str, int] = {}
    max_interactions: Dict[str, int] = {}
    delivery_on_time_rate: float = 100.0
    metrics_on_time_rate: float = 100.0
    avg_delivery_lag_hours: float = 0.0

class CreatorProfile(BaseModel):
    id: str
    user_id: str  # Links to main users collection
    email: EmailStr
    name: str
    city: str
    categories: List[str] = []  # food, beauty, fashion, etc.
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    social_networks: List[SocialNetwork] = []
    stats: CreatorStats = CreatorStats()
    level: CreatorLevel = CreatorLevel.ROOKIE
    level_progress: int = 0  # 0-100
    is_verified: bool = False
    is_active: bool = True
    onboarding_completed: bool = False
    created_at: str
    updated_at: str

class CreatorProfileCreate(BaseModel):
    name: str
    city: str
    categories: List[str] = []
    bio: Optional[str] = None
    instagram_username: Optional[str] = None
    tiktok_username: Optional[str] = None

class CreatorProfileUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    categories: Optional[List[str]] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None

# ==================== BRAND MODELS ====================

class BrandProfile(BaseModel):
    id: str
    user_id: str  # Links to main users collection
    email: EmailStr
    company_name: str
    industry: str  # rubro/categoría
    city: str
    contact_name: str
    contact_phone: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    instagram_url: Optional[str] = None
    description: Optional[str] = None
    is_verified: bool = False
    is_active: bool = True
    onboarding_completed: bool = False
    created_at: str
    updated_at: str

class BrandProfileCreate(BaseModel):
    email: Optional[str] = None  # Optional - used if not logged in
    company_name: str
    industry: str
    country: str = "PY"
    city: str
    contact_name: str
    contact_first_name: Optional[str] = None
    contact_last_name: Optional[str] = None
    contact_phone: Optional[str] = None
    phone_country_code: Optional[str] = "+595"
    website: Optional[str] = None
    instagram_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    description: Optional[str] = None

class BrandProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    contact_name: Optional[str] = None
    contact_first_name: Optional[str] = None
    contact_last_name: Optional[str] = None
    contact_phone: Optional[str] = None
    phone_country_code: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    instagram_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    description: Optional[str] = None

# ==================== PACKAGE MODELS ====================

class PackageConfig(BaseModel):
    type: PackageType
    name: str
    deliveries: int
    price: int
    promo_price: Optional[int] = None
    description: str
    features: List[str] = []

# Static package configurations
PACKAGE_CONFIGS = {
    PackageType.STARTER: PackageConfig(
        type=PackageType.STARTER,
        name="Starter",
        deliveries=4,
        price=990000,
        promo_price=790000,
        description="Ideal para comenzar con UGC",
        features=[
            "Gestión centralizada",
            "Métricas verificadas con IA",
            "Seguimiento en tiempo real",
            "Panel de estadísticas",
            "Sistema de reviews",
            "Reporte de entrega de materiales",
            "Reporte de métricas de la campaña",
            "Soporte comercial"
        ]
    ),
    PackageType.STANDARD: PackageConfig(
        type=PackageType.STANDARD,
        name="Standard",
        deliveries=8,
        price=1790000,
        promo_price=1490000,
        description="El más popular para campañas medianas",
        features=[
            "Gestión centralizada",
            "Métricas verificadas con IA",
            "Seguimiento en tiempo real",
            "Panel de estadísticas",
            "Sistema de reviews",
            "Reporte de entrega de materiales",
            "Reporte de métricas de la campaña",
            "Reporte de métricas de los postulantes",
            "Soporte comercial"
        ]
    ),
    PackageType.PRO: PackageConfig(
        type=PackageType.PRO,
        name="Pro",
        deliveries=12,
        price=2390000,
        promo_price=1990000,
        description="Para marcas con alto volumen",
        features=[
            "Gestión centralizada",
            "Métricas verificadas con IA",
            "Seguimiento en tiempo real",
            "Panel de estadísticas",
            "Sistema de reviews",
            "Reporte de entrega de materiales",
            "Reporte de métricas de la campaña",
            "Reporte de métricas de los postulantes",
            "Gráficos de distribución demográfica",
            "Soporte comercial prioritario"
        ]
    ),
    PackageType.ENTERPRISE: PackageConfig(
        type=PackageType.ENTERPRISE,
        name="Enterprise",
        deliveries=0,  # Custom
        price=0,  # Custom quote
        promo_price=None,
        description="Solución personalizada para grandes marcas",
        features=[
            "Gestión centralizada",
            "Métricas verificadas con IA",
            "Seguimiento en tiempo real",
            "Panel de estadísticas",
            "Sistema de reviews",
            "Reporte de entrega de materiales",
            "Reporte de métricas de la campaña",
            "Reporte de métricas de los postulantes",
            "Gráficos de distribución demográfica",
            "Personalización de campañas",
            "Panel de selección de postulantes",
            "Reportes personalizados",
            "Soporte comercial prioritario"
        ]
    )
}

class EnterpriseQuoteRequest(BaseModel):
    duration_months: int  # 3-12
    deliveries_per_month: int  # 16, 24, 30
    notes: Optional[str] = None

class EnterpriseQuote(BaseModel):
    duration_months: int
    deliveries_per_month: int
    total_deliveries: int
    price_per_delivery: int = 150000
    total_price: int
    monthly_payment: int

class Package(BaseModel):
    id: str
    brand_id: str
    type: PackageType
    deliveries_total: int
    deliveries_used: int = 0
    deliveries_remaining: int
    price_paid: int
    is_promo: bool = False
    # For enterprise
    duration_months: Optional[int] = None
    deliveries_per_month: Optional[int] = None
    monthly_payment: Optional[int] = None
    status: str = "active"  # active, exhausted, expired, cancelled
    purchased_at: str
    expires_at: Optional[str] = None
    created_at: str

class PackagePurchase(BaseModel):
    package_type: PackageType
    use_promo: bool = True
    # For enterprise
    enterprise_quote: Optional[EnterpriseQuoteRequest] = None

# ==================== CAMPAIGN MODELS ====================

class CampaignRequirements(BaseModel):
    min_followers: Optional[int] = None
    min_avg_views: Optional[int] = None
    min_age: Optional[int] = 18
    gender: Optional[str] = "all"  # all, male, female
    country: Optional[str] = "Paraguay"
    residence: Optional[str] = None  # "Asunción y Gran Asunción" or other
    platforms: List[ContentPlatform] = [ContentPlatform.INSTAGRAM]
    mandatory_tag: Optional[str] = None
    mandatory_mention: Optional[str] = None
    mandatory_cta: Optional[str] = None
    content_format: Optional[str] = None  # reel, tiktok, story, post
    min_duration_seconds: Optional[int] = None
    max_duration_seconds: Optional[int] = None
    additional_rules: List[str] = []

class CampaignCanje(BaseModel):
    type: CanjeType
    description: str
    value: int  # Value in Gs
    # For products
    requires_shipping: bool = False
    shipping_notes: Optional[str] = None
    # For services
    requires_scheduling: bool = False
    location: Optional[str] = None
    scheduling_notes: Optional[str] = None

class CampaignTimeline(BaseModel):
    applications_deadline: str  # ISO date
    publish_start: str  # ISO date - when creators should start publishing
    publish_end: str  # ISO date - deadline to publish
    delivery_sla_hours: int = 48  # Hours after publish to submit in platform

# Contract configuration for campaigns
class CampaignContract(BaseModel):
    monthly_deliverables: int  # Number of slots to load each month (e.g., 4)
    duration_months: int  # Contract duration in months (e.g., 3)
    start_date: str  # ISO date - when contract starts
    end_date: str  # ISO date - when contract expires
    next_reload_date: Optional[str] = None  # ISO date - next slot reload date
    total_slots_loaded: int = 0  # Total slots loaded so far
    is_active: bool = True  # Whether contract is active
    renewed_at: Optional[str] = None  # ISO date - last renewal date
    renewal_count: int = 0  # Number of times renewed

class Campaign(BaseModel):
    id: str
    brand_id: str
    package_id: Optional[str] = None  # Made optional - admin manages this
    name: str
    description: str
    category: str
    city: str
    # Slot management - now based on contract
    available_slots: int = 0  # Currently available slots for confirmation
    total_slots_loaded: int = 0  # Total slots loaded from contract
    slots_filled: int = 0  # Confirmed creators
    # Legacy field for backwards compatibility
    slots: int = 0  # Will be calculated from contract
    # Contract configuration
    contract: Optional[CampaignContract] = None
    requirements: CampaignRequirements
    canje: CampaignCanje
    timeline: CampaignTimeline
    assets: Dict[str, Any] = {}  # logo, photos, info
    status: CampaignStatus = CampaignStatus.DRAFT
    # Visibility for creators
    visible_to_creators: bool = True
    created_at: str
    updated_at: str
    published_at: Optional[str] = None
    completed_at: Optional[str] = None
    # Admin notes
    admin_notes: Optional[str] = None
    created_by_admin: Optional[str] = None  # Admin user_id who created

class CampaignCreate(BaseModel):
    brand_id: str  # Admin selects the brand
    name: str
    description: str
    category: str
    city: str
    # Contract configuration
    monthly_deliverables: int  # Slots per month
    contract_duration_months: int  # Duration in months
    contract_start_date: str  # ISO date
    # Requirements and content
    requirements: CampaignRequirements
    canje: CampaignCanje
    timeline: CampaignTimeline
    assets: Dict[str, Any] = {}
    admin_notes: Optional[str] = None

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    requirements: Optional[CampaignRequirements] = None
    canje: Optional[CampaignCanje] = None
    timeline: Optional[CampaignTimeline] = None
    assets: Optional[Dict[str, Any]] = None
    status: Optional[CampaignStatus] = None
    admin_notes: Optional[str] = None
    visible_to_creators: Optional[bool] = None

# Contract renewal by admin
class CampaignContractRenewal(BaseModel):
    monthly_deliverables: int
    duration_months: int
    start_date: str  # New contract start date
    notes: Optional[str] = None

# ==================== APPLICATION MODELS ====================

class Application(BaseModel):
    id: str
    campaign_id: str
    creator_id: str
    creator_name: str
    creator_username: str  # Primary social username
    creator_followers: int
    creator_rating: float
    creator_level: CreatorLevel
    motivation: Optional[str] = None  # "Por qué aplico"
    portfolio_links: List[str] = []
    status: ApplicationStatus = ApplicationStatus.APPLIED
    status_history: List[Dict[str, Any]] = []  # [{status, timestamp, by}]
    applied_at: str
    updated_at: str
    confirmed_at: Optional[str] = None
    rejected_at: Optional[str] = None
    rejection_reason: Optional[str] = None

class ApplicationCreate(BaseModel):
    campaign_id: str
    motivation: Optional[str] = None
    note: Optional[str] = None  # Alias for motivation
    proposed_content: Optional[str] = None
    portfolio_links: List[str] = []

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    reason: Optional[str] = None

# ==================== DELIVERABLE MODELS ====================

class Deliverable(BaseModel):
    id: str
    campaign_id: str
    application_id: str
    creator_id: str
    brand_id: str
    platform: ContentPlatform
    status: DeliverableStatus = DeliverableStatus.AWAITING_PUBLISH
    status_history: List[Dict[str, Any]] = []
    # Content
    post_url: Optional[str] = None
    file_url: Optional[str] = None
    evidence_urls: List[str] = []
    # Timing
    published_at: Optional[str] = None
    submitted_at: Optional[str] = None
    delivery_lag_hours: Optional[float] = None
    is_on_time: Optional[bool] = None
    # Review
    review_round: int = 0
    review_notes: List[Dict[str, Any]] = []  # [{round, note, by, timestamp}]
    approved_at: Optional[str] = None
    # Metrics
    metrics_window_opens: Optional[str] = None  # published_at + 7 days
    metrics_window_closes: Optional[str] = None  # published_at + 14 days
    metrics_submitted_at: Optional[str] = None
    metrics_is_late: bool = False
    created_at: str
    updated_at: str

class DeliverableSubmit(BaseModel):
    post_url: str
    file_url: Optional[str] = None
    evidence_urls: List[str] = []

class DeliverableReview(BaseModel):
    action: str  # "approve", "request_changes", "reject"
    notes: Optional[str] = None

# Rating from brand to deliverable
class DeliverableRating(BaseModel):
    rating: int  # 1-5 stars
    comment: Optional[str] = None  # Private comment (only admin and creator can see)

# ==================== METRICS MODELS ====================

class ContentMetrics(BaseModel):
    id: str
    deliverable_id: str
    creator_id: str
    campaign_id: str
    platform: ContentPlatform
    # Raw metrics
    views: Optional[int] = None
    reach: Optional[int] = None  # IG specific
    likes: Optional[int] = None
    comments: Optional[int] = None
    shares: Optional[int] = None
    saves: Optional[int] = None  # IG specific
    # Video metrics
    watch_time_seconds: Optional[int] = None  # Average watch time
    video_length_seconds: Optional[int] = None  # Total video duration
    retention_rate: Optional[float] = None  # % of video watched
    # Calculated
    total_interactions: int = 0
    engagement_rate: Optional[float] = None
    # Demographics (AI extracted)
    demographics: Optional[Dict[str, Any]] = None  # {gender, countries, age_ranges}
    # Screenshot/evidence
    screenshot_url: str
    demographics_screenshot_url: Optional[str] = None
    screenshot_day: int  # Day since publish (should be 7-14)
    # AI Processing
    ai_extracted: bool = False
    ai_confidence: Optional[float] = None
    ai_raw_data: Optional[Dict[str, Any]] = None
    manually_verified: bool = False
    verified_by: Optional[str] = None
    # Status
    is_late: bool = False
    submitted_at: str
    created_at: str

class MetricsSubmit(BaseModel):
    screenshot_url: str
    demographics_screenshot_url: Optional[str] = None  # Optional second screenshot for demographics
    # Optional manual input (if AI fails)
    views: Optional[int] = None
    reach: Optional[int] = None
    likes: Optional[int] = None
    comments: Optional[int] = None
    shares: Optional[int] = None
    saves: Optional[int] = None
    watch_time_seconds: Optional[int] = None
    video_length_seconds: Optional[int] = None

class MetricsVerify(BaseModel):
    views: int
    reach: Optional[int] = None
    likes: int
    comments: int
    shares: int
    saves: Optional[int] = None
    watch_time_seconds: Optional[int] = None
    video_length_seconds: Optional[int] = None

# ==================== REVIEW MODELS ====================

class CreatorReview(BaseModel):
    id: str
    campaign_id: str
    deliverable_id: str
    creator_id: str
    brand_id: str
    rating: int  # 1-5 stars
    public_comment: Optional[str] = None  # Visible to creator
    private_comment: Optional[str] = None  # Only admin
    created_at: str

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    public_comment: Optional[str] = None
    private_comment: Optional[str] = None

# ==================== NOTIFICATION MODELS ====================

class NotificationType(str, Enum):
    # Creator notifications
    APPLICATION_SHORTLISTED = "application_shortlisted"
    APPLICATION_CONFIRMED = "application_confirmed"
    APPLICATION_REJECTED = "application_rejected"
    DELIVERY_REMINDER = "delivery_reminder"
    CONTENT_APPROVED = "content_approved"
    CONTENT_CHANGES_REQUESTED = "content_changes_requested"
    CONTENT_REJECTED = "content_rejected"
    METRICS_WINDOW_OPEN = "metrics_window_open"
    METRICS_REMINDER = "metrics_reminder"
    NEW_REVIEW = "new_review"
    LEVEL_UP = "level_up"
    # Brand notifications
    NEW_APPLICATION = "new_application"
    CONTENT_SUBMITTED = "content_submitted"
    METRICS_RECEIVED = "metrics_received"
    CAMPAIGN_COMPLETED = "campaign_completed"

class Notification(BaseModel):
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Dict[str, Any] = {}  # Related IDs, links, etc.
    read: bool = False
    email_sent: bool = False
    created_at: str

# ==================== AUDIT LOG ====================

class UGCAuditLog(BaseModel):
    id: str
    action: str
    actor_id: str
    actor_role: str
    target_type: str  # campaign, application, deliverable, etc.
    target_id: str
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    timestamp: str

# ==================== LEADERBOARD ====================

class LeaderboardEntry(BaseModel):
    rank: int
    creator_id: str
    creator_name: str
    creator_username: str
    profile_picture: Optional[str] = None
    level: CreatorLevel
    rating: float
    total_campaigns: int
    avg_views: int
    city: Optional[str] = None

class LeaderboardFilters(BaseModel):
    city: Optional[str] = None
    category: Optional[str] = None
    period: str = "all_time"  # "monthly", "all_time"
    limit: int = 50
