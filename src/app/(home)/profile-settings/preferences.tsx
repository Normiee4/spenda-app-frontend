// profile-settings/preferences.tsx — display preferences V1 actually has (PRD §8).
// Deliberately read-only: every preference here is something the app really uses.
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MenuRow from '../../../components/ui/MenuRow';
import { ColorSet } from '../../../constants/theme';
import { formatPeso } from '../../../lib/parse';
import { formatDayHeader } from '../../../lib/time';
import { useThemedStyles } from '../../../theme/useThemedStyles';

export default function PreferencesScreen() {
  const s = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 92 }]}
    >
      <View style={s.group}>
        <MenuRow icon="cash-outline" label="Currency" value="Philippine Peso (₱)" />
        <MenuRow icon="keypad-outline" label="Amounts" value={formatPeso(123456)} />
        <MenuRow icon="calendar-outline" label="Dates" value={formatDayHeader(new Date())} />
        <MenuRow icon="cloud-offline-outline" label="Network" value="Offline-first" />
      </View>

      <Text style={s.note}>
        V1 keeps these simple on purpose — formats follow your device locale, and everything stays
        on this phone. More preferences arrive after real-use testing.
      </Text>
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
      gap: 16,
    },
    group: {
      gap: 8,
    },
    note: {
      fontSize: 13,
      lineHeight: 19,
      color: c.textMuted,
      paddingHorizontal: 4,
    },
  }));
