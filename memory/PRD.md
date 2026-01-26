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

### Session: 2026-01-26

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
- [ ] **Image Mis-assignment Bug** - Intermittent bug where product images get assigned to wrong products (USER VERIFICATION PENDING)

### P1 - High Priority
- [ ] **Export Creator List** - Add CSV/Excel export button to Admin Creators panel
- [ ] **Missing Email Notifications** - Several triggers pending:
  - Brands: Campaign approved, slots recharged, plan purchased
  - Creators: Level-up notification
  - E-commerce: Full order cycle
- [ ] **Dark Mode UI for Forms** - Fix applied, pending visual confirmation (USER VERIFICATION PENDING)

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
