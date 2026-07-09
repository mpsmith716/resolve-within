
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const contextKey = params.context ?? '';
  const returnTo = params.returnTo ?? '';
  const contextMessage = CONTEXT_MESSAGES[contextKey] ?? DEFAULT_MESSAGE;

  const titleText = mode === 'signin' ? 'Welcome Back' : 'Create Account';
  const switchText = mode === 'signin' ? 'Create Account' : 'Already have an account? Sign In';
  const submitButtonText = mode === 'signin' ? 'Sign In' : 'Create Account';

  const handlePostAuthRedirect = () => {
    if (returnTo) {
      console.log('[Auth] Post-login redirect to returnTo:', returnTo);
      router.replace(returnTo as any);
    } else {
      console.log('[Auth] Post-login redirect to tabs');
      router.replace('/(tabs)');
    }
  };

  const handleEmailSubmit = async () => {
    console.log('[Auth] User tapped email submit button, mode:', mode);
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        console.log('[Auth] Calling signInWithEmail for:', email);
        await signInWithEmail(email.trim(), password);
        console.log('[Auth] Email sign-in successful');
      } else {
        console.log('[Auth] Calling signUpWithEmail for:', email);
        await signUpWithEmail(email.trim(), password, name.trim());
        console.log('[Auth] Email sign-up successful');
      }
      handlePostAuthRedirect();
    } catch (error: any) {
      console.error('[Auth] Email auth error:', error?.message || error);
      setErrorMessage(error?.message || 'Unable to sign in. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

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
      console.log('[Auth] Social auth successful:', provider);
      handlePostAuthRedirect();
    } catch (error: any) {
      console.error('[Auth] Social auth error:', error?.message || error);
      setErrorMessage('Unable to sign in. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithout = () => {
    console.log('[Auth] User tapped Continue without signing in');
    try {
      router.back();
    } catch {
      router.replace('/');
    }
  };

  const handleSwitchMode = () => {
    console.log('[Auth] User switched mode to:', mode === 'signin' ? 'signup' : 'signin');
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrorMessage('');
  };

  const handleTogglePassword = () => {
    console.log('[Auth] User toggled password visibility');
    setShowPassword((prev) => !prev);
  };

  const eyeIcon = showPassword ? 'eye-off-outline' : 'eye-outline';

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
            {/* Logo */}
            <View style={styles.iconContainer}>
              <View style={styles.logoGlow}>
                <Image
                  source={require('@/assets/images/1f68aeb0-e5af-4ba5-9383-b05b7384c87a.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* App name */}
            <Text style={styles.appName}>Resolve Within</Text>

            {/* Title */}
            <Text style={styles.title}>{titleText}</Text>

            {/* Context message */}
            <Text style={styles.subtitle}>{contextMessage}</Text>

            {/* Apple-compliance disclaimer (always visible on every platform) */}
            <View style={styles.disclaimerBlock}>
              <Text style={styles.disclaimerText}>
                Resolve Within is a wellness support app and is not a replacement for professional medical care, therapy, or emergency services.
              </Text>
              <Text style={styles.disclaimerCrisisText}>
                If you are in crisis, call 911 or 988 immediately.
              </Text>
            </View>

            {/* Error message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email/Password Form */}
            <View style={styles.formContainer}>
              {/* Name field (signup only) */}
              {mode === 'signup' && (
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === 'name' && styles.inputFocused,
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={MUTED}
                    autoCapitalize="words"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    editable={!loading}
                  />
                </View>
              )}

              {/* Email field */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={MUTED}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  editable={!loading}
                />
              </View>

              {/* Password field */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      focusedField === 'password' && styles.inputFocused,
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={MUTED}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={handleTogglePassword}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name={eyeIcon} size={20} color={MUTED} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleEmailSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={NAVY_DARK} />
                ) : (
                  <Text style={styles.primaryButtonText}>{submitButtonText}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Apple sign in (iOS only) */}
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

            {/* Google sign in */}
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
                <Text style={Platform.OS === 'ios' ? styles.secondaryButtonText : styles.primaryButtonText}>
                  Sign In with Google
                </Text>
              )}
            </TouchableOpacity>

            {/* Switch mode link */}
            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={handleSwitchMode}
              activeOpacity={0.7}
            >
              <Text style={styles.switchModeText}>{switchText}</Text>
            </TouchableOpacity>

            {/* Supportive message */}
            <Text style={styles.supportText}>
              You can still access support tools without an account
            </Text>

            {/* Continue without signing in */}
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
  // Email form styles
  formContainer: {
    width: '100%',
    marginBottom: 4,
  },
  fieldWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: WHITE,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: GOLD,
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeToggle: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerBlock: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  disclaimerCrisisText: {
    fontSize: 13,
    lineHeight: 19,
    color: GOLD,
    textAlign: 'center',
    fontWeight: '600',
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(136,153,170,0.25)',
  },
  dividerText: {
    color: MUTED,
    fontSize: 13,
    marginHorizontal: 12,
    fontWeight: '500',
  },
});
