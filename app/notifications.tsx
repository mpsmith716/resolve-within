
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { FontWeights } from '@/utils/fontHelpers';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import * as SecureStore from 'expo-secure-store';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  Alert,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import {
  isExpoGo,
  requestNotificationPermissions,
  scheduleNotification,
  cancelAllScheduledNotifications,
} from '@/utils/notificationHelpers';

const STORAGE_KEY = '@resolve_within_notifications';

interface NotificationSettings {
  pushNotifications: boolean;
  dailyMessageReminder: boolean;
  journalReminder: boolean;
  crisisSupportReminder: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushNotifications: false,
  dailyMessageReminder: false,
  journalReminder: false,
  crisisSupportReminder: false,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const handleClose = useCallback(() => {
    console.log('[Notifications] close pressed');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(home)/');
    }
  }, [router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => subscription.remove();
  }, [handleClose]);

  const explanationText = isExpoGo
    ? 'You can control how Resolve Within sends reminders and support notifications. (Note: Push notifications are disabled in Expo Go - they will work in production builds.)'
    : 'You can control how Resolve Within sends reminders and support notifications.';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('NotificationsScreen: Loading saved settings');
      const savedSettings = await SecureStore.getItemAsync(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        console.log('NotificationsScreen: Loaded settings:', parsed);
        setSettings(parsed);
      } else {
        console.log('NotificationsScreen: No saved settings, using defaults');
      }
    } catch (error) {
      console.error('NotificationsScreen: Error loading settings:', error);
      // Use default settings if SecureStore fails
      console.log('NotificationsScreen: Using default settings due to error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      console.log('NotificationsScreen: Saving settings:', newSettings);
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('NotificationsScreen: Error saving settings:', error);
      // Still update local state even if save fails
      setSettings(newSettings);
    }
  };

  const scheduleDailyMessageReminder = async () => {
    await scheduleNotification({
      title: 'Daily Message',
      body: 'Your daily message is ready. Take a moment for yourself.',
      hour: 9,
      minute: 0,
    });
  };

  const scheduleJournalReminder = async () => {
    await scheduleNotification({
      title: 'Journal Reminder',
      body: 'Take a moment to reflect and journal your thoughts.',
      hour: 20,
      minute: 0,
    });
  };

  const scheduleCrisisSupportReminder = async () => {
    await scheduleNotification({
      title: 'You Are Not Alone',
      body: 'Remember: You have support. Take a breath. You are stronger than you know.',
      hour: 12,
      minute: 0,
    });
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    console.log('NotificationsScreen: Push Notifications toggled to', value);

    if (value) {
      if (isExpoGo) {
        Alert.alert(
          'Development Mode',
          'Push notifications are disabled in Expo Go. They will work in production builds.',
          [{ text: 'OK' }]
        );
        return;
      }

      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const newSettings = { ...settings, pushNotifications: value };
    await saveSettings(newSettings);

    if (!value) {
      await cancelAllScheduledNotifications();
      const allDisabled = {
        pushNotifications: false,
        dailyMessageReminder: false,
        journalReminder: false,
        crisisSupportReminder: false,
      };
      await saveSettings(allDisabled);
    }
  };

  const handleDailyMessageReminderToggle = async (value: boolean) => {
    console.log('NotificationsScreen: Daily Message Reminder toggled to', value);

    if (value && !settings.pushNotifications) {
      Alert.alert(
        'Enable Push Notifications',
        'Please enable Push Notifications first to receive reminders.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newSettings = { ...settings, dailyMessageReminder: value };
    await saveSettings(newSettings);

    if (value) {
      await scheduleDailyMessageReminder();
    } else {
      await cancelAllScheduledNotifications();
    }
  };

  const handleJournalReminderToggle = async (value: boolean) => {
    console.log('NotificationsScreen: Journal Reminder toggled to', value);

    if (value && !settings.pushNotifications) {
      Alert.alert(
        'Enable Push Notifications',
        'Please enable Push Notifications first to receive reminders.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newSettings = { ...settings, journalReminder: value };
    await saveSettings(newSettings);

    if (value) {
      await scheduleJournalReminder();
    } else {
      await cancelAllScheduledNotifications();
    }
  };

  const handleCrisisSupportReminderToggle = async (value: boolean) => {
    console.log('NotificationsScreen: Crisis Support Reminder toggled to', value);

    if (value && !settings.pushNotifications) {
      Alert.alert(
        'Enable Push Notifications',
        'Please enable Push Notifications first to receive reminders.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newSettings = { ...settings, crisisSupportReminder: value };
    await saveSettings(newSettings);

    if (value) {
      await scheduleCrisisSupportReminder();
    } else {
      await cancelAllScheduledNotifications();
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Notifications',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerBackTitle: 'Back',
            headerLeft: () => (
              <TouchableOpacity onPress={handleClose} style={{ marginLeft: 8, padding: 8 }}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <LinearGradient
          colors={[colors.background, colors.card]}
          style={styles.container}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose} style={{ marginLeft: 8, padding: 8 }}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <LinearGradient
        colors={[colors.background, colors.card]}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.explanation}>{explanationText}</Text>
          </View>

          {isExpoGo && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ⚠️ Development Mode: Notifications are simulated in Expo Go
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications from the app
                </Text>
              </View>
              <Switch
                value={settings.pushNotifications}
                onValueChange={handlePushNotificationsToggle}
                trackColor={{ false: colors.card, true: colors.accent }}
                thumbColor={colors.text}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Daily Message Reminder</Text>
                <Text style={styles.settingDescription}>
                  Get reminded to read your daily message (9:00 AM)
                </Text>
              </View>
              <Switch
                value={settings.dailyMessageReminder}
                onValueChange={handleDailyMessageReminderToggle}
                trackColor={{ false: colors.card, true: colors.accent }}
                thumbColor={colors.text}
                disabled={!settings.pushNotifications}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Journal Reminder</Text>
                <Text style={styles.settingDescription}>
                  Get reminded to journal your thoughts (8:00 PM)
                </Text>
              </View>
              <Switch
                value={settings.journalReminder}
                onValueChange={handleJournalReminderToggle}
                trackColor={{ false: colors.card, true: colors.accent }}
                thumbColor={colors.text}
                disabled={!settings.pushNotifications}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Crisis Support Reminder</Text>
                <Text style={styles.settingDescription}>
                  Receive supportive check-ins during difficult times (12:00 PM)
                </Text>
              </View>
              <Switch
                value={settings.crisisSupportReminder}
                onValueChange={handleCrisisSupportReminderToggle}
                trackColor={{ false: colors.card, true: colors.accent }}
                thumbColor={colors.text}
                disabled={!settings.pushNotifications}
              />
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 12,
  },
  explanation: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.accent,
    textAlign: 'center',
  },
  section: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: FontWeights.medium,
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },
});
