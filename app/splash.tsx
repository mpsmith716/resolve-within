
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('[Splash] Post-login splash screen mounted');
    
    // Gentle fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    // Breathing-style pulse animation on the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Navigate to home after 1.8 seconds
    const timer = setTimeout(() => {
      console.log('[Splash] Transition complete, navigating to home');
      router.replace('/(tabs)/(home)/');
    }, 1800);

    return () => clearTimeout(timer);
  }, [fadeAnim, pulseAnim, router]);

  const appName = 'Resolve Within';
  const subtitle = 'One breath at a time.';
  const loadingText = 'Preparing your space...';

  return (
    <LinearGradient 
      colors={[colors.background, colors.cardBackground, colors.background]} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {/* Dog tags icon */}
        <View style={styles.iconContainer}>
          <View style={styles.dogTag}>
            <View style={styles.dogTagHole} />
          </View>
          <View style={[styles.dogTag, styles.dogTagSecond]}>
            <View style={styles.dogTagHole} />
          </View>
        </View>

        {/* App name */}
        <Text style={styles.appName}>{appName}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

        {/* Loading text at bottom */}
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 80,
    height: 100,
    marginBottom: 32,
  },
  dogTag: {
    width: 60,
    height: 80,
    backgroundColor: colors.accent,
    borderRadius: 8,
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: 2,
    borderColor: colors.text,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  dogTagSecond: {
    left: 20,
    top: 10,
    opacity: 0.8,
  },
  dogTagHole: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.text,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: colors.subtext,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
  },
});
