# UGC Platform - Product Requirements Document

## Original Problem Statement
Build a comprehensive SaaS platform for connecting brands with UGC (User-Generated Content) creators. The platform enables brands to create campaigns, recruit creators, manage deliverables, and track performance metrics.

## User Personas
- **Brands**: Companies looking to create UGC campaigns and recruit creators
- **Creators**: Content creators looking for campaign opportunities
- **Admin**: Platform administrators managing the ecosystem

## Core Requirements (Completed)

### Sprint 1-2: Foundation
- [x] Brand and Creator onboarding flows
- [x] Package purchasing system for brands
- [x] Campaign creation and management

### Sprint 3: Application System
- [x] CampaignsCatalog for creators to browse campaigns
- [x] Application submission and management
- [x] Application status tracking (applied, shortlisted, confirmed, rejected)

### Sprint 4: Deliverables & Workflow
- [x] CreatorWorkspace for managing active deliverables
- [x] DeliverableDetail page for content submission
- [x] BrandDeliverables for brand review workflow
- [x] Content review and approval process

### Sprint 5: Metrics & AI
- [x] MetricsSubmit page for creators to upload performance screenshots
- [x] Backend infrastructure for metrics processing
- [x] AI integration placeholder for screenshot analysis (MOCKED)

### Sprint 6: Reputation & Gamification
- [x] Creator levels (Rookie, Trusted, Pro, Elite)
- [x] Rating system for completed deliverables
- [x] Leaderboard page showing top creators

### Sprint 7: Automated Emails
- [x] Resend API integration
- [x] Email notifications for key events (application status, deliverable reviews)

### Sprint 8: Admin Panel
- [x] UGC Admin Panel with dashboard, creators, brands, campaigns, metrics views
- [x] Complete data visibility and management

### Brand Campaign Reports Dashboard (NEW - Jan 2026)
- [x] Metrics Report: Views, Reach, Likes, Comments, Shares, Saves, Watch Time, Interaction Rate, Retention Rate
- [x] Demographics Report: Gender, Age Range, Country distribution (MOCKED data)
- [x] Applicants Report: Creator stats with DOT%, avg metrics, levels, ratings
- [x] Platform filter (TikTok, Instagram, or both)
- [x] Date filter (All-time vs monthly)
- [x] Navigation from BrandCampaigns to Reports
- [x] **NEW**: Direct access from BrandDashboard with campaign cards showing "Métricas" and "Demografía" buttons
- [x] **NEW**: Dashboard endpoint returns campaigns list with metrics count

### Campaign Contract System (NEW - Jan 2026)
- [x] Contract-based campaigns with monthly deliverable quotas
- [x] Automatic slot reloading based on contract activation date (same day each month)
- [x] Contract expiration handling (campaign becomes invisible to creators)
- [x] Auto-rejection of pending applications 30 days after contract expiration
- [x] Admin-only campaign creation and management
- [x] Brand-only access to reports and deliverable ratings (no campaign management)
- [x] Campaign renewal by admin
- [x] New campaign stats: Aplicaciones, Confirmados, Posteos, Métricas
- [x] **APScheduler** configured for daily job execution at 6:00 AM Paraguay time
- [x] **Email notifications**:
  - Brand: Informativo cuando se recargan cupos ("Nuestro equipo seleccionará creadores")
  - Admin: Resumen con acción requerida ("X campañas con cupos para confirmar")
  - Creadores: Notificación cuando su aplicación es cerrada por vencimiento

### Admin Campaign Manager UI (NEW - Jan 2026)
- [x] New "Gestión Campañas" tab in Admin Panel
- [x] Create Campaign form with all fields:
  - Company selection (Empresa) + Brand name for title
  - Description, Category, Cover Image upload
  - Contract: Monthly slots, Duration, Start date
  - Requirements: Gender, Age, Min followers, Country, Residence
  - Instagram/TikTok public profile notice (always required)
  - Canje: Type, Value, Description
  - Timeline: Applications deadline, Publish dates
  - Admin notes (private)
- [x] Campaign list with contract info (cupos, reload date, expiration)
- [x] Actions: Add slots (+), Renew contract, Toggle visibility

## Architecture

### Frontend Routes (React)
```
/ugc/select-role - Role selection
/ugc/creator/onboarding - Creator onboarding
/ugc/creator/dashboard - Creator dashboard
/ugc/creator/workspace - Active deliverables
/ugc/creator/deliverable/:id - Deliverable detail
/ugc/creator/metrics/:deliverableId - Metrics submission
/ugc/creator/:creatorId - Public creator profile
/ugc/leaderboard - Top creators ranking
/ugc/brand/onboarding - Brand onboarding
/ugc/brand/dashboard - Brand dashboard
/ugc/brand/packages - Package pricing
/ugc/brand/campaigns - Campaign management
/ugc/brand/campaigns/new - Campaign builder
/ugc/brand/campaigns/:campaignId/reports - Campaign reports (NEW)
/ugc/brand/deliverables/:campaignId - Brand deliverables review
/ugc/campaigns - Public campaign catalog
```

### Backend Routes (FastAPI)
```
/api/ugc/creators/* - Creator management
/api/ugc/brands/* - Brand management
/api/ugc/campaigns/* - Campaign management
/api/ugc/packages/* - Package purchasing
/api/ugc/applications/* - Application handling
/api/ugc/deliverables/* - Deliverable workflow
/api/ugc/metrics/* - Metrics submission and processing
/api/ugc/reputation/* - Leaderboard and profiles
/api/ugc/admin/* - Admin dashboard endpoints
/api/ugc/metrics/campaign/{id}/detailed - Detailed metrics report (NEW)
/api/ugc/metrics/campaign/{id}/demographics - Demographics report (NEW)
/api/ugc/campaigns/{id}/applicants-report - Applicants report (NEW)
```

## Test Credentials
- **Admin/Brand User**: avenuepy@gmail.com / admin123
- **Test Campaign**: e31c0c3b-59ca-46f7-9fd8-270301b3ba4e (AVENUE Summer Collection 2025)

## Integrations
- **Resend**: Email notifications (ACTIVE)
- **Twilio/WhatsApp**: Notifications (BLOCKED - pending Meta approval)
- **Google Analytics**: Site tracking (ACTIVE)
- **Emergent Google Auth**: User authentication (ACTIVE)
- **Bancard**: Payment gateway (BLOCKED - pending credentials)
- **Gemini Vision**: Screenshot AI processing (MOCKED)

## Upcoming/Future Tasks (P1-P2)
- [ ] Production Twilio/WhatsApp setup (blocked on Meta approval)
- [ ] Bancard payment gateway integration (blocked on credentials)
- [ ] Real AI metrics extraction from screenshots
- [ ] Advanced admin features
- [ ] Refactor large components (UGCAdminPanel.jsx)

## Known Limitations
1. Demographics data in brand reports is MOCKED/simulated based on campaign category
2. AI screenshot processing is placeholder - returns demo data
3. WhatsApp notifications not active in production

## Data Models (Key Collections)
- `users` - User accounts
- `ugc_creators` - Creator profiles with stats, levels
- `ugc_brands` - Brand profiles
- `ugc_campaigns` - Campaign definitions
- `ugc_applications` - Creator applications to campaigns
- `ugc_deliverables` - Content submissions
- `ugc_metrics` - Performance metrics
- `ugc_ratings` - Creator ratings
- `ugc_packages` - Brand package purchases

## Last Updated
January 9, 2026 - Completed Brand Campaign Reports Dashboard
