
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { FontWeights } from '@/utils/fontHelpers';
import ReportContentForm from '@/components/ReportContentForm';
import ReportSafetyForm from '@/components/ReportSafetyForm';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReportModal({ visible, onClose }: ReportModalProps) {
  const insets = useSafeAreaInsets();
  const [showContentForm, setShowContentForm] = useState(false);
  const [showSafetyForm, setShowSafetyForm] = useState(false);

  const handleSelectOption = (option: 'content' | 'safety') => {
    console.log('ReportModal: User selected report option:', option);
    if (option === 'content') {
      setShowContentForm(true);
    } else {
      setShowSafetyForm(true);
    }
  };

  const handleClose = () => {
    console.log('ReportModal: User dismissed report modal');
    onClose();
  };

  const bottomPad = insets.bottom > 0 ? insets.bottom : 24;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Full-screen container so backdrop + sheet stack correctly */}
      <View style={styles.modalContainer}>
        {/* Backdrop — tapping it closes the modal */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Bottom sheet */}
        <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextBlock}>
              <Text style={styles.title}>Report an Issue</Text>
              <Text style={styles.subtitle}>
                Help us keep this space safe and supportive.
              </Text>
              <Text style={styles.reviewNote}>
                Reports are reviewed to help keep this space safe.
              </Text>
            </View>
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

          {/* Option cards */}
          <View style={styles.optionsContainer}>
            {/* Card 1 — Report Content or User */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => handleSelectOption('content')}
              activeOpacity={0.75}
            >
              <View style={styles.optionCardInner}>
                <View style={styles.optionIconWrap}>
                  <IconSymbol
                    ios_icon_name="flag.fill"
                    android_material_icon_name="flag"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.optionTextBlock}>
                  <Text style={styles.optionTitle}>Report Content or User</Text>
                  <Text style={styles.optionSubtitle}>
                    Spam, harassment, inappropriate content, or misuse
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 2 — Report Safety Concern */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => handleSelectOption('safety')}
              activeOpacity={0.75}
            >
              <View style={styles.optionCardInner}>
                <View style={styles.optionIconWrap}>
                  <IconSymbol
                    ios_icon_name="heart.text.square.fill"
                    android_material_icon_name="health-and-safety"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.optionTextBlock}>
                  <Text style={styles.optionTitle}>Report Safety Concern</Text>
                  <Text style={styles.optionSubtitle}>
                    A user seems in distress or may need immediate attention
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <ReportContentForm
        visible={showContentForm}
        onClose={() => {
          setShowContentForm(false);
          onClose();
        }}
      />
      <ReportSafetyForm
        visible={showSafetyForm}
        onClose={() => {
          setShowSafetyForm(false);
          onClose();
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Full-screen wrapper — critical so backdrop fills screen and sheet sits at bottom
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: '#0f1628',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: FontWeights.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reviewNote: {
    fontSize: 13,
    fontWeight: FontWeights.regular,
    color: colors.textSecondary,
    opacity: 0.7,
    marginTop: 7,
    marginBottom: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: 8,
  },
  optionCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  optionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    fontWeight: FontWeights.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
