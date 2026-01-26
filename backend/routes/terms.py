"""
Terms & Conditions Management System
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import csv
import io

router = APIRouter(prefix="/api/terms", tags=["Terms & Conditions"])

# ==================== HELPER FUNCTIONS ====================

async def get_db():
    from server import db
    return db

async def require_admin(request: Request):
    """Verify user is admin"""
    from server import get_current_user
    user = await get_current_user(request)
    if not user or user.get("role") not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== PYDANTIC MODELS ====================

class TermsDocument(BaseModel):
    name: str
    slug: str  # e.g., "ugc-creators", "ecommerce", "studio-booking"
    description: Optional[str] = None
    content_url: Optional[str] = None  # URL to PDF or page
    version: str = "1.0"
    is_active: bool = True

class AcceptTermsRequest(BaseModel):
    terms_slug: str
    version: str

# ==================== PREDEFINED TERMS DOCUMENTS ====================

TERMS_DOCUMENTS = [
    {
        "id": "terms-ugc-creators",
        "name": "Términos y Condiciones - Creadores UGC",
        "slug": "ugc-creators",
        "description": "Términos para creadores de contenido que participan en campañas UGC",
        "content_url": "/studio/ugc/terms",
        "version": "1.0",
        "category": "UGC",
        "required_for": ["ugc_creator"],
        "created_at": "2025-01-01T00:00:00Z"
    },
    {
        "id": "terms-ugc-brands",
        "name": "Términos y Condiciones - Marcas UGC",
        "slug": "ugc-brands",
        "description": "Términos para marcas que publican campañas en la plataforma UGC",
        "content_url": "/studio/ugc/terms-brands",
        "version": "1.0",
        "category": "UGC",
        "required_for": ["ugc_brand"],
        "created_at": "2025-01-01T00:00:00Z"
    },
    {
        "id": "terms-ecommerce",
        "name": "Términos y Condiciones - E-commerce",
        "slug": "ecommerce",
        "description": "Términos de compra en la tienda online",
        "content_url": "/shop/terminos-condiciones",
        "version": "1.0",
        "category": "E-commerce",
        "required_for": ["customer"],
        "created_at": "2025-01-01T00:00:00Z"
    },
    {
        "id": "terms-studio",
        "name": "Términos y Condiciones - Reservas de Studio",
        "slug": "studio-booking",
        "description": "Términos para reservas del estudio fotográfico",
        "content_url": "/studio/terms",
        "version": "1.0",
        "category": "Studio",
        "required_for": ["studio_customer"],
        "created_at": "2025-01-01T00:00:00Z"
    },
    {
        "id": "terms-privacy",
        "name": "Política de Privacidad",
        "slug": "privacy-policy",
        "description": "Política de privacidad y protección de datos personales",
        "content_url": "/privacy",
        "version": "1.0",
        "category": "Legal",
        "required_for": ["all"],
        "created_at": "2025-01-01T00:00:00Z"
    }
]

# ==================== PUBLIC ENDPOINTS ====================

@router.get("/documents", response_model=dict)
async def get_terms_documents():
    """Get list of all terms documents"""
    return {"documents": TERMS_DOCUMENTS}

@router.post("/accept", response_model=dict)
async def accept_terms(
    request: Request,
    body: AcceptTermsRequest
):
    """Record user acceptance of terms"""
    db = await get_db()
    
    # Get current user (can be authenticated or anonymous with session)
    from server import get_current_user
    user = await get_current_user(request)
    
    user_id = user.get("user_id") if user else None
    user_email = user.get("email") if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Must be logged in to accept terms")
    
    # Verify terms document exists
    terms_doc = next((t for t in TERMS_DOCUMENTS if t["slug"] == body.terms_slug), None)
    if not terms_doc:
        raise HTTPException(status_code=404, detail="Terms document not found")
    
    # Record acceptance
    acceptance = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_email": user_email,
        "terms_slug": body.terms_slug,
        "terms_name": terms_doc["name"],
        "terms_version": body.version,
        "accepted_at": datetime.now(timezone.utc).isoformat(),
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent", "")[:500]
    }
    
    # Check if already accepted this version
    existing = await db.terms_acceptances.find_one({
        "user_id": user_id,
        "terms_slug": body.terms_slug,
        "terms_version": body.version
    })
    
    if existing:
        return {"success": True, "message": "Already accepted", "acceptance_id": existing.get("id")}
    
    await db.terms_acceptances.insert_one(acceptance)
    
    return {"success": True, "message": "Terms accepted", "acceptance_id": acceptance["id"]}

@router.get("/my-acceptances", response_model=dict)
async def get_my_acceptances(request: Request):
    """Get current user's terms acceptances"""
    db = await get_db()
    
    from server import get_current_user
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    acceptances = await db.terms_acceptances.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("accepted_at", -1).to_list(100)
    
    return {"acceptances": acceptances}

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/documents", response_model=dict)
async def admin_get_terms_documents(request: Request):
    """[Admin] Get all terms documents with stats"""
    await require_admin(request)
    db = await get_db()
    
    documents = []
    for doc in TERMS_DOCUMENTS:
        # Get acceptance count
        acceptance_count = await db.terms_acceptances.count_documents({
            "terms_slug": doc["slug"]
        })
        
        doc_with_stats = {**doc, "acceptance_count": acceptance_count}
        documents.append(doc_with_stats)
    
    return {"documents": documents}

