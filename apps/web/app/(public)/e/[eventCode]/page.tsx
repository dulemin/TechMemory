import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GuestUploadForm } from './guest-upload-form';

interface GuestPageProps {
  params: Promise<{
    eventCode: string;
  }>;
}

export default async function GuestPage({ params }: GuestPageProps) {
  const { eventCode } = await params;
  const supabase = await createClient();

  // Event per Code laden (öffentlich zugänglich)
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', eventCode.toUpperCase())
    .eq('status', 'active')
    .single();

  if (error || !event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      {event.hero_image_url ? (
        <div className="relative w-full h-80 md:h-96 overflow-hidden">
          <img
            src={event.hero_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

          {/* Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              {event.title}
            </h1>
            <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
              {new Date(event.event_date).toLocaleDateString('de-DE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full bg-gradient-to-r from-primary/20 to-primary/10 py-16">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{event.title}</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              {new Date(event.event_date).toLocaleDateString('de-DE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}

      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Upload-Bereiche */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teile deine Erinnerungen</CardTitle>
              <CardDescription>
                Lade Videos, Fotos oder schreibe eine Nachricht für das Event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GuestUploadForm eventId={event.id} eventSettings={event.settings} />
            </CardContent>
          </Card>

          {/* Info-Box */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Hinweise:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Videos: Max. {event.settings?.maxVideoDuration || 60} Sekunden</li>
                  <li>Fotos: Max. {event.settings?.maxPhotoSizeMB || 5} MB pro Bild</li>
                  <li>Alle Beiträge werden vom Host moderiert</li>
                  <li>Deine Beiträge erscheinen nach Freigabe auf der Live-Wall</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
