import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { ToastViewport } from '../components/ui/Toast';
import { migrateDb } from '../lib/db';

/** Status-bar glyphs follow the in-app palette, not just the OS scheme. */
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

// Root navigator: providers live here, screens are configured below.
// The first-time vs returning decision lives in app/index.tsx (the anchor route),
// not here — no useSegments, no redirect effects.
export default function RootLayout() {
  return (
    // Swipeable (today list) requires a gesture root; theme + db are app-wide.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SQLiteProvider databaseName="spenda.db" onInit={migrateDb}>
          {/* host frame so the toast overlay always sizes against the full screen */}
          <View style={{ flex: 1 }}>
            <ThemedStatusBar />
            <Stack screenOptions={{ headerShown: true }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(home)" options={{ headerShown: false }} />
            </Stack>
            <ToastViewport />
          </View>
        </SQLiteProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
