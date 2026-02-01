# Avenue Database Schema
## Diccionario de Datos y Diagrama Entidad-Relación

**Última actualización:** 2026-01-31  
**Base de datos:** MongoDB  
**Total de colecciones:** 32

---

## Índice

1. [Diagrama Entidad-Relación](#diagrama-entidad-relación)
2. [Módulo Usuarios](#módulo-usuarios)
3. [Módulo Campañas UGC](#módulo-campañas-ugc)
4. [Módulo E-Commerce](#módulo-e-commerce)
5. [Tablas de Soporte](#tablas-de-soporte)
6. [Análisis de Normalización](#análisis-de-normalización)
7. [Colecciones Legacy](#colecciones-legacy)

---

## Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MÓDULO USUARIOS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                                ┌─────────────────┐
                                │     USERS       │
                                │─────────────────│
                                │ PK: user_id     │
                                │    email        │
                                │    name         │
                                │    role         │
                                └────────┬────────┘
                                         │
                     ┌───────────────────┼───────────────────┐
                     │ 1:1               │ 1:1               │ 1:N
                     ▼                   ▼                   ▼
          ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
          │  UGC_CREATORS   │  │   UGC_BRANDS    │  │  AUDIT_LOGS     │
          │─────────────────│  │─────────────────│  │─────────────────│
          │ PK: id          │  │ PK: id          │  │ PK: id          │
          │ FK: user_id     │  │ FK: user_id     │  │ FK: user_id     │
          └────────┬────────┘  └────────┬────────┘  └─────────────────┘
                   │                    │
                   │                    │ 1:N
                   │                    ▼
                   │           ┌─────────────────┐
                   │           │  UGC_PACKAGES   │
                   │           │─────────────────│
                   │           │ PK: id          │
                   │           │ FK: brand_id    │
                   │           └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                             MÓDULO CAMPAÑAS UGC                              │
└─────────────────────────────────────────────────────────────────────────────┘

          UGC_BRANDS                           UGC_PACKAGES
              │                                    │
              │ 1:N                                │ 1:N (opcional)
              ▼                                    │
      ┌─────────────────┐◄─────────────────────────┘
      │  UGC_CAMPAIGNS  │
      │─────────────────│
      │ PK: id          │
      │ FK: brand_id    │
      │ FK: package_id  │
      └────────┬────────┘
               │ 1:N
               ▼
      ┌─────────────────┐
      │ UGC_APPLICATIONS│  ⚠️ Datos creador duplicados
      │─────────────────│
      │ PK: application_id │
      │ FK: campaign_id │
      └────────┬────────┘
               │ 1:N
               ▼
      ┌─────────────────┐
      │ UGC_DELIVERABLES│
      │─────────────────│
      │ PK: id          │
      │ FK: campaign_id │
      │ FK: application_id │
      │ FK: creator_id  │──────► UGC_CREATORS
      │ FK: brand_id    │──────► UGC_BRANDS
      └────────┬────────┘
               │
     ┌─────────┴─────────┐
     │ 1:N               │ 1:1
     ▼                   ▼
┌─────────────┐  ┌─────────────┐
│ UGC_METRICS │  │ UGC_RATINGS │
└─────────────┘  └─────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                              MÓDULO E-COMMERCE                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐           ┌─────────────────────┐
│  SHOP_PRODUCTS  │  aggr.    │ SHOP_PRODUCTS_GROUPED│
│─────────────────│──────────►│─────────────────────│
│ PK: product_id  │           │ PK: grouped_id      │
│    base_model   │           │    variants[]       │
└────────┬────────┘           └─────────────────────┘
         │ snapshot
         ▼
┌─────────────────┐           ┌─────────────────────┐
│     ORDERS      │    1:1    │PAYMENT_TRANSACTIONS │
│─────────────────│◄─────────►│─────────────────────│
│ PK: order_id    │           │ PK: transaction_id  │
│    items[]      │           │ FK: order_id        │
└─────────────────┘           └─────────────────────┘
```

---

## Módulo Usuarios

### USERS
**Descripción:** Tabla central de usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | string | **PK** - Identificador único |
| `email` | string | Email único del usuario |
| `name` | string | Nombre completo |
| `phone` | string | Teléfono |
| `password` | string | Hash de contraseña |
| `role` | string | Rol: superadmin, admin, staff, designer, user |
| `created_at` | datetime | Fecha de creación |

**Relaciones:**
- → `UGC_CREATORS.user_id` (1:1)
- → `UGC_BRANDS.user_id` (1:1)
- → `AUDIT_LOGS.user_id` (1:N)
- → `TERMS_ACCEPTANCES.user_id` (1:N)
- → `UGC_NOTIFICATIONS.user_id` (1:N)

---

### UGC_CREATORS
**Descripción:** Perfiles de creadores de contenido UGC.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** - Identificador único |
| `user_id` | string | **FK** → USERS |
| `email` | string | Email del creador |
| `name` | string | Nombre |
| `phone` | string | Teléfono |
| `city` | string | Ciudad |
| `bio` | string | Biografía |
| `profile_image` | string | URL de foto de perfil (Cloudinary) |
| `categories` | array[string] | Categorías de contenido |
| `social_networks` | array[object] | Redes sociales verificadas |
| `level` | string | Nivel: rookie, rising, pro, elite |
| `level_progress` | int | Progreso hacia siguiente nivel |
| `verification_status` | string | Estado de verificación |
| `stats` | object | Estadísticas agregadas |
| `created_at` | datetime | Fecha de registro |
| `updated_at` | datetime | Última actualización |

**Relaciones:**
- ← `USERS.user_id` (1:1)
- → `UGC_DELIVERABLES.creator_id` (1:N)
- → `UGC_METRICS.creator_id` (1:N)
- → `UGC_RATINGS.creator_id` (1:N)

---

### UGC_BRANDS
**Descripción:** Perfiles de marcas/empresas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** - Identificador único |
| `user_id` | string | **FK** → USERS |
| `email` | string | Email de contacto |
| `company_name` | string | Nombre de la empresa |
| `industry` | string | Industria/rubro |
| `city` | string | Ciudad |
| `contact_name` | string | Nombre del contacto |
| `phone` | string | Teléfono |
| `logo_url` | string | URL del logo |
| `website` | string | Sitio web |
| `instagram_url` | string | Perfil de Instagram |
| `description` | string | Descripción de la marca |
| `is_verified` | bool | Marca verificada |
| `is_active` | bool | Cuenta activa |
| `onboarding_completed` | bool | Onboarding completado |
| `created_at` | datetime | Fecha de registro |
| `updated_at` | datetime | Última actualización |

**Relaciones:**
- ← `USERS.user_id` (1:1)
- → `UGC_CAMPAIGNS.brand_id` (1:N)
- → `UGC_PACKAGES.brand_id` (1:N)
- → `UGC_DELIVERABLES.brand_id` (1:N)
- → `UGC_RATINGS.brand_id` (1:N)

---

## Módulo Campañas UGC

### UGC_CAMPAIGNS
**Descripción:** Campañas de contenido UGC.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** - Identificador único |
| `brand_id` | string | **FK** → UGC_BRANDS |
| `package_id` | string | **FK** → UGC_PACKAGES (nullable) |
| `name` | string | Nombre de la campaña |
| `description` | string | Descripción |
| `category` | string | Categoría |
| `city` | string | Ciudad |
| `available_slots` | int | Cupos disponibles |
| `total_slots_loaded` | int | Total de cupos cargados |
| `slots_filled` | int | Cupos ocupados |
| `slots` | int | Cupos originales |
| `contract` | object | Datos del contrato (embebido) |
| `requirements` | object | Requisitos (embebido) |
| `canje` | object | Información del canje (embebido) |
| `timeline` | object | Timeline (embebido) |
| `assets` | object | Assets: cover_image, brand_name (embebido) |
| `status` | string | Estado: draft, active, paused, completed |
| `visible_to_creators` | bool | Visible para creadores |
| `created_at` | datetime | Fecha de creación |
| `updated_at` | datetime | Última actualización |
| `published_at` | datetime | Fecha de publicación |
| `completed_at` | datetime | Fecha de completado |
| `admin_notes` | string | Notas del admin |
| `created_by_admin` | string | Admin que creó |
| `metrics_delivery_days` | int | Días para entregar métricas |
| `metrics_delivery_fixed_date` | datetime | Fecha fija de métricas |
| `url_delivery_days` | int | Días para entregar URL |
| `url_delivery_fixed_date` | datetime | Fecha fija de URL |

**Relaciones:**
- ← `UGC_BRANDS.id` (N:1)
- ← `UGC_PACKAGES.id` (N:1, opcional)
- → `UGC_APPLICATIONS.campaign_id` (1:N)
- → `UGC_DELIVERABLES.campaign_id` (1:N)
- → `UGC_METRICS.campaign_id` (1:N)

---

### UGC_APPLICATIONS
**Descripción:** Aplicaciones de creadores a campañas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `application_id` | string | **PK** - Identificador único |
| `campaign_id` | string | **FK** → UGC_CAMPAIGNS |
| `email` | string | Email del aplicante |
| `nombre` | string | Nombre |
| `apellido` | string | Apellido |
| `sexo` | string | Sexo |
| `fecha_nacimiento` | string | Fecha de nacimiento |
| `instagram_url` | string | URL de Instagram |
| `instagram_privado` | string | ¿Cuenta privada? |
| `instagram_seguidores` | string | Cantidad de seguidores |
| `tiktok_url` | string | URL de TikTok |
| `tiktok_privado` | string | ¿Cuenta privada? |
| `tiktok_seguidores` | string | Cantidad de seguidores |
| `video_link_1` | string | Link de video muestra 1 |
| `video_link_2` | string | Link de video muestra 2 |
| `confirma_grabar_tienda` | bool | Confirma grabar en tienda |
| `ciudad` | string | Ciudad |
| `whatsapp` | string | Número de WhatsApp |
| `acepta_condiciones` | bool | Acepta T&C |
| `acepta_whatsapp` | bool | Acepta contacto WhatsApp |
| `autoriza_contenido` | bool | Autoriza uso de contenido |
| `status` | string | Estado: pending, confirmed, rejected |
| `motivo_no_elegible` | array[string] | Motivos de rechazo |
| `created_at` | datetime | Fecha de aplicación |

**Relaciones:**
- ← `UGC_CAMPAIGNS.id` (N:1)
- → `UGC_DELIVERABLES.application_id` (1:N)

> ⚠️ **NOTA DE NORMALIZACIÓN:** Esta tabla duplica datos del creador (nombre, email, redes sociales). Debería usar `creator_id` como FK hacia UGC_CREATORS.

---

### UGC_DELIVERABLES
**Descripción:** Entregas de contenido de los creadores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** - Identificador único |
| `campaign_id` | string | **FK** → UGC_CAMPAIGNS |
| `application_id` | string | **FK** → UGC_APPLICATIONS |
| `creator_id` | string | **FK** → UGC_CREATORS |
| `brand_id` | string | **FK** → UGC_BRANDS |
| `platform` | string | Plataforma: instagram, tiktok |
| `status` | string | Estado: pending_url, pending_review, approved, etc. |
| `post_url` | string | URL del post publicado |
| `published_at` | datetime | Fecha de publicación |
| `submitted_at` | datetime | Fecha de envío |
| `review_round` | int | Ronda de revisión |
| `review_notes` | array[object] | Notas de revisión |
| `approved_at` | datetime | Fecha de aprobación |
| `metrics_window_opens` | datetime | Inicio de ventana de métricas |
| `metrics_window_closes` | datetime | Fin de ventana de métricas |
| `is_on_time` | bool | Entregado a tiempo |
| `created_at` | datetime | Fecha de creación |
| `updated_at` | datetime | Última actualización |

**Relaciones:**
- ← `UGC_CAMPAIGNS.id` (N:1)
- ← `UGC_APPLICATIONS.application_id` (N:1)
- ← `UGC_CREATORS.id` (N:1)
- ← `UGC_BRANDS.id` (N:1)
- → `UGC_METRICS.deliverable_id` (1:N)
- → `UGC_RATINGS.deliverable_id` (1:1)

---

### UGC_METRICS
**Descripción:** Métricas de rendimiento de las entregas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** - Identificador único |
| `deliverable_id` | string | **FK** → UGC_DELIVERABLES |
| `creator_id` | string | **FK** → UGC_CREATORS |
| `campaign_id` | string | **FK** → UGC_CAMPAIGNS |
| `platform` | string | Plataforma |
| `views` | int | Vistas |
| `reach` | int | Alcance |
| `likes` | int | Likes |
| `comments` | int | Comentarios |
| `shares` | int | Compartidos |
| `saves` | int | Guardados |
| `total_interactions` | int | Total de interacciones |
| `engagement_rate` | float | Tasa de engagement |
| `screenshot_url` | string | URL del screenshot |
| `ai_confidence` | float | Confianza del análisis IA |
| `manually_verified` | bool | Verificado manualmente |
| `submitted_at` | datetime | Fecha de envío |
| `created_at` | datetime | Fecha de creación |

**Relaciones:**
- ← `UGC_DELIVERABLES.id` (N:1)
- ← `UGC_CREATORS.id` (N:1)
- ← `UGC_CAMPAIGNS.id` (N:1)

---

### UGC_RATINGS
**Descripción:** Calificaciones de marcas a creadores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** - Identificador único |
| `deliverable_id` | string | **FK** → UGC_DELIVERABLES |
| `campaign_id` | string | **FK** → UGC_CAMPAIGNS |
| `creator_id` | string | **FK** → UGC_CREATORS |
| `brand_id` | string | **FK** → UGC_BRANDS |
| `brand_name` | string | Nombre de la marca (desnormalizado) |
| `rating` | int | Calificación (1-5) |
| `comment` | string | Comentario |
| `created_at` | datetime | Fecha de creación |

**Relaciones:**
- ← `UGC_DELIVERABLES.id` (1:1)
- ← `UGC_CAMPAIGNS.id` (N:1)
- ← `UGC_CREATORS.id` (N:1)
- ← `UGC_BRANDS.id` (N:1)

> ⚠️ **NOTA:** `brand_name` está desnormalizado para optimización de lectura.

---

### UGC_PACKAGES
**Descripción:** Paquetes de entregas comprados por marcas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** - Identificador único |
| `brand_id` | string | **FK** → UGC_BRANDS |
| `type` | string | Tipo de paquete |
| `deliveries_total` | int | Total de entregas |
| `deliveries_used` | int | Entregas usadas |
| `deliveries_remaining` | int | Entregas restantes |
| `price_gs` | int | Precio en guaraníes |
| `status` | string | Estado |
| `purchased_at` | datetime | Fecha de compra |
| `expires_at` | datetime | Fecha de expiración |

**Relaciones:**
- ← `UGC_BRANDS.id` (N:1)
- → `UGC_CAMPAIGNS.package_id` (1:N)

---

### UGC_NOTIFICATIONS
**Descripción:** Notificaciones para usuarios UGC.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** - Identificador único |
| `user_id` | string | **FK** → USERS |
| `type` | string | Tipo de notificación |
| `title` | string | Título |
| `message` | string | Mensaje |
| `read` | bool | Leída |
| `created_at` | datetime | Fecha de creación |

**Relaciones:**
- ← `USERS.user_id` (N:1)

---

## Módulo E-Commerce

### SHOP_PRODUCTS
**Descripción:** Productos individuales de la tienda.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `product_id` | string | **PK** - Identificador único |
| `sku` | string | SKU del producto |
| `name` | string | Nombre |
| `brand` | string | Marca |
| `category` | string | Categoría |
| `description` | string | Descripción |
| `price` | float | Precio |
| `discount` | float | Descuento |
| `stock` | float | Stock disponible |
| `size` | string | Talla |
| `gender` | string | Género |
| `image` | string | URL de imagen |
| `online` | bool | Disponible online |
| `featured` | bool | Destacado |
| `base_model` | string | Modelo base (para agrupar variantes) |
| `updated_at` | datetime | Última actualización |

**Relaciones:**
- → `SHOP_PRODUCTS_GROUPED.base_model` (N:1 vía aggregation)
- → `ORDERS.items[].product_id` (snapshot embebido)

---

### SHOP_PRODUCTS_GROUPED
**Descripción:** Vista materializada de productos agrupados por modelo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `grouped_id` | string | **PK** - Identificador único |
| `name` | string | Nombre del producto |
| `base_model` | string | Modelo base |
| `price` | float | Precio mínimo |
| `max_price` | float | Precio máximo |
| `total_stock` | float | Stock total |
| `category` | string | Categoría |
| `brand` | string | Marca |
| `gender` | string | Género |
| `image` | string | URL de imagen |
| `description` | string | Descripción |
| `discount` | float | Descuento |
| `variants` | array[object] | Variantes (tallas, colores) |
| `available_sizes` | array[object] | Tallas disponibles |
| `sizes_list` | array | Lista de tallas |
| `variant_count` | int | Cantidad de variantes |

> ℹ️ **NOTA:** Esta es una vista materializada para optimización de performance. Se actualiza cuando cambian los productos.

---

### ORDERS
**Descripción:** Pedidos de la tienda.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `order_id` | string | **PK** - Identificador único |
| `items` | array[object] | Items del pedido (snapshot) |
| `customer_name` | string | Nombre del cliente |
| `customer_email` | string | Email del cliente |
| `customer_phone` | string | Teléfono del cliente |
| `delivery_type` | string | Tipo de entrega |
| `delivery_address` | string | Dirección de entrega |
| `delivery_cost` | int | Costo de envío |
| `subtotal` | float | Subtotal |
| `total` | float | Total |
| `payment_method` | string | Método de pago |
| `payment_status` | string | Estado del pago |
| `order_status` | string | Estado del pedido |
| `notes` | string | Notas |
| `created_at` | datetime | Fecha de creación |
| `error` | string | Error (si hubo) |
| `status_updated_at` | datetime | Última actualización de estado |

**Relaciones:**
- → `PAYMENT_TRANSACTIONS.order_id` (1:1)

> ℹ️ **NOTA:** `items[]` es un snapshot intencional (correcto para e-commerce). Guarda nombre, precio y cantidad al momento de la compra.

---

### PAYMENT_TRANSACTIONS
**Descripción:** Transacciones de pago.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `transaction_id` | string | **PK** - Identificador único |
| `order_id` | string | **FK** → ORDERS |
| `session_id` | string | ID de sesión de pago |
| `amount_usd` | float | Monto en USD |
| `amount_pyg` | float | Monto en PYG |
| `currency` | string | Moneda |
| `customer_email` | string | Email del cliente |
| `payment_status` | string | Estado del pago |
| `metadata` | object | Metadata adicional |
| `created_at` | datetime | Fecha de creación |

**Relaciones:**
- ← `ORDERS.order_id` (1:1)

---

### SHOP_COUPONS
**Descripción:** Cupones de descuento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** - Identificador único |
| `code` | string | Código del cupón (único) |
| `discount_type` | string | Tipo: percentage, fixed |
| `discount_value` | float | Valor del descuento |
| `min_purchase` | float | Compra mínima |
| `max_uses` | int | Usos máximos |
| `current_uses` | int | Usos actuales |
| `expires_at` | datetime | Fecha de expiración |
| `is_active` | bool | Activo |
| `description` | string | Descripción |
| `created_at` | datetime | Fecha de creación |

---

## Tablas de Soporte

### RESERVATIONS
**Descripción:** Reservas del estudio fotográfico.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `reservation_id` | string | **PK** |
| `user_id` | string | **FK** → USERS (nullable) |
| `date` | string | Fecha |
| `start_time` | string | Hora inicio |
| `end_time` | string | Hora fin |
| `duration_hours` | int | Duración en horas |
| `price` | int | Precio |
| `name` | string | Nombre |
| `phone` | string | Teléfono |
| `email` | string | Email |
| `company` | string | Empresa |
| `razon_social` | string | Razón social |
| `ruc` | string | RUC |
| `status` | string | Estado |
| `created_at` | datetime | Fecha de creación |

---

### BRAND_INQUIRIES
**Descripción:** Consultas de marcas interesadas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `inquiry_id` | string | **PK** |
| `brand_name` | string | Nombre de la marca |
| `contact_name` | string | Nombre del contacto |
| `email` | string | Email |
| `phone` | string | Teléfono |
| `interest` | string | Interés |
| `interest_label` | string | Etiqueta del interés |
| `message` | string | Mensaje |
| `status` | string | Estado |
| `created_at` | datetime | Fecha |
| `notes` | string | Notas |

---

### AUDIT_LOGS
**Descripción:** Logs de auditoría del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** |
| `action` | string | Acción realizada |
| `user_id` | string | **FK** → USERS (nullable) |
| `user_email` | string | Email del usuario |
| `user_role` | string | Rol del usuario |
| `ip_address` | string | Dirección IP |
| `user_agent` | string | User Agent |
| `target_type` | string | Tipo de objeto afectado |
| `target_id` | string | ID del objeto afectado |
| `details` | object | Detalles adicionales |
| `timestamp` | datetime | Fecha y hora |

---

### EMAIL_LOGS
**Descripción:** Logs de emails enviados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** |
| `to_email` | string | Destinatario |
| `from_email` | string | Remitente |
| `subject` | string | Asunto |
| `sender_type` | string | Tipo de remitente |
| `entity_type` | string | Tipo de entidad |
| `entity_id` | string | ID de entidad |
| `status` | string | Estado |
| `error_message` | string | Mensaje de error |
| `message_id` | string | ID del mensaje (Resend) |
| `created_at` | datetime | Fecha de creación |
| `sent_at` | datetime | Fecha de envío |

---

### TERMS_ACCEPTANCES
**Descripción:** Aceptaciones de términos y condiciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | string | **PK** (compuesto) **FK** → USERS |
| `terms_slug` | string | **PK** (compuesto) |
| `terms_version` | string | Versión aceptada |
| `accepted_at` | datetime | Fecha de aceptación |
| `ip_address` | string | IP del usuario |
| `user_agent` | string | User Agent |

---

### SYSTEM_NOTIFICATIONS
**Descripción:** Notificaciones del sistema para admins.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | **PK** |
| `type` | string | Tipo: backup_success, error_alert, etc. |
| `title` | string | Título |
| `message` | string | Mensaje |
| `severity` | string | Severidad: info, warning, error, critical |
| `metadata` | object | Datos adicionales |
| `is_read` | bool | Leída (deprecated) |
| `read_by` | array[string] | IDs de admins que leyeron |
| `created_at` | datetime | Fecha de creación |

---

### ADMIN_SETTINGS
**Descripción:** Configuración global del sistema (singleton).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `payment_gateway_enabled` | bool | Gateway de pago activo |
| `show_only_products_with_images` | bool | Mostrar solo productos con imagen |
| `whatsapp_commercial` | string | WhatsApp comercial |
| `whatsapp_marcas` | string | WhatsApp para marcas |

---

## Análisis de Normalización

### Nivel General: 7/10 (Bueno)

### ✅ Fortalezas
- Relaciones FK claras entre entidades
- IDs propios (UUID) en vez de depender de `_id` de MongoDB
- Snapshot de órdenes (correcto para e-commerce)
- Vista materializada para productos agrupados

### ⚠️ Oportunidades de Mejora

| Tabla | Problema | Riesgo | Recomendación |
|-------|----------|--------|---------------|
| `UGC_APPLICATIONS` | Duplica datos del creador | MEDIO | Usar `creator_id` FK |
| `UGC_RATINGS` | `brand_name` desnormalizado | BAJO | Aceptable |
| `UGC_DELIVERABLES` | FKs redundantes | BAJO | Aceptable (optimización) |

---

## Colecciones Legacy

Las siguientes colecciones están deprecadas o pendientes de limpieza:

| Colección | Estado | Notas |
|-----------|--------|-------|
| `images.chunks` | DEPRECATED | Reemplazado por Cloudinary |
| `images.files` | DEPRECATED | Reemplazado por Cloudinary |
| `product_images.chunks` | DEPRECATED | Reemplazado por Cloudinary |
| `product_images.files` | DEPRECATED | Reemplazado por Cloudinary |
| `temp_images` | TEMPORAL | Limpiar periódicamente |
| `temp_image_batches` | TEMPORAL | Limpiar periódicamente |
| `page_content` | VACÍA | Sin uso |
| `migration_backups` | AUDITORÍA | Mantener para referencia |
| `migration_logs` | AUDITORÍA | Mantener para referencia |

---

## Leyenda

- **PK** = Primary Key (Clave Primaria)
- **FK** = Foreign Key (Clave Foránea)
- **1:1** = Relación uno a uno
- **1:N** = Relación uno a muchos
- **N:1** = Relación muchos a uno
- **⚠️** = Problema de normalización identificado
- **ℹ️** = Nota informativa
