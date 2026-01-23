"""
AI Email Generation Service
Uses LLM to generate personalized, contextual emails for UGC campaigns
"""
import os
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Try to import emergentintegrations
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    logger.warning("emergentintegrations not available, falling back to template emails")


async def generate_confirmation_email(
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    campaign_data: dict
) -> str:
    """
    Generate personalized confirmation email using AI
    
    Args:
        creator_name: Name of the creator
        campaign_name: Name of the campaign
        brand_name: Name of the brand
        campaign_data: Full campaign data including canje details
    """
    
    if not AI_AVAILABLE:
        return _fallback_confirmation_email(creator_name, campaign_name, brand_name, campaign_data)
    
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            logger.warning("EMERGENT_LLM_KEY not found, using fallback template")
            return _fallback_confirmation_email(creator_name, campaign_name, brand_name, campaign_data)
        
        # Extract canje details
        canje = campaign_data.get('canje', {})
        canje_type = canje.get('type', 'product')  # product, service, experience
        delivery_method = canje.get('delivery_method', 'not_applicable')  # delivery, pickup, not_applicable
        canje_description = canje.get('description', '')
        pickup_address = canje.get('pickup_address', '')
        pickup_maps_url = canje.get('pickup_maps_url', '')
        pickup_hours = canje.get('pickup_hours', '')
        brand_contact_name = canje.get('brand_contact_name', '')
        brand_contact_phone = canje.get('brand_contact_phone', '')
        
        # Campaign description
        campaign_description = campaign_data.get('description', '')
        
        # Calculate dates
        confirmation_date = datetime.now()
        content_deadline = confirmation_date + timedelta(days=7)
        content_deadline_str = content_deadline.strftime("%A %d/%m/%Y")
        
        # Translate day names to Spanish
        day_translations = {
            "Monday": "Lunes", "Tuesday": "Martes", "Wednesday": "Miércoles",
            "Thursday": "Jueves", "Friday": "Viernes", "Saturday": "Sábado", "Sunday": "Domingo"
        }
        for eng, esp in day_translations.items():
            content_deadline_str = content_deadline_str.replace(eng, esp)
        
        # Build context for AI
        context_parts = [
            f"Nombre del creador: {creator_name}",
            f"Nombre de la campaña: {campaign_name}",
            f"Marca: {brand_name}",
            f"Descripción de la campaña: {campaign_description}",
            f"Tipo de canje: {'Producto' if canje_type == 'product' else 'Experiencia/Servicio'}",
            f"Descripción del canje: {canje_description}",
            f"Fecha límite para subir contenido: {content_deadline_str}",
        ]
        
        if delivery_method == 'delivery':
            context_parts.append("Método de entrega: DELIVERY (el producto será enviado al creador)")
            if brand_contact_name:
                context_parts.append(f"Contacto comercial: {brand_contact_name}")
            if brand_contact_phone:
                context_parts.append(f"Teléfono de contacto: {brand_contact_phone}")
        elif delivery_method == 'pickup':
            context_parts.append("Método de entrega: RETIRO EN LOCAL")
            if pickup_address:
                context_parts.append(f"Dirección de retiro: {pickup_address}")
            if pickup_hours:
                context_parts.append(f"Horario de retiro: {pickup_hours}")
            if pickup_maps_url:
                context_parts.append(f"URL Google Maps: {pickup_maps_url}")
            if brand_contact_name:
                context_parts.append(f"Contacto: {brand_contact_name}")
            if brand_contact_phone:
                context_parts.append(f"Teléfono: {brand_contact_phone}")
        else:
            context_parts.append("Es una experiencia/servicio en ubicación específica")
            if pickup_address:
                context_parts.append(f"Ubicación: {pickup_address}")
            if pickup_maps_url:
                context_parts.append(f"URL Google Maps: {pickup_maps_url}")
        
        context = "\n".join(context_parts)
        
        # System prompt for email generation
        system_prompt = """Sos un experto en comunicación de marketing para una plataforma UGC llamada Avenue que conecta marcas con creadores de contenido en Paraguay.

Tu tarea es generar el CONTENIDO HTML del cuerpo de un email de confirmación de participación en una campaña.

REGLAS DE DISEÑO VISUAL:
1. Usá colores NEUTROS que funcionen en modo claro Y oscuro:
   - Fondo de secciones: #f0f0f0 o #e8e8e8
   - Texto principal: #333333
   - Texto secundario: #666666
   - Color de marca Avenue (dorado): #d4a968
   - Color de éxito/confirmado: #16a34a (verde)
   - Bordes: #d0d0d0
2. NO uses fondos muy oscuros (#000, #111) ni muy claros (#fff) en secciones
3. El ancho del contenido ya está controlado por el template (max 650px)
4. Usa padding generoso (20-25px) para que no se vea apretado

REGLAS DE CONTENIDO:
1. El tono debe ser amigable, profesional pero CONCISO - máximo 3-4 párrafos cortos
2. Usa "vos" en lugar de "tú" (español de Paraguay/Argentina)
3. ENFATIZÁ MUCHO las fechas límite - deben ser el elemento más visible
4. Las fechas deben estar en una caja destacada con borde grueso de color
5. Si es DELIVERY: mencioná brevemente que un comercial contactará en 3 días
6. Si es RETIRO: incluí dirección y link de Google Maps
7. NO incluyas el asunto del email, solo el contenido HTML del body
8. Usá estilos inline para el HTML

ESTRUCTURA OBLIGATORIA:
1. Saludo breve (1 línea)
2. Confirmación de la campaña (1-2 líneas)
3. **CAJA DE FECHAS DESTACADA** - Esto debe ser LO MÁS VISIBLE del email
4. Info del canje (breve)
5. Botón de acción
6. Nota pequeña sobre métricas"""

        user_prompt = f"""Generá el contenido HTML del email de confirmación con esta información:

{context}

Recordá:
- La URL del botón debe ser: https://avenue.com.py/login?redirect=/ugc/creator/workspace
- El botón debe decir "Ir a mi Workspace"
- Incluí una nota pequeña al final diciendo que si ya tiene sesión iniciada, el botón lo llevará directo al workspace"""

        # Initialize chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"email_gen_{datetime.now().timestamp()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        # Generate email
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        # Clean up response (remove markdown code blocks if present)
        email_content = response.strip()
        if email_content.startswith("```html"):
            email_content = email_content[7:]
        if email_content.startswith("```"):
            email_content = email_content[3:]
        if email_content.endswith("```"):
            email_content = email_content[:-3]
        
        logger.info(f"AI generated confirmation email for {creator_name} - {campaign_name}")
        return email_content.strip()
        
    except Exception as e:
        logger.error(f"Error generating AI email: {e}")
        return _fallback_confirmation_email(creator_name, campaign_name, brand_name, campaign_data)


