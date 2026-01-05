import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

// Site configuration
const SITE_URL = 'https://avenue.com.py';
const SITE_NAME = 'AVENUE';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION = 'AVENUE - Tu destino de moda y lifestyle en Paraguay. Descubrí las últimas tendencias, reservá nuestro estudio y conectá con marcas exclusivas.';

// Company info for structured data
const COMPANY_INFO = {
  name: 'AVENUE MALL EAS',
  legalName: 'AVENUE MALL EAS',
  ruc: '80152251-0',
  address: {
    street: 'Paseo Los Árboles, Avenida San Martín entre Sucre y Moisés Bertoni',
    city: 'Asunción',
    country: 'Paraguay'
  },
  phone: '+595973666000',
  email: 'avenuepy@gmail.com',
  logo: `${SITE_URL}/logo.png`
};

// Helper function to update or create meta tag
const updateMetaTag = (selector, content, attrName = 'content') => {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    if (selector.includes('property=')) {
      const property = selector.match(/property="([^"]+)"/)?.[1];
      if (property) element.setAttribute('property', property);
    } else if (selector.includes('name=')) {
      const name = selector.match(/name="([^"]+)"/)?.[1];
      if (name) element.setAttribute('name', name);
    }
    document.head.appendChild(element);
  }
  element.setAttribute(attrName, content);
};

// Helper function to update or create link tag
const updateLinkTag = (rel, href) => {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

// Helper function to add JSON-LD schema
const addJsonLd = (schema, id) => {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('script');
    element.type = 'application/ld+json';
    element.id = id;
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(schema);
};

/**
 * SEO Head Component
 * Handles all SEO-related meta tags, Open Graph, Twitter Cards, and JSON-LD
 */
export const SEOHead = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  product = null,
  canonicalUrl = null
}) => {
  // Build full title
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  
  // Get canonical URL
  const canonical = canonicalUrl || url || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : SITE_URL);
  
  // Truncate description to recommended length
  const truncatedDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;

  // Organization JSON-LD (appears on all pages)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#organization`,
    "name": COMPANY_INFO.name,
    "legalName": COMPANY_INFO.legalName,
    "url": SITE_URL,
    "logo": COMPANY_INFO.logo,
    "image": COMPANY_INFO.logo,
    "telephone": COMPANY_INFO.phone,
    "email": COMPANY_INFO.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": COMPANY_INFO.address.street,
      "addressLocality": COMPANY_INFO.address.city,
      "addressCountry": "PY"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -25.2867,
      "longitude": -57.6333
    },
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "10:00",
        "closes": "21:00"
      }
    ]
  };

  // Product JSON-LD (only for product pages)
  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || product.name,
    "image": product.image || product.images?.[0] || DEFAULT_IMAGE,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": product.brand || SITE_NAME
    },
    "offers": {
      "@type": "Offer",
      "url": canonical,
      "priceCurrency": "PYG",
      "price": product.price,
      "availability": product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": COMPANY_INFO.name
      }
    }
  } : null;

  // WebPage JSON-LD
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": fullTitle,
    "description": truncatedDescription,
    "url": canonical,
    "isPartOf": {
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL
    }
  };

  // Update meta tags directly in DOM as fallback
  useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Update meta description
    updateMetaTag('meta[name="description"]', truncatedDescription);
    
    // Update canonical link
    updateLinkTag('canonical', canonical);
    
    // Update robots
    updateMetaTag('meta[name="robots"]', noindex ? 'noindex, nofollow' : 'index, follow');
    
    // Update Open Graph tags
    updateMetaTag('meta[property="og:type"]', type);
    updateMetaTag('meta[property="og:url"]', canonical);
    updateMetaTag('meta[property="og:title"]', fullTitle);
    updateMetaTag('meta[property="og:description"]', truncatedDescription);
    updateMetaTag('meta[property="og:image"]', image);
    updateMetaTag('meta[property="og:site_name"]', SITE_NAME);
    updateMetaTag('meta[property="og:locale"]', 'es_PY');
    
    // Update Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', truncatedDescription);
    updateMetaTag('meta[name="twitter:image"]', image);
    
    // Add JSON-LD schemas
    addJsonLd(organizationSchema, 'organization-schema');
    addJsonLd(webPageSchema, 'webpage-schema');
    if (product) {
      addJsonLd(productSchema, 'product-schema');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullTitle, truncatedDescription, canonical, noindex, type, image]);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={truncatedDescription} />
      <link rel="canonical" href={canonical} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_PY" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional Meta */}
      <meta name="author" content={COMPANY_INFO.name} />
      <meta name="geo.region" content="PY" />
      <meta name="geo.placename" content="Asunción, Paraguay" />
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      
      <script type="application/ld+json">
        {JSON.stringify(webPageSchema)}
      </script>
      
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
    </Helmet>
  );
};

