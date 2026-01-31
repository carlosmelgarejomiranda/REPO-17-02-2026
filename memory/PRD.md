# AVENUE Platform - Product Requirements Document

## Original Problem Statement
Avenue es una "agencia de posicionamiento y visibilidad" que utiliza su plataforma e-commerce, estudio y servicios UGC como diferenciadores clave.

## Core Services
1. **E-commerce** - Tienda online de moda
2. **Studio** - Reservas de estudio fotográfico
3. **UGC** - Plataforma de User Generated Content conectando marcas con creadores

## User Personas
- **Admin/Superadmin** (`avenuepy@gmail.com`) - Gestión completa
- **UGC Brand** - Marcas que crean campañas
- **UGC Creator** - Creadores que aplican a campañas
- **Customer** - Compradores e-commerce y reservas de studio

---

## What's Been Implemented

### Session: 2026-01-31 (Fork - Sentry Integration)

#### ✅ INFRAESTRUCTURA - Integración de Sentry para Monitoreo de Errores (P0)

**Problema**: La aplicación carecía de monitoreo proactivo de errores. Los problemas solo se detectaban cuando los usuarios los reportaban, lo que causaba impacto significativo en el negocio (ej: formularios de contacto rotos durante campañas de ads).

**Solución implementada**: Integración de Sentry SDK para captura automática de excepciones.

**Configuración:**
- DSN agregado a `/app/backend/.env` como `SENTRY_DSN`
- SDK inicializado en `/app/backend/server.py` después de cargar variables de entorno
- `traces_sample_rate=0.1` (10% de transacciones para monitoreo de performance)
- `send_default_pii=False` (no envía información personal identificable)
- `environment="production"`

**Archivos modificados:**
- `/app/backend/.env` - Agregado SENTRY_DSN
- `/app/backend/server.py` - Import de sentry_sdk e inicialización

**Testing realizado:**
- Endpoint temporal `/api/sentry-test` creado para verificar captura
- Error de división por cero enviado exitosamente a Sentry
- Endpoint de prueba eliminado después de verificación

**Resultado:** El backend ahora captura automáticamente todas las excepciones no manejadas y las envía a Sentry para análisis.

---

### Session: 2026-01-31 (Fork - Cloudinary Migration)

#### ✅ INFRAESTRUCTURA - Migración a Cloudinary para Persistencia de Archivos

**Problema**: Los archivos subidos (imágenes de productos, fotos de perfil, media del website builder) se guardaban en filesystem local o GridFS, lo que causaba pérdida de datos en cada deploy.

**Solución implementada**: Integración completa con Cloudinary como storage persistente.

**Archivos creados:**
- `/app/backend/services/cloudinary_storage.py` - Servicio de upload/delete/URLs firmadas
- `/app/backend/routes/cloudinary_routes.py` - API endpoints para Cloudinary
- `/app/backend/services/image_migration_helper.py` - Helper para migración gradual
- `/app/backend/scripts/migrate_products_to_cloudinary.py` - Script de migración
- `/app/frontend/src/utils/cloudinaryUpload.js` - Helper frontend

**Endpoints actualizados para usar Cloudinary:**
1. `POST /api/shop/admin/upload-product-image` - Imágenes de productos ✅
2. `POST /api/upload` - Upload genérico (campañas, etc.) ✅
3. `POST /api/builder/upload-media` - Website Builder ✅
4. Fotos de perfil de creadores (onboarding y update) ✅

**Migración de datos existentes:**
- 9 imágenes de productos migradas de filesystem a Cloudinary ✅
- URLs originales preservadas en campo `original_image_url` (rollback)
- Backend devuelve `cloudinary_url` preferentemente sobre URLs legacy

**Configuración:**
- Cloud Name: `did4blamy`
- Credenciales en: `/app/backend/.env`
- Carpetas: `avenue/products`, `avenue/creators`, `avenue/campaigns`, `avenue/general`

**Comportamiento:**
- **Sin fallback**: Si Cloudinary falla, error claro al usuario
- **Reintentos**: 3 intentos con backoff exponencial (1s, 2s)
- **Error claro**: "No se pudo subir el archivo después de 3 intentos. Por favor intente de nuevo."

**Razón del diseño:**
- Un solo sistema de storage = menos complejidad
- Error visible > problema oculto descubierto después
- Cloudinary 99.9% uptime, los reintentos cubren glitches temporales

---

### Session: 2026-01-31 (Fork - Campaign Deadlines Fix)

#### ✅ BUG FIX - Fechas de Entrega No Se Mostraban en Reportes (P0)

**Problema reportado por usuario**: Aunque los días de límite de entrega se actualizaban en la configuración de la campaña, las fechas no se modificaban en los reportes de entregas tanto en el panel admin como en el panel de marcas.

**Causa raíz identificada**: 
1. El frontend calculaba los plazos localmente con valores hardcodeados (7 días para URL, 14 días para métricas) en lugar de usar los deadlines guardados en la base de datos.
2. El backend no enriquecía los deliverables con los campos `url_deadline` y `metrics_deadline` desde las aplicaciones.

**Solución implementada**:

**Frontend (4 archivos modificados)**:
- `/app/frontend/src/pages/ugc/BrandDeliverables.jsx`
- `/app/frontend/src/pages/admin/AdminDeliverables.jsx`
- `/app/frontend/src/pages/ugc/CreatorDeliverables.jsx`
- `/app/frontend/src/pages/admin/AdminCreatorDeliverables.jsx`

Cambio en función `getDeadlineStatus()`:
```javascript
// ANTES (hardcodeado):
const daysLimit = type === 'url' ? 7 : 14;

// DESPUÉS (usa deadlines guardados):
const storedDeadline = type === 'url' ? deliverable.url_deadline : deliverable.metrics_deadline;
let deadline;
if (storedDeadline) {
  deadline = new Date(storedDeadline);
} else {
  // Fallback con campaign settings o defaults
  const daysLimit = type === 'url' 
    ? (campaign?.url_delivery_days || 7) 
    : (campaign?.metrics_delivery_days || 14);
  ...
}
```

**Backend (1 archivo modificado)**:
- `/app/backend/routes/ugc_deliverables.py`

Se enriquecen los deliverables con datos de la aplicación:
```python
# Get application data for deadlines
if d.get("application_id"):
    application = await db.ugc_applications.find_one(...)
    if application:
        if not d.get("url_deadline"):
            d["url_deadline"] = application.get("url_deadline")
        if not d.get("metrics_deadline"):
            d["metrics_deadline"] = application.get("metrics_deadline")
        if not d.get("confirmed_at"):
            d["confirmed_at"] = application.get("confirmed_at")
```

**Testing realizado**:
```bash
# 1. Actualizar campaña con nuevos plazos (15/25 días)
PUT /api/ugc/admin/campaigns/{id}
Response: "Se actualizaron los plazos de 1 creadores confirmados"

# 2. Verificar que el endpoint retorna los deadlines actualizados
GET /api/ugc/deliverables/campaign/{id}
- url_deadline: 2026-02-13 (15 días desde confirmación) ✅
- metrics_deadline: 2026-02-23 (25 días desde confirmación) ✅
```

---

#### ✅ BUG FIX - Campaign Delivery Deadlines Not Updating (P0)

**Problema reportado**: Cuando un admin editaba una campaña para cambiar los días de plazo de entrega de URL o métricas, los cambios no se guardaban ni se aplicaban a los creadores que ya habían sido confirmados para esa campaña.

**Causa raíz identificada**: El endpoint `PUT /api/ugc/admin/campaigns/{campaign_id}` solo actualizaba los campos de la campaña, pero no propagaba los nuevos valores de `url_delivery_days` y `metrics_delivery_days` a las aplicaciones (`ugc_applications`) existentes.

**Solución implementada**:
El agente anterior ya había implementado la corrección en `/app/backend/routes/ugc_admin.py` (líneas 1487-1529). La lógica ahora:

1. Detecta si `url_delivery_days` o `metrics_delivery_days` fueron modificados
2. Obtiene todas las aplicaciones confirmadas (`status: "confirmed"`) de la campaña
3. Para cada aplicación:
   - Lee la fecha `confirmed_at` del creador
   - Calcula el nuevo `url_deadline` = `confirmed_at` + `url_delivery_days` días
   - Calcula el nuevo `metrics_deadline` = `confirmed_at` + `metrics_delivery_days` días
   - Actualiza tanto `ugc_applications` como `ugc_deliverables`
4. Retorna mensaje indicando cuántos creadores fueron actualizados

**Testing realizado**:
```bash
# Creada aplicación de prueba con confirmed_at: 2026-01-29
# Update campaña con url_delivery_days=10, metrics_delivery_days=21

PUT /api/ugc/admin/campaigns/{campaign_id}
Response: {"success":true,"message":"Campaña actualizada exitosamente - Se actualizaron los plazos de 1 creadores confirmados"}

# Verificación de datos:
- url_deadline: 2026-02-08 (10 días después de confirmación) ✅
- metrics_deadline: 2026-02-19 (21 días después de confirmación) ✅
```

**Archivo modificado:**
- `/app/backend/routes/ugc_admin.py` (líneas 1487-1534)

**Testing**: Backend API verified via curl ✅

---

### Session: 2026-01-30 (Part 3 - Fork)

#### ✅ VERIFICACIÓN - Cuestionario de Leads en `/ugc/marcas` (P0)

