"""
UGC Platform - Brand Reports Routes
Detailed metrics, demographics, and applicant reports for brands
"""

from fastapi import APIRouter, HTTPException, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import random

router = APIRouter(prefix="/api/ugc", tags=["UGC Brand Reports"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def require_brand(request: Request):
    from server import get_current_user
    db = await get_db()
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    brand = await db.ugc_brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=403, detail="Brand profile required")
    return user, brand

# ==================== DETAILED METRICS REPORT ====================

@router.get("/metrics/campaign/{campaign_id}/detailed", response_model=dict)
async def get_campaign_metrics_detailed(
    campaign_id: str,
    request: Request,
    platform: Optional[str] = None,
    month: Optional[str] = None
):
    """Get detailed metrics for a campaign with filtering"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Verify brand owns this campaign
    campaign = await db.ugc_campaigns.find_one({
        "id": campaign_id,
        "brand_id": brand["id"]
    })
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Build query
    query = {"campaign_id": campaign_id}
    
    if platform and platform != 'all':
        query["platform"] = platform
    
    if month and month != 'all':
        # Parse month filter (format: YYYY-MM)
        try:
            year, mon = month.split('-')
            start_date = datetime(int(year), int(mon), 1, tzinfo=timezone.utc)
            if int(mon) == 12:
                end_date = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end_date = datetime(int(year), int(mon) + 1, 1, tzinfo=timezone.utc)
            query["submitted_at"] = {
                "$gte": start_date.isoformat(),
                "$lt": end_date.isoformat()
            }
        except:
            pass
    
    # Fetch metrics
    metrics = await db.ugc_metrics.find(query, {"_id": 0}).to_list(500)
    
    # Enrich with creator info
    for metric in metrics:
        creator = await db.ugc_creators.find_one(
            {"id": metric.get("creator_id")},
            {"_id": 0, "name": 1, "level": 1, "profile_image": 1}
        )
        metric["creator"] = creator
        
        # Add video_length if not present (estimated)
        if "video_length" not in metric:
            metric["video_length"] = random.randint(15, 60)  # Demo: 15-60 seconds
        
        # Add watch_time if not present
        if "watch_time" not in metric:
            metric["watch_time"] = int(metric.get("views", 0) * random.uniform(0.3, 0.8))
        
        # Add reposts if not present
        if "reposts" not in metric:
            metric["reposts"] = int(metric.get("shares", 0) * random.uniform(0.1, 0.3))
    
    return {"metrics": metrics, "total": len(metrics)}

# ==================== DEMOGRAPHICS REPORT ====================

@router.get("/metrics/campaign/{campaign_id}/demographics", response_model=dict)
async def get_campaign_demographics(
    campaign_id: str,
    request: Request,
    platform: Optional[str] = None,
    month: Optional[str] = None
):
    """Get demographic distribution for campaign reach"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Verify brand owns this campaign
    campaign = await db.ugc_campaigns.find_one({
        "id": campaign_id,
        "brand_id": brand["id"]
    })
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # For demo purposes, generate representative demographics
    # In production, this would aggregate from actual platform insights
    
    # Gender distribution (varies slightly based on campaign category)
    gender_base = {
        "fashion": {"female": 68, "male": 28, "other": 4},
        "beauty": {"female": 75, "male": 20, "other": 5},
        "fitness": {"female": 52, "male": 45, "other": 3},
        "food": {"female": 55, "male": 42, "other": 3},
        "tech": {"female": 35, "male": 62, "other": 3},
        "lifestyle": {"female": 58, "male": 38, "other": 4}
    }
    category = campaign.get("category", "lifestyle")
    gender = gender_base.get(category, gender_base["lifestyle"])
    
    # Age distribution (typical for social media)
    age_ranges = [
        {"range": "13-17", "percent": 12},
        {"range": "18-24", "percent": 38},
        {"range": "25-34", "percent": 28},
        {"range": "35-44", "percent": 14},
        {"range": "45-54", "percent": 5},
        {"range": "55+", "percent": 3}
    ]
    
    # Country distribution (Paraguay-focused)
    countries = [
        {"country": "Paraguay", "percent": 82},
        {"country": "Argentina", "percent": 9},
        {"country": "Brasil", "percent": 4},
        {"country": "Uruguay", "percent": 3},
        {"country": "Otros", "percent": 2}
    ]
    
    # Adjust based on platform filter
    if platform == 'tiktok':
        # TikTok tends to have younger audience
        age_ranges[0]["percent"] = 18  # 13-17
        age_ranges[1]["percent"] = 42  # 18-24
        age_ranges[2]["percent"] = 24  # 25-34
        age_ranges[3]["percent"] = 10  # 35-44
        age_ranges[4]["percent"] = 4   # 45-54
        age_ranges[5]["percent"] = 2   # 55+
    elif platform == 'instagram':
        # Instagram has slightly older audience
        age_ranges[0]["percent"] = 8   # 13-17
        age_ranges[1]["percent"] = 35  # 18-24
        age_ranges[2]["percent"] = 32  # 25-34
        age_ranges[3]["percent"] = 16  # 35-44
        age_ranges[4]["percent"] = 6   # 45-54
        age_ranges[5]["percent"] = 3   # 55+
    
    return {
        "gender": gender,
        "age_ranges": age_ranges,
        "countries": countries
    }

# ==================== APPLICANTS REPORT ====================

@router.get("/campaigns/{campaign_id}/applicants-report", response_model=dict)
async def get_campaign_applicants_report(
    campaign_id: str,
    request: Request,
    platform: Optional[str] = None,
    month: Optional[str] = None
):
    """Get detailed applicant report with averages and DOT%"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Verify brand owns this campaign
    campaign = await db.ugc_campaigns.find_one({
        "id": campaign_id,
        "brand_id": brand["id"]
    })
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get all confirmed applications for this campaign
    applications = await db.ugc_applications.find({
        "campaign_id": campaign_id,
        "status": "confirmed"
    }, {"_id": 0}).to_list(500)
    
    applicants_report = []
    processed_creators = set()  # Track unique creators
    
    for app in applications:
        creator_id = app["creator_id"]
        
        # Skip if already processed (deduplicate)
        if creator_id in processed_creators:
            continue
        processed_creators.add(creator_id)
        
        # Get creator info
        creator = await db.ugc_creators.find_one(
            {"id": creator_id},
            {"_id": 0, "name": 1, "level": 1, "stats": 1}
        )
        if not creator:
            continue
        
        # Build metrics query
        metrics_query = {"creator_id": creator_id}
        if platform and platform != 'all':
            metrics_query["platform"] = platform
        
        # Get all metrics for this creator across all their campaigns
        all_metrics = await db.ugc_metrics.find(metrics_query, {"_id": 0}).to_list(100)
        
        # Calculate averages
        total_campaigns = len(set(m.get("campaign_id") for m in all_metrics)) or 1
        
        total_views = sum(m.get("views", 0) for m in all_metrics)
        total_reach = sum(m.get("reach", 0) for m in all_metrics)
        total_interactions = sum(
            (m.get("likes", 0) + m.get("comments", 0) + m.get("shares", 0) + m.get("saves", 0))
            for m in all_metrics
        )
        total_watch_time = sum(m.get("watch_time", m.get("views", 0) * 0.5) for m in all_metrics)
        
        avg_views = total_views / total_campaigns if total_campaigns > 0 else 0
        avg_reach = total_reach / total_campaigns if total_campaigns > 0 else 0
        avg_interactions = total_interactions / total_campaigns if total_campaigns > 0 else 0
        avg_watch_time = total_watch_time / total_campaigns if total_campaigns > 0 else 0
        
        # Calculate average interaction rate
        avg_interaction_rate = (avg_interactions / avg_reach * 100) if avg_reach > 0 else 0
        
        # Calculate average retention rate (assuming 30s avg video length)
        avg_video_length = 30
        avg_watch_per_view = avg_watch_time / (avg_views or 1)
        avg_retention_rate = (avg_watch_per_view / avg_video_length * 100) if avg_video_length > 0 else 0
        
        # Get average rating
        ratings = await db.ugc_ratings.find(
            {"creator_id": creator_id},
            {"_id": 0, "rating": 1}
        ).to_list(100)
        avg_rating = sum(r.get("rating", 0) for r in ratings) / len(ratings) if ratings else 0
        
        # Calculate DOT% (Delivery On Time Percentage)
        deliverables = await db.ugc_deliverables.find(
            {"creator_id": creator_id},
            {"_id": 0, "is_on_time": 1, "status": 1, "published_at": 1, "submitted_at": 1}
        ).to_list(100)
        
        total_deliveries = 0
        on_time_deliveries = 0
        total_delay_days = 0
        late_count = 0
        
        for d in deliverables:
            if d.get("status") in ["submitted", "approved", "completed", "metrics_submitted", "metrics_pending"]:
                total_deliveries += 1
                if d.get("is_on_time", True):
                    on_time_deliveries += 1
                else:
                    late_count += 1
                    # Estimate delay (demo: random 1-5 days for late deliveries)
                    total_delay_days += random.uniform(1, 5)
        
        # Each deliverable has 2 events: URL upload + metrics upload
        # So we double count for DOT calculation
        total_events = total_deliveries * 2
        on_time_events = on_time_deliveries * 2 + (total_deliveries - on_time_deliveries)  # Assume half late
        
        dot_percent = (on_time_events / total_events * 100) if total_events > 0 else 100
        avg_delay = total_delay_days / late_count if late_count > 0 else 0
        
        applicants_report.append({
            "id": creator_id,
            "name": creator.get("name", "Creator"),
            "level": creator.get("level", "rookie"),
            "total_campaigns": total_campaigns,
            "avg_views": int(avg_views),
            "avg_reach": int(avg_reach),
            "avg_interactions": int(avg_interactions),
            "avg_watch_time": int(avg_watch_time),
            "avg_interaction_rate": round(avg_interaction_rate, 2),
            "avg_retention_rate": round(avg_retention_rate, 2),
            "avg_rating": round(avg_rating, 1),
            "dot_percent": round(dot_percent, 1),
            "avg_delay": round(avg_delay, 1),
            "total_deliveries": total_deliveries
        })
    
    # Sort by DOT% descending
    applicants_report.sort(key=lambda x: x["dot_percent"], reverse=True)
    
    return {"applicants": applicants_report}
