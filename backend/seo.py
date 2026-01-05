"""
SEO Module for Avenue
Handles sitemap.xml, robots.txt, and SEO metadata
"""

from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse
from datetime import datetime, timezone
from typing import List, Dict, Any
import os

seo_router = APIRouter()

# Site configuration
SITE_URL = os.environ.get('SITE_URL', 'https://avenue.com.py')
SITE_NAME = "AVENUE"

# Company info for structured data
COMPANY_INFO = {
    "name": "AVENUE MALL EAS",
    "legal_name": "AVENUE MALL EAS",
    "ruc": "80152251-0",
    "address": {
        "street": "Paseo Los Árboles, Avenida San Martín entre Sucre y Moisés Bertoni",
        "city": "Asunción",
        "country": "Paraguay",
        "postal_code": ""
    },
    "phone": "+595973666000",
    "email": "avenuepy@gmail.com",
    "logo": f"{SITE_URL}/logo.png",
    "social": {
        "instagram": "https://instagram.com/avenue.py",
        "facebook": "https://facebook.com/avenue.py"
    }
}

# Static pages that should be in sitemap
STATIC_PAGES = [
    {"url": "/", "priority": "1.0", "changefreq": "daily"},
    {"url": "/shop", "priority": "0.9", "changefreq": "daily"},
    {"url": "/studio", "priority": "0.8", "changefreq": "weekly"},
    {"url": "/studio/reservar", "priority": "0.7", "changefreq": "weekly"},
    {"url": "/tu-marca", "priority": "0.6", "changefreq": "monthly"},
    {"url": "/ugc", "priority": "0.6", "changefreq": "monthly"},
    {"url": "/politica-privacidad", "priority": "0.3", "changefreq": "yearly"},
    {"url": "/shop/terminos-condiciones", "priority": "0.3", "changefreq": "yearly"},
    {"url": "/studio/terminos-condiciones", "priority": "0.3", "changefreq": "yearly"},
]

# Pages that should NOT be indexed
NOINDEX_PATHS = [
    "/admin",
    "/checkout",
    "/cart",
    "/account",
    "/login",
    "/auth",
    "/api",
]


def generate_robots_txt() -> str:
    """Generate robots.txt content"""
    robots = f"""# robots.txt for {SITE_NAME}
# Generated automatically

User-agent: *

# Allow public pages
Allow: /
Allow: /shop
Allow: /studio
Allow: /tu-marca
Allow: /ugc
Allow: /politica-privacidad

# Disallow private/admin pages
Disallow: /admin
Disallow: /admin/*
Disallow: /checkout
Disallow: /cart
Disallow: /account
Disallow: /account/*
Disallow: /login
Disallow: /auth/*
Disallow: /api/
Disallow: /api/*
Disallow: /*?*  # Avoid query params duplicates

# Sitemap location
Sitemap: {SITE_URL}/sitemap.xml

# Crawl-delay (be nice to server)
Crawl-delay: 1
"""
    return robots


