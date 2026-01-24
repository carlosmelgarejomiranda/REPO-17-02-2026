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


# ==================== CREATOR METRICS ENDPOINT ====================

@router.get("/me", response_model=dict)
async def get_my_metrics(
    request: Request,
    time_range: str = "all"  # all, 30d, 90d, year
):
    """
    Get all metrics submitted by the current creator.
    Used for the Creator Reports page.
    """
    db = await get_db()
    user, creator = await require_creator(request)
    
    # Build query with optional time filter
    query = {"creator_id": creator["id"]}
    
    if time_range == "30d":
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        query["submitted_at"] = {"$gte": cutoff.isoformat()}
    elif time_range == "90d":
        cutoff = datetime.now(timezone.utc) - timedelta(days=90)
        query["submitted_at"] = {"$gte": cutoff.isoformat()}
    elif time_range == "year":
        cutoff = datetime.now(timezone.utc).replace(month=1, day=1, hour=0, minute=0, second=0)
        query["submitted_at"] = {"$gte": cutoff.isoformat()}
    
    # Get metrics
    metrics_cursor = db.ugc_metrics.find(query, {"_id": 0}).sort("submitted_at", -1)
    metrics = await metrics_cursor.to_list(100)
    
    # Enrich with campaign names
    campaign_ids = list(set(m.get("campaign_id") for m in metrics if m.get("campaign_id")))
    campaigns = {}
    if campaign_ids:
        campaigns_cursor = db.ugc_campaigns.find(
            {"id": {"$in": campaign_ids}},
            {"_id": 0, "id": 1, "name": 1}
        )
        campaigns_list = await campaigns_cursor.to_list(100)
        campaigns = {c["id"]: c.get("name", "Campaña") for c in campaigns_list}
    
    # Add campaign names to metrics
    for m in metrics:
        m["campaign_name"] = campaigns.get(m.get("campaign_id"), "Campaña")
    
    return {"metrics": metrics}


# ==================== AI METRICS EXTRACTION ====================

import logging
import aiohttp
import base64

ai_logger = logging.getLogger("ai_metrics")

