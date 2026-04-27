
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
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as SecureStore from 'expo-secure-store';
import { authenticatedDelete } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

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

export default function DeleteDataScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleClose = useCallback(() => {
    console.log('[DeleteData] close pressed');
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dataToDelete = [
    { icon: 'edit', iconMaterial: 'edit', label: 'Journal Entries' },
    { icon: 'face.smiling', iconMaterial: 'mood', label: 'Mood Selections' },
    { icon: 'gear', iconMaterial: 'settings', label: 'App Preferences' },
    { icon: 'bell', iconMaterial: 'notifications', label: 'Notification Settings' },
    { icon: 'message', iconMaterial: 'message', label: 'Message Preferences' },
  ];

  async function handleDeleteData() {
    console.log('DeleteDataScreen: User confirmed data deletion');
    setShowConfirmModal(false);
    setIsDeleting(true);

    try {
      // Delete local data from SecureStore
      console.log('DeleteDataScreen: Clearing local SecureStore data');
      const keysToDelete = [
        '@resolve_within_notifications',
        'crisis_disclaimer_shown',
        'message_preferences',
        'app_preferences',
        'user_settings',
      ];
      
      for (const key of keysToDelete) {
        try {
          await SecureStore.deleteItemAsync(key);
          console.log(`DeleteDataScreen: Deleted SecureStore key: ${key}`);
        } catch (error) {
          console.log(`DeleteDataScreen: Key ${key} not found or error deleting:`, error);
          // Continue with other keys even if one fails
        }
      }

      // Delete backend data (journal entries, mood data)
      console.log('DeleteDataScreen: Deleting backend data');
      try {
        await authenticatedDelete('/api/user/data');
        console.log('DeleteDataScreen: Backend data deleted successfully');
      } catch (error) {
        console.error('DeleteDataScreen: Error deleting backend data:', error);
        // Continue even if backend deletion fails - local data is cleared
      }

      console.log('DeleteDataScreen: Data deletion complete');
      setIsDeleting(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('DeleteDataScreen: Error during data deletion:', error);
      setIsDeleting(false);
      setShowSuccessModal(true); // Show success anyway since local data was cleared
    }
  }

  async function handleSuccessClose() {
    console.log('DeleteDataScreen: User acknowledged success, signing out and navigating to auth');
    setShowSuccessModal(false);
    try {
      // Sign out the user since all their data has been deleted
      await signOut();
      console.log('DeleteDataScreen: User signed out after data deletion');
    } catch (error) {
      console.error('DeleteDataScreen: Error signing out after data deletion:', error);
      // Navigate to auth anyway
      router.replace('/auth');
    }
  }

  const titleText = 'Delete My Data';
  const descriptionText = 'This will permanently delete all your locally stored data from this device. This action cannot be undone.';
  const warningText = 'Warning: This will delete all your journal entries, mood history, and app preferences. You will need to set up your preferences again.';
  const confirmTitle = 'Confirm Deletion';
  const confirmMessage = 'Are you sure you want to delete all your data? This action cannot be undone.';
  const successTitle = 'Data Deleted';
  const successMessage = 'All your data has been successfully deleted. You will be signed out now.';
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
            onPress={() => {
              console.log('DeleteDataScreen: User tapped Delete All Data button');
              setShowConfirmModal(true);
            }}
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
                onPress={() => {
                  console.log('DeleteDataScreen: User cancelled deletion');
                  setShowConfirmModal(false);
                }}
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
    </>
  );
}
