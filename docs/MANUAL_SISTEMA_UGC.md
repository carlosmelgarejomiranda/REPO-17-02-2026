# Manual Técnico del Sistema UGC - Avenue

**Propósito:** Documentar todas las funcionalidades del sistema UGC pantalla por pantalla para preservar la lógica de negocio durante la migración de base de datos.

**Última actualización:** 2026-02-04

---

## Índice

1. [Flujo de Usuario - Creador](#1-flujo-de-usuario---creador)
2. [Flujo de Usuario - Marca](#2-flujo-de-usuario---marca)
3. [Flujo de Administrador](#3-flujo-de-administrador)
4. [Catálogo de Campañas (Público)](#4-catálogo-de-campañas-público)

---

## 1. FLUJO DE USUARIO - CREADOR

### 1.1 Onboarding de Creador
**Archivo:** `/app/frontend/src/pages/ugc/CreatorOnboarding.jsx`  
**Ruta:** `/ugc/creator/onboarding`

#### Descripción
Proceso de registro en 5 pasos para crear un perfil de creador UGC.

#### Fuentes de Datos
| Dato | Colección | Campo |
|------|-----------|-------|
| Usuario autenticado | `users` | `user_id`, `email`, `name` |
| Perfil existente (si actualiza) | `ugc_creators` | Todos los campos |

#### Pasos del Formulario
1. **Datos Personales:** nombre, fecha_nacimiento, género, documento_id
2. **Ubicación y Contacto:** país, ciudad, código_país, teléfono
3. **Perfil Profesional:** categorías[], bio, educación, ocupación, idiomas[], portfolio_url
4. **Redes Sociales:** instagram_username, tiktok_username + verificación IA opcional
5. **Foto y Confirmación:** profile_picture (base64), terms_accepted

#### Actualizaciones de Base de Datos

| Acción | Colección | Operación | Campos |
|--------|-----------|-----------|--------|
| Crear perfil nuevo | `ugc_creators` | INSERT | Todos los campos del formulario + `id`, `user_id`, `created_at`, `level: "rookie"`, `stats: {}` |
| Actualizar perfil incompleto | `ugc_creators` | UPDATE | Campos modificados + `updated_at`, `needs_profile_update: false` |
| Aceptar términos | `terms_acceptances` | INSERT | `user_id`, `terms_slug: "terms-ugc-creator"`, `terms_version`, `accepted_at`, `ip_address` |

#### Validaciones
- Edad mínima: 18 años
- Al menos una red social requerida
- Teléfono: 6-15 dígitos
- Términos obligatorios

---

### 1.2 Dashboard del Creador
**Archivo:** `/app/frontend/src/pages/ugc/CreatorDashboard.jsx`  
**Ruta:** `/ugc/creator/dashboard`

#### Descripción
Panel principal del creador con estadísticas, entregas activas y redes sociales.

#### Fuentes de Datos
| Dato | API Endpoint | Colección | Campos |
|------|--------------|-----------|--------|
| Perfil del creador | `GET /api/ugc/creators/me` | `ugc_creators` | `name`, `level`, `rating`, `stats`, `social_networks[]` |
| Entregas activas | `GET /api/ugc/creators/me/active-deliverables` | `ugc_deliverables` | `id`, `status`, `campaign.name`, `brand.company_name`, `platform` |

#### Datos Mostrados
- **Rating:** `stats.avg_rating` o `rating`
- **Campañas completadas:** `stats.completed_campaigns` o `completed_campaigns`
- **Tasa a tiempo:** `stats.delivery_on_time_rate`
- **Alcance total:** `stats.total_reach`
- **Nivel:** `level` (rookie, rising, established, top, elite)
- **Redes verificadas:** `social_networks[]` + `social_accounts` (verificación IA)

#### Actualizaciones de Base de Datos

| Acción | Colección | Operación | Detalle |
|--------|-----------|-----------|---------|
| Recalcular stats (background) | `ugc_creators` | UPDATE | `POST /api/ugc/creators/me/recalculate-stats` actualiza `stats{}` |

#### Acciones Disponibles
- **"Explorar campañas"** → `/ugc/campaigns`
- **Ver entrega** → `/ugc/creator/deliverable/{id}`
- **Editar perfil** → `/ugc/creator/profile`

---

### 1.3 Catálogo de Campañas para Creadores
**Archivo:** `/app/frontend/src/pages/ugc/CampaignsCatalog.jsx`  
**Ruta:** `/ugc/campaigns`

#### Descripción
Lista de campañas disponibles donde el creador puede postularse.

#### Fuentes de Datos
| Dato | API Endpoint | Colección | Query |
|------|--------------|-----------|-------|
| Campañas disponibles | `GET /api/ugc/campaigns/available` | `ugc_campaigns` | `status: "live"`, `visible_to_creators: true` |
| Datos de marca | Join implícito | `ugc_brands` | `company_name`, `logo_url`, `industry` |
| Aplicación existente | Join implícito | `ugc_applications` | `campaign_id`, `creator_id` |

#### Filtros
- **Categoría:** `category` (Food & Gastro, Beauty, Fashion, etc.)
- **Ciudad:** `city` (Asunción, San Lorenzo, Luque, etc.)
- **Plataforma:** `requirements.platforms`
- **Búsqueda:** `name`, `description`, `brand.company_name`

#### Datos Mostrados por Campaña
- Nombre, descripción, categoría, ciudad
- Marca (company_name)
- Valor del canje (`canje.value`)
- Cupos disponibles (`slots - slots_filled` o `available_slots`)
- Requisitos de seguidores (`requirements.min_followers`)
- Estado "Ya aplicaste" (`has_applied: true/false`)

#### Actualizaciones de Base de Datos

| Acción | Colección | Operación | Campos |
|--------|-----------|-----------|--------|
| **Postularse a campaña** | `ugc_applications` | INSERT | Ver sección 1.4 |

---

### 1.4 Postulación a Campaña
**Archivo:** `/app/frontend/src/pages/ugc/CampaignsCatalog.jsx` (Modal)  
**API:** `POST /api/ugc/applications/apply`

#### Descripción
Modal para que el creador envíe su postulación a una campaña.

#### Datos de Entrada
- `campaign_id` (obligatorio)
- `note` / `motivation` (opcional) - Por qué es ideal para la campaña
- `proposed_content` (opcional)

#### Validaciones Previas
1. Creador debe tener perfil completo (`needs_profile_update: false`)
2. Campaña debe estar en estado `live`
3. Campaña debe tener cupos disponibles (`slots_filled < slots`)
4. Creador no debe haber aplicado ya
5. Seguidores >= `requirements.min_followers` (si aplica)
6. Debe tener al menos una plataforma requerida

#### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_applications` | INSERT | `id` (uuid), `application_id` (= id), `campaign_id`, `creator_id`, `creator_name`, `creator_username`, `creator_followers`, `creator_rating`, `creator_level`, `motivation`, `proposed_content`, `portfolio_links`, `status: "applied"`, `status_history[]`, `applied_at`, `updated_at` |

#### Notificaciones Enviadas
1. **Email al creador:** Confirmación de aplicación (`send_application_submitted`)
2. **Email a la marca:** Nueva aplicación recibida (`send_new_application_to_brand`)
3. **WhatsApp al admin:** Nueva aplicación (`notify_new_campaign_application`)

---

### 1.5 Detalle de Entrega (Deliverable)
**Archivo:** `/app/frontend/src/pages/ugc/DeliverableDetail.jsx`  
**Ruta:** `/ugc/creator/deliverable/{id}`

#### Descripción
Pantalla donde el creador registra las URLs de sus publicaciones.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Detalle entrega | `GET /api/ugc/deliverables/{id}` | `ugc_deliverables` |
| Datos campaña | Embebido | `ugc_campaigns` |
| Datos marca | Embebido | `ugc_brands` |

#### Datos Mostrados
- Nombre de campaña
- Nombre de marca
- Estado de la entrega (`status`)
- Fecha límite URL (`url_deadline`)
- Fecha límite métricas (`metrics_window_closes`)
- URLs ya registradas (`instagram_url`, `tiktok_url`)

#### Estados de Entrega
| Estado | Etiqueta | Acción Permitida |
|--------|----------|------------------|
| `awaiting_publish` | Por Publicar | Subir URL |
| `published` | Publicado | Subir métricas |
| `submitted` | Enviado | Solo lectura |
| `under_review` | En Revisión | Solo lectura |
| `changes_requested` | Cambios | Subir nueva URL |
| `approved` | Aprobado | Subir métricas |
| `metrics_pending` | Métricas | Subir métricas |
| `completed` | Completado | Solo lectura |

#### Actualizaciones de Base de Datos

| Acción | API | Colección | Operación | Campos |
|--------|-----|-----------|-----------|--------|
| **Registrar URL** | `POST /api/ugc/deliverables/{id}/publish` | `ugc_deliverables` | UPDATE | `post_url`, `instagram_url`, `tiktok_url`, `status: "published"`, `published_at`, `updated_at` |

#### Validación de URLs
El sistema valida en frontend:
- **Instagram:** Debe ser `instagram.com/p/...` o `instagram.com/reel/...` (no perfil, no stories)
- **TikTok:** Debe ser `tiktok.com/@user/video/...` (no perfil)

---

### 1.6 Subir Métricas
**Archivo:** `/app/frontend/src/pages/ugc/MetricsSubmit.jsx`  
**Ruta:** `/ugc/creator/metrics/{deliverableId}`

#### Descripción
Pantalla para que el creador suba screenshots de métricas que son procesados por IA.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Detalle entrega | `GET /api/ugc/deliverables/{deliverableId}` | `ugc_deliverables` |

#### Datos de Entrada
- Screenshots de Instagram (hasta 10 imágenes)
- Screenshots de TikTok (hasta 10 imágenes)
- Métricas manuales (fallback): views, reach, likes, comments, shares, saves

#### Flujo de Procesamiento
1. Creador sube screenshots (base64)
2. Sistema envía a IA para extracción (`POST /api/ugc/metrics/submit-ai`)
3. IA extrae: views, reach, likes, comments, shares, saves, watch_time, demografía
4. Se guarda resultado con `ai_confidence`

#### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_metrics` | INSERT | `id`, `deliverable_id`, `creator_id`, `campaign_id`, `platform`, `views`, `reach`, `likes`, `comments`, `shares`, `saves`, `watch_time_seconds`, `engagement_rate`, `screenshot_urls[]`, `ai_extracted_data{}`, `ai_confidence`, `demographics{}`, `submitted_at`, `created_at` |
| `ugc_deliverables` | UPDATE | `status: "metrics_submitted"`, `metrics_submitted_at`, `updated_at` |

#### Datos Demográficos Extraídos
- `gender`: `{ male: %, female: %, other: % }`
- `age_ranges`: `[{ range: "18-24", percent: X }, ...]`
- `countries`: `[{ country: "Paraguay", percent: X }, ...]`
- `cities`: `[{ city: "Asunción", percent: X }, ...]`

---

### 1.7 Mi Trabajo (Lista de Entregas)
**Archivo:** `/app/frontend/src/pages/ugc/CreatorMyWork.jsx`  
**Ruta:** `/ugc/creator/my-work`

#### Descripción
Lista de todas las entregas del creador con filtros por estado.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Entregas del creador | `GET /api/ugc/creators/me/deliverables` | `ugc_deliverables` |

#### Filtros
- Por estado: Todos, Pendientes, En proceso, Completados
- Por plataforma: Instagram, TikTok

#### Acciones
- Ver detalle de entrega
- Subir métricas (si aplica)

---

### 1.8 Perfil del Creador (Edición)
**Archivo:** `/app/frontend/src/pages/ugc/CreatorProfileEdit.jsx`  
**Ruta:** `/ugc/creator/profile`

#### Descripción
Edición del perfil del creador y verificación de redes sociales.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Perfil | `GET /api/ugc/creators/me` | `ugc_creators` |

#### Secciones Editables
1. **Información personal:** nombre, bio, foto
2. **Categorías:** array de categorías de contenido
3. **Redes sociales:** username + verificación IA
4. **Verificación IA:** Subir screenshot para verificar seguidores

#### Actualizaciones de Base de Datos

| Acción | Colección | Operación | Campos |
|--------|-----------|-----------|--------|
| Actualizar perfil | `ugc_creators` | UPDATE | Campos modificados + `updated_at` |
| Verificar red social | `ugc_creators` | UPDATE | `social_accounts.{platform}` con datos de IA |

---

## 2. FLUJO DE USUARIO - MARCA

### 2.1 Onboarding de Marca
**Archivo:** `/app/frontend/src/pages/ugc/BrandOnboarding.jsx`  
**Ruta:** `/ugc/brand/onboarding`

#### Descripción
Proceso de registro en 3 pasos para crear un perfil de marca.

#### Pasos del Formulario
1. **Autenticación:** Login con Google o email
2. **Datos Requeridos:** company_name, industry, country, city, contact_name, contact_phone
3. **Datos Opcionales:** website, instagram, description + aceptar términos

#### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_brands` | INSERT | `id`, `user_id`, `email`, `company_name`, `industry`, `country`, `city`, `contact_name`, `contact_first_name`, `contact_last_name`, `contact_phone`, `phone_country_code`, `website`, `instagram_url`, `instagram_handle`, `description`, `is_verified: false`, `is_active: true`, `onboarding_completed: true`, `created_at`, `updated_at` |
| `terms_acceptances` | INSERT | `user_id`, `terms_slug: "terms-ugc-brand"`, `terms_version`, `accepted_at` |

---

### 2.2 Dashboard de Marca
**Archivo:** `/app/frontend/src/pages/ugc/BrandDashboard.jsx`  
**Ruta:** `/ugc/brand/dashboard`

#### Descripción
Panel principal de la marca con lista de campañas y estadísticas.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Dashboard | `GET /api/ugc/brands/me/dashboard` | `ugc_brands`, `ugc_campaigns` |

#### Datos Mostrados por Campaña
- Nombre, categoría, ciudad
- Estado (`status`)
- Contadores: `applications_count`, `confirmed_count`, `posteos_count`, `metrics_count`
- Cupos: `slots_filled` / `slots`

#### Acciones
- Ver reportes de campaña → `/ugc/brand/campaigns/{id}/reports`

---

### 2.3 Lista de Campañas de Marca
**Archivo:** `/app/frontend/src/pages/ugc/BrandCampaigns.jsx`  
**Ruta:** `/ugc/brand/campaigns`

#### Descripción
Lista de todas las campañas de la marca con opción de crear nueva.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Campañas de la marca | `GET /api/ugc/campaigns/me/all` | `ugc_campaigns` |

#### Estados de Campaña
| Estado | Etiqueta | Color |
|--------|----------|-------|
| `draft` | Borrador | Gris |
| `live` | Activa | Verde |
| `closed` | Cerrada | Amarillo |
| `in_production` | En Producción | Púrpura |
| `completed` | Completada | Azul |

---

### 2.4 Reportes de Campaña
**Archivo:** `/app/frontend/src/pages/ugc/BrandCampaignReports.jsx`  
**Ruta:** `/ugc/brand/campaigns/{campaignId}/reports`

#### Descripción
Dashboard con métricas, demografía y lista de postulantes de una campaña.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Campaña | `GET /api/ugc/campaigns/{campaignId}` | `ugc_campaigns` |
| Métricas detalladas | `GET /api/ugc/metrics/campaign/{campaignId}/detailed` | `ugc_metrics` |
| Demografía | `GET /api/ugc/metrics/campaign/{campaignId}/demographics` | `ugc_metrics` |
| Postulantes | `GET /api/ugc/campaigns/{campaignId}/applicants-report` | `ugc_applications`, `ugc_creators` |

#### Pestañas
1. **Métricas:** Totales y por creador (views, reach, likes, comments, shares, saves)
2. **Demografía:** Género, edad, países (gráficos circulares y barras)
3. **Postulantes:** Lista con estadísticas promedio de cada creador

#### Filtros
- Por plataforma: Instagram, TikTok, Ambas
- Por mes: Histórico o mes específico

---

### 2.5 Aplicaciones de Campaña (Vista Marca)
**Archivo:** `/app/frontend/src/pages/ugc/CampaignApplications.jsx`  
**Ruta:** `/ugc/brand/campaigns/{campaignId}/applications`

#### Descripción
Lista de creadores preseleccionados y confirmados para una campaña.

**IMPORTANTE:** La marca SOLO puede VER (no gestionar). La gestión la hace el admin de Avenue.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Campaña | `GET /api/ugc/campaigns/{campaignId}` | `ugc_campaigns` |
| Aplicaciones | `GET /api/ugc/applications/campaign/{campaignId}` | `ugc_applications` |

#### Datos Mostrados
- Solo aplicaciones con `status: "shortlisted"` o `status: "confirmed"`
- Contadores: pendientes, preseleccionados, confirmados
- Por creador: nombre, username, nivel, rating, seguidores, redes sociales, motivación

---

### 2.6 Entregas de Campaña (Vista Marca)
**Archivo:** `/app/frontend/src/pages/ugc/BrandDeliverables.jsx`  
**Ruta:** `/ugc/brand/deliverables/{campaignId}`

#### Descripción
Lista de entregas de contenido de una campaña con links a los posts.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Entregas | `GET /api/ugc/deliverables/brand/campaign/{campaignId}` | `ugc_deliverables` |

#### Datos Mostrados
- Por entrega: creador, plataforma, status, URL del post, fecha, métricas
- Links directos a Instagram/TikTok

---

## 3. FLUJO DE ADMINISTRADOR

### 3.1 Administrar Campañas
**Archivo:** `/app/frontend/src/components/AdminCampaignManager.jsx`  
**Acceso:** Panel de Admin → Campañas

#### Descripción
CRUD completo de campañas con gestión de aplicaciones.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Todas las campañas | `GET /api/ugc/admin/campaigns` | `ugc_campaigns` |
| Marcas para filtro | Embebido en respuesta | `ugc_brands` |
| Aplicaciones de campaña | `GET /api/ugc/admin/campaigns/{id}/applications` | `ugc_applications` |

#### Filtros de Campañas
- Búsqueda por nombre
- Por estado: draft, live, closed, in_production, completed
- Por marca (`brand_id`)
- Con pendientes (`has_pending: true`)
- Con entregas atrasadas (`has_late_deliveries: true`)

#### 3.1.1 Crear Campaña
**API:** `POST /api/ugc/admin/campaigns`

##### Campos del Formulario
| Sección | Campos |
|---------|--------|
| **Básicos** | brand_id, brand_name, name, description, category, city |
| **Contrato** | monthly_deliverables, contract_duration_months, contract_start_date |
| **Requisitos** | gender, min_age, min_followers, country, residence |
| **Canje** | canje_type, canje_description, canje_value, delivery_method, pickup_address, pickup_maps_url, pickup_hours, brand_contact_name, brand_contact_phone |
| **Timeline** | applications_deadline, publish_start, publish_end |
| **Entregas** | url_delivery_days, metrics_delivery_days, url_delivery_fixed_date, metrics_delivery_fixed_date |
| **Assets** | cover_image_url |
| **Admin** | admin_notes |

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_campaigns` | INSERT | Todos los campos + `id`, `status: "draft"`, `slots: monthly_deliverables * contract_duration_months`, `slots_filled: 0`, `created_at`, `created_by_admin` |

---

#### 3.1.2 Editar Campaña
**API:** `PUT /api/ugc/admin/campaigns/{id}`

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_campaigns` | UPDATE | Campos modificados + `updated_at` |

---

#### 3.1.3 Cambiar Estado de Campaña
**API:** `POST /api/ugc/admin/campaigns/{id}/status`

##### Estados y Transiciones
| De | A | Condiciones |
|----|---|-------------|
| `draft` | `live` | Publicar campaña |
| `live` | `closed` | Cerrar aplicaciones |
| `closed` | `in_production` | Iniciar producción |
| `in_production` | `completed` | Completar campaña |

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_campaigns` | UPDATE | `status`, `updated_at`, `published_at` (si → live), `completed_at` (si → completed) |

---

### 3.2 Administrar Aplicaciones (desde Campañas)
**Dentro de:** `AdminCampaignManager.jsx`

#### Descripción
Gestión de aplicaciones de creadores a una campaña específica.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Aplicaciones | `GET /api/ugc/admin/campaigns/{id}/applications` | `ugc_applications` |
| Datos del creador | Embebido | `ugc_creators` |

#### Datos Mostrados por Aplicación
- Nombre creador, username, nivel, rating, seguidores
- Estado de verificación de redes
- Links a Instagram/TikTok
- Motivación
- Estado de la aplicación
- Estadísticas del creador: % a tiempo, retraso promedio

#### Filtros
- Por estado: Todos, Pendientes, Preseleccionados, Confirmados, Rechazados, Cancelados
- Por verificación: Solo con IG verificado / Todas
- Ordenar por: Followers IG, Followers TikTok, Promedio vistas, Rating
- Orden: Mayor a menor / Menor a mayor

#### 3.2.1 Preseleccionar Creador
**API:** `POST /api/ugc/admin/campaigns/{id}/applications/{appId}/shortlist`

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_applications` | UPDATE | `status: "shortlisted"`, `status_history[]` += nuevo estado, `updated_at` |

##### Notificaciones
- Email al creador: Preseleccionado (`send_shortlisted_notification`)

---

#### 3.2.2 Confirmar Creador
**API:** `POST /api/ugc/admin/campaigns/{id}/applications/{appId}/confirm`

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_applications` | UPDATE | `status: "confirmed"`, `confirmed_at`, `url_deadline`, `metrics_deadline`, `status_history[]`, `updated_at` |
| `ugc_campaigns` | UPDATE | `slots_filled` += 1 |
| `ugc_deliverables` | INSERT | `id`, `campaign_id`, `application_id`, `creator_id`, `brand_id`, `platform`, `status: "awaiting_publish"`, `url_deadline`, `metrics_window_opens`, `metrics_window_closes`, `created_at` |
| `ugc_creators` | UPDATE | `campaigns_participated` += 1 |

##### Notificaciones
- Email al creador: Confirmado (`send_confirmed_notification`)
- WhatsApp al admin

---

#### 3.2.3 Rechazar Creador
**API:** `POST /api/ugc/admin/campaigns/{id}/applications/{appId}/reject`

##### Parámetros
- `reason` (opcional): Razón del rechazo

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_applications` | UPDATE | `status: "rejected"`, `rejected_at`, `rejection_reason`, `status_history[]`, `updated_at` |

---

#### 3.2.4 Cancelar Creador Confirmado
**API:** `POST /api/ugc/admin/campaigns/{id}/applications/{appId}/cancel`

##### Parámetros
- `reason`: Razón de la cancelación

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_applications` | UPDATE | `status: "cancelled"`, `cancelled_at`, `cancelled_by: "admin"`, `cancellation_reason`, `status_history[]`, `updated_at` |
| `ugc_campaigns` | UPDATE | `slots_filled` -= 1 |
| `ugc_deliverables` | UPDATE | `status: "cancelled"` (entregas asociadas) |

---

#### 3.2.5 Reactivar Creador Cancelado
**API:** `POST /api/ugc/admin/campaigns/{id}/applications/{appId}/reactivate`

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_applications` | UPDATE | `status: "confirmed"`, `status_history[]`, `updated_at` |
| `ugc_campaigns` | UPDATE | `slots_filled` += 1 |
| `ugc_deliverables` | UPDATE | `status: "awaiting_publish"` (entregas asociadas) |

---

#### 3.2.6 Contactar via WhatsApp
**Acción:** Abre link `https://wa.me/{phone}?text={mensaje}`

##### Datos Usados
- `creator.phone_full` o `creator.phone` con `phone_country_code`
- Mensaje predefinido con nombre de campaña

---

### 3.3 Administrar Entregas (Deliverables)
**Archivo:** `/app/frontend/src/components/admin/AdminDeliverablesTab.jsx`

#### Descripción
Gestión de entregas de contenido de todos los creadores.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Todas las entregas | `GET /api/ugc/admin/deliverables` | `ugc_deliverables` |

#### Filtros
- Por estado
- Por campaña
- Por creador
- Por plataforma
- Atrasados

#### 3.3.1 Aprobar Entrega
**API:** `POST /api/ugc/admin/deliverables/{id}/approve`

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_deliverables` | UPDATE | `status: "approved"`, `approved_at`, `approved_by`, `updated_at` |

##### Notificaciones
- Email al creador: Entrega aprobada

---

#### 3.3.2 Solicitar Cambios
**API:** `POST /api/ugc/admin/deliverables/{id}/request-changes`

##### Parámetros
- `notes`: Cambios solicitados

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_deliverables` | UPDATE | `status: "changes_requested"`, `review_notes[]` += nueva nota, `review_round` += 1, `updated_at` |

##### Notificaciones
- Email al creador: Cambios solicitados

---

#### 3.3.3 Calificar Entrega (Rating)
**API:** `POST /api/ugc/admin/deliverables/{id}/rate`

##### Parámetros
- `rating` (1-5): Calificación
- `comment` (opcional): Comentario

##### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_ratings` | INSERT | `id`, `deliverable_id`, `campaign_id`, `creator_id`, `brand_id`, `brand_name`, `rating`, `comment`, `created_at` |
| `ugc_deliverables` | UPDATE | `brand_rating: { rating, comment, rated_at, rated_by }`, `updated_at` |
| `ugc_creators` | UPDATE | Recalcular `stats.avg_rating`, `stats.total_ratings` |

---

### 3.4 Administrar Creadores
**Archivo:** `/app/frontend/src/components/admin/AdminCreatorsTab.jsx`

#### Descripción
Lista y gestión de todos los creadores registrados.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Todos los creadores | `GET /api/ugc/admin/creators` | `ugc_creators` |

#### Filtros
- Búsqueda por nombre/email
- Por nivel
- Por verificación
- Por estado activo

#### Acciones
- Ver perfil completo
- Cambiar nivel manualmente
- Suspender/Reactivar cuenta
- Ver historial de campañas

---

### 3.5 Administrar Marcas
**Archivo:** `/app/frontend/src/components/admin/AdminBrandsTab.jsx`

#### Descripción
Lista y gestión de todas las marcas registradas.

#### Fuentes de Datos
| Dato | API Endpoint | Colección |
|------|--------------|-----------|
| Todas las marcas | `GET /api/ugc/admin/brands` | `ugc_brands` |

#### Acciones
- Ver perfil completo
- Verificar marca
- Suspender/Reactivar cuenta
- Ver campañas de la marca
- Ver paquetes activos

---

### 3.6 Transferir Propiedad de Campaña
**API:** `POST /api/ugc/admin/campaigns/{id}/transfer`

#### Descripción
Transferir una campaña a otra marca/empresa.

#### Parámetros
- `email`: Email de la nueva marca propietaria

#### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_campaigns` | UPDATE | `brand_id` (nuevo), `updated_at`, `transfer_history[]` += registro |

---

### 3.7 Renovar Campaña
**API:** `POST /api/ugc/admin/campaigns/{id}/renew`

#### Descripción
Agregar más cupos/meses a una campaña existente.

#### Parámetros
- `months`: Meses adicionales
- `slots_per_month`: Cupos por mes

#### Actualizaciones de Base de Datos

| Colección | Operación | Campos |
|-----------|-----------|--------|
| `ugc_campaigns` | UPDATE | `total_slots_loaded` += (months * slots), `available_slots` += (months * slots), `contract.duration_months` += months, `renewal_history[]`, `updated_at` |

---

## 4. CATÁLOGO DE CAMPAÑAS (PÚBLICO)

### 4.1 Landing de Creadores
**Archivo:** `/app/frontend/src/components/UGCCreators.jsx`  
**Ruta:** `/ugc/creators`

#### Descripción
Página informativa sobre el programa de creadores UGC.

#### Acciones
- "Registrarme como Creator" → `/ugc/creator/onboarding`
- "Ver campañas disponibles" → `/ugc/campaigns`

---

### 4.2 Landing de Marcas
**Archivo:** `/app/frontend/src/pages/ugc/UGCMarcas.jsx`  
**Ruta:** `/ugc/marcas`

#### Descripción
Página informativa sobre el programa UGC para marcas.

#### Acciones
- "Registrar mi marca" → `/ugc/brand/onboarding`
- "Ver paquetes" → `/ugc/packages`

---

## Apéndice A: Estados de las Entidades

### Estados de Campaña (`ugc_campaigns.status`)
| Estado | Descripción |
|--------|-------------|
| `draft` | Borrador, no visible |
| `live` | Activa, acepta aplicaciones |
| `closed` | Cerrada, no acepta aplicaciones |
| `in_production` | En producción de contenido |
| `completed` | Completada |

### Estados de Aplicación (`ugc_applications.status`)
| Estado | Descripción |
|--------|-------------|
| `applied` | Pendiente de revisión |
| `shortlisted` | Preseleccionado |
| `confirmed` | Confirmado para la campaña |
| `rejected` | Rechazado |
| `cancelled` | Cancelado (post-confirmación) |

### Estados de Entrega (`ugc_deliverables.status`)
| Estado | Descripción |
|--------|-------------|
| `awaiting_publish` | Esperando URL del post |
| `published` | URL registrada, esperando revisión |
| `submitted` | Enviado para revisión |
| `under_review` | En revisión por admin |
| `changes_requested` | Se solicitaron cambios |
| `resubmitted` | Re-enviado después de cambios |
| `approved` | Aprobado |
| `metrics_pending` | Esperando métricas |
| `metrics_submitted` | Métricas enviadas |
| `completed` | Completado |
| `cancelled` | Cancelado |

---

## Apéndice B: Notificaciones del Sistema

### Emails Enviados
| Evento | Destinatario | Template |
|--------|--------------|----------|
| Aplicación enviada | Creador | `send_application_submitted` |
| Nueva aplicación | Marca | `send_new_application_to_brand` |
| Preseleccionado | Creador | `send_shortlisted_notification` |
| Confirmado | Creador | `send_confirmed_notification` |
| Entrega aprobada | Creador | `send_delivery_approved` |
| Cambios solicitados | Creador | `send_changes_requested` |

### Notificaciones In-App
- Colección: `ugc_notifications`
- Se crean automáticamente en eventos clave

---

## Apéndice C: Integraciones de Terceros

| Servicio | Uso |
|----------|-----|
| **Cloudinary** | Almacenamiento de imágenes (perfiles, campañas, métricas) |
| **Resend** | Envío de emails transaccionales |
| **Gemini Vision** | Extracción IA de métricas de screenshots |
| **WhatsApp** | Links directos para contacto |
| **Google OAuth** | Autenticación de usuarios |

---

## Apéndice D: Cálculos Automáticos

### Estadísticas del Creador (`ugc_creators.stats`)
Recalculadas en `POST /api/ugc/creators/me/recalculate-stats`:

| Campo | Cálculo |
|-------|---------|
| `completed_campaigns` | COUNT de entregas completadas |
| `total_ratings` | COUNT de ratings recibidos |
| `avg_rating` | AVERAGE de ratings |
| `delivery_on_time_rate` | % de entregas a tiempo |
| `total_reach` | SUM de reach de todas las métricas |
| `total_views` | SUM de views |
| `avg_delivery_lag_hours` | Promedio de horas de retraso |

### Nivel del Creador (`ugc_creators.level`)
Se actualiza automáticamente basado en:
- Cantidad de campañas completadas
- Rating promedio
- Tasa de entrega a tiempo

| Nivel | Requisitos |
|-------|------------|
| `rookie` | Inicial |
| `rising` | 3+ campañas, rating >= 3.5 |
| `established` | 10+ campañas, rating >= 4.0 |
| `top` | 25+ campañas, rating >= 4.5, DOT >= 90% |
| `elite` | 50+ campañas, rating >= 4.8, DOT >= 95% |

---

**FIN DEL MANUAL**

*Este documento debe actualizarse cada vez que se modifique la funcionalidad del sistema UGC.*
