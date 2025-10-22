# Event Guestbook Lite - Claude AI Development Guide

> **Für AI-Assistenten (Claude):** Diese Datei enthält alle wichtigen Informationen über das Projekt, Architekturentscheidungen, Entwicklungs-Workflows und häufige Aufgaben.

## 📋 Projekt-Übersicht

### Vision
Event Guestbook Lite ist eine **digitale Gästebuch-Plattform** für Events (Hochzeiten, Partys, Firmenfeiern). Gäste können per QR-Code oder Link **Videos, Fotos und Textnachrichten** hochladen. Die Beiträge werden in **Echtzeit als Live-Wall** angezeigt und können später als **ZIP/PDF exportiert** werden.

### Kernmerkmale
- **30-Sekunden-Setup**: Event erstellen, QR-Code generieren, fertig
- **App-frei für Gäste**: Browser-basierter Upload (kein App-Download)
- **Live-Wall**: Echtzeit-Slideshow während des Events
- **Moderation**: Hosts können Beiträge freigeben/ablehnen
- **Export**: ZIP/PDF-Download + Share-Seite (30 Tage)
- **Monetarisierung**: Stripe-Integration (Free: 50 Gäste/5GB, Premium: ∞/50GB)

### Zielgruppe
- **Primary Users (Hosts)**: Event-Organisatoren (Wedding Planner, Privatpersonen, Eventmanager)
- **Secondary Users (Gäste)**: Event-Teilnehmer (keine Registrierung erforderlich)

## 🏗️ Architektur

### Monorepo-Struktur (Turborepo)

```
TechMemory/
├── apps/
│   ├── web/                    # Next.js 15 (Host-Dashboard + Gast-Upload-Seite)
│   │   ├── app/                # App Router (Next.js 15)
│   │   │   ├── page.tsx        # Landing Page
│   │   │   ├── layout.tsx      # Root Layout
│   │   │   ├── error.tsx       # Global Error Handler
│   │   │   ├── not-found.tsx   # 404 Page
│   │   │   └── (routes)/       # Route Groups (später: dashboard, login, e/[code], etc.)
│   │   ├── lib/
│   │   │   ├── supabase/       # Supabase Clients
│   │   │   │   ├── client.ts   # Browser Client
│   │   │   │   ├── server.ts   # Server Client
│   │   │   │   └── middleware.ts # Auth Middleware
│   │   │   └── utils.ts        # Utility Functions (cn, etc.)
│   │   ├── components/         # React Components (später mit shadcn/ui)
│   │   ├── middleware.ts       # Next.js Middleware (Auth)
│   │   ├── tailwind.config.ts  # Tailwind Config
│   │   └── next.config.js      # Next.js Config
│   │
│   └── mobile/                 # Expo React Native (Host-Management-App)
│       ├── app/                # Expo Router (File-based Routing)
│       ├── lib/
│       │   └── supabase.ts     # Supabase Client (React Native)
│       ├── components/         # React Native Components
│       ├── tailwind.config.js  # NativeWind Config
│       ├── metro.config.js     # Metro Bundler Config
│       └── global.css          # NativeWind Styles
│
├── packages/
│   ├── shared/                 # Shared TypeScript Code
│   │   ├── src/
│   │   │   ├── index.ts        # Main Export
│   │   │   ├── types/
│   │   │   │   ├── database.ts # Supabase DB Types (manuell gepflegt)
│   │   │   │   └── api.ts      # API Request/Response Types
│   │   │   └── lib/
│   │   │       └── supabase.ts # Shared Utils (generateEventCode, etc.)
│   │   └── package.json
│   │
│   ├── database/               # Supabase Migrations
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql          # Tables + Indexes
│   │   │   ├── 002_row_level_security.sql      # RLS Policies
│   │   │   └── 003_storage_buckets.sql         # Storage Setup
│   │   └── README.md           # Migration-Anleitung
│   │
│   └── ui/                     # Shared UI Components (Turborepo Default, aktuell nicht genutzt)
│
├── .env.example                # Globale Env-Template (aktuell leer)
├── package.json                # Root Package (Workspaces)
├── turbo.json                  # Turborepo Config
├── README.md                   # User-facing Dokumentation
└── CLAUDE.md                   # Diese Datei (für AI-Assistenten)
```

### Tech Stack

| Layer | Technologie | Warum? |
|-------|-------------|--------|
| **Frontend (Web)** | Next.js 14.2.21 (App Router) | SSR, SEO, Production-stabil (downgrade von 15 wegen Build-Issues) |
| **Frontend (Mobile)** | Expo (React Native) | Cross-platform (iOS/Android), schnelle Iteration |
| **Backend** | Supabase | Postgres DB + Auth + Storage + Realtime in einem |
| **Database** | PostgreSQL (via Supabase) | Robust, RLS für Security, JSON-Support |
| **Auth** | Supabase Auth | Email/Magic Link + OAuth (Google/Apple) |
| **Storage** | Supabase Storage | File-Upload, CDN, RLS-Integration |
| **Realtime** | Supabase Realtime | WebSocket-basiert, Live-Wall-Updates |
| **Payment** | Stripe | Standard für SaaS, gute SDKs |
| **Styling (Web)** | Tailwind CSS + shadcn/ui | Utility-first, Copy/Paste-Components |
| **Styling (Mobile)** | NativeWind | Tailwind für React Native |
| **Video-Kompression** | @ffmpeg/ffmpeg (WebAssembly) | Browser-basiert, keine Server-Kosten |
| **Foto-Kompression** | browser-image-compression | Client-seitig, schnell, parallel-fähig |
| **Analytics** | PostHog | Open-Source, Self-hostable |
| **Deploy (Web)** | Vercel | Next.js-Optimiert, Zero-Config |
| **Deploy (Mobile)** | EAS (Expo) | OTA-Updates, einfache Builds |
| **Monorepo** | Turborepo | Schnelle Builds, Caching |

## 🛠️ MCP Server (Development Tools)

Dieses Projekt nutzt **Model Context Protocol (MCP) Server**, um Claude AI erweiterte Entwicklungs-Fähigkeiten zu geben, ohne dass du ständig manuelle Befehle ausführen musst.

### Verfügbare MCP Server

#### 1. **Chrome DevTools MCP Server** (`mcp__chrome-devtools__`)

**Zweck:** Automatisiertes Browser-Testing und UI-Debugging

**Capabilities:**
- Browser-Navigation und Page-Snapshots (Text + Screenshots)
- Element-Interaktionen (Click, Fill, Hover, Drag, etc.)
- Screenshot-Erstellung (Full-Page oder einzelne Elemente)
- Console-Logs und Network-Request-Monitoring
- Performance-Tracing und Core Web Vitals-Analyse
- Dialog-Handling, Form-Filling, File-Uploads

