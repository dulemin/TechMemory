# Event Guestbook Lite - Claude AI Development Guide

> **Für AI-Assistenten:** Alle wichtigen Informationen über das Projekt, Architektur, Workflows und häufige Aufgaben.

## 📋 Projekt-Übersicht

**Event Guestbook Lite** ist eine digitale Gästebuch-Plattform für Events. Gäste laden per QR-Code/Link Videos, Fotos und Textnachrichten hoch. Beiträge werden als Echtzeit Live-Wall angezeigt und können als ZIP/PDF exportiert werden.

**Kernmerkmale:**
- 30-Sekunden-Setup (Event erstellen → QR-Code → fertig)
- Browser-basiert für Gäste (keine App nötig)
- **In-App Kamera/Video-Aufnahme** - Fotos/Videos direkt aufnehmen (kein Galerie-Upload nötig)
- Live-Wall mit Echtzeit-Updates
- Moderation (Approve/Reject)
- Export (ZIP/PDF + 30-Tage Share-Seite)
- Monetarisierung via Stripe (Free: 50 Gäste/5GB, Premium: ∞/50GB)

**Zielgruppe:** Event-Organisatoren (Hosts) + Event-Teilnehmer (Gäste, keine Registrierung)

## 🏗️ Architektur

### Monorepo (Turborepo)

```
TechMemory/
├── apps/
│   ├── web/                    # Next.js 14.2.21 (App Router)
│   │   ├── app/                # (auth), (dashboard), (public) Route Groups
│   │   ├── lib/supabase/       # client.ts, server.ts, middleware.ts
│   │   ├── components/         # React Components + shadcn/ui
│   │   └── middleware.ts       # Auth Middleware
│   └── mobile/                 # Expo React Native (TODO)
│
├── packages/
│   ├── shared/                 # TypeScript Types + Utils
│   │   └── src/types/          # database.ts, api.ts
│   └── database/               # Supabase Migrations
│       └── migrations/         # 4 Migrations (initial_schema, RLS, storage, trigger)
```

### Tech Stack

| Layer | Tech | Warum |
|-------|------|-------|
| **Frontend** | Next.js 14.2.21 (App Router) | Production-stabil (downgrade von 15 wegen Build-Issues) |
| **Backend** | Supabase | Postgres + Auth + Storage + Realtime all-in-one |
| **Auth** | Supabase Auth | Email/Password + Magic Link |
| **Storage** | Supabase Storage | File-Upload mit RLS |
| **Realtime** | Supabase Realtime | WebSocket für Live-Wall |
| **Payment** | Stripe | (TODO Phase 8) |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first + Copy/Paste Components |
| **Video-Aufnahme** | getUserMedia + MediaRecorder | Browser-native, Format-Erkennung (MP4/WebM+H.264/WebM) |
| **Foto-Kompression** | browser-image-compression | Client-seitig, parallel-fähig |
| **Kamera-Zugriff** | getUserMedia API | Browser-native, mobile-optimiert |
| **Deploy** | Vercel | Next.js-optimiert, Auto-Deploy |
| **Monorepo** | Turborepo | Caching, Vercel-Integration |

### MCP Server (Claude AI Tools)

**Chrome DevTools MCP** - Browser-Testing, Screenshots, Performance-Analysen
**Supabase MCP** - Direkte DB-Operationen, Migrations, SQL, Type-Gen ohne CLI

## 🗄️ Datenbank-Schema

### Tabellen

**`profiles`** - User-Profile (extends auth.users)
- `id` (UUID, FK), `email`, `full_name`, `avatar_url`

**`events`** - Event-Metadaten
- `id` (UUID), `host_user_id` (FK), `title`, `event_date`, `event_code` (8-stellig, UNIQUE), `qr_code_url`, `settings` (JSONB), `status` ('draft'|'active'|'archived')
- Standard-Settings: maxGuests: 50, maxStorageGB: 5, autoApprove: false, allowVideo/Photo/Text: true, maxVideoDuration: 60, shareExpireDays: 30

**`contributions`** - Gast-Uploads
- `id` (UUID), `event_id` (FK), `guest_name`, `type` ('video'|'photo'|'text'), `content_url`, `text_content`, `status` ('pending'|'approved'|'rejected'), `duration_seconds`, `file_size_bytes`

**`subscriptions`** - Stripe (TODO Phase 8)
- `id` (UUID), `user_id` (FK), `stripe_customer_id`, `stripe_subscription_id`, `tier` ('free'|'premium'), `status`

### Storage Buckets

