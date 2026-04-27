
/**
 * Safe font weight utility
 * Prevents crashes from undefined typography objects
 * 
 * CRITICAL: These are hardcoded strings to prevent crashes when theme.fonts is undefined
 */

export type FontWeight = '400' | '500' | '600' | '700' | '800' | '900';

/**
 * Returns a safe font weight value
 * @param input - The input font weight (can be undefined)
 * @param fallback - The fallback font weight (default: '400')
 * @returns A safe font weight string
 */
export function safeFontWeight(
  input: string | number | undefined | null,
  fallback: FontWeight = '400'
): FontWeight {
  if (!input) return fallback;
  
  const weight = String(input);
  const validWeights: FontWeight[] = ['400', '500', '600', '700', '800', '900'];
  
  if (validWeights.includes(weight as FontWeight)) {
    return weight as FontWeight;
  }
  
  return fallback;
}

/**
 * Safe font weight constants
 * Use these instead of theme.typography.bold, theme.fonts.regular, etc.
 * 
 * CRITICAL: These are hardcoded strings to prevent crashes when theme.fonts is undefined
 * ALWAYS use these constants instead of accessing theme.fonts directly
 */
export const FontWeights = {
  regular: '400' as FontWeight,
  medium: '500' as FontWeight,
  semibold: '600' as FontWeight,
  bold: '700' as FontWeight,
  extrabold: '800' as FontWeight,
  black: '900' as FontWeight,
  heavy: '700' as FontWeight, // Alias for bold
};

/**
 * Get safe font family
 * Returns 'System' if input is invalid
 * 
 * @param fontFamily - Font family from theme (can be undefined)
 * @returns Safe font family string
 */
export function safeFontFamily(fontFamily?: string | null | undefined): string {
  if (typeof fontFamily === 'string' && fontFamily.length > 0) {
    return fontFamily;
  }
  return 'System';
}