**Use Cases:**
- UI-Tests während der Entwicklung ("Teste die Login-Seite")
- Visual Regression Testing ("Mach einen Screenshot der Landing Page")
- Performance-Analysen ("Analysiere die Core Web Vitals")
- Debugging von Client-Side-Issues ("Öffne die Seite und prüfe Console-Errors")

**Beispiel-Workflows:**
```
Du: "Teste die neue Event-Erstellungs-Seite"
→ Claude öffnet Browser, navigiert zu /events/new, macht Snapshot,
  testet Formular-Funktionalität, erstellt Screenshot
```

#### 2. **Supabase MCP Server** (`mcp__supabase__`)

**Zweck:** Direkte Supabase-Integration ohne manuelle CLI-Befehle

**Capabilities:**
- **Projekt-Management**: Projekte/Organisationen auflisten, Details abrufen
- **Datenbank-Operationen**:
  - SQL direkt ausführen (`execute_sql`)
  - Migrations erstellen und anwenden (`apply_migration`)
  - Tabellen/Extensions/Migrations auflisten
  - TypeScript-Types generieren (`generate_typescript_types`)
- **Edge Functions**: Deployen, auflisten, Code abrufen
- **Monitoring**: Logs abrufen, Security/Performance-Advisors prüfen
- **Branch-Management**: Dev Branches erstellen, mergen, rebasen, resetten
- **API-Keys**: Project URL und Anon Key abrufen

**Use Cases:**
- Automatische Migration-Erstellung ("Füge ein 'description'-Feld zu 'events' hinzu")
- Schema-Änderungen ohne manuelle CLI-Nutzung
- Debugging von Produktionsdaten ("Zeige mir die letzten 10 Events")
- Edge Function Deployments ("Deploye die Email-Notification-Funktion")
- Type-Generierung nach Schema-Updates

**Beispiel-Workflows:**
```
Du: "Füge ein 'location' TEXT-Feld zur events-Tabelle hinzu"
→ Claude erstellt Migration, wendet sie an, generiert Types,
  updated shared/types/database.ts
```

### 🎯 Vorteile für die Entwicklung

**Als AI-Assistent habe ich direkten Zugriff auf beide MCP Server.** Das bedeutet:

✅ **Claude kann direkt:**
- Supabase-Datenbank inspizieren und Migrations erstellen
- Browser öffnen und Web-App testen (keine Screenshots von dir nötig)
- Performance-Probleme analysieren (Core Web Vitals, Traces)
- Schema-Änderungen vornehmen (Migration + Type-Gen in einem Schritt)
- Edge Functions deployen (ohne Supabase CLI lokal)
- SQL-Queries ausführen (Debugging, Datenanalyse)
- Security-Advisors prüfen (RLS-Policies, Performance-Issues)

❌ **Du musst NICHT mehr:**
- Manuell `supabase db push` ausführen → Claude macht es direkt
- Screenshots machen und hochladen → Claude öffnet selbst Browser
- SQL-Queries in Supabase Studio ausführen → Claude kann direkt SQL absetzen
- TypeScript-Types nach Schema-Änderungen generieren → Claude automatisiert es
- Supabase CLI für Edge Functions nutzen → Claude deployed direkt via MCP

### 📋 Best Practices für MCP-Nutzung

#### 1. **Automatische UI-Tests**
```
Prompt: "Teste die neue Login-Seite - prüfe ob alle Formularfelder funktionieren"

Claude wird:
1. Browser öffnen (mcp__chrome-devtools__new_page)
2. Zu /login navigieren
3. Snapshot nehmen (Text-basiert, schneller als Screenshot)
4. Formular ausfüllen und Submit testen
5. Console-Errors prüfen
6. Optional: Screenshot erstellen
```

#### 2. **Database-Migrations (End-to-End)**
```
Prompt: "Füge ein 'description' TEXT-Feld zur events-Tabelle hinzu"

Claude wird:
1. Migration erstellen (mcp__supabase__apply_migration)
2. Types neu generieren (mcp__supabase__generate_typescript_types)
3. Types in shared/types/database.ts mergen
4. Security-Advisors prüfen (mcp__supabase__get_advisors)
```

#### 3. **Performance-Analysen**
```
Prompt: "Analysiere die Performance der Landing Page"

Claude wird:
1. Performance-Trace starten (mcp__chrome-devtools__performance_start_trace)
2. Seite laden
3. Trace stoppen (mcp__chrome-devtools__performance_stop_trace)
4. Core Web Vitals + Insights liefern
```

#### 4. **Debugging mit Realtime-Daten**
```
Prompt: "Zeige mir alle Events mit status='active' und deren Host-Infos"

Claude wird:
1. SQL-Query ausführen (mcp__supabase__execute_sql)
2. Ergebnisse formatiert anzeigen
3. Optional: Probleme identifizieren (z.B. fehlende RLS-Policies)
```

### ⚙️ Konfiguration

Die MCP-Server sind bereits in `.mcp.json` konfiguriert (falls vorhanden). Claude hat automatisch Zugriff auf beide Server - keine manuelle Setup-Aktion nötig.

**Wichtig für Entwickler:**
- MCP Server laufen auf Claude-Seite, **nicht lokal**
- Supabase MCP benötigt Authentifizierung (über OAuth oder API-Key)
- Chrome DevTools MCP startet eigene Browser-Instanz (headless möglich)

## 🗄️ Datenbank-Schema

### Tabellen

#### 1. `profiles`
- **Zweck**: User-Profile (Hosts, extends Supabase auth.users)
- **Wichtige Felder**:
  - `id` (UUID, FK zu auth.users)
  - `email` (TEXT, UNIQUE)
  - `full_name` (TEXT, nullable)
  - `avatar_url` (TEXT, nullable)

#### 2. `events`
- **Zweck**: Event-Metadaten
- **Wichtige Felder**:
  - `id` (UUID, PK)
  - `host_user_id` (UUID, FK zu profiles)
  - `title` (TEXT)
  - `event_date` (TIMESTAMPTZ)
  - `event_code` (TEXT, UNIQUE) - 8-stelliger Code (z.B. "XJ3K9P2Q")
  - `qr_code_url` (TEXT) - URL zum generierten QR-Code
  - `settings` (JSONB) - EventSettings (maxGuests, autoApprove, etc.)
  - `status` (TEXT) - 'draft' | 'active' | 'archived'

