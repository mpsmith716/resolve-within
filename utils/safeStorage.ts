
import * as SecureStore from 'expo-secure-store';

/**
 * Safe wrapper for SecureStore operations with fallback handling
 */

export async function safeGetItem(key: string, fallback: string | null = null): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value;
  } catch (error) {
    console.warn(`SafeStorage: Failed to read key "${key}", using fallback:`, error);
    return fallback;
  }
}

export async function safeSetItem(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.warn(`SafeStorage: Failed to write key "${key}":`, error);
    return false;
  }
}

export async function safeRemoveItem(key: string): Promise<boolean> {
  return safeDeleteItem(key);
}

export async function safeDeleteItem(key: string): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.warn(`SafeStorage: Failed to delete key "${key}":`, error);
    return false;
  }
}

/**
 * Safe wrapper for getting boolean values from storage
 */
export async function safeGetBoolean(key: string, fallback: boolean = false): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value === null) return fallback;
    return value === 'true';
  } catch (error) {
    console.warn(`SafeStorage: Failed to read boolean key "${key}", using fallback:`, error);
    return fallback;
  }
}

/**
 * Safe wrapper for setting boolean values in storage
 */
export async function safeSetBoolean(key: string, value: boolean): Promise<boolean> {
  return safeSetItem(key, value ? 'true' : 'false');
}

/**
 * Safe wrapper for getting JSON values from storage
 */
export async function safeGetJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value === null) return fallback;
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`SafeStorage: Failed to read JSON key "${key}", using fallback:`, error);
    return fallback;
  }
}

/**
 * Safe wrapper for setting JSON values in storage
 */
export async function safeSetJSON<T>(key: string, value: T): Promise<boolean> {
  try {
    const jsonString = JSON.stringify(value);
    return await safeSetItem(key, jsonString);
  } catch (error) {
    console.warn(`SafeStorage: Failed to write JSON key "${key}":`, error);
    return false;
  }
}
