/**
 * Thin wrappers around the /auth endpoints from API_DOCUMENTATION.md.
 * Pages/components should call these, not apiClient directly - if the
 * request/response shape ever needs adapting (e.g. a real backend
 * nests things differently), this is the one file that changes.
 */
import { apiClient } from './apiClient';
import type {
  AuthMeResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  LoginResponse,
} from '../types/api';

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

// signup() was removed along with the server's POST /auth/signup - it was
// an unauthenticated account-creation endpoint that accepted `role`.
// Accounts are created through userService.createUser (Management-only).

export async function fetchCurrentUser(): Promise<AuthMeResponse> {
  const { data } = await apiClient.get<AuthMeResponse>('/auth/me');
  return data;
}

/** Not in API_DOCUMENTATION.md - see types/api.ts's ChangePasswordRequest
 *  comment. Used by ForcePasswordResetPage after a Management user resets an
 *  account to the shared default password. */
export async function changePassword(payload: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const { data } = await apiClient.post<ChangePasswordResponse>('/auth/change-password', payload);
  return data;
}
