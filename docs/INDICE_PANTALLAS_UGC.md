# ÍNDICE DE PANTALLAS - MÓDULO UGC

## Propósito
Este documento lista todas las pantallas del módulo UGC, sus archivos, funcionalidades, y el plan de adaptación al nuevo esquema de base de datos.

---

## 📊 RESUMEN DE ESTADO

| Categoría | Total | Adaptadas | Pendientes |
|-----------|-------|-----------|------------|
| Admin Panel | 7 | 7 | 0 |
| Panel Creadores | 14 | 14 | 0 |
| Panel Marcas | 6 | 6 | 0 |
| Componentes Compartidos | 5 | 0 | 5 |
| **TOTAL** | **32** | **27** | **5** |

---

## ✅ PANEL ADMIN (7 pantallas) - COMPLETADO

### 1. Gestión Campañas
- **Archivo**: `/app/frontend/src/components/admin/AdminCampaignsTab.jsx`
- **Ruta**: `/admin?module=ugc&ugcTab=campaign-manager`
- **Funcionalidades**:
  - Listar campañas con filtros (estado, marca)
  - Mostrar cupos confirmados vs total
  - Contar aplicaciones, URLs, métricas
  - Crear nueva campaña
- **Tablas consultadas**:
  - `ugc_campaigns` (principal)
  - `ugc_brands` (JOIN por brand_id)
  - `ugc_applications` (agregación)
  - `ugc_deliverables` (agregación)
  - `ugc_metrics` (agregación)
- **Estado**: ✅ ADAPTADA (backend retrocompatible)

### 2. Gestión Creators
- **Archivo**: `/app/frontend/src/components/admin/AdminCreatorsTab.jsx`
- **Ruta**: `/admin?module=ugc&ugcTab=creators`
- **Funcionalidades**:
  - Listar creadores con filtros
  - Ver perfil, nivel, estadísticas
  - Verificar creadores
- **Tablas consultadas**:
  - `ugc_creators` (principal)
  - `users` (JOIN por user_id)
  - `ugc_applications` (historial)
- **Estado**: ✅ ADAPTADA (backend retrocompatible)

### 3. Gestión Marcas
- **Archivo**: `/app/frontend/src/components/admin/AdminBrandsTab.jsx`
- **Ruta**: `/admin?module=ugc&ugcTab=brands`
- **Funcionalidades**:
  - Listar marcas
  - Ver empresa asociada
  - Ver campañas por marca
- **Tablas consultadas**:
  - `ugc_brands` (principal)
  - `ugc_companies` (JOIN por company_id) ← NUEVO
  - `ugc_campaigns` (agregación)
- **Estado**: ✅ ADAPTADA (backend retrocompatible)

### 4. Gestión Deliverables
- **Archivo**: `/app/frontend/src/components/admin/AdminDeliverablesTab.jsx`
- **Ruta**: `/admin?module=ugc&ugcTab=deliverables`
- **Funcionalidades**:
  - Listar entregas pendientes/aprobadas
  - Aprobar/rechazar entregas
  - Ver métricas asociadas
- **Tablas consultadas**:
  - `ugc_deliverables` (principal)
  - `ugc_applications` (JOIN por application_id)
  - `ugc_metrics` (JOIN por deliverable_id)
- **Estado**: ✅ ADAPTADA (backend retrocompatible)

### 5. Métricas (Dashboard)
- **Archivo**: `/app/frontend/src/components/AdminStatsDashboard.jsx`
- **Ruta**: `/admin?module=ugc&ugcTab=metrics`
- **Funcionalidades**:
  - KPIs generales del sistema
  - Gráficos de tendencia
- **Tablas consultadas**:
  - Agregaciones de múltiples tablas
- **Estado**: ✅ ADAPTADA (usa datos agregados)

### 6. Sistema (Configuración)
- **Archivo**: `/app/frontend/src/components/UGCAdminPanel.jsx` (sección Sistema)
- **Ruta**: `/admin?module=ugc&ugcTab=system`
- **Funcionalidades**:
  - Backup de BD
  - Configuraciones
- **Tablas consultadas**:
  - `admin_settings`
  - Sistema de backup
- **Estado**: ✅ ADAPTADA (no consulta colecciones UGC)

### 7. Aplicaciones por Campaña
- **Archivo**: `/app/frontend/src/pages/admin/CampaignApplicationsPage.jsx`
- **Ruta**: `/admin/campaigns/:campaignId/applications`
- **Funcionalidades**:
  - Ver aplicantes a una campaña
  - Confirmar/rechazar aplicaciones
  - Exportar a Excel
- **Tablas consultadas**:
  - `ugc_applications` (principal)
  - `ugc_creators` (JOIN)
  - `users` (JOIN)
- **Estado**: ✅ ADAPTADA (backend retrocompatible)

---

## ✅ PANEL CREADORES (14 pantallas) - COMPLETADO

