
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import CrisisDisclaimerModal from '@/components/CrisisDisclaimerModal';
import { safeGetItem, safeSetItem } from '@/utils/safeStorage';

const CRISIS_DISCLAIMER_KEY = 'crisis_disclaimer_shown';

// Prevent the splash screen from auto-hiding before asset loading is complete.
// Wrapped in try/catch because on iOS the native splash may not yet be registered
// when this module loads, which would otherwise throw an unhandled promise rejection.
(async () => {
  try {
    await SplashScreen.preventAutoHideAsync();
  } catch {
    // Native splash not registered yet — safe to ignore.
  }
})();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  // null = not yet checked, true = show, false = skip
  const [showDisclaimer, setShowDisclaimer] = useState<boolean | null>(null);

  const handleDisclaimerAccept = async () => {
    console.log('[CrisisDisclaimer] User tapped I Understand — persisting flag');
    try {
      await safeSetItem(CRISIS_DISCLAIMER_KEY, 'true');
      console.log('[CrisisDisclaimer] Flag persisted successfully');
    } catch (e) {
      console.warn('[CrisisDisclaimer] Failed to persist flag, dismissing anyway', e);
    } finally {
      setShowDisclaimer(false);
    }
  };

  useEffect(() => {
    async function checkDisclaimer() {
      try {
        const value = await safeGetItem(CRISIS_DISCLAIMER_KEY);
        console.log('[CrisisDisclaimer] Stored flag:', value);
        setShowDisclaimer(value !== 'true');
      } catch (e) {
        console.warn('[CrisisDisclaimer] Failed to read flag, showing disclaimer', e);
        setShowDisclaimer(true);
      }
    }
    checkDisclaimer();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {
        // Splash screen may already be hidden; ignore the error
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GlobalErrorBoundary>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="splash" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
              <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="panic" options={{ headerShown: false }} />
              <Stack.Screen name="rapid-stabilization" options={{ headerShown: false }} />
              <Stack.Screen name="reset-session" options={{ headerShown: false }} />
              <Stack.Screen name="grounding-technique" options={{ headerShown: false }} />
              <Stack.Screen name="crisis-resources" options={{ headerShown: false }} />
              <Stack.Screen name="message-preferences" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="delete-data" options={{ headerShown: false }} />
              <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
              <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
          {/* Rendered outside ThemeProvider/Stack so it always layers above the navigator */}
          <CrisisDisclaimerModal
            visible={showDisclaimer === true}
            onAccept={handleDisclaimerAccept}
          />
        </AuthProvider>
      </GlobalErrorBoundary>
    </SafeAreaProvider>
  );
}
