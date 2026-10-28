import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorSet } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { DayGroup, entryLabel } from '../../lib/history';
import { formatPeso } from '../../lib/parse';
import { formatDateWithYear, formatTime } from '../../lib/time';

type Props = {
  group: DayGroup;
  expanded: boolean;
  onToggle: (dayStart: number) => void;
};

export default function HistoryDayCard({ group, expanded, onToggle }: Props) {
  const s = useStyles();
  const preview = expanded ? group.entries : group.entries.slice(0, 2);
  const hiddenEntries = group.entries.length - preview.length;
  const categories = expanded ? group.categories : group.categories.slice(0, 3);
  const hiddenCategories = group.categories.length - categories.length;
  const date = formatDateWithYear(group.dayStart);

  return (
    <Pressable
      onPress={() => onToggle(group.dayStart)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${date}, total ${formatPeso(group.totalCentavos)}, ${entryLabel(
        group.count,
      )}`}
      accessibilityHint={expanded ? 'Collapse this day' : 'Show every entry for this day'}
      style={({ pressed }) => [s.card, pressed && s.pressed]}
    >
      <View style={s.header}>
        <View>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.total}>{formatPeso(group.totalCentavos)}</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.count}>{entryLabel(group.count)}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={s.chevron}
          />
        </View>
      </View>

      {categories.length > 0 && (
        <View style={s.categories}>
          {categories.map((cat) => (
            <View key={cat.category} style={s.categoryChip}>
              <Text style={s.categoryName}>{cat.category}</Text>
              <Text style={s.categoryTotal}>{formatPeso(cat.totalCentavos)}</Text>
            </View>
          ))}
          {hiddenCategories > 0 && (
            <Text style={s.moreCategories}>+{hiddenCategories} more</Text>
          )}
        </View>
      )}

      <View style={s.rule} />

      <View style={s.entries}>
        {preview.map((entry) => (
          <View key={entry.id} style={s.entryRow}>
            <View style={s.entryLeft}>
              <Text style={s.entryRaw} numberOfLines={1}>
                {entry.raw_text.trim()}
              </Text>
              <Text style={s.entryMeta}>
                {entry.category} · {formatTime(entry.created_at)}
              </Text>
            </View>
            <Text style={s.entryAmount}>{formatPeso(entry.amount_centavos)}</Text>
          </View>
        ))}

        {hiddenEntries > 0 && (
          <View style={s.moreRow}>
            <Text style={s.moreText} numberOfLines={1}>
              … +{hiddenEntries} more
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.divider,
      padding: 16,
      gap: 12,
    },
    pressed: {
      opacity: 0.8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    totalLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    total: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      fontVariant: ['tabular-nums'],
      marginTop: 2,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: 4,
    },
    count: {
      fontSize: 13,
      color: c.textMuted,
    },
    chevron: c.textMuted,
    categories: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.background,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.divider,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    categoryName: {
      fontSize: 12,
      fontWeight: '500',
      color: c.textMuted,
    },
    categoryTotal: {
      fontSize: 12,
      fontWeight: '700',
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    moreCategories: {
      fontSize: 12,
      color: c.textMuted,
    },
    rule: {
      height: 1,
      backgroundColor: c.divider,
    },
    entries: {
      gap: 10,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    entryLeft: {
      flex: 1,
      gap: 2,
    },
    entryRaw: {
      fontSize: 14,
      color: c.text,
    },
    entryMeta: {
      fontSize: 12,
      color: c.textMuted,
    },
    entryAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    moreRow: {
      paddingTop: 2,
    },
    moreText: {
      fontSize: 13,
      color: c.textMuted,
    },
  }));
