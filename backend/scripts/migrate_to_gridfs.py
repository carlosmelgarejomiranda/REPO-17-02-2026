"""
Migration Script: Move local images to GridFS
This script migrates existing images from local filesystem to MongoDB GridFS
"""
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from services.gridfs_storage import upload_image, get_storage_stats

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Directories to migrate
UPLOAD_DIRS = [
    "/app/backend/uploads",
    "/app/backend/uploads/products",
    "/app/uploads",
]

# Supported image extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'}


async def migrate_directory(directory: str, bucket_name: str = "images"):
    """Migrate all images from a directory to GridFS"""
    dir_path = Path(directory)
    
    if not dir_path.exists():
        print(f"Directory not found: {directory}")
        return 0
    
    migrated = 0
    errors = 0
    
    # Get all files
    for file_path in dir_path.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in IMAGE_EXTENSIONS:
            try:
                # Read file content
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                # Determine content type
                ext = file_path.suffix.lower()
                content_types = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp',
                    '.avif': 'image/avif'
                }
                content_type = content_types.get(ext, 'application/octet-stream')
                
                # Upload to GridFS
                file_id = await upload_image(
                    file_content=content,
                    filename=file_path.name,
                    content_type=content_type,
                    metadata={
                        "migrated_from": str(file_path),
                        "migration_date": datetime.now(timezone.utc).isoformat(),
                        "original_directory": directory
                    },
                    bucket_name=bucket_name
                )
                
                print(f"  ✓ Migrated: {file_path.name} -> {file_id}")
                migrated += 1
                
            except Exception as e:
                print(f"  ✗ Error migrating {file_path.name}: {e}")
                errors += 1
    
    return migrated, errors


async def update_database_references():
    """Update database records to use new GridFS URLs"""
    
    # Update product_images_data references if needed
    # This depends on your specific data model
    
    # For shop_products_grouped custom_images
    products = await db.shop_products_grouped.find(
        {"custom_images": {"$exists": True, "$ne": []}}
    ).to_list(None)
    
    updated = 0
    for product in products:
        custom_images = product.get("custom_images", [])
        new_images = []
        needs_update = False
        
        for img_url in custom_images:
            # Check if it's a local path that needs migration
            if "/uploads/" in img_url and "/gridfs/" not in img_url:
                # Extract filename
                filename = img_url.split("/")[-1]
                # For now, keep the old URL - they will work via legacy endpoint
                new_images.append(img_url)
            else:
                new_images.append(img_url)
        
        # Note: We keep old URLs working via legacy endpoints
        # New uploads will use GridFS
    
    return updated


async def main():
    print("=" * 60)
    print("GridFS Migration Script")
    print("=" * 60)
    print(f"MongoDB: {mongo_url}")
    print(f"Database: {db_name}")
    print()
    
    # Get current stats
    print("Current GridFS stats (before migration):")
    try:
        stats = await get_storage_stats("images")
        print(f"  Images bucket: {stats['total_files']} files, {stats['total_size_mb']} MB")
        stats = await get_storage_stats("product_images")
        print(f"  Product images bucket: {stats['total_files']} files, {stats['total_size_mb']} MB")
    except Exception as e:
        print(f"  No existing GridFS data: {e}")
    print()
    
    total_migrated = 0
    total_errors = 0
    
    # Migrate general uploads
    print("Migrating general uploads...")
    for upload_dir in UPLOAD_DIRS:
        if Path(upload_dir).exists():
            print(f"\nMigrating: {upload_dir}")
            
            # Determine bucket name based on directory
            if "products" in upload_dir:
                bucket = "product_images"
            else:
                bucket = "images"
            
            migrated, errors = await migrate_directory(upload_dir, bucket)
            total_migrated += migrated
            total_errors += errors
    
    print()
    print("=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"  Total files migrated: {total_migrated}")
    print(f"  Errors: {total_errors}")
    
    # Get new stats
    print()
    print("GridFS stats (after migration):")
    try:
        stats = await get_storage_stats("images")
        print(f"  Images bucket: {stats['total_files']} files, {stats['total_size_mb']} MB")
        stats = await get_storage_stats("product_images")
        print(f"  Product images bucket: {stats['total_files']} files, {stats['total_size_mb']} MB")
    except Exception as e:
        print(f"  Error getting stats: {e}")
    
    print()
    print("Note: Legacy URLs (/api/uploads/*, /api/shop/images/*) will continue to work.")
    print("New uploads will use GridFS (/api/images/*, /api/shop/images/gridfs/*).")


if __name__ == "__main__":
    asyncio.run(main())