1. **`event-media`** (public) - Videos/Fotos, Pfad: `{eventId}/{contributionId}.{ext}`
2. **`qr-codes`** (public) - Generierte QR-Codes
3. **`exports`** (private) - ZIP/PDF-Exporte (nur Host)

### RLS Policies

- **events**: Hosts CRUD eigene, jeder liest mit `event_code`
- **contributions**: Jeder INSERT (Gäste), Hosts CRUD eigene, jeder liest approved
- **profiles/subscriptions**: User nur eigene Daten

## 🔧 Entwicklungs-Workflows

### Setup

```bash
npm install
# Supabase-Projekt erstellen (https://supabase.com)
cd packages/database && supabase link --project-ref YOUR_ID && supabase db push
# .env.local in apps/web erstellen (Supabase URL + ANON_KEY)
npm run dev
```

### Häufige Befehle

```bash
npm run dev                              # Alle Apps
npm run check-types                      # TypeScript
npm run lint                             # Linting
npx turbo build --filter=web             # Nur Web builden
npm install <package> -w apps/web        # Dependency zu Web hinzufügen
```

### Database-Migrations

**Via Supabase CLI:**
```bash
supabase migration new <name>
supabase db push                         # Lokal
supabase db push --linked                # Production
supabase gen types typescript --local > ../shared/src/types/database.gen.ts
```

**Via Supabase MCP (Claude AI):**
```typescript
mcp__supabase__apply_migration({ project_id: 'hrabmghdoiywxbzxkpjm', name: '...', query: '...' })
mcp__supabase__execute_sql({ project_id: 'hrabmghdoiywxbzxkpjm', query: '...' })
```

**Angewendete Migrations:**
1. `initial_schema` - Tables, Indexes, Constraints
2. `row_level_security` - RLS Policies
3. `storage_buckets` - Storage Setup
4. `auto_create_profile_on_signup` - Trigger für automatische Profil-Erstellung

### shadcn/ui Komponenten hinzufügen

```bash
cd apps/web && npx shadcn@latest add <component>
```

**Installiert:** button, card, input, label, textarea, form, badge, tabs, progress, dialog

## 🎯 Architektur-Entscheidungen

1. **Monorepo (Turborepo)** - Code-Sharing, Atomic Changes, Vercel Remote Caching
2. **Supabase** - Postgres RLS, Realtime, Open-Source, kein Vendor-Lock-in
3. **Next.js 14.2.21** - Downgrade von 15 wegen Prerendering-Bugs, SSR, Server Components
4. **Client-seitige Kompression** - Keine Server-Kosten, parallele Uploads skalieren
5. **Route Groups** - Clean URLs (`/login` statt `/auth/login`), separate Layouts
6. **Hybrid App/Pages Router** - App Router für Pages, Pages Router nur für `_error.js`/`_document.js` (umgeht Next.js 15 styled-jsx Bug)

## 🚀 Implementierungs-Status

**✅ ABGESCHLOSSEN:**
- Phase 1-7: Foundation, Auth, Upload, Live-Wall, Moderation, Export, UX-Polish
- Phase 9: Production Deployment (Vercel)
- **NEU (2025-10-22):** In-App Kamera/Video-Aufnahme Feature

**⏳ TODO:**
- Phase 8: Stripe Payment Integration
- Phase 9 (Rest): PostHog Analytics, DSGVO-Banner, Mobile App (EAS Build)

**Wichtige Dateien:**
- Auth: `app/(auth)/login|signup/page.tsx`, `app/auth/callback/route.ts`
- Dashboard: `app/(dashboard)/dashboard/page.tsx`, `app/(dashboard)/events/`
- **Event-Details:** `app/(dashboard)/events/[id]/page.tsx` - Statistiken, Moderation-Button, Action-Cards
- **Gast-Upload:** `app/(public)/e/[eventCode]/page.tsx` + Upload-Komponenten
  - `photo-upload.tsx` - Foto-Upload + In-App Kamera-Aufnahme
  - `video-upload.tsx` - Video-Upload + In-App Video-Aufnahme (MediaRecorder mit Format-Erkennung)
  - `text-upload.tsx` - Text-Nachrichten
- **Live-Wall:** `app/(dashboard)/events/[id]/wall/` - Slideshow + Gallery
- Moderation: `app/(dashboard)/events/[id]/moderate/`
- Export: `app/api/events/[eventId]/export/route.ts` - MIME-Type-basierte Extension-Erkennung
- Share: `app/(public)/share/[eventId]/page.tsx`

## 🐛 Troubleshooting

