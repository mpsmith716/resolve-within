import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

function PanicTabButton({ onPress, accessibilityState }: any) {
  const selected = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.panicTabSlot}
    >
      <View style={[styles.panicButton, selected && styles.panicButtonActive]}>
        <Ionicons name="warning" size={28} color="#fff" />
      </View>
      <Text style={styles.panicLabel}>Panic</Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="panic"
        options={{
          title: 'Panic',
          tabBarButton: (props) => <PanicTabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="veterans"
        options={{
          title: 'Veterans',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
tabBar: {
  backgroundColor: '#0B1220',
  borderTopColor: '#1F2937',
  height: Platform.OS === 'ios' ? 92 : 94,   // ⬅️ tiny bump
  paddingBottom: Platform.OS === 'ios' ? 14 : 30, // ⬅️ just a hair more
  paddingTop: 8,
},
  tabBarItem: {
    flex: 1,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  panicTabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
  },
  panicButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#111827',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  panicButtonActive: {
    transform: [{ scale: 1.04 }],
  },
  panicLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
});