// profile-settings/logout.tsx — explicit confirm step: identity cleared, expenses kept (PRD §3/§8).
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Button from '../../../components/ui/Button';
import { ColorSet } from '../../../constants/theme';
import { prefs } from '../../../lib/prefs';
import { useThemedStyles } from '../../../theme/useThemedStyles';

export default function LogoutScreen() {
  const s = useStyles();
  const insets = useSafeAreaInsets();

  const onLogout = async () => {
    await prefs.clearIdentity();
    router.replace('/onboarding');
  };

  return (
    <View style={[s.page, { paddingBottom: insets.bottom + 92 }]}>
      <View style={s.body}>
        <View style={s.iconWrap}>
          <Ionicons name="log-out-outline" size={30} color={s.iconColor} />
        </View>
        <Text style={s.title}>Log out?</Text>
        <Text style={s.text}>
          Your profile resets and you land back in onboarding. Your theme choice and every expense
          you logged stay on this phone.
        </Text>
      </View>

      <View style={s.actions}>
        <Button title="Log out" variant="danger" onPress={() => void onLogout()} full />
        <Button title="Stay logged in" onPress={() => router.back()} full />
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    page: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 24,
      paddingTop: 24,
      justifyContent: 'space-between',
    },
    body: {
      alignItems: 'center',
      gap: 12,
      paddingTop: 32,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 999,
      backgroundColor: c.errorSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    iconColor: c.error,
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
    },
    text: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textMuted,
      textAlign: 'center',
      maxWidth: 320,
    },
    actions: {
      gap: 10,
    },
  }));
