
/**
 * Safe wrappers for risky operations in Resolve Within
 * These wrappers ensure the app never crashes from common failure points
 */

import { getTodayMessage, DailyMessageData } from '@/constants/dailyMessages';
import { getTodayReset, DailyResetData } from '@/constants/dailyResets';
import { SAFE_DAILY_MESSAGE, SAFE_DAILY_RESET, SAFE_BREATHING_CONFIG } from '@/constants/SafeDefaults';
import { safeGetJSON, safeSetJSON, safeGetBoolean, safeSetBoolean } from './safeStorage';
import { Animated } from 'react-native';

/**
 * Safely get today's daily message with fallback
 */
export function safeGetTodayMessage(): DailyMessageData {
  try {
    const message = getTodayMessage();
    if (!message || !message.title || !message.message) {
      console.warn('SafeWrappers: Invalid daily message, using fallback');
      return SAFE_DAILY_MESSAGE;
    }
    return message;
  } catch (error) {
    console.warn('SafeWrappers: Failed to get daily message, using fallback:', error);
    return SAFE_DAILY_MESSAGE;
  }
}

/**
 * Safely get today's reset exercise with fallback
 */
export function safeGetTodayReset(): DailyResetData {
  try {
    const reset = getTodayReset();
    if (!reset || !reset.title || !reset.description) {
      console.warn('SafeWrappers: Invalid daily reset, using fallback');
      return SAFE_DAILY_RESET;
    }
    return reset;
  } catch (error) {
    console.warn('SafeWrappers: Failed to get daily reset, using fallback:', error);
    return SAFE_DAILY_RESET;
  }
}

/**
 * Safely get breathing config with fallback
 */
export function safeGetBreathingConfig(mood: string): any {
  try {
    // This would normally import from reset-session.tsx's MOOD_CONFIGS
    // For now, return the safe default
    return SAFE_BREATHING_CONFIG;
  } catch (error) {
    console.warn('SafeWrappers: Failed to get breathing config, using fallback:', error);
    return SAFE_BREATHING_CONFIG;
  }
}

/**
 * Safely check disclaimer status
 */
export async function safeCheckDisclaimerStatus(): Promise<boolean> {
  try {
    const accepted = await safeGetBoolean('crisisDisclaimerAccepted', false);
    return accepted;
  } catch (error) {
    console.warn('SafeWrappers: Failed to check disclaimer status, assuming not accepted:', error);
    return false;
  }
}

/**
 * Safely set disclaimer status
 */
export async function safeSetDisclaimerStatus(accepted: boolean): Promise<boolean> {
  try {
    const success = await safeSetBoolean('crisisDisclaimerAccepted', accepted);
    if (!success) {
      console.warn('SafeWrappers: Failed to save disclaimer status, but continuing');
    }
    return success;
  } catch (error) {
    console.warn('SafeWrappers: Error setting disclaimer status:', error);
    return false;
  }
}

/**
 * Safely start an animation with error handling
 */
export function safeStartAnimation(
  animation: Animated.CompositeAnimation,
  onComplete?: () => void
): void {
  try {
    animation.start((result) => {
      if (result.finished && onComplete) {
        onComplete();
      }
    });
  } catch (error) {
    console.warn('SafeWrappers: Animation failed to start:', error);
    // Call completion callback anyway to prevent UI from getting stuck
    if (onComplete) {
      onComplete();
    }
  }
}

/**
 * Safely stop an animation
 */
export function safeStopAnimation(animation: Animated.CompositeAnimation): void {
  try {
    animation.stop();
  } catch (error) {
    console.warn('SafeWrappers: Animation failed to stop:', error);
  }
}

/**
 * Safely parse JSON with fallback
 */
export function safeParseJSON<T>(jsonString: string, fallback: T): T {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return fallback;
    }
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.warn('SafeWrappers: Failed to parse JSON, using fallback:', error);
    return fallback;
  }
}

/**
 * Safely stringify JSON with fallback
 */
export function safeStringifyJSON(value: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('SafeWrappers: Failed to stringify JSON, using fallback:', error);
    return fallback;
  }
}

/**
 * Safely execute an async function with error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  errorMessage: string = 'Async operation failed'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn(`SafeWrappers: ${errorMessage}:`, error);
    return fallback;
  }
}

/**
 * Safely execute a sync function with error handling
 */
export function safeSync<T>(
  fn: () => T,
  fallback: T,
  errorMessage: string = 'Sync operation failed'
): T {
  try {
    return fn();
  } catch (error) {
    console.warn(`SafeWrappers: ${errorMessage}:`, error);
    return fallback;
  }
}

/**
 * Create a safe version of any function that catches errors
 */
export function makeSafe<T extends (...args: any[]) => any>(
  fn: T,
  fallbackValue?: ReturnType<T>
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      console.warn('SafeWrappers: Function threw error:', error);
      return fallbackValue;
    }
  }) as T;
}

/**
 * Create a safe version of any async function that catches errors
 */
export function makeSafeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  fallbackValue?: Awaited<ReturnType<T>>
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.warn('SafeWrappers: Async function threw error:', error);
      return fallbackValue;
    }
  }) as T;
}