**Estado anterior reportado**: El archivo `UGCMarcas.jsx` estaba supuestamente roto con código duplicado y errores de sintaxis.

**Verificación realizada**: Se revisó el archivo completo y NO se encontraron errores. El cuestionario multi-paso está **completamente implementado** y funcional:

1. **6 Preguntas del Cuestionario**:
   - Q1: Situación actual (max 3 opciones)
   - Q2: Resultado en 90 días (max 2 opciones)
   - Q3: Frustración/obstáculo (max 3 opciones)
   - Q4: Tipo de solución preferida (max 3 opciones)
   - Q5: Inversión mensual (selección única)
   - Q6: Información adicional (texto libre)

2. **Flujo de 2 pasos**:
   - Paso 1: Cuestionario completo
   - Paso 2: Datos de contacto (nombre, email, teléfono, marca)

3. **Integración WhatsApp**:
   - Al enviar, genera mensaje formateado con todos los datos
   - Abre WhatsApp con número `+595976691520`

**Testing**: Visual verification via screenshot ✅

---

### Session: 2026-01-30 (Part 4 - Fork Continued)

#### ✅ FEATURE - Cuestionario de Calificación de Leads en `/tu-marca`

**Solicitud del usuario**: Agregar un cuestionario detallado al formulario de contacto de la página Tu Marca en Avenue.

**Solución implementada**:

1. **6 Preguntas del Cuestionario**:
   - Q1: ¿Cuál describe mejor tu situación actual? (max 3 opciones)
   - Q2: ¿Qué querés lograr en los próximos 90 días? (max 2 opciones)
   - Q3: ¿Qué obstáculo te frena hoy? (max 3 opciones)
   - Q4: Dentro de AVENUE, ¿qué es lo que más te interesa priorizar? (max 3 opciones)
   - Q5: ¿Qué rango de inversión mensual te resulta razonable? (selección única)
   - Q6: Expectativa principal + contexto (texto libre)

2. **Flujo de 2 pasos**:
   - Paso 1: Cuestionario completo con indicador de progreso visual
   - Paso 2: Datos de contacto (nombre, email, teléfono, marca, tipo de producto, plan)

3. **Integración WhatsApp**:
   - Al enviar, genera mensaje formateado con todos los datos del cuestionario
   - Incluye respuestas de las 6 preguntas en formato estructurado
   - Abre WhatsApp con número `+595976691520`

**Archivo modificado:**
- `/app/frontend/src/components/TuMarca.jsx`

**Testing**: Visual verification via screenshot ✅

---

### Session: 2026-01-30 (Part 5 - Fork Continued)

#### ✅ FEATURE - Rediseño de Cuestionarios a Formato Compacto

**Solicitud del usuario**: Cambiar los cuestionarios a un formato más compacto donde las opciones multiselect se despliegan.

**Solución implementada**:

Se crearon dos nuevos componentes reutilizables:
1. **MultiSelectDropdown**: Para preguntas con selección múltiple
   - Header colapsable que muestra la pregunta y subtítulo
   - Badge indicando cantidad seleccionada (ej: "2/3")
   - Lista de opciones con checkboxes al expandir
   - Animación de flecha rotando al expandir/colapsar

2. **SingleSelectDropdown**: Para preguntas de selección única
   - Similar al multiselect pero con radio buttons
   - Se cierra automáticamente al seleccionar

**Características del nuevo diseño:**
- Todas las 6 preguntas visibles en una sola pantalla (sin scroll excesivo)
- Opciones ocultas por defecto, se despliegan al hacer click
- Indicador visual de progreso (badge dorado con contador)
- Formulario de datos de contacto más compacto (2 columnas)
- Ancho reducido a max-w-2xl para mejor legibilidad

**Archivos modificados:**
- `/app/frontend/src/components/TuMarca.jsx`
- `/app/frontend/src/pages/ugc/UGCMarcas.jsx`

**Testing**: Visual verification via screenshot ✅

---

#### ✅ VERIFICACIÓN - Admin Panel Sorting y Followers (P1)

**Estado verificado**: La funcionalidad de seguidores y sorting en el panel de Admin está **correctamente implementada**:

**Backend** (`/app/backend/routes/ugc_admin.py`):
- Campos `ig_followers` y `tt_followers` se calculan en cada endpoint
- Lógica: primero busca en `verified_instagram/tiktok`, luego en `social_networks` sin verificar

**Frontend** (`AdminCreatorsTab.jsx`):
- Columnas "SEG. IG" y "SEG. TT" visibles
- Dropdown "Ordenar por..." con opciones: Seguidores IG, Seguidores TT, Prom. Vistas, Prom. Alcance
- Sorting con `useMemo` para eficiencia
- Badge de verificación (✓) junto a seguidores de cuentas verificadas por IA

**Nota**: Los datos de prueba en el preview muestran "—" porque los creators de prueba no tienen seguidores configurados. En producción con datos reales, los números aparecerían correctamente.

**Testing**: Visual verification via screenshot ✅

---

### Session: 2026-01-30 (Part 2)

#### ✅ FEATURE - Columnas de Seguidores y Filtros de Verificación IA

**Solicitud del usuario**: Ver seguidores de Instagram y TikTok de creadores con cuentas verificadas por IA, con filtros y ordenamiento.

**Solución implementada** en 3 páginas:

1. **AdminCreatorsTab.jsx** (Lista de Creators):
   - Nuevas columnas "Seg. IG" y "Seg. TT" mostrando seguidores verificados
   - Badge verde ✓ indica cuentas verificadas con IA
   - Filtro "Con redes verificadas IA" para mostrar solo creadores con verificación
   - Ordenamiento por seguidores IG, TT, promedio de vistas y alcance
   - Headers clickeables para ordenar rápidamente

2. **AdminCreatorsReport.jsx** (Reporte de Creadores):
   - Columnas "Seg. IG" y "Seg. TT" con indicador de verificación
   - Filtro "Con redes verificadas IA"
   - Dropdown de ordenamiento por seguidores y métricas
   - Badge de verificación junto a cada cifra de seguidores

3. **CampaignApplicationsPage.jsx** (Aplicaciones de Campaña):
   - Columnas "Seg. IG" y "Seg. TT" en la tabla de aplicantes
   - Filtro local para mostrar solo aplicantes con verificación IA
   - Ordenamiento por seguidores, vistas y rating
   - Headers clickeables para ordenar

**Backend actualizado** (`/app/backend/routes/ugc_admin.py`):
- Nuevo parámetro `has_ai_verified` en endpoint `/creators-report`
- Campos adicionales: `ig_followers`, `tt_followers`, `ig_verified`, `tt_verified`

**Archivos modificados:**
- `/app/frontend/src/components/admin/AdminCreatorsTab.jsx`
- `/app/frontend/src/components/AdminCreatorsReport.jsx`
- `/app/frontend/src/pages/admin/CampaignApplicationsPage.jsx`
- `/app/backend/routes/ugc_admin.py`

---

### Session: 2026-01-30 (Part 1)

#### ✅ UI/UX - Estilización de Página de Precios UGC para Marcas

**Solicitud del usuario**: Aplicar efectos visuales dinámicos a la página de precios de paquetes UGC para marcas (`/ugc/brand/packages`).

**Solución implementada**:

1. **Plan Pro - Efecto Lava Lamp Dorado:**
   - Badge "RECOMENDADO" con gradiente dorado animado
   - Card con fondo de gradiente dorado animado y borde brillante
   - Botón "Elegir Pro" con efecto lava lamp dorado
   - Sombra dinámica que cambia de color (dorado → champagne → bronce)

2. **Plan Enterprise - Efecto Lava Lamp Rosa/Magenta:**
   - Badge "ENTERPRISE" con gradiente rosa/magenta animado
   - Card con fondo de gradiente rosa animado (igual que en TuMarca.jsx)
   - Botón "Solicitar Enterprise" con efecto lava lamp rosa
   - Checkmarks en rosa para destacar features
   - Calculador con acentos en rosa

**Nuevas clases CSS añadidas** (`/app/frontend/src/index.css`):
- `lava-lamp-card-gold` - Fondo animado dorado
- `lava-lamp-badge-gold` - Badge con gradiente dorado
- `lava-lamp-btn-gold` - Botón con gradiente dorado
- `@keyframes lavaLampGoldBorder` - Animación de borde/sombra dorada

**Archivos modificados:**
- `/app/frontend/src/index.css` - Nuevas clases CSS para efecto dorado
- `/app/frontend/src/pages/ugc/PackagePricing.jsx` - Aplicación de estilos a planes Pro y Enterprise

**Testing:** Visual verification via screenshot ✅

---

### Session: 2026-01-28 / 2026-01-29

#### ✅ Feature - Reestructuración de Navegación del Panel de Creadores (P0)

**Problema reportado**: La navegación del panel de creadores era confusa:
- Existían múltiples botones llamados "Campañas" que llevaban a lugares distintos
- Había páginas duplicadas para entregas (Mis Entregas, Workspace, Entregas activas)
- Los botones "Volver" llevaban a páginas en desuso

**Solución implementada**:

**Nuevo Navbar (4 items claros):**
| Antes | Después |
|-------|---------|
| Home | Home |
| Campañas (confuso) | **Explorar** (catálogo de campañas) |
| Entregas (duplicado) | **Mi Trabajo** (unificado) |
| Perfil | Perfil |

