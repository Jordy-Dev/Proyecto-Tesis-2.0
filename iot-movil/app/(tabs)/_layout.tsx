import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 5,
        },
        header: () => null,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="home" 
              size={24} 
              color={focused ? color : '#999'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Gráficos',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="bar-chart" 
              size={24} 
              color={focused ? color : '#999'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="time" 
              size={24} 
              color={focused ? color : '#999'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="settings" 
              size={24} 
              color={focused ? color : '#999'} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
