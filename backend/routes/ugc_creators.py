"""
UGC Platform - Creator Routes
"""

from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone, date
import uuid
import os
import base64
import logging

from models.ugc_models import (
    CreatorProfile, CreatorProfileCreate, CreatorProfileUpdate,
    SocialNetwork, ContentPlatform, CreatorLevel, CreatorStats,
    LeaderboardEntry, LeaderboardFilters, GenderType, EducationLevel
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ugc/creators", tags=["UGC Creators"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    """Get database connection"""
    from server import db
    return db

async def get_current_user(request: Request):
    """Get current authenticated user"""
    from server import get_current_user as get_user
    return await get_user(request)

async def require_auth(request: Request):
    """Require authentication"""
    from server import require_auth as auth
    return await auth(request)

async def require_creator(request: Request):
    """Require creator role"""
    user = await require_auth(request)
    if user.get("role") not in ["creator", "admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Creator access required")
    return user

# ==================== ONBOARDING ====================

@router.post("/onboarding", response_model=dict)
async def complete_creator_onboarding(
    data: CreatorProfileCreate,
    request: Request
):
    """Complete creator onboarding - creates creator profile with all new fields"""
    db = await get_db()
    user = await require_auth(request)
    
    # Check if already has creator profile
    existing = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un perfil de creador con esta cuenta")
    
    # Validate required fields with clear messages
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="El nombre completo es requerido")
    
    if not data.document_id or not data.document_id.strip():
        raise HTTPException(status_code=400, detail="El número de cédula de identidad es requerido")
    
    if not data.phone or not data.phone.strip():
        raise HTTPException(status_code=400, detail="El número de teléfono es requerido")
    
    if not data.categories or len(data.categories) == 0:
        raise HTTPException(status_code=400, detail="Seleccioná al menos una categoría de contenido")
    
    # Validate social networks - at least one required
    has_instagram = data.instagram_username and data.instagram_username.strip()
    has_tiktok = data.tiktok_username and data.tiktok_username.strip()
    if not has_instagram and not has_tiktok:
        raise HTTPException(status_code=400, detail="Conectá al menos una red social (Instagram o TikTok)")
    
    # Validate age (must be 18+)
    try:
        birth = datetime.fromisoformat(data.birth_date.replace('Z', '+00:00'))
        today = datetime.now(timezone.utc)
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        if age < 18:
            raise HTTPException(status_code=400, detail="Debes ser mayor de 18 años para registrarte como creador")
    except ValueError:
        raise HTTPException(status_code=400, detail="La fecha de nacimiento ingresada no es válida")
    
    # Validate terms acceptance
    if not data.terms_accepted:
        raise HTTPException(status_code=400, detail="Debes aceptar los términos y condiciones para continuar")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Build full phone number
    phone_full = f"{data.phone_country_code}{data.phone}".replace(" ", "")
    
    # Handle profile picture upload to GridFS if provided as base64
    profile_picture_url = None
    if data.profile_picture:
        try:
            # Check if it's base64 data
            if data.profile_picture.startswith('data:image'):
                from services.gridfs_storage import upload_image
                
                # Extract base64 content
                header, base64_data = data.profile_picture.split(',', 1)
                image_bytes = base64.b64decode(base64_data)
                
                # Determine file extension from header
                if 'png' in header:
                    ext = '.png'
                    content_type = 'image/png'
                elif 'jpeg' in header or 'jpg' in header:
                    ext = '.jpg'
                    content_type = 'image/jpeg'
                elif 'webp' in header:
                    ext = '.webp'
                    content_type = 'image/webp'
                else:
                    ext = '.jpg'
                    content_type = 'image/jpeg'
                
                filename = f"creator_profile_{user['user_id']}{ext}"
                
                # Upload to GridFS
                file_id = await upload_image(
                    file_content=image_bytes,
                    filename=filename,
                    content_type=content_type,
                    metadata={"user_id": user["user_id"], "type": "profile_picture"},
                    bucket_name="images"
                )
                
                # Build the URL
                from server import get_api_base_url
                api_base = os.environ.get('REACT_APP_BACKEND_URL', '')
                profile_picture_url = f"{api_base}/api/images/{file_id}"
                logger.info(f"Uploaded profile picture for user {user['user_id']}: {file_id}")
            else:
                # It's already a URL
                profile_picture_url = data.profile_picture
        except Exception as e:
            logger.error(f"Failed to upload profile picture: {e}")
            # Continue without profile picture instead of failing
            profile_picture_url = user.get("picture")  # Fallback to Google picture
    else:
        # Use Google picture if available
        profile_picture_url = user.get("picture")
    
    # Build social networks
    social_networks = []
    if data.instagram_username:
        social_networks.append(SocialNetwork(
            platform=ContentPlatform.INSTAGRAM,
            username=data.instagram_username,
            url=f"https://instagram.com/{data.instagram_username}",
            followers=None,
            verified=False
        ).model_dump())
    
    if data.tiktok_username:
        social_networks.append(SocialNetwork(
            platform=ContentPlatform.TIKTOK,
            username=data.tiktok_username,
            url=f"https://tiktok.com/@{data.tiktok_username}",
            followers=None,
            verified=False
        ).model_dump())
    
    # Process social verification data if provided
    social_accounts = {}
    if data.social_verification:
        for platform, verification in data.social_verification.items():
            # Handle both dict and Pydantic model
            if hasattr(verification, 'model_dump'):
                v_data = verification.model_dump()
            else:
                v_data = verification
            
            social_accounts[platform.lower()] = {
                "platform": platform.lower(),
                "username": v_data.get("username"),
                "follower_count": v_data.get("follower_count"),
                "following_count": v_data.get("following_count"),
                "posts_count": v_data.get("posts_count"),
                "likes_count": v_data.get("likes_count"),
                "is_platform_verified": v_data.get("is_platform_verified", False),
                "verified_by_ai": True,
                "verified_at": now,
                "verification_method": "screenshot_ai",
                "last_updated": now
            }
            
            # Update legacy fields
            if platform.lower() == "instagram":
                social_networks = [sn for sn in social_networks if sn.get("platform") != "instagram"]
                social_networks.append({
                    "platform": "instagram",
                    "username": v_data.get("username"),
                    "url": f"https://instagram.com/{v_data.get('username')}",
                    "followers": v_data.get("follower_count"),
                    "verified": True
                })
            elif platform.lower() == "tiktok":
                social_networks = [sn for sn in social_networks if sn.get("platform") != "tiktok"]
                social_networks.append({
                    "platform": "tiktok",
                    "username": v_data.get("username"),
                    "url": f"https://tiktok.com/@{v_data.get('username')}",
                    "followers": v_data.get("follower_count"),
                    "verified": True
                })
    
    # Create creator profile with all new fields
    creator_profile = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "email": user["email"],
        # Personal Data (Step 1)
        "name": data.name,
        "birth_date": data.birth_date,
        "gender": data.gender.value if hasattr(data.gender, 'value') else data.gender,
        "document_id": data.document_id,
        # Location & Contact (Step 2)
        "country": data.country,
        "city": data.city,
        "phone_country_code": data.phone_country_code,
        "phone": data.phone,
        "phone_full": phone_full,
        # Professional Profile (Step 3)
        "categories": data.categories,
        "bio": data.bio,
        "education_level": data.education_level.value if data.education_level and hasattr(data.education_level, 'value') else data.education_level,
        "occupation": data.occupation,
        "languages": data.languages,
        "portfolio_url": data.portfolio_url,
        # Social Networks (Step 4)
        "social_networks": social_networks,
        "social_accounts": social_accounts,
        # Profile Picture (Step 5)
        "profile_picture": profile_picture_url,
        # Terms & Legal
        "terms_accepted": data.terms_accepted,
        "terms_accepted_at": now,
        "terms_version": data.terms_version,
        # Stats & Level
        "stats": CreatorStats().model_dump(),
        "level": CreatorLevel.ROOKIE,
        "level_progress": 0,
        "is_verified": False,
        "is_active": True,
        "onboarding_completed": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.ugc_creators.insert_one(creator_profile)
    
    # Update user role to creator
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"role": "creator", "updated_at": now}}
    )
    
    # Record T&C acceptance
    try:
        await db.terms_acceptances.insert_one({
            "user_id": user["user_id"],
            "terms_slug": "terms-ugc-creator",
            "terms_version": data.terms_version,
            "accepted_at": now,
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        })
    except Exception as e:
        logger.error(f"Failed to record T&C acceptance: {e}")
    
    # Send welcome email + notify avenue
    try:
        from services.ugc_emails import send_creator_welcome
        await send_creator_welcome(
            to_email=user["email"],
            creator_name=data.name
        )
    except Exception as e:
        logger.error(f"Failed to send creator welcome email: {e}")
    
    return {"success": True, "creator_id": creator_profile["id"], "message": "Creator profile created"}

# ==================== PROFILE ====================

def check_profile_complete(profile: dict) -> dict:
    """Check if creator profile has all required fields from new onboarding"""
    required_fields = ['phone', 'birth_date', 'document_id', 'gender']
    missing_fields = []
    
    for field in required_fields:
        if not profile.get(field):
            missing_fields.append(field)
    
    is_complete = len(missing_fields) == 0
    return {
        "is_complete": is_complete,
        "missing_fields": missing_fields,
        "needs_update": not is_complete
    }

@router.get("/me", response_model=dict)
async def get_my_creator_profile(request: Request):
    """Get current user's creator profile"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
    # Add profile completeness check
    completeness = check_profile_complete(profile)
    profile["profile_complete"] = completeness["is_complete"]
    profile["needs_profile_update"] = completeness["needs_update"]
    profile["missing_fields"] = completeness["missing_fields"]
    
    return profile

@router.put("/me", response_model=dict)
async def update_my_creator_profile(
    data: CreatorProfileUpdate,
    request: Request
):
    """Update current user's creator profile"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_creators.find_one({"user_id": user["user_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.ugc_creators.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "Profile updated"}


@router.put("/me/complete-profile", response_model=dict)
async def complete_existing_creator_profile(
    data: CreatorProfileCreate,
    request: Request
):
    """Complete/update existing creator profile with new required fields"""
    db = await get_db()
    user = await require_auth(request)
    
    # Check if profile exists
    profile = await db.ugc_creators.find_one({"user_id": user["user_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="No se encontró tu perfil de creador. Iniciá el proceso de registro nuevamente.")
    
    # Validate required fields with clear messages
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="El nombre completo es requerido")
    
    if not data.document_id or not data.document_id.strip():
        raise HTTPException(status_code=400, detail="El número de cédula de identidad es requerido")
    
    if not data.phone or not data.phone.strip():
        raise HTTPException(status_code=400, detail="El número de teléfono es requerido")
    
    if not data.categories or len(data.categories) == 0:
        raise HTTPException(status_code=400, detail="Seleccioná al menos una categoría de contenido")
    
    # Validate social networks - at least one required
    has_instagram = data.instagram_username and data.instagram_username.strip()
    has_tiktok = data.tiktok_username and data.tiktok_username.strip()
    if not has_instagram and not has_tiktok:
        raise HTTPException(status_code=400, detail="Conectá al menos una red social (Instagram o TikTok)")
    
    # Validate age (must be 18+)
    try:
        birth = datetime.fromisoformat(data.birth_date.replace('Z', '+00:00'))
        today = datetime.now(timezone.utc)
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        if age < 18:
            raise HTTPException(status_code=400, detail="Debes ser mayor de 18 años para registrarte como creador")
    except ValueError:
        raise HTTPException(status_code=400, detail="La fecha de nacimiento ingresada no es válida")
    
    # Validate terms acceptance
    if not data.terms_accepted:
        raise HTTPException(status_code=400, detail="Debes aceptar los términos y condiciones para continuar")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Build full phone number
    phone_full = f"{data.phone_country_code}{data.phone}".replace(" ", "")
    
    # Handle profile picture upload to GridFS if provided as base64
    profile_picture_url = profile.get("profile_picture")  # Keep existing if not updating
    if data.profile_picture:
        try:
            if data.profile_picture.startswith('data:image'):
                from services.gridfs_storage import upload_image
                
                header, base64_data = data.profile_picture.split(',', 1)
                image_bytes = base64.b64decode(base64_data)
                
                if 'png' in header:
                    ext = '.png'
                    content_type = 'image/png'
                elif 'jpeg' in header or 'jpg' in header:
                    ext = '.jpg'
                    content_type = 'image/jpeg'
                elif 'webp' in header:
                    ext = '.webp'
                    content_type = 'image/webp'
                else:
                    ext = '.jpg'
                    content_type = 'image/jpeg'
                
                filename = f"creator_profile_{user['user_id']}{ext}"
                
                file_id = await upload_image(
                    file_content=image_bytes,
                    filename=filename,
                    content_type=content_type,
                    metadata={"user_id": user["user_id"], "type": "profile_picture"},
                    bucket_name="images"
                )
                
                api_base = os.environ.get('REACT_APP_BACKEND_URL', '')
                profile_picture_url = f"{api_base}/api/images/{file_id}"
                logger.info(f"Uploaded profile picture for user {user['user_id']}: {file_id}")
            else:
                profile_picture_url = data.profile_picture
        except Exception as e:
            logger.error(f"Failed to upload profile picture: {e}")
    
    # Build social networks - merge with existing
    social_networks = profile.get("social_networks", [])
    
    # Update Instagram if provided
    if data.instagram_username:
        social_networks = [sn for sn in social_networks if sn.get("platform") != "instagram"]
        social_networks.append({
            "platform": "instagram",
            "username": data.instagram_username,
            "url": f"https://instagram.com/{data.instagram_username}",
            "followers": None,
            "verified": False
        })
    
    # Update TikTok if provided
    if data.tiktok_username:
        social_networks = [sn for sn in social_networks if sn.get("platform") != "tiktok"]
        social_networks.append({
            "platform": "tiktok",
            "username": data.tiktok_username,
            "url": f"https://tiktok.com/@{data.tiktok_username}",
            "followers": None,
            "verified": False
        })
    
    # Process social verification data if provided
    social_accounts = profile.get("social_accounts", {})
    if data.social_verification:
        for platform, verification in data.social_verification.items():
            if hasattr(verification, 'model_dump'):
                v_data = verification.model_dump()
            else:
                v_data = verification
            
            social_accounts[platform.lower()] = {
                "platform": platform.lower(),
                "username": v_data.get("username"),
                "follower_count": v_data.get("follower_count"),
                "following_count": v_data.get("following_count"),
                "posts_count": v_data.get("posts_count"),
                "likes_count": v_data.get("likes_count"),
                "is_platform_verified": v_data.get("is_platform_verified", False),
                "verified_by_ai": True,
                "verified_at": now,
                "verification_method": "screenshot_ai",
                "last_updated": now
            }
            
            # Update social_networks with verified data
            if platform.lower() == "instagram":
                social_networks = [sn for sn in social_networks if sn.get("platform") != "instagram"]
                social_networks.append({
                    "platform": "instagram",
                    "username": v_data.get("username"),
                    "url": f"https://instagram.com/{v_data.get('username')}",
                    "followers": v_data.get("follower_count"),
                    "verified": True
                })
            elif platform.lower() == "tiktok":
                social_networks = [sn for sn in social_networks if sn.get("platform") != "tiktok"]
                social_networks.append({
                    "platform": "tiktok",
                    "username": v_data.get("username"),
                    "url": f"https://tiktok.com/@{v_data.get('username')}",
                    "followers": v_data.get("follower_count"),
                    "verified": True
                })
    
    # Update profile with all new fields
    update_data = {
        # Personal Data (Step 1)
        "name": data.name,
        "birth_date": data.birth_date,
        "gender": data.gender.value if hasattr(data.gender, 'value') else data.gender,
        "document_id": data.document_id,
        # Location & Contact (Step 2)
        "country": data.country,
        "city": data.city,
        "phone_country_code": data.phone_country_code,
        "phone": data.phone,
        "phone_full": phone_full,
        # Professional Profile (Step 3)
        "categories": data.categories,
        "bio": data.bio,
        "education_level": data.education_level.value if data.education_level and hasattr(data.education_level, 'value') else data.education_level,
        "occupation": data.occupation,
        "languages": data.languages,
        "portfolio_url": data.portfolio_url,
        # Social Networks (Step 4)
        "social_networks": social_networks,
        "social_accounts": social_accounts,
        # Profile Picture (Step 5)
        "profile_picture": profile_picture_url,
        # Terms & Legal
        "terms_accepted": data.terms_accepted,
        "terms_accepted_at": now,
        "terms_version": data.terms_version,
        # Mark profile as complete
        "profile_updated_at": now,
        "updated_at": now
    }
    
    await db.ugc_creators.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    # Record T&C acceptance
    try:
        await db.terms_acceptances.insert_one({
            "user_id": user["user_id"],
            "terms_slug": "terms-ugc-creator",
            "terms_version": data.terms_version,
            "accepted_at": now,
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "action": "profile_update"
        })
    except Exception as e:
        logger.error(f"Failed to record T&C acceptance: {e}")
    
    return {"success": True, "message": "Perfil actualizado correctamente"}


@router.get("/{creator_id}", response_model=dict)
async def get_creator_profile(creator_id: str):
    """Get a creator's public profile"""
    db = await get_db()
    
    profile = await db.ugc_creators.find_one({"id": creator_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    # Remove private data for public view
    if "email" in profile:
        del profile["email"]
    
    return profile

# ==================== SOCIAL NETWORKS ====================

@router.post("/me/social", response_model=dict)
async def add_social_network(
    platform: ContentPlatform,
    username: str,
    request: Request
):
    """Add a social network to creator profile"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_creators.find_one({"user_id": user["user_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
    # Check if platform already exists
    existing_platforms = [sn["platform"] for sn in profile.get("social_networks", [])]
    if platform in existing_platforms:
        raise HTTPException(status_code=400, detail=f"{platform} already added")
    
    url = f"https://instagram.com/{username}" if platform == ContentPlatform.INSTAGRAM else f"https://tiktok.com/@{username}"
    
    new_network = SocialNetwork(
        platform=platform,
        username=username,
        url=url,
        followers=None,
        verified=False
    ).model_dump()
    
    await db.ugc_creators.update_one(
        {"user_id": user["user_id"]},
        {
            "$push": {"social_networks": new_network},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"success": True, "message": f"{platform} added"}

@router.put("/me/social/{platform}/followers", response_model=dict)
async def update_social_followers(
    platform: ContentPlatform,
    followers: int,
    screenshot_url: Optional[str] = None,
    request: Request = None
):
    """Update followers count for a social network (manual update with screenshot)"""
    db = await get_db()
    user = await require_auth(request)
    
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.ugc_creators.update_one(
        {
            "user_id": user["user_id"],
            "social_networks.platform": platform
        },
        {
            "$set": {
                "social_networks.$.followers": followers,
                "social_networks.$.screenshot_url": screenshot_url,
                "social_networks.$.last_updated": now,
                "updated_at": now
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail=f"{platform} not found in profile")
    
    return {"success": True, "message": "Followers updated"}


@router.post("/me/recalculate-stats", response_model=dict)
async def recalculate_my_stats(request: Request):
    """Recalculate the current creator's stats based on their metrics and deliverables"""
    db = await get_db()
    user = await require_auth(request)
    
    creator = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0, "id": 1})
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
    # Import and call the update function
    from routes.ugc_metrics import update_creator_stats
    await update_creator_stats(db, creator["id"])
    
    # Return updated stats
    updated = await db.ugc_creators.find_one(
        {"id": creator["id"]}, 
        {"_id": 0, "stats": 1, "completed_campaigns": 1, "delivery_on_time_rate": 1, "total_reach": 1}
    )
    
    return {
        "success": True, 
        "message": "Stats recalculated",
        "stats": updated
    }


# ==================== CAMPAIGNS ====================

@router.get("/me/campaigns", response_model=dict)
async def get_my_campaigns(request: Request):
    """Get creator's campaign history"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
    # Get all applications for this creator
    applications = await db.ugc_applications.find(
        {"creator_id": profile["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Get campaign details for each application
    campaigns = []
    for app in applications:
        campaign = await db.ugc_campaigns.find_one(
            {"id": app["campaign_id"]},
            {"_id": 0}
        )
        if campaign:
            campaigns.append({
                "application": app,
                "campaign": campaign
            })
    
    return {"campaigns": campaigns}

@router.get("/me/active-deliverables", response_model=dict)
async def get_my_active_deliverables(request: Request):
    """Get creator's active deliverables (workspace)"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
    # Get pending deliverables - exclude completed, rejected, and cancelled
    deliverables = await db.ugc_deliverables.find(
        {
            "creator_id": profile["id"],
            "status": {"$nin": ["completed", "rejected", "cancelled"]}
        },
        {"_id": 0}
    ).to_list(50)
    
    # Enrich with campaign and brand data, filtering out cancelled campaigns
    result = []
    for d in deliverables:
        campaign = await db.ugc_campaigns.find_one(
            {"id": d["campaign_id"]},
            {"_id": 0, "name": 1, "canje": 1, "requirements": 1, "timeline": 1, "brand_id": 1, "status": 1}
        )
        
        # Skip if campaign is cancelled
        if campaign and campaign.get("status") == "cancelled":
            continue
        
        # Get brand info
        brand = None
        if campaign and campaign.get("brand_id"):
            brand = await db.ugc_brands.find_one(
                {"id": campaign["brand_id"]},
                {"_id": 0, "company_name": 1, "logo_url": 1}
            )
        
        result.append({
            "deliverable": d,
            "campaign": campaign,
            "brand": brand
        })
    
    return {"deliverables": result}

# ==================== LEADERBOARD ====================

@router.get("/leaderboard", response_model=dict)
async def get_leaderboard(filters: LeaderboardFilters = None):
    """Get creator leaderboard"""
    db = await get_db()
    
    if filters is None:
        filters = LeaderboardFilters()
    
    # Build query
    query = {"is_active": True, "onboarding_completed": True}
    if filters.city:
        query["city"] = filters.city
    if filters.category:
        query["categories"] = filters.category
    
    # Get creators sorted by rating and campaigns
    creators = await db.ugc_creators.find(
        query,
        {"_id": 0}
    ).sort([
        ("stats.avg_rating", -1),
        ("stats.total_campaigns", -1)
    ]).limit(filters.limit).to_list(filters.limit)
    
    # Build leaderboard
    leaderboard = []
    for i, creator in enumerate(creators):
        primary_username = ""
        if creator.get("social_networks"):
            primary = creator["social_networks"][0]
            primary_username = primary.get("username", "")
        
        stats = creator.get("stats", {})
        
        leaderboard.append(LeaderboardEntry(
            rank=i + 1,
            creator_id=creator["id"],
            creator_name=creator["name"],
            creator_username=primary_username,
            profile_picture=creator.get("profile_picture"),
            level=creator.get("level", CreatorLevel.ROOKIE),
            rating=stats.get("avg_rating", 0),
            total_campaigns=stats.get("total_campaigns", 0),
            avg_views=stats.get("avg_views", {}).get("instagram", 0),
            city=creator.get("city")
        ).model_dump())
    
    return {"leaderboard": leaderboard}

# ==================== STATS ====================

@router.get("/me/stats", response_model=dict)
async def get_my_stats(request: Request):
    """Get detailed stats for current creator"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
    # Get reviews
    reviews = await db.ugc_reviews.find(
        {"creator_id": profile["id"]},
        {"_id": 0, "rating": 1, "public_comment": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(50)
    
    return {
        "stats": profile.get("stats", {}),
        "level": profile.get("level"),
        "level_progress": profile.get("level_progress", 0),
        "reviews": reviews
    }

# ==================== FEEDBACK (Private Comments from Brands) ====================

@router.get("/me/feedback", response_model=dict)
async def get_my_feedback(request: Request):
    """Get all private feedback/ratings from brands on creator's deliverables"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
    # Get all deliverables with brand ratings for this creator
    deliverables = await db.ugc_deliverables.find(
        {
            "creator_id": profile["id"],
            "brand_rating": {"$exists": True}
        },
        {"_id": 0, "id": 1, "campaign_id": 1, "brand_id": 1, "brand_rating": 1}
    ).sort("brand_rating.rated_at", -1).to_list(100)
    
    feedback = []
    total_rating = 0
    
    for d in deliverables:
        rating_data = d.get("brand_rating", {})
        
        # Get campaign and brand info
        campaign = await db.ugc_campaigns.find_one(
            {"id": d["campaign_id"]},
            {"_id": 0, "name": 1}
        )
        brand = await db.ugc_brands.find_one(
            {"id": d["brand_id"]},
            {"_id": 0, "company_name": 1}
        )
        
        feedback.append({
            "deliverable_id": d["id"],
            "campaign_name": campaign.get("name") if campaign else None,
            "brand_name": brand.get("company_name") if brand else None,
            "rating": rating_data.get("rating"),
            "comment": rating_data.get("comment"),
            "rated_at": rating_data.get("rated_at")
        })
        
        if rating_data.get("rating"):
            total_rating += rating_data["rating"]
    
    avg_rating = total_rating / len(feedback) if feedback else 0
    
    return {
        "feedback": feedback,
        "total_ratings": len(feedback),
        "avg_rating": round(avg_rating, 2)
    }
