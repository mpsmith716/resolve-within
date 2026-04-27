
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

/**
 * Mental Reset Branding Colors
 * CRITICAL: These are the source of truth for all app colors
 * All theme objects should reference these values
 */
export const colors = {
  // Primary colors
  background: '#0b1020',      // Midnight Navy
  card: '#121939',            // Steel Blue
  
  // Text colors
  text: '#FFFFFF',            // White
  textSecondary: '#CFD8FF',   // Subtext
  subtext: '#CFD8FF',         // Alias for textSecondary
  
  // Brand colors
  accent: '#FFD700',          // Gold
  primary: '#FFD700',         // Gold (for buttons)
  highlight: '#FFD700',       // Gold
  gold: '#FFD700',            // Explicit gold
  
  // Status colors
  danger: '#CC0000',          // Red for errors/warnings
  red: '#CC0000',             // Explicit red
  
  // UI colors
  secondary: '#121939',       // Steel Blue
  cardBackground: '#121939',  // Alias for card
  border: '#1a2a52',          // Border color
  
  // Gradient colors
  backgroundGradient: ['#0b1020', '#0a0e1a', '#0b1020'],
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.accent,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.card,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.accent,
  },
});
