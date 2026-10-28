import { FlatList, Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '../ui/Skeleton';
import { ColorSet } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { Expense } from '../../lib/db';
import { formatPeso } from '../../lib/parse';
import { formatDayHeader, formatTime } from '../../lib/time';

/** Hide the inline "- Category" suffix; the meta line already names it. */
function rawWithoutCategory(entry: Expense): string {
  const raw = entry.raw_text.trim();
  const dash = raw.lastIndexOf('-');
  if (dash === -1) return raw;
  const suffix = raw.slice(dash + 1).trim();
  return suffix.toLowerCase() === entry.category.toLowerCase()
    ? raw.slice(0, dash).trim()
    : raw;
}

type Props = {
  entries: Expense[];
  totalCentavos: number;
  editingId: number | null;
  loading: boolean;
  onPressEntry: (entry: Expense) => void;
  onDeleteEntry: (entry: Expense) => void;
};

export default function TodayList({
  entries,
  totalCentavos,
  editingId,
  loading,
  onPressEntry,
  onDeleteEntry,
}: Props) {
  const s = useStyles();

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <View>
          <Text style={s.title} accessibilityRole="header">
            Today
          </Text>
          <Text style={s.date}>{formatDayHeader(new Date())}</Text>
        </View>
        {loading ? (
          <Skeleton width={78} height={26} radius={8} />
        ) : (
          <Text style={s.total}>{formatPeso(totalCentavos)}</Text>
        )}
      </View>

      {loading ? (
        <View style={s.list} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {[0, 1, 2].map((i) => (
            <View key={i} style={s.row}>
              <View style={s.rowLeft}>
                <Skeleton width="55%" height={15} />
                <Skeleton width="35%" height={11} />
              </View>
              <Skeleton width={52} height={16} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="documents-outline" size={22} color={s.emptyIcon} />
              <Text style={s.emptyText}>No expenses logged today.</Text>
            </View>
          }
          renderItem={({ item }) => (
          <Swipeable
            overshootLeft={false}
            overshootRight={false}
            onSwipeableOpen={() => onDeleteEntry(item)}
            renderRightActions={() => (
              <Pressable
                onPress={() => onDeleteEntry(item)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.raw_text.trim()}`}
                style={({ pressed }) => [s.deleteAction, pressed && s.pressedDelete]}
              >
                <Ionicons name="trash-outline" size={20} color="#FFF" />
                <Text style={s.deleteText}>Delete</Text>
              </Pressable>
            )}
          >
            <Pressable
              onPress={() => onPressEntry(item)}
              accessibilityRole="button"
              accessibilityLabel={`Edit entry ${item.raw_text.trim()}`}
              style={({ pressed }) => [
                s.row,
                item.id === editingId && s.rowEditing,
                pressed && s.pressedRow,
              ]}
            >
              <View style={s.rowLeft}>
                <Text style={s.rowRaw} numberOfLines={2}>
                  {rawWithoutCategory(item)}
                </Text>
                <Text style={s.rowMeta}>
                  {item.category} · {formatTime(item.created_at)}
                </Text>
              </View>
              <Text style={s.rowAmount}>{formatPeso(item.amount_centavos)}</Text>
            </Pressable>
          </Swipeable>
          )}
        />
      )}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    wrap: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: 4,
      paddingBottom: 8,
      gap: 12,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
    },
    date: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 2,
    },
    total: {
      fontSize: 24,
      fontWeight: '700',
      color: c.primary,
      fontVariant: ['tabular-nums'],
    },
    list: {
      gap: 8,
      paddingBottom: 8,
    },
    empty: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 28,
    },
    emptyIcon: c.textFaint,
    emptyText: {
      fontSize: 14,
      color: c.textMuted,
    },
    row: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.divider,
      paddingVertical: 10,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
    },
    rowEditing: {
      borderColor: c.primary,
      borderWidth: 2,
    },
    pressedRow: {
      opacity: 0.7,
    },
    rowLeft: {
      flex: 1,
      gap: 2,
    },
    rowRaw: {
      fontSize: 15,
      lineHeight: 20,
      color: c.text,
    },
    rowMeta: {
      fontSize: 12,
      color: c.textMuted,
    },
    rowAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    deleteAction: {
      backgroundColor: c.error,
      borderRadius: 14,
      marginLeft: 8,
      width: 76,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    pressedDelete: {
      opacity: 0.8,
    },
    deleteText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
    },
  }));
