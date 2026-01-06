"""
UGC Platform - Demo Data Script
- Activates AVENUE MALL EAS and SANTAL campaigns
- Gives infinite tokens to AVENUE MALL EAS brand
- Creates applications with various statuses
- Generates deliverables and metrics data
"""

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4
import random

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

async def create_demo_data():
    print("🚀 Creating UGC Demo Data...")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    now = datetime.now(timezone.utc)
    
    # ==================== 1. GIVE INFINITE TOKENS TO AVENUE MALL EAS ====================
    print("\n💎 Setting up AVENUE MALL EAS with infinite tokens...")
    
    avenue_brand = await db.ugc_brands.find_one({"company_name": {"$regex": "AVENUE", "$options": "i"}})
    if not avenue_brand:
        # Create Avenue brand if not exists
        avenue_brand = {
            "id": str(uuid4()),
            "user_id": "user_admin_avenue",
            "email": "avenuepy@gmail.com",
            "company_name": "AVENUE MALL EAS",
            "industry": "Retail & Fashion",
            "website": "https://avenue.com.py",
            "instagram": "@avenuemalleas",
            "city": "Asunción",
            "country": "Paraguay",
            "contact_first_name": "Admin",
            "contact_last_name": "Avenue",
            "verification_status": "approved",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        await db.ugc_brands.insert_one(avenue_brand)
    
    # Create infinite package for Avenue
    await db.ugc_packages.delete_many({"brand_id": avenue_brand["id"]})
    infinite_package = {
        "id": str(uuid4()),
        "brand_id": avenue_brand["id"],
        "type": "enterprise",
        "deliveries_total": 999999,
        "deliveries_used": 0,
        "deliveries_remaining": 999999,
        "price_gs": 0,
        "status": "active",
        "is_unlimited": True,
        "purchased_at": now.isoformat(),
        "expires_at": (now + timedelta(days=3650)).isoformat()  # 10 years
    }
    await db.ugc_packages.insert_one(infinite_package)
    print(f"  ✓ AVENUE MALL EAS now has UNLIMITED tokens (999,999)")
    
    # ==================== 2. CREATE/ACTIVATE SANTAL BRAND ====================
    print("\n🏢 Setting up SANTAL brand...")
    
    santal_brand = await db.ugc_brands.find_one({"company_name": {"$regex": "SANTAL", "$options": "i"}})
    if not santal_brand:
        santal_brand = {
            "id": str(uuid4()),
            "user_id": "user_brand_santal",
            "email": "santal@test.com",
            "company_name": "SANTAL Paraguay",
            "industry": "Bebidas",
            "website": "https://santal.com.py",
            "instagram": "@santalpy",
            "city": "Asunción",
            "country": "Paraguay",
            "contact_first_name": "Marketing",
            "contact_last_name": "Santal",
            "verification_status": "approved",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        await db.ugc_brands.insert_one(santal_brand)
        
        # Create package for Santal
        santal_package = {
            "id": str(uuid4()),
            "brand_id": santal_brand["id"],
            "type": "pro",
            "deliveries_total": 50,
            "deliveries_used": 5,
            "deliveries_remaining": 45,
            "price_gs": 1990000,
            "status": "active",
            "purchased_at": now.isoformat(),
            "expires_at": (now + timedelta(days=90)).isoformat()
        }
        await db.ugc_packages.insert_one(santal_package)
    print(f"  ✓ SANTAL Paraguay configured with Pro package")
    
    # ==================== 3. CREATE/ACTIVATE CAMPAIGNS ====================
    print("\n📢 Creating/Activating campaigns...")
    
    # Avenue Campaign
    avenue_campaign = await db.ugc_campaigns.find_one({"brand_id": avenue_brand["id"], "status": "live"})
    if not avenue_campaign:
        avenue_campaign = {
            "id": str(uuid4()),
            "brand_id": avenue_brand["id"],
            "name": "AVENUE Summer Collection 2025",
            "description": "Promoción de la nueva colección de verano en AVENUE MALL. Buscamos creators para mostrar los mejores looks de temporada.",
            "category": "fashion",
            "city": "Asunción",
            "status": "live",
            "slots": 10,
            "slots_filled": 0,
            "requirements": {
                "platforms": ["instagram", "tiktok"],
                "min_followers": 3000,
                "content_format": "Reel/Video",
                "mandatory_tag": "#AvenueVerano2025",
                "mandatory_mention": "@avenuemalleas",
                "additional_rules": ["Mostrar al menos 2 outfits", "Incluir visita al mall", "Contenido original y creativo"]
            },
            "canje": {
                "type": "product",
                "description": "Gift card de Gs. 500.000 para compras en AVENUE + productos de las marcas participantes",
                "value_gs": 750000
            },
            "timeline": {
                "applications_start": (now - timedelta(days=10)).isoformat(),
                "applications_end": (now + timedelta(days=20)).isoformat(),
                "publish_start": (now - timedelta(days=5)).isoformat(),
                "publish_end": (now + timedelta(days=30)).isoformat(),
                "delivery_sla_hours": 48
            },
            "applications_count": 0,
            "published_at": (now - timedelta(days=10)).isoformat(),
            "created_at": (now - timedelta(days=15)).isoformat(),
            "updated_at": now.isoformat()
        }
        await db.ugc_campaigns.insert_one(avenue_campaign)
    else:
        await db.ugc_campaigns.update_one({"id": avenue_campaign["id"]}, {"$set": {"status": "live"}})
    print(f"  ✓ Campaign: AVENUE Summer Collection 2025 (LIVE)")
    
    # Santal Campaign
    santal_campaign = await db.ugc_campaigns.find_one({"brand_id": santal_brand["id"]})
    if not santal_campaign:
        santal_campaign = {
            "id": str(uuid4()),
            "brand_id": santal_brand["id"],
            "name": "SANTAL Refresh Challenge",
            "description": "Challenge de verano con SANTAL. Mostrá tu momento más refrescante disfrutando de nuestros jugos naturales.",
            "category": "food",
            "city": "Asunción",
            "status": "live",
            "slots": 8,
            "slots_filled": 0,
            "requirements": {
                "platforms": ["instagram", "tiktok"],
                "min_followers": 2000,
                "content_format": "Reel/Story",
                "mandatory_tag": "#SantalRefresh",
                "mandatory_mention": "@santalpy",
                "additional_rules": ["Mostrar el producto claramente", "Contenido positivo y energético", "Mínimo 15 segundos"]
            },
            "canje": {
                "type": "product",
                "description": "Pack de productos SANTAL por 3 meses + merchandising exclusivo",
                "value_gs": 350000
            },
            "timeline": {
                "applications_start": (now - timedelta(days=7)).isoformat(),
                "applications_end": (now + timedelta(days=14)).isoformat(),
                "publish_start": (now - timedelta(days=3)).isoformat(),
                "publish_end": (now + timedelta(days=21)).isoformat(),
                "delivery_sla_hours": 72
            },
            "applications_count": 0,
            "published_at": (now - timedelta(days=7)).isoformat(),
            "created_at": (now - timedelta(days=10)).isoformat(),
            "updated_at": now.isoformat()
        }
        await db.ugc_campaigns.insert_one(santal_campaign)
    else:
        await db.ugc_campaigns.update_one({"id": santal_campaign["id"]}, {"$set": {"status": "live"}})
    print(f"  ✓ Campaign: SANTAL Refresh Challenge (LIVE)")
    
    # ==================== 4. GET ALL CREATORS ====================
    creators = await db.ugc_creators.find({"verification_status": "approved"}).to_list(20)
    print(f"\n👥 Found {len(creators)} creators to apply to campaigns")
    
    # ==================== 5. CREATE APPLICATIONS WITH DIFFERENT STATUSES ====================
    print("\n📝 Creating applications and deliverables...")
    
    # Define application scenarios for Avenue campaign
    avenue_scenarios = [
        {"status": "applied", "count": 2},           # Just applied
        {"status": "shortlisted", "count": 2},       # Preselected
        {"status": "confirmed", "deliverable_status": "awaiting_publish", "count": 1},  # Confirmed, waiting to post
        {"status": "confirmed", "deliverable_status": "published", "count": 1},         # Posted, not submitted
        {"status": "confirmed", "deliverable_status": "submitted", "count": 1},         # Submitted for review
        {"status": "confirmed", "deliverable_status": "approved", "count": 1},          # Approved
        {"status": "confirmed", "deliverable_status": "metrics_pending", "count": 1},   # Waiting metrics
        {"status": "confirmed", "deliverable_status": "completed", "count": 1},         # Fully completed with metrics
        {"status": "rejected", "count": 1}           # Rejected
    ]
    
    # Define scenarios for Santal campaign
    santal_scenarios = [
        {"status": "applied", "count": 1},
        {"status": "shortlisted", "count": 1},
        {"status": "confirmed", "deliverable_status": "submitted", "count": 2},
        {"status": "confirmed", "deliverable_status": "approved", "count": 1},
        {"status": "confirmed", "deliverable_status": "completed", "count": 2},
        {"status": "rejected", "count": 1}
    ]
    
    creator_idx = 0
    
    async def create_full_flow(campaign, brand, scenarios):
        nonlocal creator_idx
        slots_filled = 0
        apps_count = 0
        
        for scenario in scenarios:
            for _ in range(scenario["count"]):
                if creator_idx >= len(creators):
                    creator_idx = 0
                
                creator = creators[creator_idx]
                creator_idx += 1
                apps_count += 1
                
                # Create application
                application = {
                    "id": str(uuid4()),
                    "campaign_id": campaign["id"],
                    "creator_id": creator["id"],
                    "creator_name": creator["name"],
                    "creator_username": creator["social_networks"][0]["username"],
                    "creator_followers": creator["social_networks"][0]["followers"],
                    "creator_rating": creator["stats"]["avg_rating"],
                    "creator_level": creator["level"],
                    "motivation": random.choice([
                        "Me encanta esta marca y mi audiencia conectaría perfecto!",
                        "Tengo mucha experiencia en este tipo de contenido.",
                        "Mi estilo visual se alinea con la estética de la campaña.",
                        "Soy fan de los productos y quiero compartir mi experiencia."
                    ]),
                    "proposed_content": "Reel dinámico mostrando el producto/experiencia con transiciones creativas y música trending.",
                    "status": scenario["status"],
                    "applied_at": (now - timedelta(days=random.randint(3, 10))).isoformat(),
                    "updated_at": now.isoformat()
                }
                
                if scenario["status"] == "confirmed":
                    application["confirmed_at"] = (now - timedelta(days=random.randint(1, 5))).isoformat()
                    slots_filled += 1
                elif scenario["status"] == "rejected":
                    application["rejected_at"] = (now - timedelta(days=random.randint(1, 3))).isoformat()
                    application["rejection_reason"] = "No cumple con los requisitos mínimos de seguidores"
                
                await db.ugc_applications.insert_one(application)
                
                # Create deliverable for confirmed applications
                if scenario["status"] == "confirmed" and "deliverable_status" in scenario:
                    del_status = scenario["deliverable_status"]
                    platform = random.choice(["instagram", "tiktok"])
                    
                    deliverable = {
                        "id": str(uuid4()),
                        "campaign_id": campaign["id"],
                        "application_id": application["id"],
                        "creator_id": creator["id"],
                        "brand_id": campaign["brand_id"],
                        "platform": platform,
                        "status": del_status,
                        "is_on_time": random.choice([True, True, True, False]),
                        "created_at": (now - timedelta(days=random.randint(3, 8))).isoformat(),
                        "updated_at": now.isoformat()
                    }
                    
                    # Add data based on status
                    if del_status != "awaiting_publish":
                        post_id = uuid4().hex[:11]
                        deliverable["post_url"] = f"https://{'instagram.com/reel' if platform == 'instagram' else 'tiktok.com/@user/video'}/{post_id}"
                        deliverable["published_at"] = (now - timedelta(days=random.randint(2, 6))).isoformat()
                    
                    if del_status in ["submitted", "approved", "changes_requested", "metrics_pending", "completed"]:
                        deliverable["submitted_at"] = (now - timedelta(days=random.randint(1, 4))).isoformat()
                        deliverable["file_url"] = f"https://drive.google.com/file/{uuid4().hex[:10]}"
                        deliverable["evidence_urls"] = [f"https://imgur.com/{uuid4().hex[:7]}.jpg"]
                    
                    if del_status in ["approved", "metrics_pending", "completed"]:
                        deliverable["approved_at"] = (now - timedelta(days=random.randint(1, 3))).isoformat()
                        deliverable["review_round"] = 1
                        deliverable["review_notes"] = [{
                            "round": 1,
                            "action": "approve",
                            "note": "Excelente contenido! Muy creativo y alineado con la marca.",
                            "timestamp": (now - timedelta(days=random.randint(1, 3))).isoformat(),
                            "by": "brand"
                        }]
                    
                    if del_status in ["metrics_pending", "completed"]:
                        deliverable["metrics_window_opens"] = (now - timedelta(days=5)).isoformat()
                        deliverable["metrics_window_closes"] = (now + timedelta(days=2)).isoformat()
                    
                    await db.ugc_deliverables.insert_one(deliverable)
                    
                    # Create metrics for completed deliverables
                    if del_status == "completed":
                        views = random.randint(15000, 250000)
                        reach = int(views * random.uniform(0.65, 0.90))
                        likes = int(views * random.uniform(0.04, 0.12))
                        comments = int(likes * random.uniform(0.02, 0.08))
                        shares = int(likes * random.uniform(0.01, 0.04))
                        saves = int(likes * random.uniform(0.03, 0.12))
                        
                        metrics = {
                            "id": str(uuid4()),
                            "deliverable_id": deliverable["id"],
                            "creator_id": creator["id"],
                            "campaign_id": campaign["id"],
                            "brand_id": campaign["brand_id"],
                            "platform": platform,
                            "views": views,
                            "reach": reach,
                            "impressions": int(views * random.uniform(1.1, 1.5)),
                            "likes": likes,
                            "comments": comments,
                            "shares": shares,
                            "saves": saves,
                            "profile_visits": int(views * random.uniform(0.005, 0.02)),
                            "follows_from_post": int(views * random.uniform(0.001, 0.005)),
                            "total_interactions": likes + comments + shares + saves,
                            "engagement_rate": round(((likes + comments + shares + saves) / views) * 100, 2),
                            "screenshot_url": f"https://imgur.com/metrics_{uuid4().hex[:8]}.png",
                            "ai_extracted": True,
                            "ai_confidence": round(random.uniform(0.85, 0.98), 2),
                            "manually_verified": random.choice([True, False]),
                            "verified_at": now.isoformat() if random.choice([True, False]) else None,
                            "is_late": random.choice([False, False, False, True]),
                            "submitted_at": (now - timedelta(days=random.randint(1, 3))).isoformat(),
                            "created_at": now.isoformat()
                        }
                        await db.ugc_metrics.insert_one(metrics)
                        
                        print(f"    📊 Metrics for {creator['name']}: {views:,} views, {likes:,} likes, {metrics['engagement_rate']:.1f}% engagement")
        
        # Update campaign counts
        await db.ugc_campaigns.update_one(
            {"id": campaign["id"]},
            {"$set": {"slots_filled": slots_filled, "applications_count": apps_count}}
        )
        
        return slots_filled, apps_count
    
    # Create flows for Avenue campaign
    print(f"\n  📍 AVENUE Summer Collection 2025:")
    avenue_slots, avenue_apps = await create_full_flow(avenue_campaign, avenue_brand, avenue_scenarios)
    print(f"    ✓ {avenue_apps} applications, {avenue_slots} confirmed")
    
    # Create flows for Santal campaign
    print(f"\n  📍 SANTAL Refresh Challenge:")
    santal_slots, santal_apps = await create_full_flow(santal_campaign, santal_brand, santal_scenarios)
    print(f"    ✓ {santal_apps} applications, {santal_slots} confirmed")
    
    # ==================== 6. CREATE RATINGS FOR COMPLETED DELIVERABLES ====================
    print("\n⭐ Creating ratings for completed deliverables...")
    
    completed_deliverables = await db.ugc_deliverables.find({"status": "completed"}).to_list(50)
    for del_item in completed_deliverables:
        if random.random() > 0.2:  # 80% get rated
            rating = {
                "id": str(uuid4()),
                "deliverable_id": del_item["id"],
                "campaign_id": del_item["campaign_id"],
                "creator_id": del_item["creator_id"],
                "brand_id": del_item["brand_id"],
                "brand_name": "AVENUE MALL EAS" if del_item["brand_id"] == avenue_brand["id"] else "SANTAL Paraguay",
                "rating": random.choices([4, 4, 5, 5, 5], weights=[10, 20, 30, 25, 15])[0],
                "comment": random.choice([
                    "Excelente trabajo! El contenido superó nuestras expectativas.",
                    "Muy profesional y creativo. Definitivamente volveremos a trabajar juntos.",
                    "Buena calidad de producción y entrega puntual.",
                    "El engagement fue increíble. Muy recomendado!",
                    "Contenido de alta calidad, perfectamente alineado con nuestra marca."
                ]),
                "created_at": (now - timedelta(days=random.randint(1, 5))).isoformat()
            }
            await db.ugc_ratings.insert_one(rating)
    
    # ==================== SUMMARY ====================
    print("\n" + "="*60)
    print("🎉 DEMO DATA CREATED SUCCESSFULLY!")
    print("="*60)
    
    # Get final counts
    total_apps = await db.ugc_applications.count_documents({})
    total_deliverables = await db.ugc_deliverables.count_documents({})
    total_metrics = await db.ugc_metrics.count_documents({})
    total_ratings = await db.ugc_ratings.count_documents({})
    
    print(f"""
📊 Data Summary:
  • Total Applications: {total_apps}
  • Total Deliverables: {total_deliverables}
  • Total Metrics Records: {total_metrics}
  • Total Ratings: {total_ratings}

🏢 Brands:
  • AVENUE MALL EAS: ∞ tokens (UNLIMITED)
  • SANTAL Paraguay: 45 tokens remaining

📢 Active Campaigns:
  • AVENUE Summer Collection 2025 - {avenue_apps} applications, {avenue_slots} confirmed
  • SANTAL Refresh Challenge - {santal_apps} applications, {santal_slots} confirmed

📈 Application Statuses:
  • Applied (pending review)
  • Shortlisted (preselected)
  • Confirmed (working on content)
  • Rejected

📦 Deliverable Statuses:
  • Awaiting Publish (confirmed, waiting to post)
  • Published (posted, not submitted yet)
  • Submitted (waiting brand review)
  • Approved (brand approved content)
  • Metrics Pending (content approved, waiting metrics)
  • Completed (full cycle with metrics)

🔑 Test URLs:
  • /ugc/campaigns - View campaigns
  • /ugc/leaderboard - View creators ranking
  • /ugc/brand/campaigns - Brand panel (login as brand)
  • /admin → UGC Platform - Admin panel
""")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_demo_data())
