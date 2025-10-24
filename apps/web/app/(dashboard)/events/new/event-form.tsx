'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateEventCode } from '@event-guestbook/shared';
import { generateQRCode, dataURLtoBlob } from '@/lib/qr-code';
import imageCompression from 'browser-image-compression';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Image, Plus, X } from 'lucide-react';
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
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  const handleHeroImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Vorschau erstellen
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Bild komprimieren
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      setHeroImageFile(compressed);
    } catch (error) {
      console.error('Bildkompression fehlgeschlagen:', error);
      toast.error('Bild konnte nicht verarbeitet werden');
    }
  };

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    if (customQuestions.length >= 10) {
      toast.error('Maximal 10 Fragen erlaubt');
      return;
    }
    setCustomQuestions([...customQuestions, newQuestion.trim()]);
    setNewQuestion('');
  };

  const removeQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Event-Code generieren
      const eventCode = generateEventCode();

      let heroImageUrl: string | null = null;

      // Hero-Image hochladen, falls vorhanden
      if (heroImageFile) {
        const fileExt = heroImageFile.name.split('.').pop();
        const fileName = `hero-${Date.now()}.${fileExt}`;
        const filePath = `${eventCode}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-media')
          .upload(filePath, heroImageFile, {
            contentType: heroImageFile.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('event-media')
          .getPublicUrl(filePath);

        heroImageUrl = urlData.publicUrl;
      }

      // Event erstellen mit hero_image_url und customQuestions
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          host_user_id: userId,
          title,
          description: description || null,
          event_date: new Date(eventDate).toISOString(),
          event_code: eventCode,
          hero_image_url: heroImageUrl,
          settings: customQuestions.length > 0 ? { customQuestions } : undefined,
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

          <div className="space-y-2">
            <Label htmlFor="heroImage">Header-Bild (optional)</Label>
            <div className="flex items-center gap-4">
              {heroImagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <img
                    src={heroImagePreview}
                    alt="Hero Image Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setHeroImageFile(null);
                      setHeroImagePreview(null);
                    }}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-full">
                  <label htmlFor="heroImage" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent transition-colors">
                      <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Klicke hier, um ein Header-Bild hochzuladen
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Empfohlen: 1920x600px, max. 2MB
                      </p>
                    </div>
                  </label>
                  <input
                    id="heroImage"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeroImageChange}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Fragen (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Füge Fragen hinzu, die Gäste bei ihren Videos/Fotos beantworten können
            </p>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="z.B. Was war dein schönster Moment?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addQuestion();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addQuestion}
                disabled={isLoading || !newQuestion.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {customQuestions.length > 0 && (
              <div className="space-y-2 mt-2">
                {customQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 bg-accent p-2 rounded-md"
                  >
                    <span className="text-sm">{question}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
