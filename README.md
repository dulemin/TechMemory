# Event Guestbook Lite

Digitales Gästebuch für Events wie Hochzeiten und Partys. Gäste können per QR-Code oder Link Videos, Fotos und Nachrichten hochladen. Echtzeit-Anzeige der Beiträge als Live-Wall während des Events.

## 🚀 Features

- **Event-Setup**: Event in unter 30 Sekunden erstellen, QR-Code generieren
- **Gast-Uploads**: Video (60s), Fotos (5MB), Text-Nachrichten - alles browser-basiert
- **Live-Wall**: Echtzeit-Slideshow der Beiträge während des Events
- **Moderation**: Host kann Beiträge freigeben/ablehnen
- **Export**: ZIP/PDF-Download der Erinnerungen, Share-Seite (30 Tage)
- **Monetarisierung**: Stripe-Integration für Premium-Features

## 📂 Projekt-Struktur

```
event-guestbook/
├── apps/
│   ├── web/              # Next.js Web-App (Host-Dashboard + Gast-Seite)
│   └── mobile/           # Expo React Native App (Host-Management)
├── packages/
│   ├── shared/           # TypeScript Types, API-Client, Utils
│   ├── database/         # Supabase Migrations
│   └── ui/               # Shared UI Components
└── supabase/             # Edge Functions (für später)
```

## 🛠️ Tech Stack

| Layer | Technologie |
|-------|------------|
| **Mobile** | Expo (React Native) |
| **Web** | Next.js 15 |
| **Backend** | Supabase (Postgres + Auth + Storage + Realtime) |
| **Payment** | Stripe (Web SDK + React Native SDK) |
| **Styling** | Tailwind + shadcn/ui (Web), NativeWind (Mobile) |
| **Analytics** | PostHog |
| **Deploy** | Vercel (Web), EAS (Mobile) |

## 🏁 Quick Start

### Voraussetzungen

- Node.js 18+
- npm 10+
- Expo CLI (optional, für Mobile-Development)

### 1. Installation

```bash
# Dependencies installieren
npm install

# Supabase CLI installieren (falls noch nicht vorhanden)
npm install -g supabase
```

### 2. Supabase Setup

```bash
# Supabase-Projekt erstellen auf supabase.com
# Projekt-URL und Anon-Key kopieren

# Lokales Supabase starten (optional für Entwicklung)
supabase init
supabase start

# Migrations anwenden
cd packages/database
supabase db push
```

### 3. Umgebungsvariablen

```bash
# Web App
cp apps/web/.env.example apps/web/.env.local
# Trage deine Supabase-Credentials ein

# Mobile App
cp apps/mobile/.env.example apps/mobile/.env
# Trage deine Supabase-Credentials ein
```

### 4. Development starten

```bash
# Alle Apps gleichzeitig starten
npm run dev

# Nur Web-App
cd apps/web && npm run dev

# Nur Mobile-App
cd apps/mobile && npm start
```

## 📱 Mobile App (Expo)

### iOS Simulator

```bash
cd apps/mobile
npm run ios
```

### Android Emulator

```bash
cd apps/mobile
npm run android
```

### Expo Go (Physisches Gerät)

1. Expo Go App installieren ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. QR-Code scannen nach `npm start`

## 🗄️ Datenbank-Schema

Siehe `packages/database/migrations/` für das vollständige Schema:

- **profiles** - User-Profile (Hosts)
- **events** - Event-Metadaten, Settings, QR-Code
- **contributions** - Gast-Uploads (Video/Foto/Text)
- **subscriptions** - Stripe-Abos (Free/Premium)

### Lokale Typen generieren

```bash
# Nach Schema-Änderungen
supabase gen types typescript --local > packages/shared/src/types/database.gen.ts
```

## 🎨 UI Components (shadcn/ui)

```bash
# Neue shadcn/ui-Komponente hinzufügen
cd apps/web
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

## 📦 Package-Management

Dieses Projekt nutzt **npm workspaces** und **Turborepo** für Monorepo-Management.

```bash
# Dependencies zu specific Package hinzufügen
npm install <package> -w apps/web
npm install <package> -w apps/mobile

# Shared Package nutzen
npm install @event-guestbook/shared -w apps/web
```

## 🧪 Testing & Build

```bash
# TypeScript-Checks
npm run check-types

# Lint
npm run lint

# Build (alle Apps)
npm run build

# Format
npm run format
```

## 🚢 Deployment

### Web (Vercel)

1. Projekt in Vercel importieren
2. Root-Directory: `apps/web`
3. Environment-Variablen setzen
4. Deploy!

### Mobile (EAS)

```bash
cd apps/mobile

# EAS-Projekt initialisieren
npx eas init

# iOS Build
npx eas build --platform ios

# Android Build
npx eas build --platform android

# App Store / Play Store Submit
npx eas submit
```

## 💳 Stripe-Integration

1. Stripe-Account erstellen
2. Publishable Key & Secret Key kopieren
3. Webhook-Endpoint konfigurieren: `https://your-domain.com/api/webhooks/stripe`
4. Products & Prices in Stripe Dashboard erstellen
5. Environment-Variablen setzen

## 📊 PostHog Analytics

1. PostHog-Account erstellen (posthog.com)
2. API-Key kopieren
3. In `.env` files eintragen
4. Events werden automatisch getrackt

## 🐛 Troubleshooting

### Metro Bundler Cache (Mobile)

```bash
cd apps/mobile
npx expo start --clear
```

### Next.js Cache (Web)

```bash
cd apps/web
rm -rf .next
npm run dev
```

### Supabase Verbindungsprobleme

- RLS-Policies checken
- Anon-Key korrekt?
- Lokales Supabase läuft? (`supabase status`)

## 📄 Lizenz

MIT

## 🤝 Contributing

Pull Requests sind willkommen! Für größere Änderungen bitte erst ein Issue öffnen.

---

**Viel Erfolg bei der Entwicklung!** 🎉
