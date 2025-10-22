import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShareGallery } from './share-gallery';

interface SharePageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  // Event-Daten laden (ohne Auth-Check - öffentliche Seite)
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // Prüfen ob Share-Link noch gültig ist (30 Tage nach Event-Datum)
  const settings = event.settings as any;
  const shareExpireDays = settings?.shareExpireDays || 30;
  const eventDate = new Date(event.event_date);
  const expiryDate = new Date(eventDate);
  expiryDate.setDate(expiryDate.getDate() + shareExpireDays);

  const isExpired = new Date() > expiryDate;

  // Alle approved Beiträge laden
  const { data: contributions, error: contributionsError } = await supabase
    .from('contributions')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (contributionsError) {
    console.error('Error loading contributions:', contributionsError);
  }

  const contributionsList = contributions || [];

  // Statistiken
  const stats = {
    total: contributionsList.length,
    videos: contributionsList.filter((c) => c.type === 'video').length,
    photos: contributionsList.filter((c) => c.type === 'photo').length,
    texts: contributionsList.filter((c) => c.type === 'text').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
          <p className="text-muted-foreground">
            {new Date(event.event_date).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {event.description && (
            <p className="text-muted-foreground mt-2">{event.description}</p>
          )}
        </div>

        {/* Expiry Warning */}
        {isExpired && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Share-Link abgelaufen</CardTitle>
              <CardDescription>
                Dieser Share-Link ist am {expiryDate.toLocaleDateString('de-DE')} abgelaufen.
                Kontaktiere den Event-Host für einen neuen Link.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Beiträge</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">📹 {stats.videos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">📷 {stats.photos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Texte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">💬 {stats.texts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Galerie */}
        {!isExpired && contributionsList.length > 0 ? (
          <ShareGallery contributions={contributionsList} />
        ) : !isExpired && contributionsList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Noch keine Beiträge vorhanden.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Erstellt mit Event Guestbook Lite
          </p>
          {!isExpired && (
            <p className="mt-2">
              Share-Link gültig bis {expiryDate.toLocaleDateString('de-DE')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