**Standard-Settings:**
```json
{
  "maxGuests": 50,
  "maxStorageGB": 5,
  "autoApprove": false,
  "allowVideo": true,
  "allowPhoto": true,
  "allowText": true,
  "maxVideoDuration": 60,
  "maxPhotoSizeMB": 5,
  "shareExpireDays": 30
}
```

#### 3. `contributions`
- **Zweck**: Gast-Uploads (Videos, Fotos, Text)
- **Wichtige Felder**:
  - `id` (UUID, PK)
  - `event_id` (UUID, FK zu events)
  - `guest_name` (TEXT) - Anonymer Name vom Gast
  - `type` (TEXT) - 'video' | 'photo' | 'text'
  - `content_url` (TEXT, nullable) - Supabase Storage URL
  - `text_content` (TEXT, nullable) - Bei type='text'
  - `status` (TEXT) - 'pending' | 'approved' | 'rejected'
  - `duration_seconds` (INTEGER, nullable) - Bei Videos
  - `file_size_bytes` (BIGINT, nullable)

#### 4. `subscriptions`
- **Zweck**: Stripe-Abos
- **Wichtige Felder**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK zu profiles)
  - `stripe_customer_id` (TEXT, UNIQUE)
  - `stripe_subscription_id` (TEXT, UNIQUE)
  - `tier` (TEXT) - 'free' | 'premium'
  - `status` (TEXT) - 'active' | 'canceled' | 'past_due'

### Storage Buckets

1. **`event-media`** (public)
   - Videos + Fotos von Gästen
   - Pfad: `{eventId}/{contributionId}.{ext}`
   - RLS: Jeder kann hochladen, Hosts können löschen

2. **`qr-codes`** (public)
   - Generierte QR-Codes für Events
   - RLS: Hosts können erstellen, jeder kann lesen

3. **`exports`** (private)
   - ZIP/PDF-Exporte
   - RLS: Nur Host kann zugreifen

### Row Level Security (RLS)

**Wichtige Policies:**

- **events**:
  - Hosts können eigene Events CRUD
  - Jeder kann Events mit event_code lesen (für Gast-Zugriff)

- **contributions**:
  - Jeder kann INSERT (anonymer Gast-Upload)
  - Hosts können eigene Event-Contributions lesen/updaten/löschen
  - Jeder kann approved Contributions lesen (für Live-Wall)

- **profiles/subscriptions**:
  - User kann nur eigene Daten sehen/ändern

## 🔧 Entwicklungs-Workflows

### Setup (Erstes Mal)

```bash
# 1. Dependencies installieren
npm install

# 2. Supabase-Projekt erstellen
# - Gehe zu https://supabase.com
# - Erstelle neues Projekt
# - Kopiere URL + Anon Key

# 3. Migrations anwenden
cd packages/database
supabase link --project-ref YOUR_PROJECT_ID
supabase db push

# 4. Environment-Variablen setzen
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
# Trage Supabase-Credentials ein

# 5. Development starten
npm run dev
```

### Häufige Befehle

```bash
# Development (alle Apps)
npm run dev

# Nur Web
cd apps/web && npm run dev

# Nur Mobile
cd apps/mobile && npm start

# TypeScript-Checks
npm run check-types

# Linting
npm run lint

# Build (aktuell broken, siehe "Bekannte Probleme")
npm run build

# Nur Web builden
npx turbo build --filter=web

# Formatting
npm run format

# Dependencies hinzufügen
npm install <package> -w apps/web          # Zu Web-App
npm install <package> -w apps/mobile       # Zu Mobile-App
npm install <package> -w packages/shared   # Zu Shared-Package
```

### Database-Workflows

```bash
# Lokales Supabase starten
supabase start

# Migration erstellen
cd packages/database
supabase migration new <name>

# Migrations anwenden (lokal)
supabase db push

# Migrations anwenden (production)
supabase db push --linked

# TypeScript-Types generieren (nach Schema-Änderungen)
supabase gen types typescript --local > ../shared/src/types/database.gen.ts
# WICHTIG: Dann manuell in database.ts mergen (wir pflegen Types manuell für bessere Kontrolle)

# Supabase Studio öffnen (lokales Dashboard)
supabase studio
```

### Database-Migrations (via Supabase MCP)

Claude AI kann Migrations auch direkt über das Supabase MCP Server anwenden:

```typescript
// Migration erstellen und anwenden (via MCP)
mcp__supabase__apply_migration({
  project_id: 'hrabmghdoiywxbzxkpjm',
  name: 'migration_name',
  query: 'SQL...'
})

// Migrations auflisten
mcp__supabase__list_migrations({ project_id: 'hrabmghdoiywxbzxkpjm' })

// SQL direkt ausführen (für Testing)
mcp__supabase__execute_sql({
  project_id: 'hrabmghdoiywxbzxkpjm',
  query: 'SELECT...'
})
```

**Angewendete Migrations:**
1. `initial_schema` (20251022015648) - Tables, Indexes, Constraints
2. `row_level_security` (20251022015713) - RLS Policies für alle Tabellen
3. `storage_buckets` (20251022015737) - Storage Setup (event-media, qr-codes, exports)
4. `auto_create_profile_on_signup` (20251022032347) - Database Trigger für automatische Profil-Erstellung

### Neue UI-Komponenten (shadcn/ui)

```bash
cd apps/web

# Button
npx shadcn@latest add button

# Card
npx shadcn@latest add card

# Form
npx shadcn@latest add form

# Dialog
npx shadcn@latest add dialog

# etc. (siehe https://ui.shadcn.com)
```

### Installierte Dependencies (Web)

**Production:**
```bash
# Client-seitige Kompression
npm install @ffmpeg/ffmpeg @ffmpeg/util        # Video-Kompression (WebAssembly)
npm install browser-image-compression          # Foto-Kompression
```

**shadcn/ui Komponenten (bereits installiert):**
- `button`, `card`, `input`, `label`, `textarea`, `form`
- `badge`, `tabs`, `progress`, `dialog`

## 🎯 Architektur-Entscheidungen

### 1. **Warum Monorepo?**
   - **Code-Sharing**: Types, Utils, API-Clients zwischen Web + Mobile
   - **Atomic Changes**: Eine PR kann Web + Mobile + Types ändern
   - **Vereinfachtes Deployment**: Ein Repo, eine Version

### 2. **Warum Turborepo (nicht Nx/Lerna)?**
   - **Einfachheit**: Minimale Config, schneller Start
   - **Performance**: Intelligentes Caching
   - **Vercel-Integration**: Remote Caching out-of-the-box

### 3. **Warum Supabase (nicht Firebase/AWS)?**
   - **Postgres**: Echte relationale DB (bessere Queries)
   - **RLS**: Security auf DB-Level (kein Backend-Code nötig)
   - **Open-Source**: Selbst-hostbar, vendor-lock-in vermeidbar
   - **Realtime**: WebSocket-Support eingebaut

