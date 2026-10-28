import { Text, View } from 'react-native';
import { ColorSet } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

const FACTS = [
  'One line = one expense. Amount first or last — both work.',
  'Hit return without a category and the chips open until you pick one.',
  'Write as many lines as you like, then save them all at once.',
] as const;

export default function DemoScreen() {
  const s = useStyles();
  return (
    <View style={s.wrap}>
      <View style={s.pad}>
        <Text style={s.line}>
          45 Jeep <Text style={s.suffix}>- Commute</Text>
        </Text>
        <Text style={s.line}>
          Snack 20 <Text style={s.suffix}>- Food</Text>
        </Text>
        <View style={s.gate}>
          <Text style={s.gateHint}>pick a category to continue →</Text>
          <View style={s.chips}>
            <View style={[s.chip, s.chipActive]}>
              <Text style={s.chipActiveText}>Food</Text>
            </View>
            <View style={s.chip}>
              <Text style={s.chipText}>Drinks</Text>
            </View>
            <View style={s.chip}>
              <Text style={s.chipText}>Leisure</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={s.facts}>
        {FACTS.map((fact) => (
          <View key={fact} style={s.factRow}>
            <View style={s.bullet} />
            <Text style={s.factText}>{fact}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    wrap: { gap: 24 },
    pad: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      gap: 8,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
    },
    line: {
      fontSize: 17,
      lineHeight: 24,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    suffix: {
      color: c.primary,
      fontWeight: '600',
    },
    gate: {
      marginTop: 6,
      gap: 8,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.divider,
    },
    gateHint: {
      fontSize: 13,
      color: c.textMuted,
    },
    chips: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.divider,
    },
    chipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textMuted,
    },
    chipActiveText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.onPrimary,
    },
    facts: { gap: 12 },
    factRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: c.accent,
      marginTop: 7,
    },
    factText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 21,
      color: c.text,
    },
  }));
