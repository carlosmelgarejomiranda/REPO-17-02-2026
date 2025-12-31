"""
Script para generar 12 flyers de Instagram para Avenue Studio
Usando Gemini Nano Banana
"""
import asyncio
import os
import base64
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
load_dotenv()

# Directory for generated images
OUTPUT_DIR = "/app/backend/generated_flyers"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Avenue Studio brand info
BRAND_INFO = """
Brand: Avenue Studio
Colors: Black (#0d0d0d), Gold (#d4a968), Cream (#f5ede4)
Style: Luxury, editorial, elegant, minimalist, high-end photography studio
Location: Paseo Los Árboles, Av. San Martín, Asunción, Paraguay
"""

# 12 flyers to generate
FLYERS = [
    # Avenue Studio General (3 flyers)
    {
        "name": "01_avenue_studio_presentacion",
        "prompt": f"""Create a sophisticated Instagram post (square 1:1 format) for "AVENUE STUDIO" photography studio.
{BRAND_INFO}
Design: Elegant black background with gold accent lines, the text "AVENUE STUDIO" in elegant gold italic serif font centered. 
Add subtle gold geometric lines and a soft glow effect. Very minimalist and luxurious.
Include small text: "Tu espacio creativo" in cream color below the main title.
Professional, editorial style. No photos, just elegant typography and design elements."""
    },
    {
        "name": "02_propuesta_valor",
        "prompt": f"""Create a sophisticated Instagram post (square 1:1 format) showcasing Avenue Studio's value proposition.
{BRAND_INFO}
Design: Black background with elegant gold borders and accent lines.
Main headline in gold: "Tu Marca Merece Brillar"
Include 3 icon-style elements with gold icons and cream text:
- "Estudio Profesional" 
- "Equipamiento Premium"
- "Ubicación Estratégica"
Elegant, minimalist, high-end aesthetic. Serif fonts for headlines. Clean layout with plenty of negative space."""
    },
    {
        "name": "03_contacto_reservas",
        "prompt": f"""Create a sophisticated Instagram post (square 1:1 format) for Avenue Studio contact/booking.
{BRAND_INFO}
Design: Elegant black background with gold geometric frame.
Main text in gold italic serif: "Reserva tu Sesión"
Contact info in cream:
- WhatsApp: +595 973 666 000
- Instagram: @avenue.studio
- Ubicación: Paseo Los Árboles
Add a subtle gold "Book Now" button style element.
Professional, minimal, luxury branding."""
    },
    
    # Tarifario y Alquileres (4 flyers)
    {
        "name": "04_tarifario_alquiler",
        "prompt": f"""Create an elegant Instagram post (square 1:1 format) showing Avenue Studio rental rates.
{BRAND_INFO}
Design: Black background with gold border and accents.
Title in gold italic: "Tarifas de Alquiler"
Subtitle in cream: "Precios promocionales de apertura"
Display rates in elegant gold typography:
- 2 horas: 250.000 Gs
- 4 horas: 450.000 Gs  
- 6 horas: 650.000 Gs
- 8 horas: 800.000 Gs
Clean, minimal layout with rates displayed in an elegant grid or list format. Luxury aesthetic."""
    },
    {
        "name": "05_equipamiento_incluido",
        "prompt": f"""Create a sophisticated Instagram post (square 1:1 format) about Avenue Studio equipment.
{BRAND_INFO}
Design: Dark elegant background with gold accents and subtle photography equipment silhouettes.
Title in gold italic: "Equipamiento Incluido"
List in cream text with gold bullet points:
- Luz Godox SL-100 Bicolor
- Flash Godox AD200 II
- Fondo infinito
- Mesa de reuniones (8 personas)
- WiFi alta velocidad
- Área de descanso
Mention: "Valor 20.000 Gs/hora c/u - Incluido" in small gold text.
Professional, minimal, luxury feel."""
    },
    {
        "name": "06_espacio_estudio",
        "prompt": f"""Create an artistic Instagram post (square 1:1 format) showcasing Avenue Studio space.
{BRAND_INFO}
Design: Elegant dark background with artistic gold light beam effects.
Main text in gold: "Un Espacio Premium"
Subtitle in cream: "Diseñado para potenciar tu marca"
Include elegant icons or visual elements representing:
- Professional lighting setup
- Infinite backdrop
- Comfortable lounge area
Minimal, editorial style. High contrast black and gold design."""
    },
    {
        "name": "07_reserva_ahora_cta",
        "prompt": f"""Create a compelling call-to-action Instagram post (square 1:1 format) for Avenue Studio booking.
{BRAND_INFO}
Design: Black background with prominent gold geometric elements and borders.
Main headline in large gold italic serif: "Reserva Ahora"
Subtext in cream: "Cupos limitados"
Urgency element: "Precios promocionales por tiempo limitado"
WhatsApp: +595 973 666 000
Instagram: @avenue.studio
Strong, elegant call-to-action design. Luxury minimal aesthetic."""
    },
    
    # UGC Creators (4 flyers)
    {
        "name": "08_ugc_convocatoria",
        "prompt": f"""Create an eye-catching Instagram post (square 1:1 format) for UGC Creator recruitment at Avenue.
{BRAND_INFO}
Design: Black background with vibrant gold accents and dynamic elements.
Main headline in gold: "¡Buscamos UGC Creators!"
Subtitle in cream: "Únete a nuestra comunidad de creadores"
Include elements suggesting content creation (camera, phone, social media icons - stylized in gold).
Add text: "Canjes + Productos gratis" in a highlighted gold box.
Energetic but still elegant and on-brand. Appeal to young creators."""
    },
    {
        "name": "09_ugc_beneficios",
        "prompt": f"""Create an Instagram post (square 1:1 format) showing UGC Creator benefits at Avenue.
{BRAND_INFO}
Design: Elegant black background with gold frame and accents.
Title in gold italic: "Beneficios UGC Creators"
Benefits listed with gold checkmarks and cream text:
✓ Mega canje en productos
✓ Hasta 500.000 Gs en tienda
✓ Contenido para tu portfolio
✓ Colaboración con marcas premium
✓ Networking con otros creators
Professional, aspirational design that appeals to content creators."""
    },
    {
        "name": "10_ugc_marcas",
        "prompt": f"""Create a sophisticated Instagram post (square 1:1 format) about brands at Avenue.
{BRAND_INFO}
Design: Elegant black background with gold geometric elements.
Title in gold: "Marcas Premium"
Subtitle in cream: "Colaboramos con las mejores marcas de Paraguay"
Categories listed elegantly: Indumentaria, Calzados, Accesorios, Joyería, Cosmética, Perfumería
Add text: "Crea contenido para marcas selectas" in gold.
Luxury, exclusive feeling. High-end brand collaboration appeal."""
    },
    {
        "name": "11_ugc_requisitos",
        "prompt": f"""Create an informative Instagram post (square 1:1 format) about UGC Creator requirements at Avenue.
{BRAND_INFO}
Design: Clean black background with gold borders and accent lines.
Title in gold italic: "¿Cómo Aplicar?"
Requirements in cream text with gold numbers:
1. Mayor de 18 años
2. Perfil público (IG o TikTok)
3. +3.000 seguidores
4. Residir en Asunción o alrededores
5. Disponibilidad para grabar en tienda
CTA in gold: "Aplica ahora en avenue.studio/ugc"
Clear, professional, easy to read."""
    },
    
    # Artístico/Mood (1 flyer)
    {
        "name": "12_mood_artistico",
        "prompt": f"""Create an artistic, moody Instagram post (square 1:1 format) capturing Avenue Studio's essence.
{BRAND_INFO}
Design: Dramatic black and gold composition with abstract light rays and elegant geometric patterns.
Minimal text - just "AVENUE" in elegant gold serif italic font.
Create a sense of luxury, creativity, and professional photography.
Abstract golden light beams, subtle lens flare effects, and sophisticated negative space.
Very artistic, editorial style. The kind of image that makes people stop scrolling.
Think high-fashion photography studio vibes meets luxury brand aesthetic."""
    }
]

