"""
UGC Platform - Brand Routes
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from models.ugc_models import (
    BrandProfile, BrandProfileCreate, BrandProfileUpdate
)

router = APIRouter(prefix="/api/ugc/brands", tags=["UGC Brands"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def require_auth(request: Request):
    from server import require_auth as auth
    return await auth(request)

async def require_brand(request: Request):
    """Require brand role"""
    user = await require_auth(request)
    if user.get("role") not in ["brand", "admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Brand access required")
    return user

# ==================== ONBOARDING ====================

@router.post("/onboarding", response_model=dict)
async def complete_brand_onboarding(
    data: BrandProfileCreate,
    request: Request
):
    """Complete brand onboarding - creates brand profile"""
    db = await get_db()
    user = await require_auth(request)
    
    # Check if already has brand profile
    existing = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Brand profile already exists")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create brand profile with new global fields
    brand_profile = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "email": user["email"],
        "company_name": data.company_name,
        "industry": data.industry,
        "country": data.country,
        "city": data.city,
        "contact_name": data.contact_name,
        "contact_first_name": data.contact_first_name,
        "contact_last_name": data.contact_last_name,
        "contact_phone": data.contact_phone,
        "phone_country_code": data.phone_country_code,
        "logo_url": None,
        "website": data.website,
        "instagram_url": data.instagram_url,
        "instagram_handle": data.instagram_handle,
        "description": data.description,
        "is_verified": False,
        "is_active": True,
        "onboarding_completed": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.ugc_brands.insert_one(brand_profile)
    
    # Update user role to brand (but don't change if superadmin)
    if user.get("role") not in ["superadmin", "admin"]:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"role": "brand", "updated_at": now}}
        )
    
    # Send welcome email + notify avenue
    try:
        from services.ugc_emails import send_brand_welcome
        await send_brand_welcome(
            to_email=user["email"],
            brand_name=data.company_name
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send brand welcome email: {e}")
    
    return {"success": True, "brand_id": brand_profile["id"], "message": "Brand profile created"}

# ==================== PROFILE ====================

@router.get("/me", response_model=dict)
async def get_my_brand_profile(request: Request):
    """Get current user's brand profile"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    
    # Get active package info
    active_package = await db.ugc_packages.find_one(
        {"brand_id": profile["id"], "status": "active"},
        {"_id": 0}
    )
    
    profile["active_package"] = active_package
    
    return profile

@router.put("/me", response_model=dict)
async def update_my_brand_profile(
    data: BrandProfileUpdate,
    request: Request
):
    """Update current user's brand profile"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_brands.find_one({"user_id": user["user_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.ugc_brands.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "Profile updated"}

@router.get("/{brand_id}", response_model=dict)
async def get_brand_profile(brand_id: str):
    """Get a brand's public profile"""
    db = await get_db()
    
    profile = await db.ugc_brands.find_one({"id": brand_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Remove sensitive data for public view
    public_fields = ["id", "company_name", "industry", "city", "logo_url", "description", "is_verified"]
    public_profile = {k: profile.get(k) for k in public_fields}
    
    return public_profile

# ==================== DASHBOARD ====================

@router.get("/me/dashboard", response_model=dict)
async def get_brand_dashboard(request: Request):
    """Get brand dashboard summary"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    
    # Support both schemas: id or brand_id as PK
    brand_id = profile.get("id") or profile.get("brand_id")
    
    # Get active package
    active_package = await db.ugc_packages.find_one(
        {"brand_id": brand_id, "status": "active"},
        {"_id": 0}
    )
    
    # Get campaigns count
    campaigns_count = await db.ugc_campaigns.count_documents({"brand_id": brand_id})
    active_campaigns = await db.ugc_campaigns.count_documents(
        {"brand_id": brand_id, "status": {"$in": ["live", "in_production"]}}
    )
    
    # Get pending reviews (deliverables awaiting review)
    pending_reviews = await db.ugc_deliverables.count_documents(
        {"brand_id": brand_id, "status": "submitted"}
    )
    
    # Get campaign IDs (support both schemas)
    campaign_ids_new = await db.ugc_campaigns.distinct("id", {"brand_id": brand_id})
    campaign_ids_old = await db.ugc_campaigns.distinct("campaign_id", {"brand_id": brand_id})
    all_campaign_ids = [cid for cid in (campaign_ids_new + campaign_ids_old) if cid is not None]
    
    # Get recent applications
    recent_applications = await db.ugc_applications.find(
        {"campaign_id": {"$in": all_campaign_ids}},
        {"_id": 0}
    ).sort("applied_at", -1).limit(5).to_list(5)
    
    # Get campaigns list for reports access (support both schemas)
    campaigns = await db.ugc_campaigns.find(
        {"brand_id": brand_id},
        {"_id": 0, "id": 1, "campaign_id": 1, "name": 1, "status": 1, "slots": 1, "slots_filled": 1, "category": 1, "city": 1, "created_at": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Add detailed stats for each campaign
    for campaign in campaigns:
        # Support both schemas for campaign_id
        campaign_id = campaign.get("id") or campaign.get("campaign_id")
        # Ensure id field exists for frontend
        if "id" not in campaign and campaign_id:
            campaign["id"] = campaign_id
            
        total_deliverables = campaign.get("slots", 0)  # materiales a entregar = slots
        
        # Aplicaciones count
        applications_count = await db.ugc_applications.count_documents({"campaign_id": campaign_id})
        campaign["applications_count"] = applications_count
        
        # Confirmados count (creators with status confirmed)
        confirmed_count = await db.ugc_applications.count_documents({
            "campaign_id": campaign_id, 
            "status": "confirmed"
        })
        campaign["confirmed_count"] = confirmed_count
        
        # Posteos count (deliverables with status approved or submitted)
        posteos_count = await db.ugc_deliverables.count_documents({
            "campaign_id": campaign_id,
            "status": {"$in": ["approved", "submitted", "completed"]}
        })
        campaign["posteos_count"] = posteos_count
        
        # Métricas count (metrics submitted for this campaign)
        metrics_count = await db.ugc_metrics.count_documents({"campaign_id": campaign_id})
        campaign["metrics_count"] = metrics_count
        
        # Total deliverables expected
        campaign["total_deliverables"] = total_deliverables
    
    return {
        "profile": profile,
        "active_package": active_package,
        "stats": {
            "total_campaigns": campaigns_count,
            "active_campaigns": active_campaigns,
            "pending_reviews": pending_reviews,
            "deliveries_remaining": active_package["deliveries_remaining"] if active_package else 0
        },
        "recent_applications": recent_applications,
        "campaigns": campaigns
    }

# ==================== CREATORS WORKED WITH ====================

@router.get("/me/creators", response_model=dict)
async def get_creators_worked_with(request: Request):
    """Get list of creators the brand has worked with"""
    db = await get_db()
    user = await require_auth(request)
    
    profile = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    
    # Get unique creator IDs from completed deliverables
    creator_ids = await db.ugc_deliverables.distinct(
        "creator_id",
        {"brand_id": profile["id"], "status": "completed"}
    )
    
    # Get creator profiles
    creators = await db.ugc_creators.find(
        {"id": {"$in": creator_ids}},
        {"_id": 0, "email": 0}
    ).to_list(100)
    
    # Add review info for each creator
    for creator in creators:
        review = await db.ugc_reviews.find_one(
            {"brand_id": profile["id"], "creator_id": creator["id"]},
            {"_id": 0, "rating": 1, "public_comment": 1}
        )
        creator["my_review"] = review
    
    return {"creators": creators}
