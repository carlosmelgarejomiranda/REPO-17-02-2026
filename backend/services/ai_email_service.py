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

REGLAS IMPORTANTES:
1. El tono debe ser amigable, profesional y entusiasta pero no exagerado
2. Usa "vos" en lugar de "tú" (español de Paraguay/Argentina)
3. El email debe ser conciso pero informativo
4. Incluí SIEMPRE la fecha límite para subir contenido
5. Mencioná que después de subir el URL tienen 7 días para subir screenshots de métricas
6. Si es DELIVERY: mencioná que en los próximos 3 días un comercial de Avenue se pondrá en contacto para coordinar el envío
7. Si es RETIRO: incluí la dirección, horario y link de Google Maps si está disponible
8. Si hay contacto de la marca, incluilo
9. NO incluyas el asunto del email, solo el contenido HTML del body
10. Usá estilos inline para el HTML
11. El fondo del email es oscuro (#0a0a0a), usá colores claros para el texto
12. El color dorado de la marca es #d4a968
13. El botón principal debe ser verde (#22c55e) con texto negro

ESTRUCTURA DEL EMAIL:
1. Saludo y felicitación
2. Información de la campaña
3. Detalles del canje (producto/experiencia, método de entrega)
4. Fechas importantes (con estilo destacado)
5. Información sobre métricas
6. Botón de acción (Ir a mi Workspace)
7. Información de contacto si aplica"""

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
    """Fallback template when AI is not available"""
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
    
    # Build delivery info section
    delivery_info = ""
    if delivery_method == 'delivery':
        delivery_info = """
        <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #d4a968; margin: 0 0 15px 0; font-size: 16px;">📦 Sobre tu canje:</h3>
            <p style="color: #ffffff; font-size: 15px; margin: 0 0 10px 0;">
                Tu producto será enviado por <strong>delivery</strong>.
            </p>
            <p style="color: #888888; font-size: 14px; margin: 0; line-height: 1.5;">
                En los próximos <strong style="color: #22c55e;">3 días</strong>, un comercial de Avenue se pondrá en contacto 
                para confirmar la dirección de envío y coordinar la entrega.
            </p>
        </div>
        """
    elif delivery_method == 'pickup' and pickup_address:
        maps_link = f'<a href="{pickup_maps_url}" target="_blank" style="color: #d4a968;">Ver en Google Maps</a>' if pickup_maps_url else ''
        delivery_info = f"""
        <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #d4a968; margin: 0 0 15px 0; font-size: 16px;">📍 Retiro de tu canje:</h3>
            <p style="color: #ffffff; font-size: 15px; margin: 0 0 10px 0;">
                <strong>Dirección:</strong> {pickup_address}
            </p>
            {f'<p style="color: #888888; font-size: 14px; margin: 0 0 10px 0;">{maps_link}</p>' if maps_link else ''}
            {f'<p style="color: #888888; font-size: 14px; margin: 0;">Contacto: {brand_contact_phone}</p>' if brand_contact_phone else ''}
        </div>
        """
    
    return f"""
        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0;">
            ¡Felicitaciones {creator_name}! 🎉
        </h1>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Tu aplicación a la campaña <strong style="color: #d4a968;">{campaign_name}</strong> 
            de <strong>{brand_name}</strong> ha sido <span style="color: #22c55e;">CONFIRMADA</span>.
        </p>
        
        {delivery_info}
        
        <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #d4a968; margin: 0 0 15px 0; font-size: 16px;">📅 Fechas importantes:</h3>
            <p style="color: #ffffff; font-size: 15px; margin: 0 0 10px 0;">
                <strong>Fecha límite para subir contenido:</strong> {deadline_formatted}
            </p>
            <p style="color: #888888; font-size: 14px; margin: 0; line-height: 1.5;">
                Tenés <strong style="color: #22c55e;">7 días</strong> desde hoy para crear y subir tu contenido a tus redes sociales.
            </p>
        </div>
        
        <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #d4a968; margin: 0 0 15px 0; font-size: 16px;">📊 Sobre las métricas:</h3>
            <p style="color: #888888; font-size: 14px; margin: 0; line-height: 1.5;">
                Una vez que subas el URL de tu contenido a la plataforma, tendrás <strong style="color: #22c55e;">7 días adicionales</strong> 
                para subir los screenshots de las métricas de tu publicación.
            </p>
        </div>
        
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            Ingresá a tu workspace para ver los detalles completos de la campaña.
        </p>
        
        <div style="margin: 30px 0;">
            <a href="https://avenue.com.py/login?redirect=/ugc/creator/workspace" 
               style="display: inline-block; background-color: #22c55e; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ir a mi Workspace
            </a>
        </div>
        
        <p style="color: #666666; font-size: 12px; margin-top: 20px;">
            Si ya tenés sesión iniciada, el botón te llevará directamente a tu workspace.
        </p>
    """
