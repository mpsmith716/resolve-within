
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontWeights } from '@/utils/fontHelpers';
import { IconSymbol } from '@/components/IconSymbol';

interface TechniqueStep {
  number: number;
  instruction: string;
}

interface GroundingTechniqueData {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconMaterial: string;
  steps: TechniqueStep[];
  tips: string[];
}

const GROUNDING_TECHNIQUES: Record<string, GroundingTechniqueData> = {
  '5-4-3-2-1': {
    id: '5-4-3-2-1',
    title: '5-4-3-2-1 Method',
    description: 'A sensory awareness technique that brings you back to the present moment by engaging all five senses.',
    icon: 'hand.raised.fill',
    iconMaterial: 'back-hand',
    steps: [
      {
        number: 1,
        instruction: 'Look around and name 5 things you can see. Notice their colors, shapes, and details.',
      },
      {
        number: 2,
        instruction: 'Acknowledge 4 things you can touch. Feel the texture of your clothing, the ground beneath your feet, or an object nearby.',
      },
      {
        number: 3,
        instruction: 'Notice 3 things you can hear. Listen for sounds near and far - birds, traffic, your own breathing.',
      },
      {
        number: 4,
        instruction: 'Identify 2 things you can smell. If you cannot smell anything, name your two favorite scents.',
      },
      {
        number: 5,
        instruction: 'Acknowledge 1 thing you can taste. Take a sip of water or notice the current taste in your mouth.',
      },
    ],
    tips: [
      'Take your time with each sense - there is no rush',
      'Say the items out loud if you are comfortable doing so',
      'This technique works anywhere, anytime',
      'Practice when calm so it is easier to use during stress',
    ],
  },
  'box-breathing': {
    id: 'box-breathing',
    title: 'Box Breathing',
    description: 'A powerful breathing technique used by Navy SEALs to stay calm and focused under pressure.',
    icon: 'square.fill',
    iconMaterial: 'crop-square',
    steps: [
      {
        number: 1,
        instruction: 'Breathe in slowly through your nose for 4 counts. Feel your lungs fill with air.',
      },
      {
        number: 2,
        instruction: 'Hold your breath for 4 counts. Stay relaxed and calm.',
      },
      {
        number: 3,
        instruction: 'Exhale slowly through your mouth for 4 counts. Release all tension.',
      },
      {
        number: 4,
        instruction: 'Hold your breath again for 4 counts before the next inhale.',
      },
      {
        number: 5,
        instruction: 'Repeat this cycle 4-5 times or until you feel centered.',
      },
    ],
    tips: [
      'Visualize drawing a box as you breathe',
      'Keep your shoulders relaxed throughout',
      'If 4 counts feels too long, start with 3',
      'Practice daily to build the habit',
    ],
  },
  'feet-on-floor': {
    id: 'feet-on-floor',
    title: 'Feet on Floor',
    description: 'A simple grounding technique that reconnects you with the present moment through physical awareness.',
    icon: 'figure.stand',
    iconMaterial: 'accessibility',
    steps: [
      {
        number: 1,
        instruction: 'Sit or stand with your feet flat on the ground. Remove your shoes if possible.',
      },
      {
        number: 2,
        instruction: 'Press your feet firmly into the floor. Feel the solid ground supporting you.',
      },
      {
        number: 3,
        instruction: 'Notice the sensation - the temperature, texture, and pressure against your feet.',
      },
      {
        number: 4,
        instruction: 'Say to yourself: "I am here. I am present. I am grounded."',
      },
      {
        number: 5,
        instruction: 'Take three deep breaths while maintaining awareness of your feet on the ground.',
      },
    ],
    tips: [
      'This works standing, sitting, or lying down',
      'You can do this anywhere, anytime',
      'Combine with deep breathing for extra effect',
      'Use this when you feel disconnected or overwhelmed',
    ],
  },
};

export default function GroundingTechniqueScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const techniqueId = params.id as string;

  const handleClose = useCallback(() => {
    console.log('[GroundingTechnique] close pressed');
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

  const technique = GROUNDING_TECHNIQUES[techniqueId];

  if (!technique) {
    const errorTitle = 'Technique Not Found';
    const backButtonText = 'Go Back';
    
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: errorTitle,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.accent,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorTitle}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
          >
            <Text style={styles.backButtonText}>{backButtonText}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const headerTitle = 'Grounding Technique';
  const stepsTitle = 'Steps';
  const tipsTitle = 'Tips for Success';
  const doneButtonText = 'Done';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: headerTitle,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.accent,
          headerBackTitle: 'Back',
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose} style={{ marginLeft: 8, padding: 8 }}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.accent}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <LinearGradient
        colors={[colors.background, '#0a0e1a', colors.background]}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name={technique.icon}
                android_material_icon_name={technique.iconMaterial}
                size={48}
                color={colors.accent}
              />
            </View>
            <Text style={styles.title}>{technique.title}</Text>
            <Text style={styles.description}>{technique.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{stepsTitle}</Text>
            {technique.steps.map((step, index) => {
              const stepNumber = step.number.toString();
              const stepInstruction = step.instruction;
              
              return (
                <View key={index} style={styles.stepCard}>
                  <View style={styles.stepNumberContainer}>
                    <Text style={styles.stepNumber}>{stepNumber}</Text>
                  </View>
                  <Text style={styles.stepText}>{stepInstruction}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{tipsTitle}</Text>
            {technique.tips.map((tip, index) => {
              return (
                <View key={index} style={styles.tipCard}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>{doneButtonText}</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: colors.accent,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: FontWeights.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.background,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontWeight: FontWeights.medium,
    color: colors.text,
    lineHeight: 22,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 7,
    marginRight: 12,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: FontWeights.medium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: colors.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.background,
  },
});
