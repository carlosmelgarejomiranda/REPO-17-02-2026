"""
Cloudinary Storage Service for Persistent Image/Video Storage
Uses Cloudinary CDN for fast delivery and transformations
"""
import os
import time
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from typing import Optional, Dict, Any
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Initialize Cloudinary configuration
def init_cloudinary():
    """Initialize Cloudinary with environment variables"""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    
    if not all([cloud_name, api_key, api_secret]):
        logger.warning("Cloudinary credentials not configured. File uploads will fail.")
        return False
    
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
    logger.info(f"Cloudinary initialized with cloud: {cloud_name}")
    return True

# Initialize on module load
CLOUDINARY_CONFIGURED = init_cloudinary()

# Allowed folders for security
ALLOWED_FOLDERS = (
    "avenue/brands/",      # Brand logos
    "avenue/creators/",    # Creator profile pictures
    "avenue/campaigns/",   # Campaign cover images
    "avenue/metrics/",     # Metrics screenshots
    "avenue/receipts/",    # Payment receipts (private)
    "avenue/products/",    # Product images
    "avenue/general/",     # General uploads
)

def is_folder_allowed(folder: str) -> bool:
    """Check if folder path is allowed"""
    return any(folder.startswith(allowed) for allowed in ALLOWED_FOLDERS)


async def upload_image(
    file_content: bytes,
    filename: str,
    folder: str = "avenue/general",
    public: bool = True,
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Upload an image to Cloudinary
    
    Args:
        file_content: Raw bytes of the image
        filename: Original filename
        folder: Folder path in Cloudinary (must be in ALLOWED_FOLDERS)
        public: If True, image is publicly accessible. If False, requires signed URL
        metadata: Additional metadata (stored as context)
    
    Returns:
        Dict with upload result including 'url', 'public_id', 'secure_url'
    """
    if not CLOUDINARY_CONFIGURED:
        raise RuntimeError("Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET")
    
    if not is_folder_allowed(folder):
        raise ValueError(f"Folder '{folder}' not allowed. Must start with one of: {ALLOWED_FOLDERS}")
    
    try:
        # Prepare upload options
        options = {
            "folder": folder,
            "resource_type": "image",
            "use_filename": True,
            "unique_filename": True,
        }
        
        # For private files (receipts, sensitive docs)
        if not public:
            options["type"] = "private"
        
        # Add metadata as context
        if metadata:
            context_str = "|".join([f"{k}={v}" for k, v in metadata.items()])
            options["context"] = context_str
        
        # Upload from bytes
        result = cloudinary.uploader.upload(file_content, **options)
        
        logger.info(f"Uploaded to Cloudinary: {result.get('public_id')} -> {result.get('secure_url')}")
        
        return {
            "success": True,
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
            "bytes": result.get("bytes"),
            "resource_type": result.get("resource_type"),
            "created_at": result.get("created_at"),
        }
        
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def upload_video(
    file_content: bytes,
    filename: str,
    folder: str = "avenue/general",
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Upload a video to Cloudinary
    
    Args:
        file_content: Raw bytes of the video
        filename: Original filename
        folder: Folder path in Cloudinary
        metadata: Additional metadata
    
    Returns:
        Dict with upload result
    """
    if not CLOUDINARY_CONFIGURED:
        raise RuntimeError("Cloudinary not configured")
    
    if not is_folder_allowed(folder):
        raise ValueError(f"Folder '{folder}' not allowed")
    
    try:
        options = {
            "folder": folder,
            "resource_type": "video",
            "use_filename": True,
            "unique_filename": True,
        }
        
        if metadata:
            context_str = "|".join([f"{k}={v}" for k, v in metadata.items()])
            options["context"] = context_str
        
        result = cloudinary.uploader.upload(file_content, **options)
        
        logger.info(f"Uploaded video to Cloudinary: {result.get('public_id')}")
        
        return {
            "success": True,
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "duration": result.get("duration"),
            "format": result.get("format"),
            "bytes": result.get("bytes"),
        }
        
    except Exception as e:
        logger.error(f"Cloudinary video upload failed: {e}")
        return {"success": False, "error": str(e)}


def delete_asset(public_id: str, resource_type: str = "image") -> bool:
    """
    Delete an asset from Cloudinary
    
    Args:
        public_id: The Cloudinary public_id
        resource_type: "image" or "video"
    
    Returns:
        True if deleted successfully
    """
    if not CLOUDINARY_CONFIGURED:
        return False
    
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type, invalidate=True)
        success = result.get("result") == "ok"
        if success:
            logger.info(f"Deleted from Cloudinary: {public_id}")
        return success
    except Exception as e:
        logger.error(f"Cloudinary delete failed: {e}")
        return False


def generate_signed_url(public_id: str, expires_in: int = 3600, resource_type: str = "image") -> str:
    """
    Generate a signed URL for private assets
    
    Args:
        public_id: The Cloudinary public_id
        expires_in: URL validity in seconds (default: 1 hour)
        resource_type: "image" or "video"
    
    Returns:
        Signed URL string
    """
    if not CLOUDINARY_CONFIGURED:
        raise RuntimeError("Cloudinary not configured")
    
    timestamp = int(time.time()) + expires_in
    
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        type="private",
        sign_url=True,
        secure=True,
    )
    
    return url


def get_optimized_url(
    public_id: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    crop: str = "fill",
    quality: str = "auto",
    format: str = "auto"
) -> str:
    """
    Get an optimized/transformed image URL
    
    Args:
        public_id: The Cloudinary public_id
        width: Target width
        height: Target height
        crop: Crop mode (fill, fit, thumb, etc.)
        quality: Quality setting (auto, 80, etc.)
        format: Output format (auto, webp, jpg, etc.)
    
    Returns:
        Optimized image URL
    """
    transformations = {
        "quality": quality,
        "fetch_format": format,
    }
    
    if width:
        transformations["width"] = width
    if height:
        transformations["height"] = height
    if width or height:
        transformations["crop"] = crop
    
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        **transformations,
        secure=True
    )
    
    return url


def generate_upload_signature(folder: str = "avenue/general", resource_type: str = "image") -> Dict[str, Any]:
    """
    Generate signature for frontend direct upload to Cloudinary
    
    Args:
        folder: Target folder
        resource_type: "image" or "video"
    
    Returns:
        Dict with signature, timestamp, api_key, cloud_name for frontend
    """
    if not CLOUDINARY_CONFIGURED:
        raise RuntimeError("Cloudinary not configured")
    
    if not is_folder_allowed(folder):
        raise ValueError(f"Folder '{folder}' not allowed")
    
    timestamp = int(time.time())
    
    params = {
        "timestamp": timestamp,
        "folder": folder,
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        os.getenv("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "folder": folder,
        "resource_type": resource_type,
    }