**TypeScript-Error "Cannot find module '@event-guestbook/shared'"**
```bash
npm install && CMD+Shift+P → "TypeScript: Restart TS Server"
```

**Supabase "window is not defined"**
- ✅ Server Component: `import { createClient } from '@/lib/supabase/server'`
- ✅ Client Component: `import { createClient } from '@/lib/supabase/client'`

**FFmpeg.wasm (~30MB) Initial Load**
- Normales Verhalten, Loading-Indicator vorhanden, nur bei Video-Upload

**Kamera/Mikrofon-Zugriff verweigert**
- Nur über HTTPS (localhost ist OK für Testing)
- Browser-Berechtigung manuell erlauben
- Mobile: `capture="environment"` öffnet native Kamera-App

**Next.js 15 Build Error (BEHOBEN)**
- Downgrade auf 14.2.21 + Hybrid Router löst Prerendering-Bug

## 📝 Code-Conventions

**Naming:**
- Dateien: `kebab-case.tsx`
- Komponenten: `PascalCase`
- Funktionen: `camelCase`
- Konstanten: `UPPER_SNAKE_CASE`
- Types: `PascalCase`

**Upload-Pattern (wichtig!):**
```typescript
// 1. Contribution ZUERST erstellen (für ID)
const { data: contribution } = await supabase.from('contributions').insert({...}).select().single();

// 2. Datei mit contribution.id benennen
const filePath = `${eventId}/${contribution.id}.mp4`;

// 3. Upload zu Storage
await supabase.storage.from('event-media').upload(filePath, file);

// 4. URL in contribution speichern
const { data } = supabase.storage.from('event-media').getPublicUrl(filePath);
await supabase.from('contributions').update({ content_url: data.publicUrl }).eq('id', contribution.id);
```

**Warum:** Contribution-ID für Dateinamen, vermeidet Orphan-Files, idempotent

## 🔐 Environment-Variablen

