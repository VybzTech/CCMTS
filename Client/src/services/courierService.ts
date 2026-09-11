/**
 * Wrappers around the /couriers endpoints from API_DOCUMENTATION.md.
 */
import { apiClient } from './apiClient';
import type {
  Courier,
  CourierDetail,
  CreateCourierRequest,
  UpdateCourierAvailabilityRequest,
  UpdateCourierPerformanceRequest,
} from '../types/api';

export async function fetchCouriers(): Promise<Courier[]> {
  const { data } = await apiClient.get<{ couriers: Courier[] }>('/couriers');
  return data.couriers;
}

export async function fetchCourier(id: string | number): Promise<CourierDetail> {
  const { data } = await apiClient.get<{ courier: CourierDetail }>(`/couriers/${id}`);
  return data.courier;
}

export async function createCourier(payload: CreateCourierRequest) {
  const { data } = await apiClient.post('/couriers', payload);
  return data;
}

export async function updateCourierAvailability(
  id: string | number,
  payload: UpdateCourierAvailabilityRequest
) {
  const { data } = await apiClient.patch(`/couriers/${id}/availability`, payload);
  return data;
}

export async function updateCourierPerformance(
  id: string | number,
  payload: UpdateCourierPerformanceRequest
) {
  const { data } = await apiClient.patch(`/couriers/${id}/performance`, payload);
  return data;
}