### 8. Dashboard Creator
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorDashboard.jsx`
- **Ruta**: `/ugc/creator/dashboard`
- **Funcionalidades**:
  - Resumen de actividad
  - Campañas activas
  - Próximas entregas
- **Tablas consultadas**:
  - `ugc_creators`
  - `ugc_applications`
  - `ugc_deliverables`
- **Estado**: ✅ ADAPTADA

### 9. Catálogo de Campañas
- **Archivo**: `/app/frontend/src/pages/ugc/CampaignsCatalog.jsx`
- **Ruta**: `/ugc/campaigns`
- **Funcionalidades**:
  - Explorar campañas disponibles
  - Filtrar por categoría, ciudad
  - Postularse
- **Tablas consultadas**:
  - `ugc_campaigns` (status='active', visible_to_creators=true)
  - `ugc_brands` (JOIN)
- **Estado**: ✅ ADAPTADA

### 10. Detalle de Campaña
- **Archivo**: `/app/frontend/src/pages/ugc/CampaignDetail.jsx`
- **Ruta**: `/ugc/campaigns/:id`
- **Funcionalidades**:
  - Ver información completa
  - Requisitos, beneficios
  - Botón de postulación
- **Tablas consultadas**:
  - `ugc_campaigns`
  - `ugc_brands`
  - `ugc_applications` (verificar si ya aplicó)
- **Estado**: ✅ ADAPTADA

### 11. Mis Aplicaciones
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorApplications.jsx`
- **Ruta**: `/ugc/creator/applications`
- **Funcionalidades**:
  - Ver historial de postulaciones
  - Estado de cada una
- **Tablas consultadas**:
  - `ugc_applications`
  - `ugc_campaigns` (JOIN)
- **Estado**: ✅ ADAPTADA

### 12. Mis Campañas Activas
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorCampaigns.jsx`
- **Ruta**: `/ugc/creator/campaigns`
- **Funcionalidades**:
  - Campañas donde fue confirmado
  - Acceso a workspace
- **Tablas consultadas**:
  - `ugc_applications` (status='confirmed')
  - `ugc_campaigns` (JOIN)
- **Estado**: ✅ ADAPTADA

### 13. Workspace (Mi Trabajo)
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorWorkspace.jsx`
- **Ruta**: `/ugc/creator/workspace/:applicationId`
- **Funcionalidades**:
  - Subir entregas
  - Ver estado de entregas
  - Subir métricas
- **Tablas consultadas**:
  - `ugc_applications`
  - `ugc_deliverables`
  - `ugc_metrics`
- **Estado**: ✅ ADAPTADA

### 14. Mis Entregas
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorDeliverables.jsx`
- **Ruta**: `/ugc/creator/deliverables`
- **Funcionalidades**:
  - Historial de entregas
  - Estado de cada una
- **Tablas consultadas**:
  - `ugc_deliverables`
  - `ugc_applications` (JOIN)
- **Estado**: ✅ ADAPTADA

### 15. Subir Métricas
- **Archivo**: `/app/frontend/src/pages/ugc/MetricsSubmit.jsx`
- **Ruta**: `/ugc/creator/metrics/:deliverableId`
- **Funcionalidades**:
  - Capturar métricas de post
  - Subir screenshot
- **Tablas consultadas**:
  - `ugc_deliverables`
  - `ugc_metrics` (INSERT)
- **Estado**: ✅ ADAPTADA

### 16. Mi Perfil
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorProfile.jsx`
- **Ruta**: `/ugc/creator/profile`
- **Funcionalidades**:
  - Ver datos del perfil
  - Nivel, estadísticas
- **Tablas consultadas**:
  - `ugc_creators`
  - `users` (JOIN)
- **Estado**: ✅ ADAPTADA

### 17. Editar Perfil
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorProfileEdit.jsx`
- **Ruta**: `/ugc/creator/profile/edit`
- **Funcionalidades**:
  - Actualizar bio, redes sociales
  - Subir foto de perfil
- **Tablas consultadas**:
  - `ugc_creators` (UPDATE)
- **Estado**: ✅ ADAPTADA

### 18. Onboarding Creator
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorOnboarding.jsx`
- **Ruta**: `/ugc/creator/onboarding`
- **Funcionalidades**:
  - Completar perfil inicial
  - Vincular redes sociales
- **Tablas consultadas**:
  - `ugc_creators` (INSERT/UPDATE)
- **Estado**: ✅ ADAPTADA

