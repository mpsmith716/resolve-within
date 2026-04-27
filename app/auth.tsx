import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD = '#C9A84C';
const NAVY_DARK = '#0A1628';
const NAVY_MID = '#112240';
const WHITE = '#FFFFFF';
const MUTED = '#8899AA';
const ERROR_AMBER = '#D4A017';

const CONTEXT_MESSAGES: Record<string, string> = {
  journal: 'Sign in to access your journal',
  community: 'Sign in to join the community',
  veteran: 'Sign in to access Veteran support resources',
  profile: 'Sign in to view your profile',
};

const DEFAULT_MESSAGE =
  'Sign in to access your journal, connect with the community, and unlock personalized support.';

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ context?: string; returnTo?: string }>();

  const {
    user,
    signInWithGoogle,
    signInWithApple,
    loading: authLoading,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const contextKey = params.context ?? '';
  const returnTo = params.returnTo ?? '';
  const contextMessage = CONTEXT_MESSAGES[contextKey] ?? DEFAULT_MESSAGE;

  const titleText = mode === 'signin' ? 'Welcome Back' : 'Create Account';
  const switchText = mode === 'signin' ? 'Create Account' : 'Already have an account? Sign In';

  useEffect(() => {
    if (!user) return;

    console.log('[Auth] User detected, redirecting after login...');

    if (returnTo) {
      router.replace(returnTo as any);
      return;
    }

    router.replace('/(tabs)' as any);
  }, [user, returnTo, router]);

  useEffect(() => {
  if (user) {
    console.log('[Auth] User detected, stopping loading spinner');
    setLoading(false);
  }
}, [user]);

const handleSocialAuth = async (provider: 'google' | 'apple') => {
  console.log('[Auth] User tapped social auth button:', provider);
  setErrorMessage('');
  setLoading(true);

  try {
    if (provider === 'google') {
      await signInWithGoogle();
    } else {
      await signInWithApple();
    }

    // 🔥 Fallback: stop spinner if something fails silently
    setTimeout(() => {
      console.log('[Auth] Safety timeout hit, stopping loading spinner');
      setLoading(false);
    }, 8000);

  } catch (error: any) {
    console.error('[Auth] Social auth error:', error?.message || error);
    setErrorMessage(error?.message || 'Unable to sign in. Please try again.');
    setLoading(false);
  }
};

  const handleContinueWithout = () => {
    console.log('[Auth] User tapped Continue without signing in');
    router.replace('/(tabs)' as any);
  };

  const handleSwitchMode = () => {
    console.log('[Auth] User switched mode to:', mode === 'signin' ? 'signup' : 'signin');
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrorMessage('');
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  return (
    <LinearGradient colors={[NAVY_DARK, NAVY_MID]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <View style={styles.logoGlow}>
                <Image
                  source={require('@/assets/images/1f68aeb0-e5af-4ba5-9383-b05b7384c87a.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={styles.appName}>Resolve Within</Text>
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.subtitle}>{contextMessage}</Text>

            {user?.email ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>Signed in as {user.email}</Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={() => handleSocialAuth('apple')}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={NAVY_DARK} />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In with Apple</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                Platform.OS === 'ios' ? styles.secondaryButton : styles.primaryButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={() => handleSocialAuth('google')}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Platform.OS === 'ios' ? GOLD : NAVY_DARK} />
              ) : (
                <Text
                  style={
                    Platform.OS === 'ios'
                      ? styles.secondaryButtonText
                      : styles.primaryButtonText
                  }
                >
                  Sign In with Google
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={handleSwitchMode}
              activeOpacity={0.7}
            >
              <Text style={styles.switchModeText}>{switchText}</Text>
            </TouchableOpacity>

            <Text style={styles.supportText}>
              You can still access support tools without an account
            </Text>

            <TouchableOpacity
              style={styles.continueWithoutButton}
              onPress={handleContinueWithout}
              activeOpacity={0.7}
            >
              <Text style={styles.continueWithoutText}>Continue without signing in</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NAVY_DARK,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  logoGlow: {
    width: 252,
    height: 252 * (743 / 1320) + 32,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.10)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 220,
    height: 220 * (743 / 1320),
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  successContainer: {
    width: '100%',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  successText: {
    color: '#86EFAC',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ERROR_AMBER,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  errorText: {
    color: ERROR_AMBER,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: GOLD,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: NAVY_DARK,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  switchModeButton: {
    marginTop: 8,
    marginBottom: 28,
    paddingVertical: 6,
  },
  switchModeText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  supportText: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  continueWithoutButton: {
    paddingVertical: 8,
  },
  continueWithoutText: {
    color: MUTED,
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});