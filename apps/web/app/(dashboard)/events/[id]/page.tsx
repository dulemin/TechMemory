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
import { CopyLinkCard } from './copy-link-card';
import { ExportCard } from './export-card';

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

  // Contributions nach Typ
  const { data: allContributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  const contributions = allContributions || [];

  const videoContributions = contributions.filter(c => c.type === 'video');
  const photoContributions = contributions.filter(c => c.type === 'photo');
  const textContributions = contributions.filter(c => c.type === 'text');

  const pendingVideos = videoContributions.filter(c => c.status === 'pending').length;
  const pendingPhotos = photoContributions.filter(c => c.status === 'pending').length;
  const pendingTexts = textContributions.filter(c => c.status === 'pending').length;
  const totalPending = pendingVideos + pendingPhotos + pendingTexts;

  // Letzte 3 Aktivitäten
  const recentActivities = contributions.slice(0, 3);

  const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.event_code}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4">
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
      <div>
        <h1 className="text-4xl font-bold text-brand-text-dark">{event.title}</h1>
        {event.description && (
          <p className="text-brand-text-mid mt-2">{event.description}</p>
        )}
      </div>

      {/* Statistik-Karten mit Icons */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Videos */}
        <Card className="relative overflow-hidden border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
          <div className="absolute top-4 right-4">
            {pendingVideos > 0 && (
              <span className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                {pendingVideos}
              </span>
            )}
          </div>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-primary-light rounded-lg">
                <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-brand-text-mid font-medium">Videos</p>
                <p className="text-3xl font-bold text-brand-text-dark mt-1">{videoContributions.length}</p>
                {pendingVideos > 0 && (
                  <p className="text-xs text-brand-primary mt-1">{pendingVideos} zu moderieren</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card className="relative overflow-hidden border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
          <div className="absolute top-4 right-4">
            {pendingPhotos > 0 && (
              <span className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                {pendingPhotos}
              </span>
            )}
          </div>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-primary-light rounded-lg">
                <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-brand-text-mid font-medium">Fotos</p>
                <p className="text-3xl font-bold text-brand-text-dark mt-1">{photoContributions.length}</p>
                {pendingPhotos > 0 && (
                  <p className="text-xs text-brand-primary mt-1">{pendingPhotos} zu moderieren</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nachrichten */}
        <Card className="relative overflow-hidden border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
          <div className="absolute top-4 right-4">
            {pendingTexts > 0 && (
              <span className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                {pendingTexts}
              </span>
            )}
          </div>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-primary-light rounded-lg">
                <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-brand-text-mid font-medium">Nachrichten</p>
                <p className="text-3xl font-bold text-brand-text-dark mt-1">{textContributions.length}</p>
                {pendingTexts > 0 && (
                  <p className="text-xs text-brand-primary mt-1">{pendingTexts} zu moderieren</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zur Moderation Button */}
      {totalPending > 0 && (
        <Link href={`/events/${id}/moderate`}>
          <Button className="w-full h-14 text-base bg-brand-primary hover:opacity-90 text-white shadow-lg">
            🖼️ Zur Moderation ({totalPending})
          </Button>
        </Link>
      )}

      {/* Action Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* QR-Karten herunterladen */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-brand-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-primary-light rounded-lg">
                <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-brand-text-dark">QR-Karten herunterladen</h3>
                <p className="text-sm text-brand-text-mid mt-1">PDF für Tischkarten</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link teilen */}
        <CopyLinkCard guestUrl={guestUrl} />

        {/* Live-Wall öffnen */}
        <Link href={`/events/${id}/wall`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-brand-primary/20 h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-primary-light rounded-lg">
                  <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-brand-text-dark">Live-Wall öffnen</h3>
                  <p className="text-sm text-brand-text-mid mt-1">Für Beamer während Event</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Als ZIP herunterladen */}
        <ExportCard eventId={id} eventTitle={event.title} />
      </div>

      {/* Letzte Aktivität */}
      {recentActivities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-text-dark">Letzte Aktivität</h2>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <Card key={activity.id} className="border-brand-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {activity.type === 'video' && activity.content_url && (
                        <video
                          src={activity.content_url}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {activity.type === 'photo' && activity.content_url && (
                        <img
                          src={activity.content_url}
                          alt="Foto"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {activity.type === 'text' && (
                        <div className="w-full h-full flex items-center justify-center bg-brand-primary-light">
                          <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-text-dark">
                        {activity.guest_name} hat {activity.type === 'video' ? 'ein Video' : activity.type === 'photo' ? 'ein Foto' : 'eine Nachricht'} hochgeladen
                      </p>
                      <p className="text-xs text-brand-text-mid mt-1">
                        vor {Math.floor((Date.now() - new Date(activity.created_at).getTime()) / 60000)} Min.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
