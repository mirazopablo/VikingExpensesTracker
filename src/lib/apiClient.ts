/**
 * Centralized HTTP API Client for Viking Expenses REST API
 * Handles JWT Authorization headers, X-Profile-ID isolation, and automatic 401 silent token refresh.
 */

import { ApiAuthResponse, ApiResponse } from '../types/api';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/viking-expenses/api/v1';

const ACCESS_TOKEN_KEY = 'viking_access_token';
const REFRESH_TOKEN_KEY = 'viking_refresh_token';
const ACTIVE_PROFILE_ID_KEY = 'viking_active_profile_id';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const getActiveProfileId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
};

export const setActiveProfileId = (profileId: string | null) => {
  if (typeof window === 'undefined') return;
  if (profileId) {
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
  } else {
    localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
  }
};

export const clearTokens = () => {
  setAccessToken(null);
  setRefreshToken(null);
  setActiveProfileId(null);
};

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Core fetch wrapper with automatic headers injection and 401 token refresh interceptor.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { requiresAuth = true, headers: customHeaders, ...restOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (requiresAuth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const profileId = getActiveProfileId();
    if (profileId) {
      headers['X-Profile-ID'] = profileId;
    }
  }

  try {
    let response = await fetch(url, { ...restOptions, headers });

    // Handle HTTP 401 Unauthorized - Attempt Silent Refresh
    if (response.status === 401 && requiresAuth && !endpoint.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          clearTokens();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('viking_logout'));
          }
          throw new ApiError('Session expired. Please log in again.', 401);
        }

        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          const refreshData: ApiResponse<ApiAuthResponse> = await refreshResponse.json();

          if (refreshResponse.ok && refreshData.success && refreshData.data) {
            setAccessToken(refreshData.data.access_token);
            setRefreshToken(refreshData.data.refresh_token);
            processQueue(null, refreshData.data.access_token);

            // Retry original request with new token
            headers['Authorization'] = `Bearer ${refreshData.data.access_token}`;
            response = await fetch(url, { ...restOptions, headers });
          } else {
            clearTokens();
            processQueue(new ApiError('Refresh token invalid', 401));
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('viking_logout'));
            }
            throw new ApiError('Session expired. Please log in again.', 401);
          }
        } catch (err) {
          clearTokens();
          processQueue(err as Error);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('viking_logout'));
          }
          throw err;
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for token refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              headers['Authorization'] = `Bearer ${token}`;
              resolve(apiClient<T>(endpoint, { ...options, headers: customHeaders }));
            },
            reject: (err) => reject(err),
          });
        });
      }
    }

    const responseData: ApiResponse<T> = await response.json();

    if (!response.ok || !responseData.success) {
      const errorMessage =
        responseData.error || responseData.message || `HTTP error ${response.status}`;
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error or service unavailable',
      500
    );
  }
}
