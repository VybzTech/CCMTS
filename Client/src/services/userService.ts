/**
 * Wrappers around /users - a Management-only pair of endpoints that
 * is NOT part of API_DOCUMENTATION.md (the doc only documents open
 * /auth/signup). See types/api.ts's UserRole comment and
 * mock-server/server.cjs's "Users" section for the full reasoning.
 */
import { apiClient } from './apiClient';
import type {
  CreateUserRequest,
  CreateUserResponse,
  ResetUserPasswordResponse,
  SetUserDisabledResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  User,
} from '../types/api';

export async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get<{ users: User[] }>('/users');
  return data.users;
}

export async function createUser(payload: CreateUserRequest): Promise<CreateUserResponse> {
  const { data } = await apiClient.post<CreateUserResponse>('/users', payload);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserRequest): Promise<UpdateUserResponse> {
  const { data } = await apiClient.patch<UpdateUserResponse>(`/users/${id}`, payload);
  return data;
}

export async function setUserDisabled(id: string, disabled: boolean): Promise<SetUserDisabledResponse> {
  const { data } = await apiClient.patch<SetUserDisabledResponse>(`/users/${id}/disable`, { disabled });
  return data;
}

export async function resetUserPassword(id: string): Promise<ResetUserPasswordResponse> {
  const { data } = await apiClient.post<ResetUserPasswordResponse>(`/users/${id}/reset-password`);
  return data;
}
