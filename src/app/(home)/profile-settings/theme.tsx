// profile-settings/theme.tsx — Light / Dark / System, applied live + persisted (PRD §8 done criteria).
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ColorSet } from '../../../constants/theme';
import { ThemeMode } from '../../../lib/prefs';
import { useTheme } from '../../../theme/ThemeProvider';
import { useThemedStyles } from '../../../theme/useThemedStyles';

type Option = {
  mode: ThemeMode;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  caption: string;
};

const OPTIONS: Option[] = [
  { mode: 'light', icon: 'sunny-outline', title: 'Light', caption: 'Bright surfaces, dark text' },
  { mode: 'dark', icon: 'moon-outline', title: 'Dark', caption: 'Easy on the eyes at night' },
  { mode: 'system', icon: 'phone-portrait-outline', title: 'System', caption: 'Match your device setting' },
];

export default function ThemeScreen() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useTheme();

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 92 }]}
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.mode;
        return (
          <Pressable
            key={opt.mode}
            onPress={() => setMode(opt.mode)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt.title} theme`}
            style={({ pressed }) => [s.option, active && s.optionActive, pressed && s.pressed]}
          >
            <View style={[s.iconWrap, active && s.iconWrapActive]}>
              <Ionicons
                name={opt.icon}
                size={20}
                color={active ? s.iconActive : s.iconIdle}
              />
            </View>
            <View style={s.labels}>
              <Text style={[s.title, active && s.titleActive]}>{opt.title}</Text>
              <Text style={s.caption}>{opt.caption}</Text>
            </View>
            {active && <Ionicons name="checkmark-circle" size={22} color={s.check} />}
          </Pressable>
        );
      })}

      <Text style={s.note}>Your choice is remembered across restarts.</Text>
    </ScrollView>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    page: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 10,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.divider,
      paddingVertical: 14,
      paddingHorizontal: 14,
      minHeight: 64,
    },
    optionActive: {
      borderColor: c.primary,
      borderWidth: 2,
      paddingVertical: 13, // keep height with the thicker border
    },
    pressed: {
      opacity: 0.75,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: c.primary,
    },
    iconIdle: c.textMuted,
    iconActive: c.onPrimary,
    labels: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
    titleActive: {
      color: c.primary,
    },
    caption: {
      fontSize: 13,
      color: c.textMuted,
    },
    check: c.primary,
    note: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
      paddingTop: 6,
    },
  }));
