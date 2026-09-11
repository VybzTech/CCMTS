/**
 * Wrappers around the /letters endpoints from API_DOCUMENTATION.md.
 * Every list/detail call returns exactly the shape documented there -
 * see types/api.ts for the full Letter interface and its field-by-field
 * notes (liabilityValue as a string, underscored status values, etc).
 */
import { API_BASE_URL, apiClient } from './apiClient';
import type {
  AutoAllocateRequest,
  AutoAllocateResponse,
  BulkCreateLetterRequest,
  CreateLetterRequest,
  Letter,
  LetterListParams,
  LetterListResponse,
  RejectLetterRequest,
  UndeliveredLetterRequest,
} from '../types/api';

export async function fetchLetters(params: LetterListParams = {}): Promise<LetterListResponse> {
  const { data } = await apiClient.get<LetterListResponse>('/letters', { params });
  return data;
}

export async function fetchLetter(id: string | number): Promise<Letter> {
  const { data } = await apiClient.get<{ letter: Letter }>(`/letters/${id}`);
  return data.letter;
}

export async function createLetter(payload: CreateLetterRequest) {
  const { data } = await apiClient.post('/letters/single', payload);
  return data;
}

export async function createLettersBulk(payload: BulkCreateLetterRequest[]) {
  const { data } = await apiClient.post('/letters/bulk', payload);
  return data;
}

export async function approveLetter(id: string | number) {
  const { data } = await apiClient.patch(`/letters/${id}/approve`);
  return data;
}

export async function rejectLetter(id: string | number, payload: RejectLetterRequest = {}) {
  const { data } = await apiClient.patch(`/letters/${id}/reject`, payload);
  return data;
}

export async function autoAllocateLetters(payload: AutoAllocateRequest): Promise<AutoAllocateResponse> {
  const { data } = await apiClient.post<AutoAllocateResponse>('/letters/auto-allocate', payload);
  return data;
}

export async function allocateLetterToCourier(letterId: string | number, courierId: string | number) {
  const { data } = await apiClient.post(`/letters/${letterId}/allocate/${courierId}`);
  return data;
}

export async function markLetterInTransit(id: string | number) {
  const { data } = await apiClient.patch(`/letters/${id}/in-transit`);
  return data;
}

/** Proof-of-delivery constraints, mirrored from the `multer` config in
 *  Server/src/middleware/upload.js so a rider on mobile data finds out
 *  a photo is too big *before* spending the upload, not after a 500. */
export const POD_MAX_BYTES = 5 * 1024 * 1024;
export const POD_ACCEPTED_MIME_PREFIX = 'image/';

/** Returns null when `file` is acceptable, or a human-readable reason
 *  why it isn't. Same two rules the server enforces. */
export function validatePodImage(file: File): string | null {
  if (!file.type.startsWith(POD_ACCEPTED_MIME_PREFIX)) {
    return 'Proof of delivery must be an image (JPG, PNG, HEIC…).';
  }
  if (file.size > POD_MAX_BYTES) {
    return 'That photo is over the 5MB limit. Try again with a lower-resolution shot.';
  }
  return null;
}

/**
 * Marks a letter delivered, optionally attaching a proof-of-delivery
 * photo. The field name MUST stay `pod_image` - that's what the
 * server's `uploadPod.single("pod_image")` middleware looks for, and a
 * mismatch silently yields no file rather than an error.
 *
 * `Content-Type: undefined` is deliberate: apiClient sets a default of
 * `application/json`, and sending that with a FormData body means the
 * multipart boundary never makes it into the header, so multer parses
 * nothing. Clearing it lets axios set `multipart/form-data; boundary=…`
 * itself.
 */
export async function markLetterDelivered(id: string | number, podImage?: File | null) {
  if (!podImage) {
    const { data } = await apiClient.patch(`/letters/${id}/delivered`);
    return data;
  }

  const formData = new FormData();
  formData.append('pod_image', podImage);

  const { data } = await apiClient.patch(`/letters/${id}/delivered`, formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

/**
 * Turns a Letter's `podImagePath` into a URL the browser can load.
 * The backend mounts `/uploads` on the API *origin* (see app.js's
 * `app.use('/uploads', express.static('uploads'))`), one level above
 * the `/api/v1` prefix API_BASE_URL carries - so this strips the path
 * off the base URL rather than appending to it.
 */
export function podImageUrl(podImagePath: string | null | undefined): string | null {
  if (!podImagePath) return null;
  try {
    return new URL(`/${podImagePath.replace(/^\/+/, '')}`, API_BASE_URL).toString();
  } catch {
    return null;
  }
}

export async function markLetterUndelivered(id: string | number, payload: UndeliveredLetterRequest = {}) {
  const { data } = await apiClient.patch(`/letters/${id}/undelivered`, payload);
  return data;
}