**Nueva página unificada "Mi Trabajo"** (`/ugc/creator/my-work`):
- **Tab Postulaciones**: Estado de aplicaciones a campañas
- **Tab Entregas**: Pendientes (con indicador "Necesita tu acción") y Completadas
- **Tab Historial**: Campañas finalizadas

**Dashboard simplificado:**
- Eliminados 4 botones duplicados (Entregas, Campañas, Reportes, Perfil)
- Agregado CTA prominente "Explorar nuevas campañas"

**Archivos modificados:**
- `/app/frontend/src/components/UGCNavbar.jsx` - Nuevos items de navegación
- `/app/frontend/src/pages/ugc/CreatorMyWork.jsx` - Nueva página unificada (CREADO)
- `/app/frontend/src/pages/ugc/CreatorDashboard.jsx` - Simplificado, eliminado navbar duplicado
- `/app/frontend/src/pages/ugc/CampaignsCatalog.jsx` - Agregado UGCNavbar para creadores
- `/app/frontend/src/pages/ugc/DeliverableDetail.jsx` - Botón Volver → /ugc/creator/my-work
- `/app/frontend/src/pages/ugc/MetricsSubmit.jsx` - Botón Volver → /ugc/creator/my-work
- `/app/frontend/src/pages/ugc/CreatorFeedback.jsx` - Botón Volver → /ugc/creator/my-work
- `/app/frontend/src/pages/ugc/CreatorApplications.jsx` - Link actualizado
- `/app/frontend/src/App.js` - Nueva ruta agregada

**Testing:** 100% passed - Frontend navigation verified
**Test Report:** `/app/test_reports/iteration_16.json`

---

#### ✅ Bug Fix - "Body is disturbed or locked" Error in Campaign Applications (P0)

**Problema reportado**: Los creadores no podían aplicar a campañas desde Safari/iOS. Al intentar enviar la aplicación, aparecía el error "Body is disturbed or locked" que bloqueaba completamente el flujo.

**Causa raíz identificada**: El error es específico de Safari/iOS donde el body de una Response (Fetch API) es un stream que solo puede ser leído una vez. El código anterior usaba `res.json()` directamente, lo cual puede causar problemas cuando:
1. La respuesta tiene un error y se intenta leer el body de nuevo
2. El browser Safari tiene limitaciones adicionales en el manejo de streams

**Solución implementada**:
Cambiado el patrón de lectura de respuestas de `res.json()` a `res.text() + JSON.parse()`:

```javascript
// Antes (problemático en Safari/iOS):
const data = await res.json();
if (!res.ok) throw new Error(data.detail);

// Después (seguro para todos los browsers):
const responseText = await res.text();
let data;
try {
  data = JSON.parse(responseText);
} catch (parseErr) {
  throw new Error('Error del servidor');
}
if (!res.ok) throw new Error(data.detail);
```

**Archivos modificados:**
- `/app/frontend/src/pages/ugc/CampaignsCatalog.jsx` - submitApplication() + agregado Authorization header faltante
- `/app/frontend/src/pages/ugc/CampaignDetail.jsx` - submitApplication()
- `/app/frontend/src/pages/ugc/CreatorApplications.jsx` - handleCancelParticipation() y handleWithdrawApplication()
- `/app/frontend/src/pages/ugc/CreatorCampaigns.jsx` - handleCancelParticipation()

**Testing:** 100% passed - Backend 12/12 tests, Frontend all application flows verified
**Test Report:** `/app/test_reports/iteration_15.json`

---

### Session: 2026-01-27 (Evening)

#### ✅ Bug Fix - Email Notifications Not Working

**Problema reportado**: Los emails no llegaban cuando:
1. Se creaba una nueva campaña (ni a la marca ni a los creadores)
2. Se registraba una nueva marca (no se notificaba al admin)

**Causa raíz identificada**:
1. Los archivos `ugc_emails.py` y `email_service.py` no cargaban las variables de entorno (`load_dotenv`), causando que `RESEND_API_KEY` fuera `None`
2. El filtro de creadores era demasiado restrictivo (`is_verified: True`), solo había 1 creador verificado de 44 totales
3. Resend tiene un rate limit de 2 requests/segundo que no se respetaba

**Solución implementada**:
1. **Fix de variables de entorno**: Añadido `load_dotenv` a:
   - `/app/backend/services/ugc_emails.py`
   - `/app/backend/email_service.py`
   
2. **Fix de filtro de creadores**: Cambiado de `{"is_active": True, "is_verified": True}` a `{"is_active": True, "onboarding_completed": True}`. Ahora 30 creadores reciben notificaciones.

3. **Fix de rate limiting**: Añadido delay de 0.6 segundos entre envíos en `send_new_campaign_notification_to_creators()`

4. **Mejora adicional**: Se añadió notificación al admin cuando se crea una campaña, informando cuántos creadores fueron notificados.

**Archivos modificados**:
- `/app/backend/services/ugc_emails.py` - load_dotenv + rate limit delay
- `/app/backend/email_service.py` - load_dotenv
- `/app/backend/routes/ugc_admin.py` - Filtro actualizado + notificación admin

**Testing**: Emails verificados funcionando:
- Email a marca al crear campaña ✅
- Email a creadores al crear campaña ✅
- Email a admin (avenue.ugc@gmail.com) al crear campaña ✅
- Logs confirman envíos exitosos con rate limiting

---

#### ✅ UX Fix - Navigation "Back" Button Issue

**Problema reportado**: Al navegar entre secciones del panel admin y usar el botón "volver", en lugar de regresar a la página anterior, llevaba a páginas incorrectas (ej: al landing principal en vez de la sección previa).

**Causa raíz**: Los botones de "volver" usaban rutas hardcodeadas como `navigate('/admin')` o `<Link to="/admin">` en lugar de usar el historial del navegador con `navigate(-1)`.

**Solución implementada**:
Cambiados los botones de navegación de rutas fijas a `navigate(-1)` en:
- `/app/frontend/src/pages/admin/CampaignApplicationsPage.jsx`
- `/app/frontend/src/pages/admin/AdminDeliverables.jsx`
- `/app/frontend/src/pages/admin/AdminCreatorDeliverables.jsx`
- `/app/frontend/src/pages/admin/AdminTermsManagement.jsx`

**Resultado**: Ahora el botón "Volver" respeta el historial de navegación y lleva al usuario a la página desde donde vino.

---

#### ✅ Feature - Complete Profile Edit Page

**Problema reportado**: La página de edición de perfil del creador (`/ugc/creator/profile`) no mostraba todos los campos del modelo de datos.

**Solución implementada**: Agregados todos los campos faltantes a `CreatorProfileEdit.jsx`:

**Campos agregados:**
1. **Información Personal:**
   - Fecha de Nacimiento (date picker)
   - Género (select)
   - Número de CI (input)
   - País (select)

2. **Información de Contacto:**
   - Código de país (select: +595, +54, +55, etc.)
   - Teléfono / WhatsApp (input numérico)

3. **Información Profesional:**
   - Nivel de Educación (select)
   - Ocupación / Profesión (input)
   - Idiomas que habla (botones seleccionables)

**Archivo modificado**: `/app/frontend/src/pages/ugc/CreatorProfileEdit.jsx`

---

#### ✅ Feature - Redesign Campaign Manager with Traffic Lights

**Problema reportado**: La sección de "Gestión de Campañas" no mostraba información crítica para administrar 100+ campañas eficientemente. Faltaban:
- Postulaciones pendientes por revisar
- Semáforo de entregas de URLs (a tiempo / por vencer / atrasadas)
- Semáforo de entregas de Métricas (separado)
- Filtros avanzados

**Solución implementada**:

**Backend** (`/app/backend/routes/ugc_admin.py`):
- Endpoint mejorado con estadísticas de aplicaciones (total, pendientes, aprobadas)
- Semáforo de URLs: cuenta entregas por estado (on_time, due_soon, late)
- Semáforo de Métricas: separado del de URLs
- Nuevos filtros: búsqueda, estado, marca, has_pending, has_late_deliveries
- Umbral de 3 días para "amarillo/por vencer"

**Frontend** (`/app/frontend/src/components/AdminCampaignManager.jsx`):
- Diseño compacto tipo tabla con filas en grid
- **Toolbar de filtros**: Búsqueda, Estado, Marca, "Con pendientes", "Con atrasos"
- **Resumen rápido**: Total campañas, con pendientes, con atrasos
- **Columnas**: Campaña, Estado, Cupos (barra progreso), Aplicaciones, URLs, Métricas, Acciones
- **Semáforo visual**:
  - 🟢 Verde = a tiempo (>3 días)
  - 🟡 Amarillo = por vencer (≤3 días)
  - 🔴 Rojo = atrasado
- **Indicadores visuales**:
  - Borde izquierdo rojo si hay entregas atrasadas
  - Borde izquierdo naranja si hay aplicaciones pendientes
  - Badge en botón de aplicaciones con count de pendientes
- **Menú de acciones compacto**: ⋮ con dropdown (Editar, Agregar cupos, Transferir, Ocultar)

**Archivo de diseño**: `/app/design_guidelines.json` con especificaciones completas.

---

### Session: 2026-01-27 (Continued)

#### ✅ Completed - Forced Profile Update for Existing Creators

