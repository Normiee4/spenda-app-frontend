// profile-settings/index.tsx — the profile hub (PRD §8 navigation).
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import MenuRow from '../../../components/ui/MenuRow';
import Skeleton from '../../../components/ui/Skeleton';
import { ColorSet } from '../../../constants/theme';
import { DEFAULT_PROFILE, prefs, Profile } from '../../../lib/prefs';
import { useTheme } from '../../../theme/ThemeProvider';
import { useThemedStyles } from '../../../theme/useThemedStyles';

const MODE_LABEL = { light: 'Light', dark: 'Dark', system: 'System' } as const;

export default function ProfileHub() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      prefs.getProfile().then((p) => {
        if (!alive) return;
        setProfile(p);
        setLoading(false);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const initial = profile.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 92 }]}
    >
      <View style={s.card}>
        {loading ? (
          <>
            <Skeleton width={60} height={60} radius={999} />
            <View style={s.identity}>
              <Skeleton width={140} height={20} />
              <Skeleton width={190} height={13} />
            </View>
          </>
        ) : (
          <>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={s.identity}>
              <Text accessibilityRole="header" style={s.name} numberOfLines={1}>
                {profile.name || 'Your profile'}
              </Text>
              <Text style={s.email} numberOfLines={1}>
                {profile.email || 'No email set'}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={s.group}>
        <MenuRow
          icon="person-circle-outline"
          label="Account"
          onPress={() => router.push('/(home)/profile-settings/account')}
        />
        <MenuRow
          icon="options-outline"
          label="Preferences"
          onPress={() => router.push('/(home)/profile-settings/preferences')}
        />
        <MenuRow
          icon="contrast-outline"
          label="Theme"
          value={MODE_LABEL[mode]}
          onPress={() => router.push('/(home)/profile-settings/theme')}
        />
        <MenuRow
          icon="settings-outline"
          label="Settings"
          onPress={() => router.push('/(home)/profile-settings/settings')}
        />
      </View>

      <View style={s.group}>
        <MenuRow
          icon="log-out-outline"
          label="Logout"
          destructive
          onPress={() => router.push('/(home)/profile-settings/logout')}
        />
      </View>
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
      gap: 20,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.divider,
      padding: 16,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 999,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 26,
      fontWeight: '700',
      color: c.onPrimary,
    },
    identity: {
      flex: 1,
      gap: 2,
    },
    name: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    email: {
      fontSize: 14,
      color: c.textMuted,
    },
    group: {
      gap: 8,
    },
  }));
