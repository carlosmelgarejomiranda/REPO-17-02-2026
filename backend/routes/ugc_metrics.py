"""
UGC Platform - Metrics Routes
"""

from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import os

from models.ugc_models import (
    ContentMetrics, MetricsSubmit, MetricsVerify, DeliverableStatus
)

router = APIRouter(prefix="/api/ugc/metrics", tags=["UGC Metrics"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def require_auth(request: Request):
    from server import require_auth as auth
    return await auth(request)

async def require_creator(request: Request):
    from server import db
    user = await require_auth(request)
    creator = await db.ugc_creators.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not creator:
        raise HTTPException(status_code=403, detail="Creator profile required")
    return user, creator

async def require_admin(request: Request):
    from server import require_admin as admin
    return await admin(request)

# ==================== AI METRICS EXTRACTION ====================

import logging
ai_logger = logging.getLogger("ai_metrics")

async def extract_metrics_from_screenshot(screenshot_url: str, platform: str) -> dict:
    """
    Use AI (Gemini Vision) to extract basic metrics from screenshot
    Returns: {views, reach, likes, comments, shares, saves, watch_time_seconds, video_length_seconds, confidence}
    """
    try:
        from emergentintegrations.llm.gemini import GeminiClient, GeminiConfig, Message
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            ai_logger.warning("EMERGENT_LLM_KEY not configured")
            return {"error": "AI not configured", "confidence": 0}
        
        client = GeminiClient(GeminiConfig(api_key=api_key))
        
        platform_hints = {
            "instagram": """
            - "Reproducciones" or "Plays" = views
            - "Alcance" or "Reach" = reach  
            - "Me gusta" or "Likes" = likes
            - "Comentarios" or "Comments" = comments
            - "Compartidos" or "Shares" = shares
            - "Guardados" or "Saves" = saves
            - "Tiempo de visualización promedio" or "Avg watch time" = watch_time
            - "Duración" or "Duration" = video_length
            """,
            "tiktok": """
            - "Visualizaciones" or "Views" = views
            - "Me gusta" or "Likes" = likes
            - "Comentarios" or "Comments" = comments
            - "Compartidos" or "Shares" = shares
            - "Guardados" or "Saves" = saves (if visible)
            - "Tiempo de reproducción promedio" or "Avg watch time" = watch_time
            - "Duración del video" = video_length
            """
        }
        
        prompt = f"""Analyze this {platform.upper()} analytics screenshot and extract metrics.

PLATFORM SPECIFIC LABELS ({platform}):
{platform_hints.get(platform, platform_hints['instagram'])}

Return ONLY a valid JSON object with these exact fields (use null if not visible):
{{
    "views": <integer or null>,
    "reach": <integer or null>,
    "likes": <integer or null>,
    "comments": <integer or null>,
    "shares": <integer or null>,
    "saves": <integer or null>,
    "watch_time_seconds": <integer in seconds or null>,
    "video_length_seconds": <integer in seconds or null>,
    "retention_rate": <float percentage or null>,
    "confidence": <float 0.0 to 1.0>
}}

IMPORTANT CONVERSION RULES:
- K = thousands (10.5K = 10500, 1.2K = 1200)
- M = millions (1.2M = 1200000)
- mil = thousands in Spanish (10.5 mil = 10500)
- Time formats: "1:30" = 90 seconds, "2m 15s" = 135 seconds, "45s" = 45 seconds
- Percentage: "45%" retention = 45.0

Return ONLY the JSON, no explanation."""

        response = await client.send_message(
            messages=[Message(role="user", content=prompt)],
            image_url=screenshot_url
        )
        
        # Parse JSON from response
        import json
        import re
        
        # Try to extract JSON from response
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        # Clean markdown code blocks if present
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*', '', response_text)
        
        json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            ai_logger.info(f"AI extracted metrics: {data}")
            return data
        
        ai_logger.warning(f"Could not parse AI response: {response_text[:200]}")
        return {"error": "Could not parse AI response", "confidence": 0}
        
    except Exception as e:
        ai_logger.error(f"AI metrics extraction failed: {e}")
        return {"error": str(e), "confidence": 0}


async def extract_demographics_from_screenshot(screenshot_url: str, platform: str) -> dict:
    """
    Use AI (Gemini Vision) to extract demographics from analytics screenshot
    Returns: {gender, countries, age_ranges, confidence}
    """
    try:
        from emergentintegrations.llm.gemini import GeminiClient, GeminiConfig, Message
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI not configured", "confidence": 0}
        
        client = GeminiClient(GeminiConfig(api_key=api_key))
        
        prompt = f"""Analyze this {platform.upper()} analytics demographics screenshot.

Extract audience demographics data and return ONLY a valid JSON object:
{{
    "gender": {{
        "male": <percentage as float or null>,
        "female": <percentage as float or null>,
        "other": <percentage as float or null>
    }},
    "countries": [
        {{"country": "<country name>", "percentage": <float>}},
        ...
    ],
    "age_ranges": [
        {{"range": "13-17", "percentage": <float or null>}},
        {{"range": "18-24", "percentage": <float or null>}},
        {{"range": "25-34", "percentage": <float or null>}},
        {{"range": "35-44", "percentage": <float or null>}},
        {{"range": "45-54", "percentage": <float or null>}},
        {{"range": "55-64", "percentage": <float or null>}},
        {{"range": "65+", "percentage": <float or null>}}
    ],
    "top_cities": [
        {{"city": "<city name>", "percentage": <float>}},
        ...
    ],
    "confidence": <float 0.0 to 1.0>
}}

IMPORTANT:
- Extract percentages as floats (e.g., 45.5 not "45.5%")
- Include top 5 countries/cities if visible
- Age ranges may vary by platform, normalize to the ranges above
- If data is not visible, use null for that field
- Spanish labels: "Hombres"=male, "Mujeres"=female, "Edad"=age

Return ONLY the JSON, no explanation."""

        response = await client.send_message(
            messages=[Message(role="user", content=prompt)],
            image_url=screenshot_url
        )
        
        import json
        import re
        
        response_text = response.content if hasattr(response, 'content') else str(response)
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*', '', response_text)
        
        # Find JSON object (may be nested)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            ai_logger.info(f"AI extracted demographics: {list(data.keys())}")
            return data
        
        return {"error": "Could not parse AI response", "confidence": 0}
        
    except Exception as e:
        ai_logger.error(f"AI demographics extraction failed: {e}")
        return {"error": str(e), "confidence": 0}


async def extract_all_metrics(
    metrics_screenshot_url: str,
    demographics_screenshot_url: str = None,
    platform: str = "instagram"
) -> dict:
    """
    Extract both metrics and demographics from screenshots
    """
    result = {
        "metrics": {},
        "demographics": {},
        "overall_confidence": 0
    }
    
    # Extract basic metrics
    metrics_data = await extract_metrics_from_screenshot(metrics_screenshot_url, platform)
    result["metrics"] = metrics_data
    
    # Extract demographics if screenshot provided
    if demographics_screenshot_url:
        demo_data = await extract_demographics_from_screenshot(demographics_screenshot_url, platform)
        result["demographics"] = demo_data
        
        # Calculate overall confidence
        metrics_conf = metrics_data.get("confidence", 0)
        demo_conf = demo_data.get("confidence", 0)
        result["overall_confidence"] = (metrics_conf + demo_conf) / 2
    else:
        result["overall_confidence"] = metrics_data.get("confidence", 0)
    
    return result

# ==================== CREATOR: SUBMIT METRICS ====================

@router.post("/submit/{deliverable_id}", response_model=dict)
async def submit_metrics(
    deliverable_id: str,
    data: MetricsSubmit,
    request: Request
):
    """Creator submits metrics screenshot"""
    db = await get_db()
    user, creator = await require_creator(request)
    
    deliverable = await db.ugc_deliverables.find_one({
        "id": deliverable_id,
        "creator_id": creator["id"]
    })
    
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    # Check if metrics already submitted
    existing = await db.ugc_metrics.find_one({"deliverable_id": deliverable_id})
    if existing:
        raise HTTPException(status_code=400, detail="Ya subiste métricas para esta entrega")
    
    now = datetime.now(timezone.utc)
    
    # Calculate screenshot day (days since publish)
    screenshot_day = 0
    is_late = False
    if deliverable.get("published_at"):
        published = datetime.fromisoformat(deliverable["published_at"].replace('Z', '+00:00'))
        delta = now - published
        screenshot_day = delta.days
        
        # Check if late (after day 14)
        if deliverable.get("metrics_window_closes"):
            closes = datetime.fromisoformat(deliverable["metrics_window_closes"].replace('Z', '+00:00'))
            is_late = now > closes
    
    # Try AI extraction
    ai_data = await extract_metrics_from_screenshot(
        data.screenshot_url,
        deliverable.get("platform", "instagram")
    )
    
    # Use AI data or manual input
    views = data.views or ai_data.get("views")
    reach = data.reach or ai_data.get("reach")
    likes = data.likes or ai_data.get("likes", 0)
    comments = data.comments or ai_data.get("comments", 0)
    shares = data.shares or ai_data.get("shares", 0)
    saves = data.saves or ai_data.get("saves")
    
    total_interactions = (likes or 0) + (comments or 0) + (shares or 0) + (saves or 0)
    
    metrics = {
        "id": str(uuid.uuid4()),
        "deliverable_id": deliverable_id,
        "creator_id": creator["id"],
        "campaign_id": deliverable["campaign_id"],
        "platform": deliverable.get("platform", "instagram"),
        "views": views,
        "reach": reach,
        "likes": likes,
        "comments": comments,
        "shares": shares,
        "saves": saves,
        "total_interactions": total_interactions,
        "engagement_rate": None,  # Calculate if we have views
        "screenshot_url": data.screenshot_url,
        "screenshot_day": screenshot_day,
        "ai_extracted": ai_data.get("confidence", 0) > 0.5,
        "ai_confidence": ai_data.get("confidence", 0),
        "ai_raw_data": ai_data,
        "manually_verified": False,
        "verified_by": None,
        "is_late": is_late,
        "submitted_at": now.isoformat(),
        "created_at": now.isoformat()
    }
    
    # Calculate engagement rate
    if views and views > 0:
        metrics["engagement_rate"] = round((total_interactions / views) * 100, 2)
    
    await db.ugc_metrics.insert_one(metrics)
    
    # Update deliverable status
    new_status = DeliverableStatus.METRICS_LATE if is_late else DeliverableStatus.METRICS_SUBMITTED
    
    await db.ugc_deliverables.update_one(
        {"id": deliverable_id},
        {
            "$set": {
                "status": new_status,
                "metrics_submitted_at": now.isoformat(),
                "metrics_is_late": is_late,
                "updated_at": now.isoformat()
            },
            "$push": {
                "status_history": {
                    "status": new_status,
                    "timestamp": now.isoformat(),
                    "by": "creator"
                }
            }
        }
    )
    
    # Update creator stats
    await update_creator_stats(db, creator["id"])
    
    # Send WhatsApp notification to admin
    try:
        from services.ugc_emails import notify_metrics_submitted
        campaign = await db.ugc_campaigns.find_one({"id": deliverable["campaign_id"]}, {"_id": 0, "name": 1})
        await notify_metrics_submitted(
            campaign_name=campaign.get("name", "Campaña") if campaign else "Campaña",
            creator_name=creator.get("name", "Creator"),
            platform=deliverable.get("platform", "instagram"),
            views=views or 0,
            likes=likes or 0
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send metrics notification: {e}")
    
    return {
        "success": True,
        "metrics_id": metrics["id"],
        "ai_confidence": ai_data.get("confidence", 0),
        "is_late": is_late,
        "message": "Métricas enviadas" + (" (tarde)" if is_late else "")
    }

async def update_creator_stats(db, creator_id: str):
    """Update creator's aggregate stats after new metrics"""
    # Get all verified metrics for this creator
    metrics = await db.ugc_metrics.find(
        {"creator_id": creator_id},
        {"_id": 0}
    ).to_list(500)
    
    if not metrics:
        return
    
    # Calculate averages and maxes
    stats = {
        "avg_views": {},
        "avg_reach": {},
        "avg_interactions": {},
        "max_views": {},
        "max_reach": {},
        "max_interactions": {}
    }
    
    platform_metrics = {}
    for m in metrics:
        platform = m.get("platform", "instagram")
        if platform not in platform_metrics:
            platform_metrics[platform] = {"views": [], "reach": [], "interactions": []}
        
        if m.get("views"):
            platform_metrics[platform]["views"].append(m["views"])
        if m.get("reach"):
            platform_metrics[platform]["reach"].append(m["reach"])
        if m.get("total_interactions"):
            platform_metrics[platform]["interactions"].append(m["total_interactions"])
    
    for platform, data in platform_metrics.items():
        if data["views"]:
            stats["avg_views"][platform] = sum(data["views"]) / len(data["views"])
            stats["max_views"][platform] = max(data["views"])
        if data["reach"]:
            stats["avg_reach"][platform] = sum(data["reach"]) / len(data["reach"])
            stats["max_reach"][platform] = max(data["reach"])
        if data["interactions"]:
            stats["avg_interactions"][platform] = sum(data["interactions"]) / len(data["interactions"])
            stats["max_interactions"][platform] = max(data["interactions"])
    
    # Get delivery stats
    deliverables = await db.ugc_deliverables.find(
        {"creator_id": creator_id, "status": {"$in": ["completed", "metrics_verified"]}},
        {"_id": 0, "is_on_time": 1, "delivery_lag_hours": 1}
    ).to_list(500)
    
    if deliverables:
        on_time_count = sum(1 for d in deliverables if d.get("is_on_time", True))
        stats["delivery_on_time_rate"] = round((on_time_count / len(deliverables)) * 100, 1)
        
        lags = [d["delivery_lag_hours"] for d in deliverables if d.get("delivery_lag_hours")]
        if lags:
            stats["avg_delivery_lag_hours"] = round(sum(lags) / len(lags), 1)
    
    # Update creator profile
    await db.ugc_creators.update_one(
        {"id": creator_id},
        {"$set": {f"stats.{k}": v for k, v in stats.items()}}
    )

# ==================== ADMIN: ALL METRICS ====================

@router.get("/all", response_model=dict)
async def get_all_metrics(
    request: Request,
    skip: int = 0,
    limit: int = 100
):
    """Get all metrics with creator and campaign info"""
    await require_admin(request)
    db = await get_db()
    
    metrics = await db.ugc_metrics.find(
        {},
        {"_id": 0}
    ).sort("submitted_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with creator and campaign info
    for metric in metrics:
        creator = await db.ugc_creators.find_one(
            {"id": metric.get("creator_id")},
            {"_id": 0, "name": 1, "level": 1}
        )
        campaign = await db.ugc_campaigns.find_one(
            {"id": metric.get("campaign_id")},
            {"_id": 0, "name": 1, "brand_id": 1}
        )
        metric["creator"] = creator
        metric["campaign"] = campaign
    
    total = await db.ugc_metrics.count_documents({})
    
    return {"metrics": metrics, "total": total}

# ==================== ADMIN: VERIFY METRICS ====================

@router.get("/pending-verification", response_model=dict)
async def get_pending_verification(request: Request):
    """Get metrics pending verification (low AI confidence)"""
    await require_admin(request)
    db = await get_db()
    
    metrics = await db.ugc_metrics.find(
        {
            "manually_verified": False,
            "ai_confidence": {"$lt": 0.7}
        },
        {"_id": 0}
    ).sort("submitted_at", -1).to_list(50)
    
    return {"pending": metrics}

@router.post("/{metrics_id}/verify", response_model=dict)
async def verify_metrics(
    metrics_id: str,
    data: MetricsVerify,
    request: Request
):
    """Admin verifies/corrects metrics"""
    user = await require_admin(request)
    db = await get_db()
    
    metrics = await db.ugc_metrics.find_one({"id": metrics_id})
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found")
    
    total_interactions = data.likes + data.comments + data.shares + (data.saves or 0)
    engagement_rate = round((total_interactions / data.views) * 100, 2) if data.views else None
    
    await db.ugc_metrics.update_one(
        {"id": metrics_id},
        {
            "$set": {
                "views": data.views,
                "reach": data.reach,
                "likes": data.likes,
                "comments": data.comments,
                "shares": data.shares,
                "saves": data.saves,
                "total_interactions": total_interactions,
                "engagement_rate": engagement_rate,
                "manually_verified": True,
                "verified_by": user["user_id"]
            }
        }
    )
    
    # Update deliverable status
    await db.ugc_deliverables.update_one(
        {"id": metrics["deliverable_id"]},
        {
            "$set": {
                "status": DeliverableStatus.METRICS_VERIFIED,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update creator stats
    await update_creator_stats(db, metrics["creator_id"])
    
    return {"success": True, "message": "Métricas verificadas"}

# ==================== CAMPAIGN REPORTING ====================

@router.get("/campaign/{campaign_id}/report", response_model=dict)
async def get_campaign_metrics_report(
    campaign_id: str,
    request: Request
):
    """Get aggregated metrics report for a campaign"""
    db = await get_db()
    await require_auth(request)
    
    # Get all metrics for this campaign
    metrics = await db.ugc_metrics.find(
        {"campaign_id": campaign_id},
        {"_id": 0}
    ).to_list(100)
    
    if not metrics:
        return {"report": None, "message": "No hay métricas todavía"}
    
    # Aggregate
    total_views = sum(m.get("views", 0) or 0 for m in metrics)
    total_reach = sum(m.get("reach", 0) or 0 for m in metrics)
    total_interactions = sum(m.get("total_interactions", 0) for m in metrics)
    
    avg_views = total_views / len(metrics) if metrics else 0
    avg_reach = total_reach / len(metrics) if metrics else 0
    avg_interactions = total_interactions / len(metrics) if metrics else 0
    
    # Top performers
    sorted_by_views = sorted(metrics, key=lambda x: x.get("views", 0) or 0, reverse=True)
    top_posts = sorted_by_views[:3]
    
    # On-time stats
    deliverables = await db.ugc_deliverables.find(
        {"campaign_id": campaign_id},
        {"_id": 0, "is_on_time": 1, "delivery_lag_hours": 1, "metrics_is_late": 1}
    ).to_list(100)
    
    on_time_delivery = sum(1 for d in deliverables if d.get("is_on_time", True))
    on_time_metrics = sum(1 for d in deliverables if not d.get("metrics_is_late", False))
    
    report = {
        "total_deliverables": len(deliverables),
        "metrics_submitted": len(metrics),
        "totals": {
            "views": total_views,
            "reach": total_reach,
            "interactions": total_interactions
        },
        "averages": {
            "views": round(avg_views),
            "reach": round(avg_reach),
            "interactions": round(avg_interactions)
        },
        "top_posts": top_posts,
        "operational": {
            "on_time_delivery_rate": round((on_time_delivery / len(deliverables)) * 100, 1) if deliverables else 100,
            "on_time_metrics_rate": round((on_time_metrics / len(deliverables)) * 100, 1) if deliverables else 100
        }
    }
    
    return {"report": report}