**Problema resuelto**: Los creadores existentes que hicieron onboarding antes del nuevo flujo de 5 pasos no tienen datos críticos (teléfono, documento, fecha nacimiento, género). Necesitamos forzarlos a actualizar su perfil.

**Solución implementada:**

**Backend:**
- Función `check_profile_complete()` que verifica campos críticos (phone, birth_date, document_id, gender)
- Endpoint GET `/api/ugc/creators/me` ahora devuelve `needs_profile_update: true/false`, `profile_complete: true/false`, `missing_fields: []`
- Nuevo endpoint PUT `/api/ugc/creators/me/complete-profile` para actualizar perfiles existentes

**Frontend - Redirección forzosa:**
- CreatorDashboard redirige automáticamente a onboarding si perfil incompleto
- CampaignsCatalog redirige automáticamente a onboarding si perfil incompleto
- Hook `useCreatorProfile` creado para reutilizar lógica de verificación

**Frontend - Mensaje de bienvenida (Step 0):**
- "¡Hola, [Nombre]!"
- "Necesitamos actualizar tu información de contacto"
- "Para brindarte mejor soporte y mejorar tu experiencia en la plataforma, necesitamos algunos datos adicionales:"
  - Número de WhatsApp para que las marcas te contacten
  - Fecha de nacimiento
  - Documento de identidad
- "Tus datos existentes ya están pre-cargados. Solo necesitás completar lo que falta."
- Botón "Actualizar mi perfil"
- "Este proceso toma menos de 2 minutos"

**Frontend - Pre-llenado de datos:**
- Nombre, ciudad, categorías, bio, redes sociales se pre-llenan automáticamente
- Usuario solo completa los campos faltantes

**Archivos modificados:**
- `/app/backend/routes/ugc_creators.py` - check_profile_complete(), /me endpoint, /me/complete-profile endpoint
- `/app/frontend/src/pages/ugc/CreatorOnboarding.jsx` - isProfileUpdate state, step 0, prefillExistingData()
- `/app/frontend/src/pages/ugc/CreatorDashboard.jsx` - redirect logic
- `/app/frontend/src/pages/ugc/CampaignsCatalog.jsx` - redirect logic
- `/app/frontend/src/hooks/useCreatorProfile.js` - NEW hook for profile verification

**Testing:** Backend 10/10 tests passed, Frontend all redirect flows verified
**Test Report:** `/app/test_reports/iteration_14.json`

---

### Session: 2026-01-27

#### ✅ Completed - NEW 5-Step Creator Onboarding Flow (P0)

**Problema resuelto**: El onboarding anterior de creadores solo recolectaba nombre, ciudad y redes sociales. Faltaban datos críticos como teléfono (para WhatsApp), documento de identidad, fecha de nacimiento, país, género, nivel educativo, idiomas, y foto de perfil.

**Solución implementada** - Flujo completo de 5 pasos:

**Paso 1 - Datos Personales:**
- Nombre completo (pre-llenado de cuenta Google)
- Fecha de nacimiento (con validación 18+)
- Género (Femenino, Masculino, Otro, Prefiero no decir)
- Número de documento (CI)

**Paso 2 - Ubicación y Contacto:**
- Selector de país (Paraguay por defecto, 13 países disponibles)
- Selector de ciudad dinámico (cambia según país seleccionado)
- Teléfono separado: código de país + número
- Mensaje: "Las marcas te contactarán por WhatsApp"

**Paso 3 - Perfil Profesional:**
- Categorías de contenido (10 opciones, mínimo 1 requerida)
- Bio (opcional)
- Nivel educativo (opcional)
- Ocupación (opcional)
- Idiomas (multi-select, Español por defecto)
- Portfolio URL (opcional)

**Paso 4 - Redes Sociales:**
- Instagram username
- TikTok username
- Al menos una red requerida
- Verificación con IA (opcional, "3x más chances de ser seleccionados")
- Componente SocialVerification integrado

**Paso 5 - Foto y Confirmación:**
- Upload de foto de perfil (opcional, JPG/PNG/WebP, máx 5MB)
- Fallback a foto de Google si no sube otra
- Resumen completo del perfil
- Checkbox obligatorio de T&C con links

**Backend - Nuevos campos en `ugc_creators` collection:**
```
birth_date, gender, document_id, country, city, 
phone_country_code, phone, phone_full,
education_level, occupation, languages, portfolio_url,
profile_picture (almacenado en GridFS),
terms_accepted, terms_accepted_at, terms_version
```

**Archivos modificados:**
- `/app/backend/models/ugc_models.py` - Nuevos enums (GenderType, EducationLevel), campos expandidos en CreatorProfileCreate
- `/app/backend/routes/ugc_creators.py` - Endpoint onboarding con validación 18+, upload GridFS, T&C
- `/app/frontend/src/pages/ugc/CreatorOnboarding.jsx` - Componente completo de 5 pasos

**Testing:** Backend 20/20 tests passed, Frontend E2E completo
**Test Report:** `/app/test_reports/iteration_13.json`

---

### Session: 2026-01-26 (Part 4)

#### ✅ Completed - Bug Fix: Verificación con IA de Perfiles de Creadores

- **Bug Crítico**: Creadores no podían verificar sus perfiles con IA durante el onboarding
  - **Causa raíz**: El componente `SocialVerification` intentaba guardar la verificación en el backend ANTES de que existiera el perfil de creador (se crea al final del onboarding)
  - **Error**: "Perfil de creador no encontrado" al confirmar verificación
  
- **Solución implementada**:
  1. Nueva prop `saveImmediately` en `SocialVerification.jsx` (default: true)
     - `saveImmediately={true}`: Guarda directamente en backend (para edición de perfil existente)
     - `saveImmediately={false}`: Solo devuelve datos al padre (para onboarding)
  2. `CreatorOnboarding.jsx` ahora usa `saveImmediately={false}`
  3. Los datos de verificación se envían junto con el onboarding
  4. Nuevo modelo `SocialVerificationData` en `/app/backend/models/ugc_models.py`
  5. Endpoint `/api/ugc/creators/onboarding` ahora acepta `social_verification` y procesa los datos
  
- **Archivos modificados**:
  - `/app/frontend/src/components/SocialVerification.jsx` - Nueva prop y lógica condicional
  - `/app/frontend/src/pages/ugc/CreatorOnboarding.jsx` - saveImmediately={false} + envío de datos
  - `/app/backend/models/ugc_models.py` - Nuevo modelo SocialVerificationData
  - `/app/backend/routes/ugc_creators.py` - Procesamiento de verificación en onboarding

### Session: 2026-01-26 (Part 3)

#### ✅ Completed - P1 Features

- **Feature P1-6: Email a Creadores cuando se Lanza Nueva Campaña**
  - Nueva función `send_new_campaign_notification_to_creators()` en `/app/backend/services/ugc_emails.py`
  - Envía email masivo a todos los creadores activos y verificados cuando se crea una campaña
  - Incluye: nombre de campaña, marca, descripción, cupos disponibles, CTA para aplicar
  - También notifica al admin con resumen de envíos exitosos/fallidos
  - Se llama automáticamente al crear campaña en `/app/backend/routes/ugc_admin.py`

- **Feature P1-9: WhatsApp en Listado de Creadores**
  - Agregado ícono de WhatsApp verde en la columna ACCIONES de:
    - Listado de Creadores (`AdminCreatorsTab.jsx`)
    - Aplicaciones de Campaña (`CampaignApplicationsPage.jsx`)
  - Solo aparece si el creador tiene teléfono válido (no "N/A")
  - El link abre WhatsApp Web directamente al número del creador
  - Formato: `https://wa.me/{phone_limpio}`

#### ✅ Verified - Emails Existentes (Ya Funcionaban)
- **Email a avenue.ugc@gmail.com cuando marca completa onboarding** - `send_brand_welcome()` ya implementado
- **Email a marca cuando se crea campaña** - `send_campaign_created_notification()` ya implementado
- **Email a marca cuando se recargan cupos** - `send_brand_notification()` en contract_jobs.py ya implementado

### Session: 2026-01-26 (Part 2)

#### ✅ Completed - Bugs P0 (Onboarding & T&C)

- **Bug P0-1: Brand Onboarding Redirect Fix**
  - **Problema**: Después de login/registro desde `/ugc/brand/onboarding`, usuarios eran redirigidos a landing en vez de continuar onboarding
  - **Solución**: 
    - Agregado `handleLoginClick()` que guarda `redirect_after_login` en sessionStorage antes de abrir modal
    - `checkAuth()` ahora usa solo token de localStorage (sin cookies CORS)
  - **Archivos**: `/app/frontend/src/pages/ugc/BrandOnboarding.jsx`

- **Bug P0-2: Creator Onboarding Redirect Fix**
  - **Problema**: Mismo issue que Brand
  - **Solución**: Verificado que ya funcionaba con sessionStorage + navegación a `/?login=creator`
  - **Archivos**: `/app/frontend/src/pages/ugc/CreatorOnboarding.jsx`

- **Bug P0-3: Mensaje "Ya Estás Registrado"**
  - **Problema**: Usuarios con perfil existente podían ver el formulario de onboarding de nuevo
  - **Solución**:
    - Nuevo estado `alreadyRegistered` en ambos onboardings
    - Si usuario ya tiene perfil de marca/creador, muestra pantalla con:
      - Ícono de check verde
      - Mensaje "¡Ya estás registrado!"
      - Botón para ir al dashboard
      - Botón secundario para ver info
  - **Archivos**: 
    - `/app/frontend/src/pages/ugc/BrandOnboarding.jsx` (líneas 260-305)
    - `/app/frontend/src/pages/ugc/CreatorOnboarding.jsx` (líneas 167-214)

