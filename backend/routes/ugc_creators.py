"""
UGC Platform - Creator Routes
"""

from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

from models.ugc_models import (
    CreatorProfile, CreatorProfileCreate, CreatorProfileUpdate,
    SocialNetwork, ContentPlatform, CreatorLevel, CreatorStats,
    LeaderboardEntry, LeaderboardFilters
)

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
    """Complete creator onboarding - creates creator profile"""
    db = await get_db()
    user = await require_auth(request)
    
    # Check if already has creator profile
    existing = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Creator profile already exists")
    
    now = datetime.now(timezone.utc).isoformat()
    
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
    
    # Create creator profile
    creator_profile = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "email": user["email"],
        "name": data.name,
        "city": data.city,
        "categories": data.categories,
        "bio": data.bio,
        "profile_picture": user.get("picture"),
        "social_networks": social_networks,
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
    
    # Send welcome email + notify avenue
    try:
        from services.ugc_emails import send_creator_welcome
        await send_creator_welcome(
            to_email=user["email"],
            creator_name=data.name
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send creator welcome email: {e}")
    
    return {"success": True, "creator_id": creator_profile["id"], "message": "Creator profile created"}

# ==================== PROFILE ====================

@router.get("/me", response_model=dict)
async def get_my_creator_profile(request: Request):
    """Get current user's creator profile"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
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
