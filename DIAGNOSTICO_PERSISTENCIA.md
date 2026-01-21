# DIAGNÓSTICO DE PERSISTENCIA DE DATOS - AVENUE

## Resumen Ejecutivo

**MongoDB (Base de datos) = PERSISTENTE ✅**
**Sistema de archivos en Kubernetes = EFÍMERO ⚠️**

---

## ✅ DATOS SEGUROS (MongoDB - Persistente)

Todos estos datos están en MongoDB y **NO SE PIERDEN** con deploys o reinicios:

### Usuarios y Autenticación
- `users` - Perfiles de usuarios, emails, contraseñas, roles

### UGC Platform
- `ugc_creators` - Perfiles de creadores (nombre, bio, redes sociales, nivel)
- `ugc_brands` - Perfiles de marcas (empresa, logo URL, contacto)
- `ugc_campaigns` - Campañas creadas por marcas
- `ugc_applications` - Aplicaciones de creadores a campañas
- `ugc_deliverables` - Entregas de contenido (URLs externas a Instagram/TikTok)
- `ugc_metrics` - Métricas reportadas por creadores
- `ugc_ratings` - Calificaciones y reseñas
- `ugc_notifications` - Notificaciones del sistema
- `ugc_packages` - Paquetes/planes de suscripción

### E-commerce
- `shop_products` - Productos individuales (del ERP)
- `shop_products_grouped` - Productos agrupados por modelo
- `orders` - Pedidos de clientes
- `shop_coupons` - Cupones de descuento

### Studio
- `reservations` - Reservas del estudio fotográfico

### Sistema
- `admin_settings` - Configuraciones del admin
- `page_content` - Contenido del website builder
- `audit_logs` - Logs de auditoría
- `email_logs` - Registro de emails enviados

---

## ⚠️ DATOS EN RIESGO (Sistema de Archivos - Efímero)

Estos archivos se guardan en `/app/backend/uploads/` y **SE PIERDEN** con cada deploy:

### E-commerce - Imágenes de Productos
- **Estado actual:** Las imágenes subidas desde el panel admin se guardaban en filesystem
- **Solución aplicada:** Ya migré a MongoDB (`temp_images` y `product_images_data`)
- **Acción requerida:** Volver a subir las imágenes en producción

### Website Builder - Media
- **Archivo:** `/app/backend/website_builder.py`
- **Riesgo:** Imágenes subidas al website builder se pierden
- **Solución necesaria:** Migrar a MongoDB o Cloudinary

### Uploads Generales
- **Archivo:** `/app/backend/server.py` línea 2444
- **Riesgo:** Cualquier archivo subido via `/api/uploads` se pierde
- **Solución necesaria:** Migrar a MongoDB o Cloudinary

---

## 🔒 DATOS QUE NO NECESITAN MIGRACIÓN

### UGC Platform
Los creadores y marcas **NO suben archivos** al servidor de Avenue:
- `post_url` = Link a Instagram/TikTok (URL externa)
- `file_url` = URL externa opcional
- `portfolio_links` = Links externos a portafolios
- `logo_url` = URL externa al logo (Unsplash, etc.)
- `profile_image` = URL externa

**Conclusión:** La plataforma UGC está diseñada para usar URLs externas, NO almacena archivos binarios.

### Studio
- Las reservas son solo datos (fechas, nombres, pagos)
- No hay archivos subidos

---

## 📋 PLAN DE ACCIÓN

### ✅ YA COMPLETADO
1. Imágenes temporales de productos → MongoDB (`temp_images`)
2. Imágenes permanentes de productos → MongoDB (`product_images_data`)

### 🔄 PENDIENTE (Prioridad Media)
1. **Website Builder Media** - Migrar uploads a MongoDB
2. **Uploads Generales** - Migrar a MongoDB

### 💡 RECOMENDACIÓN FUTURA
- Integrar **Cloudinary** para almacenamiento de imágenes profesional
- Mejor rendimiento y CDN global
- Transformaciones de imagen automáticas

---

## Verificación en Producción

Para verificar el estado actual en producción, accede a:
```
https://avenue.com.py/api/shop/debug/products-status
https://avenue.com.py/api/shop/debug/storage-status
```

---

*Generado: 2026-01-21*
