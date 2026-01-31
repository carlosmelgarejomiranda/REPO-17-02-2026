"""
Cloudinary Upload Routes
Handles file uploads to Cloudinary with signed upload support
"""
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends, Request
from typing import Optional
import logging
from services.cloudinary_storage import (
    upload_image,
    upload_video,
    delete_asset,
    generate_upload_signature,
    get_optimized_url,
    generate_signed_url,
    CLOUDINARY_CONFIGURED,
    ALLOWED_FOLDERS
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/cloudinary", tags=["cloudinary"])


@router.get("/status")
async def cloudinary_status():
    """Check if Cloudinary is configured"""
    return {
        "configured": CLOUDINARY_CONFIGURED,
        "allowed_folders": ALLOWED_FOLDERS
    }


@router.get("/signature")
async def get_upload_signature(
    folder: str = Query("avenue/general", description="Target folder for upload"),
    resource_type: str = Query("image", enum=["image", "video"])
):
    """
    Generate a signature for frontend direct upload to Cloudinary.
    
    The frontend can use this signature to upload directly to Cloudinary
    without passing through our backend, which is faster for large files.
    
    Usage:
    1. Frontend calls this endpoint to get signature
    2. Frontend uploads directly to Cloudinary using the signature
    3. Frontend sends the resulting URL to backend to save in database
    """
    if not CLOUDINARY_CONFIGURED:
        raise HTTPException(status_code=503, detail="Cloudinary not configured")
    
    try:
        sig_data = generate_upload_signature(folder, resource_type)
        return sig_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Signature generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate upload signature")


@router.post("/upload")
async def upload_file_to_cloudinary(
    file: UploadFile = File(...),
    folder: str = Query("avenue/general", description="Target folder"),
    public: bool = Query(True, description="Whether file should be publicly accessible")
):
    """
    Upload a file through the backend to Cloudinary.
    
    Use this for:
    - Small files where direct upload is overkill
    - When you need server-side validation before upload
    - Private/sensitive files (receipts, etc.)
    
    For large files, prefer using /signature endpoint for direct upload.
    """
    if not CLOUDINARY_CONFIGURED:
        raise HTTPException(status_code=503, detail="Cloudinary not configured")
    
    # Read file content
    content = await file.read()
    
    # Determine if it's an image or video
    content_type = file.content_type or ""
    is_video = content_type.startswith("video/")
    
    try:
        if is_video:
            result = await upload_video(
                file_content=content,
                filename=file.filename,
                folder=folder
            )
        else:
            result = await upload_image(
                file_content=content,
                filename=file.filename,
                folder=folder,
                public=public
            )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Upload failed"))
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete")
async def delete_cloudinary_asset(
    public_id: str = Query(..., description="Cloudinary public_id to delete"),
    resource_type: str = Query("image", enum=["image", "video"])
):
    """
    Delete an asset from Cloudinary.
    
    Only use this after verifying the user has permission to delete the asset.
    """
    if not CLOUDINARY_CONFIGURED:
        raise HTTPException(status_code=503, detail="Cloudinary not configured")
    
    success = delete_asset(public_id, resource_type)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete asset")
    
    return {"success": True, "deleted": public_id}


@router.get("/transform")
async def get_transformed_url(
    public_id: str = Query(..., description="Cloudinary public_id"),
    width: Optional[int] = Query(None, description="Target width"),
    height: Optional[int] = Query(None, description="Target height"),
    crop: str = Query("fill", enum=["fill", "fit", "thumb", "scale"]),
    quality: str = Query("auto"),
    format: str = Query("auto", enum=["auto", "webp", "jpg", "png"])
):
    """
    Get an optimized/transformed image URL.
    
    Use this to generate thumbnail URLs, resized versions, etc.
    """
    url = get_optimized_url(
        public_id=public_id,
        width=width,
        height=height,
        crop=crop,
        quality=quality,
        format=format
    )
    
    return {"url": url}


@router.get("/signed-url")
async def get_signed_download_url(
    public_id: str = Query(..., description="Cloudinary public_id"),
    expires_in: int = Query(3600, description="URL validity in seconds"),
    resource_type: str = Query("image", enum=["image", "video"])
):
    """
    Generate a signed URL for private assets.
    
    Use this for sensitive files like payment receipts that shouldn't be public.
    """
    if not CLOUDINARY_CONFIGURED:
        raise HTTPException(status_code=503, detail="Cloudinary not configured")
    
    try:
        url = generate_signed_url(public_id, expires_in, resource_type)
        return {"url": url, "expires_in": expires_in}
    except Exception as e:
        logger.error(f"Signed URL generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate signed URL")
