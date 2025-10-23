'use client';

import { useState, useRef, useEffect } from 'react';
import { createAnonClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';

interface PhotoUploadProps {
  eventId: string;
  guestName: string;
  maxSizeMB: number;
}

export function PhotoUpload({ eventId, guestName, maxSizeMB }: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validierung
    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle ein Bild aus');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(false);

    // Preview erstellen
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Kamera öffnen
  const openCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error('Kamera-Zugriff fehlgeschlagen:', err);
      setError('Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in deinem Browser.');
    }
  };

  // Kamera wechseln (zwischen Front- und Hauptkamera)
  const switchCamera = async () => {
    // Aktuellen Stream stoppen
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Neue Kamera öffnen
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    await openCamera(newMode);
  };

  // Stream an Video-Element binden wenn verfügbar
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Kamera schließen
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  // Foto aufnehmen
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Canvas auf Video-Größe setzen
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Video-Frame auf Canvas zeichnen
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Canvas zu Blob konvertieren
    canvas.toBlob((blob) => {
      if (!blob) return;

      // Blob zu File konvertieren
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);

      // Preview erstellen
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Kamera schließen
      closeCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleUpload = async () => {
    if (!guestName || !guestName.trim()) {
      setError('Bitte gib zuerst deinen Namen ein');
      return;
    }

    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const supabase = createAnonClient();

      // 1. Bild komprimieren
      setUploadProgress(10);
      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(selectedFile, options);
      setUploadProgress(30);

      // 2. Contribution-Eintrag erstellen
      const { data: contribution, error: insertError } = await supabase
        .from('contributions')
        .insert({
          event_id: eventId,
          guest_name: guestName,
          type: 'photo',
          status: 'pending',
          file_size_bytes: compressedFile.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(50);

      // 3. Datei zu Supabase Storage hochladen
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${contribution.id}.${fileExt}`;
      const filePath = `${eventId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-media')
        .upload(filePath, compressedFile, {
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
      setSuccess(true);

      // Reset nach erfolg
      setTimeout(() => {
        setSelectedFile(null);
        setPreview(null);
        setUploadProgress(0);
        setSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    } catch (err) {
      console.error('Foto-Upload fehlgeschlagen:', err);
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Kamera-Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-4">
            {/* Live-Preview */}
            <div className="relative rounded-lg overflow-hidden bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
              {/* Kamera-Wechsel-Button (Overlay) */}
              <button
                onClick={switchCamera}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                aria-label="Kamera wechseln"
              >
                🔄
              </button>
            </div>

            {/* Kamera-Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={capturePhoto}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                📸 Foto aufnehmen
              </Button>
              <Button
                onClick={closeCamera}
                variant="outline"
                size="lg"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Canvas für Foto-Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* File-Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload-Buttons */}
      <div className="space-y-2">
        <Label>Foto auswählen</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            📁 Aus Galerie
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={openCamera}
            disabled={isUploading}
            className="w-full"
          >
            📷 Aufnehmen
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Max. {maxSizeMB} MB • JPG, PNG, WEBP
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-lg overflow-hidden border bg-muted">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto max-h-96 object-contain"
          />
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress < 30
              ? 'Komprimiere Bild...'
              : uploadProgress < 80
                ? 'Lade hoch...'
                : 'Fertigstelle...'}
          </p>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          ✓ Foto erfolgreich hochgeladen! Es wird nach Freigabe angezeigt.
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full"
      >
        {isUploading ? 'Lädt hoch...' : 'Foto hochladen'}
      </Button>
    </div>
  );
}
