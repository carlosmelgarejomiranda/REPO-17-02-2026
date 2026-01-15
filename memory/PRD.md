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

### P1 - High Priority
- [ ] **Creator Dashboard & Campaign Cards Redesign** - Mejorar UX para creadores
- [ ] **"Prueba de Fuego" UGC** - Test completo del flujo E2E (USER VERIFICATION PENDING)
- [ ] **Admin Panel Approval** - Feedback del nuevo diseño (USER VERIFICATION PENDING)

### P2 - Medium Priority  
- [ ] **Image Upload in Create Campaign** - Integrar subida de imagen cover
- [ ] **Creator Reports** - Métricas y reportes para creadores

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
