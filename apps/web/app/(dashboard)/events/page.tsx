import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function EventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Alle Events des Users holen
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('host_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Events:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meine Events</h1>
          <p className="text-muted-foreground mt-2">
            Verwalte deine Events und behalte den Überblick
          </p>
        </div>
        <Link href="/events/new">
          <Button>Neues Event</Button>
        </Link>
      </div>

      {/* Events-Grid */}
      {events && events.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                    {event.description && (
                      <CardDescription className="line-clamp-2 mt-1.5">
                        {event.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    variant={event.status === 'active' ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Event-Code</dt>
                    <dd className="font-mono font-medium">{event.event_code}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Datum</dt>
                    <dd>
                      {new Date(event.event_date).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </dd>
                  </div>
                </dl>
              </CardContent>

              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/events/${event.id}`}>
                    Details anzeigen
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Noch keine Events</h3>
              <p className="text-muted-foreground max-w-sm">
                Erstelle dein erstes Event und lade deine Gäste ein, Videos, Fotos und
                Nachrichten zu teilen.
              </p>
              <Link href="/events/new">
                <Button className="mt-4">Erstes Event erstellen</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
