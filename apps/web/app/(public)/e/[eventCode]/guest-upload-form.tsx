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

export function GuestUploadForm({ eventId, eventSettings }: GuestUploadFormProps) {
  const [guestName, setGuestName] = useState('');

  const allowVideo = eventSettings?.allowVideo ?? true;
  const allowPhoto = eventSettings?.allowPhoto ?? true;
  const allowText = eventSettings?.allowText ?? true;

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

        {allowVideo && (
          <TabsContent value="video" className="space-y-4">
            <VideoUpload
              eventId={eventId}
              guestName={guestName}
              maxDuration={eventSettings?.maxVideoDuration || 60}
            />
          </TabsContent>
        )}

        {allowPhoto && (
          <TabsContent value="photo" className="space-y-4">
            <PhotoUpload
              eventId={eventId}
              guestName={guestName}
              maxSizeMB={eventSettings?.maxPhotoSizeMB || 5}
            />
          </TabsContent>
        )}

        {allowText && (
          <TabsContent value="text" className="space-y-4">
            <TextUpload eventId={eventId} guestName={guestName} />
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
