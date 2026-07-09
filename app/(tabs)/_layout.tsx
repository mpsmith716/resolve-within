
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      materialIcon: 'home',
      sfSymbol: 'house.fill',
      label: 'Home',
    },
    {
      name: 'journal',
      route: '/(tabs)/(home)/?tab=journal',
      materialIcon: 'book',
      sfSymbol: 'book.fill',
      label: 'Journal',
    },
    {
      name: 'panic',
      route: '/panic',
      materialIcon: 'warning',
      sfSymbol: 'exclamationmark.triangle.fill',
      label: 'Panic',
      isPanic: true,
    },
    {
      name: 'veterans',
      route: '/(tabs)/veterans',
      materialIcon: 'military-tech',
      sfSymbol: 'shield.lefthalf.filled',
      label: 'Veterans',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      materialIcon: 'person',
      sfSymbol: 'person.crop.circle.fill',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen 
          key="home" 
          name="(home)" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          key="veterans" 
          name="veterans" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          key="profile" 
          name="profile" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