### 4. **Warum Next.js 14 App Router? (Downgrade von 15)**
   - **Production-Stabilität**: Next.js 15 hatte Prerendering-Issues in Monorepo-Setups
   - **Server Components**: Bessere Performance, weniger Client-JS
   - **Streaming**: Progressive Rendering
   - **Built-in Optimierungen**: Image, Font, Script-Optimierung
   - **SEO**: SSR out-of-the-box
   - **Lösung für Build-Errors**: Hybrid-Ansatz mit Pages Router `_error.js` + App Router

### 5. **Warum Expo (nicht React Native CLI)?**
   - **Managed Workflow**: Weniger Native-Code-Konfiguration
   - **OTA-Updates**: Hotfixes ohne App-Store-Review
   - **EAS Build**: Cloud-Builds ohne lokales Xcode/Android Studio
   - **Expo Router**: File-based Routing (wie Next.js)

### 6. **Warum NativeWind (nicht StyleSheet)?**
   - **Shared Design-System**: Gleiche Tailwind-Klassen wie Web
   - **Faster Iteration**: Utility-Classes statt separate StyleSheets
   - **Type-Safety**: TypeScript-Support für Klassen

### 7. **Client-seitige Video-Kompression (nicht Server)?**
   - **Kosten**: Keine Video-Processing-Server nötig
   - **Geschwindigkeit**: Parallele Uploads von mehreren Gästen
   - **Skalierung**: Kein Bottleneck bei vielen gleichzeitigen Uploads
   - **Libraries**:
     - Web: `ffmpeg.wasm` (Video), `browser-image-compression` (Fotos)
     - Mobile: `react-native-compressor`

### 8. **Route Groups für saubere URL-Struktur**
   - **Entscheidung**: Verwendung von Next.js Route Groups `(auth)`, `(dashboard)`, `(public)`
   - **Vorteile**:
     - URLs bleiben clean (z.B. `/login` statt `/auth/login`)
     - Separate Layouts für verschiedene Bereiche
     - Einfachere Middleware-Logik (Protected vs. Public Routes)
   - **Struktur**:
     - `(auth)`: Login, Signup mit zentriertem Layout
     - `(dashboard)`: Dashboard, Events (Hosts only, Auth required)
     - `(public)`: Gast-Upload-Seiten `/e/[eventCode]` (keine Auth)

### 9. **Supabase Realtime für Live-Updates**
   - **Entscheidung**: Verwendung von Supabase Realtime für Live-Wall und Moderation
   - **Vorteile**:
     - **Keine Polling**: WebSocket-basiert, effizient, Echtzeit
     - **Auto-Synchronisation**: State-Updates ohne manuelle Refresh
     - **Skalierbar**: Supabase managed die Infrastruktur
     - **Einfache API**: `.on('postgres_changes', ...)` Pattern
   - **Use Cases**:
     - Live-Wall: Neue approved Beiträge erscheinen automatisch
     - Moderation: Neue Uploads erscheinen sofort im "Wartend"-Tab
     - Multi-User: Mehrere Hosts können gleichzeitig moderieren
   - **Implementation**:
     ```typescript
     const channel = supabase
       .channel(`contributions:${eventId}`)
       .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'contributions',
         filter: `event_id=eq.${eventId}`
       }, (payload) => {
         // Handle INSERT, UPDATE, DELETE
       })
       .subscribe();
     ```

### 10. **Hybrid App Router + Pages Router für Error-Handling**
   - **Entscheidung**: Verwendung beider Router (Next.js App Router + Pages Router) im gleichen Projekt
   - **Problem**: Next.js 15 hatte Prerendering-Fehler bei Error-Pages (styled-jsx useContext-Bug)
   - **Lösung**:
     - **App Router** für alle normalen Pages (`app/` Directory)
     - **Pages Router** nur für `_error.js` und `_document.js` (`pages/` Directory)
   - **Vorteile**:
     - Umgeht Next.js Default Error-Pages mit styled-jsx
     - Volle Kontrolle über Error-Rendering
     - Production-Builds funktionieren ohne Prerendering-Errors
   - **Implementiert**:
     - `pages/_error.js`: Custom Error Page ohne styled-jsx
     - `pages/_document.js`: Custom Document ohne StyleRegistry
   - **Status**: Funktioniert mit Next.js 14.2.21 + Vercel

## 🚀 Implementierungs-Phasen

### ✅ Phase 1: Foundation (ABGESCHLOSSEN)
- [x] Turborepo-Setup
- [x] Next.js + Expo-Apps
- [x] Supabase-Schema + Migrations
- [x] Shared Types Package
- [x] Tailwind + shadcn/ui (Web)
- [x] NativeWind (Mobile)
- [x] Supabase Clients

### ✅ Phase 2: Auth + Event-Setup (ABGESCHLOSSEN)
- [x] Supabase Auth-Integration (Email/Magic Link + Password)
- [x] Login/Signup-Flows (Web)
- [x] Event-Erstellungs-Formular
- [x] Event-Code-Generierung (8-stellig: XXX-XXXXX)
- [x] Event-Detail-Seite (Host-View)
- [x] Dashboard mit Stats
- [x] Protected Routes (Middleware)
- [x] Logout-Funktionalität

**Implementiert:**
- Login-Seite: `apps/web/app/(auth)/login/page.tsx`
- Signup-Seite: `apps/web/app/(auth)/signup/page.tsx`
- Auth Callback: `apps/web/app/auth/callback/route.ts`
- Dashboard: `apps/web/app/(dashboard)/dashboard/page.tsx`
- Event-Formular: `apps/web/app/(dashboard)/events/new/page.tsx`
- Event-Detail: `apps/web/app/(dashboard)/events/[id]/page.tsx`
- Event-Code-Generator: `packages/shared/src/lib/event-code.ts`
- Middleware mit Auth-Check: `apps/web/middleware.ts`

**Test-Credentials:**
- Email: `testuser@gmail.com`
- Password: `password123`
- Test-Event-Code: `A3K-9P2QM`

### ✅ Phase 3: Gast-Upload-Flow (ABGESCHLOSSEN)
- [x] Event-Liste-Seite (`/events`)
- [x] Öffentliche Gast-Seite (`/e/[eventCode]`)
- [x] Video/Foto/Text-Upload-Komponenten
- [x] Client-seitige Kompression
- [x] Progress-Indicator
- [x] Error-Handling (File too large, etc.)

