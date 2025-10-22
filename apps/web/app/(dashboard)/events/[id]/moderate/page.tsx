import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ModerationView } from './moderation-view';

interface ModeratePageProps {
  params: Promise<{ id: string }>;
}

export default async function ModeratePage({ params }: ModeratePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth-Check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Event laden und verifizieren dass User der Host ist
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('host_user_id', user.id)
    .single();

  if (error || !event) {
    redirect('/events');
  }

  // Alle Contributions laden (pending, approved, rejected)
  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  return (
    <ModerationView
      eventId={id}
      eventTitle={event.title}
      initialContributions={contributions || []}
    />
  );
}
