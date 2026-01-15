"""
Rutas para verificación de redes sociales con IA
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import base64
from datetime import datetime, timezone

from services.social_verification_service import social_verification_service
from server import get_current_user, db

router = APIRouter(prefix="/api/social-verification", tags=["Social Verification"])


class VerifyScreenshotRequest(BaseModel):
    image_base64: str  # Imagen en base64
    platform: str  # 'instagram' o 'tiktok'


@router.post("/verify")
async def verify_social_profile(
    request: VerifyScreenshotRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verificar perfil de red social analizando un screenshot con IA
    
    El creador sube un screenshot de su perfil y la IA extrae:
    - Username
    - Número de seguidores
    - Número de seguidos
    - Posts/Videos
    - Si está verificado
    """
    try:
        # Limpiar el base64 si viene con prefijo data:image
        image_data = request.image_base64
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Validar que sea base64 válido
        try:
            base64.b64decode(image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Imagen base64 inválida")
        
        # Analizar con IA
        result = await social_verification_service.analyze_profile_screenshot(
            image_base64=image_data,
            platform=request.platform
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Error al analizar imagen"))
        
        extracted_data = result["data"]
        
        # Verificar que se extrajeron datos mínimos
        if not extracted_data.get("username") or extracted_data.get("follower_count") is None:
            raise HTTPException(
                status_code=400, 
                detail="No se pudieron extraer los datos del perfil. Asegúrate de que el screenshot muestre claramente el perfil con el número de seguidores visible."
            )
        
        return {
            "success": True,
            "extracted_data": extracted_data,
            "message": "Datos extraídos correctamente. Confirma para guardar la verificación."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/confirm")
async def confirm_verification(
    platform: str,
    username: str,
    follower_count: int,
    following_count: Optional[int] = None,
    posts_count: Optional[int] = None,
    likes_count: Optional[int] = None,
    is_verified: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Confirmar y guardar la verificación de red social
    """
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="No autenticado")
        
        # Buscar el perfil del creador usando user_id
        user_id = current_user.get("user_id") or current_user.get("id")
        creator = await db.ugc_creators.find_one({"user_id": user_id})
        if not creator:
            raise HTTPException(status_code=404, detail="Perfil de creador no encontrado. Primero debes completar el registro como creador.")
        
        # Preparar datos de la cuenta social
        social_data = {
            "platform": platform.lower(),
            "username": username,
            "follower_count": follower_count,
            "following_count": following_count,
            "posts_count": posts_count,
            "likes_count": likes_count,
            "is_platform_verified": is_verified,
            "verified_by_ai": True,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "verification_method": "screenshot_ai",
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
        # Actualizar en el creador
        platform_key = platform.lower()
        update_field = f"social_accounts.{platform_key}"
        
        await db.ugc_creators.update_one(
            {"id": creator["id"]},
            {
                "$set": {
                    update_field: social_data,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # También actualizar los campos legacy si existen
        legacy_updates = {}
        if platform_key == "instagram":
            legacy_updates["instagram_handle"] = username
            legacy_updates["instagram_followers"] = follower_count
        elif platform_key == "tiktok":
            legacy_updates["tiktok_handle"] = username
            legacy_updates["tiktok_followers"] = follower_count
        
        if legacy_updates:
            await db.ugc_creators.update_one(
                {"id": creator["id"]},
                {"$set": legacy_updates}
            )
        
        return {
            "success": True,
            "message": f"Perfil de {platform} verificado correctamente",
            "data": social_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_verification_status(current_user: dict = Depends(get_current_user)):
    """
    Obtener estado de verificación de redes sociales del creador
    """
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="No autenticado")
            
        user_id = current_user.get("user_id") or current_user.get("id")
        creator = await db.ugc_creators.find_one({"user_id": user_id})
        if not creator:
            # Return empty if no creator profile (user might not be a creator)
            return {
                "instagram": None,
                "tiktok": None,
                "youtube": None
            }
        
        social_accounts = creator.get("social_accounts", {})
        
        return {
            "instagram": social_accounts.get("instagram"),
            "tiktok": social_accounts.get("tiktok"),
            "youtube": social_accounts.get("youtube")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{platform}")
async def remove_verification(
    platform: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Eliminar verificación de una plataforma
    """
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="No autenticado")
            
        user_id = current_user.get("user_id") or current_user.get("id")
        creator = await db.ugc_creators.find_one({"user_id": user_id})
        if not creator:
            raise HTTPException(status_code=404, detail="Perfil de creador no encontrado")
        
        platform_key = platform.lower()
        update_field = f"social_accounts.{platform_key}"
        
        await db.ugc_creators.update_one(
            {"id": creator["id"]},
            {
                "$unset": {update_field: ""},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        return {
            "success": True,
            "message": f"Verificación de {platform} eliminada"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
