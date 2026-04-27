
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  BackHandler,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getSafeGradient } from '@/constants/SafeDefaults';
import { FontWeights } from '@/utils/fontHelpers';

export default function CrisisResourcesScreen() {
  const router = useRouter();

  const handleClose = useCallback(() => {
    console.log('[CrisisResources] close pressed');
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

  const handleCall988 = () => {
    console.log('User tapped Call 988 button');
    const phoneNumber = Platform.OS === 'ios' ? 'tel:988' : 'tel:988';
    Linking.openURL(phoneNumber).catch((err) =>
      console.error('Error opening phone dialer:', err)
    );
  };

  const handleText988 = () => {
    console.log('User tapped Text 988 button');
    const smsNumber = Platform.OS === 'ios' ? 'sms:988' : 'sms:988';
    Linking.openURL(smsNumber).catch((err) =>
      console.error('Error opening SMS:', err)
    );
  };

  const handleOpenFindAHelpline = () => {
    console.log('User tapped Find A Helpline link');
    Linking.openURL('https://findahelpline.com').catch((err) =>
      console.error('Error opening URL:', err)
    );
  };

  const titleText = 'Crisis Resources';
  const warningText = 'If you are in immediate danger, contact emergency services.';
  const usTitle = 'United States';
  const usResourceTitle = '988 Suicide & Crisis Lifeline';
  const usResourceDesc = 'Free, confidential support available 24/7 for anyone in crisis.';
  const callButtonText = 'Call 988';
  const textButtonText = 'Text 988';
  const internationalTitle = 'International Support';
  const internationalDesc = 'Find crisis helplines and support services in your country.';
  const visitWebsiteText = 'Visit findahelpline.com';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Crisis Resources',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
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
        colors={getSafeGradient([colors.background, '#0a0e1a', colors.background])}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.warningContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={32}
              color={colors.danger}
            />
            <Text style={styles.warningText}>{warningText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{usTitle}</Text>
            
            <View style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceIconContainer}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.resourceContent}>
                  <Text style={styles.resourceTitle}>{usResourceTitle}</Text>
                  <Text style={styles.resourceDescription}>{usResourceDesc}</Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleCall988}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={20}
                    color={colors.background}
                  />
                  <Text style={styles.primaryButtonText}>{callButtonText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleText988}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="message.fill"
                    android_material_icon_name="message"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.secondaryButtonText}>{textButtonText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{internationalTitle}</Text>
            
            <View style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceIconContainer}>
                  <IconSymbol
                    ios_icon_name="globe"
                    android_material_icon_name="language"
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.resourceContent}>
                  <Text style={styles.resourceTitle}>{internationalTitle}</Text>
                  <Text style={styles.resourceDescription}>{internationalDesc}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleOpenFindAHelpline}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="arrow.up.right.square.fill"
                  android_material_icon_name="open-in-new"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.linkButtonText}>{visitWebsiteText}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(204, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  warningText: {
    flex: 1,
    fontSize: 15,
    fontWeight: FontWeights.semibold,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: FontWeights.bold,
    color: colors.accent,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resourceCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  resourceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 8,
  },
  resourceDescription: {
    fontSize: 14,
    fontWeight: FontWeights.medium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.background,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.accent,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    gap: 8,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.accent,
  },
});
