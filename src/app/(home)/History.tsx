// app/(home)/History.tsx — scrollable log grouped by day (History tab).
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import HistoryDayCard from '../../components/history/HistoryDayCard';
import Skeleton from '../../components/ui/Skeleton';
import { ColorSet } from '../../constants/theme';
import {
  Expense,
  allExpenses,
  expensesBetween,
} from '../../lib/db';
import { DayGroup, entryLabel, groupExpensesByDay, sumExpenses } from '../../lib/history';
import { formatPeso } from '../../lib/parse';
import {
  addDays,
  addMonths,
  formatDividerDate,
  startOfMonth,
  startOfWeek,
} from '../../lib/time';
import { useThemedStyles } from '../../theme/useThemedStyles';

type Period = 'week' | 'month' | 'all';

const PERIODS: { key: Period; label: string; scope: string; empty: string }[] = [
  { key: 'week', label: 'Week', scope: 'This week', empty: 'No expenses this week.' },
  { key: 'month', label: 'Month', scope: 'This month', empty: 'No expenses this month.' },
  { key: 'all', label: 'All', scope: 'All time', empty: 'No expenses logged yet.' },
];

type DaySection = { group: DayGroup; data: DayGroup[] };

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const s = useStyles();

  const [period, setPeriod] = useState<Period>('week');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const now = Date.now();
      let rows: Expense[];
      if (period === 'week') {
        rows = await expensesBetween(db, startOfWeek(now), addDays(startOfWeek(now), 7));
      } else if (period === 'month') {
        rows = await expensesBetween(db, startOfMonth(now), addMonths(startOfMonth(now), 1));
      } else {
        rows = await allExpenses(db);
      }
      setExpenses(rows);
    } catch {
      setExpenses([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [db, period]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const groups = useMemo(() => groupExpensesByDay(expenses), [expenses]);
  const total = useMemo(() => sumExpenses(expenses), [expenses]);
  const sections = useMemo<DaySection[]>(
    () => groups.map((group) => ({ group, data: [group] })),
    [groups],
  );

  const active = PERIODS.find((p) => p.key === period) ?? PERIODS[0];

  const toggle = useCallback((dayStart: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(dayStart)) next.delete(dayStart);
      else next.add(dayStart);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text accessibilityRole="header" style={s.h1}>
          History
        </Text>
      </View>

      <View style={s.toggle}>
        {PERIODS.map((option) => {
          const selected = option.key === period;
          return (
            <Pressable
              key={option.key}
              onPress={() => setPeriod(option.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Show ${option.label.toLowerCase()} history`}
              style={({ pressed }) => [
                s.toggleItem,
                selected && s.toggleItemActive,
                pressed && s.pressed,
              ]}
            >
              <Text style={[s.toggleText, selected && s.toggleTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.scopeRow}>
        <Text style={s.scopeLabel}>{active.scope}</Text>
        {loading ? (
          <Skeleton width={104} height={24} />
        ) : (
          <Text style={s.scopeTotal}>{formatPeso(total.totalCentavos)}</Text>
        )}
      </View>
      {loading ? (
        <Skeleton width={70} height={12} style={s.scopeMetaSkeleton} />
      ) : (
        <Text style={s.scopeMeta}>{entryLabel(total.count)}</Text>
      )}

      {loading ? (
        <ScrollView
          style={s.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 92 }]}
        >
          {[0, 1, 2].map((i) => (
            <View key={i}>
              <View style={s.sectionHeader}>
                <View style={s.dividerLine} />
                <Skeleton width={128} height={12} />
                <View style={s.dividerLine} />
              </View>
              <View style={s.cardWrap}>
                <View style={s.skeletonCard}>
                  <View style={s.skeletonHeader}>
                    <View style={s.skeletonHeaderLeft}>
                      <Skeleton width={46} height={10} />
                      <Skeleton width={104} height={22} />
                    </View>
                    <Skeleton width={64} height={13} />
                  </View>
                  <View style={s.skeletonChips}>
                    <Skeleton width={92} height={24} radius={999} />
                    <Skeleton width={84} height={24} radius={999} />
                    <Skeleton width={74} height={24} radius={999} />
                  </View>
                  <View style={s.rule} />
                  <Skeleton width="72%" height={14} />
                  <Skeleton width="58%" height={14} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.dayStart)}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          style={s.list}
          contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 92 }]}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <View style={s.dividerLine} />
              <Text style={s.sectionDate} numberOfLines={1}>
                {formatDividerDate(section.group.dayStart)}
              </Text>
              <View style={s.dividerLine} />
            </View>
          )}
          renderItem={({ item }) => (
            <View style={s.cardWrap}>
              <HistoryDayCard
                group={item}
                expanded={expanded.has(item.dayStart)}
                onToggle={toggle}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons
                name={error ? 'alert-circle-outline' : 'receipt-outline'}
                size={24}
                color={s.emptyIcon}
              />
              <Text style={s.emptyText}>
                {error ? 'Could not load history.' : active.empty}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    safe: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 20,
    },
    header: {
      paddingTop: 4,
      paddingBottom: 12,
    },
    h1: {
      fontSize: 28,
      fontWeight: '700',
      color: c.text,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.divider,
      padding: 4,
      gap: 4,
    },
    toggleItem: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 999,
    },
    toggleItemActive: {
      backgroundColor: c.primary,
    },
    pressed: {
      opacity: 0.7,
    },
    toggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    toggleTextActive: {
      color: c.onPrimary,
    },
    scopeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 12,
      paddingTop: 16,
    },
    scopeLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    scopeTotal: {
      fontSize: 22,
      fontWeight: '700',
      color: c.primary,
      fontVariant: ['tabular-nums'],
    },
    scopeMeta: {
      fontSize: 12,
      color: c.textMuted,
      paddingTop: 2,
    },
    scopeMetaSkeleton: {
      marginTop: 6,
    },
    list: {
      flex: 1,
      marginTop: 4,
    },
    listContent: {
      flexGrow: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      backgroundColor: c.background,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.divider,
    },
    sectionDate: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
      letterSpacing: 0.3,
      flexShrink: 0,
    },
    cardWrap: {
      paddingBottom: 18,
    },
    skeletonCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.divider,
      padding: 16,
      gap: 12,
    },
    skeletonHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    skeletonHeaderLeft: {
      gap: 6,
    },
    skeletonChips: {
      flexDirection: 'row',
      gap: 8,
    },
    rule: {
      height: 1,
      backgroundColor: c.divider,
    },
    empty: {
      alignItems: 'center',
      gap: 8,
      paddingTop: 48,
    },
    emptyIcon: c.textFaint,
    emptyText: {
      fontSize: 14,
      color: c.textMuted,
    },
  }));