- **Bug P0-4: Checkbox T&C con Google OAuth**
  - **Problema**: Usuarios que se registran con Google no aceptaban T&C
  - **Solución**:
    - Backend `google_callback` ahora devuelve `needs_terms_acceptance: true` para usuarios nuevos
    - `AuthCallback` muestra modal de aceptación de términos antes de completar auth
    - Modal tiene checkbox obligatorio con enlaces a T&C y política de privacidad
  - **Archivos**:
    - `/app/backend/server.py` (líneas 1145-1182)
    - `/app/frontend/src/components/AuthForms.jsx` (líneas 646-721)

- **Testing**: 100% passed (11/11 backend tests, all frontend flows verified)
- **Test Report**: `/app/test_reports/iteration_12.json`

### Session: 2026-01-26 (Part 1)

#### ✅ Completed
- **Feature P0: Sistema de Gestión de Términos y Condiciones**
  - **Nueva página Admin**: `/admin/terms` para gestionar documentos legales
  - **Backend completo** (`/app/backend/routes/terms.py`):
    - `GET /api/terms/documents` - Lista de documentos T&C predefinidos
    - `POST /api/terms/accept` - Registrar aceptación de un usuario
    - `GET /api/terms/my-acceptances` - Ver aceptaciones del usuario actual
    - `GET /api/terms/admin/documents` - Lista con estadísticas (Admin)
    - `GET /api/terms/admin/acceptances` - Historial de aceptaciones (Admin)
    - `GET /api/terms/admin/acceptances/export` - Exportar a CSV (Admin)
    - `GET /api/terms/admin/users-summary` - Resumen por usuario (Admin)
  - **Documentos T&C predefinidos**:
    - Términos y Condiciones - Creadores UGC
    - Términos y Condiciones - Marcas UGC
    - Términos y Condiciones - E-commerce
    - Términos y Condiciones - Reservas de Studio
    - Política de Privacidad
  - **Frontend** (`/app/frontend/src/pages/admin/AdminTermsManagement.jsx`):
    - Tab "Documentos": Lista de todos los documentos con conteo de aceptaciones
    - Tab "Aceptaciones": Historial detallado con filtros
    - Tab "Por Usuario": Vista agrupada por usuario con todos sus términos aceptados
    - Exportar a CSV individual o global
    - Diseño consistente con el tema dark de la aplicación
  - **Enlace desde Admin Dashboard**: Configuración → Términos y Condiciones
  - **Modelo de datos**:
    - Collection `terms_acceptances`: user_id, terms_slug, terms_version, accepted_at, ip_address, user_agent
  - Files created:
    - `/app/backend/routes/terms.py`
    - `/app/frontend/src/pages/admin/AdminTermsManagement.jsx`
  - Files modified:
    - `/app/backend/server.py` - Registro del router
    - `/app/frontend/src/App.js` - Nueva ruta protegida
    - `/app/frontend/src/components/AdminDashboard.jsx` - Enlace en subtabs

- **Bug Fix P1: Protected Routes Loading State**
  - **Problema**: Las rutas admin (`/admin/terms`, `/admin/creators/:id/deliverables`, etc.) redirigían a `/login` antes de verificar el token guardado
  - **Causa**: El hook `useAuth` tiene un estado `loading=true` durante la verificación inicial, pero las rutas no lo esperaban
  - **Solución**: Nuevo componente `ProtectedAdminRoute` que:
    - Muestra spinner mientras `loading=true`
    - Verifica rol de admin cuando `loading=false`
    - Muestra mensaje de acceso restringido si no es admin
  - **Rutas actualizadas**:
    - `/admin` (AdminDashboard)
    - `/admin/terms` (AdminTermsManagement)
    - `/admin/campaigns/:id/applications` (CampaignApplicationsPage)
    - `/admin/ugc/deliverables/:id` (AdminDeliverables)
    - `/admin/creators/:id/deliverables` (AdminCreatorDeliverables)
  - Files modified:
    - `/app/frontend/src/App.js` - Nuevo componente ProtectedAdminRoute

- **Feature P1: Checkbox de Aceptación de T&C en Registro de Usuario**
  - **Problema**: Los usuarios podían registrarse sin aceptar los términos y condiciones
  - **Solución**: 
    - Agregado checkbox obligatorio en el formulario de registro (`AuthForms.jsx`)
    - El botón "CREAR CUENTA" está deshabilitado hasta que se marque el checkbox
    - Al registrarse, se guardan automáticamente las aceptaciones de:
      - `privacy-policy` v1.0
      - `terms-ecommerce` v1.0
  - Files modified:
    - `/app/frontend/src/components/AuthForms.jsx` - Nuevo campo `acceptTerms` y UI del checkbox
    - `/app/backend/server.py` - Modelo `UserCreate` actualizado, lógica de registro guarda aceptaciones

- **Feature P1: Checkbox de Aceptación de T&C en Onboarding de Marcas**
  - **Problema**: Las marcas podían completar el onboarding sin aceptar los términos específicos de UGC
  - **Solución**:
    - Agregado checkbox obligatorio en el Step 3 del `BrandOnboarding.jsx`
    - El botón "Completar registro" está deshabilitado hasta que se marque el checkbox
    - Al completar, se guarda la aceptación de `terms-ugc-brand` v1.0
  - Files modified:
    - `/app/frontend/src/pages/ugc/BrandOnboarding.jsx` - Nuevo campo `acceptTerms` y UI del checkbox

### Session: 2026-01-25 (Continued - Part 2)

#### ✅ Completed
- **Feature: Página de Entregas por Creador (Admin)**
  - Nueva página `/admin/creators/:creatorId/deliverables` para ver todas las entregas de un creador específico
  - Muestra info del creador (nombre, redes sociales, nivel)
  - Stats cards: Total Activas, Pendientes, Completadas, Con Cambios, Canceladas
  - Filtros por estado con checkbox para incluir/excluir cancelados
  - Vista detallada de cada entrega con:
    - Nombre de campaña y marca
    - Status de URL (7 días) y Métricas (14 días)
    - Links directos a publicaciones
    - Calificación de la marca si existe
  - Botón "Ver Entregas" (ícono dorado) agregado en el listado de Creators del Admin
  - Backend endpoints:
    - `GET /api/ugc/admin/creators/{creatorId}` - Detalle del creador
    - `GET /api/ugc/admin/creators/{creatorId}/deliverables` - Entregas del creador
  - Files created:
    - `/app/frontend/src/pages/admin/AdminCreatorDeliverables.jsx`
  - Files modified:
    - `/app/backend/routes/ugc_admin.py` - Nuevos endpoints
    - `/app/frontend/src/App.js` - Nueva ruta
    - `/app/frontend/src/components/admin/AdminCreatorsTab.jsx` - Botón "Ver Entregas"

- **Feature: Eliminación de Sección Redundante**
  - Eliminada la pestaña "Entregas" del panel Admin (era redundante con la vista por campaña)
  - Limpieza de código: eliminados estado `deliverables`, función `fetchDeliverables`, import `FileCheck`
  - Files modified:
    - `/app/frontend/src/components/UGCAdminPanel.jsx`

- **Mejora: Filtrado de Cancelados en Revisión de Entregas**
  - Cancelados se excluyen por defecto de los filtros
  - Checkbox "Incluir cancelados" para verlos opcionalmente
  - Nueva pestaña "Canceladas" (solo visible si hay)
  - Conteo de retraso se congela al momento de la cancelación
  - Files modified:
    - `/app/frontend/src/pages/admin/AdminDeliverables.jsx`
    - `/app/frontend/src/pages/ugc/BrandDeliverables.jsx`

### Session: 2026-01-25 (Continued)

#### ✅ Completed
- **Feature P1: Exportar Lista de Creadores a CSV**
  - **Endpoint**: `GET /api/ugc/admin/creators/export`
  - **Funcionalidad**: Exporta todos los creadores con filtros opcionales (nivel, activo/inactivo)
  - **Campos exportados**: Nombre, Email, Teléfono, Ciudad, Nivel, Verificado, Activo, Instagram, IG Seguidores, IG Verificado, TikTok, TT Seguidores, TT Verificado, Campañas Participadas, Rating Promedio, Total Reviews, Fecha Registro
  - **Frontend**: Botón "Exportar CSV" agregado en AdminCreatorsTab.jsx
  - Files modified:
    - `/app/backend/routes/ugc_admin.py` - Nuevo endpoint de exportación
    - `/app/frontend/src/components/admin/AdminCreatorsTab.jsx` - Botón exportar
  - Test report: `/app/test_reports/iteration_11.json` (7/7 tests passed)

- **Feature P1: Notificación "Solicitar Corrección" (Email + In-App)**
  - Cuando una marca solicita cambios en un deliverable, el creador ahora recibe:
    - Email (ya existía via `send_changes_requested`)
    - **NUEVA** Notificación in-app visible en la campanita
  - Files modified:
    - `/app/backend/routes/ugc_deliverables.py` - Integración de notificaciones in-app
    - `/app/backend/routes/notifications.py` - Helper `notify_changes_requested`

