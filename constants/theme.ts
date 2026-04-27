
/**
 * DEFAULT_THEME - Complete theme object with ALL required properties
 * This prevents crashes when theme properties are undefined
 * 
 * CRITICAL: This object MUST include every color and font key used in the app
 */

import { colors } from '@/styles/commonStyles';

export interface ThemeColors {
  background: string;
  card: string;
  cardBackground: string; // Added for onboarding
  text: string;
  mutedText: string;
  textSecondary: string; // Alias for mutedText
  subtext: string; // Alias for mutedText
  brand: string;
  accent: string; // Alias for brand
  primary: string; // Alias for brand
  danger: string;
  red: string; // Alias for danger
  tabBar: string;
  tabIcon: string;
  tabIconActive: string;
  border: string;
  gold: string;
  backgroundGradient: string[];
}

export interface ThemeFonts {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
  extrabold: string;
  heavy: string;
  black: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

/**
 * DEFAULT_THEME - Safe fallback for all theme properties
 * ALWAYS returns valid values, never undefined
 */
export const DEFAULT_THEME: Theme = {
  dark: true,
  colors: {
    // Primary colors
    background: colors.background || '#0b1020',
    card: colors.card || '#121939',
    cardBackground: colors.card || '#121939',
    text: colors.text || '#FFFFFF',
    mutedText: colors.textSecondary || '#CFD8FF',
    textSecondary: colors.textSecondary || '#CFD8FF',
    subtext: colors.textSecondary || '#CFD8FF',
    
    // Brand colors
    brand: colors.accent || '#FFD700',
    accent: colors.accent || '#FFD700',
    primary: colors.accent || '#FFD700',
    gold: colors.accent || '#FFD700',
    
    // Status colors
    danger: '#CC0000',
    red: '#CC0000',
    
    // UI colors
    tabBar: colors.card || '#121939',
    tabIcon: colors.textSecondary || '#CFD8FF',
    tabIconActive: colors.accent || '#FFD700',
    border: colors.card || '#121939',
    
    // Gradients
    backgroundGradient: [
      colors.background || '#0b1020',
      '#0a0e1a',
      colors.background || '#0b1020'
    ],
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    extrabold: 'System',
    heavy: 'System',
    black: 'System',
  },
};

/**
 * Deep merge utility for theme objects
 * Ensures all nested properties are merged correctly
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (sourceValue === null || sourceValue === undefined) {
      // Keep target value if source is null/undefined
      continue;
    }
    
    if (
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge nested objects
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      // Direct assignment for primitives and arrays
      result[key] = sourceValue as any;
    }
  }
  
  return result;
}

/**
 * Get safe theme - NEVER returns undefined
 * Merges provided theme with DEFAULT_THEME
 */
export function getSafeTheme(theme?: Partial<Theme> | null): Theme {
  if (!theme) {
    return DEFAULT_THEME;
  }
  
  return deepMerge(DEFAULT_THEME, theme);
}
