"""
Image Migration Helper
Handles dual-write strategy for safe migration to Cloudinary
"""
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Flag to enable/disable Cloudinary for new uploads
# Set to True to start using Cloudinary for new uploads
CLOUDINARY_ENABLED = True

def get_best_image_url(item: Dict[str, Any], field_priority: list = None) -> Optional[str]:
    """
    Get the best available image URL for an item.
    Prefers Cloudinary URLs over legacy URLs.
    
    Args:
        item: Dictionary with image fields (product, campaign, creator, etc.)
        field_priority: List of field names to check in order
                       Default: ['cloudinary_url', 'cloudinary_image', 'custom_image', 'image', 'cover_image_url']
    
    Returns:
        Best available image URL or None
    """
    if field_priority is None:
        field_priority = [
            'cloudinary_url',      # New Cloudinary URL (migration)
            'cloudinary_image',    # Alternative Cloudinary field
            'custom_image',        # Legacy custom image
            'image',               # Default image
            'cover_image_url',     # Campaign cover
            'profile_picture',     # Creator profile
            'logo_url',            # Brand logo
        ]
    
    for field in field_priority:
        url = item.get(field)
        if url and isinstance(url, str) and len(url) > 0:
            return url
    
    return None


def get_product_image_url(product: Dict[str, Any]) -> Optional[str]:
    """Get the best image URL for a product"""
    return get_best_image_url(product, [
        'cloudinary_url',
        'custom_image', 
        'image'
    ])


def get_product_all_images(product: Dict[str, Any]) -> list:
    """
    Get all images for a product, preferring Cloudinary URLs.
    Returns list of up to 3 image URLs.
    """
    result = []
    
    # Check for Cloudinary images array first
    cloudinary_images = product.get('cloudinary_images', [])
    if cloudinary_images and isinstance(cloudinary_images, list):
        result = [url for url in cloudinary_images if url]
    
    # If no Cloudinary images, use legacy images
    if not result:
        legacy_images = product.get('images', [])
        if legacy_images and isinstance(legacy_images, list):
            result = [url for url in legacy_images if url]
    
    # If still nothing, try custom_image
    if not result:
        custom = product.get('cloudinary_url') or product.get('custom_image')
        if custom:
            result = [custom]
    
    # Fallback to ERP image
    if not result:
        erp_image = product.get('image')
        if erp_image:
            result = [erp_image]
    
    return result[:3]  # Max 3 images


def get_campaign_cover_url(campaign: Dict[str, Any]) -> Optional[str]:
    """Get the best cover image URL for a campaign"""
    return get_best_image_url(campaign, [
        'cloudinary_cover_url',
        'cover_image_url'
    ])


def get_creator_profile_picture(creator: Dict[str, Any]) -> Optional[str]:
    """Get the best profile picture URL for a creator"""
    return get_best_image_url(creator, [
        'cloudinary_profile_url',
        'profile_picture'
    ])


def get_brand_logo_url(brand: Dict[str, Any]) -> Optional[str]:
    """Get the best logo URL for a brand"""
    return get_best_image_url(brand, [
        'cloudinary_logo_url',
        'logo_url'
    ])


def is_cloudinary_url(url: str) -> bool:
    """Check if a URL is from Cloudinary"""
    if not url:
        return False
    return 'cloudinary.com' in url or 'res.cloudinary.com' in url


def is_legacy_url(url: str) -> bool:
    """Check if a URL is a legacy format (needs migration)"""
    if not url:
        return False
    legacy_patterns = [
        '/api/shop/images/',
        '/api/images/',
        '/api/upload/',
        '/uploads/',
        'data:image',  # Base64
    ]
    return any(pattern in url for pattern in legacy_patterns)
