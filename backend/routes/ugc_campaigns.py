"""
UGC Platform - Campaign Routes
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from models.ugc_models import (
    Campaign, CampaignCreate, CampaignUpdate, CampaignStatus,
    ContentPlatform
)

router = APIRouter(prefix="/api/ugc/campaigns", tags=["UGC Campaigns"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def require_auth(request: Request):
    from server import require_auth as auth
    return await auth(request)

async def require_brand(request: Request):
    from server import db
    from routes.ugc_brands import get_brand_for_user
    user = await require_auth(request)
    brand = await get_brand_for_user(db, user["user_id"])
    if not brand:
        raise HTTPException(status_code=403, detail="Brand profile required")
    return user, brand

async def require_creator(request: Request):
    from server import db
    user = await require_auth(request)
    creator = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not creator:
        raise HTTPException(status_code=403, detail="Creator profile required")
    return user, creator

# ==================== PUBLIC CAMPAIGNS (FOR CREATORS) ====================

@router.get("/available", response_model=dict)
async def get_available_campaigns(
    request: Request,
    city: Optional[str] = None,
    category: Optional[str] = None,
    platform: Optional[ContentPlatform] = None,
    min_followers: Optional[int] = None,
    max_followers: Optional[int] = None,
    canje_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get available campaigns for creators to apply"""
    db = await get_db()
    
    # Build query - only live campaigns visible to creators
    query = {
        "status": CampaignStatus.LIVE,
        "visible_to_creators": {"$ne": False}  # Include campaigns without this field or with True
    }
    
    if city:
        query["city"] = city
    if category:
        query["category"] = category
    if platform:
        query["requirements.platforms"] = platform
    if canje_type:
        query["canje.type"] = canje_type
    
    # Filter by follower requirements
    if min_followers:
        query["$or"] = [
            {"requirements.min_followers": {"$lte": min_followers}},
            {"requirements.min_followers": None}
        ]
    
    campaigns = await db.ugc_campaigns.find(
        query,
        {"_id": 0}
    ).sort("published_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Check if current user is a creator and has applied
    creator_id = None
    try:
        from server import get_current_user
        user = await get_current_user(request)
        if user:
            creator = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
            if creator:
                # Support both old schema (creator_id) and new schema (id)
                creator_id = creator.get("id") or creator.get("creator_id")
    except Exception:
        pass
    
    # Enrich with brand info and check if user applied
    for campaign in campaigns:
        # Support both old schema (brand_id as PK) and new schema (id as PK)
        brand = await db.ugc_brands.find_one(
            {"$or": [{"id": campaign["brand_id"]}, {"brand_id": campaign["brand_id"]}]},
            {"_id": 0, "company_name": 1, "brand_name": 1, "logo_url": 1, "industry": 1}
        )
        if brand:
            # Ensure company_name is set (may be brand_name in old schema)
            brand["company_name"] = brand.get("company_name") or brand.get("brand_name")
        campaign["brand"] = brand
        
        # Calculate available slots correctly
        # Priority: available_slots field > (slots - slots_filled)
        if "available_slots" in campaign and campaign["available_slots"] is not None:
            campaign["slots_available"] = max(0, campaign["available_slots"])
        else:
            total_slots = campaign.get("slots", 0) or 0
            filled_slots = campaign.get("slots_filled", 0) or 0
            campaign["slots_available"] = max(0, total_slots - filled_slots)
        
        # Get campaign id (support both schemas)
        campaign_id = campaign.get("id") or campaign.get("campaign_id")
        
        # Check if creator has applied
        if creator_id:
            application = await db.ugc_applications.find_one({
                "campaign_id": campaign_id,
                "creator_id": creator_id
            })
            campaign["has_applied"] = application is not None
        else:
            campaign["has_applied"] = False
    
    # Filter out campaigns with 0 available slots (they should not be visible to creators)
    campaigns = [c for c in campaigns if c.get("slots_available", 0) > 0]
    
    total = await db.ugc_campaigns.count_documents(query)
    
    return {
        "campaigns": campaigns,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{campaign_id}", response_model=dict)
async def get_campaign_detail(campaign_id: str, request: Request = None):
    """Get campaign detail"""
    db = await get_db()
    
    # Find by id (support both schemas)
    campaign = await db.ugc_campaigns.find_one(
        {"$or": [{"id": campaign_id}, {"campaign_id": campaign_id}]}, 
        {"_id": 0}
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get brand info (support both schemas)
    brand = await db.ugc_brands.find_one(
        {"$or": [{"id": campaign["brand_id"]}, {"brand_id": campaign["brand_id"]}]},
        {"_id": 0, "company_name": 1, "brand_name": 1, "logo_url": 1, "industry": 1, "city": 1}
    )
    if brand:
        brand["company_name"] = brand.get("company_name") or brand.get("brand_name")
    campaign["brand"] = brand
    
    # Get campaign id for queries
    camp_id = campaign.get("id") or campaign.get("campaign_id")
    
    # Check if current user has applied (if authenticated)
    user_application = None
    if request:
        try:
            from server import get_current_user
            user = await get_current_user(request)
            if user:
                creator = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
                if creator:
                    creator_id = creator.get("id") or creator.get("creator_id")
                    user_application = await db.ugc_applications.find_one(
                        {"campaign_id": camp_id, "creator_id": creator_id},
                        {"_id": 0}
                    )
        except Exception:
            pass
    
    campaign["user_application"] = user_application
    campaign["slots_available"] = campaign.get("slots", 0) - campaign.get("slots_filled", 0)
    
    return campaign

# ==================== BRAND CAMPAIGN MANAGEMENT ====================

@router.post("/", response_model=dict)
async def create_campaign(
    data: CampaignCreate,
    request: Request
):
    """Create a new campaign"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Check active package
    active_package = await db.ugc_packages.find_one(
        {"brand_id": brand["brand_id"], "status": "active"}
    )
    if not active_package:
        raise HTTPException(
            status_code=400,
            detail="Necesitás un paquete activo para crear campañas"
        )
    
    # Check available deliveries
    if active_package["deliveries_remaining"] < data.slots:
        raise HTTPException(
            status_code=400,
            detail=f"No tenés suficientes entregas disponibles. Tenés {active_package['deliveries_remaining']}, necesitás {data.slots}"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Support both schemas
    brand_id = brand.get("id") or brand.get("brand_id")
    package_id = active_package.get("id") or active_package.get("package_id")
    
    campaign = {
        "id": str(uuid.uuid4()),
        "brand_id": brand_id,
        "package_id": package_id,
        "name": data.name,
        "description": data.description,
        "category": data.category,
        "city": data.city,
        "slots": data.slots,
        "slots_filled": 0,
        "requirements": data.requirements.model_dump(),
        "canje": data.canje.model_dump(),
        "timeline": data.timeline.model_dump(),
        "assets": data.assets,
        "status": CampaignStatus.DRAFT,
        "created_at": now,
        "updated_at": now,
        "published_at": None,
        "completed_at": None
    }
    
    await db.ugc_campaigns.insert_one(campaign)
    
    return {"success": True, "campaign_id": campaign["id"], "message": "Campaña creada como borrador"}

@router.put("/{campaign_id}", response_model=dict)
async def update_campaign(
    campaign_id: str,
    data: CampaignUpdate,
    request: Request
):
    """Update a campaign"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Support both schemas
    brand_id = brand.get("id") or brand.get("brand_id")
    
    campaign = await db.ugc_campaigns.find_one({
        "$or": [{"id": campaign_id}, {"campaign_id": campaign_id}], 
        "brand_id": brand_id
    })
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Can only edit draft campaigns
    if campaign["status"] != CampaignStatus.DRAFT and data.status is None:
        raise HTTPException(
            status_code=400,
            detail="Solo podés editar campañas en borrador"
        )
    
    update_data = {}
    for key, value in data.model_dump().items():
        if value is not None:
            if hasattr(value, 'model_dump'):
                update_data[key] = value.model_dump()
            else:
                update_data[key] = value
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Support both schemas for update
    camp_id = campaign.get("id") or campaign.get("campaign_id")
    await db.ugc_campaigns.update_one(
        {"$or": [{"id": camp_id}, {"campaign_id": camp_id}]},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "Campaña actualizada"}

@router.post("/{campaign_id}/publish", response_model=dict)
async def publish_campaign(
    campaign_id: str,
    request: Request
):
    """Publish a campaign (make it live)"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Support both schemas
    brand_id = brand.get("id") or brand.get("brand_id")
    
    campaign = await db.ugc_campaigns.find_one({
        "$or": [{"id": campaign_id}, {"campaign_id": campaign_id}], 
        "brand_id": brand_id
    })
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign["status"] != CampaignStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Solo podés publicar campañas en borrador")
    
    now = datetime.now(timezone.utc).isoformat()
    
    camp_id = campaign.get("id") or campaign.get("campaign_id")
    await db.ugc_campaigns.update_one(
        {"$or": [{"id": camp_id}, {"campaign_id": camp_id}]},
        {
            "$set": {
                "status": CampaignStatus.LIVE,
                "published_at": now,
                "updated_at": now
            }
        }
    )
    
    return {"success": True, "message": "Campaña publicada"}

@router.post("/{campaign_id}/close", response_model=dict)
async def close_campaign_applications(
    campaign_id: str,
    request: Request
):
    """Close campaign applications"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Support both schemas
    brand_id = brand.get("id") or brand.get("brand_id")
    
    campaign = await db.ugc_campaigns.find_one({
        "$or": [{"id": campaign_id}, {"campaign_id": campaign_id}], 
        "brand_id": brand_id
    })
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign["status"] != CampaignStatus.LIVE:
        raise HTTPException(status_code=400, detail="Solo podés cerrar campañas activas")
    
    camp_id = campaign.get("id") or campaign.get("campaign_id")
    await db.ugc_campaigns.update_one(
        {"$or": [{"id": camp_id}, {"campaign_id": camp_id}]},
        {
            "$set": {
                "status": CampaignStatus.CLOSED,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Aplicaciones cerradas"}

@router.get("/me/all", response_model=dict)
async def get_my_campaigns(
    status: Optional[CampaignStatus] = None,
    request: Request = None
):
    """Get all campaigns for current brand"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Support both schemas
    brand_id = brand.get("id") or brand.get("brand_id")
    
    query = {"brand_id": brand_id}
    if status:
        query["status"] = status
    
    campaigns = await db.ugc_campaigns.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add application counts
    for campaign in campaigns:
        # Support both schemas for campaign id
        campaign_id = campaign.get("id") or campaign.get("campaign_id")
        # Ensure id field exists for frontend
        if "id" not in campaign and campaign_id:
            campaign["id"] = campaign_id
        app_count = await db.ugc_applications.count_documents({"campaign_id": campaign_id})
        campaign["applications_count"] = app_count
    
    return {"campaigns": campaigns}

# ==================== CAMPAIGN FILTERS ====================

@router.get("/filters/cities", response_model=dict)
async def get_campaign_cities():
    """Get list of cities with active campaigns"""
    db = await get_db()
    cities = await db.ugc_campaigns.distinct("city", {"status": CampaignStatus.LIVE})
    return {"cities": cities}

@router.get("/filters/categories", response_model=dict)
async def get_campaign_categories():
    """Get list of categories with active campaigns"""
    db = await get_db()
    categories = await db.ugc_campaigns.distinct("category", {"status": CampaignStatus.LIVE})
    return {"categories": categories}
