
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, Linking, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import VeteransHero from '@/components/VeteransHero';
import { FontWeights } from '@/utils/fontHelpers';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchFavorites, toggleFavorite } from '@/utils/favorites';

export default function VeteransCornerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);
  console.log('VeteransCornerScreen: Rendering Veterans Corner');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favs = await fetchFavorites();
      setFavorites(favs);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleToggleFavorite = async (exerciseId: string) => {
    setTogglingFavorite(exerciseId);
    try {
      const success = await toggleFavorite(exerciseId);
      if (success) {
        // Reload favorites to update UI
        await loadFavorites();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setTogglingFavorite(null);
    }
  };

  const isFavorited = (exerciseId: string) => favorites.includes(exerciseId);

  const handleBreathingShortcut = (mood: string, backendMood: string) => {
    console.log('Veterans: Starting breathing shortcut:', mood);
    router.push(`/reset-session?mood=${mood}&backendMood=${backendMood}`);
  };

  const handleGroundingTechnique = (techniqueId: string) => {
    console.log('Veterans: Opening grounding technique:', techniqueId);
    router.push(`/grounding-technique?id=${techniqueId}`);
  };

  const handleOpenURL = async (url: string, label: string) => {
    if (!url) return;
    console.log(`Veterans: Opening resource link — ${label}:`, url);
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unable to open', `Could not open: ${url}`);
    }
  };

  const handleCallCrisisLine = () => {
    console.log('Veterans: Tapped Veterans Crisis Line — calling 988');
    handleOpenURL('tel:988', 'Veterans Crisis Line');
  };

  const handleTextCrisisLine = () => {
    console.log('Veterans: Tapped Veterans Crisis Line — texting 838255');
    handleOpenURL('sms:838255', 'Veterans Crisis Line SMS');
  };

  const handleVAMentalHealth = () => {
    console.log('Veterans: Tapped VA Mental Health website');
    handleOpenURL('https://www.mentalhealth.va.gov', 'VA Mental Health');
  };

  const handleVetCenters = () => {
    console.log('Veterans: Tapped Vet Centers website');
    handleOpenURL('https://www.va.gov/find-locations/?facilityType=vet_center', 'Vet Centers');
  };

  const veteranCornerTitle = 'Veteran Corner';
  const breathingShortcutsTitle = 'Breathing Shortcuts';
  const favoritesTitle = 'Favorites';
  const groundingTitle = 'Grounding Techniques';
  const resourcesTitle = 'Resources';
  const noFavoritesText = 'No favorites yet. Tap the star icon to add exercises.';
  
  const quickCalmLabel = 'Quick Calm';
  const quickCalmDesc = 'Level 1 - Cloudy but Moving';
  const onEdgeLabel = 'On Edge Reset';
  const onEdgeDesc = 'Level 2 - Calming Focus';
  const deepReleaseLabel = 'Deep Release';
  const deepReleaseDesc = 'Level 4 - Heavy Heart';
  
  const groundingTechnique1 = '5-4-3-2-1 Method';
  const groundingTechnique1Desc = 'Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste';
  const groundingTechnique2 = 'Box Breathing';
  const groundingTechnique2Desc = 'Inhale 4, hold 4, exhale 4, hold 4. Repeat.';
  const groundingTechnique3 = 'Feet on Floor';
  const groundingTechnique3Desc = 'Feel your feet firmly planted. You are here. You are present.';
  
  const resource1Title = 'Veterans Crisis Line';
  const resource1Desc = 'Free, confidential support 24/7 for veterans in crisis';
  const resource1ActionCall = 'Call 988 (Press 1)';
  const resource1ActionText = 'Text 838255';
  const resource2Title = 'VA Mental Health';
  const resource2Desc = 'Connect with VA mental health services and resources';
  const resource2Action = 'Visit Website';
  const resource3Title = 'Vet Centers';
  const resource3Desc = 'Community-based counseling for veterans and families';
  const resource3Action = 'Find a Vet Center';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={[colors.background, '#0a0e1a', colors.background]}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <VeteransHero />

          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>{veteranCornerTitle}</Text>

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>{breathingShortcutsTitle}</Text>
              
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleBreathingShortcut('cloudy', 'cloudy')}
                activeOpacity={0.7}
              >
                <View style={styles.cardIconContainer}>
                  <IconSymbol
                    ios_icon_name="wind"
                    android_material_icon_name="air"
                    size={24}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{quickCalmLabel}</Text>
                  <Text style={styles.cardDescription}>{quickCalmDesc}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleFavorite('cloudy')}
                  disabled={togglingFavorite === 'cloudy'}
                  style={styles.favoriteButton}
                >
                  {togglingFavorite === 'cloudy' ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <IconSymbol
                      ios_icon_name={isFavorited('cloudy') ? 'star.fill' : 'star'}
                      android_material_icon_name={isFavorited('cloudy') ? 'star' : 'star-border'}
                      size={24}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={() => handleBreathingShortcut('onEdge', 'onEdge')}
                activeOpacity={0.7}
              >
                <View style={styles.cardIconContainer}>
                  <IconSymbol
                    ios_icon_name="bolt.fill"
                    android_material_icon_name="flash-on"
                    size={24}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{onEdgeLabel}</Text>
                  <Text style={styles.cardDescription}>{onEdgeDesc}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleFavorite('onEdge')}
                  disabled={togglingFavorite === 'onEdge'}
                  style={styles.favoriteButton}
                >
                  {togglingFavorite === 'onEdge' ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <IconSymbol
                      ios_icon_name={isFavorited('onEdge') ? 'star.fill' : 'star'}
                      android_material_icon_name={isFavorited('onEdge') ? 'star' : 'star-border'}
                      size={24}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={() => handleBreathingShortcut('heavyHeart', 'heavy')}
                activeOpacity={0.7}
              >
                <View style={styles.cardIconContainer}>
                  <IconSymbol
                    ios_icon_name="heart.fill"
                    android_material_icon_name="favorite"
                    size={24}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{deepReleaseLabel}</Text>
                  <Text style={styles.cardDescription}>{deepReleaseDesc}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleFavorite('heavyHeart')}
                  disabled={togglingFavorite === 'heavyHeart'}
                  style={styles.favoriteButton}
                >
                  {togglingFavorite === 'heavyHeart' ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <IconSymbol
                      ios_icon_name={isFavorited('heavyHeart') ? 'star.fill' : 'star'}
                      android_material_icon_name={isFavorited('heavyHeart') ? 'star' : 'star-border'}
                      size={24}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {favorites.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subsectionTitle}>{favoritesTitle}</Text>
                
                {isFavorited('cloudy') && (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleBreathingShortcut('cloudy', 'cloudy')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardIconContainer}>
                      <IconSymbol
                        ios_icon_name="wind"
                        android_material_icon_name="air"
                        size={24}
                        color={colors.accent}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{quickCalmLabel}</Text>
                      <Text style={styles.cardDescription}>{quickCalmDesc}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleFavorite('cloudy')}
                      disabled={togglingFavorite === 'cloudy'}
                      style={styles.favoriteButton}
                    >
                      <IconSymbol
                        ios_icon_name="star.fill"
                        android_material_icon_name="star"
                        size={24}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="arrow-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}

                {isFavorited('onEdge') && (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleBreathingShortcut('onEdge', 'onEdge')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardIconContainer}>
                      <IconSymbol
                        ios_icon_name="bolt.fill"
                        android_material_icon_name="flash-on"
                        size={24}
                        color={colors.accent}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{onEdgeLabel}</Text>
                      <Text style={styles.cardDescription}>{onEdgeDesc}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleFavorite('onEdge')}
                      disabled={togglingFavorite === 'onEdge'}
                      style={styles.favoriteButton}
                    >
                      <IconSymbol
                        ios_icon_name="star.fill"
                        android_material_icon_name="star"
                        size={24}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="arrow-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}

                {isFavorited('heavyHeart') && (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleBreathingShortcut('heavyHeart', 'heavy')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardIconContainer}>
                      <IconSymbol
                        ios_icon_name="heart.fill"
                        android_material_icon_name="favorite"
                        size={24}
                        color={colors.accent}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{deepReleaseLabel}</Text>
                      <Text style={styles.cardDescription}>{deepReleaseDesc}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleFavorite('heavyHeart')}
                      disabled={togglingFavorite === 'heavyHeart'}
                      style={styles.favoriteButton}
                    >
                      <IconSymbol
                        ios_icon_name="star.fill"
                        android_material_icon_name="star"
                        size={24}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="arrow-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>{groundingTitle}</Text>
              
              <TouchableOpacity
                style={styles.groundingCard}
                onPress={() => handleGroundingTechnique('5-4-3-2-1')}
                activeOpacity={0.7}
              >
                <View style={styles.groundingCardHeader}>
                  <View style={styles.groundingCardIconContainer}>
                    <IconSymbol
                      ios_icon_name="hand.raised.fill"
                      android_material_icon_name="back-hand"
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <Text style={styles.groundingCardTitle}>{groundingTechnique1}</Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={styles.groundingCardDescription}>{groundingTechnique1Desc}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.groundingCard}
                onPress={() => handleGroundingTechnique('box-breathing')}
                activeOpacity={0.7}
              >
                <View style={styles.groundingCardHeader}>
                  <View style={styles.groundingCardIconContainer}>
                    <IconSymbol
                      ios_icon_name="square.fill"
                      android_material_icon_name="crop-square"
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <Text style={styles.groundingCardTitle}>{groundingTechnique2}</Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={styles.groundingCardDescription}>{groundingTechnique2Desc}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.groundingCard}
                onPress={() => handleGroundingTechnique('feet-on-floor')}
                activeOpacity={0.7}
              >
                <View style={styles.groundingCardHeader}>
                  <View style={styles.groundingCardIconContainer}>
                    <IconSymbol
                      ios_icon_name="figure.stand"
                      android_material_icon_name="accessibility"
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <Text style={styles.groundingCardTitle}>{groundingTechnique3}</Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={styles.groundingCardDescription}>{groundingTechnique3Desc}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>{resourcesTitle}</Text>

              {/* Veterans Crisis Line — two action buttons */}
              <View style={styles.resourceCard}>
                <View style={styles.resourceCardTop}>
                  <View style={styles.resourceIconContainer}>
                    <IconSymbol
                      ios_icon_name="phone.fill"
                      android_material_icon_name="phone"
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.resourceContent}>
                    <Text style={styles.resourceTitle}>{resource1Title}</Text>
                    <Text style={styles.resourceDescription}>{resource1Desc}</Text>
                  </View>
                </View>
                <View style={styles.resourceActions}>
                  <TouchableOpacity
                    style={styles.resourceActionButton}
                    onPress={handleCallCrisisLine}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="phone.fill"
                      android_material_icon_name="phone"
                      size={14}
                      color={colors.background}
                    />
                    <Text style={styles.resourceActionText}>{resource1ActionCall}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resourceActionButton, styles.resourceActionButtonSecondary]}
                    onPress={handleTextCrisisLine}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="message.fill"
                      android_material_icon_name="message"
                      size={14}
                      color={colors.accent}
                    />
                    <Text style={[styles.resourceActionText, styles.resourceActionTextSecondary]}>{resource1ActionText}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* VA Mental Health */}
              <TouchableOpacity
                style={styles.resourceCard}
                onPress={handleVAMentalHealth}
                activeOpacity={0.7}
              >
                <View style={styles.resourceCardTop}>
                  <View style={styles.resourceIconContainer}>
                    <IconSymbol
                      ios_icon_name="heart.fill"
                      android_material_icon_name="favorite"
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.resourceContent}>
                    <Text style={styles.resourceTitle}>{resource2Title}</Text>
                    <Text style={styles.resourceDescription}>{resource2Desc}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.resourceActions}>
                  <View style={[styles.resourceActionButton, styles.resourceActionButtonOutline]}>
                    <IconSymbol
                      ios_icon_name="safari.fill"
                      android_material_icon_name="open-in-browser"
                      size={14}
                      color={colors.accent}
                    />
                    <Text style={[styles.resourceActionText, styles.resourceActionTextSecondary]}>{resource2Action}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Vet Centers */}
              <TouchableOpacity
                style={styles.resourceCard}
                onPress={handleVetCenters}
                activeOpacity={0.7}
              >
                <View style={styles.resourceCardTop}>
                  <View style={styles.resourceIconContainer}>
                    <IconSymbol
                      ios_icon_name="building.2.fill"
                      android_material_icon_name="business"
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.resourceContent}>
                    <Text style={styles.resourceTitle}>{resource3Title}</Text>
                    <Text style={styles.resourceDescription}>{resource3Desc}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.resourceActions}>
                  <View style={[styles.resourceActionButton, styles.resourceActionButtonOutline]}>
                    <IconSymbol
                      ios_icon_name="map.fill"
                      android_material_icon_name="map"
                      size={14}
                      color={colors.accent}
                    />
                    <Text style={[styles.resourceActionText, styles.resourceActionTextSecondary]}>{resource3Action}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

      </LinearGradient>


    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: colors.accent,
    marginBottom: 24,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 32,
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent + '20',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: FontWeights.medium,
    color: colors.textSecondary,
  },
  groundingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  groundingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groundingCardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  groundingCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.text,
  },
  groundingCardDescription: {
    fontSize: 14,
    fontWeight: FontWeights.medium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  resourceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    minHeight: 64,
  },
  resourceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 13,
    fontWeight: FontWeights.medium,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  resourceActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.accent + '30',
  },
  resourceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resourceActionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  resourceActionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  resourceActionText: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: colors.background,
  },
  resourceActionTextSecondary: {
    color: colors.accent,
  },
  favoriteButton: {
    padding: 8,
    marginRight: 8,
  },
  redFlagButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFavorites: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyFavoritesText: {
    fontSize: 14,
    fontWeight: FontWeights.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