**Implementiert:**
- Event-Liste: `apps/web/app/(dashboard)/events/page.tsx`
- Gast-Upload-Seite: `apps/web/app/(public)/e/[eventCode]/page.tsx`
- Upload-Form: `apps/web/app/(public)/e/[eventCode]/guest-upload-form.tsx`
- Video-Upload: `apps/web/app/(public)/e/[eventCode]/video-upload.tsx` (mit ffmpeg.wasm)
- Foto-Upload: `apps/web/app/(public)/e/[eventCode]/photo-upload.tsx` (mit browser-image-compression)
- Text-Upload: `apps/web/app/(public)/e/[eventCode]/text-upload.tsx`

**Technologien:**
- Client-seitige Video-Kompression: `@ffmpeg/ffmpeg` + `@ffmpeg/util`
- Client-seitige Foto-Kompression: `browser-image-compression`
- Progress-Tracking: shadcn/ui Progress-Komponente
- Tab-Navigation: shadcn/ui Tabs-Komponente

**Test:**
- Gast-Upload-URL: http://localhost:3000/e/A3K-9P2QM

### ✅ Phase 4: Live-Wall (ABGESCHLOSSEN)
- [x] Supabase Realtime Subscription
- [x] Slideshow-Komponente (Auto-Rotation)
- [x] Galerie-Grid-Ansicht
- [x] Fullscreen-Modus
- [x] Filter (nur approved)
- [x] View-Mode Toggle (Slideshow vs Grid)
- [x] Play/Pause für Slideshow
- [x] Manuelle Navigation (Vor/Zurück)

**Implementiert:**
- Live-Wall-Seite: `apps/web/app/(dashboard)/events/[id]/wall/page.tsx`
- Live-Wall-Komponente: `apps/web/app/(dashboard)/events/[id]/wall/live-wall.tsx`
- Slideshow: `apps/web/app/(dashboard)/events/[id]/wall/slideshow.tsx`
- Galerie: `apps/web/app/(dashboard)/events/[id]/wall/gallery.tsx`

**Features:**
- **Slideshow-Modus**: Auto-Rotation alle 8 Sekunden, Play/Pause, manuelle Navigation
- **Galerie-Modus**: Grid-Layout mit Modal-Ansicht für Full-Size-Vorschau
- **Fullscreen**: Vollbild-Modus für beide Ansichten
- **Realtime**: Neue approved Beiträge erscheinen automatisch ohne Reload
- **Progress-Indicator**: Visueller Fortschritt im Slideshow-Modus

**Test:**
- Live-Wall-URL: http://localhost:3000/events/656282ac-99d8-4e0e-85c5-a6fc60d99561/wall

### ✅ Phase 5: Moderation (ABGESCHLOSSEN)
- [x] Host-Dashboard mit Pending-Beiträgen
- [x] Approve/Reject/Delete-Actions
- [x] Real-time Benachrichtigungen
- [x] Tab-basierte Navigation (Wartend/Freigegeben/Abgelehnt)
- [x] Preview für alle Medientypen

**Implementiert:**
- Moderation-Seite: `apps/web/app/(dashboard)/events/[id]/moderate/page.tsx`
- Moderation-Komponente: `apps/web/app/(dashboard)/events/[id]/moderate/moderation-view.tsx`

**Features:**
- **Drei Tabs**: Wartend, Freigegeben, Abgelehnt mit Badge-Counts
- **Actions**: Approve, Reject, Delete für jeden Beitrag
- **Realtime**: Neue Uploads erscheinen sofort im "Wartend"-Tab
- **Preview**: Inline-Vorschau für Videos, Fotos und Texte
- **Status-Updates**: Beiträge können zwischen Status verschoben werden

**Test:**
- Moderation-URL: http://localhost:3000/events/656282ac-99d8-4e0e-85c5-a6fc60d99561/moderate

### ✅ Phase 6: Export (ABGESCHLOSSEN)
- [x] ZIP-Download (Server-Side via Next.js API Route)
- [x] PDF-Generierung (jsPDF)
- [x] Share-Seite (`/share/[eventId]`)
- [x] E-Mail-Benachrichtigungen (Supabase Edge Function + Resend)

**Implementiert:**
- ZIP-Export API: `apps/web/app/api/events/[eventId]/export/route.ts`
- Export-Button: `apps/web/app/(dashboard)/events/[id]/export-button.tsx`
- PDF-Export-Button: `apps/web/app/(dashboard)/events/[id]/pdf-export-button.tsx`
- Share-Seite: `apps/web/app/(public)/share/[eventId]/page.tsx`
- Share-Gallery: `apps/web/app/(public)/share/[eventId]/share-gallery.tsx`
- Share-Link-Button: `apps/web/app/(dashboard)/events/[id]/share-link-button.tsx`
- Email Edge Function: `supabase/functions/send-event-email/index.ts`

**Features:**
- **ZIP-Download**: Server-seitig, lädt alle approved Media-Dateien + Texte, strukturiert in Ordnern
- **PDF-Export**: Client-seitig mit jsPDF, listet alle Beiträge mit Metadaten und Links
- **Share-Seite**: Öffentliche Galerie für approved Beiträge, Filter nach Typ, Expiry-Check (30 Tage)
- **E-Mail-Notifications**: Edge Function für event_complete, export_ready, new_contribution

**Dependencies:**
- `archiver` + `@types/archiver` (ZIP-Erstellung)
- `jspdf` (PDF-Generierung)
- Resend API (E-Mail-Versand via Edge Function)

**Test:**
- Export-Buttons: http://localhost:3000/events/656282ac-99d8-4e0e-85c5-a6fc60d99561
- Share-Seite: http://localhost:3000/share/656282ac-99d8-4e0e-85c5-a6fc60d99561

### ✅ Phase 7: UX-Verbesserungen & Polish (ABGESCHLOSSEN)
- [x] Copy-Buttons für Event-Code und Gast-Link
- [x] Toast-Notifications (Sonner) global
- [x] Link-Navigation Fix (Event-Liste → Event-Details)
- [x] QR-Code-Generierung (automatisch bei Event-Erstellung)
- [x] Video/Foto/Text-Upload mit Toast-Notifications
- [x] Event-Formular mit Success-Toast

**Implementiert:**
- Copy-Button-Komponente: `apps/web/components/copy-button.tsx`
- QR-Code-Utilities: `apps/web/lib/qr-code.ts`
- Toaster in Layout: `apps/web/app/layout.tsx`
- QR-Code-Integration: `apps/web/app/(dashboard)/events/new/event-form.tsx`
- Toast-Integration: Text-Upload, Video-Upload, Event-Formular

