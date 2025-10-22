# Database Migrations

This package contains Supabase database schema and migrations for Event Guestbook Lite.

## Setup

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Initialize Supabase in your project root:
```bash
supabase init
```

3. Link to your Supabase project:
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

4. Apply migrations:
```bash
supabase db push
```

## Migrations

- `001_initial_schema.sql` - Creates all tables (profiles, events, contributions, subscriptions)
- `002_row_level_security.sql` - Sets up RLS policies for secure data access
- `003_storage_buckets.sql` - Creates storage buckets and policies

## Schema Overview

### Tables

**profiles**
- User profile data (extends Supabase auth.users)

**events**
- Event metadata (title, date, settings, QR code)
- Host relationship

**contributions**
- Guest uploads (videos, photos, text messages)
- Moderation status (pending, approved, rejected)

**subscriptions**
- Stripe subscription data
- Tier management (free, premium)

### Storage Buckets

**event-media** (public)
- Video and photo uploads from guests

**qr-codes** (public)
- Generated QR codes for events

**exports** (private)
- Exported event data (ZIP, PDF)

## Local Development

Run Supabase locally:
```bash
supabase start
```

Generate TypeScript types:
```bash
supabase gen types typescript --local > ../shared/src/types/database.gen.ts
```
