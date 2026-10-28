// History grouping — pure functions over logged expenses (History tab).
import type { Expense } from './db';
import { startOfDay } from './time';

export type CategoryTotal = {
  category: string;
  totalCentavos: number;
  count: number;
};

export type DayGroup = {
  dayStart: number;
  entries: Expense[];
  totalCentavos: number;
  count: number;
  categories: CategoryTotal[];
};

/**
 * Group expenses into local days, newest day first.
 * Entries stay newest-first; categories are sorted by spend, then name.
 */
export function groupExpensesByDay(expenses: Expense[]): DayGroup[] {
  const byDay = new Map<
    number,
    { entries: Expense[]; totalCentavos: number; categories: Map<string, CategoryTotal> }
  >();

  const sorted = [...expenses].sort(
    (a, b) => b.created_at - a.created_at || b.id - a.id,
  );

  for (const entry of sorted) {
    const key = startOfDay(entry.created_at);
    let group = byDay.get(key);
    if (!group) {
      group = { entries: [], totalCentavos: 0, categories: new Map() };
      byDay.set(key, group);
    }

    group.entries.push(entry);
    group.totalCentavos += entry.amount_centavos;

    const category = group.categories.get(entry.category);
    if (category) {
      category.totalCentavos += entry.amount_centavos;
      category.count += 1;
    } else {
      group.categories.set(entry.category, {
        category: entry.category,
        totalCentavos: entry.amount_centavos,
        count: 1,
      });
    }
  }

  return [...byDay.entries()]
    .map(([dayStart, group]) => ({
      dayStart,
      entries: group.entries,
      totalCentavos: group.totalCentavos,
      count: group.entries.length,
      categories: [...group.categories.values()].sort(
        (a, b) => b.totalCentavos - a.totalCentavos || a.category.localeCompare(b.category),
      ),
    }))
    .sort((a, b) => b.dayStart - a.dayStart);
}

/** Scope total for the summary line above the list. */
export function sumExpenses(expenses: Expense[]): { totalCentavos: number; count: number } {
  return expenses.reduce(
    (acc, entry) => ({
      totalCentavos: acc.totalCentavos + entry.amount_centavos,
      count: acc.count + 1,
    }),
    { totalCentavos: 0, count: 0 },
  );
}

/** Days in a group, for "3 entries" copy and accessibility labels. */
export function entryLabel(count: number): string {
  return count === 1 ? '1 entry' : `${count} entries`;
}