**Web (`apps/web/.env.local`):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Später: STRIPE_SECRET_KEY, NEXT_PUBLIC_POSTHOG_KEY
```

**WICHTIG:** Niemals `STRIPE_SECRET_KEY` in Client-Code!

## 🌐 Production Deployment

**GitHub:** https://github.com/dulemin/TechMemory (Branch `main` = Production)
**Vercel:** https://tech-memory-web.vercel.app (Auto-Deploy bei Git Push)

**Workflow:**
```bash
git add . && git commit -m "feat: neue Feature" && git push origin main
# Vercel deployed automatisch (~2-3 Min)
```

**Vercel Config:** Root Directory: `apps/web`, Framework: Next.js, Node: 22.x, Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` (https://tech-memory-web.vercel.app)

**Deployment-Checklist:**
- [ ] `npm run check-types` erfolgreich
- [ ] Lokal getestet
- [ ] Keine `.env` im Commit
- [ ] Nach Deploy: Production-URL testen

**Rollback:** Vercel Dashboard → Deployments → "..." → "Promote to Production"

## 📚 Wichtige Links

- **Live App:** https://tech-memory-web.vercel.app
- **GitHub:** https://github.com/dulemin/TechMemory
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Docs:** [Next.js](https://nextjs.org/docs) | [Supabase](https://supabase.com/docs) | [shadcn/ui](https://ui.shadcn.com)

## 🧪 Test-Credentials & URLs

**Test-User:**
- Email: `testuser@gmail.com`
- Password: `password123`
- Test-Event-Code: `A3K-9P2QM`

**Local URLs:**
- Landing: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Gast-Upload: http://localhost:3000/e/A3K-9P2QM
- Event-Details: http://localhost:3000/events/656282ac-99d8-4e0e-85c5-a6fc60d99561
- Live-Wall: http://localhost:3000/events/656282ac-99d8-4e0e-85c5-a6fc60d99561/wall
- Moderation: http://localhost:3000/events/656282ac-99d8-4e0e-85c5-a6fc60d99561/moderate
- Share: http://localhost:3000/share/656282ac-99d8-4e0e-85c5-a6fc60d99561

---

## 🆕 Neueste Features (2025-10-22)

**In-App Kamera/Video-Aufnahme:**
- Foto-Upload: "Aus Galerie" ODER "📷 Aufnehmen" (Live-Preview → Capture)
- Video-Upload: "Aus Galerie" ODER "🎥 Aufnehmen" (Recording mit Timer → Auto-Stop bei maxDuration)
- Browser-APIs: `getUserMedia()` + `MediaRecorder` + Canvas
- Mobile-optimiert: `capture="environment"` für native Kamera-App

**Bug-Fixes:**
- Name-Validierung in allen Upload-Komponenten (verhindert anonyme Uploads)
- Kamera-Stream: useEffect-Hook für korrekte Video-Element-Bindung (behebt schwarzes Bild)
- Slideshow: Info-Box unter Content (kein Overlay mehr)
- Vollbild-Button: Text jetzt lesbar (schwarz statt weiß)

---

## 🆕 Neueste Änderungen (2025-10-24)

**Video-Upload Optimierungen:**
- ❌ FFmpeg.wasm entfernt (zu langsam: 30+ Sek Wartezeit, Vercel-Fehler)
- ✅ MediaRecorder nutzt nun native Browser-Formate:
  - Priorität: MP4 > WebM+H.264 > WebM (VP9 Fallback)
  - Automatische Format-Erkennung mit `isTypeSupported()`
  - Sofortiger Upload nach Aufnahme (keine Client-Konvertierung!)
- ✅ Loading-States für bessere UX:
  - "⏳ Lädt..." während Kamera initialisiert
  - Toast-Benachrichtigungen für Feedback
  - Buttons disabled während Initialisierung

**Export-Verbesserungen:**
- MIME-Type-basierte Extension-Erkennung (statt URL-basiert)
- WebM-Videos bekommen korrekte `.webm` Extension im Export
- Galerie-Videos behalten Original-Format (MP4, MOV, etc.)

**UI-Fixes:**
- Spacing über "Zur Moderation" Button verbessert
- Video-Aufnahme Abbrechen: Abgebrochene Videos werden nicht mehr in der UI angezeigt (isCancelledRef Flag)

**QR-Code Feature:**
- QR-Karten herunterladen: Generiert PDF mit scanbarem QR-Code für Gastzugang (qrcode + jspdf)

**Was funktioniert:**
- Video-Aufnahme: Sofort bereit zum Upload nach Recording ✅
- Export: Korrekte Dateiendungen basierend auf MIME-Type ✅
- WhatsApp-Kompatibilität: WebM+H.264 in modernen Browsern ✅

**Bekannte Limitierungen:**
- Videos können je nach Browser WebM oder MP4 sein
- Alte Browser ohne H.264-Support → VP9 WebM (weniger kompatibel)
- Server-seitige Konvertierung beim Export könnte später hinzugefügt werden

---

---

## 🆕 Neueste Änderungen (2025-10-25)

**Moderationsseite Redesign:**
- Grid-Layout (3 Spalten) mit kompakten Thumbnails statt vertikale Cards
- Pill-Style Tabs mit Icons (Clock, CheckCircle, XCircle) und Badges
- Mehrfachauswahl: Checkboxen + "Alle auswählen" + Bulk-Actions (Freigeben/Ablehnen/Löschen)
- 3-Punkt-Menü (Dropdown) statt separate Buttons
- Modal-Viewer: Klick auf Foto/Video öffnet Modal mit autoPlay, max-h-[70vh] für Viewport-fit
- shadcn dropdown-menu Komponente installiert

**Gast-Upload Fragen-Dropdown:**
- 5 Standard-Fragen immer verfügbar (DEFAULT_QUESTIONS): "Keine Frage - freies Video", "Was wünschst du dem Paar?", "Dein bester Ehe-Rat?", "Lustigste Erinnerung mit ihnen?", "Was macht ihre Liebe besonders?"
- Kombiniert mit customQuestions vom Host, Position zwischen Tabs und Upload-Bereich
- Radix Tabs ersetzt durch manuelle Tab-Buttons (Fix für Dropdown-Clickability)
- shadcn Select-Komponente statt natives <select> (besseres Styling)

**Upload-UI Redesign:**
- Card-basierte Upload-Buttons (Video/Foto) mit gestrichelten Rahmen (`border-gray-300`)
- Lucide React Icons statt Emojis: Image (Galerie), Video/Camera (Aufnehmen)
- Icon-Farbe: Rosa/Beige (`#d4a5a5`), Größe: `w-12 h-12`
- Tab-Buttons mit Lucide Icons: Video, Camera, MessageSquare (16px, links vom Text)
- Minimalistisches Design ohne Hintergrund-Kreise

---

**Status:** Phase 9 (Deployment) ✅ | App LIVE auf Vercel 🎉
**Letzte Aktualisierung:** 2025-10-25 (Gast-Upload UI Redesign)
**MCP Server:** Chrome DevTools + Supabase (aktiviert)
**Migrations:** 4 angewendet (schema, RLS, storage, trigger)
