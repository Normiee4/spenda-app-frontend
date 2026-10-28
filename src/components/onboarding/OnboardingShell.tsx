import { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../ui/Button';
import { ColorSet } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

export const ONBOARDING_STEPS = 3;

type ShellProps = {
  step: number;
  title: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  onBack?: () => void;
  onSkip?: () => void;
};

export default function OnboardingShell({
  step,
  title,
  children,
  primaryLabel,
  onPrimary,
  onBack,
  onSkip,
}: ShellProps) {
  const s = useStyles();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.top}>
        <View
          style={s.dots}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Step ${step + 1} of ${ONBOARDING_STEPS}`}
        >
          {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
            <View key={i} style={[s.dot, i === step && s.dotActive]} />
          ))}
        </View>
        {onSkip && (
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            hitSlop={8}
            style={({ pressed }) => [s.skip, pressed && s.pressed]}
          >
            <Text style={s.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={s.content}
        contentContainerStyle={s.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <Text accessibilityRole="header" style={s.title}>
          {title}
        </Text>
        <View style={s.body}>{children}</View>
      </ScrollView>

      <View style={s.footer}>
        {onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
          >
            <Text style={s.back}>Back</Text>
          </Pressable>
        )}
        <Button title={primaryLabel} onPress={onPrimary} full />
      </View>
    </SafeAreaView>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    safe: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 24,
    },
    top: {
      minHeight: 44,
      paddingTop: 8,
      justifyContent: 'center',
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
    },
    skip: {
      position: 'absolute',
      right: 0,
      top: 0,
      minHeight: 44,
      paddingHorizontal: 8,
      justifyContent: 'center',
    },
    skipText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textMuted,
    },
    pressed: {
      opacity: 0.6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: c.surface,
    },
    dotActive: {
      backgroundColor: c.primary,
      width: 20,
    },
    content: {
      flex: 1,
    },
    contentInner: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: 24,
      paddingVertical: 16,
    },
    title: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      flexWrap: 'wrap',
    },
    body: {
      gap: 16,
    },
    footer: {
      gap: 12,
      paddingBottom: 16,
      flexDirection: 'column',
    },
    backBtn: {
      alignSelf: 'center',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    back: {
      fontSize: 15,
      fontWeight: '500',
      color: c.textMuted,
    },
  }));
