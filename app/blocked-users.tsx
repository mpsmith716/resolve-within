import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { FontWeights } from '@/utils/fontHelpers';
import { IconSymbol } from '@/components/IconSymbol';
import { AppModal } from '@/components/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedDelete, authenticatedGet } from '@/utils/api';
import { blockErrorMessage } from '@/utils/blocking';

interface BlockedMember {
  id: string;
  displayName: string;
  createdAt: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [blocked, setBlocked] = useState<BlockedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [unblockTarget, setUnblockTarget] = useState<BlockedMember | null>(null);
  const [unblocking, setUnblocking] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile' as any);
    }
  }, [router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => subscription.remove();
  }, [handleClose]);

  const fetchBlocked = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError('');
    try {
      const data = await authenticatedGet<BlockedMember[]>('/api/blocks');
      setBlocked(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.warn('[BlockedUsers] Failed to load blocked members:', error?.message || error);
      setLoadError(blockErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth?context=profile' as any);
      return;
    }
    fetchBlocked();
  }, [authLoading, user, fetchBlocked, router]);

  const confirmUnblock = async () => {
    if (!unblockTarget || unblocking) return;
    setUnblocking(true);
    try {
      await authenticatedDelete(`/api/blocks/${unblockTarget.id}`);
      setBlocked((prev) => prev.filter((b) => b.id !== unblockTarget.id));
      setUnblockTarget(null);
    } catch (error: any) {
      console.warn('[BlockedUsers] Unblock failed:', error?.message || error);
      setUnblockTarget(null);
      setActionError(blockErrorMessage(error));
    } finally {
      setUnblocking(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Blocked Users',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose} style={{ marginLeft: 8, padding: 8 }} accessibilityLabel="Close">
              <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <AppModal
        visible={!!unblockTarget}
        title="Unblock this member?"
        message="Their community posts will show up for you again, and yours for them."
        actions={[
          { label: unblocking ? 'Unblocking...' : 'Unblock', onPress: confirmUnblock, style: 'default', loading: unblocking },
          { label: 'Cancel', onPress: () => !unblocking && setUnblockTarget(null), style: 'cancel' },
        ]}
        onDismiss={() => !unblocking && setUnblockTarget(null)}
      />
      <AppModal
        visible={!!actionError}
        title="Couldn't unblock"
        message={actionError}
        actions={[{ label: 'OK', onPress: () => setActionError(''), style: 'default' }]}
        onDismiss={() => setActionError('')}
      />
      <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBlocked(true)} tintColor={colors.accent} />}
        >
          <Text style={styles.title}>Blocked Users</Text>
          <Text style={styles.subtitle}>
            You don't see posts from members you've blocked, and they don't see yours. They aren't notified.
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
          ) : loadError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Couldn't load blocked users</Text>
              <Text style={styles.emptySubtitle}>{loadError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchBlocked()}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : blocked.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🕊️</Text>
              <Text style={styles.emptyTitle}>No blocked users</Text>
              <Text style={styles.emptySubtitle}>
                To block someone, tap 🚫 Block on one of their community posts.
              </Text>
            </View>
          ) : (
            blocked.map((member) => (
              <View key={member.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowName}>{member.displayName}</Text>
                  <Text style={styles.rowDate}>{`Blocked ${formatDate(member.createdAt)}`}</Text>
                </View>
                <TouchableOpacity
                  style={styles.unblockButton}
                  onPress={() => setUnblockTarget(member)}
                  accessibilityRole="button"
                  accessibilityLabel={`Unblock ${member.displayName}`}
                >
                  <Text style={styles.unblockButtonText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.accent + '15',
  },
  rowText: { flex: 1, marginRight: 12 },
  rowName: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowDate: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  unblockButton: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  unblockButtonText: { fontSize: 14, fontWeight: '700', color: colors.accent },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryButtonText: { fontSize: 15, fontWeight: '700', color: colors.background },
});
