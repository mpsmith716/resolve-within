
/**
 * Safe theme hook - ALWAYS returns a complete theme object
 * NEVER crashes from undefined theme properties
 */

import { DEFAULT_THEME, Theme, getSafeTheme } from '@/constants/theme';
import { useContext } from 'react';
import { ThemeContext } from '@react-navigation/native';

/**
 * Hook that returns the app theme
 * Guaranteed to NEVER return undefined or crash
 * 
 * If ThemeContext is missing or incomplete, returns DEFAULT_THEME merged with any provided values
 */
export function useTheme(): Theme {
  const themeFromContext = useContext(ThemeContext);
  
  // If no context, return DEFAULT_THEME
  if (!themeFromContext) {
    if (__DEV__) {
      console.warn('[useTheme] ThemeContext not found, using DEFAULT_THEME');
    }
    return DEFAULT_THEME;
  }
  
  // Merge context theme with DEFAULT_THEME to ensure all properties exist
  return getSafeTheme(themeFromContext as Partial<Theme>);
}
