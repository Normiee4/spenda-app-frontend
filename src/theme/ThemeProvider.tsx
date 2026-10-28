import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme, View } from 'react-native';
import { ColorSet, palettes, PaletteMode } from '../constants/theme';
import { prefs, ThemeMode } from '../lib/prefs';

type ThemeContextValue = {
  colors: ColorSet;
  mode: ThemeMode;
  resolved: PaletteMode;
  isDark: boolean;
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  // Load the persisted mode once; children wait (ready) so there is no flash
  // of the wrong palette on a cold start with dark chosen.
  useEffect(() => {
    let alive = true;
    prefs.getThemeMode().then((stored) => {
      if (!alive) return;
      setModeState(stored);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void prefs.setThemeMode(next);
  }, []);

  const resolved: PaletteMode =
    mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: palettes[resolved],
      mode,
      resolved,
      isDark: resolved === 'dark',
      ready,
      setMode,
    }),
    [resolved, mode, ready, setMode],
  );

  // Hold the frame in the system palette until the stored mode lands, so a
  // cold start with dark chosen never flashes light (comment above kept true).
  if (!ready) {
    const boot: PaletteMode = system === 'dark' ? 'dark' : 'light';
    return <View style={{ flex: 1, backgroundColor: palettes[boot].background }} />;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
