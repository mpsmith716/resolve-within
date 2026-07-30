
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Animated,

} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiGet, authenticatedGet, authenticatedPost, authenticatedDelete } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppModal } from '@/components/ErrorBoundary';
import { getSafeGradient } from '@/constants/SafeDefaults';
import { getTodayMessage, loadPersistedDailyMessage, DailyMessageData } from '@/constants/dailyMessages';
import { getTodayReset, DailyResetData } from '@/constants/dailyResets';
import ReportModal from '@/components/ReportModal';

type ActiveTab = 'home' | 'journal' | 'community';
type MoodType = 'cloudy' | 'onEdge' | 'numbZone' | 'heavyHeart' | 'lightSpark';
type CommunityType = 'veteran' | 'healing_together';

const MOOD_TO_BACKEND: Record<MoodType, string> = {
  cloudy: 'cloudy',
  onEdge: 'onEdge',
  numbZone: 'numb',
  heavyHeart: 'heavy',
  lightSpark: 'light',
};

const MOOD_BUTTONS = [
  { type: 'cloudy' as MoodType, emoji: '☁️', label: 'Settle In', sublabel: 'Cloudy but Moving', level: 1 },
  { type: 'onEdge' as MoodType, emoji: '⚡', label: 'Steady Ground', sublabel: 'On Edge', level: 2 },
  { type: 'numbZone' as MoodType, emoji: '🌀', label: 'Reconnect', sublabel: 'Numb Zone', level: 3 },
  { type: 'heavyHeart' as MoodType, emoji: '💔', label: 'Release', sublabel: 'Heavy Heart', level: 4 },
  { type: 'lightSpark' as MoodType, emoji: '✨', label: 'Rise', sublabel: 'Light Spark', level: 5 },
];

interface JournalEntry { id: string; mood: string; content?: string; createdAt: string; }
interface CommunityPost {
  id: string; authorName: string; isAnonymous: boolean; content: string;
  isPinned: boolean; likeCount: number; encourageCount: number; createdAt: string;
  userInteraction?: { liked: boolean; encouraged: boolean };
}

const MOOD_EMOJI: Record<string, string> = {
  cloudy: '☁️', onEdge: '⚡', numb: '🌀', heavy: '💔', light: '✨',
};

// Animated mood card component with scale and glow
function AnimatedMoodCard({ mood, onPress }: { mood: typeof MOOD_BUTTONS[0]; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    // Animation only — navigation is handled by onPress (confirmed tap only)
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.03,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacityAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    // Animation reset only — do NOT call onPress() here.
    // onPressOut fires on scroll-cancelled touches too, which would
    // auto-open the calm screen whenever the user scrolls over a mood card.
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    // Only fires on a confirmed tap (not on scroll-cancelled touches)
    console.log('[HOME] User tapped mood card:', mood.type);
    onPress();
  };

  const levelBadgeText = `Level ${mood.level}`;

  return (
    <View style={{ position: 'relative' }}>
      {/* Static glow layer with animated opacity - no shadowColor animation */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 215, 0, 0.3)',
            opacity: glowOpacityAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.moodButton}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={1}
        >
          <View style={styles.moodLevelBadge}>
            <Text style={styles.moodLevelText}>{levelBadgeText}</Text>
          </View>
          <Text style={styles.moodEmoji}>{mood.emoji}</Text>
          <Text style={styles.moodLabel}>{mood.label}</Text>
          <Text style={styles.moodSublabel}>{mood.sublabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  console.log('[HOME] rendered, no auto-navigation');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const initialTab = (params.tab === 'journal' || params.tab === 'community') ? params.tab as ActiveTab : 'home';
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [dailyMessage, setDailyMessage] = useState<DailyMessageData>(getTodayMessage());
  const [dailyReset, setDailyReset] = useState<DailyResetData>(getTodayReset());
  const messageFadeAnim = useRef(new Animated.Value(0)).current;

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalRefreshing, setJournalRefreshing] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('cloudy');
  const [journalContent, setJournalContent] = useState('');
  const [savingEntry, setSavingEntry] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; entryId: string }>({ visible: false, entryId: '' });
  const [deletingEntry, setDeletingEntry] = useState(false);

  const [communityType, setCommunityType] = useState<CommunityType>('healing_together');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsRefreshing, setPostsRefreshing] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [savingPost, setSavingPost] = useState(false);
  const [interactingPost, setInteractingPost] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
