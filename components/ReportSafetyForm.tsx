
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { FontWeights } from '@/utils/fontHelpers';

interface ReportSafetyFormProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReportSafetyForm({ visible, onClose }: ReportSafetyFormProps) {
  const insets = useSafeAreaInsets();
  const [details, setDetails] = useState('');
  const [username, setUsername] = useState('');
  const [showError, setShowError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  // Reset form state when modal opens
  useEffect(() => {
    if (visible) {
      setDetails('');
      setUsername('');
      setShowError(false);
      setSubmitted(false);
      setSubmitError(false);
    }
  }, [visible]);

  // Auto-dismiss after success
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => {
      console.log('ReportSafetyForm: Auto-dismissing after successful submission');
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [submitted, onClose]);

  const handleClose = () => {
    console.log('ReportSafetyForm: User dismissed report safety form');
    onClose();
  };

  const handleSubmit = async () => {
    console.log('ReportSafetyForm: Submit button pressed');

    if (!details.trim()) {
      console.log('ReportSafetyForm: Validation failed — details field is empty');
      setShowError(true);
      return;
    }

    setShowError(false);
    setSubmitError(false);

    const now = new Date();
    const dateString = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const usernameLine = username.trim()
      ? `Username: ${username.trim()}\n`
      : '';

    const body = `Concern Details:\n${details.trim()}\n\n${usernameLine}Submitted: ${dateString}`;

    const mailtoUrl =
      `mailto:support@theresolvewithinproject.org` +
      `?subject=${encodeURIComponent('Safety Concern Report')}` +
      `&body=${encodeURIComponent(body)}`;

    try {
      console.log('ReportSafetyForm: Checking mailto support');
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (!supported) throw new Error('mailto not supported');
      console.log('ReportSafetyForm: Opening mailto URL for safety concern report');
      await Linking.openURL(mailtoUrl);
      setSubmitted(true);
    } catch (e) {
      console.log('ReportSafetyForm: Failed to open mailto URL:', e);
      setSubmitError(true);
    }
  };

  const handleDetailsChange = (text: string) => {
    setDetails(text);
    if (showError && text.trim()) {
      setShowError(false);
    }
  };

  const topPad = insets.top > 0 ? insets.top : 44;
  const bottomPad = insets.bottom > 0 ? insets.bottom : 24;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { paddingTop: topPad }]}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Report Safety Concern</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {submitted ? (
            /* ── Success state ── */
            <View style={styles.successContainer}>
              <View style={styles.successIconWrap}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={52}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.successTitle}>Report Submitted</Text>
              <Text style={styles.successText}>
                Thank you. Your report has been submitted and will be reviewed.
              </Text>
            </View>
          ) : (
            /* ── Form state ── */
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[styles.formContent, { paddingBottom: bottomPad + 16 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.description}>
                Use this form if a user seems to be in distress or may need immediate attention.
              </Text>

              {/* Details field */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Describe your concern
                  <Text style={styles.requiredMark}> *</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    showError && styles.textAreaError,
                  ]}
                  placeholder="Describe your concern..."
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={details}
                  onChangeText={handleDetailsChange}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="default"
                  blurOnSubmit={false}
                />
                {showError && (
                  <Text style={styles.errorText}>
                    Please share a few details before submitting.
                  </Text>
                )}
              </View>

              {/* Username field */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Username (optional)"
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
              </View>

              {submitError && (
                <View style={styles.submitErrorBanner}>
                  <Text style={styles.submitErrorTitle}>Something went wrong</Text>
                  <Text style={styles.submitErrorText}>
                    We couldn't submit your report right now. Please try again.
                  </Text>
                </View>
              )}

              {/* Submit button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Submit Safety Report</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: colors.text,
    letterSpacing: 0.3,
    paddingRight: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 24,
  },
  formContent: {
    paddingTop: 4,
  },
  description: {
    fontSize: 15,
    fontWeight: FontWeights.regular,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: FontWeights.semibold,
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  requiredMark: {
    color: colors.accent,
    fontWeight: FontWeights.bold,
  },
  textArea: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    fontWeight: FontWeights.regular,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 112,
    lineHeight: 22,
  },
  textAreaError: {
    borderColor: '#E05252',
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    fontWeight: FontWeights.regular,
    paddingHorizontal: 14,
    paddingVertical: 14,
    height: 52,
  },
  errorText: {
    fontSize: 13,
    fontWeight: FontWeights.medium,
    color: '#E05252',
    marginTop: 6,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.background,
    letterSpacing: 0.4,
  },
  // Submit error banner
  submitErrorBanner: {
    backgroundColor: '#FFF4ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F5C6A0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  submitErrorTitle: {
    fontSize: 13,
    fontWeight: FontWeights.semibold,
    color: '#B45309',
    marginBottom: 3,
    lineHeight: 18,
  },
  submitErrorText: {
    fontSize: 13,
    fontWeight: FontWeights.regular,
    color: '#92400E',
    lineHeight: 18,
  },
  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  successIconWrap: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 12,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: FontWeights.regular,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
});
