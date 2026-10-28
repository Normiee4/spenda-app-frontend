// profile-settings/account.tsx — view/edit name + email (persisted in AsyncStorage, PRD §8).
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import { showToast } from '../../../components/ui/Toast';
import { ColorSet } from '../../../constants/theme';
import { prefs } from '../../../lib/prefs';
import { useThemedStyles } from '../../../theme/useThemedStyles';

export default function AccountScreen() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    prefs.getProfile().then((p) => {
      if (!alive) return;
      setName(p.name);
      setEmail(p.email);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name cannot be empty.');
      return;
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail && !trimmedEmail.includes('@')) {
      setError('Email needs an "@" — or leave it empty.');
      return;
    }
    setBusy(true);
    try {
      await prefs.setProfile({ name: trimmedName, email: trimmedEmail });
      showToast({ message: 'Profile saved.' });
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={s.page}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 92 }]}
    >
      {loading ? (
        <>
          <View style={s.field}>
            <Skeleton width={54} height={12} />
            <Skeleton width="100%" height={46} radius={12} />
          </View>
          <View style={s.field}>
            <Skeleton width={54} height={12} />
            <Skeleton width="100%" height={46} radius={12} />
          </View>
          <Skeleton width="100%" height={48} radius={12} />
        </>
      ) : (
        <>
      <View style={s.field}>
        <Text style={s.label} accessibilityRole="text">
          Name
        </Text>
        <TextInput
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(null);
          }}
          style={s.input}
          placeholder="Your name"
          placeholderTextColor={s.placeholder}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      <View style={s.field}>
        <Text style={s.label} accessibilityRole="text">
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError(null);
          }}
          style={s.input}
          placeholder="you@example.com"
          placeholderTextColor={s.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>

      {error && (
        <View style={s.error} accessibilityRole="alert">
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      <Button
        title="Save changes"
        onPress={() => void onSave()}
        disabled={busy || loading}
        variant="accent"
        full
      />
        </>
      )}
      <Text style={s.note}>Profile stays on this phone — nothing is uploaded.</Text>
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
    field: {
      gap: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.divider,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: c.text,
    },
    placeholder: c.textFaint,
    error: {
      backgroundColor: c.errorSoft,
      borderLeftWidth: 3,
      borderLeftColor: c.error,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    errorText: {
      fontSize: 13,
      color: c.error,
    },
    note: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
    },
  }));
