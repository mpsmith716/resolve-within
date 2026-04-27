
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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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
        hour: options.hour,
        minute: options.minute,
        repeats: true,
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
