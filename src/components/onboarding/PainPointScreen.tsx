import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorSet } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

const POINTS = [
  { icon: 'flash-outline', text: 'Jot several expenses in one sitting — no forms, no dropdowns.' },
  { icon: 'cloud-offline-outline', text: 'Works with zero network. Your data never leaves the phone.' },
  { icon: 'timer-outline', text: 'A line, a category, done. Under 5 seconds per entry.' },
] as const;

export default function PainPointScreen() {
  const s = useStyles();
  return (
    <View style={s.wrap}>
      <Text style={s.lead}>Logging dies when it is a chore.</Text>
      <View style={s.list}>
        {POINTS.map((p) => (
          <View key={p.icon} style={s.row}>
            <View style={s.iconWrap}>
              <Ionicons name={p.icon} size={20} color={s.iconColor} />
            </View>
            <Text style={s.rowText}>{p.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    iconColor: c.primary,
    lead: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600',
      color: c.text,
      textAlign: 'center',
    },
    wrap: { gap: 24 },
    list: { gap: 14 },
    row: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 14,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 21,
      color: c.text,
      paddingTop: 7,
    },
  }));
