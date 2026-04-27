import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = 'https://bcbpzb8nm7j2wkh7vmms5j4hf6m3be9b.app.specular.dev';

export const APP_SCHEME = 'resolvewithin';
export const AUTH_STORAGE_PREFIX = 'resolve-within';
export const BEARER_TOKEN_KEY = 'resolve-within_bearer_token';

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: APP_SCHEME,
      storagePrefix: AUTH_STORAGE_PREFIX,
      storage: SecureStore,
    }),
  ],

  ...(Platform.OS === 'web' && {
    fetchOptions: {
      credentials: 'include' as const,
    },
  }),
});

export async function setBearerToken(token: string) {
  if (!token) return;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BEARER_TOKEN_KEY, token);
    }
    return;
  }

  await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
}

export async function getBearerToken() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(BEARER_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(BEARER_TOKEN_KEY);
}

export async function clearAuthTokens() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(BEARER_TOKEN_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
}

export function getAuthCookie() {
  try {
    return authClient.getCookie();
  } catch {
    return '';
  }
}

export function getAuthHeaders() {
  const cookie = getAuthCookie();

  return {
    ...(cookie ? { Cookie: cookie } : {}),
  };
}