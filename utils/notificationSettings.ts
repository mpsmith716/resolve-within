
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isExpoGo,
  requestNotificationPermissions,
  scheduleNotification,
  cancelAllScheduledNotifications,
} from './notificationHelpers';

const STORAGE_KEY = '@resolve_within_notifications';

export interface NotificationSettings {
  pushNotifications: boolean;
  dailyMessageReminder: boolean;
  journalReminder: boolean;
  crisisSupportReminder: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushNotifications: false,
  dailyMessageReminder: false,
  journalReminder: false,
  crisisSupportReminder: false,
};

/**
 * Load saved notification settings from AsyncStorage
 */
export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  } catch (error) {
    console.warn('Error loading notification settings:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Save notification settings to AsyncStorage
 */
export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Error saving notification settings:', error);
  }
}

/**
 * Setup daily message reminder
 * Safe to call in Expo Go - will use placeholder logic
 */
export async function setupDailyMessageReminder(enabled: boolean): Promise<void> {
  if (isExpoGo) {
    console.log(`📱 Expo Go: Daily Message Reminder ${enabled ? 'enabled' : 'disabled'} (placeholder)`);
    return;
  }

  if (enabled) {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await scheduleNotification({
        title: 'Daily Message',
        body: 'Your daily message is ready. Take a moment for yourself.',
        hour: 9,
        minute: 0,
      });
    } else {
      console.warn('Notification permissions not granted for Daily Message Reminder');
    }
  } else {
    await cancelAllScheduledNotifications();
  }
}

/**
 * Setup journal reminder
 * Safe to call in Expo Go - will use placeholder logic
 */
export async function setupJournalReminder(enabled: boolean): Promise<void> {
  if (isExpoGo) {
    console.log(`📱 Expo Go: Journal Reminder ${enabled ? 'enabled' : 'disabled'} (placeholder)`);
    return;
  }

  if (enabled) {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await scheduleNotification({
        title: 'Journal Reminder',
        body: 'Take a moment to reflect and journal your thoughts.',
        hour: 20,
        minute: 0,
      });
    } else {
      console.warn('Notification permissions not granted for Journal Reminder');
    }
  } else {
    await cancelAllScheduledNotifications();
  }
}

/**
 * Setup crisis support reminder
 * Safe to call in Expo Go - will use placeholder logic
 */
export async function setupCrisisSupportReminder(enabled: boolean): Promise<void> {
  if (isExpoGo) {
    console.log(`📱 Expo Go: Crisis Support Reminder ${enabled ? 'enabled' : 'disabled'} (placeholder)`);
    return;
  }

  if (enabled) {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await scheduleNotification({
        title: 'You Are Not Alone',
        body: 'Remember: You have support. Take a breath. You are stronger than you know.',
        hour: 12,
        minute: 0,
      });
    } else {
      console.warn('Notification permissions not granted for Crisis Support Reminder');
    }
  } else {
    await cancelAllScheduledNotifications();
  }
}
