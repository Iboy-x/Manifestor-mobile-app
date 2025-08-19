import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';
import { useFonts } from 'expo-font';
import React from 'react';

// Explicitly preload vector icon fonts to ensure icons render everywhere
const featherTtf = require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf');
const materialIconsTtf = require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf');

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Feather: featherTtf,
    MaterialIcons: materialIconsTtf,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
