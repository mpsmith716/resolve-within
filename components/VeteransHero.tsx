
import React, { useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { FontWeights } from '@/utils/fontHelpers';

const { width } = Dimensions.get('window');

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function VeteransHero() {
  // Animation value for shimmer only
  const shimmerOpacity = useSharedValue(0);

  const startShimmerAnimation = useCallback(() => {
    shimmerOpacity.value = withSequence(
      withTiming(0.35, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
    );
  }, [shimmerOpacity]);

  useEffect(() => {
    console.log('VeteransHero: Initializing shimmer animation');

    // Soft metallic shimmer every 12 seconds
    const shimmerInterval = setInterval(() => {
      startShimmerAnimation();
    }, 12000);

    return () => {
      console.log('VeteransHero: Cleaning up shimmer animation');
      clearInterval(shimmerInterval);
    };
  }, [startShimmerAnimation]);

  // Animated shimmer overlay
  const animatedShimmerStyle = useAnimatedStyle(() => {
    return {
      opacity: shimmerOpacity.value,
    };
  });

  const headerText = 'STILL STANDING';
  const subtextText = 'You are not fighting alone.';

  return (
    <View style={styles.container}>
      {/* Background with subtle vignette - Dark matte charcoal */}
      <LinearGradient
        colors={['#0b1020', '#0b1020', '#060810']}
        locations={[0, 0.7, 1]}
        style={styles.background}
      />

      {/* Dog Tags Image Container - No movement animations */}
      <View style={styles.dogTagsContainer}>
        <Image
          source={resolveImageSource(require('@/assets/images/2a26ea07-43d6-4e4b-9dde-646e5e9e5838.png'))}
          style={styles.dogTagsImage}
          resizeMode="contain"
        />

        {/* Metallic shimmer overlay - Light effect only */}
        <Animated.View style={[styles.shimmerOverlay, animatedShimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.headerText}>{headerText}</Text>
        <Text style={styles.subtextText}>{subtextText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 600,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dogTagsContainer: {
    width: width * 0.75,
    height: width * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    position: 'relative',
  },
  dogTagsImage: {
    width: '100%',
    height: '100%',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  shimmerGradient: {
    flex: 1,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 38,
    fontWeight: FontWeights.extrabold,
    color: '#FFD700',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtextText: {
    fontSize: 18,
    fontWeight: FontWeights.regular,
    color: '#CFD8FF',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
});
