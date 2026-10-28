// profile-settings/_layout.tsx — nested stack: hub → Account / Preferences / Theme / Settings / Logout (PRD §8).
import { Stack } from 'expo-router';
import { ColorSet } from '../../../constants/theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';

export default function ProfileSettingsLayout() {
  const s = useStyles();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: s.headerBg },
        headerShadowVisible: false,
        headerTintColor: s.headerTint,
        headerTitleStyle: { color: s.headerTitle },
        contentStyle: { backgroundColor: s.headerBg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="preferences" options={{ title: 'Preferences' }} />
      <Stack.Screen name="theme" options={{ title: 'Theme' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="logout" options={{ title: 'Log out' }} />
    </Stack>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    headerBg: c.background,
    headerTint: c.primary,
    headerTitle: c.text,
  }));
