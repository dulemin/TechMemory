import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LogoutButton } from './logout-button';

export default async function DashboardPage() {
  const supabase = await createClient();

  // User-Daten holen
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Profil-Daten holen
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Events-Anzahl holen
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('host_user_id', user.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Willkommen zurück, {profile?.full_name || user.email}!
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktive Events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Beiträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Free</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktiver Plan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
          <CardDescription>
            Erstelle dein erstes Event und lade Gäste ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/events/new">
            <Button className="w-full" size="lg">
              Neues Event erstellen
            </Button>
          </Link>

          {eventsCount && eventsCount > 0 ? (
            <Link href="/events">
              <Button variant="outline" className="w-full">
                Alle Events anzeigen
              </Button>
            </Link>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              Du hast noch keine Events. Erstelle dein erstes Event!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
