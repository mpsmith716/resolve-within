import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authenticatedDelete, authenticatedGet, authenticatedPost } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppModal } from '@/components/ErrorBoundary';
import { colors } from '@/styles/commonStyles';

type JournalTab = 'journal' | 'community';
type CommunityType = 'healing_together' | 'veteran';

interface JournalEntry {
  id: string;
  mood: string;
  content?: string;
  createdAt: string;
}

interface CommunityPost {
  id: string;
  authorName: string;
  isAnonymous: boolean;
  content: string;
  isPinned: boolean;
  likeCount: number;
  encourageCount: number;
  createdAt: string;
  userInteraction?: {
    liked: boolean;
    encouraged: boolean;
  };
}

const MOOD_EMOJI: Record<string, string> = {
  cloudy: '☁️',
  onEdge: '⚡',
  numb: '🌀',
  heavy: '💔',
  light: '✨',
};

export default function JournalScreen() {
  const { user, loading: authLoading } = useAuth();

  const requireSignedIn = () => {
    if (!user) {
      Alert.alert(
        'Sign in required',
        'You need to be signed in to save journal entries or post in the community.'
      );
      return false;
    }
    return true;
  };

  const [activeTab, setActiveTab] = useState<JournalTab>('journal');

  const [entry, setEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState('cloudy');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalRefreshing, setJournalRefreshing] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; entryId: string }>({
    visible: false,
    entryId: '',
  });
  const [deletingEntry, setDeletingEntry] = useState(false);

  const [post, setPost] = useState('');
  const [communityType, setCommunityType] = useState<CommunityType>('healing_together');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsRefreshing, setPostsRefreshing] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [interactingPost, setInteractingPost] = useState<string | null>(null);

  const fetchJournalEntries = useCallback(
    async (isRefresh = false) => {
      if (!user) return;

      if (isRefresh) setJournalRefreshing(true);
      else setJournalLoading(true);

      try {
        const entries = await authenticatedGet<JournalEntry[]>('/api/journal?limit=50');
        setJournalEntries(entries);
      } catch (error: any) {
        console.error('[JOURNAL] Failed to fetch journal entries:', error?.message || error);
      } finally {
        setJournalLoading(false);
        setJournalRefreshing(false);
      }
    },
    [user]
  );

  const fetchCommunityPosts = useCallback(
    async (isRefresh = false) => {
      if (!user) return;

      if (isRefresh) setPostsRefreshing(true);
      else setPostsLoading(true);

      try {
        const data = await authenticatedGet<CommunityPost[]>(
          `/api/community/${communityType}?limit=20`
        );
        setPosts(data);
      } catch (error: any) {
        console.error('[COMMUNITY] Failed to fetch posts:', error?.message || error);
        setPosts([]);
      } finally {
        setPostsLoading(false);
        setPostsRefreshing(false);
      }
    },
    [communityType, user]
  );

  useEffect(() => {
    if (!authLoading && user) {
      fetchJournalEntries();
    }
  }, [authLoading, user, fetchJournalEntries]);

  useEffect(() => {
    if (!authLoading && user && activeTab === 'community') {
      fetchCommunityPosts();
    }
  }, [authLoading, user, activeTab, communityType, fetchCommunityPosts]);

  const handleSaveEntry = async () => {
    if (!requireSignedIn()) return;

    setSavingEntry(true);
    try {
      console.log('[JOURNAL] Saving entry...', {
        mood: selectedMood,
        contentLength: entry.trim().length,
      });

      const newEntry = await authenticatedPost<JournalEntry>('/api/journal', {
        mood: selectedMood,
        content: entry.trim() || undefined,
      });

      console.log('[JOURNAL] Save success:', newEntry);

      setJournalEntries((prev) => [newEntry, ...prev]);
      setEntry('');
      setSelectedMood('cloudy');

      Alert.alert('Saved', 'Your journal entry was saved.');
    } catch (error: any) {
      console.error('[JOURNAL] Failed to save entry:', error?.message || error);
      Alert.alert(
        'Could not save entry',
        error?.message || 'The journal API request failed.'
      );
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteEntry = async () => {
    setDeletingEntry(true);
    try {
      await authenticatedDelete(`/api/journal/${deleteModal.entryId}`);
      setJournalEntries((prev) => prev.filter((item) => item.id !== deleteModal.entryId));
      setDeleteModal({ visible: false, entryId: '' });
    } catch (error: any) {
      console.error('[JOURNAL] Failed to delete entry:', error?.message || error);
      setDeleteModal({ visible: false, entryId: '' });
    } finally {
      setDeletingEntry(false);
    }
  };

  const handleCreatePost = async () => {
    if (!requireSignedIn()) return;

    if (!post.trim()) {
      Alert.alert('Add some text', 'Write something before posting.');
      return;
    }

    setSavingPost(true);
    try {
      console.log('[COMMUNITY] Creating post...', {
        communityType,
        isAnonymous,
        contentLength: post.trim().length,
      });

      const newPost = await authenticatedPost<CommunityPost>(
        `/api/community/${communityType}`,
        {
          content: post.trim(),
          isAnonymous,
        }
      );

      console.log('[COMMUNITY] Post success:', newPost);

      setPosts((prev) => [newPost, ...prev]);
      setPost('');
      setIsAnonymous(true);

      Alert.alert('Posted', 'Your community post was published.');
    } catch (error: any) {
      console.error('[COMMUNITY] Failed to create post:', error?.message || error);
      Alert.alert(
        'Could not post',
        error?.message || 'The community API request failed.'
      );
    } finally {
      setSavingPost(false);
    }
  };

  const handleInteract = async (postId: string, type: 'like' | 'encourage') => {
    setInteractingPost(postId);
    try {
      const updated = await authenticatedPost<{
        id: string;
        likeCount: number;
        encourageCount: number;
      }>(`/api/community/posts/${postId}/interact`, { type });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likeCount: updated.likeCount,
                encourageCount: updated.encourageCount,
                userInteraction: {
                  liked:
                    type === 'like'
                      ? !p.userInteraction?.liked
                      : (p.userInteraction?.liked ?? false),
                  encouraged:
                    type === 'encourage'
                      ? !p.userInteraction?.encouraged
                      : (p.userInteraction?.encouraged ?? false),
                },
              }
            : p
        )
      );
    } catch (error: any) {
      console.error('[COMMUNITY] Failed to interact with post:', error?.message || error);
    } finally {
      setInteractingPost(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <AppModal
        visible={deleteModal.visible}
        title="Delete Entry"
        message="Are you sure you want to delete this journal entry?"
        actions={[
          {
            label: deletingEntry ? 'Deleting...' : 'Delete',
            onPress: handleDeleteEntry,
            style: 'destructive',
            loading: deletingEntry,
          },
          {
            label: 'Cancel',
            onPress: () => setDeleteModal({ visible: false, entryId: '' }),
            style: 'cancel',
          },
        ]}
        onDismiss={() => setDeleteModal({ visible: false, entryId: '' })}
      />

      <View style={styles.topSwitch}>
        <TouchableOpacity
          style={[styles.switchButton, activeTab === 'journal' && styles.switchButtonActive]}
          onPress={() => setActiveTab('journal')}
        >
          <Text style={[styles.switchText, activeTab === 'journal' && styles.switchTextActive]}>
            📓 Journal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchButton, activeTab === 'community' && styles.switchButtonActive]}
          onPress={() => setActiveTab('community')}
        >
          <Text style={[styles.switchText, activeTab === 'community' && styles.switchTextActive]}>
            🤝 Community
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'journal' ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={journalRefreshing}
              onRefresh={() => fetchJournalEntries(true)}
              tintColor={colors.accent}
            />
          }
        >
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.subtitle}>
            Write what is on your mind. This space is for you.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>New entry</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodPicker}>
              {[
                { value: 'cloudy', emoji: '☁️', label: 'Cloudy' },
                { value: 'onEdge', emoji: '⚡', label: 'On Edge' },
                { value: 'numb', emoji: '🌀', label: 'Numb' },
                { value: 'heavy', emoji: '💔', label: 'Heavy' },
                { value: 'light', emoji: '✨', label: 'Light' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[
                    styles.moodChip,
                    selectedMood === m.value && styles.moodChipSelected,
                  ]}
                  onPress={() => setSelectedMood(m.value)}
                >
                  <Text style={styles.moodChipEmoji}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.moodChipLabel,
                      selectedMood === m.value && styles.moodChipLabelSelected,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              multiline
              editable={true}
              placeholder="Write your thoughts..."
              placeholderTextColor="#94A3B8"
              value={entry}
              onChangeText={setEntry}
            />

            <TouchableOpacity
              style={[styles.primaryButton, savingEntry && { opacity: 0.7 }]}
              onPress={handleSaveEntry}
              disabled={savingEntry}
            >
              {savingEntry ? (
                <ActivityIndicator color="#0B1220" />
              ) : (
                <Text style={styles.primaryButtonText}>Save Entry</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent entries</Text>

            {journalLoading ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
            ) : journalEntries.length === 0 ? (
              <Text style={styles.emptyText}>Your saved journal entries will show here.</Text>
            ) : (
              journalEntries.map((item) => (
                <View key={item.id} style={styles.feedItem}>
                  <View style={styles.feedHeader}>
                    <Text style={styles.feedAccent}>
                      {MOOD_EMOJI[item.mood] || '📝'} {item.mood}
                    </Text>
                    <View style={styles.feedHeaderRight}>
                      <Text style={styles.feedDate}>{formatDate(item.createdAt)}</Text>
                      <TouchableOpacity
                        onPress={() => setDeleteModal({ visible: true, entryId: item.id })}
                      >
                        <Text style={styles.deleteText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.feedBody}>
                    {item.content?.trim() || 'No text added for this entry.'}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={postsRefreshing}
              onRefresh={() => fetchCommunityPosts(true)}
              tintColor={colors.accent}
            />
          }
        >
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>
            Share encouragement, read posts, and connect with others.
          </Text>

          <View style={styles.communityTypeRow}>
            <TouchableOpacity
              style={[
                styles.communityTypeBtn,
                communityType === 'healing_together' && styles.communityTypeBtnActive,
              ]}
              onPress={() => setCommunityType('healing_together')}
            >
              <Text
                style={[
                  styles.communityTypeBtnText,
                  communityType === 'healing_together' && styles.communityTypeBtnTextActive,
                ]}
              >
                🤝 Healing Together
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.communityTypeBtn,
                communityType === 'veteran' && styles.communityTypeBtnActive,
              ]}
              onPress={() => setCommunityType('veteran')}
            >
              <Text
                style={[
                  styles.communityTypeBtnText,
                  communityType === 'veteran' && styles.communityTypeBtnTextActive,
                ]}
              >
                🎖 Veteran Corner
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Share something</Text>

            <TextInput
              style={styles.input}
              multiline
              editable={true}
              placeholder="Post a thought, encouragement, or experience..."
              placeholderTextColor="#94A3B8"
              value={post}
              onChangeText={setPost}
            />

            <TouchableOpacity
              style={styles.anonymousToggle}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <Text style={styles.anonymousToggleText}>
                {isAnonymous ? '🎭 Posting as Anonymous' : `👤 Posting as ${user?.name || 'You'}`}
              </Text>
              <Text style={styles.anonymousToggleHint}>Tap to toggle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, (savingPost || !post.trim()) && { opacity: 0.7 }]}
              onPress={handleCreatePost}
              disabled={savingPost || !post.trim()}
            >
              {savingPost ? (
                <ActivityIndicator color="#0B1220" />
              ) : (
                <Text style={styles.primaryButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Community feed</Text>

            {postsLoading ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
            ) : posts.length === 0 ? (
              <Text style={styles.emptyText}>Community posts will show here.</Text>
            ) : (
              posts.map((item) => (
                <View key={item.id} style={styles.feedItem}>
                  <View style={styles.feedHeader}>
                    <Text style={styles.feedAccent}>
                      {item.isAnonymous ? '🎭 Anonymous' : `👤 ${item.authorName}`}
                    </Text>
                    <Text style={styles.feedDate}>{formatDate(item.createdAt)}</Text>
                  </View>

                  <Text style={styles.feedBody}>{item.content}</Text>

                  <View style={styles.postActions}>
                    <TouchableOpacity
                      style={[
                        styles.postActionBtn,
                        item.userInteraction?.liked && styles.postActionBtnActive,
                      ]}
                      onPress={() => handleInteract(item.id, 'like')}
                      disabled={interactingPost === item.id}
                    >
                      <Text style={styles.postActionText}>❤️ {item.likeCount}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.postActionBtn,
                        item.userInteraction?.encouraged && styles.postActionBtnActive,
                      ]}
                      onPress={() => handleInteract(item.id, 'encourage')}
                      disabled={interactingPost === item.id}
                    >
                      <Text style={styles.postActionText}>💪 {item.encourageCount}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  topSwitch: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 6,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#1F2937',
  },
  switchText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  switchTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    minHeight: 140,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    textAlignVertical: 'top',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0B1220',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  moodPicker: {
    marginBottom: 16,
  },
  moodChip: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 72,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodChipSelected: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  moodChipEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodChipLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  moodChipLabelSelected: {
    color: '#FFFFFF',
  },
  feedItem: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  feedHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedAccent: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: 13,
    flex: 1,
    textTransform: 'capitalize',
  },
  feedDate: {
    color: '#94A3B8',
    fontSize: 12,
  },
  feedBody: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  deleteText: {
    fontSize: 16,
  },
  communityTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  communityTypeBtn: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  communityTypeBtnActive: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  communityTypeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  communityTypeBtnTextActive: {
    color: '#FFFFFF',
  },
  anonymousToggle: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  anonymousToggleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  anonymousToggleHint: {
    color: '#94A3B8',
    fontSize: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  postActionBtn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  postActionBtnActive: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  postActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});