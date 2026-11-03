/**
 * Local, on-device reminders (no push token, nothing sent to the server).
 * Copy rules: gentle and optional. No guilt, no streaks, no "you missed" language.
 */
export type ReminderKey = 'checkInReminder' | 'dailyMessageReminder' | 'journalReminder' | 'crisisSupportReminder';

export interface ReminderDef {
  identifier: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  label: string;
  description: string;
}

export const REMINDERS: Record<ReminderKey, ReminderDef> = {
  checkInReminder: {
    identifier: 'resolve-within-check-in-reminder',
    title: 'Resolve Within',
    body: 'A gentle check-in: how are you feeling today?',
    hour: 18,
    minute: 0,
    label: 'Check-in Reminder',
    description: 'A gentle daily nudge to notice how you are feeling (6:00 PM)',
  },
  dailyMessageReminder: {
    identifier: 'resolve-within-daily-message-reminder',
    title: 'Daily Message',
    body: 'Your daily message is here whenever you would like it.',
    hour: 9,
    minute: 0,
    label: 'Daily Message Reminder',
    description: 'A reminder that your daily message is ready (9:00 AM)',
  },
  journalReminder: {
    identifier: 'resolve-within-journal-reminder',
    title: 'Journal',
    body: 'If you have a moment, your journal is here for you.',
    hour: 20,
    minute: 0,
    label: 'Journal Reminder',
    description: 'An optional nudge to write a few thoughts (8:00 PM)',
  },
  crisisSupportReminder: {
    identifier: 'resolve-within-crisis-support-reminder',
    title: 'You Are Not Alone',
    body: 'Support is here whenever you need it. If you are in crisis, call or text 988.',
    hour: 12,
    minute: 0,
    label: 'Support Reminder',
    description: 'A short reminder that support is available (12:00 PM)',
  },
};

export const REMINDER_KEYS = Object.keys(REMINDERS) as ReminderKey[];

export interface NotificationSettings extends Record<ReminderKey, boolean> {
  pushNotifications: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  pushNotifications: false,
  checkInReminder: false,
  dailyMessageReminder: false,
  journalReminder: false,
  crisisSupportReminder: false,
};

/** Saved settings may predate newer reminders; missing/invalid values default to off. */
export function parseSettings(raw: unknown): NotificationSettings {
  const out = { ...DEFAULT_SETTINGS };
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(out) as (keyof NotificationSettings)[]) {
      out[k] = (raw as Record<string, unknown>)[k] === true;
    }
  }
  return out;
}

/** Words that would add pressure or guilt; reminder copy must avoid them. */
export const PRESSURE_WORDS = /streak|missed|don't forget|you haven't|failed|lose|behind|should/i;
