"""
Migration Script: Move existing product images to Cloudinary
Safe migration - does NOT delete original data
"""
import asyncio
import httpx
import base64
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, '/app/backend')

from services.cloudinary_storage import upload_image as cloudinary_upload, CLOUDINARY_CONFIGURED
from services.gridfs_storage import get_image as gridfs_get

# Database connection
client = AsyncIOMotorClient('mongodb://localhost:27017')
db = client['test_database']

async def get_legacy_image_content(url: str) -> bytes:
    """
    Fetch image content from legacy storage (filesystem, MongoDB base64, or GridFS)
    """
    if not url:
        return None
    
    # GridFS format: /api/shop/images/gridfs/{file_id}
    if '/gridfs/' in url:
        file_id = url.split('/gridfs/')[-1]
        content, _, _ = await gridfs_get(file_id, bucket_name="product_images")
        return content
    
    # Legacy format: /api/shop/images/grp_xxx.jpg
    if '/api/shop/images/' in url:
        filename = url.split('/')[-1]
        image_id = filename.rsplit('.', 1)[0] if '.' in filename else filename
        
        # Try filesystem FIRST (in products subdirectory)
        filepath_products = f"/app/backend/uploads/products/{filename}"
        if os.path.exists(filepath_products):
            print(f"   📁 Found in filesystem: {filepath_products}")
            with open(filepath_products, 'rb') as f:
                return f.read()
        
        # Try filesystem (root uploads)
        filepath = f"/app/backend/uploads/{filename}"
        if os.path.exists(filepath):
            print(f"   📁 Found in filesystem: {filepath}")
            with open(filepath, 'rb') as f:
                return f.read()
        
        # Try MongoDB base64 storage
        image_doc = await db.product_images_data.find_one({"image_id": image_id})
        if image_doc and image_doc.get("data"):
            try:
                print(f"   📦 Found in MongoDB base64")
                return base64.b64decode(image_doc["data"])
            except Exception as e:
                print(f"   ⚠️ Error decoding base64: {e}")
        
        # Try GridFS by filename pattern
        gridfs_file = await db.product_images.files.find_one(
            {"metadata.original_filename": {"$regex": image_id}}
        )
        if gridfs_file:
            file_id = str(gridfs_file.get("_id"))
            content, _, _ = await gridfs_get(file_id, bucket_name="product_images")
            if content:
                print(f"   📦 Found in GridFS")
                return content
    
    return None


async def migrate_product_images():
    """
    Migrate all legacy product images to Cloudinary
    """
    print("=" * 60)
    print("🚀 MIGRACIÓN DE IMÁGENES DE PRODUCTOS A CLOUDINARY")
    print("=" * 60)
    print(f"Fecha: {datetime.now(timezone.utc).isoformat()}")
    print(f"Cloudinary configurado: {CLOUDINARY_CONFIGURED}")
    print()
    
    if not CLOUDINARY_CONFIGURED:
        print("❌ ERROR: Cloudinary no está configurado")
        return
    
    # Find products with legacy images (not yet migrated to Cloudinary)
    products = await db.shop_products_grouped.find({
        "$and": [
            {"$or": [
                {"custom_image": {"$exists": True, "$ne": None}},
                {"images.0": {"$exists": True}}
            ]},
            {"$or": [
                {"cloudinary_url": {"$exists": False}},
                {"cloudinary_url": None},
                {"cloudinary_url": ""}
            ]}
        ]
    }, {"_id": 0}).to_list(1000)
    
    print(f"📦 Productos a migrar: {len(products)}")
    print()
    
    migrated = 0
    failed = 0
    skipped = 0
    
    for product in products:
        product_id = product.get('grouped_id', 'unknown')
        name = product.get('name', 'Sin nombre')[:40]
        custom_image = product.get('custom_image')
        images = product.get('images', [])
        
        print(f"📷 Procesando: {name}")
        print(f"   ID: {product_id}")
        print(f"   custom_image: {custom_image}")
        
        # Skip if already has cloudinary URL
        if product.get('cloudinary_url') and 'cloudinary.com' in product.get('cloudinary_url', ''):
            print(f"   ⏭️ Ya migrado, saltando...")
            skipped += 1
            continue
        
        # Skip if URL is already from Cloudinary
        if custom_image and 'cloudinary.com' in custom_image:
            print(f"   ⏭️ Ya es URL de Cloudinary, saltando...")
            skipped += 1
            continue
        
        # Get image content from legacy storage
        image_content = await get_legacy_image_content(custom_image)
        
        if not image_content:
            print(f"   ❌ No se pudo obtener la imagen")
            failed += 1
            continue
        
        print(f"   📥 Imagen obtenida: {len(image_content)} bytes")
        
        # Upload to Cloudinary
        try:
            result = await cloudinary_upload(
                file_content=image_content,
                filename=f"{product_id}.jpg",
                folder="avenue/products",
                public=True,
                metadata={
                    "product_id": product_id,
                    "migrated_from": custom_image,
                    "migration_date": datetime.now(timezone.utc).isoformat()
                }
            )
            
            if result.get("success"):
                cloudinary_url = result.get("url")
                print(f"   ✅ Subido a Cloudinary: {cloudinary_url}")
                
                # Update database (keep original, add cloudinary_url)
                update_data = {
                    "cloudinary_url": cloudinary_url,
                    "cloudinary_images": [cloudinary_url, None, None],
                    "image_migrated_at": datetime.now(timezone.utc).isoformat(),
                    "original_image_url": custom_image  # Backup original URL
                }
                
                await db.shop_products_grouped.update_one(
                    {"grouped_id": product_id},
                    {"$set": update_data}
                )
                
                migrated += 1
            else:
                print(f"   ❌ Error Cloudinary: {result.get('error')}")
                failed += 1
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            failed += 1
        
        print()
    
    # Summary
    print("=" * 60)
    print("📊 RESUMEN DE MIGRACIÓN")
    print("=" * 60)
    print(f"✅ Migrados exitosamente: {migrated}")
    print(f"⏭️ Saltados (ya migrados): {skipped}")
    print(f"❌ Fallidos: {failed}")
    print(f"📦 Total procesados: {len(products)}")
    print()
    
    # Log migration to database
    await db.migration_logs.insert_one({
        "type": "product_images_to_cloudinary",
        "date": datetime.now(timezone.utc).isoformat(),
        "migrated": migrated,
        "skipped": skipped,
        "failed": failed,
        "total": len(products)
    })
    
    print("✅ Log de migración guardado en 'migration_logs'")
    
    return {
        "migrated": migrated,
        "skipped": skipped,
        "failed": failed,
        "total": len(products)
    }


if __name__ == "__main__":
    asyncio.run(migrate_product_images())
