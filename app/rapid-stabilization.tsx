
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import React, { useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Animated,
  Easing,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontWeights } from '@/utils/fontHelpers';
import { IconSymbol } from '@/components/IconSymbol';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  title: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent + '40',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: FontWeights.bold,
    color: colors.accent,
    flex: 1,
  },
  actionDescription: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: colors.background,
  },
  emergencyCard: {
    backgroundColor: colors.danger,
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 8,
  },
  emergencyDescription: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  emergencyButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.danger,
  },
});

export default function RapidStabilizationScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleClose = useCallback(() => {
    console.log('[RapidStabilization] close pressed');
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

  useEffect(() => {
    console.log('[Animation] Rapid Stabilization screen fade-in started');
    // Smooth fade-in animation when screen appears
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleCall988 = () => {
    console.log('User tapped Call 988 from Rapid Stabilization');
    const phoneNumber = Platform.OS === 'ios' ? 'tel:988' : 'tel:988';
    Linking.openURL(phoneNumber).catch((err) =>
      console.error('Error opening phone dialer:', err)
    );
  };

  const handleText988 = () => {
    console.log('User tapped Text 988 from Rapid Stabilization');
    const smsNumber = Platform.OS === 'ios' ? 'sms:988' : 'sms:988';
    Linking.openURL(smsNumber).catch((err) =>
      console.error('Error opening SMS:', err)
    );
  };

  const handleBreatheWithMe = () => {
    console.log('User tapped Breathe With Me from Rapid Stabilization');
    router.push('/reset-session?mood=panic&backendMood=panic');
  };

  const handleGroundYourself = () => {
    console.log('User tapped Ground Yourself from Rapid Stabilization');
    router.push('/grounding-technique?id=5-4-3-2-1');
  };

  const titleText = 'Rapid Stabilization';
  const subtitleText = "You are not alone. Let's steady this moment together.";
  const breatheTitle = 'Breathe With Me';
  const breatheDescription = 'Guided breathing to slow your heart rate and calm your mind.';
  const breatheButtonText = 'Start Breathing';
  const groundTitle = 'Ground Yourself';
  const groundDescription = 'A simple grounding technique to reconnect with the present moment.';
  const groundButtonText = 'Start Grounding';
  const contactTitle = 'Contact Support';
  const contactDescription = 'Immediate support is available 24/7.';
  const callButtonText = 'Call 988';
  const textButtonText = 'Text 988';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Rapid Stabilization',
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
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{titleText}</Text>
              <Text style={styles.subtitle}>{subtitleText}</Text>
            </View>

            <View style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <IconSymbol
                  ios_icon_name="wind"
                  android_material_icon_name="air"
                  size={32}
                  color={colors.accent}
                  style={styles.actionIcon}
                />
                <Text style={styles.actionTitle}>{breatheTitle}</Text>
              </View>
              <Text style={styles.actionDescription}>{breatheDescription}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleBreatheWithMe}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>{breatheButtonText}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <IconSymbol
                  ios_icon_name="hand.raised.fill"
                  android_material_icon_name="back-hand"
                  size={32}
                  color={colors.accent}
                  style={styles.actionIcon}
                />
                <Text style={styles.actionTitle}>{groundTitle}</Text>
              </View>
              <Text style={styles.actionDescription}>{groundDescription}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleGroundYourself}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>{groundButtonText}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.emergencyCard}>
              <Text style={styles.emergencyTitle}>{contactTitle}</Text>
              <Text style={styles.emergencyDescription}>{contactDescription}</Text>
              <View style={styles.emergencyButtonsRow}>
                <TouchableOpacity
                  style={styles.emergencyButton}
                  onPress={handleCall988}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emergencyButtonText}>{callButtonText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emergencyButton}
                  onPress={handleText988}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emergencyButtonText}>{textButtonText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </LinearGradient>
    </>
  );
}
