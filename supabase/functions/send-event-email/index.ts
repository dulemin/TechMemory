// Supabase Edge Function: Send Event Email
// Sends email notifications to event hosts (e.g., after event, export ready, etc.)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface EmailRequest {
  eventId: string;
  type: 'event_complete' | 'export_ready' | 'new_contribution';
}

serve(async (req) => {
  try {
    // CORS Headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Parse Request
    const { eventId, type }: EmailRequest = await req.json();

    if (!eventId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing eventId or type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Supabase Client (mit Service Role für Admin-Zugriff)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Event-Daten laden
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, profiles:host_user_id(*)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Host-Email holen
    const hostEmail = event.profiles?.email;
    if (!hostEmail) {
      return new Response(
        JSON.stringify({ error: 'Host email not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // E-Mail-Inhalte basierend auf Typ
    let subject = '';
    let htmlContent = '';

    if (type === 'event_complete') {
      // Nach Event-Datum: Export-Link senden
      const shareUrl = `${Deno.env.get('APP_URL')}/share/${eventId}`;
      const dashboardUrl = `${Deno.env.get('APP_URL')}/events/${eventId}`;

      subject = `🎉 Dein Event "${event.title}" ist vorbei!`;
      htmlContent = `
        <h1>Hallo ${event.profiles?.full_name || 'Event-Host'}!</h1>
        <p>Dein Event <strong>"${event.title}"</strong> ist vorbei.</p>
        <p>Alle Gäste-Beiträge stehen jetzt zur Verfügung:</p>
        <ul>
          <li><a href="${dashboardUrl}">Event-Dashboard öffnen</a></li>
          <li><a href="${shareUrl}">Share-Link für Gäste</a> (30 Tage gültig)</li>
        </ul>
        <p>Du kannst jetzt auch ZIP- und PDF-Exporte erstellen!</p>
        <p>Viel Spaß beim Durchsehen der Erinnerungen! 📸🎬💬</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Event Guestbook Lite</p>
      `;
    } else if (type === 'export_ready') {
      subject = `📦 Dein Export für "${event.title}" ist bereit`;
      htmlContent = `
        <h1>Export bereit!</h1>
        <p>Dein Export für <strong>"${event.title}"</strong> ist fertig.</p>
        <p><a href="${Deno.env.get('APP_URL')}/events/${eventId}">Zum Download →</a></p>
      `;
    } else if (type === 'new_contribution') {
      subject = `🔔 Neuer Beitrag bei "${event.title}"`;
      htmlContent = `
        <h1>Neuer Beitrag!</h1>
        <p>Ein Gast hat einen neuen Beitrag bei <strong>"${event.title}"</strong> hochgeladen.</p>
        <p><a href="${Deno.env.get('APP_URL')}/events/${eventId}/moderate">Zur Moderation →</a></p>
      `;
    }

    // E-Mail senden via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Event Guestbook <noreply@yourdomain.com>', // TODO: Anpassen
        to: [hostEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('Resend error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
