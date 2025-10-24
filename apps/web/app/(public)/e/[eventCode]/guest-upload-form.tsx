'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoUpload } from './video-upload';
import { PhotoUpload } from './photo-upload';
import { TextUpload } from './text-upload';

interface GuestUploadFormProps {
  eventId: string;
  eventSettings: any;
}

// Standard-Fragen (immer verfügbar)
const DEFAULT_QUESTIONS = [
  'Keine Frage - freies Video',
  'Was wünschst du dem Paar?',
  'Dein bester Ehe-Rat?',
  'Lustigste Erinnerung mit ihnen?',
  'Was macht ihre Liebe besonders?',
];

export function GuestUploadForm({ eventId, eventSettings }: GuestUploadFormProps) {
  const [guestName, setGuestName] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('Keine Frage - freies Video');

  const allowVideo = eventSettings?.allowVideo ?? true;
  const allowPhoto = eventSettings?.allowPhoto ?? true;
  const allowText = eventSettings?.allowText ?? true;
  const customQuestions = eventSettings?.customQuestions || [];

  // Kombiniere Standard-Fragen + Custom Questions vom Host
  const allQuestions = [...DEFAULT_QUESTIONS, ...customQuestions];

  // Bestimme den ersten erlaubten Tab
  const defaultTab = allowVideo ? 'video' : allowPhoto ? 'photo' : 'text';

  return (
    <div className="space-y-6">
      {/* Gast-Name */}
      <div className="space-y-2">
        <Label htmlFor="guestName">Dein Name</Label>
        <Input
          id="guestName"
          type="text"
          placeholder="z.B. Max Mustermann"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Wie möchtest du in der Galerie erscheinen?
        </p>
      </div>

      {/* Upload-Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {allowVideo && (
            <TabsTrigger value="video" disabled={!guestName}>
              📹 Video
            </TabsTrigger>
          )}
          {allowPhoto && (
            <TabsTrigger value="photo" disabled={!guestName}>
              📷 Foto
            </TabsTrigger>
          )}
          {allowText && (
            <TabsTrigger value="text" disabled={!guestName}>
              ✍️ Nachricht
            </TabsTrigger>
          )}
        </TabsList>

        {/* Fragen-Dropdown - IMMER sichtbar, nach Tabs */}
        <div className="space-y-2 mt-6">
          <Label htmlFor="question">📋 Beantworte eine Frage (optional)</Label>
          <select
            id="question"
            value={selectedQuestion}
            onChange={(e) => setSelectedQuestion(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
            disabled={!guestName}
          >
            {allQuestions.map((question: string, index: number) => (
              <option key={index} value={question}>
                {question}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Wähle eine Frage aus, auf die du in deinem Beitrag eingehen möchtest
          </p>
        </div>

        {allowVideo && (
          <TabsContent value="video" className="space-y-4">
            <VideoUpload
              eventId={eventId}
              guestName={guestName}
              maxDuration={eventSettings?.maxVideoDuration || 60}
              questionAnswered={selectedQuestion === 'Keine Frage - freies Video' ? undefined : selectedQuestion}
            />
          </TabsContent>
        )}

        {allowPhoto && (
          <TabsContent value="photo" className="space-y-4">
            <PhotoUpload
              eventId={eventId}
              guestName={guestName}
              maxSizeMB={eventSettings?.maxPhotoSizeMB || 5}
              questionAnswered={selectedQuestion === 'Keine Frage - freies Video' ? undefined : selectedQuestion}
            />
          </TabsContent>
        )}

        {allowText && (
          <TabsContent value="text" className="space-y-4">
            <TextUpload
              eventId={eventId}
              guestName={guestName}
              questionAnswered={selectedQuestion === 'Keine Frage - freies Video' ? undefined : selectedQuestion}
            />
          </TabsContent>
        )}
      </Tabs>

      {!guestName && (
        <p className="text-sm text-muted-foreground text-center">
          Bitte gib deinen Namen ein, um fortzufahren
        </p>
      )}
    </div>
  );
}