- **Feature P2: Sistema de Notificaciones In-App**
  - **Backend completo**:
    - `GET /api/notifications/me` - Obtener notificaciones del usuario
    - `GET /api/notifications/unread-count` - Conteo de no leídas
    - `POST /api/notifications/mark-read` - Marcar específicas como leídas
    - `POST /api/notifications/mark-all-read` - Marcar todas como leídas
    - `DELETE /api/notifications/{id}` - Eliminar notificación
  - **Tipos de notificaciones soportadas**:
    - Aplicación aprobada/rechazada
    - Deliverable aprobado/cambios solicitados
    - Métricas enviadas
    - Nueva calificación recibida
    - Subida de nivel
    - Recordatorios de deadline
  - **Frontend**:
    - Nuevo componente `NotificationBell.jsx` con dropdown
    - Integrado en `UGCNavbar.jsx` para creadores y marcas
    - Polling automático cada 30 segundos
    - Iconos y colores por tipo de notificación
    - Acciones: marcar como leída, eliminar, navegar al recurso
  - Files created:
    - `/app/backend/routes/notifications.py`
    - `/app/frontend/src/components/NotificationBell.jsx`
  - Files modified:
    - `/app/backend/models/ugc_models.py` - Enum NotificationType
    - `/app/backend/server.py` - Registro del router
    - `/app/frontend/src/components/UGCNavbar.jsx` - Integración del bell
  - Test report: `/app/test_reports/iteration_11.json` (9/9 tests passed)

- **Bug Fix: TikTok Metrics Lost on Multi-Platform Submission (P0 - CRITICAL)**
  - **Problem**: When a creator submitted metrics for both Instagram and TikTok simultaneously, the TikTok metrics were lost because the system created ONE record with `platform='multi'` instead of TWO separate records.
  - **Root Cause**: In `ugc_metrics.py` lines 878-881, when both platforms had screenshots, the code set `platform = "multi"` and created a single merged record.
  - **Solution implemented**:
    - Refactored the `POST /api/ugc/metrics/submit-v2/{deliverable_id}` endpoint
    - Now separates extractions by platform before processing
    - Creates individual database records for each platform (`platform='instagram'` and `platform='tiktok'`)
    - Each record has its own AI extraction, demographics, and metrics
    - Updated validation to check for existing metrics per platform (not just by deliverable_id)
    - This allows submitting metrics for one platform first, then the other later
  - **New response fields** (backward compatible):
    - `metrics_ids`: Array of all created metric IDs
    - `platforms_created`: Array of platforms recorded
  - Files modified:
    - `/app/backend/routes/ugc_metrics.py` - Complete refactor of submit-v2 endpoint
  - Test report: `/app/test_reports/iteration_10.json` (Backend: 100%)
  - Test evidence: Deliverable `d821fa59` has 2 separate metric records (Instagram + TikTok)

---

### Session: 2026-01-24 (Continued)

#### ✅ Completed
- **Feature: Professional Demographics Charts Redesign (P0)**
  - Complete redesign of demographic charts in brand campaign reports page
  - Issue: Charts were showing zeros and had basic design
  - Solution: Implemented custom SVG-based chart components with professional styling
  - New chart components:
    - **DonutChart**: Gender distribution with animated segments
    - **CircularProgress**: Individual percentage indicators with stroke animation
    - **HorizontalBarChart**: Age range distribution with gradient bars
  - Charts implemented:
    - **Gender Distribution**: Donut chart + 3 circular progress indicators (Female, Male, Other)
    - **Age Distribution**: Horizontal bar chart with golden gradient for each age range
    - **Geographic Distribution**: 5 circular progress charts for top countries
  - Visual improvements:
    - Gradient backgrounds with glassmorphism effect
    - Color-coded indicators (Pink for female, Blue for male, Purple for other)
    - Animated transitions (1s ease-out)
    - Clear legends and labels in Spanish
    - Professional typography and spacing
  - Backend: No changes needed - existing demographics aggregation logic was correct
  - Files modified:
    - `/app/frontend/src/pages/ugc/BrandCampaignReports.jsx` - New chart components
  - Test report: `/app/test_reports/iteration_9.json` (Backend: 100%, Frontend: 100%)
  - Test file created: `/app/backend/tests/test_brand_campaign_reports.py` (20 tests)

- **UX Improvement: Redesigned "Mis Entregas" Section (P1)**
  - User request: Simplify deliverables view, remove confusing "En Revisión" status
  - Changes implemented:
    - **New filter tabs**: Pendientes → Completadas → Rechazadas → Canceladas (in order of priority)
    - **Removed "En Revisión"**: Combined with Pendientes since it's still active work
    - **New stats cards**: Pendientes, Completados, Rechazados, Feedback
    - **Default filter**: "Pendientes" (most important for creators)
    - **Improved empty states**: "No tenés entregas pendientes - ¡Genial! Estás al día"
    - **New status categories**:
      - Pendientes: awaiting_publish, changes_requested, published, submitted, resubmitted, metrics_pending
      - Completadas: approved, completed, metrics_submitted
      - Rechazadas: rejected, cancelled_by_admin
      - Canceladas: withdrawn
  - Files modified:
    - `/app/frontend/src/pages/ugc/CreatorWorkspace.jsx` - Main deliverables page
    - `/app/frontend/src/pages/ugc/CreatorCampaigns.jsx` - Unified campaigns page

- **UX Improvement: Redesigned Brand "Revisión de Entregas" Section (P1)**
  - User request: Fix incorrect tabs, deadline calculation, and add separate URL/Metrics status
  - Changes implemented:
    - **New filter tabs (in priority order)**: Calificar → Completadas → Pendiente de Entrega
    - **"Calificar"**: Deliverables with both URL and metrics submitted, but not yet rated
    - **"Completadas"**: Deliverables that have been rated
    - **"Pendiente de Entrega"**: Deliverables missing URL or metrics
    - **Fixed deadline calculation**:
      - URL deadline: 7 days from confirmation date
      - Metrics deadline: 14 days from confirmation date
    - **Color-coded deadline status**:
      - Green: 5+ days remaining
      - Yellow: 3-5 days remaining  
      - Orange: 1-3 days remaining
      - Red: Vence hoy/mañana or "X días de retraso"
    - **Separate status cards for URL and Metrics**:
      - Shows "Entregado" if completed
      - Shows "X días restantes" with deadline date if pending
      - Shows "X días de retraso" if late
    - **Confirmation date visible**: "Confirmado: DD-MMM"
  - Files modified:
    - `/app/frontend/src/pages/ugc/BrandDeliverables.jsx` - Complete rewrite

- **Feature: Platform-Specific Metrics & URL Submission (P1)**
  - User request: Only show upload fields for platforms that have URLs submitted
  - Changes implemented:
    - **MetricsSubmit.jsx**:
      - Only shows Instagram screenshot upload if deliverable has `instagram_url`
      - Only shows TikTok screenshot upload if deliverable has `tiktok_url`
      - Shows disabled state with message "No subiste URL de X para esta entrega" if no URL
      - Header only shows counter icons for platforms with URLs
      - Validation only requires screenshots for platforms that have URLs
    - **DeliverableDetail.jsx**:
      - Allows adding URLs independently (submit Instagram today, TikTok tomorrow)
      - Shows "URL registrada" for already submitted platforms
      - Shows input field only for platforms without URL
      - Can access the form even after publishing to add the other platform's URL
      - "Agregar URL" button when adding second platform
  - Test scenarios covered:
    - Instagram-only: Only shows Instagram upload field
    - TikTok-only: Only shows TikTok upload field, Instagram disabled
    - Both URLs: Both fields available
  - Files modified:
    - `/app/frontend/src/pages/ugc/MetricsSubmit.jsx`
    - `/app/frontend/src/pages/ugc/DeliverableDetail.jsx`

- **Feature: Smart URL Validation System with Friendly Error Messages (P1)**
  - User request: Prevent users from submitting wrong URLs with helpful guidance
  - **Validations implemented:**
    - **Wrong platform detection**: TikTok URL in Instagram field or vice versa
    - **Profile vs Post detection**: Warns when user submits profile URL instead of post URL
    - **Story URL detection**: Warns that Instagram Stories are temporary and can't be used
    - **Invalid format detection**: Catches malformed or unrecognized URLs
    - **Domain validation**: Ensures URLs are from instagram.com or tiktok.com only
  - **Valid URL patterns:**
    - Instagram: `/p/`, `/reel/`, `/tv/` paths
    - TikTok: `/@user/video/` path or short links (vm.tiktok.com)
  - **User-friendly error messages include:**
    - Clear title explaining the error
    - Detailed message about what went wrong
    - Step-by-step instructions on how to fix it
    - Example of correct URL format
  - **Visual feedback:**
    - Real-time validation as user types
    - Green border + checkmark when URL is valid
    - Red border + X icon when URL has error
    - Error panel with helpful instructions
    - Submit button disabled until errors are fixed
  - Files modified:
    - `/app/frontend/src/pages/ugc/DeliverableDetail.jsx` - Complete validation system

