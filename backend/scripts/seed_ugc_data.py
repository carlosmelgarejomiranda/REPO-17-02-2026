"""
UGC Platform - Seed Data Script
Generates comprehensive test data for all UGC functionalities
"""

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4
import random

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'avenue')

# Sample data
CITIES = ["Asunción", "Ciudad del Este", "Encarnación", "Luque", "San Lorenzo"]
CATEGORIES = ["fashion", "beauty", "lifestyle", "food", "fitness", "tech", "travel"]
PLATFORMS = ["instagram", "tiktok"]

CREATOR_NAMES = [
    {"name": "María González", "username": "mariag_style"},
    {"name": "Carlos Benítez", "username": "carlosb_fit"},
    {"name": "Ana Martínez", "username": "ana.lifestyle"},
    {"name": "Pedro Villalba", "username": "pedro_foodie"},
    {"name": "Lucía Fernández", "username": "lu.beauty"},
    {"name": "Juan Ramírez", "username": "juanr_tech"},
    {"name": "Sofia Acosta", "username": "sofi.travel"},
    {"name": "Diego López", "username": "diego_fashion"},
    {"name": "Valentina Rojas", "username": "vale.fitness"},
    {"name": "Matías Giménez", "username": "mati_content"}
]

BRAND_NAMES = [
    {"company": "Fashion Store PY", "industry": "Moda"},
    {"company": "Beauty Box", "industry": "Belleza"},
    {"company": "Fit Life Gym", "industry": "Fitness"},
    {"company": "Sabores del Este", "industry": "Gastronomía"},
    {"company": "TechZone Paraguay", "industry": "Tecnología"},
    {"company": "Viajes Guaraní", "industry": "Turismo"}
]

CAMPAIGN_TEMPLATES = [
    {"name": "Lanzamiento Colección Verano 2025", "desc": "Promoción de nueva colección de ropa de verano"},
    {"name": "Review de Productos de Skincare", "desc": "Creadores prueban y reseñan productos de cuidado facial"},
    {"name": "Challenge Fitness 30 Días", "desc": "Contenido motivacional sobre rutinas de ejercicio"},
    {"name": "Food Tour Asunción", "desc": "Visitas a restaurantes y reseñas gastronómicas"},
    {"name": "Unboxing Tech", "desc": "Unboxing y review de gadgets tecnológicos"},
    {"name": "Destinos Nacionales", "desc": "Promoción de destinos turísticos en Paraguay"}
]

