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
    from routes.ugc_brands import get_brand_for_user
    db = await get_db()
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    brand = await get_brand_for_user(db, user["user_id"])
    if not brand:
        raise HTTPException(status_code=403, detail="Brand profile required")
    # Normalize id field for retrocompatibility
    if "id" not in brand and "brand_id" in brand:
        brand["id"] = brand["brand_id"]
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
    
    # Get brand_id (handle both schemas)
    brand_id = brand.get("id") or brand.get("brand_id")
    
    # Verify brand owns this campaign (handle both schemas)
    campaign = await db.ugc_campaigns.find_one({
        "$or": [{"campaign_id": campaign_id}, {"id": campaign_id}],
        "brand_id": brand_id
    }, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    camp_id = campaign.get("campaign_id") or campaign.get("id")
    
    # Get applications for this campaign (metrics link via deliverable -> application)
    applications = await db.ugc_applications.find(
        {"campaign_id": camp_id},
        {"_id": 0, "application_id": 1}
    ).to_list(1000)
    app_ids = [a["application_id"] for a in applications]
    
    # Get deliverables for these applications
    deliverables = await db.ugc_deliverables.find(
        {"application_id": {"$in": app_ids}},
        {"_id": 0, "deliverable_id": 1, "id": 1, "platform": 1}
    ).to_list(1000)
    deliverable_ids = [d.get("deliverable_id") or d.get("id") for d in deliverables]
    
    # Build query for metrics
    query = {"deliverable_id": {"$in": deliverable_ids}}
    
    if platform and platform != 'all':
        # Filter deliverables by platform first
        platform_deliverables = [d.get("deliverable_id") or d.get("id") for d in deliverables if d.get("platform") == platform]
        query["deliverable_id"] = {"$in": platform_deliverables}
    
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
    
    # Get deliverable info to find creators
    deliverable_map = {}
    for d in deliverables:
        d_id = d.get("deliverable_id") or d.get("id")
        deliverable_map[d_id] = d
    
    # Get applications to map deliverables to creators
    app_map = {a["application_id"]: a for a in applications}
    
    # Get creator and user info
    creator_ids = list(set(a.get("creator_id") for a in applications if a.get("creator_id")))
    creators = await db.ugc_creators.find(
        {"creator_id": {"$in": creator_ids}},
        {"_id": 0}
    ).to_list(len(creator_ids))
    creator_map = {c["creator_id"]: c for c in creators}
    
    # Get user names
    user_ids = [c.get("user_id") for c in creators if c.get("user_id")]
    users = await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "name": 1}).to_list(len(user_ids))
    user_map = {u["user_id"]: u["name"] for u in users}
    
    # Enrich with creator info
    for metric in metrics:
        deliverable_id = metric.get("deliverable_id")
        
        # Find the deliverable to get application_id
        deliverable = await db.ugc_deliverables.find_one(
            {"$or": [{"deliverable_id": deliverable_id}, {"id": deliverable_id}]},
            {"_id": 0, "application_id": 1, "platform": 1}
        )
        
        if deliverable:
            app_id = deliverable.get("application_id")
            app_data = app_map.get(app_id, {})
            creator_id = app_data.get("creator_id")
            creator = creator_map.get(creator_id, {})
            
            # Add name from users table
            if creator.get("user_id"):
                creator["name"] = user_map.get(creator["user_id"], "Creator")
            
            metric["creator"] = creator
            metric["platform"] = deliverable.get("platform")
        else:
            metric["creator"] = {"name": "Creator"}
        
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
    """Get demographic distribution for campaign reach - aggregated from real metrics"""
    db = await get_db()
    user, brand = await require_brand(request)
    
    # Verify brand owns this campaign
    campaign = await db.ugc_campaigns.find_one({
        "id": campaign_id,
        "brand_id": brand["id"]
    })
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get all metrics for this campaign that have demographics data
    query = {"campaign_id": campaign_id}
    if platform:
        query["platform"] = platform
    
    metrics_cursor = db.ugc_metrics.find(query, {"_id": 0, "demographics": 1})
    metrics_list = await metrics_cursor.to_list(length=100)
    
    # Aggregate demographics from all metrics
    total_gender = {"female": 0, "male": 0, "other": 0}
    total_age_ranges = {}
    total_countries = {}
    metrics_with_demographics = 0
    
    for metric in metrics_list:
        demographics = metric.get("demographics", {})
        if not demographics:
            continue
        
        # Gender aggregation
        gender = demographics.get("gender", {})
        if gender:
            metrics_with_demographics += 1
            total_gender["female"] += gender.get("female", 0)
            total_gender["male"] += gender.get("male", 0)
            total_gender["other"] += gender.get("other", 0)
        
        # Age ranges aggregation
        age_ranges = demographics.get("age_ranges", [])
        for age in age_ranges:
            range_key = age.get("range", "")
            if range_key:
                total_age_ranges[range_key] = total_age_ranges.get(range_key, 0) + age.get("percent", 0)
        
        # Countries aggregation
        countries = demographics.get("countries", [])
        for country in countries:
            country_name = country.get("country", "")
            if country_name:
                total_countries[country_name] = total_countries.get(country_name, 0) + country.get("percent", 0)
    
    # If no metrics with demographics, return empty data
    if metrics_with_demographics == 0:
        return {
            "gender": {"female": 0, "male": 0, "other": 0},
            "age_ranges": [],
            "countries": [],
            "has_data": False
        }
    
    # Average the aggregated values
    avg_gender = {
        "female": round(total_gender["female"] / metrics_with_demographics),
        "male": round(total_gender["male"] / metrics_with_demographics),
        "other": round(total_gender["other"] / metrics_with_demographics)
    }
    
    # Normalize to 100%
    gender_total = avg_gender["female"] + avg_gender["male"] + avg_gender["other"]
    if gender_total > 0:
        factor = 100 / gender_total
        avg_gender = {
            "female": round(avg_gender["female"] * factor),
            "male": round(avg_gender["male"] * factor),
            "other": 100 - round(avg_gender["female"] * factor) - round(avg_gender["male"] * factor)
        }
    
    # Format age ranges
    avg_age_ranges = [
        {"range": key, "percent": round(value / metrics_with_demographics)}
        for key, value in sorted(total_age_ranges.items())
    ]
    
    # Format countries (top 5)
    avg_countries = [
        {"country": key, "percent": round(value / metrics_with_demographics)}
        for key, value in sorted(total_countries.items(), key=lambda x: -x[1])[:5]
    ]
    
    return {
        "gender": avg_gender,
        "age_ranges": avg_age_ranges,
        "countries": avg_countries,
        "has_data": True,
        "metrics_count": metrics_with_demographics
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
