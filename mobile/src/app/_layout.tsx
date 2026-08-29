import { Stack } from "expo-router";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { ActivityIndicator, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useEffect, useState } from "react";

import { paperTheme } from "../constants/paper-theme";
import { restoreAuthSession } from "../lib/auth-session";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  'props.pointerEvents is deprecated',
  '`useNativeDriver` is not supported',
]);

if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && (
      msg.includes('"shadow*" style props are deprecated') ||
      msg.includes('props.pointerEvents is deprecated') ||
      msg.includes('`useNativeDriver` is not supported')
    )) {
      return;
    }
    originalWarn(...args);
  };
}

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { GlobalToast } from '../components/global-toast';

const STACK_SCREEN_OPTIONS = { headerShown: false, animation: 'none' } as const;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    restoreAuthSession()
      .catch(() => {})
      .finally(() => {
        if (mounted) {
          setSessionReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!fontsLoaded || !sessionReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <Stack screenOptions={STACK_SCREEN_OPTIONS} />
        <GlobalToast />
      </PaperProvider>
    </QueryClientProvider>
  );
}
