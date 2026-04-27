
import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Wrapper component to access router hook
function ErrorFallbackUI({ onRetry, onGoHome }: { onRetry: () => void; onGoHome: () => void }) {
  return (
    <LinearGradient colors={['#0b1020', '#121939']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={64}
            color={colors.accent}
          />
        </View>

        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          Resolve Within hit a temporary issue. Please try again.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color="#0b1020"
              />
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={onGoHome}>
            <View style={styles.homeButtonInner}>
              <IconSymbol
                ios_icon_name="house.fill"
                android_material_icon_name="home"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.homeButtonText}>Return Home</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.supportText}>
          If this issue persists, please contact support.
        </Text>
      </View>
    </LinearGradient>
  );
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.warn('GlobalErrorBoundary caught error:', error);
    console.warn('Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    // Reset error state and try to re-render
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Navigate to home safely
    try {
      console.log('GlobalErrorBoundary: Navigating to home after error');
      router.replace('/');
    } catch (navError) {
      console.warn('GlobalErrorBoundary: Failed to navigate to home:', navError);
      // If navigation fails, just reset the error state and hope for the best
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackUI
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1020',
  },
  homeButton: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    overflow: 'hidden',
  },
  homeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  supportText: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.7,
  },
});

export default GlobalErrorBoundary;