/**
 * Pre-configured SEO components for common pages
 */

export const HomeSEO = () => (
  <SEOHead
    title="Moda y Lifestyle"
    description="AVENUE - Tu destino de moda y lifestyle en Asunción, Paraguay. Descubrí las últimas tendencias, reservá nuestro estudio fotográfico y conectá con marcas exclusivas."
    url={SITE_URL}
  />
);

export const ShopSEO = () => (
  <SEOHead
    title="Tienda Online"
    description="Explorá nuestra tienda online con las mejores marcas de moda. Envío a todo Paraguay o retiro en tienda. AVENUE - Paseo Los Árboles, Asunción."
    url={`${SITE_URL}/shop`}
  />
);

export const ProductSEO = ({ product }) => {
  if (!product) return null;
  
  const productImage = product.images?.[0] || DEFAULT_IMAGE;
  const productDescription = product.description || 
    `${product.name} disponible en AVENUE. ${product.stock > 0 ? 'En stock.' : 'Agotado.'} Envío a todo Paraguay o retiro en tienda.`;
  
  return (
    <SEOHead
      title={product.name}
      description={productDescription}
      image={productImage}
      url={`${SITE_URL}/shop/product/${product.sku?.toLowerCase()}`}
      type="product"
      product={{
        name: product.name,
        description: productDescription,
        image: productImage,
        sku: product.sku,
        brand: product.brand,
        price: product.price,
        stock: product.stock
      }}
    />
  );
};

export const StudioSEO = () => (
  <SEOHead
    title="Studio Fotográfico"
    description="AVENUE Studio - Alquilá nuestro estudio fotográfico profesional en Asunción. Ideal para sesiones de fotos, contenido para redes y producciones. Reservá online."
    url={`${SITE_URL}/studio`}
  />
);

export const StudioBookingSEO = () => (
  <SEOHead
    title="Reservar Studio"
    description="Reservá tu sesión en AVENUE Studio. Estudio fotográfico profesional con equipamiento incluido. Turnos flexibles, pagá al llegar."
    url={`${SITE_URL}/studio/reservar`}
  />
);

export const BrandsSEO = () => (
  <SEOHead
    title="Tu Marca en Avenue"
    description="Llevá tu marca a AVENUE. Pop-ups, activaciones, corners y más. Conectá con nuestra audiencia y crecé con nosotros. Contactanos."
    url={`${SITE_URL}/tu-marca`}
  />
);

export const UGCSEO = () => (
  <SEOHead
    title="UGC Creators"
    description="Unite al programa de UGC Creators de AVENUE. Creá contenido para marcas, accedé a productos exclusivos y monetizá tu creatividad."
    url={`${SITE_URL}/ugc`}
  />
);

export const PrivacySEO = () => (
  <SEOHead
    title="Política de Privacidad"
    description="Política de Privacidad y Cookies de AVENUE. Conocé cómo protegemos tus datos personales."
    url={`${SITE_URL}/politica-privacidad`}
  />
);

export const TermsSEO = () => (
  <SEOHead
    title="Términos y Condiciones"
    description="Términos y Condiciones del E-commerce de AVENUE. Conocé las reglas de compra, envío, devoluciones y más."
    url={`${SITE_URL}/shop/terminos-condiciones`}
  />
);

export const StudioTermsSEO = () => (
  <SEOHead
    title="Términos del Studio"
    description="Términos y Condiciones de uso del estudio fotográfico AVENUE Studio. Política de reservas, cancelaciones y reglas de uso."
    url={`${SITE_URL}/studio/terminos-condiciones`}
  />
);

// NoIndex pages (cart, checkout, admin, account)
export const CheckoutSEO = () => (
  <SEOHead
    title="Checkout"
    description="Finalizá tu compra en AVENUE"
    noindex={true}
  />
);

export const CartSEO = () => (
  <SEOHead
    title="Carrito"
    description="Tu carrito de compras en AVENUE"
    noindex={true}
  />
);

export const AdminSEO = () => (
  <SEOHead
    title="Admin Panel"
    description="Panel de administración"
    noindex={true}
  />
);

export const AccountSEO = () => (
  <SEOHead
    title="Mi Cuenta"
    description="Tu cuenta en AVENUE"
    noindex={true}
  />
);

export default SEOHead;