def _fallback_confirmation_email(
    creator_name: str,
    campaign_name: str,
    brand_name: str,
    campaign_data: dict
) -> str:
    """Fallback template when AI is not available - neutral colors, emphasis on dates"""
    from datetime import datetime, timedelta
    
    confirmation_date = datetime.now()
    content_deadline = confirmation_date + timedelta(days=7)
    deadline_formatted = content_deadline.strftime("%A %d/%m/%Y")
    
    day_translations = {
        "Monday": "Lunes", "Tuesday": "Martes", "Wednesday": "Miércoles",
        "Thursday": "Jueves", "Friday": "Viernes", "Saturday": "Sábado", "Sunday": "Domingo"
    }
    for eng, esp in day_translations.items():
        deadline_formatted = deadline_formatted.replace(eng, esp)
    
    canje = campaign_data.get('canje', {})
    delivery_method = canje.get('delivery_method', 'not_applicable')
    pickup_address = canje.get('pickup_address', '')
    pickup_maps_url = canje.get('pickup_maps_url', '')
    brand_contact_phone = canje.get('brand_contact_phone', '')
    canje_description = canje.get('description', '')
    
    # Build delivery info section
    delivery_info = ""
    if delivery_method == 'delivery':
        delivery_info = """
        <div style="background-color: #fff8e6; border: 1px solid #d4a968; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <p style="color: #333333; font-size: 14px; margin: 0; line-height: 1.5;">
                📦 <strong>Delivery:</strong> En los próximos 3 días, un comercial de Avenue te contactará para coordinar el envío.
            </p>
        </div>
        """
    elif delivery_method == 'pickup' and pickup_address:
        maps_link = f'<a href="{pickup_maps_url}" target="_blank" style="color: #d4a968; text-decoration: underline;">Ver en Maps</a>' if pickup_maps_url else ''
        delivery_info = f"""
        <div style="background-color: #f0f0f0; border: 1px solid #d0d0d0; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <p style="color: #333333; font-size: 14px; margin: 0 0 8px 0;">
                📍 <strong>Retiro:</strong> {pickup_address}
            </p>
            {f'<p style="color: #666666; font-size: 13px; margin: 0;">{maps_link}</p>' if maps_link else ''}
            {f'<p style="color: #666666; font-size: 13px; margin: 8px 0 0 0;">Tel: {brand_contact_phone}</p>' if brand_contact_phone else ''}
        </div>
        """
    
    return f"""
        <h1 style="color: #333333; font-size: 22px; margin: 0 0 15px 0; font-weight: 600;">
            ¡Felicitaciones {creator_name}! 🎉
        </h1>
        <p style="color: #444444; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">
            Fuiste seleccionado para <strong style="color: #d4a968;">{campaign_name}</strong> de {brand_name}.
        </p>
        
        <!-- FECHA DESTACADA -->
        <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #ffffff; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">
                Fecha límite para publicar
            </p>
            <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">
                {deadline_formatted}
            </p>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 10px 0 0 0;">
                (7 días desde hoy)
            </p>
        </div>
        
        {delivery_info}
        
        <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 15px 0;">
            Después de publicar, tendrás 7 días más para subir los screenshots de métricas.
        </p>
        
        <div style="margin: 25px 0; text-align: center;">
            <a href="https://avenue.com.py/login?redirect=/ugc/creator/workspace" 
               style="display: inline-block; background-color: #d4a968; color: #000000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Ir a mi Workspace
            </a>
        </div>
    """
