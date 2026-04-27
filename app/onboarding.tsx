
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { AppModal } from '@/components/ErrorBoundary';
import { colors } from '@/styles/commonStyles';
import { authenticatedPut } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

type UserType = 'veteran' | 'civilian';
type MessageStream = 'resilience' | 'healing' | 'community' | 'gratitude';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [messageStreams, setMessageStreams] = useState<MessageStream[]>(['resilience']);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const handleUserTypeSelect = (type: UserType) => {
    console.log('[Onboarding] User selected type:', type);
    setUserType(type);
  };

  const toggleMessageStream = (stream: MessageStream) => {
    console.log('[Onboarding] Toggling message stream:', stream);
    setMessageStreams((prev) =>
      prev.includes(stream) ? prev.filter((s) => s !== stream) : [...prev, stream]
    );
  };

  const handleComplete = async () => {
    if (!userType) {
      setErrorModal({ visible: true, title: 'Selection Required', message: 'Please select your user type to continue.' });
      return;
    }

    setLoading(true);
    try {
      console.log('[Onboarding] Saving preferences:', { userType, messageStreams });
      await authenticatedPut('/api/user/preferences', {
        userType,
        messageStreams,
      });
      console.log('[Onboarding] Preferences saved successfully, navigating to home');
      router.replace('/(tabs)/(home)/');
    } catch (error: any) {
      console.error('[Onboarding] Failed to save preferences:', error?.message || error);
      setErrorModal({ visible: true, title: 'Error', message: 'Failed to save preferences. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => {
    const rawName =
  user?.name ||
  user?.user_metadata?.name ||
  user?.user_metadata?.first_name ||
  profile?.first_name ||
  profile?.username ||
  user?.email?.split('@')[0] ||
  "there";

const displayName = rawName.split(' ')[0];

    const greeting = `Hello, ${displayName} 👋`;
    const question = "How are you doing today?";
    const whoQuestion = "Who are you?";

    const veteranLabel = "Veteran";
    const veteranDesc = "I served in the military";
    const civilianLabel = "Civilian";
    const civilianDesc = "I am not a military veteran";

    const nextButton = "Next";

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.mainQuestion}>{question}</Text>

        <Text style={styles.question}>{whoQuestion}</Text>

        <TouchableOpacity
          style={[styles.optionCard, userType === 'veteran' && styles.optionCardSelected]}
          onPress={() => handleUserTypeSelect('veteran')}
        >
          <IconSymbol
            ios_icon_name="star.fill"
            android_material_icon_name="star"
            size={32}
            color={userType === 'veteran' ? colors.accent : colors.text}
          />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionLabel}>{veteranLabel}</Text>
            <Text style={styles.optionDescription}>{veteranDesc}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, userType === 'civilian' && styles.optionCardSelected]}
          onPress={() => handleUserTypeSelect('civilian')}
        >
          <IconSymbol
            ios_icon_name="person.fill"
            android_material_icon_name="person"
            size={32}
            color={userType === 'civilian' ? colors.accent : colors.text}
          />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionLabel}>{civilianLabel}</Text>
            <Text style={styles.optionDescription}>{civilianDesc}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, !userType && styles.buttonDisabled]}
          onPress={() => setStep(2)}
          disabled={!userType}
        >
          <Text style={styles.primaryButtonText}>{nextButton}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getUserTypeDisplay = () => {
    if (userType === 'veteran') return 'Veteran';
    if (userType === 'civilian') return 'Civilian';
    return '';
  };

  const getMessageStreamsDisplay = () => {
    return messageStreams.map((stream) => {
      if (stream === 'resilience') return 'Resilience';
      if (stream === 'healing') return 'Healing';
      if (stream === 'community') return 'Community';
      if (stream === 'gratitude') return 'Gratitude';
      return '';
    }).join(', ');
  };

  const renderStep2 = () => {
    const title = "Choose Your Message Streams";
    const subtitle = "Select the types of daily messages you would like to receive";
    const resilienceLabel = "Resilience";
    const resilienceDesc = "Strength and perseverance";
    const healingLabel = "Healing";
    const healingDesc = "Recovery and growth";
    const communityLabel = "Community";
    const communityDesc = "Connection and support";
    const gratitudeLabel = "Gratitude";
    const gratitudeDesc = "Appreciation and mindfulness";
    const backButton = "Back";
    const nextButton = "Next";

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <TouchableOpacity
          style={[styles.optionCard, messageStreams.includes('resilience') && styles.optionCardSelected]}
          onPress={() => toggleMessageStream('resilience')}
        >
          <IconSymbol
            ios_icon_name="bolt.fill"
            android_material_icon_name="flash-on"
            size={32}
            color={messageStreams.includes('resilience') ? colors.accent : colors.text}
          />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionLabel}>{resilienceLabel}</Text>
            <Text style={styles.optionDescription}>{resilienceDesc}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, messageStreams.includes('healing') && styles.optionCardSelected]}
          onPress={() => toggleMessageStream('healing')}
        >
          <IconSymbol
            ios_icon_name="heart.fill"
            android_material_icon_name="favorite"
            size={32}
            color={messageStreams.includes('healing') ? colors.accent : colors.text}
          />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionLabel}>{healingLabel}</Text>
            <Text style={styles.optionDescription}>{healingDesc}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, messageStreams.includes('community') && styles.optionCardSelected]}
          onPress={() => toggleMessageStream('community')}
        >
          <IconSymbol
            ios_icon_name="person.3.fill"
            android_material_icon_name="group"
            size={32}
            color={messageStreams.includes('community') ? colors.accent : colors.text}
          />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionLabel}>{communityLabel}</Text>
            <Text style={styles.optionDescription}>{communityDesc}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, messageStreams.includes('gratitude') && styles.optionCardSelected]}
          onPress={() => toggleMessageStream('gratitude')}
        >
          <IconSymbol
            ios_icon_name="star.fill"
            android_material_icon_name="star"
            size={32}
            color={messageStreams.includes('gratitude') ? colors.accent : colors.text}
          />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionLabel}>{gratitudeLabel}</Text>
            <Text style={styles.optionDescription}>{gratitudeDesc}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
            <Text style={styles.secondaryButtonText}>{backButton}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonFlex]}
            onPress={() => setStep(3)}
          >
            <Text style={styles.primaryButtonText}>{nextButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep3 = () => {
    const title = "Review Your Choices";
    const subtitle = "You can change these anytime in settings";
    const userTypeLabel = "User Type:";
    const messageStreamsLabel = "Message Streams:";
    const backButton = "Back";
    const completeButton = "Complete Setup";

    const userTypeDisplay = getUserTypeDisplay();
    const messageStreamsDisplay = getMessageStreamsDisplay();

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>{userTypeLabel}</Text>
          <Text style={styles.reviewValue}>{userTypeDisplay}</Text>
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>{messageStreamsLabel}</Text>
          <Text style={styles.reviewValue}>{messageStreamsDisplay}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(2)}>
            <Text style={styles.secondaryButtonText}>{backButton}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonFlex, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>{completeButton}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={[colors.background, colors.cardBackground]} style={styles.container}>
      <AppModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        actions={[{ label: 'OK', onPress: () => setErrorModal({ visible: false, title: '', message: '' }) }]}
        onDismiss={() => setErrorModal({ visible: false, title: '', message: '' })}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
        <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  mainQuestion: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 32,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.background,
  },
  optionTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.subtext,
  },
  primaryButton: {
    height: 50,
    backgroundColor: colors.accent,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonFlex: {
    flex: 1,
    marginLeft: 8,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  secondaryButton: {
    height: 50,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 8,
  },
  reviewValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cardBackground,
  },
  progressDotActive: {
    backgroundColor: colors.accent,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
