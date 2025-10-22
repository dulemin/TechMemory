import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export type SupabaseClient = ReturnType<typeof createClient<Database>>;

// Default event settings
export const DEFAULT_EVENT_SETTINGS = {
  maxGuests: 50,
  maxStorageGB: 5,
  autoApprove: false,
  allowVideo: true,
  allowPhoto: true,
  allowText: true,
  maxVideoDuration: 60,
  maxPhotoSizeMB: 5,
  shareExpireDays: 30,
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  EVENT_MEDIA: 'event-media',
  QR_CODES: 'qr-codes',
  EXPORTS: 'exports',
} as const;

// Validate file size
export function isValidFileSize(sizeBytes: number, maxMB: number): boolean {
  return sizeBytes <= maxMB * 1024 * 1024;
}

// Validate video duration
export function isValidVideoDuration(seconds: number, maxSeconds: number): boolean {
  return seconds <= maxSeconds;
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

// Generate storage path
export function generateStoragePath(
  eventId: string,
  contributionId: string,
  filename: string
): string {
  const ext = getFileExtension(filename);
  return `${eventId}/${contributionId}.${ext}`;
}
