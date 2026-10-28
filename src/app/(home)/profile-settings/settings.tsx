// profile-settings/settings.tsx — app info + the one destructive maintenance action (PRD §8).
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import MenuRow from '../../../components/ui/MenuRow';
import { ColorSet } from '../../../constants/theme';
import { deleteAllExpenses } from '../../../lib/db';
import { useThemedStyles } from '../../../theme/useThemedStyles';

const version = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const [cleared, setCleared] = useState(false);

  const confirmClear = () => {
    Alert.alert(
      'Clear all expenses?',
      'Every entry stored on this phone will be deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteAllExpenses(db);
              setCleared(true);
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 92 }]}
    >
      <View style={s.group}>
        <MenuRow icon="information-circle-outline" label="Version" value={`v${version}`} />
        <MenuRow icon="phone-portrait-outline" label="Storage" value="On this phone" />
        <MenuRow icon="cloud-offline-outline" label="Sync" value="Off (V1 is offline)" />
      </View>

      <View style={s.group}>
        <MenuRow
          icon="trash-outline"
          label="Clear all expenses"
          destructive
          onPress={confirmClear}
          accessibilityLabel="Clear all expenses"
        />
      </View>

      {cleared && (
        <View style={s.cleared} accessibilityLiveRegion="polite">
          <Text style={s.clearedText}>All expenses cleared.</Text>
        </View>
      )}

      <Text style={s.note}>Spenda V1 — no account, no network, no tracking.</Text>
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
    // warning role: this banner confirms an irreversible destructive action,
    // so it joins the destructive family (errorSoft tint) instead of the teal accent
    cleared: {
      backgroundColor: c.errorSoft,
      borderLeftWidth: 3,
      borderLeftColor: c.warning,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    clearedText: {
      fontSize: 13,
      color: c.text,
    },
    note: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
      paddingTop: 4,
    },
  }));
