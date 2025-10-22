import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Erfolgreich authentifiziert - weiterleiten
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Fehler - zurück zur Login-Seite
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin));
}
