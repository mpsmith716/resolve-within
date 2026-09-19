import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_BASE_URL } from "./apiBaseUrl";

const API_URL = API_BASE_URL;

export const BEARER_TOKEN_KEY = "mental-reset_bearer_token";

// Platform-specific storage: localStorage for web, SecureStore for native
const storage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) => localStorage.getItem(key),
        setItem: (key: string, value: string) => localStorage.setItem(key, value),
        deleteItem: (key: string) => localStorage.removeItem(key),
      }
    : SecureStore;

async function readBearerToken(): Promise<string | undefined> {
  try {
    if (Platform.OS === "web") {
      const value = localStorage.getItem(BEARER_TOKEN_KEY);
      return value || undefined;
    }
    const value = await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
    return value || undefined;
  } catch {
    return undefined;
  }
}

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "resolvewithin",
      storagePrefix: "resolvewithin",
      storage,
    }),
  ],
  fetchOptions: {
    // Web: browser cookie jar. Native: expoClient attaches Cookie manually; omit credentials.
    credentials: Platform.OS === "web" ? "include" : "omit",
    // Staging accepts Bearer session tokens; required on native when Set-Cookie
    // is not persisted into the expoClient jar (common RN/cross-origin case).
    auth: {
      type: "Bearer" as const,
      token: () => readBearerToken(),
    },
  },
});

export async function setBearerToken(token: string) {
  if (!token) return;
  if (Platform.OS === "web") {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
  }
}

export async function getBearerToken(): Promise<string | null> {
  const value = await readBearerToken();
  return value ?? null;
}

export async function clearAuthTokens() {
  if (Platform.OS === "web") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
  }
}

/** Session cookie string from expoClient SecureStore jar (documented Expo path). */
export function getAuthCookie(): string {
  try {
    const cookie = authClient.getCookie?.();
    return typeof cookie === "string" ? cookie : "";
  } catch {
    return "";
  }
}

export { API_URL };
