# Avenue UGC Platform - PRD

## Original Problem Statement
Platform UGC (User Generated Content) para conectar marcas con creadores de contenido. Incluye sistema de reservas de studio, e-commerce, y panel de administración completo.

## Current Session Focus
Documentación completa del sistema UGC como prerrequisito para migración de base de datos.

## What's Been Implemented

### Session: 2026-02-04
- ✅ **Manual Técnico del Sistema UGC** (`/app/docs/MANUAL_SISTEMA_UGC.md`)
  - Documentación pantalla por pantalla de todo el flujo UGC
  - Fuentes de datos y colecciones consultadas por cada pantalla
  - Actualizaciones de BD por cada acción del usuario
  - Estados de entidades (campañas, aplicaciones, entregas)
  - Notificaciones del sistema
  - Cálculos automáticos (stats, niveles)

### Session: 2026-02-02
- ✅ **Sistema de Backup 100% Completo**
  - Script unificado `daily_backup.py`
  - Incluye TODAS las colecciones (vacías, GridFS chunks)
  - Genera `_MANIFEST.json` con checksums MD5
  - Ejecución en background (threading)
  - Botón único "Crear Backup" en Admin Panel

- ✅ **Normalización de ugc_applications**
  - Eliminados 3 registros de prueba
  - Campo `application_id` presente en 351 registros
  - Backup de seguridad antes de modificar

- ✅ **Nuevas herramientas admin**
  - Export to Excel de cualquier colección
  - ERD completo en `/app/docs/ERD_AVENUE_DATABASE.eraser`

### Session: 2026-02-01
- ✅ **Backend: Endpoint de inspección de colecciones**
  - `GET /api/admin/debug/collections-check`
  - Retorna contenido de `ugc_ratings` y `ugc_notifications`
  - Lista conteo de todas las colecciones
  - Corregido error de `get_db()` no definido

- ✅ **Frontend: Panel de Sistema (UGCAdminPanel.jsx)**
  - Botón "Ejecutar Query" para inspeccionar colecciones
  - Muestra resultados en formato JSON
  - Integrado en tab "Sistema" del panel UGC

### Previous Sessions
- Sentry Integration para monitoreo de errores
- Sistema de backup de BD a Cloudinary
- Centro de notificaciones del sistema
- Webhooks para Sentry y UptimeRobot
- Exportación PDF de reportes
- Documentación del schema de BD

## Key Files
- `/app/backend/server.py` - Backend principal (endpoint línea ~2856)
- `/app/frontend/src/components/UGCAdminPanel.jsx` - Panel admin UGC
- `/app/backend/scripts/full_backup.py` - Script de backup completo
- `/app/docs/DATABASE_SCHEMA.md` - Documentación del schema

## Database Stats (Production - 2026-02-01)
- `ugc_ratings`: 2 registros
- `ugc_notifications`: 10 registros
- `ugc_applications`: 354 registros
- `ugc_creators`: 264 registros
- `users`: 372 registros
- Total: 34 colecciones

## Prioritized Backlog

### P0 - Crítico (Database Migration)
1. ~~Completar UI de inspección de datos~~ ✅ COMPLETADO
2. Fase 1: Ejecutar full_backup.py y cargar backup completo
3. Fase 2: Limpieza - Eliminar colecciones obsoletas (GridFS legacy)
4. Fase 3: Normalización - Agregar creator_id a ugc_applications

### P1 - Alta Prioridad
- Eliminar flujo de aplicación pública (sin cuenta)
- Configurar webhooks Sentry/UptimeRobot en producción
- **Captura de teléfono en Google OAuth** - Implementar modal obligatorio post-login para usuarios que se registran con Google y no tienen teléfono. Opciones aprobadas:
  - Modal obligatorio al detectar `users.phone` vacío
  - Banner persistente + bloqueo de acciones críticas
  - Endpoint: `POST /users/complete-profile`

### P2 - Media Prioridad
- Búsqueda global en admin panel
- Integración Bancard para pagos

## Technical Debt
- Consolidar `social_accounts` y `social_networks` en modelo Creator
- Deprecar código GridFS legacy
- Campos redundantes sin variación (ver análisis 2026-02-02):
  - `onboarding_completed` siempre true en creators/brands
  - `is_verified` siempre false en creators/brands
  - `level` y `level_progress` siempre 0 en creators
  - `logo_url` siempre null en brands
- Dato incorrecto: marca "Lurdes" tiene URL en campo `instagram_handle`

## Credentials (Testing)
- Admin: avenuepy@gmail.com / admin123

## 3rd Party Integrations
- Resend (emails)
- Emergent Google Auth
- Gemini Vision (métricas AI)
- Cloudinary (archivos/backups)
- Sentry (errores)
- UptimeRobot (disponibilidad)
