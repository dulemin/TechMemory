import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventForm } from './event-form';

export default async function NewEventPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Neues Event erstellen</h1>
        <p className="text-muted-foreground mt-2">
          Erstelle ein neues Event und lade deine Gäste ein, Videos, Fotos und Nachrichten hochzuladen.
        </p>
      </div>

      <EventForm userId={user.id} />
    </div>
  );
}