**Features:**
- **Copy-Buttons**: Kopieren mit Clipboard API, Feedback via Toast + Button-Text ("✓ Kopiert")
- **Toast-Notifications**: Konsistente Success/Error-Meldungen überall, Auto-Dismiss, Non-intrusive
- **QR-Code**: Automatische Generierung (512x512px PNG), Upload zu Supabase Storage, Anzeige auf Event-Detail-Seite
- **Improved UX**: Alle Uploads zeigen Toasts, keine inline Error/Success-Messages mehr

**Dependencies:**
- `sonner` (Toast-Notifications via shadcn/ui)
- `qrcode` + `@types/qrcode` (QR-Code-Generierung)

**Test:**
- QR-Code sichtbar bei neuen Events (z.B. http://localhost:3000/events/5f8f0771-d82a-4c91-a8af-b7673d582926)
- Copy-Buttons funktionieren mit Toast-Feedback
- Video/Text-Upload zeigt Success-Toasts

### Phase 8: Stripe Payment (TODO)
- [ ] Subscription-Tiers (Free/Premium)
- [ ] Checkout-Flow (Web)
- [ ] In-App-Purchase-Flow (Mobile)
- [ ] Webhook-Handler
- [ ] Upgrade-Prompts

### ✅ Phase 9: Production Deployment (ABGESCHLOSSEN)
- [x] GitHub Repository Setup
- [x] Vercel Deployment
- [x] Environment Variables konfiguriert
- [x] Build-Errors behoben (Next.js 14 Downgrade + Hybrid Router)
- [x] Production Build erfolgreich
- [ ] PostHog-Analytics (TODO)
- [ ] DSGVO-Cookie-Banner (TODO)
- [ ] Offline-Hinweis (TODO)
- [ ] EAS-Build (Mobile, TODO)
- [ ] App-Store-Submissions (Mobile, TODO)

**Implementiert:**
- GitHub Repo: https://github.com/dulemin/TechMemory
- Vercel Live-URL: https://tech-memory-web.vercel.app (automatisch bei Git Push)
- Continuous Deployment: Jeder Push zu `main` triggert automatischen Vercel Build
- Environment Variables: Supabase URL + ANON_KEY in Vercel konfiguriert
- Build-Lösung: Next.js 14.2.21 + Hybrid App/Pages Router für Error-Handling

**Deployment-Workflow:**
```bash
# Code ändern
git add .
git commit -m "feat: neue Feature"
git push origin main

# Vercel deployt automatisch innerhalb ~2 Minuten
# URL: https://tech-memory-web.vercel.app
```

## 🐛 Bekannte Probleme

### ✅ Behobene Probleme

#### 1. ZIP-Export API Route 404-Fehler (BEHOBEN)
**Problem:** API Route wurde nicht gefunden (404)

**Ursache:** Datei wurde im falschen Verzeichnis erstellt (Root statt `apps/web/app/api/`)

**Lösung:** Datei korrekt nach `apps/web/app/api/events/[eventId]/export/route.ts` verschoben

**Status:** ✅ Behoben - ZIP-Export funktioniert

#### 2. QR-Code fehlt bei alten Events (ERKLÄRT)
**Problem:** Alte Events zeigen "QR-Code wird in Kürze verfügbar sein"

**Ursache:** QR-Code-Generierung wurde erst nachträglich implementiert

**Lösung:** Nur neue Events (erstellt nach QR-Code-Implementation) haben automatisch QR-Codes

**Workaround:** Neues Event erstellen oder QR-Code nachträglich generieren (Feature könnte hinzugefügt werden)

**Status:** ✅ Erwartet - Funktioniert für neue Events

#### 3. Profil wird bei Signup nicht automatisch erstellt (BEHOBEN)
**Problem:** Bei der User-Registrierung wurde kein Profil in der `profiles`-Tabelle erstellt

**Ursache:** Fehlender Database Trigger

**Lösung:** Migration `auto_create_profile_on_signup` erstellt mit Trigger-Funktion `handle_new_user()`

**Status:** ✅ Behoben - Profile werden jetzt automatisch erstellt

#### 4. FFmpeg Server-Side Rendering Error (BEHOBEN)
**Problem:** `Error: ffmpeg.wasm does not support nodejs` - Page gibt 500 Error

**Ursache:** FFmpeg wurde beim Component-Import initialisiert, aber Next.js macht SSR

**Lösung:** FFmpeg nur im Browser initialisieren (useEffect)

**Status:** ✅ Behoben in `video-upload.tsx`

#### 5. TypeScript-Errors nach Toast-Integration (BEHOBEN)
**Problem:** 30+ TypeScript-Errors nach Refactoring (error/success Variablen, undefined Types, etc.)

**Ursache:**
- Nicht entfernte `error`/`success` State-Variablen in `video-upload.tsx`
- `undefined` als Font-Parameter in `pdf-export-button.tsx`
- Fehlende Type Guards in `export/route.ts`
- Doppelte `generateEventCode` Exports
- FFmpeg FileData Type-Inkompatibilität

**Lösung:**
- `error`/`success` Variablen und JSX entfernt
- `undefined` → `'helvetica'` (6 Stellen in PDF-Export)
- Type Guard `contribType` für `contribution.type` hinzugefügt
- Duplicate Export aus `lib/supabase.ts` entfernt
- FFmpeg FileData mit `as unknown as ArrayBuffer` gecastet
- Optional Chaining in `qr-code.ts` hinzugefügt
- Doppelte API-Route-Verzeichnisse entfernt

**Status:** ✅ Behoben - 0 TypeScript-Errors (außer shadcn/ui React-Type-Warnings)

#### 6. Next.js 15 Production Build Prerendering-Fehler (BEHOBEN)

**Problem:**
```
Error occurred prerendering page "/404"
[TypeError: Cannot read properties of null (reading 'useContext')]
```

**Ursache:** Next.js 15 hatte einen Bug mit styled-jsx und Server-Side Rendering in Monorepo-Setups

**Lösung (2-stufig):**
1. **Downgrade auf Next.js 14.2.21** (stabile Version ohne Prerendering-Bug)
   ```bash
   # In apps/web/package.json
   "next": "14.2.21"  # statt "^15.5.0"
   ```

2. **Hybrid Router-Ansatz** (App Router + Pages Router)
   - App Router für normale Pages (`app/` Directory)
   - Pages Router nur für Error-Handling (`pages/_error.js`, `pages/_document.js`)
   - Vermeidet Next.js Default Error-Pages mit styled-jsx

**Implementiert:**
- `apps/web/package.json`: Next.js 14.2.21
- `apps/web/pages/_error.js`: Custom Error Page ohne styled-jsx
- `apps/web/pages/_document.js`: Custom Document ohne StyleRegistry
- `apps/web/next.config.js`: Vereinfachte Config ohne Next.js 15-spezifische Optionen

**Status:** ✅ Behoben - Vercel Production Builds erfolgreich

### ⚠️ Aktive Probleme

*Keine aktiven Build-Blocker - alle kritischen Probleme behoben!*

### 📚 Troubleshooting & Best Practices

#### TypeScript-Errors beim Shared Package

**Symptom:**
```
Cannot find module '@event-guestbook/shared' or its corresponding type declarations
```

**Lösung:**
```bash
# Dependencies installieren
npm install

# TypeScript-Server neu starten (in VSCode)
CMD+Shift+P → "TypeScript: Restart TS Server"
```

#### Supabase Client "window is not defined" (SSR)

**Problem:** Falscher Supabase Client für Server/Client Components

**Best Practice:**
```typescript
// ✅ Server Component
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('events').select();
  // ...
}

// ✅ Client Component
'use client';
import { createClient } from '@/lib/supabase/client';

export default function Component() {
  const supabase = createClient();
  // ...
}
```

#### FFmpeg.wasm Initial Load

**Verhalten:** FFmpeg.wasm (~30MB) wird beim ersten Video-Upload geladen

**Hinweis:** Normales Verhalten für WebAssembly-basierte Kompression

**Details:**
- Loading-Indicator wird automatisch angezeigt
- FFmpeg wird nur geladen, wenn Video-Upload genutzt wird
- Bei Videos <10MB wird Kompression übersprungen
- Erster Upload kann ~5-10 Sekunden länger dauern

## 📝 Code-Conventions

### Naming
- **Dateien**: kebab-case (`event-card.tsx`)
- **Komponenten**: PascalCase (`EventCard`)
- **Funktionen**: camelCase (`createEvent`)
- **Konstanten**: UPPER_SNAKE_CASE (`DEFAULT_EVENT_SETTINGS`)
- **Types/Interfaces**: PascalCase (`Event`, `CreateEventRequest`)

### Komponenten-Struktur

```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Event } from '@event-guestbook/shared';

// 2. Types
interface EventCardProps {
  event: Event;
  onDelete: (id: string) => void;
}

// 3. Component
export function EventCard({ event, onDelete }: EventCardProps) {
  // 3a. Hooks
  const [isDeleting, setIsDeleting] = useState(false);

  // 3b. Handlers
  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(event.id);
    setIsDeleting(false);
  };

  // 3c. Render
  return (
    <div className="border rounded-lg p-4">
      <h3>{event.title}</h3>
      <Button onClick={handleDelete} disabled={isDeleting}>
        Delete
      </Button>
    </div>
  );
}
```

### API Routes (Next.js)

```typescript
// apps/web/app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateEventRequest, ApiError } from '@event-guestbook/shared';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Auth-Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json<ApiError>(
        { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. Validate Input
    const body: CreateEventRequest = await request.json();
    // ... validation

    // 3. Database Operation
    const { data, error } = await supabase
      .from('events')
      .insert({ ...body, host_user_id: user.id })
      .select()
      .single();

    if (error) throw error;

    // 4. Return Response
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json<ApiError>(
      { code: 'INTERNAL_ERROR', message: 'Failed to create event' },
      { status: 500 }
    );
  }
}
```

### Upload-Pattern (Client-seitige Kompression + Supabase Storage)

**Wichtiges Pattern für alle File-Uploads:**

```typescript
// 1. Contribution-Eintrag ZUERST erstellen (um ID zu bekommen)
const { data: contribution, error } = await supabase
  .from('contributions')
  .insert({
    event_id: eventId,
    guest_name: guestName,
    type: 'video', // oder 'photo'
    status: 'pending',
    file_size_bytes: compressedFile.size,
  })
  .select()
  .single();

// 2. Datei mit contribution.id benennen
const fileName = `${contribution.id}.mp4`;
const filePath = `${eventId}/${fileName}`;

// 3. Upload zu Supabase Storage
const { error: uploadError } = await supabase.storage
  .from('event-media')
  .upload(filePath, compressedFile);

// 4. Public URL holen und in contribution speichern
const { data: urlData } = supabase.storage
  .from('event-media')
  .getPublicUrl(filePath);

await supabase
  .from('contributions')
  .update({ content_url: urlData.publicUrl })
  .eq('id', contribution.id);
```

**Warum diese Reihenfolge?**
- Contribution-ID wird für eindeutigen Dateinamen benötigt
- Vermeidet Orphan-Files im Storage (wenn Upload fehlschlägt)
- URL-Update ist idempotent (kann wiederholt werden)

## 🔐 Environment-Variablen

### Web (`apps/web/.env.local`)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Mobile (`apps/mobile/.env`)
```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# PostHog
EXPO_PUBLIC_POSTHOG_KEY=phc_xxx
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**WICHTIG:** Niemals `STRIPE_SECRET_KEY` in Client-Code verwenden!

## 🌐 Production Deployment

### GitHub Repository
- **URL**: https://github.com/dulemin/TechMemory
- **Branch Strategy**: `main` Branch = Production
- **Workflow**: Feature-Branches → PR → Merge zu `main` → Auto-Deploy

### Vercel Deployment

#### Setup (bereits erledigt)
1. **GitHub Integration**: Vercel App mit GitHub Repository verbunden
2. **Root Directory**: `apps/web` (Monorepo-Setup)
3. **Environment Variables** in Vercel Dashboard konfiguriert:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Automatic Deployments**: Jeder Push zu `main` triggert Build

#### Live-URLs
- **Production**: https://tech-memory-web.vercel.app
- **Preview Deployments**: Automatisch für Pull Requests (z.B. `tech-memory-git-feature-xyz.vercel.app`)

#### Deployment-Workflow
```bash
# Lokale Änderungen
git add .
git commit -m "feat(web): neue Feature"
git push origin main

# Vercel reagiert automatisch:
# 1. Detects Push zu main
# 2. Startet Build (~2-3 Minuten)
# 3. Deployt zu Production URL
# 4. Sendet Deployment-Benachrichtigung
```

#### Build-Konfiguration (Vercel)
```json
{
  "buildCommand": "turbo run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "nodeVersion": "22.x"
}
```

#### Troubleshooting Vercel Builds

**Problem: Build schlägt fehl mit "Module not found"**
- **Ursache**: Monorepo Dependencies nicht installiert
- **Lösung**: Vercel installiert automatisch im Root (`npm install --prefix=../..`)

**Problem: Environment Variables fehlen**
- **Lösung**: In Vercel Dashboard → Settings → Environment Variables prüfen
- **Test**: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)` in Code

**Problem: Prerendering-Fehler**
- **Lösung**: Siehe "Bekannte Probleme" → Next.js 15 Build-Fehler (bereits behoben)

### Vercel CLI (Optional)

```bash
# Vercel CLI installieren
npm install -g vercel

# Lokalen Preview-Build testen
cd apps/web
vercel dev

# Manuelles Deployment (falls nötig)
vercel --prod
```

### Deployment-Checklist

**Vor jedem Production-Push:**
- [ ] TypeScript-Checks lokal erfolgreich (`npm run check-types`)
- [ ] Lokal getestet (`npm run dev`)
- [ ] Keine `.env` Dateien im Commit
- [ ] CLAUDE.md updated (bei Architektur-Änderungen)

**Nach Deployment:**
- [ ] Vercel Build-Log prüfen (grünes ✓)
- [ ] Production-URL aufrufen und Smoke-Test
- [ ] Supabase-Connection testen (Login/Dashboard)

### Rollback-Strategie

**Bei fehlerhaftem Deployment:**
1. Gehe zu Vercel Dashboard → Deployments
2. Finde letztes funktionierendes Deployment
3. Klicke auf "..." → "Promote to Production"
4. Fixe Bug lokal, push neuen Commit

**Alternatv (Git Revert):**
```bash
git revert HEAD
git push origin main
# Vercel deployt automatisch den Revert
```

## 🤖 Prompt-Templates für AI-Assistenten

### Neue Feature implementieren

```
Ich möchte Feature X implementieren:
- [Feature-Beschreibung]
- Betroffene Plattformen: [Web/Mobile/Beide]
- Phase: [2-8]

Bitte:
1. Prüfe CLAUDE.md für Architektur-Entscheidungen
2. Erstelle benötigte Components/Pages
3. Füge Types zu packages/shared hinzu (falls nötig)
4. Implementiere API Routes (falls nötig)
5. Teste TypeScript-Checks
6. Update CLAUDE.md mit neuen Entscheidungen (falls relevant)
```

### Bug fixen

```
Bug: [Beschreibung]
- Plattform: [Web/Mobile]
- Schritte zur Reproduktion: [...]
- Erwartetes Verhalten: [...]
- Aktuelles Verhalten: [...]

Bitte:
1. Prüfe bekannte Probleme in CLAUDE.md
2. Analysiere den Code
3. Schlage Fix vor
4. Implementiere Fix
5. Update CLAUDE.md (falls neues bekanntes Problem)
```

### Refactoring

```
Ich möchte [Code/Component] refactoren:
- Grund: [Performance/Lesbarkeit/DRY/etc.]
- Betroffene Dateien: [...]

Bitte:
1. Prüfe Code-Conventions in CLAUDE.md
2. Schlage Refactoring-Ansatz vor
3. Implementiere schrittweise
4. Stelle sicher, dass TypeScript-Checks grün sind
```

## 📚 Wichtige Links

- **Projekt-Repo**: (noch nicht erstellt)
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Vercel Dashboard**: (nach Deploy)
- **Expo Dashboard**: https://expo.dev

### Dokumentation
- Next.js: https://nextjs.org/docs
- Expo: https://docs.expo.dev
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- NativeWind: https://www.nativewind.dev
- Stripe: https://stripe.com/docs
- Turborepo: https://turbo.build/repo/docs

## 🎓 Onboarding für neue Entwickler

### Tag 1: Setup + Verstehen
1. README.md lesen
2. **CLAUDE.md lesen** (diese Datei!)
3. Setup durchführen (siehe "Setup")
4. `npm run dev` starten, beide Apps öffnen
5. Datenbank-Schema in `packages/database/migrations/` ansehen
6. Types in `packages/shared/src/types/` ansehen

### Tag 2: Kleine Änderung
1. Neue shadcn/ui-Komponente hinzufügen (z.B. Button)
2. Button auf Landing Page (`apps/web/app/page.tsx`) verwenden
3. TypeScript-Checks laufen lassen
4. Commit erstellen

### Tag 3: Feature implementieren
1. Kleine Feature aus Phase 2 picken (z.B. Event-Liste-Komponente)
2. Component erstellen
3. Mit Dummy-Daten testen
4. PR erstellen

## 🔄 Git-Workflow (für später)

```bash
# Feature-Branch erstellen
git checkout -b feature/event-creation

# Entwickeln, committen
git add .
git commit -m "feat(web): add event creation form"

# Vor Push: Checks laufen lassen
npm run check-types
npm run lint

# Push + PR
git push origin feature/event-creation
```

### Commit-Message-Convention

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scopes: web, mobile, shared, database, docs

Beispiele:
feat(web): add event creation form
fix(mobile): resolve camera permission issue
docs(readme): update setup instructions
refactor(shared): extract event validation logic
```

---

**Letzte Aktualisierung:** 2025-10-22 (06:30 Uhr)
**Status:** Phase 9 (Production Deployment) abgeschlossen ✅ | App ist LIVE auf Vercel 🎉
**Maintainer:** Claude AI + Developer Team
**MCP Server:** Chrome DevTools + Supabase (aktiviert)
**Database Migrations:** 4 Migrations angewendet (initial_schema, row_level_security, storage_buckets, auto_create_profile_on_signup)

**Production-URLs:**
- **🌐 LIVE APP**: https://tech-memory-web.vercel.app
- **GitHub Repo**: https://github.com/dulemin/TechMemory
- **Vercel Dashboard**: https://vercel.com/dulemin/tech-memory-web

**Local Development URLs:**
- Landing Page: http://localhost:3000
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
- Event-Liste: http://localhost:3000/events
- Event-Details: http://localhost:3000/events/656282ac-99d8-4e0e-85c5-a6fc60d99561
- **Gast-Upload** (öffentlich): http://localhost:3000/e/A3K-9P2QM
- **Moderation**: http://localhost:3000/events/656282ac-99d8-4e0e-85c5-a6fc60d99561/moderate
- **Live-Wall**: http://localhost:3000/events/656282ac-99d8-4e0e-85c5-a6fc60d99561/wall
- **Share-Seite** (öffentlich): http://localhost:3000/share/656282ac-99d8-4e0e-85c5-a6fc60d99561

**Deployment-Changelog (22.10.2025):**
- ✅ Next.js 14.2.21 (downgrade von 15.5.0 wegen Build-Issues)
- ✅ Hybrid App/Pages Router für Error-Handling
- ✅ GitHub Integration + Auto-Deploy
- ✅ Vercel Build erfolgreich (~35 Sekunden)
- ✅ Environment Variables konfiguriert
- ✅ Middleware + Toaster funktionieren in Production
