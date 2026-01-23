"""
Servicio de verificación de redes sociales usando IA con visión
Analiza screenshots de perfiles de Instagram/TikTok para extraer métricas automáticamente
"""

import os
import base64
import json
import re
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

class SocialVerificationService:
    def __init__(self):
        self.api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not configured")
    
    async def analyze_profile_screenshot(self, image_base64: str, platform: str) -> Dict[str, Any]:
        """
        Analiza un screenshot de perfil y extrae métricas
        
        Args:
            image_base64: Imagen en base64 (sin el prefijo data:image/...)
            platform: 'instagram' o 'tiktok'
            
        Returns:
            Dict con username, follower_count, following_count, posts_count, is_verified, etc.
        """
        
        # Crear instancia de chat con visión
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"social-verify-{datetime.now(timezone.utc).timestamp()}",
            system_message="""Eres un experto en analizar screenshots de perfiles de redes sociales.
Tu trabajo es extraer información precisa de los screenshots de perfiles de Instagram y TikTok.

IMPORTANTE:
- Extrae los números EXACTOS que ves en la imagen
- Los números pueden estar abreviados (ej: 1.5K = 1500, 2.3M = 2300000)
- Si no puedes ver claramente un dato, indica null
- El username es el @handle del perfil
- Detecta si el perfil tiene la insignia de verificación (check azul)

Responde SIEMPRE en formato JSON válido, sin texto adicional."""
        ).with_model("openai", "gpt-4o")
        
        # Preparar el prompt según la plataforma
        if platform.lower() == 'instagram':
            extraction_prompt = """Analiza este screenshot de un perfil de Instagram y extrae la siguiente información en JSON:

{
    "platform": "instagram",
    "username": "el @username del perfil (sin el @)",
    "display_name": "el nombre mostrado del perfil",
    "follower_count": número de seguidores (convertir K/M a número entero),
    "following_count": número de seguidos,
    "posts_count": número de publicaciones,
    "is_verified": true/false si tiene insignia azul de verificación,
    "bio": "biografía del perfil si es visible",
    "profile_category": "categoría del perfil si es visible (ej: Creator, Artist, etc)",
    "confidence": "high/medium/low" - qué tan seguro estás de los datos extraídos,
    "extraction_notes": "cualquier nota sobre la extracción"
}

Si algún dato no es visible o no puedes determinarlo con certeza, usa null."""

        elif platform.lower() == 'tiktok':
            extraction_prompt = """Analiza este screenshot de un perfil de TikTok y extrae la siguiente información en JSON:

{
    "platform": "tiktok",
    "username": "el @username del perfil (sin el @)",
    "display_name": "el nombre mostrado del perfil",
    "follower_count": número de seguidores (convertir K/M a número entero),
    "following_count": número de seguidos,
    "likes_count": número total de likes/me gusta,
    "is_verified": true/false si tiene insignia de verificación,
    "bio": "biografía del perfil si es visible",
    "confidence": "high/medium/low" - qué tan seguro estás de los datos extraídos,
    "extraction_notes": "cualquier nota sobre la extracción"
}

Si algún dato no es visible o no puedes determinarlo con certeza, usa null."""
        else:
            extraction_prompt = """Analiza este screenshot de un perfil de red social y extrae:

{
    "platform": "la plataforma detectada (instagram/tiktok/youtube/otro)",
    "username": "el username del perfil",
    "follower_count": número de seguidores,
    "is_verified": true/false,
    "confidence": "high/medium/low",
    "extraction_notes": "notas sobre la extracción"
}"""

        try:
            # Crear contenido de imagen
            image_content = ImageContent(image_base64=image_base64)
            
            # Crear mensaje con la imagen
            user_message = UserMessage(
                text=extraction_prompt,
                file_contents=[image_content]
            )
            
            # Enviar y obtener respuesta con retry
            max_retries = 2
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    response = await chat.send_message(user_message)
                    
                    # Verificar si la respuesta contiene errores conocidos
                    if response and ("disturbed" in response.lower() or "locked" in response.lower()):
                        if attempt < max_retries - 1:
                            continue  # Reintentar
                        else:
                            return {
                                "success": False,
                                "error": "No se pudo procesar la imagen. Intentá con un screenshot más claro.",
                                "data": None
                            }
                    
                    # Parsear la respuesta JSON
                    result = self._parse_ai_response(response)
                    
                    # Agregar metadata
                    result["verified_at"] = datetime.now(timezone.utc).isoformat()
                    result["verification_method"] = "ai_screenshot_analysis"
                    result["ai_model"] = "gpt-4o"
                    
                    return {
                        "success": True,
                        "data": result
                    }
                    
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        continue
            
            return {
                "success": False,
                "error": str(last_error) if last_error else "Error desconocido",
                "data": None
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "data": None
            }
    
    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parsea la respuesta de la IA y extrae el JSON"""
        
        # Limpiar la respuesta
        response = response.strip()
        
        # Intentar extraer JSON de la respuesta
        # A veces viene con ```json ... ```
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response)
        if json_match:
            response = json_match.group(1)
        
        # Intentar parsear directamente
        try:
            data = json.loads(response)
            return self._normalize_data(data)
        except json.JSONDecodeError:
            # Intentar encontrar un objeto JSON en el texto
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                    return self._normalize_data(data)
                except json.JSONDecodeError:
                    pass
        
        # Si no se puede parsear, devolver estructura básica con error
        return {
            "error": "No se pudo parsear la respuesta de la IA",
            "raw_response": response[:500],
            "confidence": "low"
        }
    
    def _normalize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza los datos extraídos"""
        
        # Asegurar que los conteos sean enteros
        for field in ['follower_count', 'following_count', 'posts_count', 'likes_count']:
            if field in data and data[field] is not None:
                try:
                    # Manejar strings con K, M, B
                    value = data[field]
                    if isinstance(value, str):
                        value = value.replace(',', '').replace(' ', '')
                        if 'K' in value.upper():
                            value = float(value.upper().replace('K', '')) * 1000
                        elif 'M' in value.upper():
                            value = float(value.upper().replace('M', '')) * 1000000
                        elif 'B' in value.upper():
                            value = float(value.upper().replace('B', '')) * 1000000000
                    data[field] = int(float(value))
                except (ValueError, TypeError):
                    data[field] = None
        
        # Limpiar username (quitar @)
        if 'username' in data and data['username']:
            data['username'] = data['username'].lstrip('@').strip()
        
        # Asegurar booleano para is_verified
        if 'is_verified' in data:
            data['is_verified'] = bool(data['is_verified'])
        
        return data


# Instancia global del servicio
social_verification_service = SocialVerificationService()
