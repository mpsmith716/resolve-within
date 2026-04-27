
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@resolve_within_message_preferences';

export type Tone = 'Calm' | 'Encouraging' | 'Direct';
export type Audience = 'General' | 'Veteran-aware';

export interface MessagePreferences {
  tone: Tone;
  audience: Audience;
}

export const DEFAULT_PREFERENCES: MessagePreferences = {
  tone: 'Calm',
  audience: 'General',
};

/**
 * Load saved message preferences from AsyncStorage
 */
export async function loadMessagePreferences(): Promise<MessagePreferences> {
  try {
    const savedPreferences = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedPreferences) {
      return JSON.parse(savedPreferences);
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.warn('Error loading message preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save message preferences to AsyncStorage
 */
export async function saveMessagePreferences(preferences: MessagePreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Error saving message preferences:', error);
  }
}

/**
 * Apply message preferences to a base message
 * This can be used throughout the app to customize messages based on user preferences
 */
export function applyMessagePreferences(
  baseMessage: string,
  preferences: MessagePreferences
): string {
  // For now, return the base message as-is
  // In the future, this could apply tone/audience transformations
  return baseMessage;
}

/**
 * Get a customized daily message based on preferences
 */
export function getCustomizedDailyMessage(preferences: MessagePreferences): string {
  const messages: Record<Tone, Record<Audience, string[]>> = {
    Calm: {
      General: [
        'Take a moment to breathe. You are doing better than you think.',
        'Peace begins with a single breath. You are worthy of calm.',
        'Today, be gentle with yourself. You are enough.',
      ],
      'Veteran-aware': [
        'Take a moment to breathe. Your service matters, and so does your wellbeing.',
        'You have carried heavy burdens. Today, let yourself rest.',
        'Your strength is not measured by how much you carry, but by knowing when to set it down.',
      ],
    },
    Encouraging: {
      General: [
        'You are stronger than you know. Keep moving forward, one step at a time.',
        'Every small step forward is progress. You are doing great.',
        'Believe in yourself. You have overcome challenges before, and you will again.',
      ],
      'Veteran-aware': [
        'You have faced challenges before and overcome them. This moment is no different.',
        'Your resilience is your superpower. Keep pushing forward, warrior.',
        'You have served with honor. Now serve yourself with the same dedication.',
      ],
    },
    Direct: {
      General: [
        'Right now, focus on what you can control. Start with your breath.',
        'Action beats anxiety. Take one small step forward today.',
        'Stop overthinking. Breathe. Focus. Move forward.',
      ],
      'Veteran-aware': [
        'Mission focus: Control your breath. Ground yourself. Move forward.',
        'You know the drill: Assess. Adapt. Execute. You have got this.',
        'Tactical pause. Breathe. Regroup. Continue the mission.',
      ],
    },
  };

  const messageArray = messages[preferences.tone][preferences.audience];
  const randomIndex = Math.floor(Math.random() * messageArray.length);
  return messageArray[randomIndex];
}
