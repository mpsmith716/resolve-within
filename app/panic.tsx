
import { FontWeights } from '@/utils/fontHelpers';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Linking,
  Platform,
  ScrollView,
  BackHandler,
} from 'react-native';
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { getSafeGradient } from '@/constants/SafeDefaults';

const GROUNDING_ITEMS = [
  '5 things you can see',
  '4 things you can feel',
  '3 things you can hear',
  '2 things you can smell',
  '1 thing you can taste',
];

const YELLOW = '#FFD700';
const YELLOW_BORDER = '#D4A000';
const YELLOW_TINT = 'rgba(255, 215, 0, 0.12)';

export default function PanicScreen() {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0)).current;
  const callButtonScale = useRef(new Animated.Value(1)).current;
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const handleClose = useCallback(() => {
    console.log('[PanicScreen] Close button pressed');
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
    console.log('[PanicScreen] Heart pulse animation started');
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacityAnim, {
            toValue: 0.25,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacityAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, glowOpacityAnim]);

  const handleCall988PressIn = () => {
    Animated.spring(callButtonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handleCall988PressOut = () => {
    Animated.spring(callButtonScale, {
      toValue: 1.0,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  };

  const handleCall988 = () => {
    console.log('[PanicScreen] Call 988 button pressed');
    Linking.openURL('tel:988').catch((err) =>
      console.error('[PanicScreen] Error opening phone dialer:', err)
    );
  };

  const handleText988 = () => {
    console.log('[PanicScreen] Text 988 button pressed');
    Linking.openURL('sms:988').catch((err) =>
      console.error('[PanicScreen] Error opening SMS:', err)
    );
  };

  const handleRapidStabilization = () => {
    console.log('[PanicScreen] Rapid Stabilization button pressed');
    router.push('/rapid-stabilization');
  };

  const handleGroundingItemPress = (index: number) => {
    const nextState = !checked[index];
    console.log(`[PanicScreen] Grounding item ${index} tapped: "${GROUNDING_ITEMS[index]}" -> ${nextState ? 'checked' : 'unchecked'}`);
    setChecked((prev) => ({ ...prev, [index]: nextState }));
  };

  const titleText = 'You Are Not Alone';
  const subtitleText = 'Immediate support is available';
  const rapidTitle = 'Need Help Right Now?';
  const rapidDescription = 'Get immediate stabilization support with simple, guided actions.';
  const rapidButtonText = 'Start Rapid Stabilization';
  const crisisTitle = 'Crisis Support — 988';
  const crisisDescription = 'Free, confidential support available 24/7 for anyone in crisis.';
  const callButtonText = 'Call 988 Now';
  const textButtonText = 'Text 988';
  const groundingTitle = '5-4-3-2-1 Grounding';
  const groundingSubtitle = 'Bring yourself back to the present moment';
  const groundingSupportText = 'Take your time. Move through each step slowly.';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Crisis Support',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={22}
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
          {/* 1. Hero — Heart + "You Are Not Alone" */}
          <View style={styles.hero}>
            <View style={styles.pulseContainer}>
              <Animated.View
                style={[
                  styles.glowLayer,
                  { opacity: glowOpacityAnim, transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.pulseCircle,
                  { opacity: glowOpacityAnim, transform: [{ scale: pulseAnim }] },
                ]}
              />
              <View style={styles.iconContainer}>
                <IconSymbol
                  ios_icon_name="heart.fill"
                  android_material_icon_name="favorite"
                  size={40}
                  color={colors.text}
                />
              </View>
            </View>
            <Text style={styles.heroTitle}>{titleText}</Text>
            <Text style={styles.heroSubtitle}>{subtitleText}</Text>
          </View>

          {/* 2. Rapid Stabilization Card */}
          <View style={styles.rapidCard}>
            <Text style={styles.rapidTitle}>{rapidTitle}</Text>
            <Text style={styles.rapidDescription}>{rapidDescription}</Text>
            <TouchableOpacity
              style={styles.rapidButton}
              onPress={handleRapidStabilization}
              activeOpacity={0.8}
            >
              <Text style={styles.rapidButtonText}>{rapidButtonText}</Text>
            </TouchableOpacity>
          </View>

          {/* 3. 988 Crisis Card — PRIMARY ACTION */}
          <View style={styles.crisisCard}>
            <View style={styles.crisisHeader}>
              <View style={styles.crisisIconCircle}>
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.crisisTextBlock}>
                <Text style={styles.crisisTitle}>{crisisTitle}</Text>
                <Text style={styles.crisisDescription}>{crisisDescription}</Text>
              </View>
            </View>

            {/* PRIMARY: Yellow Call 988 Button */}
            <Animated.View style={{ transform: [{ scale: callButtonScale }] }}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCall988}
                onPressIn={handleCall988PressIn}
                onPressOut={handleCall988PressOut}
                activeOpacity={1}
              >
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={22}
                  color="#000000"
                />
                <Text style={styles.callButtonText}>{callButtonText}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* SECONDARY: Text 988 */}
            <TouchableOpacity
              style={styles.textButton}
              onPress={handleText988}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="message.fill"
                android_material_icon_name="message"
                size={20}
                color={YELLOW}
              />
              <Text style={styles.textButtonText}>{textButtonText}</Text>
            </TouchableOpacity>
          </View>

          {/* 4. 5-4-3-2-1 Grounding Section */}
          <View style={styles.groundingCard}>
            <Text style={styles.groundingTitle}>{groundingTitle}</Text>
            <Text style={styles.groundingSubtitle}>{groundingSubtitle}</Text>

            <View style={styles.groundingList}>
              {GROUNDING_ITEMS.map((item, index) => {
                const isChecked = !!checked[index];
                const rowBg = isChecked ? YELLOW_TINT : 'rgba(255,255,255,0.04)';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.groundingRow, { backgroundColor: rowBg }]}
                    onPress={() => handleGroundingItemPress(index)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.groundingCircle, isChecked && styles.groundingCircleChecked]}>
                      {isChecked && <Text style={styles.groundingCheckmark}>✓</Text>}
                    </View>
                    <Text style={styles.groundingItemText}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.groundingSupportText}>{groundingSupportText}</Text>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
  },
  closeButton: {
    marginLeft: 8,
    padding: 8,
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  glowLayer: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(220, 38, 38, 0.4)',
  },
  pulseCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.danger,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
  },

  // Rapid Stabilization Card
  rapidCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  rapidTitle: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: colors.accent,
    marginBottom: 8,
  },
  rapidDescription: {
    fontSize: 15,
    color: '#E0E0E0',
    marginBottom: 16,
    lineHeight: 22,
  },
  rapidButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(255,215,0,0.3)',
  },
  rapidButtonText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: '#000000',
  },

  // 988 Crisis Card
  crisisCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  crisisIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  crisisTextBlock: {
    flex: 1,
  },
  crisisTitle: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  crisisDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // PRIMARY: Yellow Call 988 Button
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: YELLOW,
    minHeight: 60,
    borderRadius: 14,
    marginTop: 0,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: YELLOW_BORDER,
    boxShadow: '0 4px 12px rgba(255,215,0,0.4)',
  },
  callButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.3,
  },

  // SECONDARY: Text 988 Button
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.10)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: YELLOW_BORDER,
  },
  textButtonText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: YELLOW,
  },

  // Grounding Card
  groundingCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.18)',
  },
  groundingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  groundingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  groundingList: {
    gap: 8,
    marginBottom: 4,
  },
  groundingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.12)',
  },
  groundingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  groundingCircleChecked: {
    backgroundColor: YELLOW,
    borderColor: YELLOW_BORDER,
  },
  groundingCheckmark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 16,
  },
  groundingItemText: {
    fontSize: 15,
    fontWeight: FontWeights.medium,
    color: colors.text,
    flex: 1,
  },
  groundingSupportText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 14,
  },
});
