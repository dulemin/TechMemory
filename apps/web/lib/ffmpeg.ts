/**
 * FFmpeg.wasm Helper für Video-Konvertierung
 *
 * Konvertiert WebM-Videos (vom Browser MediaRecorder) zu MP4 (H.264/AAC)
 * für maximale Kompatibilität mit WhatsApp, QuickTime, etc.
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;

/**
 * Lädt und initialisiert FFmpeg.wasm (nur einmal pro Session)
 */
export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (isLoading) {
    // Warte bis Loading fertig ist
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return ffmpegInstance!;
  }

  isLoading = true;

  try {
    const ffmpeg = new FFmpeg();

    // FFmpeg.wasm Core laden (ca. 30MB, cached nach erstem Load)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    console.log('[FFmpeg] Successfully loaded');
    return ffmpeg;
  } finally {
    isLoading = false;
  }
}

/**
 * Konvertiert WebM-Video zu MP4 (H.264 + AAC)
 *
 * @param webmFile - WebM File vom MediaRecorder
 * @param onProgress - Optional: Progress-Callback (0-100)
 * @returns MP4 File
 */
export async function convertWebMToMP4(
  webmFile: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  const ffmpeg = await loadFFmpeg();

  const inputFileName = 'input.webm';
  const outputFileName = 'output.mp4';

  try {
    // Progress Listener
    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) {
        onProgress(Math.round(progress * 100));
      }
    });

    // Input-Datei zu FFmpeg Virtual File System schreiben
    await ffmpeg.writeFile(inputFileName, await fetchFile(webmFile));

    // Konvertierung: WebM (VP9/Opus) → MP4 (H.264/AAC)
    // -c:v libx264: H.264 Video Codec (universell kompatibel)
    // -preset ultrafast: Schnelle Konvertierung (für Client-Side)
    // -crf 28: Qualität (0-51, niedriger = besser, 28 = gute Balance)
    // -c:a aac: AAC Audio Codec (WhatsApp/QuickTime kompatibel)
    // -b:a 128k: Audio Bitrate 128kbps
    // -movflags +faststart: Optimiert für Web-Streaming
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputFileName
    ]);

    // Output-Datei aus FFmpeg FS lesen
    const data = await ffmpeg.readFile(outputFileName);
    // data ist Uint8Array, konvertiere zu Blob
    const uint8Array = data as Uint8Array;
    const mp4Blob = new Blob([uint8Array], { type: 'video/mp4' });
    const mp4File = new File([mp4Blob], webmFile.name.replace('.webm', '.mp4'), {
      type: 'video/mp4',
      lastModified: Date.now()
    });

    // Cleanup
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    console.log('[FFmpeg] Conversion complete:', {
      input: `${(webmFile.size / 1024 / 1024).toFixed(2)} MB`,
      output: `${(mp4File.size / 1024 / 1024).toFixed(2)} MB`,
      format: 'MP4 (H.264/AAC)'
    });

    return mp4File;
  } catch (error) {
    console.error('[FFmpeg] Conversion failed:', error);
    throw new Error('Video-Konvertierung fehlgeschlagen. Bitte versuche es erneut.');
  }
}

/**
 * Prüft ob ein Video konvertiert werden muss (WebM → MP4)
 */
export function needsConversion(file: File): boolean {
  return file.type.includes('webm');
}
