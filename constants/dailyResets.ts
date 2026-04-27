
import { SAFE_DAILY_RESET } from './SafeDefaults';

export interface DailyResetData {
  id: string;
  title: string;
  description: string;
  type: 'breathing' | 'grounding' | 'reflection' | 'relaxation';
  targetMood?: string;
}

const DAILY_RESETS: DailyResetData[] = [
  {
    id: 'reset-breathing-calm',
    title: '2-Minute Breathing Reset',
    description: 'Slow breathing to calm your nervous system and regain control.',
    type: 'breathing',
    targetMood: 'calm',
  },
  {
    id: 'reset-grounding-5-4-3-2-1',
    title: 'Grounding Exercise',
    description: 'Use your senses to reconnect with the present moment.',
    type: 'grounding',
  },
  {
    id: 'reset-breathing-energized',
    title: 'Energizing Breath',
    description: 'Quick breathing technique to boost energy and focus.',
    type: 'breathing',
    targetMood: 'energized',
  },
  {
    id: 'reset-relaxation-body-scan',
    title: 'Body Relaxation Reset',
    description: 'Release tension from head to toe with guided relaxation.',
    type: 'relaxation',
  },
  {
    id: 'reset-reflection-gratitude',
    title: 'Quick Reflection Prompt',
    description: 'Take a moment to reflect on one thing you\'re grateful for today.',
    type: 'reflection',
  },
  {
    id: 'reset-breathing-focused',
    title: 'Focus Breathing',
    description: 'Sharpen your concentration with intentional breathing.',
    type: 'breathing',
    targetMood: 'focused',
  },
  {
    id: 'reset-grounding-box-breathing',
    title: 'Box Breathing Reset',
    description: 'Military-grade breathing technique for instant calm.',
    type: 'breathing',
    targetMood: 'grounded',
  },
];

/**
 * Get today's reset based on the current date
 * Uses a deterministic algorithm so the same reset appears all day
 */
export function getTodayReset(): DailyResetData {
  try {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % DAILY_RESETS.length;
    const reset = DAILY_RESETS[index];
    
    if (!reset) {
      console.warn('DailyResets: Failed to get reset for index', index, 'using fallback');
      return SAFE_DAILY_RESET;
    }
    
    return reset;
  } catch (error) {
    console.warn('DailyResets: Error calculating today\'s reset, using fallback:', error);
    return SAFE_DAILY_RESET;
  }
}

/**
 * Get a specific reset by ID with fallback
 */
export function getResetById(id: string): DailyResetData {
  const reset = DAILY_RESETS.find((r) => r.id === id);
  if (!reset) {
    console.warn(`DailyResets: Reset "${id}" not found, using fallback`);
    return SAFE_DAILY_RESET;
  }
  return reset;
}

/**
 * Get all resets
 */
export function getAllResets(): DailyResetData[] {
  return DAILY_RESETS;
}
