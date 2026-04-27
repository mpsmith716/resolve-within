
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface CrisisDisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
}

export default function CrisisDisclaimerModal({ visible, onAccept }: CrisisDisclaimerModalProps) {
  const insets = useSafeAreaInsets();

  const handleAccept = () => {
    console.log('[CrisisDisclaimer] User tapped "I Understand"');
    onAccept();
  };

  // Reserve space for: icon(48+16) + title(28*1.3+20) + button(16+16+18*1.3+24) + gradient padding(24*2) + safe areas
  // Leave the rest for the ScrollView so content never pushes the button off screen
  const fixedChrome = 48 + 16 + 52 + 20 + 90 + 48 + insets.top + insets.bottom;
  // On very small screens cap at 220, on larger screens allow up to 320
  const scrollMaxHeight = Math.min(320, Math.max(220, 600 - fixedChrome));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => {
        console.log('[CrisisDisclaimer] User attempted to close without accepting');
      }}
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#121939', '#0b1020']}
            style={styles.gradient}
          >
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={48}
                color={colors.accent}
              />
            </View>

            <Text style={styles.title}>Important Notice</Text>

            <ScrollView
              style={[styles.scrollContent, { maxHeight: scrollMaxHeight }]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={styles.message}>
                <Text style={styles.bold}>If you are in immediate danger or experiencing a mental health crisis:</Text>
              </Text>

              <View style={styles.crisisBox}>
                <Text style={styles.crisisText}>Call or Text 988</Text>
                <Text style={styles.crisisSubtext}>Suicide & Crisis Lifeline</Text>
                <Text style={styles.crisisSubtext}>Available 24/7</Text>
              </View>

              <Text style={styles.message}>
                Resolve Within provides support tools and resources, but is not a substitute for professional mental health care or emergency services.
              </Text>

              <Text style={styles.message}>
                This app is designed to complement professional treatment, not replace it. If you are experiencing severe symptoms, please contact a mental health professional or emergency services immediately.
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} activeOpacity={0.8}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.acceptButtonText}>I Understand</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  gradient: {
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: colors.subtext,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  crisisBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  crisisText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
    textAlign: 'center',
  },
  crisisSubtext: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1020',
  },
});
