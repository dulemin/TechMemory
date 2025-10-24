'use client';

import { useState, useRef, useEffect } from 'react';
import { createAnonClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { convertWebMToMP4, needsConversion } from '@/lib/ffmpeg';

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
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const recordingTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

  // Recording-Timer
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = prev + 1;
        recordingTimeRef.current = newTime; // Ref aktualisieren
        // Auto-Stop bei maxDuration
        if (newTime >= maxDuration) {
          stopRecording();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, maxDuration]);

  // Stream an Video-Element binden wenn verfügbar
  useEffect(() => {
    if (stream && liveVideoRef.current && isRecording) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream, isRecording]);

  // Video-Aufnahme starten
  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });

      setStream(mediaStream);
      setRecordingTime(0);
      recordingTimeRef.current = 0; // Ref zurücksetzen

      // MediaRecorder setup
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Video-Blob erstellen
        const blob = new Blob(chunks, { type: 'video/webm' });
        const webmFile = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });

        setVideoDuration(recordingTimeRef.current); // Ref statt State verwenden

        // Stream cleanup
        mediaStream.getTracks().forEach((track) => track.stop());
        setStream(null);

        // WebM zu MP4 konvertieren für maximale Kompatibilität
        try {
          setIsConverting(true);
          toast.info('Konvertiere Video zu MP4 für WhatsApp-Kompatibilität...');

          const mp4File = await convertWebMToMP4(webmFile, (progress) => {
            setConversionProgress(progress);
          });

          setSelectedFile(mp4File);

          // Preview erstellen
          const url = URL.createObjectURL(mp4File);
          setPreview(url);

          toast.success('Video erfolgreich konvertiert!');
        } catch (err) {
          console.error('Konvertierung fehlgeschlagen:', err);
          toast.error('Konvertierung fehlgeschlagen. Video wird als WebM hochgeladen.');
          // Fallback: Nutze WebM
          setSelectedFile(webmFile);
          const url = URL.createObjectURL(webmFile);
          setPreview(url);
        } finally {
          setIsConverting(false);
          setConversionProgress(0);
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Kamera/Mikrofon-Zugriff fehlgeschlagen:', err);
      toast.error('Kamera/Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in deinem Browser.');
    }
  };

  // Video-Aufnahme stoppen
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Aufnahme abbrechen
  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
  };

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

  const handleUpload = async () => {
    if (!guestName || !guestName.trim()) {
      toast.error('Bitte gib zuerst deinen Namen ein');
      return;
    }

    if (!selectedFile || videoDuration > maxDuration) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const supabase = createAnonClient();

      setUploadProgress(10);

      // 1. Contribution-Eintrag erstellen
      const { data: contribution, error: insertError } = await supabase
        .from('contributions')
        .insert({
          event_id: eventId,
          guest_name: guestName,
          type: 'video',
          status: 'pending',
          duration_seconds: videoDuration,
          file_size_bytes: selectedFile.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(30);

      // 2. Datei zu Supabase Storage hochladen
      // Extension vom original File extrahieren (z.B. .webm für Aufnahmen, .mp4/.mov für Galerie)
      const fileExtension = selectedFile.name.split('.').pop() || 'webm';
      const fileName = `${contribution.id}.${fileExtension}`;
      const filePath = `${eventId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-media')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      // 3. URL in contribution speichern
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
      {/* Recording-Modal */}
      {isRecording && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-4">
            {/* Live-Preview */}
            <div className="relative rounded-lg overflow-hidden bg-gray-900">
              <video
                ref={liveVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
              />

              {/* Recording-Timer Overlay */}
              <div className="absolute top-4 left-4 bg-brand-accent-red text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                <span className="font-mono text-lg">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')} / {Math.floor(maxDuration / 60)}:{(maxDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Recording-Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={stopRecording}
                className="flex-1 bg-brand-accent-red hover:opacity-90 text-white"
                size="lg"
              >
                ⏹ Aufnahme beenden
              </Button>
              <Button
                onClick={cancelRecording}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* File-Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload-Buttons */}
      <div className="space-y-2">
        <Label>Video auswählen</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRecording || isConverting}
            className="w-full"
          >
            📁 Aus Galerie
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={startRecording}
            disabled={isUploading || isRecording || isConverting}
            className="w-full"
          >
            {facingMode === 'environment' ? '🎥' : '🤳'} Aufnehmen
          </Button>
        </div>
        {/* Kamera-Wechsel */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
          disabled={isUploading || isRecording || isConverting}
          className="w-full text-xs"
        >
          🔄 {facingMode === 'environment' ? 'Zur Frontkamera wechseln' : 'Zur Hauptkamera wechseln'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Max. {maxDuration} Sekunden • Aufnahmen werden zu MP4 konvertiert
        </p>
      </div>

      {/* Conversion Progress */}
      {isConverting && (
        <div className="space-y-2">
          <Progress value={conversionProgress} />
          <p className="text-xs text-muted-foreground text-center">
            Konvertiere zu MP4... {conversionProgress}%
          </p>
        </div>
      )}

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
            {uploadProgress < 30
              ? 'Bereite Upload vor...'
              : uploadProgress < 80
                ? 'Lade Video hoch...'
                : 'Fast fertig...'}
          </p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading || isConverting || videoDuration > maxDuration}
        className="w-full"
      >
        {isUploading ? 'Lädt hoch...' : isConverting ? 'Konvertiere...' : 'Video hochladen'}
      </Button>
    </div>
  );
}
