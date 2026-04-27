
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAFE_DAILY_MESSAGE, FALLBACK_DAILY_MESSAGE } from './SafeDefaults';

export interface DailyMessageData {
  id: string;
  title: string;
  message: string;
  /** Alias for message — used by home screen */
  text: string;
  author: string;
  category: string;
  /** Alias for category — used by home screen */
  stream: string;
  gradient: string[];
}

const STORAGE_KEY_TEXT = 'daily_message_text';
const STORAGE_KEY_DATE = 'daily_message_date';

const DAILY_MESSAGES_RAW: Omit<DailyMessageData, 'text' | 'stream'>[] = [
  {
    id: 'msg-1',
    title: 'You Are Not Alone',
    message: 'You\'ve made it through every hard day so far. Today is no different.',
    author: 'Resolve Within',
    category: 'connection',
    gradient: ['#667EEA', '#764BA2'],
  },
  {
    id: 'msg-2',
    title: 'Strength in Vulnerability',
    message: 'Asking for help is not weakness — it\'s courage. The strongest warriors know when to seek support.',
    author: 'Resolve Within',
    category: 'courage',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  {
    id: 'msg-3',
    title: 'One Day at a Time',
    message: 'Healing isn\'t linear. Be gentle with yourself today.',
    author: 'Resolve Within',
    category: 'resilience',
    gradient: ['#FF6B6B', '#FFD93D'],
  },
  {
    id: 'msg-4',
    title: 'Your Mission Continues',
    message: 'You are allowed to rest. Rest is part of recovery.',
    author: 'Resolve Within',
    category: 'purpose',
    gradient: ['#8B7355', '#6B5B4F'],
  },
  {
    id: 'msg-5',
    title: 'Progress Over Perfection',
    message: 'Small steps still move you forward.',
    author: 'Resolve Within',
    category: 'growth',
    gradient: ['#1a2332', '#2a3f5f'],
  },
  {
    id: 'msg-6',
    title: 'The Power of Breath',
    message: 'When everything feels overwhelming, return to your breath. It\'s always there.',
    author: 'Resolve Within',
    category: 'grounding',
    gradient: ['#667EEA', '#764BA2'],
  },
  {
    id: 'msg-7',
    title: 'You Matter',
    message: 'Your feelings are valid. You don\'t have to explain them to anyone.',
    author: 'Resolve Within',
    category: 'worth',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  {
    id: 'msg-8',
    title: 'Keep Going',
    message: 'You don\'t have to feel okay to keep going. Just keep going.',
    author: 'Resolve Within',
    category: 'resilience',
    gradient: ['#FF6B6B', '#FFD93D'],
  },
  {
    id: 'msg-9',
    title: 'You Belong Here',
    message: 'You belong in this world. Your presence matters more than you know.',
    author: 'Resolve Within',
    category: 'worth',
    gradient: ['#667EEA', '#764BA2'],
  },
  {
    id: 'msg-10',
    title: 'Breathe',
    message: 'Take one slow breath. That\'s enough for right now.',
    author: 'Resolve Within',
    category: 'grounding',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  {
    id: 'msg-11',
    title: 'Courage',
    message: 'Showing up, even when it\'s hard, is an act of courage.',
    author: 'Resolve Within',
    category: 'courage',
    gradient: ['#8B7355', '#6B5B4F'],
  },
  {
    id: 'msg-12',
    title: 'Connection',
    message: 'You are not alone in this. Others have walked this road and found their way.',
    author: 'Resolve Within',
    category: 'connection',
    gradient: ['#1a2332', '#2a3f5f'],
  },
  {
    id: 'msg-13',
    title: 'Today',
    message: 'Today doesn\'t have to be perfect. It just has to be today.',
    author: 'Resolve Within',
    category: 'resilience',
    gradient: ['#FF6B6B', '#FFD93D'],
  },
  {
    id: 'msg-14',
    title: 'Worthy',
    message: 'You are worthy of care, rest, and peace — right now, as you are.',
    author: 'Resolve Within',
    category: 'worth',
    gradient: ['#667EEA', '#764BA2'],
  },
  {
    id: 'msg-15',
    title: 'Steady',
    message: 'Even on the hardest days, you are still standing. That counts.',
    author: 'Resolve Within',
    category: 'resilience',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  {
    id: 'msg-16',
    title: 'Patience',
    message: 'Healing takes time. Give yourself the same patience you\'d give a friend.',
    author: 'Resolve Within',
    category: 'growth',
    gradient: ['#8B7355', '#6B5B4F'],
  },
  {
    id: 'msg-17',
    title: 'Anchor',
    message: 'Notice five things around you. You are here. You are safe.',
    author: 'Resolve Within',
    category: 'grounding',
    gradient: ['#1a2332', '#2a3f5f'],
  },
  {
    id: 'msg-18',
    title: 'Reach Out',
    message: 'One message to someone you trust can change the whole day.',
    author: 'Resolve Within',
    category: 'connection',
    gradient: ['#FF6B6B', '#FFD93D'],
  },
  {
    id: 'msg-19',
    title: 'Momentum',
    message: 'You don\'t need motivation. You just need to start.',
    author: 'Resolve Within',
    category: 'growth',
    gradient: ['#667EEA', '#764BA2'],
  },
  {
    id: 'msg-20',
    title: 'Enough',
    message: 'You are enough. Not when you achieve more — right now.',
    author: 'Resolve Within',
    category: 'worth',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  {
    id: 'msg-21',
    title: 'Ground',
    message: 'Feel your feet on the floor. You are present. You are here.',
    author: 'Resolve Within',
    category: 'grounding',
    gradient: ['#8B7355', '#6B5B4F'],
  },
  {
    id: 'msg-22',
    title: 'Brave',
    message: 'Every day you choose to keep going is an act of bravery.',
    author: 'Resolve Within',
    category: 'courage',
    gradient: ['#1a2332', '#2a3f5f'],
  },
  {
    id: 'msg-23',
    title: 'Seen',
    message: 'Your struggle is real and it is seen. You don\'t have to minimize it.',
    author: 'Resolve Within',
    category: 'connection',
    gradient: ['#FF6B6B', '#FFD93D'],
  },
  {
    id: 'msg-24',
    title: 'Forward',
    message: 'You don\'t have to go fast. You just have to go.',
    author: 'Resolve Within',
    category: 'resilience',
    gradient: ['#667EEA', '#764BA2'],
  },
  {
    id: 'msg-25',
    title: 'Kindness',
    message: 'Be as kind to yourself today as you would be to someone you love.',
    author: 'Resolve Within',
    category: 'growth',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  {
    id: 'msg-26',
    title: 'Presence',
    message: 'This moment is all you need to handle. Just this one.',
    author: 'Resolve Within',
    category: 'grounding',
    gradient: ['#8B7355', '#6B5B4F'],
  },
  {
    id: 'msg-27',
    title: 'Trust',
    message: 'Trust the part of you that keeps showing up, even when it\'s hard.',
    author: 'Resolve Within',
    category: 'courage',
    gradient: ['#1a2332', '#2a3f5f'],
  },
  {
    id: 'msg-28',
    title: 'Rest',
    message: 'Rest is not giving up. Rest is how you prepare to keep going.',
    author: 'Resolve Within',
    category: 'resilience',
    gradient: ['#FF6B6B', '#FFD93D'],
  },
  {
    id: 'msg-29',
    title: 'Supported',
    message: 'You don\'t have to carry this alone. Support is available when you\'re ready.',
    author: 'Resolve Within',
    category: 'connection',
    gradient: ['#667EEA', '#764BA2'],
  },
  {
    id: 'msg-30',
    title: 'Strength',
    message: 'The fact that you\'re still here is proof of your strength.',
    author: 'Resolve Within',
    category: 'worth',
    gradient: ['#4ECDC4', '#44A08D'],
  },
];

/** Normalize raw message to full DailyMessageData shape */
function normalize(raw: Omit<DailyMessageData, 'text' | 'stream'>): DailyMessageData {
  return { ...raw, text: raw.message, stream: raw.category };
}

const DAILY_MESSAGES: DailyMessageData[] = DAILY_MESSAGES_RAW.map(normalize);

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get today's message based on the current date.
 * Uses a deterministic algorithm so the same message appears all day.
 */
export function getTodayMessage(): DailyMessageData {
  try {
    const today = new Date();
    const dayOfYear = getDayOfYear(today);
    const index = dayOfYear % DAILY_MESSAGES.length;
    const message = DAILY_MESSAGES[index];

    if (!message) {
      console.warn('DailyMessages: Failed to get message for index', index, '— using fallback');
      return normalize(SAFE_DAILY_MESSAGE);
    }

    return message;
  } catch (error) {
    console.warn('DailyMessages: Error calculating today\'s message, using fallback:', error);
    return normalize(SAFE_DAILY_MESSAGE);
  }
}

/**
 * Load today's message with AsyncStorage persistence.
 * Returns the same message for the whole calendar day; picks a new one on a new day.
 */
export async function loadPersistedDailyMessage(): Promise<DailyMessageData> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = await AsyncStorage.getItem(STORAGE_KEY_DATE);
    const savedText = await AsyncStorage.getItem(STORAGE_KEY_TEXT);

    if (savedDate === today && savedText) {
      console.log('[DailyMessages] Loaded persisted message for', today);
      // Find the matching message object so we return full DailyMessageData
      const found = DAILY_MESSAGES.find((m) => m.message === savedText);
      if (found) return found;
      // If text doesn't match any (e.g. old data), fall through to pick fresh
    }

    const dayOfYear = getDayOfYear(new Date());
    const index = dayOfYear % DAILY_MESSAGES.length;
    const newMessage = DAILY_MESSAGES[index] ?? normalize(SAFE_DAILY_MESSAGE);

    await AsyncStorage.setItem(STORAGE_KEY_DATE, today);
    await AsyncStorage.setItem(STORAGE_KEY_TEXT, newMessage.message);
    console.log('[DailyMessages] Saved new message for', today, '— index', index);

    return newMessage;
  } catch (error) {
    console.warn('DailyMessages: loadPersistedDailyMessage failed, using sync fallback:', error);
    return getTodayMessage();
  }
}

/**
 * Get a specific message by ID with fallback
 */
export function getMessageById(id: string): DailyMessageData {
  const message = DAILY_MESSAGES.find((msg) => msg.id === id);
  if (!message) {
    console.warn(`DailyMessages: Message "${id}" not found, using fallback`);
    return normalize(SAFE_DAILY_MESSAGE);
  }
  return message;
}

/**
 * Get all messages
 */
export function getAllMessages(): DailyMessageData[] {
  return DAILY_MESSAGES;
}

/**
 * Get a safe daily message with text/author shape, with fallback
 */
export function getSafeDailyMessage(): { text: string; author: string } {
  try {
    const msg = getTodayMessage();
    if (!msg || !msg.message) {
      return FALLBACK_DAILY_MESSAGE;
    }
    return { text: msg.message, author: msg.author };
  } catch (error) {
    console.warn('DailyMessages: getSafeDailyMessage failed, using fallback:', error);
    return FALLBACK_DAILY_MESSAGE;
  }
}