@router.get("/admin/acceptances", response_model=dict)
async def admin_get_all_acceptances(
    request: Request,
    terms_slug: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """[Admin] Get all terms acceptances with user info"""
    await require_admin(request)
    db = await get_db()
    
    query = {}
    if terms_slug:
        query["terms_slug"] = terms_slug
    
    acceptances = await db.terms_acceptances.find(
        query,
        {"_id": 0}
    ).sort("accepted_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user info
    for acc in acceptances:
        user = await db.users.find_one(
            {"user_id": acc.get("user_id")},
            {"_id": 0, "name": 1, "email": 1, "role": 1}
        )
        if user:
            acc["user_name"] = user.get("name")
            acc["user_role"] = user.get("role")
        
        # Check if creator or brand
        creator = await db.ugc_creators.find_one(
            {"user_id": acc.get("user_id")},
            {"_id": 0, "name": 1, "level": 1}
        )
        if creator:
            acc["creator_name"] = creator.get("name")
            acc["creator_level"] = creator.get("level")
        
        brand = await db.ugc_brands.find_one(
            {"user_id": acc.get("user_id")},
            {"_id": 0, "company_name": 1}
        )
        if brand:
            acc["brand_name"] = brand.get("company_name")
    
    total = await db.terms_acceptances.count_documents(query)
    
    return {
        "acceptances": acceptances,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/admin/acceptances/export", response_class=StreamingResponse)
async def admin_export_acceptances(
    request: Request,
    terms_slug: Optional[str] = None
):
    """[Admin] Export terms acceptances to CSV"""
    await require_admin(request)
    db = await get_db()
    
    query = {}
    if terms_slug:
        query["terms_slug"] = terms_slug
    
    acceptances = await db.terms_acceptances.find(
        query,
        {"_id": 0}
    ).sort("accepted_at", -1).to_list(5000)
    
    # Enrich with user info
    for acc in acceptances:
        user = await db.users.find_one(
            {"user_id": acc.get("user_id")},
            {"_id": 0, "name": 1, "email": 1, "role": 1}
        )
        if user:
            acc["user_name"] = user.get("name")
            acc["user_role"] = user.get("role")
    
    # Prepare CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Usuario",
        "Email",
        "Rol",
        "Documento",
        "Versión",
        "Fecha Aceptación",
        "IP",
        "User Agent"
    ])
    
    # Data
    for acc in acceptances:
        writer.writerow([
            acc.get("user_name", ""),
            acc.get("user_email", ""),
            acc.get("user_role", ""),
            acc.get("terms_name", acc.get("terms_slug", "")),
            acc.get("terms_version", ""),
            acc.get("accepted_at", "")[:19].replace("T", " ") if acc.get("accepted_at") else "",
            acc.get("ip_address", ""),
            acc.get("user_agent", "")[:100] if acc.get("user_agent") else ""
        ])
    
    output.seek(0)
    filename = f"terms_acceptances_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/csv; charset=utf-8"
        }
    )

@router.get("/admin/users-summary", response_model=dict)
async def admin_get_users_terms_summary(
    request: Request,
    skip: int = 0,
    limit: int = 100
):
    """[Admin] Get summary of which terms each user has accepted"""
    await require_admin(request)
    db = await get_db()
    
    # Get all users with any acceptance
    pipeline = [
        {"$group": {
            "_id": "$user_id",
            "user_email": {"$first": "$user_email"},
            "acceptances": {"$push": {
                "terms_slug": "$terms_slug",
                "terms_name": "$terms_name",
                "version": "$terms_version",
                "accepted_at": "$accepted_at"
            }},
            "total_accepted": {"$sum": 1},
            "last_acceptance": {"$max": "$accepted_at"}
        }},
        {"$sort": {"last_acceptance": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    results = await db.terms_acceptances.aggregate(pipeline).to_list(limit)
    
    # Enrich with user details
    for result in results:
        user_id = result["_id"]
        
        user = await db.users.find_one(
            {"user_id": user_id},
            {"_id": 0, "name": 1, "role": 1}
        )
        if user:
            result["user_name"] = user.get("name")
            result["user_role"] = user.get("role")
        
        # Check creator/brand
        creator = await db.ugc_creators.find_one(
            {"user_id": user_id},
            {"_id": 0, "name": 1, "level": 1}
        )
        if creator:
            result["is_creator"] = True
            result["creator_name"] = creator.get("name")
            result["creator_level"] = creator.get("level")
        
        brand = await db.ugc_brands.find_one(
            {"user_id": user_id},
            {"_id": 0, "company_name": 1}
        )
        if brand:
            result["is_brand"] = True
            result["brand_name"] = brand.get("company_name")
        
        # Remove MongoDB _id
        result["user_id"] = result.pop("_id")
    
    # Get total unique users
    total_users = len(await db.terms_acceptances.distinct("user_id"))
    
    return {
        "users": results,
        "total_users": total_users,
        "documents_available": len(TERMS_DOCUMENTS),
        "skip": skip,
        "limit": limit
    }
