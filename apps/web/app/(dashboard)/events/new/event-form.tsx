'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateEventCode } from '@event-guestbook/shared';
import { generateQRCode, dataURLtoBlob } from '@/lib/qr-code';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface EventFormProps {
  userId: string;
}

export function EventForm({ userId }: EventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Event-Code generieren
      const eventCode = generateEventCode();

      // Event erstellen
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          host_user_id: userId,
          title,
          description: description || null,
          event_date: new Date(eventDate).toISOString(),
          event_code: eventCode,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        // QR-Code generieren und hochladen
        try {
          const guestUrl = `${window.location.origin}/e/${eventCode}`;
          const qrCodeDataUrl = await generateQRCode(guestUrl, {
            width: 512,
            margin: 2,
          });

          // QR-Code in Blob konvertieren
          const qrCodeBlob = dataURLtoBlob(qrCodeDataUrl);

          // QR-Code zu Supabase Storage hochladen
          const qrCodePath = `${data.id}/qr-code.png`;
          const { error: uploadError } = await supabase.storage
            .from('qr-codes')
            .upload(qrCodePath, qrCodeBlob, {
              contentType: 'image/png',
              upsert: true,
            });

          if (uploadError) {
            console.error('QR-Code-Upload fehlgeschlagen:', uploadError);
            // Nicht fatal - Event wurde bereits erstellt
          } else {
            // Public URL holen
            const { data: urlData } = supabase.storage
              .from('qr-codes')
              .getPublicUrl(qrCodePath);

            // Event mit QR-Code-URL aktualisieren
            await supabase
              .from('events')
              .update({ qr_code_url: urlData.publicUrl })
              .eq('id', data.id);
          }
        } catch (qrError) {
          console.error('QR-Code-Generierung fehlgeschlagen:', qrError);
          // Nicht fatal - Event wurde bereits erstellt
        }

        toast.success('Event erfolgreich erstellt!');

        // Weiterleitung zur Event-Detail-Seite
        router.push(`/events/${data.id}`);
        router.refresh();
      }
    } catch (err) {
      console.error('Event-Erstellung fehlgeschlagen:', err);
      const errorMessage = err instanceof Error ? err.message : 'Event konnte nicht erstellt werden';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Event-Details</CardTitle>
          <CardDescription>
            Gib die wichtigsten Informationen zu deinem Event ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event-Titel *</Label>
            <Input
              id="title"
              type="text"
              placeholder="z.B. Hochzeit von Anna & Max"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              placeholder="Teile deinen Gästen mit, was sie erwarten können..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">Event-Datum *</Label>
            <Input
              id="eventDate"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Wann findet dein Event statt?
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Erstelle Event...' : 'Event erstellen'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