async def generate_sitemap_xml(db) -> str:
    """Generate sitemap.xml with static pages and products"""
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    urls = []
    
    # Add static pages
    for page in STATIC_PAGES:
        urls.append(f"""  <url>
    <loc>{SITE_URL}{page['url']}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{page['changefreq']}</changefreq>
    <priority>{page['priority']}</priority>
  </url>""")
    
    # Add products from database
    try:
        products = await db.shop_products.find(
            {"is_active": {"$ne": False}},  # Only active products
            {"sku": 1, "name": 1, "updated_at": 1, "_id": 0}
        ).limit(1000).to_list(1000)
        
        for product in products:
            sku = product.get('sku', '')
            if sku:
                # Create URL-friendly slug from SKU
                slug = sku.lower().replace(' ', '-')
                lastmod = product.get('updated_at', today)
                if isinstance(lastmod, datetime):
                    lastmod = lastmod.strftime("%Y-%m-%d")
                elif isinstance(lastmod, str) and len(lastmod) > 10:
                    lastmod = lastmod[:10]
                else:
                    lastmod = today
                    
                urls.append(f"""  <url>
    <loc>{SITE_URL}/shop/product/{slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>""")
    except Exception as e:
        print(f"Error fetching products for sitemap: {e}")
    
    # Build XML
    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
{chr(10).join(urls)}
</urlset>"""
    
    return sitemap


def get_organization_jsonld() -> Dict[str, Any]:
    """Generate Organization/LocalBusiness JSON-LD schema"""
    return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": f"{SITE_URL}/#organization",
        "name": COMPANY_INFO["name"],
        "legalName": COMPANY_INFO["legal_name"],
        "url": SITE_URL,
        "logo": COMPANY_INFO["logo"],
        "image": COMPANY_INFO["logo"],
        "telephone": COMPANY_INFO["phone"],
        "email": COMPANY_INFO["email"],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": COMPANY_INFO["address"]["street"],
            "addressLocality": COMPANY_INFO["address"]["city"],
            "addressCountry": "PY"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": -25.2867,
            "longitude": -57.6333
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "opens": "10:00",
                "closes": "21:00"
            }
        ],
        "sameAs": [
            COMPANY_INFO["social"]["instagram"],
            COMPANY_INFO["social"]["facebook"]
        ],
        "priceRange": "$$"
    }


def get_product_jsonld(product: Dict[str, Any]) -> Dict[str, Any]:
    """Generate Product JSON-LD schema"""
    
    # Determine availability
    stock = product.get('stock', 0)
    availability = "https://schema.org/InStock" if stock > 0 else "https://schema.org/OutOfStock"
    
    # Get image
    images = product.get('images', [])
    image = images[0] if images else f"{SITE_URL}/placeholder.jpg"
    
    # Get price
    price = product.get('price', 0)
    
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.get('name', 'Producto'),
        "description": product.get('description', product.get('name', '')),
        "image": image,
        "sku": product.get('sku', ''),
        "brand": {
            "@type": "Brand",
            "name": product.get('brand', 'AVENUE')
        },
        "offers": {
            "@type": "Offer",
            "url": f"{SITE_URL}/shop/product/{product.get('sku', '').lower()}",
            "priceCurrency": "PYG",
            "price": price,
            "priceValidUntil": (datetime.now(timezone.utc).replace(year=datetime.now().year + 1)).strftime("%Y-%m-%d"),
            "availability": availability,
            "seller": {
                "@type": "Organization",
                "name": COMPANY_INFO["name"]
            }
        }
    }


def get_webpage_jsonld(title: str, description: str, url: str) -> Dict[str, Any]:
    """Generate WebPage JSON-LD schema"""
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": url,
        "isPartOf": {
            "@type": "WebSite",
            "name": SITE_NAME,
            "url": SITE_URL
        },
        "publisher": {
            "@type": "Organization",
            "name": COMPANY_INFO["name"],
            "logo": {
                "@type": "ImageObject",
                "url": COMPANY_INFO["logo"]
            }
        }
    }


# ==================== ROUTES ====================

@seo_router.get("/api/robots.txt", response_class=PlainTextResponse)
async def get_robots_txt():
    """Serve robots.txt"""
    return generate_robots_txt()


@seo_router.get("/api/sitemap.xml")
async def get_sitemap_xml():
    """Serve sitemap.xml"""
    from server import db
    
    sitemap = await generate_sitemap_xml(db)
    return Response(
        content=sitemap,
        media_type="application/xml",
        headers={"Content-Type": "application/xml; charset=utf-8"}
    )


@seo_router.get("/api/seo/metadata")
async def get_seo_metadata():
    """Get SEO metadata for frontend"""
    return {
        "site_url": SITE_URL,
        "site_name": SITE_NAME,
        "company": COMPANY_INFO,
        "default_image": f"{SITE_URL}/og-image.jpg",
        "organization_schema": get_organization_jsonld()
    }
