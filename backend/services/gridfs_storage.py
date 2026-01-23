"""
GridFS Storage Service for Persistent Image Storage
Uses MongoDB GridFS to store images that persist across deployments
"""
import os
import io
import hashlib
from datetime import datetime, timezone
from typing import Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
import mimetypes
import logging

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# GridFS buckets for different purposes
_buckets = {}

def get_bucket(bucket_name: str = "images") -> AsyncIOMotorGridFSBucket:
    """Get or create a GridFS bucket"""
    if bucket_name not in _buckets:
        _buckets[bucket_name] = AsyncIOMotorGridFSBucket(db, bucket_name=bucket_name)
    return _buckets[bucket_name]


async def upload_image(
    file_content: bytes,
    filename: str,
    content_type: Optional[str] = None,
    metadata: Optional[dict] = None,
    bucket_name: str = "images"
) -> str:
    """
    Upload an image to GridFS
    
    Args:
        file_content: Raw bytes of the image
        filename: Original filename
        content_type: MIME type (auto-detected if not provided)
        metadata: Additional metadata to store with the file
        bucket_name: GridFS bucket name (default: "images")
    
    Returns:
        file_id: String ID of the uploaded file
    """
    bucket = get_bucket(bucket_name)
    
    # Auto-detect content type if not provided
    if not content_type:
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = "application/octet-stream"
    
    # Generate a unique filename with hash to avoid duplicates
    file_hash = hashlib.md5(file_content).hexdigest()[:8]
    ext = os.path.splitext(filename)[1].lower()
    unique_filename = f"{file_hash}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}{ext}"
    
    # Prepare metadata
    file_metadata = {
        "original_filename": filename,
        "content_type": content_type,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "size_bytes": len(file_content),
        "hash": file_hash
    }
    if metadata:
        file_metadata.update(metadata)
    
    # Upload to GridFS
    file_id = await bucket.upload_from_stream(
        unique_filename,
        io.BytesIO(file_content),
        metadata=file_metadata
    )
    
    logger.info(f"Uploaded image to GridFS: {unique_filename} (ID: {file_id})")
    return str(file_id)


async def get_image(file_id: str, bucket_name: str = "images") -> Tuple[Optional[bytes], Optional[str], Optional[str]]:
    """
    Retrieve an image from GridFS
    
    Args:
        file_id: The GridFS file ID
        bucket_name: GridFS bucket name
    
    Returns:
        Tuple of (file_content, content_type, filename) or (None, None, None) if not found
    """
    bucket = get_bucket(bucket_name)
    
    try:
        # Convert string ID to ObjectId
        oid = ObjectId(file_id)
        
        # Download the file
        grid_out = await bucket.open_download_stream(oid)
        content = await grid_out.read()
        
        # Get metadata
        metadata = grid_out.metadata or {}
        content_type = metadata.get("content_type", "application/octet-stream")
        filename = grid_out.filename
        
        return content, content_type, filename
    except Exception as e:
        logger.error(f"Error retrieving image {file_id}: {e}")
        return None, None, None


async def delete_image(file_id: str, bucket_name: str = "images") -> bool:
    """
    Delete an image from GridFS
    
    Args:
        file_id: The GridFS file ID
        bucket_name: GridFS bucket name
    
    Returns:
        True if deleted successfully, False otherwise
    """
    bucket = get_bucket(bucket_name)
    
    try:
        oid = ObjectId(file_id)
        await bucket.delete(oid)
        logger.info(f"Deleted image from GridFS: {file_id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting image {file_id}: {e}")
        return False


async def get_image_by_filename(filename: str, bucket_name: str = "images") -> Tuple[Optional[bytes], Optional[str], Optional[str]]:
    """
    Retrieve an image by filename (for backwards compatibility)
    
    Args:
        filename: The filename to search for
        bucket_name: GridFS bucket name
    
    Returns:
        Tuple of (file_content, content_type, original_filename) or (None, None, None) if not found
    """
    bucket = get_bucket(bucket_name)
    
    try:
        # Find the file by filename
        cursor = bucket.find({"filename": filename})
        async for grid_out in cursor:
            content = await grid_out.read()
            metadata = grid_out.metadata or {}
            content_type = metadata.get("content_type", "application/octet-stream")
            return content, content_type, grid_out.filename
        
        # If not found by exact filename, try searching in metadata
        cursor = bucket.find({"metadata.original_filename": filename})
        async for grid_out in cursor:
            stream = await bucket.open_download_stream(grid_out._id)
            content = await stream.read()
            metadata = grid_out.metadata or {}
            content_type = metadata.get("content_type", "application/octet-stream")
            return content, content_type, grid_out.filename
            
        return None, None, None
    except Exception as e:
        logger.error(f"Error retrieving image by filename {filename}: {e}")
        return None, None, None


async def list_images(bucket_name: str = "images", limit: int = 100) -> list:
    """
    List all images in a bucket
    
    Args:
        bucket_name: GridFS bucket name
        limit: Maximum number of results
    
    Returns:
        List of image metadata dicts
    """
    bucket = get_bucket(bucket_name)
    images = []
    
    cursor = bucket.find({}).limit(limit)
    async for grid_out in cursor:
        images.append({
            "id": str(grid_out._id),
            "filename": grid_out.filename,
            "size": grid_out.length,
            "upload_date": grid_out.upload_date.isoformat() if grid_out.upload_date else None,
            "metadata": grid_out.metadata
        })
    
    return images


async def get_storage_stats(bucket_name: str = "images") -> dict:
    """
    Get storage statistics for a bucket
    
    Args:
        bucket_name: GridFS bucket name
    
    Returns:
        Dict with storage stats
    """
    bucket = get_bucket(bucket_name)
    
    total_files = 0
    total_size = 0
    
    cursor = bucket.find({})
    async for grid_out in cursor:
        total_files += 1
        total_size += grid_out.length
    
    return {
        "bucket": bucket_name,
        "total_files": total_files,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2)
    }


def get_image_url(file_id: str, base_url: str = "") -> str:
    """
    Generate the URL for accessing an image
    
    Args:
        file_id: The GridFS file ID
        base_url: Base URL of the API (optional)
    
    Returns:
        Full URL to access the image
    """
    return f"{base_url}/api/images/{file_id}"