- **Feature: Admin Deliverables Management Page (P1)**
  - User request: Admin page to manage deliverables across all brands with special actions
  - **New page created:** `/admin/ugc/deliverables/:campaignId`
  - **Features:**
    - View all deliverables for any campaign (not just Avenue's)
    - Shows brand name for each campaign
    - Filter by: All, Pending, To Rate, Completed, Issues (URLs with problems)
    - Detects potentially incorrect URLs (profile links instead of posts)
    - **Admin Actions:**
      - **Edit URLs**: Directly edit Instagram/TikTok URLs to fix incorrect submissions
      - **Reset Delivery**: Reset URLs and/or metrics so creator can re-submit
    - Display delivery status for URL and Metrics separately with color coding
  - **Backend endpoints created:**
    - `POST /api/ugc/admin/deliverables/{id}/update-urls` - Edit URLs directly
    - `POST /api/ugc/admin/deliverables/{id}/reset` - Reset delivery (URLs, metrics, or both)
  - **Access:** From Admin Panel → UGC Platform → Gestión Campañas → Icon button on each campaign
  - Files created/modified:
    - `/app/frontend/src/pages/admin/AdminDeliverables.jsx` (NEW)
    - `/app/frontend/src/components/AdminCampaignManager.jsx` - Added button
    - `/app/frontend/src/App.js` - Added route
    - `/app/backend/routes/ugc_admin.py` - Added endpoints

### Session: 2026-01-24

#### ✅ Completed
- **Bug Fix: AI Social Verification "Body is disturbed or locked" Error (P0)**
  - Fixed critical bug where users could not verify their social media profiles
  - Root cause: Response body stream was being consumed before it could be read properly in some browser environments
  - Solution implemented:
    - Clone response before reading to prevent ReadableStream lock errors
    - Added multiple fallback approaches for response parsing
    - Improved error handling in FileReader for image uploads
    - Status code-based error messages when parsing fails
    - User-friendly error messages in Spanish instead of technical errors
  - Files modified:
    - `/app/frontend/src/components/SocialVerification.jsx` - Complete rewrite of `handleAnalyze` and `handleConfirm` functions
  - Test report: `/app/test_reports/iteration_8.json` (Frontend: 100%, Backend: 100%)

- **Feature: New Multi-Image Metrics Upload System (P0)**
  - Complete redesign of metrics submission interface
  - New features:
    - **Two separate upload sections**: Instagram and TikTok
    - **Multiple images per platform**: Up to 10 screenshots each
    - **Unified data extraction**: AI extracts BOTH metrics AND demographics from all images
    - **Image previews**: Grid view with numbered thumbnails and delete buttons
    - **Smart merging**: AI combines data from multiple screenshots, keeping highest confidence values
    - **Real-time counters**: Header shows number of images uploaded per platform
    - **Parallel processing**: All images processed simultaneously for faster response
  - Files modified:
    - `/app/frontend/src/pages/ugc/MetricsSubmit.jsx` - Complete redesign
    - `/app/backend/routes/ugc_metrics.py` - New endpoint `POST /api/ugc/metrics/submit-v2/{deliverable_id}`
  - New backend functions:
    - `extract_metrics_from_base64()` - Extract all data from single base64 image
    - `merge_extracted_data()` - Intelligently merge data from multiple extractions
  - Data extracted: Views, Reach, Likes, Comments, Shares, Saves, Watch Time, Video Duration, Retention Rate, Gender %, Countries, Cities, Age Ranges

- **Feature: Simplified Creator Panel UX (P0)**
  - Merged 5 sections into 3 unified sections:
    - **Home**: Dashboard with summary and quick access
    - **Campañas**: Combined Available Campaigns + My Applications + My Deliverables (with tabs)
    - **Perfil**: Profile editing + link to Reports
  - Files created:
    - `/app/frontend/src/pages/ugc/CreatorCampaigns.jsx` - Unified campaigns page with 3 tabs
  - Files modified:
    - `/app/frontend/src/components/UGCNavbar.jsx` - Simplified navigation (5 links → 3)
    - `/app/frontend/src/App.js` - Added new routes

- **Feature: Creator Reports Page (P0)**
  - New "Mis Reportes" page for creators to view their performance metrics
  - Sections:
    - **Stats Overview**: Level, Rating, On-time delivery rate, Completed campaigns
    - **Aggregated Metrics**: Total views, reach, likes, comments, shares, avg engagement
    - **Metrics History**: Expandable list with demographics data
    - **Brand Reviews**: List of reviews from brands
  - Time range filter: All time, 30 days, 90 days, This year
  - Files created:
    - `/app/frontend/src/pages/ugc/CreatorReports.jsx` - New reports page
  - Files modified:
    - `/app/backend/routes/ugc_metrics.py` - Added `GET /api/ugc/metrics/me` endpoint
    - `/app/frontend/src/pages/ugc/CreatorProfileEdit.jsx` - Added link to reports

---

### Session: 2026-01-23

#### ✅ Completed
- **Persistent Image Storage with MongoDB GridFS (CRITICAL)**
  - Implemented MongoDB GridFS for persistent image storage
  - Images now stored in MongoDB, surviving deployments and pod restarts
  - Created service: `/app/backend/services/gridfs_storage.py`
  - New endpoints:
    - `POST /api/upload` - Upload images to GridFS
    - `GET /api/images/{file_id}` - Serve images from GridFS
    - `DELETE /api/images/{file_id}` - Delete images (admin only)
    - `GET /api/storage/stats` - Storage statistics
    - `GET /api/shop/images/gridfs/{file_id}` - Product images from GridFS
  - Migration script: `/app/backend/scripts/migrate_to_gridfs.py`
  - Migrated 19 existing images (17 product images, 2 general uploads)
  - Legacy URLs (`/api/uploads/*`, `/api/shop/images/*`) continue to work
  - **Buckets**: `images` (general), `product_images` (e-commerce)

- **Deployment Health Check Fix**
  - Added `/health` endpoint to server.py for Kubernetes probes
  - Fixed `.env` SENDER_EMAIL formatting issue

- **DeliverableDetail Page Redesign (P1)**
  - Complete redesign of creator's deliverable submission page
  - Separated URL submission flow for Instagram and TikTok
  - Visual improvements:
    - Sticky header with back button and status badge
    - Clean campaign card with brand info
    - Separate input cards for Instagram and TikTok with platform icons
    - Green checkmarks when valid URLs are entered
    - Tip message encouraging posting on both platforms
    - Success message "¡Excelente! Contenido en ambas plataformas" when both URLs entered
  - URL validation (must contain instagram.com or tiktok.com)
  - Submit button disabled until at least one valid URL entered
  - Responsive mobile-first design
  - Files modified:
    - `/app/frontend/src/pages/ugc/DeliverableDetail.jsx` - Complete redesign
  - Test report: `/app/test_reports/iteration_7.json` (Frontend: 100%, Backend: 71%)

- **Login Redirect Flow Fix (P0)**
  - Fixed race condition between useEffect and Google OAuth callback
  - The redirect parameter from email links now works correctly
  - Flow: Save redirect to sessionStorage → Login → Read and navigate to saved path
  - OAuth callback now extracts redirect path BEFORE calling login() to avoid race condition
  - Added check to skip redirect useEffect during OAuth callback
  - Files modified:
    - `/app/frontend/src/App.js` - Fixed useEffect and OAuth callback (lines 425-460)

---

### Session: 2026-01-22

#### ✅ Completed
- **Enhanced "View Applicants" Screen (P0)**
  - Redesigned applicant cards in AdminCampaignManager with rich creator data
  - New information displayed per applicant:
    - **Social Accounts**: Instagram/TikTok links with username, follower count, verification badge
    - **Level Badge**: Rookie (gray), Rising (blue), Pro (purple) with color coding
    - **Location**: Creator's city with map pin icon
    - **Stats Grid (4 columns)**: Rating, Campaigns Participated, Avg Views, Avg Interactions
    - **Motivation Quote**: Styled in dedicated card
  - Backend endpoint `/api/ugc/admin/campaigns/{campaign_id}/applications` enriched with:
    - `verified_instagram`, `verified_tiktok` (from social_accounts)
    - `campaigns_participated` (count of confirmed/completed campaigns)
    - `avg_views`, `avg_reach`, `avg_interactions` (from ugc_metrics)
    - `avg_rating`, `total_reviews` (from ugc_ratings)
  - Social links open in new tabs with proper `target="_blank"` and `rel="noopener noreferrer"`
  - Added `data-testid` attributes for testing
  - Files modified:
    - `/app/frontend/src/components/AdminCampaignManager.jsx` - Redesigned applicant cards (lines 1313-1565)
    - `/app/backend/routes/ugc_admin.py` - Enhanced applications endpoint (lines 357-439)
  - Test report: `/app/test_reports/iteration_5.json` (Backend: 82%, Frontend: 100%)

- **Enhanced Admin Creators Tab (P0)**
  - Completely redesigned creator cards with enriched data
  - New information displayed per creator:
    - **Clickable Social Links**: Instagram/TikTok @usernames that open in new tab
    - **Follower Counts**: Displayed next to each social account
    - **Verification Badges**: Green badge for AI-verified accounts
    - **Level Badge**: Rookie (gray), Trusted (blue), Pro (purple), Elite (yellow)
    - **Stats Grid (5 columns)**: Rating, Campaigns, Avg Views, Avg Reach, Avg Interactions
  - New action buttons:
    - **Ver Métricas Completas**: Opens modal with full metrics history
    - **Ver Reviews**: Opens modal with all reviews and brand names
  - New backend endpoint: `GET /api/ugc/admin/creators/{id}/reviews`
  - Backend endpoint `GET /api/ugc/admin/creators` now returns enriched data
  - Files modified:
    - `/app/frontend/src/components/admin/AdminCreatorsTab.jsx` - Complete redesign
    - `/app/backend/routes/ugc_admin.py` - Enriched creators endpoint + reviews endpoint
  - Test report: `/app/test_reports/iteration_6.json` (Backend: 58%, Frontend: 100%)

---

### Session: 2026-01-17

#### ✅ Completed
- **Página de Inversores (P0)**
  - Creada página privada de presentación para inversores
  - Accesible solo para roles `admin` y `superadmin`
  - Ruta: `/admin/investors`
  - Secciones incluidas:
    - Hero con métricas clave (GMV, Creadores, Marcas, Campañas, Reservas, Crecimiento)
    - "Nuestra Historia" con timeline de evolución (2021-2024)
    - "La Plataforma" - descripción de E-commerce, Studio y UGC
    - "Oportunidad de Mercado" - Paraguay como mercado emergente
    - "Ventaja Competitiva" - First Mover, Ecosistema Integrado, etc.
    - "Modelo de Ingresos" - distribución porcentual por servicio
    - "Visión a 3 Años" - roadmap de expansión regional
  - Quick Action "Pitch Inversores" agregado al AdminDashboard
  - Archivos creados/modificados:
    - `/app/frontend/src/pages/InvestorPage.jsx` - Nueva página completa
    - `/app/frontend/src/App.js` - Import y ruta protegida
    - `/app/frontend/src/components/AdminDashboard.jsx` - Quick action button

---

### Session: 2026-01-16

#### ✅ Completed
- **Sistema de Emails Completo - Configuración y Funcionalidades**
  - Corregido SENDER_EMAIL de `onboarding@resend.dev` a `creadoresUGC@avenue.com.py`
  - Unificado todos los senders en el sistema:
    - `creadoresUGC@avenue.com.py` → Emails a creadores UGC
    - `infobrands@avenue.com.py` → Emails a marcas UGC
    - `reservas@avenue.com.py` → Emails de estudio
    - `pedidos@avenue.com.py` → Emails de ecommerce
  - Implementadas todas las funciones de email faltantes:
    - **Creadores:** welcome, application_submitted, confirmed, rejected, content_submitted, metrics_submitted, rated, level_up
    - **Marcas:** welcome, campaign_enabled, slots_recharged, new_application, creator_confirmed, content_submitted, metrics_submitted, plan_selected
  - Agregadas notificaciones automáticas a Avenue (avenuepy@gmail.com) en todas las instancias requeridas
  - Actualizado `email_service.py` para enviar cancelación de reservas también al admin
  - Archivos modificados:
    - `/app/backend/.env` - Corregido SENDER_EMAIL
    - `/app/backend/services/ugc_emails.py` - Reescrito completo con todas las funciones
    - `/app/backend/routes/ugc_applications.py` - Integrado envío de emails en aplicaciones
    - `/app/backend/routes/ugc_admin.py` - Agregado email a marca cuando admin confirma
    - `/app/backend/routes/ugc_deliverables.py` - Emails de contenido entregado
    - `/app/backend/routes/ugc_metrics.py` - Emails de métricas entregadas
    - `/app/backend/routes/ugc_creators.py` - Email de bienvenida a creadores
    - `/app/backend/routes/ugc_brands.py` - Email de bienvenida a marcas
    - `/app/backend/email_service.py` - Email de cancelación de estudio al admin

---

### Session: 2026-01-15

#### ✅ Completed
- **Application Cancellation Feature (P0)**
  - Admin can cancel confirmed applications via admin panel
  - Creator can cancel their own confirmed applications via new CreatorApplications page
  - Both actions update application status to 'cancelled'
  - Campaign slots_filled is decremented to free up slots
  - Deliverables are marked as cancelled
  - WhatsApp notifications sent to admin
  - Files modified:
    - `/app/backend/routes/ugc_applications.py` - Added POST `/{id}/withdraw` endpoint for creators
    - `/app/backend/routes/ugc_admin.py` - Updated PUT `/admin/applications/{id}/status` for cancellation
    - `/app/backend/services/ugc_emails.py` - Added `notify_application_cancelled` function
    - `/app/frontend/src/pages/ugc/CreatorApplications.jsx` - New page for creators to manage applications
    - `/app/frontend/src/components/AdminCampaignManager.jsx` - Added cancel button for confirmed applications
    - `/app/frontend/src/pages/ugc/CreatorDashboard.jsx` - Added link to CreatorApplications page
    - `/app/frontend/src/App.js` - Added route for CreatorApplications
  - Test report: `/app/test_reports/iteration_4.json` (12/12 tests passed)

---

### Session: 2026-01-14

#### ✅ Completed
- **UI Fix: Texto blanco en formulario "Crear Campaña"**
  - Corregido `AdminCampaignManager.jsx`
  - Campos de Canje, Fechas y Notas con texto blanco
  - Verificado con screenshots

- **Bug Fix: Botones Panel Creadores/Marcas no aparecen en producción**
  - Problema: `useAuth.js` y `App.js` usaban `process.env.REACT_APP_BACKEND_URL` que apunta al preview
  - Solución: Creado `/utils/api.js` con `getApiUrl()` que usa `window.location.origin` en producción
  - Archivos modificados: `useAuth.js`, `App.js`, nuevo `utils/api.js`
  - Fix aplica para TODOS los usuarios, no solo admin

---

### Session: 2026-01-12

#### ✅ Completed
- **Bug Fix P0: Email Notifications for Studio Bookings**
  - Verificado y funcionando
  - Emails enviados al crear solicitud (pending)
  - Emails enviados al confirmar reservación
  - Templates: `booking_request_received_email`, `admin_booking_request_email`
  - Función principal: `send_booking_request_notification()`

- **`/ugc/marcas` Page Refinement**
  - Pricing con features diferenciadas por plan
  - Modelo de pricing escalonado

- **`/tu-marca` Page Overhaul**
  - Rediseño completo con estrategia de agencia
  - Toggle dinámico Exhibidores/Percheros
  - Precios por tipo de producto

- **Admin Panel "Command Center" Redesign**
  - Nuevo diseño modular
  - Dashboard con KPIs
  - Tema oscuro consistente
  - Navegación por módulos

- **"Back" Button Bug Fix**
  - Fallback routes en 5 componentes

- **UGC Creator Page Enhancement**
  - Sección "Campañas Activas" dinámica
  - Seeding de datos de campañas

---

## Pending Issues

### P0 - Critical (Blocking)
- [x] ~~**Creator Onboarding Missing Data**~~ - COMPLETED: New 5-step onboarding now collects phone, birth_date, document_id, country, gender, education_level, languages, profile_picture
- [x] ~~**Forced Profile Update for Existing Creators**~~ - COMPLETED: Dashboard/Catalog redirect to onboarding, welcome message shown, data pre-filled
- [ ] **Image Mis-assignment Bug** - Intermittent bug where product images get assigned to wrong products (USER VERIFICATION PENDING)

### P1 - High Priority
- [ ] **T&C Versioning & Forced Acceptance** - Create system where updating T&C triggers mandatory acceptance banner for existing users
- [ ] **Missing Email Notifications** - Several triggers need E2E testing:
  - Email to avenue.ugc@gmail.com when brand completes onboarding
  - Email to brand when new campaign created
  - Email to brand when slots recharged

### P2 - Medium Priority  
- [ ] **Mobile-First UGC Panels** - Apply mobile-first design to other UGC admin/creator pages
- [ ] **Image Upload in Create Campaign** - Integrate cover image upload
- [ ] **Creator Reports** - Metrics and reports for creators

### P3 - Low Priority / Backlog
- [ ] **Progressive Creator Onboarding** - Unificar con login modal
- [ ] **Studio Guest Checkout** - Checkout sin cuenta
- [ ] **Cloudinary Integration** - Almacenamiento de imágenes externo para ecommerce (4000+ fotos). Actualmente las imágenes se guardan en `/app/backend/uploads/` en el servidor local

### Blocked
- [ ] **Twilio WhatsApp Production** - Requiere aprobación Meta
- [ ] **Bancard Integration** - Pendiente credenciales

---

## Technical Architecture

### Backend (`/app/backend/`)
```
server.py           - Main FastAPI app
email_service.py    - Transactional emails (Resend)
whatsapp_service.py - WhatsApp notifications (Twilio)
security.py         - Auth, MFA, audit
ecommerce.py        - E-commerce sync
```

### Frontend (`/app/frontend/src/`)
```
components/
  AdminDashboard.jsx    - Command Center admin
  TuMarca.jsx           - Brand services page
pages/
  ugc/
    UGCMarcas.jsx       - UGC pricing for brands
    CreatorsPage.jsx    - UGC creator landing
```

### Key Integrations
- **Resend** - Transactional emails ✅
- **Twilio** - WhatsApp (blocked on production)
- **Emergent Google Auth** - Social login ✅
- **MongoDB** - Database

---

## Test Credentials
- **Admin**: `avenuepy@gmail.com` / `admin123`

---

## Notes
- WhatsApp notifications fail due to Twilio "From" number not validated
- Email legacy function (`send_confirmation_email`) requires verified domain
- All new email templates work correctly via `email_service.py`
