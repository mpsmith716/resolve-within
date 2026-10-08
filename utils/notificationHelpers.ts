
import Constants from 'expo-constants';

/**
 * Detect if the app is running in Expo Go.
 * Expo Go does not support push notifications on Android in SDK 53+.
 */
export const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Lazily require expo-notifications only when NOT in Expo Go.
 * A top-level import crashes on Android Expo Go (SDK 53+).
 */
function getNotifications() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof import('expo-notifications');
}

/**
 * Configure notification handler — skipped in Expo Go.
 */
if (!isExpoGo) {
  try {
    const Notifications = getNotifications();
    console.log('✅ expo-notifications loaded successfully');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('❌ Failed to configure expo-notifications:', error);
  }
}

/**
 * Request notification permissions.
 * Returns false (no-op) in Expo Go.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (isExpoGo) {
    console.log('📱 Expo Go: Notification permissions skipped (placeholder)');
    return false;
  }

  try {
    console.log('🔔 Requesting notification permissions');
    const Notifications = getNotifications();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const granted = finalStatus === 'granted';
    console.log(`🔔 Notification permissions: ${granted ? 'granted' : 'denied'}`);
    return granted;
  } catch (error) {
    console.warn('❌ Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule a daily repeating notification.
 * No-ops in Expo Go.
 */
export async function scheduleNotification(options: {
  title: string;
  body: string;
  hour: number;
  minute: number;
}): Promise<string | null> {
  if (isExpoGo) {
    console.log(
      `📱 Expo Go: Notification scheduled (placeholder) - "${options.title}" at ${options.hour}:${String(options.minute).padStart(2, '0')}`
    );
    return 'expo-go-placeholder-id';
  }

  try {
    console.log(
      `🔔 Scheduling notification: "${options.title}" at ${options.hour}:${String(options.minute).padStart(2, '0')}`
    );
    const Notifications = getNotifications();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: options.hour,
        minute: options.minute,
      },
    });
    console.log(`✅ Notification scheduled with ID: ${id}`);
    return id;
  } catch (error) {
    console.warn('❌ Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel scheduled notifications that belong to one reminder: anything scheduled with
 * `identifier`, plus (when `legacyTitle` is given) older copies scheduled without an
 * identifier by earlier app versions, matched by title. Other reminders are untouched.
 * No-ops in Expo Go.
 */
export async function cancelReminder(identifier: string, legacyTitle?: string): Promise<void> {
  if (isExpoGo) {
    console.log(`📱 Expo Go: Reminder "${identifier}" canceled (placeholder)`);
    return;
  }

  try {
    const Notifications = getNotifications();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const matches = scheduled.filter(
      (n) =>
        n.identifier === identifier ||
        (!!legacyTitle && n.content?.title === legacyTitle)
    );
    for (const n of matches) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    // Also cancel by identifier directly in case the list was incomplete.
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
    console.log(`🔔 Canceled reminder "${identifier}" (${matches.length} scheduled)`);
  } catch (error) {
    console.warn(`❌ Error canceling reminder "${identifier}":`, error);
  }
}

/**
 * Schedule one daily reminder under a fixed identifier. Any existing copy of the same
 * reminder (same identifier, or a legacy copy with the same title) is canceled first,
 * so turning a reminder on repeatedly never creates duplicates.
 * No-ops in Expo Go.
 */
export async function scheduleDailyReminder(
  identifier: string,
  options: { title: string; body: string; hour: number; minute: number }
): Promise<string | null> {
  if (isExpoGo) {
    console.log(
      `📱 Expo Go: Reminder "${identifier}" scheduled (placeholder) at ${options.hour}:${String(options.minute).padStart(2, '0')}`
    );
    return identifier;
  }

  try {
    await cancelReminder(identifier, options.title);
    const Notifications = getNotifications();
    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: options.title,
        body: options.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: options.hour,
        minute: options.minute,
      },
    });
    console.log(`✅ Reminder scheduled with ID: ${id}`);
    return id;
  } catch (error) {
    console.warn(`❌ Error scheduling reminder "${identifier}":`, error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications.
 * No-ops in Expo Go.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  if (isExpoGo) {
    console.log('📱 Expo Go: All notifications canceled (placeholder)');
    return;
  }

  try {
    console.log('🔔 Canceling all scheduled notifications');
    const Notifications = getNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications canceled');
  } catch (error) {
    console.warn('❌ Error canceling notifications:', error);
  }
}

/**
 * Get all scheduled notifications.
 * Returns an empty array in Expo Go.
 */
export async function getAllScheduledNotifications(): Promise<any[]> {
  if (isExpoGo) {
    console.log('📱 Expo Go: Getting scheduled notifications (placeholder - empty array)');
    return [];
  }

  try {
    const Notifications = getNotifications();
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`🔔 Found ${notifications.length} scheduled notifications`);
    return notifications;
  } catch (error) {
    console.warn('❌ Error getting scheduled notifications:', error);
    return [];
  }
}
