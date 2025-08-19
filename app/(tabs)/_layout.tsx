import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Dimensions } from 'react-native';


const { width: screenWidth } = Dimensions.get('window');

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#18181b',
          height: 80,
          elevation: 0,
          boxShadow: 'none',
          borderTopWidth: 1,
          borderTopColor: '#232326',
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: 64,
          width: screenWidth / 5,
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
        tabBarActiveTintColor: '#ffd600',
        tabBarInactiveTintColor: '#b3b3b3',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="home"
              size={22}
              color={focused ? '#ffd600' : '#b3b3b3'}
              style={focused ? {
                transform: [{ scale: 1.1 }]
              } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dreams"
        options={{
          title: 'Dreams',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="target"
              size={22}
              color={focused ? '#ffd600' : '#b3b3b3'}
              style={focused ? {
                transform: [{ scale: 1.1 }]
              } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reflections"
        options={{
          title: 'Reflections',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="book-open"
              size={22}
              color={focused ? '#ffd600' : '#b3b3b3'}
              style={focused ? {
                transform: [{ scale: 1.1 }]
              } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="bar-chart-2"
              size={22}
              color={focused ? '#ffd600' : '#b3b3b3'}
              style={focused ? {
                transform: [{ scale: 1.1 }]
              } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="settings"
              size={22}
              color={focused ? '#ffd600' : '#b3b3b3'}
              style={focused ? {
                transform: [{ scale: 1.1 }]
              } : {}}
            />
          ),
        }}
      />
    </Tabs>
  );
}
