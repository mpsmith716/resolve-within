
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  BackHandler,
  Image,
  ImageSourcePropType,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { FontWeights } from '@/utils/fontHelpers';

const logoSource = require('@/assets/images/1f68aeb0-e5af-4ba5-9383-b05b7384c87a.png');

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function SupportMissionScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const logoWidth = screenWidth * 1.6;
  const logoHeight = logoWidth * (743 / 1320);

  const handleClose = useCallback(() => {
    console.log('[SupportMission] close pressed');
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

  const handleDonate = async () => {
    console.log('[SupportMission] donate button pressed');
    try {
      console.log('[SupportMission] Opening donation website');
      await Linking.openURL('https://theresolvewithinproject.org');
    } catch (error: any) {
      console.error('[SupportMission] Failed to open donation link:', error?.message || error);
    }
  };

  const missionTitle = 'Support the Mission';
  const introText = 'Resolve Within was created to help people stabilize during difficult moments through tools like breathing exercises, grounding techniques, emotional check-ins, journaling, and crisis resource access.';
  const projectText = 'The broader initiative, The Resolve Within Project, works to expand access to practical mental wellness support tools and resources.';
  const donationsHelpTitle = 'Your donations help support:';
  const bullet1 = 'Development of free mental wellness tools';
  const bullet2 = 'Continued improvement of the Resolve Within app';
  const bullet3 = 'Crisis resource accessibility';
  const bullet4 = 'Development of guided exercises and support features';
  const bullet5 = 'Expansion of future support programs';
  const donationDestinationText = 'All donations go directly to:';
  const donationUrl = 'https://theresolvewithinproject.org';
  const buttonText = 'Support the Mission';
  const closingMessage = 'Resolve Within exists to remind people that even during difficult moments they are still standing, and support is always within reach.';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Support the Mission',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerBackTitle: 'Back',
          headerShadowVisible: false,
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
      <View style={styles.root}>
        {/* Layer 1 — Logo watermark (bottom) */}
        <View style={styles.watermarkContainer}>
          <Image
            source={require('@/assets/images/1f68aeb0-e5af-4ba5-9383-b05b7384c87a.png')}
            style={{ width: logoWidth, height: logoHeight, opacity: 0.20 }}
            resizeMode="contain"
          />
        </View>

        {/* Layer 2 — Dark overlay (middle) */}
        <View style={styles.overlay} />

        {/* Layer 4 — Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Icon */}
          <View style={styles.headerIcon}>
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={64}
              color={colors.accent}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{missionTitle}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Introduction */}
          <Text style={styles.paragraph}>{introText}</Text>

          <Text style={styles.paragraph}>{projectText}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Donations Help Section */}
          <Text style={styles.sectionTitle}>{donationsHelpTitle}</Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet1}</Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet2}</Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet3}</Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet4}</Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet5}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Donation Destination */}
          <Text style={styles.sectionTitle}>{donationDestinationText}</Text>
          <Text style={styles.urlText}>{donationUrl}</Text>

          {/* Donate Button */}
          <TouchableOpacity style={styles.donateButton} onPress={handleDonate} activeOpacity={0.85}>
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={22}
              color={colors.background}
            />
            <Text style={styles.donateButtonText}>{buttonText}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Closing Message */}
          <Text style={styles.closingMessage}>{closingMessage}</Text>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.30)',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 48,
  },
  headerIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.subtext,
    opacity: 0.2,
    marginVertical: 24,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 16,
  },
  bulletList: {
    gap: 12,
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
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  urlText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.accent,
    fontWeight: FontWeights.medium,
    marginBottom: 24,
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: colors.background,
  },
  closingMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
