'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  hero_image_url: string | null;
  settings: any;
}

interface EventEditFormProps {
  event: Event;
}

export function EventEditForm({ event }: EventEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State (vorausgefüllt mit Event-Daten)
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [eventDate, setEventDate] = useState(
    new Date(event.event_date).toISOString().slice(0, 16)
  );
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(
    event.hero_image_url
  );
  const [deleteHeroImage, setDeleteHeroImage] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<string[]>(
    event.settings?.customQuestions || []
  );
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
      setDeleteHeroImage(false); // Beim Upload neuen Bildes, delete-Flag zurücksetzen
    } catch (error) {
      console.error('Bildkompression fehlgeschlagen:', error);
      toast.error('Bild konnte nicht verarbeitet werden');
    }
  };

  const removeHeroImage = () => {
    setHeroImageFile(null);
    setHeroImagePreview(null);
    setDeleteHeroImage(true);
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

      let heroImageUrl: string | null = event.hero_image_url;

      // Hero-Image Upload/Löschen
      if (deleteHeroImage) {
        // Altes Bild aus Storage löschen
        if (event.hero_image_url) {
          const oldPath = event.hero_image_url.split('/').slice(-2).join('/');
          await supabase.storage.from('event-media').remove([oldPath]);
        }
        heroImageUrl = null;
      } else if (heroImageFile) {
        // Altes Bild löschen, falls vorhanden
        if (event.hero_image_url) {
          const oldPath = event.hero_image_url.split('/').slice(-2).join('/');
          await supabase.storage.from('event-media').remove([oldPath]);
        }

        // Neues Bild hochladen
        const fileExt = heroImageFile.name.split('.').pop();
        const fileName = `hero-${Date.now()}.${fileExt}`;
        const filePath = `${event.id}/${fileName}`;

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

      // Event aktualisieren
      const { error: updateError } = await supabase
        .from('events')
        .update({
          title,
          description: description || null,
          event_date: new Date(eventDate).toISOString(),
          hero_image_url: heroImageUrl,
          settings: {
            ...event.settings,
            customQuestions: customQuestions.length > 0 ? customQuestions : undefined,
          },
        })
        .eq('id', event.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Event erfolgreich aktualisiert!');

      // Zurück zur Event-Detail-Seite
      router.push(`/events/${event.id}`);
      router.refresh();
    } catch (err) {
      console.error('Event-Update fehlgeschlagen:', err);
      const errorMessage = err instanceof Error ? err.message : 'Event konnte nicht aktualisiert werden';
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
            Bearbeite die Informationen zu deinem Event
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
              {heroImagePreview && !deleteHeroImage ? (
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
                    onClick={removeHeroImage}
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
            {isLoading ? 'Speichere...' : 'Änderungen speichern'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
