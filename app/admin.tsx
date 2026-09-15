import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authenticatedGet, authenticatedPost } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

interface AdminReport {
  id: string;
  postId: string;
  reporterUserId: string;
  reason: string;
  notes: string | null;
  status: string;
  createdAt: string;
  reviewedAt?: string | null;
  postContent: string;
  postAuthorName: string;
  postIsAnonymous: boolean;
  postIsHidden?: boolean;
}

interface AdminReportsResponse {
  reports: AdminReport[];
}

type FilterTab = 'pending' | 'resolved' | 'all';

function confirmAction(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(
      typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false
    );
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirm', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, loading: authLoading, refreshProfile } = useAuth();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [guardChecked, setGuardChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = profile ?? (await refreshProfile());
      if (cancelled) return;
      if (!current?.isAdmin) {
        router.replace('/(tabs)/profile');
        return;
      }
      setGuardChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, refreshProfile, router]);

  const fetchReports = useCallback(async () => {
    try {
      setErrorMessage(null);
      const response = await authenticatedGet<AdminReportsResponse>('/api/admin/reports');
      setReports(response.reports || []);
    } catch (error: any) {
      console.error('[AdminDashboard] Failed to fetch reports:', error?.message || error);
      setErrorMessage(error?.message || 'Unable to load reports right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (guardChecked) {
      fetchReports();
    }
  }, [guardChecked, fetchReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const formatReason = (reason: string) =>
    reason.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const filteredReports = useMemo(() => {
    if (filter === 'pending') {
      return reports.filter((r) => r.status === 'pending');
    }
    if (filter === 'resolved') {
      return reports.filter((r) => r.status !== 'pending');
    }
    return reports;
  }, [reports, filter]);

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  const handleHide = async (report: AdminReport) => {
    const ok = await confirmAction(
      'Hide post?',
      'This will hide the post from community display, mark the report as actioned, and log the action.'
    );
    if (!ok) return;
    setActingId(report.id);
    try {
      await authenticatedPost(`/api/admin/reports/${report.id}/hide`, {});
      await fetchReports();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to hide post.');
    } finally {
      setActingId(null);
    }
  };

  const handleDismiss = async (report: AdminReport) => {
    const ok = await confirmAction(
      'Dismiss report?',
      'This will leave the post visible, mark the report as dismissed, and log the action.'
    );
    if (!ok) return;
    setActingId(report.id);
    try {
      await authenticatedPost(`/api/admin/reports/${report.id}/dismiss`, {});
      await fetchReports();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to dismiss report.');
    } finally {
      setActingId(null);
    }
  };

  if (authLoading || !guardChecked) {
    return (
      <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Checking access...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Community moderation reports</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending Reports</Text>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
          </View>

          <View style={styles.filterRow}>
            {([
              ['pending', 'Pending'],
              ['resolved', 'Resolved'],
              ['all', 'All'],
            ] as const).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.filterChip, filter === key && styles.filterChipActive]}
                onPress={() => setFilter(key)}
              >
                <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Unable to load reports</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredReports.length === 0 ? (
            <View style={styles.emptyCard}>
              <IconSymbol
                ios_icon_name="checkmark.shield.fill"
                android_material_icon_name="verified-user"
                size={48}
                color={colors.accent}
              />
              <Text style={styles.emptyTitle}>No reports</Text>
              <Text style={styles.emptyText}>
                {filter === 'pending'
                  ? 'There are no community reports waiting for review.'
                  : 'No reports in this view.'}
              </Text>
            </View>
          ) : (
            filteredReports.map((report) => {
              const isPending = report.status === 'pending';
              const busy = actingId === report.id;
              return (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <View style={styles.reasonBadge}>
                      <Text style={styles.reasonText}>{formatReason(report.reason)}</Text>
                    </View>
                    <Text style={styles.statusText}>{formatReason(report.status)}</Text>
                  </View>

                  <Text style={styles.postLabel}>Reported Post</Text>
                  <Text style={styles.postContent}>{report.postContent}</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Posted by</Text>
                    <Text style={styles.detailValue}>
                      {report.postIsAnonymous
                        ? 'Anonymous Community Member'
                        : report.postAuthorName}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reported</Text>
                    <Text style={styles.detailValue}>{formatDate(report.createdAt)}</Text>
                  </View>

                  {report.notes ? (
                    <View style={styles.notesBlock}>
                      <Text style={styles.notesLabel}>Report Notes</Text>
                      <Text style={styles.notesText}>{report.notes}</Text>
                    </View>
                  ) : null}

                  {isPending ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.hideButton]}
                        disabled={busy}
                        onPress={() => handleHide(report)}
                      >
                        <Text style={styles.actionButtonText}>
                          {busy ? 'Working…' : 'Hide Post'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.dismissButton]}
                        disabled={busy}
                        onPress={() => handleDismiss(report)}
                      >
                        <Text style={styles.actionButtonText}>
                          {busy ? 'Working…' : 'Dismiss Report'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextBlock: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: { marginTop: 12, fontSize: 15, color: colors.textSecondary },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 32, fontWeight: '700', color: colors.accent, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderColor: colors.accent,
  },
  filterChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: colors.accent },
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  reasonBadge: {
    backgroundColor: 'rgba(204, 0, 0, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reasonText: { fontSize: 12, fontWeight: '700', color: '#E05252' },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  postLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
  },
  detailLabel: { fontSize: 13, color: colors.textSecondary },
  detailValue: { flex: 1, fontSize: 13, color: colors.text, textAlign: 'right' },
  notesBlock: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  notesText: { fontSize: 14, lineHeight: 20, color: colors.text },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  hideButton: { backgroundColor: '#CC0000' },
  dismissButton: { backgroundColor: colors.accent },
  actionButtonText: { fontSize: 14, fontWeight: '700', color: colors.background },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 14 },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  errorCard: { backgroundColor: colors.card, borderRadius: 14, padding: 20 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#E05252', marginBottom: 8 },
  errorText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  retryButtonText: { fontSize: 15, fontWeight: '700', color: colors.background },
});
