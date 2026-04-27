
import { router } from 'expo-router';

/**
 * Safe navigation utilities that prevent crashes from invalid routes or params
 */

export function safeNavigate(route: string, params?: Record<string, any>): void {
  try {
    console.log('SafeNavigation: Navigating to', route, params);
    if (params) {
      router.push({ pathname: route as any, params });
    } else {
      router.push(route as any);
    }
  } catch (error) {
    console.warn(`SafeNavigation: Failed to navigate to "${route}", redirecting to home:`, error);
    try {
      router.push('/');
    } catch (fallbackError) {
      console.warn('SafeNavigation: Critical - failed to navigate to home:', fallbackError);
    }
  }
}

export function safeNavigateBack(): void {
  try {
    console.log('SafeNavigation: Navigating back');
    if (router.canGoBack()) {
      router.back();
    } else {
      console.log('SafeNavigation: Cannot go back, navigating to home');
      router.push('/');
    }
  } catch (error) {
    console.warn('SafeNavigation: Failed to navigate back, redirecting to home:', error);
    try {
      router.push('/');
    } catch (fallbackError) {
      console.warn('SafeNavigation: Critical - failed to navigate to home:', fallbackError);
    }
  }
}

export function safeReplace(route: string, params?: Record<string, any>): void {
  try {
    console.log('SafeNavigation: Replacing with', route, params);
    if (params) {
      router.replace({ pathname: route as any, params });
    } else {
      router.replace(route as any);
    }
  } catch (error) {
    console.warn(`SafeNavigation: Failed to replace with "${route}", redirecting to home:`, error);
    try {
      router.replace('/');
    } catch (fallbackError) {
      console.warn('SafeNavigation: Critical - failed to replace with home:', fallbackError);
    }
  }
}

/**
 * Safely get route params with fallback values
 */
export function getSafeParam<T>(
  params: Record<string, any> | undefined,
  key: string,
  fallback: T
): T {
  if (!params || !(key in params) || params[key] === undefined || params[key] === null) {
    console.warn(`SafeNavigation: Missing or invalid param "${key}", using fallback:`, fallback);
    return fallback;
  }
  return params[key] as T;
}

/**
 * Validate that all required params are present
 */
export function validateParams(
  params: Record<string, any> | undefined,
  requiredKeys: string[]
): boolean {
  if (!params) {
    console.warn('SafeNavigation: No params provided, but required keys:', requiredKeys);
    return false;
  }

  const missingKeys = requiredKeys.filter(
    (key) => !(key in params) || params[key] === undefined || params[key] === null
  );

  if (missingKeys.length > 0) {
    console.warn('SafeNavigation: Missing required params:', missingKeys);
    return false;
  }

  return true;
}

/**
 * Navigate with param validation - redirects to home if params are invalid
 */
export function safeNavigateWithValidation(
  route: string,
  params: Record<string, any> | undefined,
  requiredKeys: string[]
): void {
  if (!validateParams(params, requiredKeys)) {
    console.warn(
      `SafeNavigation: Invalid params for route "${route}", redirecting to home`
    );
    safeNavigate('/');
    return;
  }

  safeNavigate(route, params);
}
