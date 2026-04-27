import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getSafeGradient } from '@/constants/SafeDefaults';
import {
  getTodayMessage,
  loadPersistedDailyMessage,
  DailyMessageData,
} from '@/constants/dailyMessages';
import { getTodayReset, DailyResetData } from '@/constants/dailyResets';
import ReportModal from '@/components/ReportModal';

type MoodType = 'cloudy' | 'onEdge' | 'numbZone' | 'heavyHeart' | 'lightSpark';

const MOOD_TO_BACKEND: Record<MoodType, string> = {
  cloudy: 'cloudy',
  onEdge: 'onEdge',
  numbZone: 'numb',
  heavyHeart: 'heavy',
  lightSpark: 'light',
};

const MOOD_BUTTONS = [
  { type: 'cloudy' as MoodType, emoji: '☁️', label: 'Settle In', sublabel: 'Cloudy but Moving', level: 1 },
  { type: 'onEdge' as MoodType, emoji: '⚡', label: 'Steady Ground', sublabel: 'On Edge', level: 2 },
  { type: 'numbZone' as MoodType, emoji: '🌀', label: 'Reconnect', sublabel: 'Numb Zone', level: 3 },
  { type: 'heavyHeart' as MoodType, emoji: '💔', label: 'Release', sublabel: 'Heavy Heart', level: 4 },
  { type: 'lightSpark' as MoodType, emoji: '✨', label: 'Rise', sublabel: 'Light Spark', level: 5 },
];

function AnimatedMoodCard({
  mood,
  onPress,
}: {
  mood: typeof MOOD_BUTTONS[number];
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.03,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacityAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={{ position: 'relative' }}>
      <Animated.View
        style={[
          styles.moodGlow,
          {
            opacity: glowOpacityAnim,
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          style={styles.moodButton}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          activeOpacity={1}
        >
          <View style={styles.moodLevelBadge}>
            <Text style={styles.moodLevelText}>{`Level ${mood.level}`}</Text>
          </View>
          <Text style={styles.moodEmoji}>{mood.emoji}</Text>
          <Text style={styles.moodLabel}>{mood.label}</Text>
          <Text style={styles.moodSublabel}>{mood.sublabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [dailyMessage, setDailyMessage] = useState<DailyMessageData>(getTodayMessage());
  const [dailyReset] = useState<DailyResetData>(getTodayReset());
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const messageFadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  const safeGradient = getSafeGradient([colors.background, '#0a0e1a', colors.background]);

  useEffect(() => {
    loadPersistedDailyMessage().then((msg) => {
      setDailyMessage(msg);
      Animated.timing(messageFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, [messageFadeAnim]);

  useEffect(() => {
    Animated.timing(contentFadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [contentFadeAnim]);

  const handleMoodPress = (moodType: MoodType) => {
    const backendMood = MOOD_TO_BACKEND[moodType];
    router.push(`/reset-session?mood=${moodType}&backendMood=${backendMood}` as any);
  };

  const handleStartReset = () => {
    if (dailyReset.targetMood) {
      const backendMood = MOOD_TO_BACKEND[dailyReset.targetMood as MoodType];
      router.push(`/reset-session?mood=${dailyReset.targetMood}&backendMood=${backendMood}` as any);
      return;
    }

    if (dailyReset.type === 'grounding') {
      router.push('/grounding-technique?id=5-4-3-2-1' as any);
      return;
    }

    router.push('/reset-session?mood=cloudy&backendMood=cloudy' as any);
  };

  const handleSupportMission = () => {
    Linking.openURL('https://TheResolveWithinProject.org/#donations');
  };

  const displayName = user?.name ? user.name.split(' ')[0] : '';
  const greetingText = displayName ? `Hello, ${displayName} 👋` : '';
  const headerQuestion = 'How are you feeling right now?';

  const messageStream = dailyMessage.stream || 'general';
  const messageStreamLabel =
    messageStream === 'veteran'
      ? "🎖 Today's Message"
      : messageStream === 'faith'
      ? "🙏 Today's Message"
      : "💚 Today's Message";

  return (
    <LinearGradient colors={safeGradient} style={styles.container}>
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
      />

      <Animated.View style={{ flex: 1, opacity: contentFadeAnim }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            {greetingText ? <Text style={styles.greetingText}>{greetingText}</Text> : null}
            <Text style={styles.headerText}>{headerQuestion}</Text>
          </View>

          <Animated.View style={[styles.messageCard, { opacity: messageFadeAnim }]}>
            <Text style={styles.messageStreamLabel}>{messageStreamLabel}</Text>
            <Text style={styles.messageContent}>{dailyMessage.text}</Text>
          </Animated.View>

          <View style={styles.resetCard}>
            <View style={styles.resetHeader}>
              <Text style={styles.resetIcon}>{dailyReset.icon}</Text>
              <Text style={styles.resetCardTitle}>Today&apos;s Reset</Text>
            </View>

            <Text style={styles.resetTitle}>{dailyReset.title}</Text>
            <Text style={styles.resetDescription}>{dailyReset.description}</Text>

            <TouchableOpacity style={styles.resetButton} onPress={handleStartReset}>
              <Text style={styles.resetButtonText}>Start Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.moodContainer}>
            {MOOD_BUTTONS.map((mood) => (
              <AnimatedMoodCard
                key={mood.type}
                mood={mood}
                onPress={() => handleMoodPress(mood.type)}
              />
            ))}
          </View>

          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>Support the Mission</Text>
            <Text style={styles.missionBody}>
              If Resolve Within has helped you even a little, consider supporting the mission.
            </Text>
            <Text style={styles.missionBody}>
              Your contribution helps keep this free and accessible for others.
            </Text>

            <TouchableOpacity
              style={styles.missionButton}
              onPress={handleSupportMission}
              activeOpacity={0.8}
            >
              <Text style={styles.missionButtonText}>Support the Mission</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.supportMessage}>
            <Text style={styles.supportText}>You showed up. That&apos;s what matters.</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
  },

  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },

  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },

  messageCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    minHeight: 80,
    justifyContent: 'center',
  },

  messageStreamLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  messageContent: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  resetCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },

  resetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  resetIcon: {
    fontSize: 24,
  },

  resetCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  resetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },

  resetDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },

  resetButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },

  moodContainer: {
    gap: 12,
    marginBottom: 24,
  },

  moodGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },

  moodButton: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    position: 'relative',
  },

  moodLevelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  moodLevelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  moodEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },

  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  moodSublabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },

  missionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4a90d930',
    alignItems: 'center',
  },

  missionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },

  missionBody: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },

  missionButton: {
    marginTop: 20,
    backgroundColor: '#4a90d9',
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    shadowColor: '#4a90d9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  missionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },

  supportMessage: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },

  supportText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});