async def generate_flyer(flyer_info, index):
    """Generate a single flyer image"""
    api_key = os.getenv("EMERGENT_LLM_KEY")
    
    # Create new chat instance for each image
    chat = LlmChat(
        api_key=api_key, 
        session_id=f"avenue-flyer-{index}", 
        system_message="You are an expert graphic designer specializing in luxury brand social media content."
    )
    chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    
    msg = UserMessage(text=flyer_info["prompt"])
    
    print(f"\n[{index+1}/12] Generating: {flyer_info['name']}...")
    
    try:
        text, images = await chat.send_message_multimodal_response(msg)
        
        if images and len(images) > 0:
            # Save the first image
            img = images[0]
            image_bytes = base64.b64decode(img['data'])
            
            # Determine file extension
            ext = "png" if "png" in img.get('mime_type', 'png') else "jpg"
            filename = f"{flyer_info['name']}.{ext}"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            with open(filepath, "wb") as f:
                f.write(image_bytes)
            
            print(f"   ✓ Saved: {filename}")
            return True
        else:
            print(f"   ✗ No image generated for {flyer_info['name']}")
            return False
            
    except Exception as e:
        print(f"   ✗ Error generating {flyer_info['name']}: {str(e)}")
        return False

async def main():
    """Generate all 12 flyers"""
    print("=" * 60)
    print("AVENUE STUDIO - Generador de Flyers para Instagram")
    print("=" * 60)
    print(f"\nGenerando 12 imágenes con Gemini Nano Banana...")
    print(f"Directorio de salida: {OUTPUT_DIR}\n")
    
    success_count = 0
    
    for i, flyer in enumerate(FLYERS):
        result = await generate_flyer(flyer, i)
        if result:
            success_count += 1
        # Small delay between generations
        await asyncio.sleep(2)
    
    print("\n" + "=" * 60)
    print(f"COMPLETADO: {success_count}/12 flyers generados")
    print(f"Ubicación: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
