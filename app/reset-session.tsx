
import { colors } from '@/styles/commonStyles';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppModal } from '@/components/ErrorBoundary';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPost } from '@/utils/api';
import { getSafeGradient, getSafeString } from '@/constants/SafeDefaults';
import { safeAnimateOpacity, safeAnimateScale, safeStartAnimation, safeResetValue } from '@/utils/safeAnimations';
import { FontWeights } from '@/utils/fontHelpers';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';

// ─── Level system ────────────────────────────────────────────────────────────

interface LevelConfig {
  level: number;
  title: string;
  subtitle: string;
  inhaleTime: number;  // seconds
  holdTime: number;    // seconds (0 = skip hold phase)
  exhaleTime: number;  // seconds
  totalCycles: number;
  gradient: string[];
}
const audioSource = require('@/assets/audio/calm-breathing.mp3');

// Keyed 1–5 by level number
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    level: 1,
    title: 'Settle In',
    subtitle: 'Light and easy — a gentle start',
    inhaleTime: 3,
    holdTime: 0,
    exhaleTime: 3,
    totalCycles: 6,
    gradient: ['#3a4a6b', '#1e2d4a'],
  },
  2: {
    level: 2,
    title: 'Slow the Surge',
    subtitle: 'Ease the edge and steady your breath',
    inhaleTime: 4,
    holdTime: 0,
    exhaleTime: 5,
    totalCycles: 8,
    gradient: ['#2d4a3e', '#1a3028'],
  },
  3: {
    level: 3,
    title: 'Reconnect',
    subtitle: 'Gently return to the present moment',
    inhaleTime: 4,
    holdTime: 4,
    exhaleTime: 4,
    totalCycles: 10,
    gradient: ['#3a2d5c', '#221a3a'],
  },
  4: {
    level: 4,
    title: 'Release the Weight',
    subtitle: 'Longer exhales to soften heavy emotion',
    inhaleTime: 4,
    holdTime: 0,
    exhaleTime: 6,
    totalCycles: 12,
    gradient: ['#4a2d2d', '#2e1a1a'],
  },
  5: {
    level: 5,
    title: 'Light the Spark',
    subtitle: 'Bright, steady energy with control',
    inhaleTime: 4,
    holdTime: 0,
    exhaleTime: 4,
    totalCycles: 14,
    gradient: ['#4a3d1a', '#2e2510'],
  },
};

// Maps full mood name strings (as passed via route params) to level numbers
const MOOD_NAME_TO_LEVEL: Record<string, number> = {
  'Cloudy but Moving': 1,
  'On Edge': 2,
  'Numb Zone': 3,
  'Heavy Heart': 4,
  'Light Spark': 5,
  // legacy camelCase keys for backwards compat
  'cloudy': 1,
  'onEdge': 2,
  'numbZone': 3,
  'heavyHeart': 4,
  'lightSpark': 5,
  'panic': 1,
};

const FALLBACK_LEVEL = 1;

function resolveConfig(params: Record<string, string | string[]>): LevelConfig {
  // Try numeric `level` param first
  const rawLevel = getSafeString(params.level, '');
  if (rawLevel) {
    const n = parseInt(rawLevel, 10);
    if (n >= 1 && n <= 5 && LEVEL_CONFIGS[n]) {
      console.log('[Session] resolved level from level param:', n);
      return LEVEL_CONFIGS[n];
    }
  }
  // Try `mood` param (full name string or camelCase key)
  const rawMood = getSafeString(params.mood, '');
  if (rawMood) {
    const n = MOOD_NAME_TO_LEVEL[rawMood];
    if (n && LEVEL_CONFIGS[n]) {
      console.log('[Session] resolved level from mood param:', rawMood, '→', n);
      return LEVEL_CONFIGS[n];
    }
  }
  console.log('[Session] no valid param found, falling back to level', FALLBACK_LEVEL);
  return LEVEL_CONFIGS[FALLBACK_LEVEL];
}

