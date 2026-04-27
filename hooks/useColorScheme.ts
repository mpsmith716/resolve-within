
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Safe color scheme hook that never crashes
 * Returns 'light' or 'dark' based on system preference
 */
export function useColorScheme(): 'light' | 'dark' {
  try {
    const colorScheme = useRNColorScheme();
    // Default to 'dark' for Resolve Within's theme
    return colorScheme === 'light' ? 'light' : 'dark';
  } catch (error) {
    console.warn('useColorScheme: Failed to get color scheme, defaulting to dark:', error);
    return 'dark';
  }
}