### 19. Mis Reportes
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorReports.jsx`
- **Ruta**: `/ugc/creator/reports`
- **Funcionalidades**:
  - Estadísticas personales
  - Historial de trabajo
- **Tablas consultadas**:
  - Agregaciones múltiples
- **Estado**: ✅ ADAPTADA

### 20. Feedback
- **Archivo**: `/app/frontend/src/pages/ugc/CreatorFeedback.jsx`
- **Ruta**: `/ugc/creator/feedback`
- **Funcionalidades**:
  - Ver calificaciones recibidas
- **Tablas consultadas**:
  - `ugc_ratings`
  - `ugc_applications` (JOIN)
- **Estado**: ✅ ADAPTADA

### 21. Leaderboard
- **Archivo**: `/app/frontend/src/pages/ugc/Leaderboard.jsx`
- **Ruta**: `/ugc/leaderboard`
- **Funcionalidades**:
  - Ranking de creadores
  - Niveles y puntos
- **Tablas consultadas**:
  - `ugc_creators` (agregación)
- **Estado**: ✅ ADAPTADA

---

## 🟡 PANEL MARCAS (6 pantallas)

### 22. Dashboard Marca
- **Archivo**: `/app/frontend/src/pages/ugc/BrandDashboard.jsx`
- **Ruta**: `/ugc/brand/dashboard`
- **Funcionalidades**:
  - Resumen de campañas
  - Entregas pendientes
- **Tablas consultadas**:
  - `ugc_brands`
  - `ugc_campaigns`
  - `ugc_applications`
- **Estado**: ⬜ PENDIENTE

### 23. Mis Campañas (Marca)
- **Archivo**: `/app/frontend/src/pages/ugc/BrandCampaigns.jsx`
- **Ruta**: `/ugc/brand/campaigns`
- **Funcionalidades**:
  - Ver campañas propias
  - Crear nueva campaña
- **Tablas consultadas**:
  - `ugc_campaigns`
  - `ugc_brands`
- **Estado**: ⬜ PENDIENTE

### 24. Constructor de Campaña
- **Archivo**: `/app/frontend/src/pages/ugc/CampaignBuilder.jsx`
- **Ruta**: `/ugc/brand/campaigns/new`
- **Funcionalidades**:
  - Crear/editar campaña
  - Definir requisitos, canje
- **Tablas consultadas**:
  - `ugc_campaigns` (INSERT/UPDATE)
  - `ugc_brands`
- **Estado**: ⬜ PENDIENTE

### 25. Aplicaciones (Marca)
- **Archivo**: `/app/frontend/src/pages/ugc/CampaignApplications.jsx`
- **Ruta**: `/ugc/brand/campaigns/:id/applications`
- **Funcionalidades**:
  - Ver postulantes
  - Confirmar/rechazar
- **Tablas consultadas**:
  - `ugc_applications`
  - `ugc_creators` (JOIN)
- **Estado**: ⬜ PENDIENTE

### 26. Entregas (Marca)
- **Archivo**: `/app/frontend/src/pages/ugc/BrandDeliverables.jsx`
- **Ruta**: `/ugc/brand/deliverables`
- **Funcionalidades**:
  - Ver entregas de creadores
  - Aprobar/rechazar
- **Tablas consultadas**:
  - `ugc_deliverables`
  - `ugc_applications` (JOIN)
- **Estado**: ⬜ PENDIENTE

### 27. Reportes (Marca)
- **Archivo**: `/app/frontend/src/pages/ugc/BrandCampaignReports.jsx`
- **Ruta**: `/ugc/brand/reports`
- **Funcionalidades**:
  - Métricas de campañas
  - ROI, engagement
- **Tablas consultadas**:
  - Agregaciones múltiples
- **Estado**: ⬜ PENDIENTE

---

## 🔵 COMPONENTES COMPARTIDOS (5)

### 28. UGC Admin Panel (Contenedor)
- **Archivo**: `/app/frontend/src/components/UGCAdminPanel.jsx`
- **Estado**: ⬜ PENDIENTE

### 29. UGC Navbar
- **Archivo**: `/app/frontend/src/components/UGCNavbar.jsx`
- **Estado**: ⬜ PENDIENTE

### 30. UGC Landing
- **Archivo**: `/app/frontend/src/components/UGCLanding.jsx`
- **Estado**: ⬜ PENDIENTE

### 31. UGC Campaigns List
- **Archivo**: `/app/frontend/src/components/UGCCampaignsList.jsx`
- **Estado**: ⬜ PENDIENTE

### 32. Admin Campaign Manager
- **Archivo**: `/app/frontend/src/components/AdminCampaignManager.jsx`
- **Estado**: ⬜ PENDIENTE

---

## 📋 PLAN DE ADAPTACIÓN

### Fase 1: Panel Admin (Prioridad Alta)
1. ⬜ Gestión Campañas
2. ⬜ Gestión Creators
3. ⬜ Gestión Marcas
4. ⬜ Gestión Deliverables

### Fase 2: Panel Creadores (Prioridad Media)
5. ⬜ Dashboard Creator
6. ⬜ Catálogo de Campañas
7. ⬜ Mis Aplicaciones
8. ⬜ Workspace

### Fase 3: Panel Marcas (Prioridad Media)
9. ⬜ Dashboard Marca
10. ⬜ Mis Campañas
11. ⬜ Aplicaciones

### Fase 4: Funcionalidades Secundarias
12. ⬜ Métricas
13. ⬜ Reportes
14. ⬜ Leaderboard

---

## 📝 NOTAS

- Las pantallas de **Agencias** y **Empresas** son **NUEVAS** y deben crearse desde cero.
- Las tablas `org_memberships` y `agency_clients` aún no tienen pantallas asociadas.

---

*Última actualización: 2026-02-05*
