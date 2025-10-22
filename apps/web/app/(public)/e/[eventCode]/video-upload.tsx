'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoUploadProps {
  eventId: string;
  guestName: string;
  maxDuration: number;
}

export function VideoUpload({ eventId, guestName, maxDuration }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // FFmpeg laden (nur im Browser)
  useEffect(() => {
    const load = async () => {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

      // FFmpeg erst hier initialisieren (nur im Browser)
      ffmpegRef.current = new FFmpeg();
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('FFmpeg konnte nicht geladen werden:', err);
        toast.error('Video-Kompression nicht verfügbar. Bitte verwende ein kleineres Video.');
      }
    };

    load();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validierung
    if (!file.type.startsWith('video/')) {
      toast.error('Bitte wähle ein Video aus');
      return;
    }

    setSelectedFile(file);

    // Preview erstellen und Dauer prüfen
    const url = URL.createObjectURL(file);
    setPreview(url);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = Math.floor(video.duration);
      setVideoDuration(duration);

      if (duration > maxDuration) {
        toast.error(`Video ist zu lang (${duration}s). Max. ${maxDuration}s erlaubt.`);
      }
    };
    video.src = url;
  };

  const compressVideo = async (file: File): Promise<Blob> => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) {
      throw new Error('FFmpeg nicht initialisiert');
    }

    // Input-Datei schreiben
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));

    // Kompression durchführen (H.264, reduzierte Auflösung, Bitrate)
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '28',
      '-vf', 'scale=1280:-2',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      'output.mp4'
    ]);

    // Output-Datei lesen
    const data = await ffmpeg.readFile('output.mp4');
    // FileData zu Uint8Array konvertieren für Blob
    return new Blob([new Uint8Array(data as unknown as ArrayBuffer)], { type: 'video/mp4' });
  };

  const handleUpload = async () => {
    if (!selectedFile || videoDuration > maxDuration) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const supabase = createClient();

      // 1. Video komprimieren (wenn FFmpeg verfügbar)
      let fileToUpload: File | Blob = selectedFile;

      if (ffmpegLoaded && selectedFile.size > 10 * 1024 * 1024) {
        setUploadProgress(10);
        try {
          fileToUpload = await compressVideo(selectedFile);
          setUploadProgress(40);
        } catch (compressionError) {
          console.warn('Kompression fehlgeschlagen, verwende Original:', compressionError);
          setUploadProgress(40);
        }
      } else {
        setUploadProgress(40);
      }

      // 2. Contribution-Eintrag erstellen
      const { data: contribution, error: insertError } = await supabase
        .from('contributions')
        .insert({
          event_id: eventId,
          guest_name: guestName,
          type: 'video',
          status: 'pending',
          duration_seconds: videoDuration,
          file_size_bytes: fileToUpload.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(50);

      // 3. Datei zu Supabase Storage hochladen
      const fileName = `${contribution.id}.mp4`;
      const filePath = `${eventId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-media')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      // 4. URL in contribution speichern
      const { data: urlData } = supabase.storage
        .from('event-media')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('contributions')
        .update({ content_url: urlData.publicUrl })
        .eq('id', contribution.id);

      if (updateError) throw updateError;

      setUploadProgress(100);

      toast.success('Video erfolgreich hochgeladen! Der Host wird es bald freigeben.');

      // Reset nach Erfolg
      setTimeout(() => {
        setSelectedFile(null);
        setPreview(null);
        setVideoDuration(0);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    } catch (err) {
      console.error('Video-Upload fehlgeschlagen:', err);
      toast.error(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video">Video auswählen</Label>
        <input
          ref={fileInputRef}
          id="video"
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="block w-full text-sm text-muted-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90
            file:cursor-pointer cursor-pointer"
        />
        <p className="text-xs text-muted-foreground">
          Max. {maxDuration} Sekunden • MP4, MOV, WEBM
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-lg overflow-hidden border bg-black">
          <video
            ref={videoRef}
            src={preview}
            controls
            className="w-full h-auto max-h-96"
          />
          <div className="bg-muted p-2 text-sm text-center">
            Dauer: {videoDuration}s / {maxDuration}s
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress < 40
              ? 'Komprimiere Video...'
              : uploadProgress < 80
                ? 'Lade hoch...'
                : 'Fertigstelle...'}
          </p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading || videoDuration > maxDuration}
        className="w-full"
      >
        {isUploading ? 'Lädt hoch...' : 'Video hochladen'}
      </Button>
    </div>
  );
}
