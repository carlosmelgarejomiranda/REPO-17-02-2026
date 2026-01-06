"""
UGC Platform - Reputation & Gamification Routes
"""

from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from datetime import datetime, timezone
import uuid

from models.ugc_models import (
    CreatorLevel, ReviewCreate
)

router = APIRouter(prefix="/api/ugc/reputation", tags=["UGC Reputation"])

# Level thresholds
LEVEL_THRESHOLDS = {
    "rookie": {"min_deliveries": 0, "min_rating": 0, "min_on_time": 0},
    "trusted": {"min_deliveries": 5, "min_rating": 3.5, "min_on_time": 70},
    "pro": {"min_deliveries": 15, "min_rating": 4.0, "min_on_time": 85},
    "elite": {"min_deliveries": 30, "min_rating": 4.5, "min_on_time": 95}
}

LEVEL_BENEFITS = {
    "rookie": {
        "badge_color": "gray",
        "priority_applications": False,
        "featured_in_catalog": False,
        "max_active_campaigns": 2
    },
    "trusted": {
        "badge_color": "blue",
        "priority_applications": False,
        "featured_in_catalog": False,
        "max_active_campaigns": 4
    },
    "pro": {
        "badge_color": "purple",
        "priority_applications": True,
        "featured_in_catalog": True,
        "max_active_campaigns": 6
    },
    "elite": {
        "badge_color": "gold",
        "priority_applications": True,
        "featured_in_catalog": True,
        "max_active_campaigns": 10
    }
}

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def require_auth(request: Request):
    from server import require_auth as auth
    return await auth(request)

async def require_brand(request: Request):
    from server import db
    user = await require_auth(request)
    brand = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=403, detail="Brand profile required")
    return user, brand

def calculate_level(stats: dict) -> tuple:
    """Calculate creator level based on stats"""
    completed = stats.get("total_completed", 0)
    rating = stats.get("avg_rating", 0)
    on_time = stats.get("delivery_on_time_rate", 100)
    
    current_level = CreatorLevel.ROOKIE
    progress = 0
    
    for level_name in ["elite", "pro", "trusted", "rookie"]:
        threshold = LEVEL_THRESHOLDS[level_name]
        if (completed >= threshold["min_deliveries"] and 
            rating >= threshold["min_rating"] and
            on_time >= threshold["min_on_time"]):
            current_level = CreatorLevel(level_name)
            
            # Calculate progress to next level
            if level_name != "elite":
                next_levels = {"rookie": "trusted", "trusted": "pro", "pro": "elite"}
                next_threshold = LEVEL_THRESHOLDS[next_levels[level_name]]
                
                # Progress based on deliveries (main factor)
                delivery_progress = min(100, (completed / next_threshold["min_deliveries"]) * 100)
                rating_progress = min(100, (rating / next_threshold["min_rating"]) * 100) if next_threshold["min_rating"] > 0 else 100
                
                progress = int((delivery_progress * 0.6) + (rating_progress * 0.4))
            else:
                progress = 100
            break
    
    return current_level, progress

async def update_creator_level(db, creator_id: str):
    """Update creator's level based on current stats"""
    creator = await db.ugc_creators.find_one({"id": creator_id}, {"_id": 0})
    if not creator:
        return
    
    stats = creator.get("stats", {})
    new_level, progress = calculate_level(stats)
    old_level = creator.get("level", CreatorLevel.ROOKIE)
    
    updates = {
        "level": new_level,
        "level_progress": progress
    }
    
    await db.ugc_creators.update_one(
        {"id": creator_id},
        {"$set": updates}
    )
    
    # Check if leveled up
    level_order = ["rookie", "trusted", "pro", "elite"]
    if level_order.index(new_level) > level_order.index(old_level):
        # Create notification
        await db.ugc_notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": creator.get("user_id"),
            "type": "level_up",
            "title": f"¡Subiste a nivel {new_level.upper()}!",
            "message": f"Felicitaciones, ahora sos un creator {new_level}. Tenés acceso a nuevos beneficios.",
            "data": {"new_level": new_level, "benefits": LEVEL_BENEFITS[new_level]},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return new_level, progress

# ==================== PUBLIC PROFILE ====================

