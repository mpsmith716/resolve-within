
import React, { useEffect, useState } from 'react';
import { authenticatedGet, authenticatedPost } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { AppModal } from '@/components/ErrorBoundary';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  userType: string;
  notificationTime: string;
  messageStreams: string[];
  badgeTier: string | null;
  showBadge: boolean;
}

interface JournalTrends {
  moods: Record<string, number>;
  streak: number;
  totalEntries: number;
}

interface ProgressInsights {
  breathingSessionsThisWeek: number;
  moodCheckIns: number;
  journalEntries: number;
  mostCommonMood: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  userType: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  badge: {
    fontSize: 32,
    marginTop: 8,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  progressCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  progressValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#C9A84C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  signOutText: {
    color: '#C9A84C',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
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
});

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trends, setTrends] = useState<JournalTrends | null>(null);
  const [progressInsights, setProgressInsights] = useState<ProgressInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    console.log('ProfileScreen: Component mounted, fetching profile data');
    fetchProfileData();
  }, [user]);

  async function fetchProfileData() {
    if (!user) return;
    try {
      console.log('ProfileScreen: Fetching profile data from API');
      const [profileData, trendsData, insightsData] = await Promise.all([
        authenticatedGet<UserProfile>('/api/user/profile'),
        authenticatedGet<JournalTrends>('/api/journal/trends'),
        authenticatedGet<ProgressInsights>('/api/progress/insights').catch((error) => {
          console.error('ProfileScreen: Error fetching progress insights:', error);
          return {
            breathingSessionsThisWeek: 0,
            moodCheckIns: 0,
            journalEntries: 0,
            mostCommonMood: 'N/A',
          };
        }),
      ]);

      console.log('ProfileScreen: Profile data received:', profileData);
      console.log('ProfileScreen: Trends data received:', trendsData);
      console.log('ProfileScreen: Progress insights received:', insightsData);

      setProfile(profileData);
      setTrends(trendsData);
      setProgressInsights(insightsData);
    } catch (error) {
      console.error('ProfileScreen: Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    console.log('ProfileScreen: User tapped Sign Out button');
    setShowSignOutModal(true);
  }

  async function confirmSignOut() {
    console.log('ProfileScreen: User confirmed sign out');
    setShowSignOutModal(false);
    try {
      console.log('ProfileScreen: Calling signOut function');
      await signOut();
      console.log('ProfileScreen: Sign out successful, navigating to auth');
      router.replace('/auth');
    } catch (error) {
      console.warn('ProfileScreen: Error during sign out, navigating to auth anyway:', error);
      router.replace('/auth');
    }
  }

  function getBadgeEmoji(tier: string | null): string {
    if (!tier) return '';
    const badges: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
    };
    return badges[tier.toLowerCase()] || '';
  }

  function getUserTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      veteran: 'Veteran',
      civilian: 'Civilian',
      supporter: 'Supporter',
      both: 'Veteran & Supporter',
    };
    return labels[type] || type;
  }

  if (loading) {
    return (
      <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </LinearGradient>
    );
  }

  const userName = profile?.name || 'User';
  const userEmail = profile?.email || '';
  const userTypeLabel = profile ? getUserTypeLabel(profile.userType) : '';
  const badgeEmoji = profile ? getBadgeEmoji(profile.badgeTier) : '';
  const showBadgeDisplay = profile?.showBadge && badgeEmoji;

  const streakValue = trends?.streak?.toString() || '0';
  const totalEntriesValue = trends?.totalEntries?.toString() || '0';

  const topMoodEntry = trends?.moods ? Object.entries(trends.moods).sort((a, b) => b[1] - a[1])[0] : null;
  const topMoodLabel = topMoodEntry ? topMoodEntry[0] : 'N/A';

  const breathingSessionsValue = progressInsights?.breathingSessionsThisWeek?.toString() || '0';
  const moodCheckInsValue = progressInsights?.moodCheckIns?.toString() || '0';
  const journalEntriesValue = progressInsights?.journalEntries?.toString() || '0';
  const mostCommonMoodValue = progressInsights?.mostCommonMood || 'N/A';

  return (
    <>
      <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.header}>
            <View style={styles.profileIcon}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account-circle"
                size={48}
                color={colors.accent}
              />
            </View>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.email}>{userEmail}</Text>
            <Text style={styles.userType}>{userTypeLabel}</Text>
            {showBadgeDisplay && <Text style={styles.badge}>{badgeEmoji}</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.progressGrid}>
              <View style={styles.progressCard}>
                <Text style={styles.progressValue}>{breathingSessionsValue}</Text>
                <Text style={styles.progressLabel}>Breathing Sessions</Text>
              </View>
              <View style={styles.progressCard}>
                <Text style={styles.progressValue}>{moodCheckInsValue}</Text>
                <Text style={styles.progressLabel}>Mood Check-Ins</Text>
              </View>
              <View style={styles.progressCard}>
                <Text style={styles.progressValue}>{journalEntriesValue}</Text>
                <Text style={styles.progressLabel}>Journal Entries</Text>
              </View>
              <View style={styles.progressCard}>
                <Text style={styles.progressValue}>{mostCommonMoodValue}</Text>
                <Text style={styles.progressLabel}>Most Common Mood</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journal Trends</Text>
            <View style={styles.card}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{streakValue}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalEntriesValue}</Text>
                  <Text style={styles.statLabel}>Total Entries</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{topMoodLabel}</Text>
                  <Text style={styles.statLabel}>Top Mood</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                console.log('ProfileScreen: User tapped Notifications');
                router.push('/notifications');
              }}
            >
              <IconSymbol
                ios_icon_name="bell.fill"
                android_material_icon_name="notifications"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.menuItemText}>Notifications</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                console.log('ProfileScreen: User tapped Message Preferences');
                router.push('/message-preferences');
              }}
            >
              <IconSymbol
                ios_icon_name="message.fill"
                android_material_icon_name="message"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.menuItemText}>Message Preferences</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                console.log('ProfileScreen: User tapped Delete My Data');
                router.push('/delete-data');
              }}
            >
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={24}
                color="#CC0000"
              />
              <Text style={styles.menuItemText}>Delete My Data</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal & Support</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                console.log('ProfileScreen: User tapped Support the Mission');
                router.push('/support-mission');
              }}
            >
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.menuItemText}>Support the Mission</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                console.log('ProfileScreen: User tapped Privacy Policy');
                router.push('/privacy-policy');
              }}
            >
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                console.log('ProfileScreen: User tapped Terms of Service');
                router.push('/terms-of-service');
              }}
            >
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.menuItemText}>Terms of Service</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  console.log('ProfileScreen: User cancelled sign out');
                  setShowSignOutModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmSignOut}
              >
                <Text style={styles.modalButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
