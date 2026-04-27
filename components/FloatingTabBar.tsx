
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';
import { FontWeights } from '@/utils/fontHelpers';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

// Tab names that require authentication
const PROTECTED_TAB_NAMES = ['journal', 'veterans', 'profile'];

// Map tab name to auth context param
const TAB_AUTH_CONTEXT: Record<string, string> = {
  journal: 'journal',
  veterans: 'veteran',
  profile: 'profile',
};

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  isPanic?: boolean;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { user } = useAuth();

  // Improved active tab detection
  const getActiveTabIndex = () => {
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;

      if (pathname === tab.route) {
        score = 100;
      } else if (pathname.startsWith(tab.route as string)) {
        score = 80;
      } else if (pathname.includes(tab.name)) {
        score = 60;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    return bestMatch >= 0 ? bestMatch : 0;
  };

  const activeTabIndex = getActiveTabIndex();

  const handleTabPress = (tab: TabBarItem) => {
    const isProtected = PROTECTED_TAB_NAMES.includes(tab.name);
    console.log('Tab pressed:', tab.name, '| protected:', isProtected, '| authenticated:', !!user);

    if (isProtected && !user) {
      const context = TAB_AUTH_CONTEXT[tab.name] ?? tab.name;
      console.log('[Auth Guard] Redirecting unauthenticated user to auth, context:', context);
      router.replace(`/auth?context=${context}` as any);
      return;
    }

    router.push(tab.route);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.tabBar}>
          {tabs.map((tab, index) => {
            const isActive = activeTabIndex === index;
            const isPanic = tab.isPanic === true;

            if (isPanic) {
              return (
                <View key={index} style={styles.panicButtonContainer}>
                  <TouchableOpacity
                    style={styles.panicButton}
                    onPress={() => handleTabPress(tab)}
                    activeOpacity={0.8}
                  >
                    <IconSymbol
                      android_material_icon_name="warning"
                      ios_icon_name="exclamationmark.triangle.fill"
                      size={32}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                  <Text style={styles.panicLabel}>{tab.label}</Text>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={index}
                style={styles.tab}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <IconSymbol
                    android_material_icon_name={tab.icon}
                    ios_icon_name={tab.icon}
                    size={26}
                    color={isActive ? colors.accent : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
  },
  container: {
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 85,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: colors.card,
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minWidth: 60,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: FontWeights.bold,
  },
  panicButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -35,
    minWidth: 80,
  },
  panicButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#CC0000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 5,
    borderColor: colors.card,
  },
  panicLabel: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: '#CC0000',
    marginTop: 8,
    textAlign: 'center',
  },
});
