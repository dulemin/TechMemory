# Send Event Email - Supabase Edge Function

Diese Edge Function sendet E-Mail-Benachrichtigungen an Event-Hosts über Resend.

## Funktionen

### 1. Event Complete (`event_complete`)
Wird nach dem Event-Datum automatisch gesendet:
- Share-Link
- Dashboard-Link
- Export-Hinweis

### 2. Export Ready (`export_ready`)
Wird gesendet, wenn ZIP/PDF-Export fertig ist:
- Download-Link

### 3. New Contribution (`new_contribution`)
Wird bei neuen Gast-Uploads gesendet:
- Moderation-Link

## Setup

### 1. Resend API Key erstellen

1. Gehe zu https://resend.com
2. Erstelle einen Account
3. Erstelle einen API Key
4. Kopiere den Key

### 2. Environment-Variablen setzen

```bash
# Lokal (.env)
RESEND_API_KEY=re_xxx
APP_URL=http://localhost:3000

# Production (Supabase Dashboard → Settings → Edge Functions → Secrets)
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set APP_URL=https://your-domain.com
```

### 3. Edge Function deployen

```bash
# Lokal testen
supabase functions serve send-event-email --env-file ./supabase/.env.local

# Production deployen
supabase functions deploy send-event-email
```

## API Usage

### Request

```typescript
POST https://your-project.supabase.co/functions/v1/send-event-email

{
  "eventId": "656282ac-99d8-4e0e-85c5-a6fc60d99561",
  "type": "event_complete" | "export_ready" | "new_contribution"
}
```

### Response

```json
{
  "success": true,
  "emailId": "xxx"
}
```

## Integration

### Automatische Trigger (via Supabase Cron)

Erstelle einen Database Trigger oder Cron Job, der die Edge Function aufruft:

```sql
-- Beispiel: Trigger bei neuem Beitrag
CREATE OR REPLACE FUNCTION notify_host_new_contribution()
RETURNS trigger AS $$
DECLARE
  function_url TEXT;
BEGIN
  -- Edge Function URL (anpassen!)
  function_url := 'https://your-project.supabase.co/functions/v1/send-event-email';

  -- HTTP POST Request (via pg_net Extension)
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'eventId', NEW.event_id,
      'type', 'new_contribution'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_contribution
  AFTER INSERT ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION notify_host_new_contribution();
```

### Manuell via Next.js API Route

```typescript
// apps/web/app/api/events/[eventId]/send-notification/route.ts
export async function POST(req: Request) {
  const { eventId, type } = await req.json();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-event-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ eventId, type }),
    }
  );

  return Response.json(await response.json());
}
```

## E-Mail-Templates anpassen

Die E-Mail-Inhalte sind in `index.ts` hardcoded. Für bessere Templates:
1. Erstelle HTML-Templates in `/templates/`
2. Verwende Template-Engine (z.B. Handlebars)
3. Oder nutze Resend's Template-Feature

## Limits

**Resend Free Tier:**
- 100 E-Mails/Tag
- 3.000 E-Mails/Monat

**Supabase Edge Functions:**
- 500.000 Invocations/Monat (Free)
- 2GB Bandbreite (Free)

## Troubleshooting

### "Failed to send email"
- Prüfe `RESEND_API_KEY` in Supabase Secrets
- Prüfe Resend Dashboard → Logs
- Verifiziere Domain in Resend (für Production)

### "Event not found"
- Prüfe `eventId` in Request
- Prüfe RLS-Policies (Edge Function nutzt Service Role)

### CORS-Fehler
- Edge Function hat CORS-Header gesetzt
- Bei Problemen: Prüfe Browser-Console
