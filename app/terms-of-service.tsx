
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useCallback } from 'react';
import { FontWeights } from '@/utils/fontHelpers';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  const handleClose = useCallback(() => {
    console.log('[TermsOfService] close pressed');
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

  const effectiveDateText = 'Effective Date: March 2026';
  const appNameText = 'Resolve Within';
  const projectNameText = 'The Resolve Within Project';

  const introText = 'Please read these Terms of Service carefully before using the Resolve Within app. By using this app, you acknowledge and agree to these terms.';

  const toolsText = 'Resolve Within provides self-help tools including breathing exercises, grounding techniques, journaling prompts, and supportive content designed to help users manage difficult moments.';
  const notTreatmentText = 'This app is not medical treatment, mental health treatment, therapy, counseling, or professional healthcare of any kind.';
  const informationalText = 'All content and features are informational and educational in nature only.';

  const notSubstituteText = 'Resolve Within does not replace the care, advice, or treatment provided by licensed therapists, psychologists, psychiatrists, counselors, or medical professionals.';
  const seekProfessionalText = 'Users experiencing severe distress, mental health crises, or ongoing mental health concerns should seek help from qualified healthcare professionals.';

  const notEmergencyText = 'This app is not intended for use during emergency situations or life-threatening crises.';
  const contactEmergencyText = 'If you are in immediate danger or experiencing a mental health emergency, contact emergency services immediately.';
  const crisisLineText = 'United States: 988 Suicide and Crisis Lifeline';
  const callOrTextText = 'Call or text 988 for immediate crisis support';
  const internationalText = 'International users should contact their local emergency services or crisis support lines.';

  const userResponsibilityText = 'You are solely responsible for how you interpret, apply, and act upon any content, exercises, or information provided through this app.';
  const personalJudgmentText = 'Use of this app should be guided by your own judgment and, when appropriate, consultation with qualified professionals.';

  const noLiabilityText = 'Resolve Within, The Resolve Within Project, and its developers, contributors, and affiliates are not responsible for any outcomes, consequences, or results arising from use of this app.';
  const noWarrantyText = 'The app is provided "as is" without warranties of any kind, express or implied.';
  const userRiskText = 'You use this app at your own risk.';

  const futureAIText = 'Future versions of Resolve Within may include AI-assisted support tools, conversational features, or automated response systems.';
  const aiInformationalText = 'Any AI-generated responses or suggestions are informational only and do not constitute therapy, diagnosis, medical advice, or professional mental health treatment.';
  const aiLimitationsText = 'AI systems have limitations and may produce inaccurate, incomplete, or inappropriate responses.';
  const aiNotProfessionalText = 'AI features are not a substitute for professional care.';

  const futureFeatureIntroText = 'Future versions of Resolve Within may include additional features such as:';
  const feature1Text = 'Guided audio exercises and meditations';
  const feature2Text = 'Location-based support resource discovery';
  const feature3Text = 'Community support features and peer connections';
  const feature4Text = 'AI assistance tools and conversational support';
  const feature5Text = 'Enhanced journaling and mood tracking capabilities';
  const futureFeatureDisclaimerText = 'All future features will remain subject to these Terms of Service and the limitations described herein.';

  const acceptanceIntroText = 'By downloading, accessing, or using Resolve Within, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.';
  const continueUseText = 'Continued use of the app constitutes ongoing acceptance of these terms.';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Terms of Service',
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
            <Text style={styles.title}>Terms of Service</Text>
            <Text style={styles.effectiveDate}>{effectiveDateText}</Text>
          </View>

          <Text style={styles.paragraph}>{introText}</Text>

          <View style={styles.divider} />

          {/* Section 1: Informational and Support Tool Only */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Informational and Support Tool Only</Text>
            <Text style={styles.paragraph}>{toolsText}</Text>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>Important: {notTreatmentText}</Text>
            </View>
            <Text style={styles.paragraph}>{informationalText}</Text>
          </View>

          {/* Section 2: Not a Substitute for Professional Care */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Not a Substitute for Professional Care</Text>
            <Text style={styles.paragraph}>{notSubstituteText}</Text>
            <Text style={styles.paragraph}>{seekProfessionalText}</Text>
          </View>

          {/* Section 3: Crisis Disclaimer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Crisis Disclaimer</Text>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>Critical: {notEmergencyText}</Text>
            </View>
            <Text style={styles.paragraph}>{contactEmergencyText}</Text>

            <View style={styles.crisisBox}>
              <Text style={styles.crisisTitle}>Crisis Support Resources</Text>
              <Text style={styles.crisisText}>{crisisLineText}</Text>
              <Text style={styles.crisisText}>{callOrTextText}</Text>
              <Text style={[styles.crisisText, { marginTop: 8 }]}>{internationalText}</Text>
            </View>
          </View>

          {/* Section 4: User Responsibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. User Responsibility</Text>
            <Text style={styles.paragraph}>{userResponsibilityText}</Text>
            <Text style={styles.paragraph}>{personalJudgmentText}</Text>
          </View>

          {/* Section 5: Limitation of Liability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
            <Text style={styles.paragraph}>{noLiabilityText}</Text>
            <Text style={styles.paragraph}>{noWarrantyText}</Text>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>{userRiskText}</Text>
            </View>
          </View>

          {/* Section 6: AI Support Disclaimer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. AI Support Disclaimer (Future Features)</Text>
            <Text style={styles.paragraph}>{futureAIText}</Text>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>Important: {aiInformationalText}</Text>
            </View>
            <Text style={styles.paragraph}>{aiLimitationsText}</Text>
            <Text style={styles.paragraph}>{aiNotProfessionalText}</Text>
          </View>

          {/* Section 7: Feature Expansion */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Feature Expansion</Text>
            <Text style={styles.paragraph}>{futureFeatureIntroText}</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{feature1Text}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{feature2Text}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{feature3Text}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{feature4Text}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{feature5Text}</Text>
              </View>
            </View>
            <Text style={styles.paragraph}>{futureFeatureDisclaimerText}</Text>
          </View>

          {/* Section 8: Acceptance of Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Acceptance of Terms</Text>
            <View style={styles.acceptanceBox}>
              <Text style={styles.acceptanceText}>{acceptanceIntroText}</Text>
              <Text style={[styles.acceptanceText, { marginTop: 12 }]}>{continueUseText}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.footerText}>
            {appNameText} • {projectNameText}
          </Text>

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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 8,
  },
  effectiveDate: {
    fontSize: 14,
    color: colors.subtext,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 12,
  },
  bulletList: {
    gap: 8,
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
  },
  highlightBox: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  highlightText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    fontWeight: FontWeights.medium,
  },
  crisisBox: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  crisisTitle: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.accent,
    marginBottom: 8,
  },
  crisisText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  acceptanceBox: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  acceptanceText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.subtext,
    opacity: 0.2,
    marginVertical: 24,
  },
  footerText: {
    fontSize: 13,
    color: colors.subtext,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});
