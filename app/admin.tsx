import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { authenticatedGet } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

interface AdminReport {
  id: string;
  postId: string;
  reporterUserId: string;
  reason: string;
  notes: string | null;
  status: string;
  createdAt: string;
  postContent: string;
  postAuthorName: string;
  postIsAnonymous: boolean;
}

interface AdminReportsResponse {
  reports: AdminReport[];
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setErrorMessage(null);

      const response =
        await authenticatedGet<AdminReportsResponse>('/api/admin/reports');

      setReports(response.reports);
    } catch (error: any) {
      console.error(
        '[AdminDashboard] Failed to fetch reports:',
        error?.message || error
      );

      setErrorMessage(
        error?.message || 'Unable to load reports right now.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const formatReason = (reason: string) => {
    return reason
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString();
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.card]}
      style={styles.container}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
          },
        ]}
      >
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
          <Text style={styles.headerSubtitle}>
            Community moderation reports
          </Text>
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
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + 32,
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Reports</Text>
            <Text style={styles.summaryValue}>{reports.length}</Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Unable to load reports</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchReports}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyCard}>
              <IconSymbol
                ios_icon_name="checkmark.shield.fill"
                android_material_icon_name="verified-user"
                size={48}
                color={colors.accent}
              />

              <Text style={styles.emptyTitle}>No reports</Text>
              <Text style={styles.emptyText}>
                There are no community reports waiting for review.
              </Text>
            </View>
          ) : (
            reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reasonBadge}>
                    <Text style={styles.reasonText}>
                      {formatReason(report.reason)}
                    </Text>
                  </View>

                  <Text style={styles.statusText}>
                    {formatReason(report.status)}
                  </Text>
                </View>

                <Text style={styles.postLabel}>Reported Post</Text>

                <Text style={styles.postContent}>
                  {report.postContent}
                </Text>

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
                  <Text style={styles.detailValue}>
                    {formatDate(report.createdAt)}
                  </Text>
                </View>

                {report.notes ? (
                  <View style={styles.notesBlock}>
                    <Text style={styles.notesLabel}>Report Notes</Text>
                    <Text style={styles.notesText}>{report.notes}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

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

  headerTextBlock: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },

  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
  },

  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },

  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 4,
  },

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

  reasonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E05252',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },

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

  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  detailValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    textAlign: 'right',
  },

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

  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },

  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },

  errorCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E05252',
    marginBottom: 8,
  },

  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },

  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
});