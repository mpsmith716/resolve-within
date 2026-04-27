
/**
 * SafeGradient - A wrapper around LinearGradient that ensures safe color values
 * Prevents crashes from undefined or invalid gradient colors
 */

import React from 'react';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { getSafeGradient } from '@/constants/SafeDefaults';

interface SafeGradientProps extends Omit<LinearGradientProps, 'colors'> {
  colors?: string[] | null | undefined;
}

/**
 * SafeGradient component
 * Automatically validates and provides fallback colors for LinearGradient
 * 
 * Usage:
 * <SafeGradient colors={theme.colors.backgroundGradient} style={styles.container}>
 *   {children}
 * </SafeGradient>
 */
export function SafeGradient({ colors, ...props }: SafeGradientProps) {
  const safeColors = getSafeGradient(colors);
  
  return <LinearGradient colors={safeColors} {...props} />;
}