@router.get("/creator/{creator_id}", response_model=dict)
async def get_creator_public_profile(creator_id: str):
    """Get public reputation profile of a creator"""
    db = await get_db()
    
    creator = await db.ugc_creators.find_one(
        {"id": creator_id, "verification_status": "approved"},
        {"_id": 0, "user_id": 0, "email": 0, "phone": 0}  # Exclude private data
    )
    
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    # Get ratings breakdown
    ratings = await db.ugc_ratings.find(
        {"creator_id": creator_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    rating_breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in ratings:
        if r.get("rating") in rating_breakdown:
            rating_breakdown[r["rating"]] += 1
    
    # Get recent reviews (public comments)
    recent_reviews = [
        {
            "rating": r["rating"],
            "comment": r.get("comment"),
            "brand_name": r.get("brand_name"),
            "created_at": r.get("created_at")
        }
        for r in ratings[:5] if r.get("comment")
    ]
    
    # Get performance highlights
    stats = creator.get("stats", {})
    highlights = {
        "total_collaborations": stats.get("total_completed", 0),
        "avg_rating": round(stats.get("avg_rating", 0), 1),
        "on_time_rate": stats.get("delivery_on_time_rate", 100),
        "avg_views": stats.get("avg_views", {}),
        "max_views": stats.get("max_views", {})
    }
    
    level = creator.get("level", "rookie")
    
    return {
        "profile": {
            "id": creator["id"],
            "name": creator.get("name"),
            "bio": creator.get("bio"),
            "profile_image": creator.get("profile_image"),
            "city": creator.get("city"),
            "categories": creator.get("categories", []),
            "social_networks": creator.get("social_networks", []),
            "level": level,
            "level_progress": creator.get("level_progress", 0),
            "level_benefits": LEVEL_BENEFITS.get(level, {}),
            "member_since": creator.get("created_at")
        },
        "reputation": {
            "total_ratings": len(ratings),
            "avg_rating": highlights["avg_rating"],
            "rating_breakdown": rating_breakdown,
            "recent_reviews": recent_reviews
        },
        "performance": highlights,
        "badges": get_creator_badges(stats, level)
    }

def get_creator_badges(stats: dict, level: str) -> list:
    """Generate badges based on achievements"""
    badges = []
    
    completed = stats.get("total_completed", 0)
    rating = stats.get("avg_rating", 0)
    on_time = stats.get("delivery_on_time_rate", 100)
    
    # Completion badges
    if completed >= 50:
        badges.append({"id": "veteran", "name": "Veterano", "icon": "🏆", "description": "50+ colaboraciones"})
    elif completed >= 20:
        badges.append({"id": "experienced", "name": "Experimentado", "icon": "⭐", "description": "20+ colaboraciones"})
    elif completed >= 5:
        badges.append({"id": "active", "name": "Activo", "icon": "🎯", "description": "5+ colaboraciones"})
    
    # Rating badges
    if rating >= 4.8 and stats.get("total_ratings", 0) >= 10:
        badges.append({"id": "top_rated", "name": "Top Rated", "icon": "💎", "description": "Rating 4.8+ con 10+ reviews"})
    elif rating >= 4.5:
        badges.append({"id": "highly_rated", "name": "Muy Valorado", "icon": "🌟", "description": "Rating 4.5+"})
    
    # Punctuality badges
    if on_time >= 98 and completed >= 10:
        badges.append({"id": "always_on_time", "name": "Siempre Puntual", "icon": "⏰", "description": "98%+ entregas a tiempo"})
    elif on_time >= 90:
        badges.append({"id": "punctual", "name": "Puntual", "icon": "📅", "description": "90%+ entregas a tiempo"})
    
    # Level badge
    level_badges = {
        "elite": {"id": "elite", "name": "Elite Creator", "icon": "👑", "description": "Nivel máximo"},
        "pro": {"id": "pro", "name": "Pro Creator", "icon": "💼", "description": "Creator profesional"},
        "trusted": {"id": "trusted", "name": "Trusted", "icon": "✅", "description": "Creator de confianza"}
    }
    if level in level_badges:
        badges.append(level_badges[level])
    
    return badges

# ==================== RATINGS ====================

@router.post("/rate/{deliverable_id}", response_model=dict)
async def rate_creator(
    deliverable_id: str,
    data: RatingCreate,
    request: Request
):
    """Brand rates a creator after deliverable completion"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Get deliverable
    deliverable = await db.ugc_deliverables.find_one({
        "id": deliverable_id,
        "brand_id": brand["id"],
        "status": {"$in": ["approved", "metrics_submitted", "metrics_verified", "completed"]}
    })
    
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found or not ready for rating")
    
    # Check if already rated
    existing = await db.ugc_ratings.find_one({
        "deliverable_id": deliverable_id,
        "brand_id": brand["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Ya calificaste esta entrega")
    
    now = datetime.now(timezone.utc).isoformat()
    
    rating = {
        "id": str(uuid.uuid4()),
        "deliverable_id": deliverable_id,
        "campaign_id": deliverable["campaign_id"],
        "creator_id": deliverable["creator_id"],
        "brand_id": brand["id"],
        "brand_name": brand.get("company_name"),
        "rating": data.rating,
        "comment": data.comment,
        "created_at": now
    }
    
    await db.ugc_ratings.insert_one(rating)
    
    # Update creator's average rating
    all_ratings = await db.ugc_ratings.find(
        {"creator_id": deliverable["creator_id"]},
        {"_id": 0, "rating": 1}
    ).to_list(500)
    
    avg_rating = sum(r["rating"] for r in all_ratings) / len(all_ratings)
    
    await db.ugc_creators.update_one(
        {"id": deliverable["creator_id"]},
        {
            "$set": {
                "stats.avg_rating": round(avg_rating, 2),
                "stats.total_ratings": len(all_ratings)
            }
        }
    )
    
    # Update level
    await update_creator_level(db, deliverable["creator_id"])
    
    return {"success": True, "message": "Calificación enviada"}

# ==================== LEADERBOARD ====================

@router.get("/leaderboard", response_model=dict)
async def get_leaderboard(
    category: Optional[str] = None,
    city: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = 20
):
    """Get top creators leaderboard"""
    db = await get_db()
    
    query = {"verification_status": "approved"}
    if category:
        query["categories"] = category
    if city:
        query["city"] = city
    if platform:
        query["social_networks.platform"] = platform
    
    # Get top creators by rating and completions
    creators = await db.ugc_creators.find(
        query,
        {
            "_id": 0,
            "id": 1,
            "name": 1,
            "profile_image": 1,
            "city": 1,
            "level": 1,
            "stats": 1,
            "social_networks": 1,
            "categories": 1
        }
    ).sort([
        ("stats.avg_rating", -1),
        ("stats.total_completed", -1)
    ]).limit(limit).to_list(limit)
    
    leaderboard = []
    for idx, c in enumerate(creators):
        stats = c.get("stats", {})
        leaderboard.append({
            "rank": idx + 1,
            "creator_id": c["id"],
            "name": c.get("name"),
            "profile_image": c.get("profile_image"),
            "city": c.get("city"),
            "level": c.get("level", "rookie"),
            "avg_rating": stats.get("avg_rating", 0),
            "total_completed": stats.get("total_completed", 0),
            "on_time_rate": stats.get("delivery_on_time_rate", 100),
            "categories": c.get("categories", [])[:3],
            "primary_platform": c.get("social_networks", [{}])[0].get("platform") if c.get("social_networks") else None
        })
    
    return {"leaderboard": leaderboard}

# ==================== LEVEL INFO ====================

@router.get("/levels", response_model=dict)
async def get_level_info():
    """Get information about creator levels"""
    return {
        "levels": [
            {
                "id": level,
                "name": level.title(),
                "thresholds": LEVEL_THRESHOLDS[level],
                "benefits": LEVEL_BENEFITS[level]
            }
            for level in ["rookie", "trusted", "pro", "elite"]
        ]
    }

@router.get("/my-progress", response_model=dict)
async def get_my_progress(request: Request):
    """Get current creator's level progress"""
    db = await get_db()
    user = await require_auth(request)
    
    creator = await db.ugc_creators.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    
    stats = creator.get("stats", {})
    current_level = creator.get("level", "rookie")
    progress = creator.get("level_progress", 0)
    
    # Calculate what's needed for next level
    level_order = ["rookie", "trusted", "pro", "elite"]
    current_idx = level_order.index(current_level)
    
    next_level_info = None
    if current_idx < 3:
        next_level = level_order[current_idx + 1]
        threshold = LEVEL_THRESHOLDS[next_level]
        next_level_info = {
            "level": next_level,
            "requirements": {
                "deliveries": {
                    "current": stats.get("total_completed", 0),
                    "needed": threshold["min_deliveries"]
                },
                "rating": {
                    "current": stats.get("avg_rating", 0),
                    "needed": threshold["min_rating"]
                },
                "on_time_rate": {
                    "current": stats.get("delivery_on_time_rate", 100),
                    "needed": threshold["min_on_time"]
                }
            },
            "benefits": LEVEL_BENEFITS[next_level]
        }
    
    return {
        "current_level": current_level,
        "progress": progress,
        "current_benefits": LEVEL_BENEFITS[current_level],
        "stats": {
            "total_completed": stats.get("total_completed", 0),
            "avg_rating": stats.get("avg_rating", 0),
            "total_ratings": stats.get("total_ratings", 0),
            "on_time_rate": stats.get("delivery_on_time_rate", 100)
        },
        "next_level": next_level_info,
        "badges": get_creator_badges(stats, current_level)
    }
