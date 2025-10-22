import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ExportButton } from './export-button';
import { PDFExportButton } from './pdf-export-button';
import { ShareLinkButton } from './share-link-button';
import { CopyButton } from '@/components/copy-button';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Event-Daten holen
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('host_user_id', user.id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Beitrags-Anzahl holen
  const { count: contributionsCount } = await supabase
    .from('contributions')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id);

  const { count: pendingCount } = await supabase
    .from('contributions')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('status', 'pending');

  const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.event_code}`;

  // Settings extrahieren
  const settings = event.settings as any;
  const shareExpireDays = settings?.shareExpireDays || 30;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/events" className="hover:text-foreground">
          Events
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{event.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {event.description && (
            <p className="text-muted-foreground mt-2">{event.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Beiträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributionsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Zu moderieren
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{event.status}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(event.event_date).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event-Code & Gast-Link */}
      <Card>
        <CardHeader>
          <CardTitle>Gast-Zugang</CardTitle>
          <CardDescription>
            Teile diesen Link oder QR-Code mit deinen Gästen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Event-Code</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2 bg-muted rounded-md text-lg font-mono">
                {event.event_code}
              </code>
              <CopyButton text={event.event_code} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gast-Link</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2 bg-muted rounded-md text-sm break-all">
                {guestUrl}
              </code>
              <CopyButton text={guestUrl} />
            </div>
          </div>

          {event.qr_code_url && (
            <div className="space-y-2">
              <label className="text-sm font-medium">QR-Code</label>
              <div className="flex justify-center p-4 bg-white rounded-md">
                <img
                  src={event.qr_code_url}
                  alt="Event QR Code"
                  className="w-64 h-64"
                />
              </div>
            </div>
          )}

          {!event.qr_code_url && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              QR-Code wird in Kürze verfügbar sein
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aktionen */}
      <Card>
        <CardHeader>
          <CardTitle>Aktionen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href={`/e/${event.event_code}`} target="_blank">
            <Button variant="outline" className="w-full">
              📱 Gast-Ansicht öffnen
            </Button>
          </Link>
          <Link href={`/events/${id}/moderate`}>
            <Button
              variant="outline"
              className="w-full"
            >
              ✅ Beiträge moderieren
              {pendingCount && pendingCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {pendingCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href={`/events/${id}/wall`}>
            <Button variant="outline" className="w-full">
              🎬 Live-Wall öffnen
            </Button>
          </Link>
          <ExportButton eventId={id} eventTitle={event.title} />
          <PDFExportButton
            eventId={id}
            eventTitle={event.title}
            eventDate={event.event_date}
          />
          <ShareLinkButton
            eventId={id}
            eventDate={event.event_date}
            shareExpireDays={shareExpireDays}
          />
        </CardContent>
      </Card>
    </div>
  );
}
