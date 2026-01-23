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