const MOOD_TO_BACKEND: Record<string, string> = {
  cloudy: 'cloudy',
  onEdge: 'onEdge',
  numbZone: 'numb',
  heavyHeart: 'heavy',
  lightSpark: 'light',
  panic: 'panic',
  'Cloudy but Moving': 'cloudy',
  'On Edge': 'onEdge',
  'Numb Zone': 'numb',
  'Heavy Heart': 'heavy',
  'Light Spark': 'light',
};

export default function ResetSessionScreen() {
  const player = useAudioPlayer(audioSource);

  const safePause = () => {
    try {
      safePause();
    } catch {}
  };

  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Resolve config once from params — stable for the lifetime of this screen
  const config: LevelConfig = resolveConfig(params as Record<string, string | string[]>);
  const moodKey = getSafeString(params.mood, 'cloudy');

  const [isActive, setIsActive] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showJournalPrompt, setShowJournalPrompt] = useState(false);

  // Refs to track active state inside callbacks without stale closures
  const isActiveRef = useRef(false);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const breathScale = useRef(new Animated.Value(0.4)).current;
  const breathOpacity = useRef(new Animated.Value(0.25)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const currentAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Fade in on mount
  useEffect(() => {
    console.log('[Session] screen mounted, level:', config.level, 'title:', config.title);
    safeStartAnimation(safeAnimateOpacity(screenFadeAnim, 1, { duration: 600 }));
  }, [screenFadeAnim]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
  player.volume = 0.03; // VERY important (soft)
  player.loop = true;
}, []);

  // ─── closeSession ─────────────────────────────────────────────────────────
  const closeSession = useCallback(() => {

    safePause();

    console.log('[Session] closeSession called');
    // Stop any running animations/timers immediately
    isActiveRef.current = false;
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    if (currentAnimRef.current) {
      currentAnimRef.current.stop();
      currentAnimRef.current = null;
    }
    setIsActive(false);
    setShowJournalPrompt(false);

    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/(home)/');
      }
    } catch (err) {
      console.warn('[Session] navigation error, falling back to replace:', err);
      try {
        router.replace('/(tabs)/(home)/');
      } catch (e2) {
        console.error('[Session] critical navigation failure:', e2);
      }
    }
  }, [router]);

  // Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[Session] Android back pressed');
      closeSession();
      return true;
    });
    return () => sub.remove();
  }, [closeSession]);

  useEffect(() => {
  return () => {
    safePause();
  };
}, []);

  // ─── Breathing cycle engine ───────────────────────────────────────────────
  const stopAnimations = useCallback(() => {
    if (currentAnimRef.current) {
      currentAnimRef.current.stop();
      currentAnimRef.current = null;
    }
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
  }, []);

  const runBreathingCycle = useCallback(() => {
    if (!isActiveRef.current) return;

    const { inhaleTime, holdTime, exhaleTime } = config;

    // ── Inhale ──
    setPhase('inhale');
    const inhaleAnim = Animated.parallel([
      safeAnimateScale(breathScale, 1, { duration: inhaleTime * 1000 }),
      safeAnimateOpacity(breathOpacity, 1, { duration: inhaleTime * 1000 }),
    ]);
    currentAnimRef.current = inhaleAnim;

    safeStartAnimation(inhaleAnim, () => {
      if (!isActiveRef.current) return;

      if (holdTime > 0) {
        // ── Hold ──
        setPhase('hold');
        cycleTimerRef.current = setTimeout(() => {
          if (!isActiveRef.current) return;
          startExhale();
        }, holdTime * 1000);
      } else {
        // No hold — go straight to exhale
        startExhale();
      }
    });
  }, [config, breathScale, breathOpacity]); // eslint-disable-line react-hooks/exhaustive-deps

  const startExhale = useCallback(() => {
    if (!isActiveRef.current) return;
    const { exhaleTime } = config;

    setPhase('exhale');
    const exhaleAnim = Animated.parallel([
      safeAnimateScale(breathScale, 0.4, { duration: exhaleTime * 1000 }),
      safeAnimateOpacity(breathOpacity, 0.25, { duration: exhaleTime * 1000 }),
    ]);
    currentAnimRef.current = exhaleAnim;

    safeStartAnimation(exhaleAnim, () => {
      if (!isActiveRef.current) return;
      setCycleCount((prev) => {
        const next = prev + 1;
        console.log('[Session] cycle complete:', next, '/', config.totalCycles);
        if (next >= config.totalCycles) {
          // Session complete
          console.log('[Session] session complete after', next, 'cycles');
          isActiveRef.current = false;
          setIsActive(false);
          setSessionComplete(true);
          setShowJournalPrompt(true);
        }
        return next;
      });
    });
  }, [config, breathScale, breathOpacity]);

  // Kick off next cycle whenever cycleCount changes and session is still active
  useEffect(() => {
    if (isActive && !sessionComplete) {
      runBreathingCycle();
    }
  }, [isActive, cycleCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Start / Stop ─────────────────────────────────────────────────────────
  const handleStartStop = () => {
    if (isActive) {
      console.log('[Session] user stopped session after', cycleCount, 'cycles');
     
     safePause();

      isActiveRef.current = false;
      stopAnimations();
      setIsActive(false);
      safeResetValue(breathScale, 0.4);
      safeResetValue(breathOpacity, 0.25);
      if (cycleCount > 0) {
        setShowJournalPrompt(true);
      }
    } else {
      console.log('[Session] user started session, level:', config.level, config.title);
      
      player.play();

      setSessionComplete(false);
      setCycleCount(0);
      setPhase('inhale');
      safeResetValue(breathScale, 0.4);
      safeResetValue(breathOpacity, 0.25);
      isActiveRef.current = true;
      setIsActive(true);
    }
  };

  // ─── Journal handlers ─────────────────────────────────────────────────────
  const handleSaveJournal = async () => {
    console.log('[Session] user chose to save journal entry, cycles:', cycleCount);
    try {
      const backendMood = MOOD_TO_BACKEND[moodKey] || 'cloudy';
      await authenticatedPost('/api/journal', {
        mood: backendMood,
        content: `Completed ${cycleCount} breathing cycles — ${config.title} (Level ${config.level})`,
      });
      console.log('[Session] journal entry saved successfully');
    } catch (error) {
      console.warn('[Session] failed to save journal entry, continuing:', error);
    }
    closeSession();
  };

  const handleSkipJournal = () => {
    console.log('[Session] user skipped journal save');
    closeSession();
  };

  // ─── Derived display values ───────────────────────────────────────────────
  const safeGradient = getSafeGradient(config.gradient);

  const phaseLabel =
    phase === 'inhale' ? 'Breathe In' :
    phase === 'hold'   ? 'Hold' :
                         'Breathe Out';

  const showHoldPhase = isActive && phase === 'hold' && config.holdTime > 0;
  const showPhaseLabel = isActive;

  const cyclesRemaining = config.totalCycles - cycleCount;
  const progressPercent = config.totalCycles > 0
    ? Math.min(100, Math.round((cycleCount / config.totalCycles) * 100))
    : 0;

  const levelBadgeText = `Level ${config.level}`;
  const cycleCountDisplay = cycleCount.toString();
  const totalCyclesDisplay = config.totalCycles.toString();
  const progressPercentDisplay = `${progressPercent}%`;
  const buttonText = isActive ? 'Stop Session' : sessionComplete ? 'Start Again' : 'Start Session';

  const patternText =
    config.holdTime > 0
      ? `${config.inhaleTime}s in · ${config.holdTime}s hold · ${config.exhaleTime}s out`
      : `${config.inhaleTime}s in · ${config.exhaleTime}s out`;

  const journalModalMessage = sessionComplete
    ? `You completed all ${cycleCount} cycles of ${config.title}. Save this to your journal?`
    : `You completed ${cycleCount} breathing cycle${cycleCount !== 1 ? 's' : ''} of ${config.title}. Save this to your journal?`;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <Animated.View style={[styles.fullScreen, { opacity: screenFadeAnim }]} pointerEvents="box-none">
        <LinearGradient colors={safeGradient} style={[styles.gradient, { paddingTop: insets.top + 16 }]} pointerEvents="box-none">

          {/* ── Header ── */}
          <View style={styles.header} pointerEvents="box-none">
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{levelBadgeText}</Text>
            </View>
            <Text style={styles.displayName}>{config.title}</Text>
            <Text style={styles.description}>{config.subtitle}</Text>
            <Text style={styles.patternText}>{patternText}</Text>
          </View>

          {/* ── Breathing circle ── */}
          <View style={styles.breathingContainer} pointerEvents="none">
            {/* Outer glow ring */}
            <Animated.View
              style={[
                styles.breathGlow,
                {
                  transform: [{ scale: breathScale }],
                  opacity: breathOpacity,
                },
              ]}
            />
            {/* Main circle */}
            <Animated.View
              style={[
                styles.breathCircle,
                {
                  transform: [{ scale: breathScale }],
                  opacity: breathOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.45)', 'rgba(255, 165, 0, 0.15)']}
                style={styles.circleGradient}
              />
            </Animated.View>

            {/* Phase label — centered over circle */}
            {showPhaseLabel ? (
              <View style={styles.phaseOverlay} pointerEvents="none">
                <Text style={styles.phaseText}>{phaseLabel}</Text>
              </View>
            ) : null}
          </View>

          {/* ── Progress ── */}
          <View style={styles.progressContainer} pointerEvents="none">
            <View style={styles.progressRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{cycleCountDisplay}</Text>
                <Text style={styles.statLabel}>Cycles Done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalCyclesDisplay}</Text>
                <Text style={styles.statLabel}>Total Cycles</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{progressPercentDisplay}</Text>
                <Text style={styles.statLabel}>Progress</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: progressPercentDisplay as any }]} />
            </View>
          </View>

          {/* ── Start/Stop button ── */}
          <View style={styles.buttonContainer} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleStartStop}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isActive ? ['#FF6B6B', '#FF4444'] : ['#FFD700', '#FFA500']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <IconSymbol
                  ios_icon_name={isActive ? 'stop.fill' : 'play.fill'}
                  android_material_icon_name={isActive ? 'stop' : 'play-arrow'}
                  size={22}
                  color="#0b1020"
                />
                <Text style={styles.actionButtonText}>{buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </LinearGradient>
      </Animated.View>

      {/* ── X close button — rendered LAST so it is on top of everything ── */}
      <View style={[styles.closeButtonContainer, { top: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.closeButton}
          onPress={closeSession}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.closeButtonInner}>
            <IconSymbol
              ios_icon_name="xmark"
              android_material_icon_name="close"
              size={20}
              color={colors.text}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Journal prompt modal ── */}
      <AppModal
        visible={showJournalPrompt}
        title={sessionComplete ? 'Session Complete!' : 'Save Your Progress?'}
        message={journalModalMessage}
        onDismiss={handleSkipJournal}
        actions={[
          { label: 'Save to Journal', onPress: handleSaveJournal, style: 'default' },
          { label: 'Skip', onPress: handleSkipJournal, style: 'cancel' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    marginBottom: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  displayName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  patternText: {
    fontSize: 13,
    color: colors.subtext,
    textAlign: 'center',
    opacity: 0.7,
    fontFamily: 'SpaceMono',
  },

  // ── Breathing circle ──
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 260,
  },
  breathGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  breathCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  phaseOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ── Progress ──
  progressContainer: {
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },

  // ── Start/Stop button ──
  buttonContainer: {
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(255,215,0,0.3)',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1020',
  },

  // ── X close button ──
  closeButtonContainer: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
