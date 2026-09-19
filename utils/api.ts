import { Platform } from "react-native";
import { getAuthCookie, getBearerToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import {
  buildAuthenticatedHeaders,
  hasAuthCredential,
} from "@/lib/authHeaders";

/**
 * Backend URL — same shared resolution as auth (env → extra → Specular default)
 */
export const BACKEND_URL = API_BASE_URL;

/**
 * Check if backend is properly configured
 */
export const isBackendConfigured = (): boolean => {
  return !!BACKEND_URL && BACKEND_URL.length > 0;
};

/**
 * Redact sensitive headers for logging
 */
const redactHeaders = (headers: any): any => {
  if (!headers) return headers;

  const redacted = { ...headers };
  if (redacted.Authorization) {
    redacted.Authorization = "Bearer [REDACTED]";
  }
  if (redacted.Cookie) {
    redacted.Cookie = "[REDACTED COOKIE]";
  }
  return redacted;
};

/**
 * Generic API call helper with error handling
 *
 * @param endpoint - API endpoint path (e.g., '/users', '/auth/login')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed JSON response
 * @throws Error if backend is not configured or request fails
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  if (!isBackendConfigured()) {
    throw new Error("Backend URL not configured. Please rebuild the app.");
  }

  const url = `${BACKEND_URL}${endpoint}`;
  const method = options?.method || "GET";

  console.log(`[API] ${method} ${endpoint}`);

  try {
    const fetchOptions: RequestInit = {
      ...options,
      // Avoid interfering with manually attached Cookie (Expo docs).
      credentials: options?.credentials ?? (Platform.OS === "web" ? "include" : "omit"),
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    };

    console.log("[API] Headers:", redactHeaders(fetchOptions.headers));

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const text = await response.text();
      console.warn(`[API] ${method} ${endpoint} - ${response.status}:`, text);

      if (response.status === 401) {
        console.warn("[API] 401 Unauthorized - session/token may be missing or expired");
      }

      throw new Error(`API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    console.log(`[API] ${method} ${endpoint} - Success`);
    return data;
  } catch (error: any) {
    console.warn(`[API] ${method} ${endpoint} - Failed:`, error?.message || error);
    throw error;
  }
};

/**
 * GET request helper (public endpoint)
 */
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: "GET" });
};

/**
 * POST request helper (public endpoint)
 */
export const apiPost = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * PUT request helper (public endpoint)
 */
export const apiPut = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * PATCH request helper (public endpoint)
 */
export const apiPatch = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request helper (public endpoint)
 * Always sends a body to avoid FST_ERR_CTP_EMPTY_JSON_BODY errors
 */
export const apiDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "DELETE",
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated API call helper.
 * Uses expoClient Cookie (documented) and Bearer session token when present.
 */
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = await getBearerToken();
  const cookie = getAuthCookie();

  const headers = buildAuthenticatedHeaders({
    cookie,
    bearerToken: token,
    extra: options?.headers as Record<string, string> | undefined,
  });

  if (!hasAuthCredential(headers)) {
    console.warn("[API] No bearer token or auth cookie found - user must sign in first");
    throw new Error("Authentication token not found. Please sign in.");
  }

  return apiCall<T>(endpoint, {
    ...options,
    credentials: "omit",
    headers,
  });
};

/**
 * Authenticated GET request
 */
export const authenticatedGet = async <T = any>(endpoint: string): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "GET" });
};

/**
 * Authenticated POST request
 */
export const authenticatedPost = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated PUT request
 */
export const authenticatedPut = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated PATCH request
 */
export const authenticatedPatch = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated DELETE request
 * Always sends a body to avoid FST_ERR_CTP_EMPTY_JSON_BODY errors
 */
export const authenticatedDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "DELETE",
    body: JSON.stringify(data),
  });
};
