
import { DEFAULT_THEME } from './theme';

/**
 * Safe default values for the Resolve Within app
 * These are used as fallbacks when data loading fails
 */

export const FALLBACK_DAILY_MESSAGE = {
  text: "You have the strength to face today. Take it one moment at a time.",
  author: "Resolve Within",
};

export const FALLBACK_BREATHING_CONFIG = {
  name: "Box Breathing",
  inhale: 4,
  hold: 4,
  exhale: 4,
  holdAfterExhale: 4,
  cycles: 4,
  description: "A calming breathing technique used to reduce stress.",
};

export const FALLBACK_THEME = {
  background: "#0A1628",
  surface: "#112240",
  primary: "#C9A84C",
  text: "#FFFFFF",
  textSecondary: "#8899AA",
  border: "#1E3A5F",
};

// Theme defaults
export const SAFE_THEME = {
  primary: DEFAULT_THEME.primary,
  secondary: DEFAULT_THEME.secondary,
  accent: DEFAULT_THEME.accent,
  background: DEFAULT_THEME.background,
  card: DEFAULT_THEME.card,
  text: DEFAULT_THEME.text,
  subtext: DEFAULT_THEME.subtext,
  border: DEFAULT_THEME.border,
};

// Gradient defaults
export const SAFE_GRADIENTS = {
  primary: ['#0b1020', '#121939'],
  accent: ['#FFD700', '#FFA500'],
  calm: ['#1a2332', '#2a3f5f'],
  energized: ['#FF6B6B', '#FFD93D'],
  focused: ['#4ECDC4', '#44A08D'],
  grounded: ['#8B7355', '#6B5B4F'],
  peaceful: ['#667EEA', '#764BA2'],
};

// Breathing session defaults
export const SAFE_BREATHING_CONFIG = {
  level: 3,
  emoji: '😌',
  label: 'Calm',
  description: 'Find your center and restore balance',
  script: 'Let\'s take a moment to breathe together. Follow the circle as it expands and contracts.',
  breathingPattern: '4-4-4',
  inhaleTime: 4,
  holdTime: 4,
  exhaleTime: 4,
  gradient: ['#667EEA', '#764BA2'],
};

// Daily message default
export const SAFE_DAILY_MESSAGE = {
  id: 'fallback',
  title: 'You Are Not Alone',
  message: 'Every moment is a chance to reset. Take a deep breath and know that you have the strength within you.',
  author: 'Resolve Within',
  category: 'resilience',
  gradient: ['#0b1020', '#121939'],
};

// Daily reset default
export const SAFE_DAILY_RESET = {
  id: 'fallback-breathing',
  title: '2-Minute Breathing Reset',
  description: 'Slow breathing to calm your nervous system and regain control.',
  type: 'breathing' as const,
  targetMood: 'calm',
};

// Navigation safe defaults
export const SAFE_ROUTES = {
  home: '/',
  panic: '/panic',
  profile: '/(tabs)/profile',
  veterans: '/(tabs)/veterans',
};

/**
 * Safely get a gradient, falling back to primary if invalid
 */
export function getSafeGradient(gradient: string[] | undefined | null): string[] {
  if (!gradient || !Array.isArray(gradient) || gradient.length < 2) {
    console.warn('SafeDefaults: Invalid gradient provided, using primary fallback');
    return SAFE_GRADIENTS.primary;
  }
  return gradient;
}

/**
 * Safely get a theme color, falling back to default if invalid
 */
export function getSafeColor(color: string | undefined | null, fallback: keyof typeof SAFE_THEME): string {
  if (!color || typeof color !== 'string') {
    console.warn(`SafeDefaults: Invalid color provided, using ${fallback} fallback`);
    return SAFE_THEME[fallback];
  }
  return color;
}

/**
 * Safely parse a number, falling back to default if invalid
 */
export function getSafeNumber(value: any, fallback: number): number {
  const parsed = Number(value);
  if (isNaN(parsed) || !isFinite(parsed)) {
    console.warn(`SafeDefaults: Invalid number "${value}", using fallback ${fallback}`);
    return fallback;
  }
  return parsed;
}

/**
 * Safely parse a string, falling back to default if invalid
 */
export function getSafeString(value: any, fallback: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    console.warn(`SafeDefaults: Invalid string, using fallback "${fallback}"`);
    return fallback;
  }
  return value;
}

/**
 * Safely parse a boolean, falling back to default if invalid
 */
export function getSafeBoolean(value: any, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  console.warn(`SafeDefaults: Invalid boolean "${value}", using fallback ${fallback}`);
  return fallback;
}

/**
 * Safely get an array, falling back to empty array if invalid
 */
export function getSafeArray<T>(value: any, fallback: T[] = []): T[] {
  if (!Array.isArray(value)) {
    console.warn('SafeDefaults: Invalid array, using fallback');
    return fallback;
  }
  return value;
}

/**
 * Safely get an object, falling back to default if invalid
 */
export function getSafeObject<T extends object>(value: any, fallback: T): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    console.warn('SafeDefaults: Invalid object, using fallback');
    return fallback;
  }
  return value as T;
}