async def download_image_as_base64(url: str) -> tuple:
    """Download image from URL and return base64 + mime type"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=30) as response:
                if response.status == 200:
                    content = await response.read()
                    content_type = response.headers.get('content-type', 'image/jpeg')
                    # Map content type to supported format
                    if 'png' in content_type:
                        mime = 'image/png'
                    elif 'webp' in content_type:
                        mime = 'image/webp'
                    else:
                        mime = 'image/jpeg'
                    
                    b64 = base64.b64encode(content).decode('utf-8')
                    return b64, mime
    except Exception as e:
        ai_logger.error(f"Failed to download image: {e}")
    return None, None


async def extract_metrics_from_screenshot(screenshot_url: str, platform: str) -> dict:
    """
    Use AI (Gemini/OpenAI Vision) to extract basic metrics from screenshot
    Returns: {views, reach, likes, comments, shares, saves, watch_time_seconds, video_length_seconds, confidence}
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            ai_logger.warning("EMERGENT_LLM_KEY not configured")
            return {"error": "AI not configured", "confidence": 0}
        
        # Download image and convert to base64
        image_b64, mime_type = await download_image_as_base64(screenshot_url)
        if not image_b64:
            return {"error": "Could not download image", "confidence": 0}
        
        # Initialize chat with vision model
        chat = LlmChat(
            api_key=api_key,
            session_id=f"metrics-{uuid.uuid4().hex[:8]}",
            system_message="You are an expert at extracting metrics data from social media analytics screenshots. Always respond with valid JSON only."
        ).with_model("gemini", "gemini-2.5-flash")
        
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

        # Create message with image
        image_content = ImageContent(image_base64=image_b64)
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        import json
        import re
        
        response_text = str(response)
        
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
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI not configured", "confidence": 0}
        
        # Download image and convert to base64
        image_b64, mime_type = await download_image_as_base64(screenshot_url)
        if not image_b64:
            return {"error": "Could not download image", "confidence": 0}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"demo-{uuid.uuid4().hex[:8]}",
            system_message="You are an expert at extracting demographic data from social media analytics screenshots. Always respond with valid JSON only."
        ).with_model("gemini", "gemini-2.5-flash")
        
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

        image_content = ImageContent(image_base64=image_b64)
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        import json
        import re
        
        response_text = str(response)
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
    
    # Calculate screenshot day and on-time status based on CONFIRMATION date (not publish date)
    screenshot_day = 0
    is_late = False
    
    # Get confirmation date from deliverable or application
    confirmed_at = None
    if deliverable.get("confirmed_at"):
        confirmed_at = datetime.fromisoformat(deliverable["confirmed_at"].replace('Z', '+00:00'))
    else:
        # Fallback: try to get from application
        application = await db.ugc_applications.find_one({
            "campaign_id": deliverable["campaign_id"],
            "creator_id": creator["id"]
        })
        if application and application.get("confirmed_at"):
            confirmed_at = datetime.fromisoformat(application["confirmed_at"].replace('Z', '+00:00'))
        elif deliverable.get("created_at"):
            # Last fallback: deliverable creation date
            confirmed_at = datetime.fromisoformat(deliverable["created_at"].replace('Z', '+00:00'))
    
    if confirmed_at:
        delta = now - confirmed_at
        screenshot_day = delta.days
        
        # On-time = within 14 days of confirmation
        is_late = delta.days > 14
    
    platform = deliverable.get("platform", "instagram")
    
    # Try AI extraction (both metrics and demographics)
    ai_result = await extract_all_metrics(
        metrics_screenshot_url=data.screenshot_url,
        demographics_screenshot_url=data.demographics_screenshot_url,
        platform=platform
    )
    
    ai_metrics = ai_result.get("metrics", {})
    ai_demographics = ai_result.get("demographics", {})
    
    # Use AI data or manual input
    views = data.views or ai_metrics.get("views")
    reach = data.reach or ai_metrics.get("reach")
    likes = data.likes or ai_metrics.get("likes", 0)
    comments = data.comments or ai_metrics.get("comments", 0)
    shares = data.shares or ai_metrics.get("shares", 0)
    saves = data.saves or ai_metrics.get("saves")
    watch_time = data.watch_time_seconds or ai_metrics.get("watch_time_seconds")
    video_length = data.video_length_seconds or ai_metrics.get("video_length_seconds")
    retention_rate = ai_metrics.get("retention_rate")
    
    total_interactions = (likes or 0) + (comments or 0) + (shares or 0) + (saves or 0)
    
    metrics = {
        "id": str(uuid.uuid4()),
        "deliverable_id": deliverable_id,
        "creator_id": creator["id"],
        "campaign_id": deliverable["campaign_id"],
        "platform": platform,
        # Basic metrics
        "views": views,
        "reach": reach,
        "likes": likes,
        "comments": comments,
        "shares": shares,
        "saves": saves,
        # Video metrics
        "watch_time_seconds": watch_time,
        "video_length_seconds": video_length,
        "retention_rate": retention_rate,
        # Calculated
        "total_interactions": total_interactions,
        "engagement_rate": None,
        # Demographics (from AI)
        "demographics": ai_demographics if ai_demographics.get("confidence", 0) > 0.3 else None,
        # Screenshots
        "screenshot_url": data.screenshot_url,
        "demographics_screenshot_url": data.demographics_screenshot_url,
        "screenshot_day": screenshot_day,
        # AI Processing
        "ai_extracted": ai_result.get("overall_confidence", 0) > 0.5,
        "ai_confidence": ai_result.get("overall_confidence", 0),
        "ai_raw_data": {
            "metrics": ai_metrics,
            "demographics": ai_demographics
        },
        "manually_verified": False,
        "verified_by": None,
        "is_late": is_late,
        "submitted_at": now.isoformat(),
        "created_at": now.isoformat()
    }
    
    # Calculate engagement rate
    if views and views > 0:
        metrics["engagement_rate"] = round((total_interactions / views) * 100, 2)
    
    # Calculate retention rate if we have both watch time and video length
    if watch_time and video_length and video_length > 0:
        metrics["retention_rate"] = round((watch_time / video_length) * 100, 2)
    
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
    
    # Send notifications
    try:
        campaign = await db.ugc_campaigns.find_one({"id": deliverable["campaign_id"]}, {"_id": 0, "name": 1, "brand_id": 1})
        campaign_name = campaign.get("name", "Campaña") if campaign else "Campaña"
        
        # Get brand info
        brand = await db.ugc_brands.find_one({"id": campaign.get("brand_id")}, {"_id": 0, "company_name": 1, "email": 1}) if campaign else None
        brand_name = brand.get("company_name", "Marca") if brand else "Marca"
        brand_email = brand.get("email") if brand else None
        
        from services.ugc_emails import (
            send_metrics_submitted_to_creator,
            send_metrics_submitted_to_brand,
            notify_metrics_submitted_whatsapp
        )
        
        # 1. Email al creador confirmando sus métricas
        if creator.get("email"):
            await send_metrics_submitted_to_creator(
                to_email=creator.get("email"),
                creator_name=creator.get("name", "Creator"),
                campaign_name=campaign_name,
                brand_name=brand_name
            )
        
        # 2. Email a la marca notificando métricas recibidas
        if brand_email:
            await send_metrics_submitted_to_brand(
                to_email=brand_email,
                brand_name=brand_name,
                campaign_name=campaign_name,
                creator_name=creator.get("name", "Creator")
            )
        
        # 3. WhatsApp notification to admin
        await notify_metrics_submitted_whatsapp(
            creator_name=creator.get("name", "Creator"),
            campaign_name=campaign_name,
            brand_name=brand_name
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send metrics notification: {e}")
    
    return {
        "success": True,
        "metrics_id": metrics["id"],
        "ai_confidence": ai_result.get("overall_confidence", 0),
        "is_late": is_late,
        "message": "Métricas enviadas" + (" (tarde)" if is_late else "")
    }


# ==================== V2: MULTI-IMAGE METRICS SUBMISSION ====================

from pydantic import BaseModel
from typing import List, Optional as OptionalType

class MetricsSubmitV2(BaseModel):
    instagram_screenshots: List[str] = []  # List of base64 images
    tiktok_screenshots: List[str] = []  # List of base64 images
    manual_metrics: OptionalType[dict] = None

async def extract_metrics_from_base64(image_base64: str, platform: str) -> dict:
    """
    Use AI to extract metrics from a base64 image
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            ai_logger.warning("EMERGENT_LLM_KEY not configured")
            return {"error": "AI not configured", "confidence": 0}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"metrics-v2-{uuid.uuid4().hex[:8]}",
            system_message="You are an expert at extracting metrics and demographic data from social media analytics screenshots. Always respond with valid JSON only."
        ).with_model("gemini", "gemini-2.5-flash")
        
        prompt = f"""Analyze this {platform.upper()} analytics screenshot and extract ALL available data.

Return ONLY a valid JSON object with these fields (use null if not visible):
{{
    "metrics": {{
        "views": <integer or null>,
        "reach": <integer or null>,
        "likes": <integer or null>,
        "comments": <integer or null>,
        "shares": <integer or null>,
        "saves": <integer or null>,
        "watch_time_seconds": <integer in seconds or null>,
        "video_length_seconds": <integer in seconds or null>,
        "retention_rate": <float percentage or null>
    }},
    "demographics": {{
        "gender": {{
            "male": <percentage as float or null>,
            "female": <percentage as float or null>
        }},
        "countries": [
            {{"country": "<country>", "percentage": <float>}}
        ],
        "cities": [
            {{"city": "<city>", "percentage": <float>}}
        ],
        "age_ranges": [
            {{"range": "18-24", "percentage": <float>}},
            {{"range": "25-34", "percentage": <float>}},
            {{"range": "35-44", "percentage": <float>}}
        ]
    }},
    "screenshot_type": "<metrics|demographics|mixed>",
    "confidence": <float 0.0 to 1.0>
}}

CONVERSION RULES:
- K = thousands (10.5K = 10500)
- M = millions (1.2M = 1200000)  
- mil = thousands in Spanish
- Time: "1:30" = 90 seconds, "2m 15s" = 135 seconds
- Spanish labels: "Reproducciones"=views, "Alcance"=reach, "Me gusta"=likes, "Hombres"=male, "Mujeres"=female

Return ONLY the JSON, no explanation."""

        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        import json
        import re
        
        response_text = str(response)
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*', '', response_text)
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            ai_logger.info(f"AI V2 extracted: {data.get('screenshot_type', 'unknown')} with confidence {data.get('confidence', 0)}")
            return data
        
        ai_logger.warning(f"Could not parse AI V2 response: {response_text[:200]}")
        return {"error": "Could not parse AI response", "confidence": 0}
        
    except Exception as e:
        ai_logger.error(f"AI V2 extraction failed: {e}")
        return {"error": str(e), "confidence": 0}


async def merge_extracted_data(extractions: List[dict]) -> dict:
    """
    Merge data extracted from multiple screenshots.
    Takes the value with highest confidence when conflicts exist.
    """
    merged_metrics = {
        "views": None,
        "reach": None,
        "likes": None,
        "comments": None,
        "shares": None,
        "saves": None,
        "watch_time_seconds": None,
        "video_length_seconds": None,
        "retention_rate": None
    }
    
    merged_demographics = {
        "gender": {"male": None, "female": None},
        "countries": [],
        "cities": [],
        "age_ranges": []
    }
    
    metrics_confidences = {}
    demo_confidence = 0
    
    for extraction in extractions:
        if extraction.get("error"):
            continue
            
        confidence = extraction.get("confidence", 0)
        
        # Merge metrics
        metrics = extraction.get("metrics", {})
        for key, value in metrics.items():
            if value is not None:
                # Keep value with higher confidence or first non-null
                if merged_metrics.get(key) is None or confidence > metrics_confidences.get(key, 0):
                    merged_metrics[key] = value
                    metrics_confidences[key] = confidence
        
        # Merge demographics
        demo = extraction.get("demographics", {})
        if demo:
            demo_conf = confidence
            
            # Gender
            gender = demo.get("gender", {})
            if gender.get("male") is not None and (merged_demographics["gender"]["male"] is None or demo_conf > demo_confidence):
                merged_demographics["gender"]["male"] = gender["male"]
            if gender.get("female") is not None and (merged_demographics["gender"]["female"] is None or demo_conf > demo_confidence):
                merged_demographics["gender"]["female"] = gender["female"]
            
            # Countries - merge and deduplicate
            countries = demo.get("countries", [])
            if countries:
                existing_countries = {c["country"]: c for c in merged_demographics["countries"]}
                for c in countries:
                    if c.get("country"):
                        existing_countries[c["country"]] = c
                merged_demographics["countries"] = list(existing_countries.values())[:10]
            
            # Cities - merge and deduplicate
            cities = demo.get("cities", [])
            if cities:
                existing_cities = {c["city"]: c for c in merged_demographics["cities"]}
                for c in cities:
                    if c.get("city"):
                        existing_cities[c["city"]] = c
                merged_demographics["cities"] = list(existing_cities.values())[:10]
            
            # Age ranges - take the one with more data
            age_ranges = demo.get("age_ranges", [])
            if len(age_ranges) > len(merged_demographics["age_ranges"]):
                merged_demographics["age_ranges"] = age_ranges
            
            if demo_conf > demo_confidence:
                demo_confidence = demo_conf
    
    # Calculate overall confidence
    all_confidences = list(metrics_confidences.values()) + ([demo_confidence] if demo_confidence > 0 else [])
    overall_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0
    
    return {
        "metrics": merged_metrics,
        "demographics": merged_demographics,
        "overall_confidence": overall_confidence
    }


@router.post("/submit-v2/{deliverable_id}", response_model=dict)
async def submit_metrics_v2(
    deliverable_id: str,
    data: MetricsSubmitV2,
    request: Request
):
    """
    V2: Creator submits multiple screenshots per platform.
    AI extracts both metrics and demographics from all images.
    """
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
    
    if not data.instagram_screenshots and not data.tiktok_screenshots:
        raise HTTPException(status_code=400, detail="Sube al menos un screenshot")
    
    now = datetime.now(timezone.utc)
    
    # Calculate screenshot day and on-time status
    screenshot_day = 0
    is_late = False
    
    confirmed_at = None
    if deliverable.get("confirmed_at"):
        confirmed_at = datetime.fromisoformat(deliverable["confirmed_at"].replace('Z', '+00:00'))
    else:
        application = await db.ugc_applications.find_one({
            "campaign_id": deliverable["campaign_id"],
            "creator_id": creator["id"]
        })
        if application and application.get("confirmed_at"):
            confirmed_at = datetime.fromisoformat(application["confirmed_at"].replace('Z', '+00:00'))
        elif deliverable.get("created_at"):
            confirmed_at = datetime.fromisoformat(deliverable["created_at"].replace('Z', '+00:00'))
    
    if confirmed_at:
        delta = now - confirmed_at
        screenshot_day = delta.days
        is_late = delta.days > 14
    
    # Process all screenshots with AI
    ai_logger.info(f"Processing V2 submission: {len(data.instagram_screenshots)} IG, {len(data.tiktok_screenshots)} TT")
    
    all_extractions = []
    
    # Process all screenshots in PARALLEL for speed
    ai_logger.info(f"Processing V2 submission in PARALLEL: {len(data.instagram_screenshots)} IG, {len(data.tiktok_screenshots)} TT")
    
    import asyncio
    
    async def process_screenshot(img_b64: str, platform: str, index: int) -> dict:
        """Process a single screenshot and return extraction with metadata"""
        try:
            ai_logger.info(f"Processing {platform} screenshot {index+1}")
            extraction = await extract_metrics_from_base64(img_b64, platform)
            extraction["platform"] = platform
            extraction["image_index"] = index
            return extraction
        except Exception as e:
            ai_logger.error(f"Error processing {platform} screenshot {index+1}: {e}")
            return {"error": str(e), "platform": platform, "image_index": index, "confidence": 0}
    
    # Create tasks for all images
    tasks = []
    
    # Instagram tasks
    for i, img_b64 in enumerate(data.instagram_screenshots[:10]):
        tasks.append(process_screenshot(img_b64, "instagram", i))
    
    # TikTok tasks
    for i, img_b64 in enumerate(data.tiktok_screenshots[:10]):
        tasks.append(process_screenshot(img_b64, "tiktok", i))
    
    # Process all in parallel (with semaphore to limit concurrency)
    if tasks:
        ai_logger.info(f"Starting parallel processing of {len(tasks)} images...")
        all_extractions = await asyncio.gather(*tasks, return_exceptions=True)
        # Filter out exceptions and convert to list
        all_extractions = [
            e if isinstance(e, dict) else {"error": str(e), "confidence": 0}
            for e in all_extractions
        ]
        ai_logger.info(f"Parallel processing complete. Got {len(all_extractions)} results.")
    
    # Merge all extracted data
    merged_result = await merge_extracted_data(all_extractions)
    
    ai_metrics = merged_result.get("metrics", {})
    ai_demographics = merged_result.get("demographics", {})
    
    # Use AI data or manual input
    manual = data.manual_metrics or {}
    views = manual.get("views") or ai_metrics.get("views")
    reach = manual.get("reach") or ai_metrics.get("reach")
    likes = manual.get("likes") or ai_metrics.get("likes", 0)
    comments = manual.get("comments") or ai_metrics.get("comments", 0)
    shares = manual.get("shares") or ai_metrics.get("shares", 0)
    saves = manual.get("saves") or ai_metrics.get("saves")
    watch_time = manual.get("watch_time_seconds") or ai_metrics.get("watch_time_seconds")
    video_length = manual.get("video_length_seconds") or ai_metrics.get("video_length_seconds")
    retention_rate = ai_metrics.get("retention_rate")
    
    total_interactions = (likes or 0) + (comments or 0) + (shares or 0) + (saves or 0)
    
    # Determine primary platform
    platform = "instagram" if data.instagram_screenshots else "tiktok"
    if data.instagram_screenshots and data.tiktok_screenshots:
        platform = "multi"  # Content on both platforms
    
    metrics = {
        "id": str(uuid.uuid4()),
        "deliverable_id": deliverable_id,
        "creator_id": creator["id"],
        "campaign_id": deliverable["campaign_id"],
        "platform": platform,
        # Basic metrics
        "views": views,
        "reach": reach,
        "likes": likes,
        "comments": comments,
        "shares": shares,
        "saves": saves,
        # Video metrics
        "watch_time_seconds": watch_time,
        "video_length_seconds": video_length,
        "retention_rate": retention_rate,
        # Calculated
        "total_interactions": total_interactions,
        "engagement_rate": None,
        # Demographics (from AI)
        "demographics": ai_demographics if merged_result.get("overall_confidence", 0) > 0.3 else None,
        # Screenshots info
        "screenshots_count": {
            "instagram": len(data.instagram_screenshots),
            "tiktok": len(data.tiktok_screenshots)
        },
        "screenshot_day": screenshot_day,
        # AI Processing
        "ai_extracted": merged_result.get("overall_confidence", 0) > 0.5,
        "ai_confidence": merged_result.get("overall_confidence", 0),
        "ai_raw_data": {
            "extractions": all_extractions,
            "merged": merged_result
        },
        "manually_verified": False,
        "verified_by": None,
        "is_late": is_late,
        "submitted_at": now.isoformat(),
        "created_at": now.isoformat()
    }
    
    # Calculate engagement rate
    if views and views > 0:
        metrics["engagement_rate"] = round((total_interactions / views) * 100, 2)
    
    # Calculate retention rate if we have both watch time and video length
    if watch_time and video_length and video_length > 0:
        metrics["retention_rate"] = round((watch_time / video_length) * 100, 2)
    
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
    
    # Send notifications
    try:
        campaign = await db.ugc_campaigns.find_one({"id": deliverable["campaign_id"]}, {"_id": 0, "name": 1, "brand_id": 1})
        campaign_name = campaign.get("name", "Campaña") if campaign else "Campaña"
        
        brand = await db.ugc_brands.find_one({"id": campaign.get("brand_id")}, {"_id": 0, "company_name": 1, "email": 1}) if campaign else None
        brand_name = brand.get("company_name", "Marca") if brand else "Marca"
        brand_email = brand.get("email") if brand else None
        
        from services.ugc_emails import (
            send_metrics_submitted_to_creator,
            send_metrics_submitted_to_brand,
            notify_metrics_submitted_whatsapp
        )
        
        if creator.get("email"):
            await send_metrics_submitted_to_creator(
                to_email=creator.get("email"),
                creator_name=creator.get("name", "Creator"),
                campaign_name=campaign_name,
                brand_name=brand_name
            )
        
        if brand_email:
            await send_metrics_submitted_to_brand(
                to_email=brand_email,
                brand_name=brand_name,
                campaign_name=campaign_name,
                creator_name=creator.get("name", "Creator")
            )
        
        await notify_metrics_submitted_whatsapp(
            creator_name=creator.get("name", "Creator"),
            campaign_name=campaign_name,
            brand_name=brand_name
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send metrics notification: {e}")
    
    return {
        "success": True,
        "metrics_id": metrics["id"],
        "ai_confidence": merged_result.get("overall_confidence", 0),
        "screenshots_processed": {
            "instagram": len(data.instagram_screenshots),
            "tiktok": len(data.tiktok_screenshots)
        },
        "extracted_data": {
            "metrics": ai_metrics,
            "demographics_found": bool(ai_demographics.get("gender", {}).get("male") or ai_demographics.get("countries"))
        },
        "is_late": is_late,
        "message": f"Métricas enviadas - {len(data.instagram_screenshots) + len(data.tiktok_screenshots)} imágenes procesadas" + (" (tarde)" if is_late else "")
    }


async def update_creator_stats(db, creator_id: str):
    """Update creator's aggregate stats after new metrics"""
    # Get all metrics for this creator
    metrics = await db.ugc_metrics.find(
        {"creator_id": creator_id},
        {"_id": 0}
    ).to_list(500)
    
    # Calculate platform-specific averages
    stats = {
        "avg_views": {},
        "avg_reach": {},
        "avg_interactions": {},
        "max_views": {},
        "max_reach": {},
        "max_interactions": {}
    }
    
    total_views = 0
    total_reach = 0
    
    if metrics:
        platform_metrics = {}
        for m in metrics:
            platform = m.get("platform", "instagram")
            if platform not in platform_metrics:
                platform_metrics[platform] = {"views": [], "reach": [], "interactions": []}
            
            if m.get("views"):
                platform_metrics[platform]["views"].append(m["views"])
                total_views += m["views"]
            if m.get("reach"):
                platform_metrics[platform]["reach"].append(m["reach"])
                total_reach += m["reach"]
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
    
    # Count completed campaigns (campaigns where creator submitted metrics)
    completed_campaign_ids = set()
    for m in metrics:
        if m.get("campaign_id"):
            completed_campaign_ids.add(m["campaign_id"])
    
    completed_campaigns = len(completed_campaign_ids)
    
    # Get delivery stats - include metrics_submitted status
    deliverables = await db.ugc_deliverables.find(
        {
            "creator_id": creator_id, 
            "status": {"$in": ["completed", "metrics_verified", "metrics_submitted", "metrics_late"]}
        },
        {"_id": 0, "is_on_time": 1, "delivery_lag_hours": 1, "metrics_is_late": 1}
    ).to_list(500)
    
    delivery_on_time_rate = 100  # Default to 100% if no deliverables
    if deliverables:
        # Count on-time deliveries (not late)
        on_time_count = sum(1 for d in deliverables if not d.get("metrics_is_late", False) and d.get("is_on_time", True))
        delivery_on_time_rate = round((on_time_count / len(deliverables)) * 100, 1)
        
        lags = [d["delivery_lag_hours"] for d in deliverables if d.get("delivery_lag_hours")]
        if lags:
            stats["avg_delivery_lag_hours"] = round(sum(lags) / len(lags), 1)
    
    # Update creator profile with all stats
    update_data = {
        "stats.avg_views": stats.get("avg_views", {}),
        "stats.avg_reach": stats.get("avg_reach", {}),
        "stats.avg_interactions": stats.get("avg_interactions", {}),
        "stats.max_views": stats.get("max_views", {}),
        "stats.max_reach": stats.get("max_reach", {}),
        "stats.max_interactions": stats.get("max_interactions", {}),
        "stats.delivery_on_time_rate": delivery_on_time_rate,
        "stats.total_views": total_views,
        "stats.total_reach": total_reach,
        "stats.total_completed": completed_campaigns,  # For backwards compatibility
        "completed_campaigns": completed_campaigns,
        "delivery_on_time_rate": delivery_on_time_rate,
        "total_reach": total_reach,
        "total_views": total_views
    }
    
    await db.ugc_creators.update_one(
        {"id": creator_id},
        {"$set": update_data}
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
