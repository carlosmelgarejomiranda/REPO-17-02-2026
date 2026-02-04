# Avenue UGC Platform - PRD

## Original Problem Statement
Platform UGC (User Generated Content) para conectar marcas con creadores de contenido. Incluye sistema de reservas de studio, e-commerce, y panel de administración completo.

## Current Session Focus
Backup de base de datos funcional en producción.

## What's Been Implemented

### Session: 2026-02-04 (Current)
- ✅ **Endpoint de Backup Directo Python** (`GET /api/admin/backup/download-direct-py`)
  - Crea backup usando Python/PyMongo sin mongodump
  - Excluye colecciones GridFS para reducir tamaño (~1.3MB vs ~200MB)
  - Incluye MANIFEST.json con checksums MD5
  - Descarga directa sin subir a Cloudinary
  
- ✅ **Botón "Backup Directo" en Admin Panel**
  - Botón verde junto a "Backup Cloudinary"
  - Descarga archivo .tar.gz directamente al navegador
  - Muestra información de colecciones y documentos

### Previous Sessions
- Manual Técnico del Sistema UGC (`/app/docs/MANUAL_SISTEMA_UGC.md`)
- Sistema de backup a Cloudinary con Python
- Export to Excel de campañas UGC
- Sentry Integration para monitoreo
- Centro de notificaciones del sistema
- Webhooks para Sentry y UptimeRobot
- Documentación del schema de BD

## Key Files
- `/app/backend/server.py` - Endpoints de backup (líneas 3013+)
- `/app/backend/scripts/daily_backup.py` - Script de backup programado
- `/app/frontend/src/components/AdminDashboard.jsx` - UI de backup
- `/app/docs/MANUAL_SISTEMA_UGC.md` - Manual técnico UGC
- `/app/docs/DATABASE_SCHEMA.md` - Documentación del schema

## Database Stats (Preview - 2026-02-04)
- 34 colecciones totales
- 7,609 documentos totales
- Backup size: ~1.3MB (sin GridFS), ~5.5MB (datos crudos)

## Backup Methods Available
1. **Backup Cloudinary** - Sube a Cloudinary, envía notificaciones, programable diariamente
2. **Backup Directo** - Descarga directa, sin dependencias externas, ideal para emergencias

## Prioritized Backlog

### P0 - Crítico (Pending User Verification)
1. ⏳ **Verificación en Producción** - Usuario debe probar ambos botones de backup
   - Backup Cloudinary (subida a nube)
   - Backup Directo (descarga local)

### P1 - Alta Prioridad
- **Database Migration Plan** - Una vez confirmado el backup funcional
- **Captura de teléfono en Google OAuth** - Modal obligatorio post-login
- Eliminar flujo de aplicación pública (sin cuenta)

### P2 - Media Prioridad
- Configurar webhooks Sentry/UptimeRobot en producción
- Búsqueda global en admin panel
- Integración Bancard para pagos
- Consolidar campos redundantes en BD

## Technical Debt
- Consolidar `social_accounts` y `social_networks` en modelo Creator
- Deprecar código GridFS legacy
- Dato incorrecto: marca "Lurdes" tiene URL en campo `instagram_handle`

## API Endpoints de Backup
- `POST /api/admin/backup/run` - Inicia backup a Cloudinary (background)
- `GET /api/admin/backup/status` - Estado del último backup
- `GET /api/admin/backup/download-direct-py` - Descarga directa sin Cloudinary
- `GET /api/admin/backup/diagnose` - Diagnóstico de conectividad
- `GET /api/admin/backup/diagnostics` - Historial de intentos de backup

## Credentials (Testing)
- Admin: avenuepy@gmail.com / admin123

## 3rd Party Integrations
- Resend (emails desde avenue.com.py)
- Emergent Google Auth
- Gemini Vision (métricas AI)
- Cloudinary (archivos/backups)
- Sentry (errores)
- UptimeRobot (disponibilidad)

## Production Environment Notes
- MongoDB Atlas (no local)
- DB name: avenue-secure-shop-test_database
- `mongodump` NO está instalado - usar método Python
- Cloudinary limit: ~100MB por archivo
