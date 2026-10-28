// app/index.tsx
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { prefs } from '../lib/prefs';
import { useTheme } from '../theme/ThemeProvider';

// The first-time vs returning decision lives here (the anchor route),
// read from AsyncStorage so it survives force-close (PRD §10).
export default function IndexScreen() {
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    let alive = true;
    prefs.getOnboarded().then((value) => {
      if (!alive) return;
      setOnboarded(value);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Brief gate: a neutral frame in the active background (never a wrong redirect).
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return <Redirect href={onboarded ? '/(home)/Log' : '/onboarding'} />;
}
