import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingScreen() {
  const router = useRouter();
  const { user, loading, needsOnboarding } = useAuth();
  // Where a signed-in user should go; null until the onboarding check finishes.
  const [signedInTarget, setSignedInTarget] = useState<'home' | 'onboarding' | null>(null);
  // Never block the landing page (and the 911/988 message) on a slow network: after a few
  // seconds of session restore, show it anyway; a restored session still redirects later.
  const [restoreTimedOut, setRestoreTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRestoreTimedOut(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !user) {
      setSignedInTarget(null);
      return;
    }
    let cancelled = false;
    needsOnboarding()
      .then((needs) => {
        if (!cancelled) setSignedInTarget(needs ? 'onboarding' : 'home');
      })
      .catch(() => {
        if (!cancelled) setSignedInTarget('home');
      });
    return () => {
      cancelled = true;
    };
    // needsOnboarding is recreated each render; re-run only when the session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  // Still restoring a saved session: show a spinner instead of flashing the landing page.
  if (!restoreTimedOut && (loading || (user && !signedInTarget))) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // Valid saved session: skip the landing/sign-in screens.
  if (user && signedInTarget === 'onboarding') {
    return <Redirect href="/onboarding" />;
  }
  if (user && signedInTarget === 'home') {
    return <Redirect href="/(tabs)/(home)" />;
  }

  // No session (first launch, signed out, or guest): existing landing page.
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resolve Within</Text>

      <Text style={styles.body}>
        Resolve Within offers supportive tools for grounding, reflection, and emotional reset.
        It is not a substitute for emergency services, licensed therapy, or medical care.
      </Text>

      <Text style={styles.body}>
        If you are in immediate danger or may harm yourself or someone else, call 911 or 988 now.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/auth' as any)}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/auth' as any)}
      >
        <Text style={styles.secondaryButtonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    padding: 24,
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  body: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#0B1220',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
  },
});