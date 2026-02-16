# Avenue UGC Platform - PRD

## Original Problem Statement
Platform UGC (User Generated Content) para conectar marcas con creadores de contenido. El sistema incluye paneles para Creadores, Marcas, y Administradores.

## Current Session Focus
**Refactorización completa de la aplicación UGC** para adaptar todo el código al nuevo esquema de base de datos normalizado. El código debe ser retrocompatible con ambos esquemas (antiguo y nuevo).

**Principios clave:**
- Zero data loss durante migración
- Zero pérdida de funcionalidad existente
- Todos los cambios de esquema de BD deben ser autorizados por el usuario

## Progress Summary (Diciembre 2025)

| Módulo | Pantallas | Completadas | Estado |
|--------|-----------|-------------|--------|
| Admin Panel | 7 | 7 | ✅ COMPLETO |
| Panel Creadores | 14 | 14 | ✅ COMPLETO |
| Panel Marcas | 6 | 6 | ✅ COMPLETO |
| Componentes Compartidos | 5 | 5 | ✅ COMPLETO |
| **TOTAL** | **32** | **32** | **100%** |

### 🎉 REFACTORIZACIÓN COMPLETA - TODAS LAS PANTALLAS ADAPTADAS

## What's Been Implemented

### Session: 2026-02-15 (Current)
- ✅ **Panel del Creador (14 pantallas)** - Completamente refactorizado
  - Dashboard, Profile (View/Edit), Campaign Catalog, Applications
  - Deliverables, Workspace, Metrics Submission, Onboarding
  - Reports, Leaderboard
  
- ✅ **Panel de Admin (Vistas principales)** - Refactorizado
  - Gestión de Campañas, Creators, Marcas, Deliverables
  
- ✅ **Panel de Marca (Backend)** - Adaptado a retrocompatibilidad
  - `/api/ugc/brands/me/dashboard` - Dashboard de marca
  - `/api/ugc/brands/me` - Perfil de marca
  - `/api/ugc/campaigns/me/all` - Campañas de la marca
  - Helpers `require_brand` normalizados en todos los archivos

- ✅ **Retrocompatibilidad de esquemas**
  - Código soporta esquema antiguo (brand_id/creator_id/campaign_id como PKs)
  - Código soporta esquema nuevo (id como PK universal)
  - Queries MongoDB usan `$or` para ambos esquemas
  - Helpers normalizan campos de ID automáticamente

### Testing Results (iteration_18) - Latest
- 20/20 tests pasados (100%) - Endpoint de métricas detalladas verificado
- Bug Fix verificado: nombres de creadores en métricas
- Creadores verificados: Pauli Mateos, Christian Zavala, Elias Benítez, José Arthur Silva, Sofía Noemí Ramírez Zárate

### Testing Results (iteration_17)
- 30/30 tests pasados (100%)
- Bugs corregidos en: ugc_brands.py, ugc_brand_reports.py, ugc_deliverables.py, ugc_packages.py, ugc_metrics.py, ugc_reputation.py

### Previous Sessions
- Manual Técnico del Sistema UGC (`/app/docs/MANUAL_SISTEMA_UGC.md`)
- Sistema de backup a Cloudinary y directo
- Export to Excel de campañas UGC
- Sentry Integration para monitoreo

## Key Files Modified
- `/app/backend/routes/ugc_brands.py` - Dashboard y perfil de marca
- `/app/backend/routes/ugc_campaigns.py` - CRUD de campañas
- `/app/backend/routes/ugc_applications.py` - Aplicaciones de creadores
- `/app/backend/routes/ugc_deliverables.py` - Entregas
- `/app/backend/routes/ugc_packages.py` - Paquetes de marca
- `/app/backend/routes/ugc_metrics.py` - Métricas
- `/app/backend/routes/ugc_reputation.py` - Reputación

## Reference Documents
- `/app/docs/INDICE_PANTALLAS_UGC.md` - Roadmap de pantallas a refactorizar
- `/app/docs/DATABASE_SCHEMA.md` - Esquema de base de datos

## Prioritized Backlog

### P0 - Completado ✅
1. ✅ Panel del Creador (14 pantallas) - COMPLETADO
2. ✅ Panel de Admin (7 pantallas) - COMPLETADO
3. ✅ Panel de Marca (6 pantallas) - COMPLETADO
4. ✅ Componentes Compartidos (5 componentes) - COMPLETADO

**🎉 TODAS LAS 32 PANTALLAS HAN SIDO ADAPTADAS AL NUEVO ESQUEMA**

### P1 - Alta Prioridad (Próximos pasos)
- Diseñar tablas de Niveles/Puntos/Beneficios de Creadores
- Corregir instagram_handle de marca "Lurdes"
- Pruebas de integración E2E para validar todos los flujos

### P2 - Media Prioridad
- Monetización de Productos (Planes/Subscriptions)
- Eliminar flujo de aplicación pública
- Configurar webhooks producción (Sentry, UptimeRobot)
- Búsqueda global en Admin Panel
- Integración Bancard

## Technical Notes

### Patrón de Retrocompatibilidad
```python
# En queries:
{"$or": [{"id": value}, {"brand_id": value}]}

# En acceso a campos:
brand_id = brand.get("id") or brand.get("brand_id")

# En helpers require_brand/require_creator:
if "id" not in brand and "brand_id" in brand:
    brand["id"] = brand["brand_id"]
```

### Base de Datos de Prueba
- DB: `test_database` en localhost:27017
- Esquema: Antiguo (usa brand_id/creator_id/campaign_id como PKs)
- La BD de producción (`avenue_db`) tiene esquema nuevo

## Test Credentials
- **Admin:** avenuepy@gmail.com / admin123
- **Test Creator:** testcreator@example.com / test123
- **Test Brand:** testbrand@example.com / brand123

## 3rd Party Integrations
- Cloudinary (archivos)
- Resend (emails)
- MongoDB Atlas
- Emergent-managed Google Auth

## Known Issues
- Instagram handle de marca "Lurdes" contiene URL completa en lugar de handle
