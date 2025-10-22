import { Event, Contribution, Profile, EventSettings } from './database';

// API Request/Response Types

// Event APIs
export interface CreateEventRequest {
  title: string;
  description?: string;
  eventDate: string;
  settings?: Partial<EventSettings>;
}

export interface CreateEventResponse {
  event: Event;
  qrCodeUrl: string;
  guestUrl: string;
}

export interface GetEventResponse {
  event: Event;
  host: Profile;
  contributionsCount: number;
  approvedCount: number;
  pendingCount: number;
}

// Contribution APIs
export interface CreateContributionRequest {
  eventCode: string;
  guestName: string;
  type: 'video' | 'photo' | 'text';
  textContent?: string;
}

export interface UploadMediaResponse {
  contributionId: string;
  uploadUrl: string;
  publicUrl: string;
}

export interface UpdateContributionStatusRequest {
  contributionId: string;
  status: 'approved' | 'rejected';
}

// Export APIs
export interface ExportEventRequest {
  eventId: string;
  format: 'zip' | 'pdf';
  includeRejected?: boolean;
}

export interface ExportEventResponse {
  downloadUrl: string;
  expiresAt: string;
}

// Live Wall
export interface LiveWallData {
  eventId: string;
  contributions: Contribution[];
  settings: {
    slideDuration: number; // seconds
    layout: 'slideshow' | 'grid';
  };
}

// Error Response
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
