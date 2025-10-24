import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { EventEditForm } from './event-edit-form';

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // User authentifizieren
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Event laden (nur eigene Events)
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('host_user_id', user.id)
    .single();

  if (error || !event) {
    notFound();
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Event bearbeiten</h1>
        <p className="text-muted-foreground mt-2">
          Aktualisiere die Details deines Events
        </p>
      </div>

      <EventEditForm event={event} />
    </div>
  );
}
