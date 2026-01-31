"""
Website Builder API Routes
Handles CRUD operations for editable page content
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import os
import base64

router = APIRouter(prefix="/api/builder", tags=["Website Builder"])

# Models
class SectionStyle(BaseModel):
    backgroundColor: Optional[str] = None
    textColor: Optional[str] = None
    padding: Optional[str] = None
    margin: Optional[str] = None
    fontSize: Optional[str] = None
    fontWeight: Optional[str] = None

class SectionContent(BaseModel):
    id: str
    order: int
    type: str  # hero, features, gallery, cta, text, etc.
    visible: bool = True
    content: Dict[str, Any]  # Flexible content based on section type
    styles: Optional[SectionStyle] = None

class PageContent(BaseModel):
    page_id: str
    page_name: str
    sections: List[SectionContent]
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None

class UpdatePageContentRequest(BaseModel):
    sections: List[SectionContent]

# Default page structures - these define what sections each page has
DEFAULT_PAGES = {
    "main-landing": {
        "page_id": "main-landing",
        "page_name": "Página Principal",
        "sections": [
            {
                "id": "hero",
                "order": 1,
                "type": "hero",
                "visible": True,
                "content": {
                    "title": "AVENUE",
                    "subtitle": "Un concepto premium donde las marcas brillan",
                    "backgroundImage": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920",
                    "backgroundVideo": "",
                    "ctaText": "Explorar",
                    "ctaLink": "/shop"
                },
                "styles": {
                    "backgroundColor": "#0a0a0a",
                    "textColor": "#ffffff"
                }
            },
            {
                "id": "features",
                "order": 2,
                "type": "features",
                "visible": True,
                "content": {
                    "title": "Nuestros Servicios",
                    "items": [
                        {"icon": "Store", "title": "E-commerce", "description": "Tienda online con las mejores marcas"},
                        {"icon": "Camera", "title": "Studio", "description": "Espacio profesional para contenido"},
                        {"icon": "Users", "title": "UGC Creators", "description": "Comunidad de creadores"}
                    ]
                },
                "styles": {}
            }
        ]
    },
    "studio-landing": {
        "page_id": "studio-landing",
        "page_name": "Avenue Studio",
        "sections": [
            {
                "id": "hero",
                "order": 1,
                "type": "hero",
                "visible": True,
                "content": {
                    "title": "Avenue Studio",
                    "subtitle": "Un espacio diseñado para crear contenido extraordinario",
                    "backgroundImage": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920",
                    "backgroundVideo": "",
                    "ctaText": "Reservar",
                    "ctaLink": "/studio/reservar"
                },
                "styles": {
                    "backgroundColor": "#0a0a0a",
                    "textColor": "#ffffff"
                }
            },
            {
                "id": "services",
                "order": 2,
                "type": "services",
                "visible": True,
                "content": {
                    "title": "Servicios",
                    "items": [
                        {"title": "Alquiler de Estudio", "description": "Espacio profesional equipado", "image": "", "link": "/studio/alquiler"},
                        {"title": "UGC Creators", "description": "Programa para creadores", "image": "", "link": "/studio/ugc"}
                    ]
                },
                "styles": {}
            }
        ]
    },
    "tu-marca": {
        "page_id": "tu-marca",
        "page_name": "Tu Marca en Avenue",
        "sections": [
            {
                "id": "hero",
                "order": 1,
                "type": "hero",
                "visible": True,
                "content": {
                    "title": "Tu marca en Avenue",
                    "subtitle": "Un concepto premium donde las marcas brillan",
                    "backgroundImage": "https://images.unsplash.com/photo-1676517243531-69e3b27276e9?w=1920",
                    "backgroundVideo": "",
                    "ctaText": "Quiero saber más",
                    "ctaLink": "#contact-form"
                },
                "styles": {
                    "backgroundColor": "#0a0a0a",
                    "textColor": "#ffffff"
                }
            },
            {
                "id": "benefits",
                "order": 2,
                "type": "features",
                "visible": True,
                "content": {
                    "title": "¿Por qué Avenue?",
                    "items": [
                        {"icon": "Store", "title": "Espacio Premium", "description": "Tu marca en un entorno de lujo"},
                        {"icon": "Camera", "title": "Contenido Profesional", "description": "Acceso a nuestro estudio"},
                        {"icon": "Users", "title": "Comunidad de Creators", "description": "Conecta con microinfluencers"},
                        {"icon": "Star", "title": "Experiencia Exclusiva", "description": "Eventos privados y lanzamientos"}
                    ]
                },
                "styles": {}
            }
        ]
    },
    "ugc-campaigns": {
        "page_id": "ugc-campaigns",
        "page_name": "Campañas UGC",
        "sections": [
            {
                "id": "hero",
                "order": 1,
                "type": "hero",
                "visible": True,
                "content": {
                    "title": "UGC Creators",
                    "subtitle": "Únete a nuestra comunidad de creadores de contenido",
                    "backgroundImage": "https://images.unsplash.com/photo-1664277497095-424e085175e8?w=1920",
                    "backgroundVideo": "",
                    "ctaText": "Ver Campañas",
                    "ctaLink": "#campaigns"
                },
                "styles": {
                    "backgroundColor": "#0a0a0a",
                    "textColor": "#ffffff"
                }
            }
        ]
    },
    "booking": {
        "page_id": "booking",
        "page_name": "Reservas Studio",
        "sections": [
            {
                "id": "hero",
                "order": 1,
                "type": "hero-small",
                "visible": True,
                "content": {
                    "title": "Agenda tu sesión",
                    "subtitle": "Reserva tu espacio en Avenue Studio",
                    "backgroundImage": "https://images.pexels.com/photos/35465931/pexels-photo-35465931.jpeg?w=1920",
                    "backgroundVideo": ""
                },
                "styles": {
                    "backgroundColor": "#0a0a0a",
                    "textColor": "#ffffff"
                }
            }
        ]
    }
}

def get_db():
    """Get database instance - imported from main server"""
    from server import db
    return db

@router.get("/pages")
async def get_all_pages():
    """Get list of all editable pages"""
    db = get_db()
    
    # Get saved pages from DB
    saved_pages = await db.page_content.find({}, {"_id": 0}).to_list(100)
    saved_page_ids = {p["page_id"] for p in saved_pages}
    
    # Merge with defaults
    all_pages = []
    for page_id, default in DEFAULT_PAGES.items():
        if page_id in saved_page_ids:
            saved = next(p for p in saved_pages if p["page_id"] == page_id)
            all_pages.append(saved)
        else:
            all_pages.append(default)
    
    return all_pages

@router.get("/pages/{page_id}")
async def get_page_content(page_id: str):
    """Get content for a specific page"""
    db = get_db()
    
    # Try to get from DB first
    page = await db.page_content.find_one({"page_id": page_id}, {"_id": 0})
    
    if page:
        return page
    
    # Return default if not in DB
    if page_id in DEFAULT_PAGES:
        return DEFAULT_PAGES[page_id]
    
    raise HTTPException(status_code=404, detail="Page not found")

@router.put("/pages/{page_id}")
async def update_page_content(page_id: str, request: UpdatePageContentRequest):
    """Update content for a specific page"""
    db = get_db()
    
    if page_id not in DEFAULT_PAGES:
        raise HTTPException(status_code=404, detail="Page not found")
    
    page_data = {
        "page_id": page_id,
        "page_name": DEFAULT_PAGES[page_id]["page_name"],
        "sections": [section.dict() for section in request.sections],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.page_content.update_one(
        {"page_id": page_id},
        {"$set": page_data},
        upsert=True
    )
    
    return {"success": True, "message": "Page content updated successfully"}

@router.post("/pages/{page_id}/reset")
async def reset_page_content(page_id: str):
    """Reset page content to defaults"""
    db = get_db()
    
    if page_id not in DEFAULT_PAGES:
        raise HTTPException(status_code=404, detail="Page not found")
    
    await db.page_content.delete_one({"page_id": page_id})
    
    return {"success": True, "message": "Page reset to defaults"}

@router.post("/upload-media")
async def upload_media(file: UploadFile = File(...)):
    """Upload image or video file to Cloudinary (persistent storage)"""
    import uuid
    from services.cloudinary_storage import upload_image as cloudinary_upload, upload_video as cloudinary_video_upload, CLOUDINARY_CONFIGURED
    from services.image_migration_helper import CLOUDINARY_ENABLED
    
    # Validate file type
    allowed_types = [
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-m4v"
    ]
    
    # Also check by file extension for .mov files that might have wrong mime type
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov', '.avi', '.m4v']
    video_extensions = ['.mp4', '.webm', '.mov', '.avi', '.m4v']
    file_ext = os.path.splitext(file.filename.lower())[1] if file.filename else ''
    
    if file.content_type not in allowed_types and file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: images and videos (.mov, .mp4, .webm)")
    
    # Read file content
    content = await file.read()
    
    # 250MB limit
    max_size = 250 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 250MB")
    
    # Determine content type
    content_type = file.content_type
    if file_ext == '.mov' and content_type == 'application/octet-stream':
        content_type = 'video/quicktime'
    elif file_ext == '.mp4' and content_type == 'application/octet-stream':
        content_type = 'video/mp4'
    
    # Check if it's a video file
    is_video = file_ext in video_extensions or content_type.startswith('video/')
    
    # Try Cloudinary first (preferred for persistence)
    if CLOUDINARY_ENABLED and CLOUDINARY_CONFIGURED:
        try:
            if is_video:
                result = await cloudinary_video_upload(
                    file_content=content,
                    filename=file.filename,
                    folder="avenue/general",
                    metadata={"type": "website_builder", "original_filename": file.filename}
                )
            else:
                result = await cloudinary_upload(
                    file_content=content,
                    filename=file.filename,
                    folder="avenue/general",
                    public=True,
                    metadata={"type": "website_builder", "original_filename": file.filename}
                )
            
            if result.get("success"):
                return {
                    "success": True,
                    "url": result.get("url"),
                    "cloudinary_url": result.get("url"),
                    "public_id": result.get("public_id"),
                    "filename": file.filename,
                    "content_type": content_type,
                    "size": len(content),
                    "storage": "cloudinary"
                }
            else:
                # Log but continue to fallback
                print(f"Cloudinary upload failed: {result.get('error')}")
        except Exception as e:
            print(f"Cloudinary error: {e}")
    
    # Fallback: For videos or large files, save to disk (not persistent!)
    if is_video or len(content) > 5 * 1024 * 1024:
        # Create uploads directory if it doesn't exist
        uploads_dir = "/app/frontend/public/uploads"
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(uploads_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return URL that can be accessed from frontend
        file_url = f"/uploads/{unique_filename}"
        
        return {
            "success": True,
            "url": file_url,
            "filename": file.filename,
            "content_type": content_type,
            "size": len(content),
            "storage": "disk",
            "warning": "Archivo guardado localmente. Se perderá en el próximo deploy. Configure Cloudinary para persistencia."
        }
    else:
        # For smaller image files, use base64 data URL
        base64_content = base64.b64encode(content).decode('utf-8')
        data_url = f"data:{content_type};base64,{base64_content}"
        
        return {
            "success": True,
            "url": data_url,
            "filename": file.filename,
            "content_type": content_type,
            "size": len(content),
            "storage": "base64"
        }

@router.post("/sections/{page_id}/reorder")
async def reorder_sections(page_id: str, section_orders: List[Dict[str, Any]]):
    """Reorder sections within a page"""
    db = get_db()
    
    page = await db.page_content.find_one({"page_id": page_id})
    if not page:
        if page_id not in DEFAULT_PAGES:
            raise HTTPException(status_code=404, detail="Page not found")
        page = DEFAULT_PAGES[page_id].copy()
    
    # Update section orders
    sections = page.get("sections", [])
    order_map = {item["id"]: item["order"] for item in section_orders}
    
    for section in sections:
        if section["id"] in order_map:
            section["order"] = order_map[section["id"]]
    
    # Sort by new order
    sections.sort(key=lambda x: x["order"])
    
    # Update in DB
    page["sections"] = sections
    page["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.page_content.update_one(
        {"page_id": page_id},
        {"$set": page},
        upsert=True
    )
    
    return {"success": True, "sections": sections}


# New endpoints for WYSIWYG modifications

class PageModifications(BaseModel):
    modifications: Dict[str, str]  # selector -> value mappings

@router.get("/modifications/{page_id}")
async def get_page_modifications(page_id: str):
    """Get saved modifications for a page"""
    db = get_db()
    
    result = await db.page_modifications.find_one({"page_id": page_id}, {"_id": 0})
    if result:
        return result
    
    return {"page_id": page_id, "modifications": {}}

@router.put("/modifications/{page_id}")
async def save_page_modifications(page_id: str, data: PageModifications):
    """Save modifications for a page"""
    db = get_db()
    
    await db.page_modifications.update_one(
        {"page_id": page_id},
        {"$set": {
            "page_id": page_id,
            "modifications": data.modifications,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"success": True, "message": "Modifications saved"}

