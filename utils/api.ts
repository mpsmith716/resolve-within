import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authClient, BEARER_TOKEN_KEY } from '@/lib/auth';

export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || '';

export const isBackendConfigured = (): boolean => {
  return !!BACKEND_URL && BACKEND_URL.length > 0;
};

export const getBearerToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined'
        ? window.localStorage.getItem(BEARER_TOKEN_KEY)
        : null;
    }

    return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
  } catch (error) {
    console.warn('[API] Error retrieving bearer token:', error);
    return null;
  }
};

const redactHeaders = (headers: any): any => {
  if (!headers) return headers;

  const redacted = { ...headers };

  if (redacted.Authorization) {
    redacted.Authorization = 'Bearer [REDACTED]';
  }

  if (redacted.Cookie) {
    redacted.Cookie = '[REDACTED COOKIE]';
  }

  return redacted;
};

const getAuthCookieHeader = (): string | null => {
  try {
    const cookie = authClient.getCookie?.();
    return cookie || null;
  } catch (error) {
    console.warn('[API] Could not get auth cookie:', error);
    return null;
  }
};

export const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  if (!isBackendConfigured()) {
    throw new Error('Backend URL not configured. Please rebuild the app.');
  }

  const url = `${BACKEND_URL}${endpoint}`;
  const method = options?.method || 'GET';

  console.log(`[API] ${method} ${endpoint}`);

  try {
    const fetchOptions: RequestInit = {
      ...options,
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    };

    console.log('[API] Headers:', redactHeaders(fetchOptions.headers));

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const text = await response.text();
      console.warn(`[API] ${method} ${endpoint} - ${response.status}:`, text);

      if (response.status === 401) {
        console.warn('[API] 401 Unauthorized - session/token may be missing or expired');
      }

      throw new Error(`API error: ${response.status} - ${text}`);
    }

    const text = await response.text();

    if (!text) {
      return {} as T;
    }

    const data = JSON.parse(text);
    console.log(`[API] ${method} ${endpoint} - Success`);
    return data;
  } catch (error: any) {
    console.warn(`[API] ${method} ${endpoint} - Failed:`, error?.message || error);
    throw error;
  }
};

export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: 'GET' });
};

export const apiPost = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const apiPut = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const apiPatch = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const apiDelete = async <T = any>(
  endpoint: string,
  data: any = {}
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
};

export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = await getBearerToken();
  const cookie = getAuthCookieHeader();

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> | undefined),
  };

  // Better Auth Expo usually authenticates native requests with Cookie.
  if (cookie) {
    headers.Cookie = cookie;
  }

  // Keep bearer as fallback.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Do not block here. Let the backend return 401 if auth is truly missing.
  if (!token && !cookie) {
    console.warn('[API] No bearer token or auth cookie found yet. Continuing request.');
  }

  return apiCall<T>(endpoint, {
    ...options,
    headers,
  });
};

export const authenticatedGet = async <T = any>(
  endpoint: string
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: 'GET' });
};

export const authenticatedPost = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const authenticatedPut = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const authenticatedPatch = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const authenticatedDelete = async <T = any>(
  endpoint: string,
  data: any = {}
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
};