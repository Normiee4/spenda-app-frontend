import { useMemo } from 'react';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { ColorSet } from '../constants/theme';
import { useTheme } from './ThemeProvider';

/**
 * Factory result: RN style objects, plus raw strings used directly as
 * icon/text colors (one bag, so callers don't juggle two hook returns).
 */
type StyleBag = Record<string, ViewStyle | TextStyle | ImageStyle | string>;

/**
 * Memoized StyleSheet bound to the active palette.
 * `make` runs only when the resolved colors change (theme/mode switch).
 * `isDark` is passed for values the palette alone can't express (shadow hues).
 * Returns `T` unwrapped (no StyleProp) so color strings stay plain strings.
 */
export function useThemedStyles<T extends StyleBag>(
  make: (colors: ColorSet, isDark: boolean) => T,
): T {
  const { colors, isDark } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `make` is an intentionally inline factory; the memo is keyed on the active palette.
  return useMemo(() => StyleSheet.create(make(colors, isDark) as any) as T, [colors, isDark]);
}
