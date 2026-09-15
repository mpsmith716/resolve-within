import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
  BackHandler,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as SecureStore from 'expo-secure-store';
import { authenticatedDelete } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { clearFavorites } from '@/utils/favorites';
import { safeDeleteItem } from '@/utils/safeStorage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  warningCard: {
    backgroundColor: '#CC0000',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  dataItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  deleteButton: {
    backgroundColor: '#CC0000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteButtonDisabled: {
    backgroundColor: colors.card,
    opacity: 0.5,
  },
  deleteButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
  },
  modalButtonConfirm: {
    backgroundColor: '#CC0000',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  successIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
});

async function clearLocalUserData(): Promise<void> {
  const secureKeys = [
    '@resolve_within_notifications',
    'crisis_disclaimer_shown',
    'message_preferences',
    'app_preferences',
    'user_settings',
    'crisisDisclaimerAccepted',
    'onboarding_completed',
    'resolveWithinFavorites',
  ];

  for (const key of secureKeys) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Key may not exist or platform may not support SecureStore
    }
    try {
      await safeDeleteItem(key);
    } catch {
      // Continue
    }
  }

  const asyncKeys = [
    '@resolve_within_notifications',
    '@resolve_within_message_preferences',
  ];
  for (const key of asyncKeys) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Continue
    }
  }

  try {
    await clearFavorites();
  } catch {
    // Continue — local best-effort
  }
}

export default function DeleteDataScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(home)/');
    }
  }, [router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => subscription.remove();
  }, [handleClose]);

  const dataToDelete = [
    { icon: 'edit', iconMaterial: 'edit' as const, label: 'Journal Entries & Mood History' },
    { icon: 'bubble.left', iconMaterial: 'forum' as const, label: 'Community Posts & Reactions' },
    { icon: 'heart', iconMaterial: 'favorite' as const, label: 'Favorites & Breathing Sessions' },
    { icon: 'gear', iconMaterial: 'settings' as const, label: 'App Preferences' },
    { icon: 'bell', iconMaterial: 'notifications' as const, label: 'Notification Settings' },
    { icon: 'message', iconMaterial: 'message' as const, label: 'Message Preferences' },
  ];

  async function handleDeleteData() {
    setShowConfirmModal(false);
    setIsDeleting(true);
    setErrorMessage('');

    try {
      // Server-authoritative deletion first — do not claim success if this fails
      await authenticatedDelete('/api/user/data');

      // Clear local/session-adjacent preference storage after server success
      await clearLocalUserData();

      setIsDeleting(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('DeleteDataScreen: Deletion failed (no false success)');
      setIsDeleting(false);
      setErrorMessage(
        'We could not delete your data right now. Nothing was marked deleted. Please check your connection and try again.'
      );
      setShowErrorModal(true);
    }
  }

  async function handleSuccessClose() {
    setShowSuccessModal(false);
    try {
      await signOut();
    } catch {
      router.replace('/auth');
    }
  }

  const titleText = 'Delete My Data';
  const descriptionText =
    'This permanently deletes your journal, mood history, community content, favorites, breathing history, and preferences from Resolve Within servers and this device. Your login account remains so you can sign in again later. This cannot be undone.';
  const warningText =
    'Warning: Journal entries, community posts, reactions, favorites, breathing history, and preferences will be permanently removed. Moderation audit records may retain anonymized report metadata. You will be signed out after a successful deletion.';
  const confirmTitle = 'Confirm Deletion';
  const confirmMessage =
    'Are you sure you want to delete all your personal data? This action cannot be undone.';
  const successTitle = 'Data Deleted';
  const successMessage =
    'Your personal data has been deleted. You will be signed out now.';
  const cancelText = 'Cancel';
  const deleteText = 'Delete All Data';
  const confirmDeleteText = 'Yes, Delete Everything';
  const okText = 'OK';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Delete My Data',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose} style={{ marginLeft: 8, padding: 8 }}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.description}>{descriptionText}</Text>
          </View>

          <View style={styles.warningCard}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={24}
              color={colors.text}
              style={styles.warningIcon}
            />
            <Text style={styles.warningText}>{warningText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data to be deleted:</Text>
            {dataToDelete.map((item, index) => (
              <View key={index} style={styles.dataItem}>
                <IconSymbol
                  ios_icon_name={item.icon}
                  android_material_icon_name={item.iconMaterial}
                  size={24}
                  color={colors.accent}
                />
                <Text style={styles.dataItemText}>{item.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={() => setShowConfirmModal(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.deleteButtonText}>{deleteText}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{confirmTitle}</Text>
            <Text style={styles.modalMessage}>{confirmMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleDeleteData}
              >
                <Text style={styles.modalButtonText}>{confirmDeleteText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={64}
              color={colors.accent}
              style={styles.successIcon}
            />
            <Text style={styles.modalTitle}>{successTitle}</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={handleSuccessClose}
            >
              <Text style={styles.modalButtonText}>{okText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deletion Failed</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>{okText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
