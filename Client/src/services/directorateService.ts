/**
 * Wrappers around the /directorates endpoints from API_DOCUMENTATION.md.
 */
import { apiClient } from './apiClient';
import type {
  CreateDirectorateRequest,
  Directorate,
  DirectorateDetail,
  UpdateDirectorateRequest,
} from '../types/api';

/** Stable empty-array reference for `data ?? EMPTY_DIRECTORATES`
 *  fallbacks - see letterStats.ts's EMPTY_LETTERS for why this matters
 *  (a fresh `[]` literal would break useMemo dependency stability). */
export const EMPTY_DIRECTORATES: Directorate[] = [];

export async function fetchDirectorates(): Promise<Directorate[]> {
  const { data } = await apiClient.get<{ directorates: Directorate[] }>('/directorates');
  return data.directorates;
}

export async function fetchDirectorate(id: string | number): Promise<DirectorateDetail> {
  const { data } = await apiClient.get<{ directorate: DirectorateDetail }>(`/directorates/${id}`);
  return data.directorate;
}

export async function createDirectorate(payload: CreateDirectorateRequest) {
  const { data } = await apiClient.post('/directorates', payload);
  return data;
}

export async function updateDirectorate(id: string | number, payload: UpdateDirectorateRequest) {
  const { data } = await apiClient.patch(`/directorates/${id}`, payload);
  return data;
}

export async function deleteDirectorate(id: string | number) {
  const { data } = await apiClient.delete(`/directorates/${id}`);
  return data;
}
