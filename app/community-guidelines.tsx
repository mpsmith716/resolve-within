import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { FontWeights } from '@/utils/fontHelpers';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Respectful interaction',
    body:
      'Treat others with dignity. Share support, encouragement, and lived experience without putting others down.',
  },
  {
    title: 'No harassment',
    body:
      'Do not bully, stalk, intimidate, or repeatedly target someone. Unwanted contact and personal attacks are not allowed.',
  },
  {
    title: 'No hate or threats',
    body:
      'Content that attacks people based on identity, or that threatens violence or harm, is not allowed.',
  },
  {
    title: 'Dangerous content',
    body:
      'Do not post content that promotes self-harm, suicide, or illegal dangerous activity. If you are in crisis, use 988 (US) or local emergency resources — community posts are not a crisis hotline.',
  },
  {
    title: 'No spam',
    body:
      'Do not flood the community with ads, scams, repetitive posts, or unrelated promotional content.',
  },
  {
    title: 'Privacy and personal information',
    body:
      'Do not share someone else’s private information (phone numbers, addresses, medical details, or other personal identifiers) without permission. Protect your own privacy too.',
  },
  {
    title: 'Reporting',
    body:
      'If you see something that breaks these guidelines, use Report on the post. Reports help us review content — they are not an emergency response channel.',
  },
  {
    title: 'Moderation and removal',
    body:
      'Resolve Within may hide or remove posts that violate these guidelines or that put community safety at risk. Decisions are made by reviewers when reports are reviewed; posts are not continuously monitored for emergencies.',
  },
];

export default function CommunityGuidelinesScreen() {
  const router = useRouter();

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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Community Guidelines',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Community Guidelines</Text>
            <Text style={styles.subtitle}>
              Resolve Within community spaces are for supportive, respectful peer connection.
              Please keep them safe for everyone.
            </Text>
          </View>

          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.paragraph}>{section.body}</Text>
            </View>
          ))}

          <View style={styles.crisisBox}>
            <Text style={styles.crisisTitle}>Need crisis support?</Text>
            <Text style={styles.crisisText}>
              Call or text 988 (US Suicide & Crisis Lifeline), or contact local emergency services.
              App reporting is not a substitute for emergency help.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
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
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: FontWeights.bold,
    color: colors.accent,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  crisisBox: {
    marginTop: 8,
    backgroundColor: 'rgba(204, 0, 0, 0.12)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.35)',
  },
  crisisTitle: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: '#E05252',
    marginBottom: 8,
  },
  crisisText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
});
