'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Video, Camera, MessageSquare } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'video' | 'photo' | 'text'>('video');

  const allowVideo = eventSettings?.allowVideo ?? true;
  const allowPhoto = eventSettings?.allowPhoto ?? true;
  const allowText = eventSettings?.allowText ?? true;
  const customQuestions = eventSettings?.customQuestions || [];

  // Kombiniere Standard-Fragen + Custom Questions vom Host
  const allQuestions = [...DEFAULT_QUESTIONS, ...customQuestions];

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

      {/* Upload-Tabs (manuell mit Buttons statt Radix Tabs) */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        {allowVideo && (
          <button
            onClick={() => setActiveTab('video')}
            disabled={!guestName}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'video'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Video className="w-4 h-4" />
            Video
          </button>
        )}
        {allowPhoto && (
          <button
            onClick={() => setActiveTab('photo')}
            disabled={!guestName}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'photo'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Camera className="w-4 h-4" />
            Foto
          </button>
        )}
        {allowText && (
          <button
            onClick={() => setActiveTab('text')}
            disabled={!guestName}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'text'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <MessageSquare className="w-4 h-4" />
            Nachricht
          </button>
        )}
      </div>

      {/* Fragen-Dropdown - IMMER sichtbar, zwischen Tabs und Upload */}
      <div className="space-y-2">
        <Label htmlFor="question">📋 Beantworte eine Frage (optional)</Label>
        <Select
          value={selectedQuestion}
          onValueChange={setSelectedQuestion}
          disabled={!guestName}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Wähle eine Frage aus" />
          </SelectTrigger>
          <SelectContent>
            {allQuestions.map((question: string, index: number) => (
              <SelectItem key={index} value={question}>
                {question}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Wähle eine Frage aus, auf die du in deinem Beitrag eingehen möchtest
        </p>
      </div>

      {/* Upload-Bereich */}
      <div className="space-y-4">
        {allowVideo && activeTab === 'video' && (
          <VideoUpload
            eventId={eventId}
            guestName={guestName}
            maxDuration={eventSettings?.maxVideoDuration || 60}
            questionAnswered={selectedQuestion === 'Keine Frage - freies Video' ? undefined : selectedQuestion}
          />
        )}

        {allowPhoto && activeTab === 'photo' && (
          <PhotoUpload
            eventId={eventId}
            guestName={guestName}
            maxSizeMB={eventSettings?.maxPhotoSizeMB || 5}
            questionAnswered={selectedQuestion === 'Keine Frage - freies Video' ? undefined : selectedQuestion}
          />
        )}

        {allowText && activeTab === 'text' && (
          <TextUpload
            eventId={eventId}
            guestName={guestName}
            questionAnswered={selectedQuestion === 'Keine Frage - freies Video' ? undefined : selectedQuestion}
          />
        )}
      </div>

      {!guestName && (
        <p className="text-sm text-muted-foreground text-center">
          Bitte gib deinen Namen ein, um fortzufahren
        </p>
      )}
    </div>
  );
}