const [selectedReportPostId, setSelectedReportPostId] = useState<string | null>(null);

  const safeGradient = getSafeGradient([colors.background, '#0a0e1a', colors.background]);

  useEffect(() => {
    console.log('[DailyMessage] Loading persisted daily message...');
    loadPersistedDailyMessage().then((msg) => {
      console.log('[DailyMessage] Loaded:', msg.id, '—', msg.message.slice(0, 40));
      setDailyMessage(msg);
      Animated.timing(messageFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, [messageFadeAnim]);

  useEffect(() => {
    if (params.tab === 'journal' || params.tab === 'community') {
      console.log('[Home] Opening with tab from navigation:', params.tab);
      setActiveTab(params.tab as ActiveTab);
    }
  }, [params.tab]);

  // Smooth fade transition when switching tabs
  useEffect(() => {
    console.log('[Animation] Tab changed to:', activeTab);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [activeTab, fadeAnim]);

  const fetchJournalEntries = useCallback(async (isRefresh = false) => {
    if (!user) {
      console.log('[Home] User not authenticated, skipping journal fetch');
      return;
    }

    if (isRefresh) setJournalRefreshing(true);
    else setJournalLoading(true);
    try {
      console.log('[Home] Fetching journal entries...');
      const entries = await authenticatedGet<JournalEntry[]>('/api/journal?limit=50');
      setJournalEntries(entries);
    } catch (error: any) {
      console.error('[Home] Failed to fetch journal entries:', error?.message || error);
    } finally {
      setJournalLoading(false);
      setJournalRefreshing(false);
    }
  }, [user]);

  const fetchCommunityPosts = useCallback(async (isRefresh = false) => {
    if (!user) {
      console.log('[Home] User not authenticated, skipping community posts fetch');
      return;
    }

    if (isRefresh) setPostsRefreshing(true);
    else setPostsLoading(true);
    try {
      console.log('[Home] Fetching community posts for:', communityType);
      const data = await authenticatedGet<CommunityPost[]>(`/api/community/${communityType}?limit=20`);
      console.log('[Home] Fetched', data.length, 'posts for', communityType);
      setPosts(data);
    } catch (error: any) {
      console.error('[Home] Failed to fetch community posts:', error?.message || error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
      setPostsRefreshing(false);
    }
  }, [communityType, user]);

  useEffect(() => {
    if (activeTab === 'journal' && user) {
      fetchJournalEntries();
    }
  }, [activeTab, user, fetchJournalEntries]);

  useEffect(() => {
    if (activeTab === 'community' && user) {
      console.log('[Home] Community tab active, fetching posts for:', communityType);
      fetchCommunityPosts();
    }
  }, [activeTab, communityType, user, fetchCommunityPosts]);

  const handleSaveJournalEntry = async () => {
    setSavingEntry(true);
    try {
      console.log('[Home] Creating journal entry with mood:', selectedMood);
      const entry = await authenticatedPost<JournalEntry>('/api/journal', {
        mood: selectedMood,
        content: journalContent.trim() || undefined,
      });
      setJournalEntries(prev => [entry, ...prev]);
      setShowNewEntry(false);
      setJournalContent('');
      setSelectedMood('cloudy');
      console.log('[Home] Journal entry created successfully');
    } catch (error: any) {
      console.error('[Home] Failed to create journal entry:', error?.message || error);
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteEntry = async () => {
    setDeletingEntry(true);
    try {
      console.log('[Home] Deleting journal entry:', deleteModal.entryId);
      await authenticatedDelete(`/api/journal/${deleteModal.entryId}`);
      setJournalEntries(prev => prev.filter(e => e.id !== deleteModal.entryId));
      setDeleteModal({ visible: false, entryId: '' });
      console.log('[Home] Journal entry deleted successfully');
    } catch (error: any) {
      console.error('[Home] Failed to delete journal entry:', error?.message || error);
      setDeleteModal({ visible: false, entryId: '' });
    } finally {
      setDeletingEntry(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    setSavingPost(true);
    try {
      console.log('[Home] Creating community post in:', communityType);
      const post = await authenticatedPost<CommunityPost>(`/api/community/${communityType}`, {
        content: postContent.trim(),
        isAnonymous,
      });
      setPosts(prev => [post, ...prev]);
      setShowNewPost(false);
      setPostContent('');
      console.log('[Home] Community post created successfully in', communityType);
    } catch (error: any) {
      console.error('[Home] Failed to create post:', error?.message || error);
    } finally {
      setSavingPost(false);
    }
  };

  const handleInteract = async (postId: string, type: 'like' | 'encourage' | 'flag') => {
    setInteractingPost(postId);
    try {
      console.log('[Home] Interacting with post:', postId, type);
      const updated = await authenticatedPost<{ id: string; likeCount: number; encourageCount: number; flagCount: number; isHidden: boolean }>(
        `/api/community/posts/${postId}/interact`,
        { type }
      );
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        likeCount: updated.likeCount,
        encourageCount: updated.encourageCount,
        userInteraction: {
          liked: type === 'like' ? !p.userInteraction?.liked : (p.userInteraction?.liked ?? false),
          encouraged: type === 'encourage' ? !p.userInteraction?.encouraged : (p.userInteraction?.encouraged ?? false),
        }
      } : p));
    } catch (error: any) {
      console.error('[Home] Failed to interact with post:', error?.message || error);
    } finally {
      setInteractingPost(null);
    }
  };

  const handleMoodPress = (moodType: MoodType) => {
    const backendMood = MOOD_TO_BACKEND[moodType];
    console.log('[Home] User selected mood:', moodType, 'backend:', backendMood);
    router.push(`/reset-session?mood=${moodType}&backendMood=${backendMood}`);
  };

  const handleStartReset = () => {
    console.log('[Home] Starting daily reset:', dailyReset.title);
    
    // If the reset has a target mood, navigate to that mood's reset session
    if (dailyReset.targetMood) {
      const backendMood = MOOD_TO_BACKEND[dailyReset.targetMood as MoodType];
      router.push(`/reset-session?mood=${dailyReset.targetMood}&backendMood=${backendMood}`);
    } else if (dailyReset.type === 'grounding') {
      // Navigate to grounding technique
      router.push('/grounding-technique?id=5-4-3-2-1');
    } else {
      // Default to a general breathing exercise
      router.push('/reset-session?mood=cloudy&backendMood=cloudy');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCommunityTypeChange = (newType: CommunityType) => {
    console.log('[Home] Switching community type from', communityType, 'to', newType);
    setCommunityType(newType);
    setPosts([]);
  };

  if (!authLoading && !user) {
    const signInPromptEmoji = '🔒';
    const signInPromptTitle = 'Sign In Required';
    const signInPromptSubtitle = 'Please sign in to access your journal and community features';
    const signInButtonText = 'Sign In';
    
    return (
      <LinearGradient colors={safeGradient} style={styles.container}>
        <View style={styles.signInPrompt}>
          <Text style={styles.signInEmoji}>{signInPromptEmoji}</Text>
          <Text style={styles.signInTitle}>{signInPromptTitle}</Text>
          <Text style={styles.signInSubtitle}>{signInPromptSubtitle}</Text>
          <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/auth')}>
            <Text style={styles.signInButtonText}>{signInButtonText}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const renderHomeTab = () => {
    const displayName = user?.name ? user.name.split(' ')[0] : '';
    const greetingText = displayName ? `Hello, ${displayName} 👋` : '';
    const headerQuestion = "How are you feeling right now?";
    
    const messageStream = dailyMessage.stream || 'general';
    const messageStreamLabel = 
      messageStream === 'veteran' ? '🎖 Today\'s Message' : 
      messageStream === 'faith' ? '🙏 Today\'s Message' : 
      '💚 Today\'s Message';
    
    const messageText = dailyMessage.text;
    
    const resetCardTitle = "Today's Reset";
    const resetIcon = dailyReset.icon;
    const resetTitle = dailyReset.title;
    const resetDescription = dailyReset.description;
    const startResetButtonText = "Start Reset";
    
    const supportMessageText = "You showed up. That's what matters.";

    
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            {greetingText ? <Text style={styles.greetingText}>{greetingText}</Text> : null}
            <Text style={styles.headerText}>{headerQuestion}</Text>
          </View>

          <Animated.View style={[styles.messageCard, { opacity: messageFadeAnim }]}>
            <Text style={styles.messageStreamLabel}>{messageStreamLabel}</Text>
            <Text style={styles.messageContent}>{messageText}</Text>
          </Animated.View>

          <View style={styles.resetCard}>
            <View style={styles.resetHeader}>
              <Text style={styles.resetIcon}>{resetIcon}</Text>
              <Text style={styles.resetCardTitle}>{resetCardTitle}</Text>
            </View>
            <Text style={styles.resetTitle}>{resetTitle}</Text>
            <Text style={styles.resetDescription}>{resetDescription}</Text>
            <TouchableOpacity style={styles.resetButton} onPress={handleStartReset}>
              <Text style={styles.resetButtonText}>{startResetButtonText}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.moodContainer}>
            {MOOD_BUTTONS.map((mood) => (
              <AnimatedMoodCard key={mood.type} mood={mood} onPress={() => handleMoodPress(mood.type)} />
            ))}
          </View>

          <View style={styles.missionMessageContainer}>
            <Text style={styles.missionMessageText}>
              Resolve Within is built to provide free mental wellness support for anyone who needs it.
            </Text>
          </View>

          <View style={styles.supportMessage}>
            <Text style={styles.supportText}>{supportMessageText}</Text>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  const renderJournalTab = () => {
    const newEntryTitle = 'New Journal Entry';
    const howFeelingQuestion = 'How are you feeling?';
    const cancelText = 'Cancel';
    const saveEntryText = 'Save Entry';
    const myJournalTitle = 'My Journal';
    const newEntryButtonText = '+ New Entry';
    const noEntriesEmoji = '📓';
    const noEntriesTitle = 'No entries yet';
    const noEntriesSubtitle = 'Start tracking your mood and thoughts';
    const deleteEntryTitle = 'Delete Entry';
    const deleteEntryMessage = 'Are you sure you want to delete this journal entry?';
    const deleteText = 'Delete';
    const deletingText = 'Deleting...';
    const journalPlaceholder = 'Write your thoughts... (optional)';
    
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <AppModal
          visible={deleteModal.visible}
          title={deleteEntryTitle}
          message={deleteEntryMessage}
          actions={[
            { label: deletingEntry ? deletingText : deleteText, onPress: handleDeleteEntry, style: 'destructive', loading: deletingEntry },
            { label: cancelText, onPress: () => setDeleteModal({ visible: false, entryId: '' }), style: 'cancel' },
          ]}
          onDismiss={() => setDeleteModal({ visible: false, entryId: '' })}
        />
        
        {showNewEntry ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>{newEntryTitle}</Text>
            <Text style={styles.sectionSubtitle}>{howFeelingQuestion}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodPicker}>
              {[
                { value: 'cloudy', emoji: '☁️', label: 'Cloudy' },
                { value: 'onEdge', emoji: '⚡', label: 'On Edge' },
                { value: 'numb', emoji: '🌀', label: 'Numb' },
                { value: 'heavy', emoji: '💔', label: 'Heavy' },
                { value: 'light', emoji: '✨', label: 'Light' },
              ].map(m => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.moodChip, selectedMood === m.value && styles.moodChipSelected]}
                  onPress={() => setSelectedMood(m.value)}
                >
                  <Text style={styles.moodChipEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodChipLabel, selectedMood === m.value && styles.moodChipLabelSelected]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.journalInput}
              placeholder={journalPlaceholder}
              placeholderTextColor={colors.textSecondary + '80'}
              value={journalContent}
              onChangeText={setJournalContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowNewEntry(false); setJournalContent(''); }}>
                <Text style={styles.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingEntry && { opacity: 0.7 }]} onPress={handleSaveJournalEntry} disabled={savingEntry}>
                {savingEntry ? <ActivityIndicator color={colors.background} size="small" /> : <Text style={styles.saveBtnText}>{saveEntryText}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={journalRefreshing} onRefresh={() => fetchJournalEntries(true)} tintColor={colors.accent} />}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{myJournalTitle}</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowNewEntry(true)}>
                <Text style={styles.addButtonText}>{newEntryButtonText}</Text>
              </TouchableOpacity>
            </View>
            {journalLoading ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
            ) : journalEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>{noEntriesEmoji}</Text>
                <Text style={styles.emptyTitle}>{noEntriesTitle}</Text>
                <Text style={styles.emptySubtitle}>{noEntriesSubtitle}</Text>
              </View>
            ) : (
              journalEntries.map(entry => {
                const entryMoodText = `${MOOD_EMOJI[entry.mood] || '📝'} ${entry.mood}`;
                const entryDateText = formatDate(entry.createdAt);
                
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryMood}>{entryMoodText}</Text>
                      <View style={styles.entryActions}>
                        <Text style={styles.entryDate}>{entryDateText}</Text>
                        <TouchableOpacity onPress={() => setDeleteModal({ visible: true, entryId: entry.id })} style={styles.deleteBtn}>
                          <Text style={styles.deleteBtnText}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {entry.content ? <Text style={styles.entryContent}>{entry.content}</Text> : null}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </Animated.View>
    );
  };

  const renderCommunityTab = () => {
    const healingTogetherLabel = "🤝 Healing Together";
    const veteranCornerLabel = "🎖 Veteran Corner";
    const postingAsAnonymous = "🎭 Posting as Anonymous";
    const postingAsUser = `👤 Posting as ${user?.name || 'You'}`;
    const toggleHint = "Tap to toggle";
    const shareWithCommunityTitle = 'Share with Community';
    const sharePlaceholder = 'Share your thoughts, encouragement, or experience...';
    const cancelText = 'Cancel';
    const postText = 'Post';
    const noPostsEmoji = '🤝';
    const noPostsTitle = 'No posts yet';
    const noPostsSubtitle = 'Be the first to share something';
    const newPostButtonText = '+ Post';
    
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.communityTypeRow}>
          <TouchableOpacity
            style={[styles.communityTypeBtn, communityType === 'healing_together' && styles.communityTypeBtnActive]}
            onPress={() => handleCommunityTypeChange('healing_together')}
          >
            <Text style={[styles.communityTypeBtnText, communityType === 'healing_together' && styles.communityTypeBtnTextActive]}>
              {healingTogetherLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.communityTypeBtn, communityType === 'veteran' && styles.communityTypeBtnActive]}
            onPress={() => handleCommunityTypeChange('veteran')}
          >
            <Text style={[styles.communityTypeBtnText, communityType === 'veteran' && styles.communityTypeBtnTextActive]}>
              {veteranCornerLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {showNewPost ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>{shareWithCommunityTitle}</Text>
            <TextInput
              style={styles.journalInput}
              placeholder={sharePlaceholder}
              placeholderTextColor={colors.textSecondary + '80'}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.anonymousToggle} onPress={() => setIsAnonymous(!isAnonymous)}>
              <Text style={styles.anonymousToggleText}>
                {isAnonymous ? postingAsAnonymous : postingAsUser}
              </Text>
              <Text style={styles.anonymousToggleHint}>{toggleHint}</Text>
            </TouchableOpacity>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowNewPost(false); setPostContent(''); }}>
                <Text style={styles.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, (savingPost || !postContent.trim()) && { opacity: 0.7 }]} onPress={handleCreatePost} disabled={savingPost || !postContent.trim()}>
                {savingPost ? <ActivityIndicator color={colors.background} size="small" /> : <Text style={styles.saveBtnText}>{postText}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={postsRefreshing} onRefresh={() => fetchCommunityPosts(true)} tintColor={colors.accent} />}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{communityType === 'veteran' ? 'Veteran Corner' : 'Healing Together'}</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowNewPost(true)}>
                <Text style={styles.addButtonText}>{newPostButtonText}</Text>
              </TouchableOpacity>
            </View>
            {postsLoading ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
            ) : posts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>{noPostsEmoji}</Text>
                <Text style={styles.emptyTitle}>{noPostsTitle}</Text>
                <Text style={styles.emptySubtitle}>{noPostsSubtitle}</Text>
              </View>
            ) : (
              posts.map(post => {
                const pinnedBadgeText = "📌 Pinned";
                const postAuthorText = post.isAnonymous ? '🎭 Anonymous' : `👤 ${post.authorName}`;
                const postDateText = formatDate(post.createdAt);
                const likeCountText = `❤️ ${post.likeCount}`;
                const encourageCountText = `💪 ${post.encourageCount}`;
                const flagText = "🚩";
                
                return (
                  <View key={post.id} style={[styles.postCard, post.isPinned && styles.postCardPinned]}>
                    {post.isPinned && <Text style={styles.pinnedBadge}>{pinnedBadgeText}</Text>}
                    <View style={styles.postHeader}>
                      <Text style={styles.postAuthor}>{postAuthorText}</Text>
                      <Text style={styles.postDate}>{postDateText}</Text>
                    </View>
                    <Text style={styles.postContent}>{post.content}</Text>
                    <View style={styles.postActions}>
                      <TouchableOpacity
                        style={[styles.postActionBtn, post.userInteraction?.liked && styles.postActionBtnActive]}
                        onPress={() => handleInteract(post.id, 'like')}
                        disabled={interactingPost === post.id}
                      >
                        <Text style={styles.postActionText}>{likeCountText}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.postActionBtn, post.userInteraction?.encouraged && styles.postActionBtnActive]}
                        onPress={() => handleInteract(post.id, 'encourage')}
                        disabled={interactingPost === post.id}
                      >
                        <Text style={styles.postActionText}>{encourageCountText}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.postActionBtn}
                        onPress={() => {
                        console.log('[Home] Tapped flag on post:', post.id, '— opening ReportModal');
                        setSelectedReportPostId(post.id);
                         setReportModalVisible(true);
                        }}
                        disabled={interactingPost === post.id}
                      >
                        <Text style={styles.postActionText}>{flagText}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </Animated.View>
    );
  };

  const homeTabLabel = "🏠 Home";
  const journalTabLabel = "📓 Journal";
  const communityTabLabel = "🤝 Community";

  return (
    <LinearGradient colors={safeGradient} style={styles.container}>
      {selectedReportPostId && (
  <ReportModal
    visible={reportModalVisible}
    postId={selectedReportPostId}
    onClose={() => {
      setReportModalVisible(false);
      setSelectedReportPostId(null);
    }}
  />
)}
      <View style={[styles.tabBar, { paddingTop: insets.top + 8 }]}>
        {(['home', 'journal', 'community'] as ActiveTab[]).map(tab => {
          const tabLabelText = tab === 'home' ? homeTabLabel : tab === 'journal' ? journalTabLabel : communityTabLabel;
          
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tabLabelText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'home' && renderHomeTab()}
      {activeTab === 'journal' && renderJournalTab()}
      {activeTab === 'community' && renderCommunityTab()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  tabItemActive: {
    backgroundColor: colors.accent + '20',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  tabLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabLabelActive: { color: colors.accent },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140, paddingTop: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  greetingText: { fontSize: 18, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  headerText: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center', lineHeight: 36 },
  messageCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: colors.accent + '40', minHeight: 80, justifyContent: 'center',
  },
  messageStreamLabel: { fontSize: 13, fontWeight: '600', color: colors.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  messageContent: { fontSize: 16, color: colors.text, lineHeight: 24, fontStyle: 'italic' },
  resetCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  resetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resetIcon: {
    fontSize: 24,
  },
  resetCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  resetDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  moodContainer: { gap: 12, marginBottom: 24 },
  moodButton: {
    backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center',
    justifyContent: 'center', minHeight: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    position: 'relative',
  },
  moodLevelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  moodLevelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moodEmoji: { fontSize: 36, marginBottom: 8 },
  moodLabel: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
  moodSublabel: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  supportMessage: { alignItems: 'center', paddingVertical: 24, marginBottom: 20 },
  supportText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  missionMessageContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  missionMessageText: {
    color: '#8899AA',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  signInPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  signInEmoji: { fontSize: 64, marginBottom: 24 },
  signInTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12, textAlign: 'center' },
  signInSubtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  signInButton: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48 },
  signInButtonText: { fontSize: 16, fontWeight: '700', color: colors.background },
  journalTypeRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  journalTypeBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  journalTypeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  journalTypeBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  journalTypeBtnTextActive: { color: colors.accent },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 16 },
  addButton: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  addButtonText: { fontSize: 13, fontWeight: '700', color: colors.background },
  moodPicker: { marginBottom: 16 },
  moodChip: {
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginRight: 10,
    alignItems: 'center', minWidth: 70, borderWidth: 2, borderColor: 'transparent',
  },
  moodChipSelected: { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
  moodChipEmoji: { fontSize: 24, marginBottom: 4 },
  moodChipLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  moodChipLabelSelected: { color: colors.accent },
  journalInput: {
    backgroundColor: colors.card, borderRadius: 12, padding: 16, color: colors.text,
    fontSize: 15, minHeight: 120, marginBottom: 16, borderWidth: 1, borderColor: colors.accent + '20',
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.textSecondary + '30' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.background },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  entryCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.accent + '15',
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  entryMood: { fontSize: 15, fontWeight: '700', color: colors.accent, textTransform: 'capitalize' },
  entryActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDate: { fontSize: 12, color: colors.textSecondary },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16 },
  entryContent: { fontSize: 14, color: colors.text, lineHeight: 20 },
  communityTypeRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  communityTypeBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  communityTypeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  communityTypeBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  communityTypeBtnTextActive: { color: colors.accent },
  anonymousToggle: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: colors.accent + '30',
  },
  anonymousToggleText: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  anonymousToggleHint: { fontSize: 12, color: colors.textSecondary },
  postCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.accent + '15',
  },
  postCardPinned: { borderColor: colors.accent, borderWidth: 2 },
  pinnedBadge: { fontSize: 12, color: colors.accent, fontWeight: '700', marginBottom: 8 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  postAuthor: { fontSize: 14, fontWeight: '700', color: colors.accent },
  postDate: { fontSize: 12, color: colors.textSecondary },
  postContent: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 12 },
  postActions: { flexDirection: 'row', gap: 8 },
  postActionBtn: { backgroundColor: colors.background, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.accent + '20' },
  postActionBtnActive: { backgroundColor: colors.accent + '20', borderColor: colors.accent },
  postActionText: { fontSize: 13, color: colors.text, fontWeight: '600' },
});
