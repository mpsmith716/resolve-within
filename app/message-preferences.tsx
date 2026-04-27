
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { FontWeights } from '@/utils/fontHelpers';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

type Tone = 'Calm' | 'Encouraging' | 'Direct';
type Audience = 'General' | 'Veteran-aware';

const STORAGE_KEY = '@resolve_within_message_preferences';

interface MessagePreferences {
  tone: Tone;
  audience: Audience;
}

const DEFAULT_PREFERENCES: MessagePreferences = {
  tone: 'Calm',
  audience: 'General',
};

export default function MessagePreferencesScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<MessagePreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const handleClose = useCallback(() => {
    console.log('[MessagePreferences] close pressed');
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

  const explanationText = 'Choose the message style that feels most supportive to you.';

  const previewMessages: Record<Tone, Record<Audience, string>> = {
    Calm: {
      General: 'Take a moment to breathe. You are doing better than you think.',
      'Veteran-aware': 'Take a moment to breathe. Your service matters, and so does your wellbeing.',
    },
    Encouraging: {
      General: 'You are stronger than you know. Keep moving forward, one step at a time.',
      'Veteran-aware': 'You have faced challenges before and overcome them. This moment is no different.',
    },
    Direct: {
      General: 'Right now, focus on what you can control. Start with your breath.',
      'Veteran-aware': 'Mission focus: Control your breath. Ground yourself. Move forward.',
    },
  };

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      console.log('MessagePreferencesScreen: Loading saved preferences');
      const savedPreferences = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        console.log('MessagePreferencesScreen: Loaded preferences:', parsed);
        setPreferences(parsed);
      } else {
        console.log('MessagePreferencesScreen: No saved preferences, using defaults');
      }
    } catch (error) {
      console.error('MessagePreferencesScreen: Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: MessagePreferences) => {
    try {
      console.log('MessagePreferencesScreen: Saving preferences:', newPreferences);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('MessagePreferencesScreen: Error saving preferences:', error);
    }
  };

  const handleToneChange = async (tone: Tone) => {
    console.log('MessagePreferencesScreen: Tone changed to', tone);
    const newPreferences = { ...preferences, tone };
    await savePreferences(newPreferences);
  };

  const handleAudienceChange = async (audience: Audience) => {
    console.log('MessagePreferencesScreen: Audience changed to', audience);
    const newPreferences = { ...preferences, audience };
    await savePreferences(newPreferences);
  };

  const previewMessage = previewMessages[preferences.tone][preferences.audience];

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Message Preferences',
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
            <Text style={styles.loadingText}>Loading preferences...</Text>
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
          title: 'Message Preferences',
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
            <Text style={styles.title}>Message Preferences</Text>
            <Text style={styles.explanation}>{explanationText}</Text>
          </View>

          {/* Tone Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tone</Text>
            <View style={styles.optionGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  preferences.tone === 'Calm' && styles.optionButtonSelected,
                ]}
                onPress={() => handleToneChange('Calm')}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.tone === 'Calm' && styles.optionTextSelected,
                  ]}
                >
                  Calm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  preferences.tone === 'Encouraging' && styles.optionButtonSelected,
                ]}
                onPress={() => handleToneChange('Encouraging')}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.tone === 'Encouraging' && styles.optionTextSelected,
                  ]}
                >
                  Encouraging
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  preferences.tone === 'Direct' && styles.optionButtonSelected,
                ]}
                onPress={() => handleToneChange('Direct')}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.tone === 'Direct' && styles.optionTextSelected,
                  ]}
                >
                  Direct
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Audience Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audience</Text>
            <View style={styles.optionGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  preferences.audience === 'General' && styles.optionButtonSelected,
                ]}
                onPress={() => handleAudienceChange('General')}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.audience === 'General' && styles.optionTextSelected,
                  ]}
                >
                  General
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  preferences.audience === 'Veteran-aware' && styles.optionButtonSelected,
                ]}
                onPress={() => handleAudienceChange('Veteran-aware')}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.audience === 'Veteran-aware' && styles.optionTextSelected,
                  ]}
                >
                  Veteran-aware
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Daily Message Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Message Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewText}>{previewMessage}</Text>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 12,
  },
  optionGroup: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.card,
  },
  optionButtonSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionText: {
    fontSize: 16,
    fontWeight: FontWeights.medium,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.background,
  },
  previewCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  previewText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 20,
  },
});
