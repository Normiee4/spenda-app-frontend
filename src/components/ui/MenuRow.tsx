import { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorSet } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  /** Right-aligned muted text (current value); omitted for plain nav rows. */
  value?: string;
  /** Present → tappable row with chevron; absent → informational row. */
  onPress?: () => void;
  destructive?: boolean;
  accessibilityLabel?: string;
};

export default function MenuRow({ icon, label, value, onPress, destructive, accessibilityLabel }: Props) {
  const s = useStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [s.row, pressed && onPress ? s.pressed : null]}
    >
      <View style={[s.iconWrap, destructive && s.iconWrapDanger]}>
        <Ionicons name={icon} size={18} color={destructive ? s.dangerColor : s.iconColor} />
      </View>
      <Text style={[s.label, destructive && s.labelDanger]} numberOfLines={1}>
        {label}
      </Text>
      {value ? <Text style={s.value}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={s.chevron} /> : null}
    </Pressable>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    row: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.divider,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    pressed: {
      opacity: 0.7,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapDanger: {
      backgroundColor: c.errorSoft,
    },
    iconColor: c.primary,
    dangerColor: c.error,
    label: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: c.text,
    },
    labelDanger: {
      color: c.error,
    },
    value: {
      fontSize: 14,
      color: c.textMuted,
      fontVariant: ['tabular-nums'],
    },
    chevron: c.textFaint,
  }));