async def seed_database():
    print("🌱 Starting UGC Platform seed...")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    now = datetime.now(timezone.utc)
    
    # ==================== CREATORS ====================
    print("\n👤 Creating creators...")
    creators = []
    levels = ["rookie", "rookie", "trusted", "trusted", "pro", "pro", "elite", "rookie", "trusted", "pro"]
    
    for i, creator_data in enumerate(CREATOR_NAMES):
        level = levels[i]
        completed = {"rookie": random.randint(0, 4), "trusted": random.randint(5, 14), "pro": random.randint(15, 29), "elite": random.randint(30, 50)}[level]
        rating = {"rookie": round(random.uniform(3.0, 4.0), 1), "trusted": round(random.uniform(3.5, 4.3), 1), "pro": round(random.uniform(4.0, 4.6), 1), "elite": round(random.uniform(4.5, 5.0), 1)}[level]
        
        creator = {
            "id": str(uuid4()),
            "user_id": f"user_creator_{i+1}",
            "email": f"creator{i+1}@test.com",
            "name": creator_data["name"],
            "phone": f"+595 9{random.randint(71, 99)} {random.randint(100, 999)} {random.randint(100, 999)}",
            "city": random.choice(CITIES),
            "bio": f"Creador de contenido apasionado por {random.choice(CATEGORIES)}. Colaboraciones con marcas top.",
            "profile_image": f"https://i.pravatar.cc/300?u={creator_data['username']}",
            "categories": random.sample(CATEGORIES, k=random.randint(2, 4)),
            "social_networks": [
                {
                    "platform": "instagram",
                    "username": creator_data["username"],
                    "followers": random.randint(5000, 150000),
                    "avg_views": random.randint(2000, 50000),
                    "engagement_rate": round(random.uniform(2.0, 8.0), 1),
                    "profile_url": f"https://instagram.com/{creator_data['username']}"
                },
                {
                    "platform": "tiktok",
                    "username": creator_data["username"],
                    "followers": random.randint(3000, 100000),
                    "avg_views": random.randint(5000, 100000),
                    "engagement_rate": round(random.uniform(3.0, 12.0), 1),
                    "profile_url": f"https://tiktok.com/@{creator_data['username']}"
                }
            ],
            "level": level,
            "level_progress": random.randint(20, 95),
            "verification_status": "approved",
            "stats": {
                "total_completed": completed,
                "avg_rating": rating,
                "total_ratings": random.randint(completed // 2, completed),
                "delivery_on_time_rate": random.randint(85, 100),
                "avg_views": {"instagram": random.randint(5000, 30000), "tiktok": random.randint(10000, 80000)},
                "max_views": {"instagram": random.randint(30000, 100000), "tiktok": random.randint(80000, 500000)}
            },
            "created_at": (now - timedelta(days=random.randint(30, 365))).isoformat(),
            "updated_at": now.isoformat()
        }
        creators.append(creator)
        await db.ugc_creators.insert_one(creator)
        print(f"  ✓ {creator['name']} ({level})")
    
    # Create user accounts for creators
    for i, creator in enumerate(creators):
        user = {
            "user_id": creator["user_id"],
            "email": creator["email"],
            "name": creator["name"],
            "role": "user",
            "ugc_role": "creator",
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qO3aMUwJ9GhM2G",  # password123
            "created_at": creator["created_at"]
        }
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": user}, upsert=True)
    
    # ==================== BRANDS ====================
    print("\n🏢 Creating brands...")
    brands = []
    
    for i, brand_data in enumerate(BRAND_NAMES):
        brand = {
            "id": str(uuid4()),
            "user_id": f"user_brand_{i+1}",
            "email": f"brand{i+1}@test.com",
            "company_name": brand_data["company"],
            "industry": brand_data["industry"],
            "website": f"https://www.{brand_data['company'].lower().replace(' ', '')}.com.py",
            "instagram": f"@{brand_data['company'].lower().replace(' ', '_')}",
            "city": random.choice(CITIES[:3]),
            "country": "Paraguay",
            "contact_first_name": random.choice(["María", "Carlos", "Ana", "Pedro"]),
            "contact_last_name": random.choice(["González", "Benítez", "Martínez", "López"]),
            "contact_phone": f"+595 21 {random.randint(200, 999)} {random.randint(100, 999)}",
            "logo_url": f"https://ui-avatars.com/api/?name={brand_data['company']}&background=d4a968&color=000",
            "verification_status": "approved",
            "created_at": (now - timedelta(days=random.randint(60, 180))).isoformat(),
            "updated_at": now.isoformat()
        }
        brands.append(brand)
        await db.ugc_brands.insert_one(brand)
        print(f"  ✓ {brand['company_name']}")
    
    # Create user accounts for brands
    for i, brand in enumerate(brands):
        user = {
            "user_id": brand["user_id"],
            "email": brand["email"],
            "name": brand["company_name"],
            "role": "user",
            "ugc_role": "brand",
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qO3aMUwJ9GhM2G",  # password123
            "created_at": brand["created_at"]
        }
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": user}, upsert=True)
    
    # ==================== PACKAGES ====================
    print("\n📦 Creating packages for brands...")
    for brand in brands:
        package_type = random.choice(["starter", "standard", "pro"])
        deliveries = {"starter": 4, "standard": 8, "pro": 16}[package_type]
        used = random.randint(0, deliveries - 2)
        
        package = {
            "id": str(uuid4()),
            "brand_id": brand["id"],
            "type": package_type,
            "deliveries_total": deliveries,
            "deliveries_used": used,
            "deliveries_remaining": deliveries - used,
            "price_gs": {"starter": 990000, "standard": 1790000, "pro": 1990000}[package_type],
            "status": "active",
            "purchased_at": (now - timedelta(days=random.randint(10, 60))).isoformat(),
            "expires_at": (now + timedelta(days=random.randint(30, 90))).isoformat()
        }
        await db.ugc_packages.insert_one(package)
        print(f"  ✓ {brand['company_name']} - {package_type.upper()}")
    
    # ==================== CAMPAIGNS ====================
    print("\n📢 Creating campaigns...")
    campaigns = []
    statuses = ["draft", "live", "live", "live", "closed", "in_production", "completed"]
    
    for i, camp_template in enumerate(CAMPAIGN_TEMPLATES):
        brand = brands[i % len(brands)]
        status = statuses[i % len(statuses)]
        slots = random.randint(3, 8)
        filled = 0 if status == "draft" else random.randint(1, slots)
        
        campaign = {
            "id": str(uuid4()),
            "brand_id": brand["id"],
            "name": camp_template["name"],
            "description": camp_template["desc"],
            "category": random.choice(CATEGORIES),
            "city": random.choice(CITIES[:3]),
            "status": status,
            "slots": slots,
            "slots_filled": filled,
            "requirements": {
                "platforms": random.sample(PLATFORMS, k=random.randint(1, 2)),
                "min_followers": random.choice([1000, 3000, 5000, 10000]),
                "content_format": random.choice(["Reel", "Story", "Post", "Video"]),
                "mandatory_tag": f"#{brand['company_name'].replace(' ', '')}",
                "mandatory_mention": f"@{brand['company_name'].lower().replace(' ', '_')}",
                "additional_rules": ["Contenido original", "Entregar en 48h después de publicar"]
            },
            "canje": {
                "type": random.choice(["product", "service"]),
                "description": "Producto/servicio de la marca valorado en Gs. " + str(random.randint(100, 500) * 1000),
                "value_gs": random.randint(100, 500) * 1000
            },
            "timeline": {
                "applications_start": (now - timedelta(days=30)).isoformat(),
                "applications_end": (now + timedelta(days=7)).isoformat(),
                "publish_start": (now - timedelta(days=15)).isoformat(),
                "publish_end": (now + timedelta(days=15)).isoformat(),
                "delivery_sla_hours": 48
            },
            "applications_count": filled + random.randint(2, 10),
            "published_at": (now - timedelta(days=random.randint(5, 20))).isoformat() if status != "draft" else None,
            "created_at": (now - timedelta(days=random.randint(25, 60))).isoformat(),
            "updated_at": now.isoformat()
        }
        campaigns.append(campaign)
        await db.ugc_campaigns.insert_one(campaign)
        print(f"  ✓ {campaign['name']} ({status})")
    
    # ==================== APPLICATIONS ====================
    print("\n📝 Creating applications...")
    app_statuses = ["applied", "applied", "shortlisted", "confirmed", "confirmed", "rejected"]
    
    for campaign in campaigns:
        if campaign["status"] == "draft":
            continue
            
        num_apps = random.randint(3, 8)
        selected_creators = random.sample(creators, k=min(num_apps, len(creators)))
        
        for j, creator in enumerate(selected_creators):
            app_status = app_statuses[j % len(app_statuses)]
            
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
                    "Me encanta esta marca y creo que mi audiencia conectaría perfecto con el contenido.",
                    "Tengo experiencia creando contenido similar y me gustaría colaborar.",
                    "Mi estilo de contenido se alinea perfectamente con la estética de la campaña.",
                    "He usado los productos de esta marca y me encantaría compartir mi experiencia."
                ]),
                "proposed_content": "Reel mostrando el producto en uso diario con transiciones creativas.",
                "status": app_status,
                "applied_at": (now - timedelta(days=random.randint(5, 20))).isoformat(),
                "confirmed_at": (now - timedelta(days=random.randint(1, 5))).isoformat() if app_status == "confirmed" else None,
                "rejected_at": (now - timedelta(days=random.randint(1, 5))).isoformat() if app_status == "rejected" else None,
                "updated_at": now.isoformat()
            }
            await db.ugc_applications.insert_one(application)
            
            # Create deliverable for confirmed applications
            if app_status == "confirmed":
                del_status = random.choice(["awaiting_publish", "published", "submitted", "approved", "changes_requested", "metrics_pending", "completed"])
                
                deliverable = {
                    "id": str(uuid4()),
                    "campaign_id": campaign["id"],
                    "application_id": application["id"],
                    "creator_id": creator["id"],
                    "brand_id": campaign["brand_id"],
                    "platform": random.choice(PLATFORMS),
                    "status": del_status,
                    "post_url": f"https://instagram.com/p/{uuid4().hex[:11]}" if del_status not in ["awaiting_publish"] else None,
                    "published_at": (now - timedelta(days=random.randint(1, 10))).isoformat() if del_status not in ["awaiting_publish"] else None,
                    "submitted_at": (now - timedelta(days=random.randint(1, 5))).isoformat() if del_status in ["submitted", "approved", "changes_requested", "metrics_pending", "completed"] else None,
                    "review_round": 1 if del_status in ["approved", "changes_requested", "metrics_pending", "completed"] else 0,
                    "review_notes": [{
                        "round": 1,
                        "action": "approve" if del_status in ["approved", "metrics_pending", "completed"] else "request_changes",
                        "note": "Excelente contenido, muy creativo!" if del_status in ["approved", "metrics_pending", "completed"] else "Por favor ajusta la iluminación",
                        "timestamp": now.isoformat()
                    }] if del_status in ["approved", "changes_requested", "metrics_pending", "completed"] else [],
                    "approved_at": (now - timedelta(days=random.randint(1, 3))).isoformat() if del_status in ["approved", "metrics_pending", "completed"] else None,
                    "metrics_window_opens": (now - timedelta(days=3)).isoformat() if del_status in ["metrics_pending", "completed"] else None,
                    "metrics_window_closes": (now + timedelta(days=4)).isoformat() if del_status in ["metrics_pending", "completed"] else None,
                    "is_on_time": random.choice([True, True, True, False]),
                    "created_at": (now - timedelta(days=random.randint(5, 15))).isoformat(),
                    "updated_at": now.isoformat()
                }
                await db.ugc_deliverables.insert_one(deliverable)
                
                # Create metrics for completed deliverables
                if del_status in ["metrics_pending", "completed"]:
                    views = random.randint(5000, 100000)
                    likes = int(views * random.uniform(0.03, 0.15))
                    
                    metrics = {
                        "id": str(uuid4()),
                        "deliverable_id": deliverable["id"],
                        "creator_id": creator["id"],
                        "campaign_id": campaign["id"],
                        "platform": deliverable["platform"],
                        "views": views,
                        "reach": int(views * random.uniform(0.7, 0.95)),
                        "likes": likes,
                        "comments": int(likes * random.uniform(0.02, 0.1)),
                        "shares": int(likes * random.uniform(0.01, 0.05)),
                        "saves": int(likes * random.uniform(0.05, 0.15)),
                        "total_interactions": likes,
                        "engagement_rate": round((likes / views) * 100, 2),
                        "screenshot_url": "https://example.com/screenshot.png",
                        "ai_confidence": random.uniform(0.7, 0.95),
                        "manually_verified": random.choice([True, False]),
                        "submitted_at": (now - timedelta(days=random.randint(1, 3))).isoformat(),
                        "created_at": now.isoformat()
                    }
                    await db.ugc_metrics.insert_one(metrics)
    
    print(f"  ✓ Created applications and deliverables")
    
    # ==================== RATINGS ====================
    print("\n⭐ Creating ratings...")
    
    # Get all completed/approved deliverables
    deliverables = await db.ugc_deliverables.find(
        {"status": {"$in": ["approved", "completed", "metrics_pending"]}},
        {"_id": 0}
    ).to_list(100)
    
    for deliverable in deliverables:
        if random.random() > 0.3:  # 70% chance of rating
            rating = {
                "id": str(uuid4()),
                "deliverable_id": deliverable["id"],
                "campaign_id": deliverable["campaign_id"],
                "creator_id": deliverable["creator_id"],
                "brand_id": deliverable["brand_id"],
                "brand_name": next((b["company_name"] for b in brands if b["id"] == deliverable["brand_id"]), "Brand"),
                "rating": random.choices([3, 4, 4, 5, 5, 5], weights=[5, 15, 25, 25, 20, 10])[0],
                "comment": random.choice([
                    "Excelente trabajo, muy profesional!",
                    "El contenido superó nuestras expectativas.",
                    "Muy buena calidad de producción.",
                    "Cumplió con todos los requisitos a tiempo.",
                    "Creatividad increíble, lo recomiendo!",
                    None, None  # Some without comments
                ]),
                "created_at": (now - timedelta(days=random.randint(1, 10))).isoformat()
            }
            await db.ugc_ratings.insert_one(rating)
    
    print(f"  ✓ Created {len(deliverables)} potential ratings")
    
    # ==================== NOTIFICATIONS ====================
    print("\n🔔 Creating notifications...")
    
    for creator in creators[:5]:
        notifications = [
            {
                "id": str(uuid4()),
                "user_id": creator["user_id"],
                "type": "application_confirmed",
                "title": "¡Aplicación confirmada!",
                "message": f"Tu aplicación a '{random.choice(CAMPAIGN_TEMPLATES)['name']}' fue aceptada.",
                "read": random.choice([True, False]),
                "created_at": (now - timedelta(days=random.randint(1, 5))).isoformat()
            },
            {
                "id": str(uuid4()),
                "user_id": creator["user_id"],
                "type": "content_approved",
                "title": "Contenido aprobado",
                "message": "Tu entrega fue aprobada por la marca. ¡Buen trabajo!",
                "read": random.choice([True, False]),
                "created_at": (now - timedelta(days=random.randint(1, 3))).isoformat()
            }
        ]
        for notif in notifications:
            await db.ugc_notifications.insert_one(notif)
    
    print(f"  ✓ Created notifications")
    
    # ==================== SUMMARY ====================
    print("\n" + "="*50)
    print("🎉 SEED COMPLETED SUCCESSFULLY!")
    print("="*50)
    print(f"\n📊 Data Summary:")
    print(f"  • Creators: {len(creators)}")
    print(f"  • Brands: {len(brands)}")
    print(f"  • Campaigns: {len(campaigns)}")
    print(f"  • Applications: {await db.ugc_applications.count_documents({})}")
    print(f"  • Deliverables: {await db.ugc_deliverables.count_documents({})}")
    print(f"  • Metrics: {await db.ugc_metrics.count_documents({})}")
    print(f"  • Ratings: {await db.ugc_ratings.count_documents({})}")
    
    print("\n🔑 Test Credentials:")
    print("  • Creators: creator1@test.com - creator10@test.com (password: password123)")
    print("  • Brands: brand1@test.com - brand6@test.com (password: password123)")
    print("  • Admin: avenuepy@gmail.com (password: admin123)")
    
    print("\n🌐 URLs to test:")
    print("  • /ugc/campaigns - Ver campañas disponibles")
    print("  • /ugc/leaderboard - Ver ranking de creators")
    print("  • /ugc/brand/campaigns - Panel de marca")
    print("  • /admin - Panel de administración (pestaña UGC)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
