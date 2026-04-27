
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

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleClose = useCallback(() => {
    console.log('[PrivacyPolicy] close pressed');
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

  const introText = 'This Privacy Policy explains how Resolve Within may collect, use, store, and protect your information. We are committed to minimizing data collection and protecting your privacy.';

  const infoCollectedTitle = 'Information Collected';
  const infoCollectedText = 'The app may store limited information necessary for functionality, including:';
  const info1 = 'Journal entries and mood check-ins';
  const info2 = 'Breathing exercise usage and preferences';
  const info3 = 'Optional user settings and preferences';
  const info4 = 'Technical device information for app functionality';
  const minimalDataText = 'Resolve Within is designed to minimize data collection and prioritize user privacy.';

  const locationTitle = 'Location Services';
  const locationText = 'Future versions may optionally use location services to help users find nearby support resources, crisis centers, or mental health services.';
  const locationPermissionText = 'Location access requires explicit user permission';
  const locationUsageText = 'Location is used only for support resource discovery';
  const locationDisableText = 'Users may disable location access at any time through device settings';

  const donationsTitle = 'Donations';
  const donationsText = 'Donations to The Resolve Within Project may be processed through third-party payment services. The app does not directly store payment card information. Payment processing is handled securely by trusted third-party providers.';

  const dataStorageTitle = 'Data Storage';
  const dataStorageText = 'Some information may be stored locally on your device for app functionality. Future versions may optionally store data securely in cloud services to enable features like data sync across devices.';

  const dataDeletionTitle = 'Data Deletion';
  const dataDeletionText = 'Users can delete journal entries and personal information within the app at any time. Future versions may include comprehensive account and data deletion features.';

  const thirdPartyTitle = 'Third-Party Services';
  const thirdPartyText = 'The app may use third-party services for:';
  const thirdParty1 = 'Maps and location services';
  const thirdParty2 = 'Analytics and app performance monitoring';
  const thirdParty3 = 'Crash reporting and error tracking';
  const thirdParty4 = 'Payment processing for donations';
  const thirdPartyDisclaimerText = 'These services have their own privacy policies and data handling practices.';

  const securityTitle = 'Security';
  const securityText = 'We implement reasonable security practices to protect your information. However, no method of electronic storage or transmission is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.';

  const policyUpdatesTitle = 'Policy Updates';
  const policyUpdatesText = 'This Privacy Policy may be updated as the app evolves and new features are added. Continued use of the app after policy updates constitutes acceptance of the revised policy.';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Privacy Policy',
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
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.effectiveDate}>{effectiveDateText}</Text>
          </View>

          <Text style={styles.paragraph}>{introText}</Text>

          <View style={styles.divider} />

          {/* Section 1: Information Collected */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{infoCollectedTitle}</Text>
            <Text style={styles.paragraph}>{infoCollectedText}</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{info1}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{info2}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{info3}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{info4}</Text>
              </View>
            </View>
            <Text style={styles.paragraph}>{minimalDataText}</Text>
          </View>

          {/* Section 2: Location Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{locationTitle}</Text>
            <Text style={styles.paragraph}>{locationText}</Text>
            <View style={styles.highlightBox}>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{locationPermissionText}</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{locationUsageText}</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{locationDisableText}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section 3: Donations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{donationsTitle}</Text>
            <Text style={styles.paragraph}>{donationsText}</Text>
          </View>

          {/* Section 4: Data Storage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{dataStorageTitle}</Text>
            <Text style={styles.paragraph}>{dataStorageText}</Text>
          </View>

          {/* Section 5: Data Deletion */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{dataDeletionTitle}</Text>
            <Text style={styles.paragraph}>{dataDeletionText}</Text>
          </View>

          {/* Section 6: Third-Party Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{thirdPartyTitle}</Text>
            <Text style={styles.paragraph}>{thirdPartyText}</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{thirdParty1}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{thirdParty2}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{thirdParty3}</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{thirdParty4}</Text>
              </View>
            </View>
            <Text style={styles.paragraph}>{thirdPartyDisclaimerText}</Text>
          </View>

          {/* Section 7: Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{securityTitle}</Text>
            <Text style={styles.paragraph}>{securityText}</Text>
          </View>

          {/* Section 8: Policy Updates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{policyUpdatesTitle}</Text>
            <Text style={styles.paragraph}>{policyUpdatesText}</Text>
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
