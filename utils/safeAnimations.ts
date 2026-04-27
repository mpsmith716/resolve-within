
import { Animated, Easing } from 'react-native';

/**
 * Safe animation utilities that prevent crashes from unsupported properties
 */

/**
 * Safely run Animated.timing and start it immediately.
 * On error, sets the value directly with no animation.
 */
export function safeAnimate(animatedValue: Animated.Value, toValue: number, duration: number): void {
  try {
    Animated.timing(animatedValue, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start();
  } catch (error) {
    console.warn('SafeAnimations: safeAnimate failed, setting value directly:', error);
    try {
      animatedValue.setValue(toValue);
    } catch (setError) {
      console.warn('SafeAnimations: setValue also failed:', setError);
    }
  }
}

/**
 * Safely run Animated.spring and start it immediately.
 * On error, sets the value directly with no animation.
 */
export function safeSpring(animatedValue: Animated.Value, toValue: number): void {
  try {
    Animated.spring(animatedValue, {
      toValue,
      useNativeDriver: true,
    }).start();
  } catch (error) {
    console.warn('SafeAnimations: safeSpring failed, setting value directly:', error);
    try {
      animatedValue.setValue(toValue);
    } catch (setError) {
      console.warn('SafeAnimations: setValue also failed:', setError);
    }
  }
}

export interface SafeAnimationConfig {
  duration?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
  delay?: number;
}

/**
 * Safely animate opacity
 */
export function safeAnimateOpacity(
  animatedValue: Animated.Value,
  toValue: number,
  config: SafeAnimationConfig = {}
): Animated.CompositeAnimation {
  const {
    duration = 300,
    easing = Easing.inOut(Easing.ease),
    useNativeDriver = true,
    delay = 0,
  } = config;

  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver,
    delay,
  });
}

/**
 * Safely animate scale
 */
export function safeAnimateScale(
  animatedValue: Animated.Value,
  toValue: number,
  config: SafeAnimationConfig = {}
): Animated.CompositeAnimation {
  const {
    duration = 300,
    easing = Easing.inOut(Easing.ease),
    useNativeDriver = true,
    delay = 0,
  } = config;

  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver,
    delay,
  });
}

/**
 * Safely animate translateY
 */
export function safeAnimateTranslateY(
  animatedValue: Animated.Value,
  toValue: number,
  config: SafeAnimationConfig = {}
): Animated.CompositeAnimation {
  const {
    duration = 300,
    easing = Easing.inOut(Easing.ease),
    useNativeDriver = true,
    delay = 0,
  } = config;

  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver,
    delay,
  });
}

/**
 * Safely animate translateX
 */
export function safeAnimateTranslateX(
  animatedValue: Animated.Value,
  toValue: number,
  config: SafeAnimationConfig = {}
): Animated.CompositeAnimation {
  const {
    duration = 300,
    easing = Easing.inOut(Easing.ease),
    useNativeDriver = true,
    delay = 0,
  } = config;

  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver,
    delay,
  });
}

/**
 * Create a safe looping animation
 */
export function safeLoopAnimation(
  animation: Animated.CompositeAnimation,
  iterations: number = -1
): Animated.CompositeAnimation {
  return Animated.loop(animation, { iterations });
}

/**
 * Create a safe sequence of animations
 */
export function safeSequence(
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation {
  return Animated.sequence(animations);
}

/**
 * Create a safe parallel animation
 */
export function safeParallel(
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation {
  return Animated.parallel(animations);
}

/**
 * Safely start an animation with error handling
 */
export function safeStartAnimation(
  animation: Animated.CompositeAnimation,
  callback?: (result: { finished: boolean }) => void
): void {
  try {
    animation.start((result) => {
      if (callback) {
        callback(result);
      }
    });
  } catch (error) {
    console.warn('SafeAnimations: Animation failed to start:', error);
    if (callback) {
      callback({ finished: false });
    }
  }
}

/**
 * Safely stop an animation
 */
export function safeStopAnimation(animation: Animated.CompositeAnimation): void {
  try {
    animation.stop();
  } catch (error) {
    console.warn('SafeAnimations: Animation failed to stop:', error);
  }
}

/**
 * Safely reset an animated value
 */
export function safeResetValue(animatedValue: Animated.Value, toValue: number): void {
  try {
    animatedValue.setValue(toValue);
  } catch (error) {
    console.warn('SafeAnimations: Failed to reset animated value:', error);
  }
}
