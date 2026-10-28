import type { Expense } from '../src/lib/db';
import { entryLabel, groupExpensesByDay, sumExpenses } from '../src/lib/history';
import {
  addDays,
  addMonths,
  startOfMonth,
  startOfWeek,
} from '../src/lib/time';

function at(year: number, month: number, day: number, hour = 12, minute = 0): number {
  return new Date(year, month, day, hour, minute).getTime();
}

function expense(
  id: number,
  amountCentavos: number,
  category: string,
  rawText: string,
  createdAt: number,
): Expense {
  return {
    id,
    amount_centavos: amountCentavos,
    category,
    raw_text: rawText,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

describe('groupExpensesByDay', () => {
  it('returns an empty list when there is nothing logged', () => {
    expect(groupExpensesByDay([])).toEqual([]);
  });

  it('groups entries by local day and sums the day total', () => {
    const groups = groupExpensesByDay([
      expense(1, 4_500, 'Commute', '45 Jeep - Commute', at(2026, 2, 27, 8, 0)),
      expense(2, 2_000, 'Food', 'Snack 20 - Food', at(2026, 2, 27, 15, 30)),
      expense(3, 1_000, 'Drinks', 'Coffee 10 - Drinks', at(2026, 2, 26, 9, 0)),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].dayStart).toBe(at(2026, 2, 27, 0, 0));
    expect(groups[0].totalCentavos).toBe(6_500);
    expect(groups[0].count).toBe(2);
    expect(groups[0].entries.map((e) => e.id)).toEqual([2, 1]);
    expect(groups[1].dayStart).toBe(at(2026, 2, 26, 0, 0));
    expect(groups[1].totalCentavos).toBe(1_000);
  });

  it('orders days newest first', () => {
    const groups = groupExpensesByDay([
      expense(1, 100, 'Food', 'A 1 - Food', at(2026, 2, 20)),
      expense(2, 200, 'Food', 'B 2 - Food', at(2026, 2, 27)),
      expense(3, 300, 'Food', 'C 3 - Food', at(2026, 2, 24)),
    ]);

    expect(groups.map((g) => new Date(g.dayStart).getDate())).toEqual([27, 24, 20]);
  });

  it('breaks down spend per category, largest first', () => {
    const groups = groupExpensesByDay([
      expense(1, 1_000, 'Food', 'Lunch 10 - Food', at(2026, 2, 27, 9)),
      expense(2, 3_000, 'Food', 'Dinner 30 - Food', at(2026, 2, 27, 19)),
      expense(3, 2_500, 'Commute', '45 Jeep - Commute', at(2026, 2, 27, 8)),
      expense(4, 500, 'Drinks', 'Water 5 - Drinks', at(2026, 2, 27, 10)),
    ]);

    expect(groups[0].categories).toEqual([
      { category: 'Food', totalCentavos: 4_000, count: 2 },
      { category: 'Commute', totalCentavos: 2_500, count: 1 },
      { category: 'Drinks', totalCentavos: 500, count: 1 },
    ]);
  });
});

describe('sumExpenses', () => {
  it('totals the selected scope', () => {
    expect(
      sumExpenses([
        expense(1, 4_500, 'Commute', '45 Jeep - Commute', at(2026, 2, 27)),
        expense(2, 2_000, 'Food', 'Snack 20 - Food', at(2026, 2, 26)),
      ]),
    ).toEqual({ totalCentavos: 6_500, count: 2 });
  });

  it('is zero for an empty scope', () => {
    expect(sumExpenses([])).toEqual({ totalCentavos: 0, count: 0 });
  });
});

describe('period bounds', () => {
  // March 27, 2026 is a Friday.
  const friday = at(2026, 2, 27, 15);

  it('starts the week on Monday', () => {
    expect(startOfWeek(friday)).toBe(at(2026, 2, 23, 0));
    expect(addDays(startOfWeek(friday), 7)).toBe(at(2026, 2, 30, 0));
  });

  it('starts the month on day 1 and advances to the next month', () => {
    expect(startOfMonth(friday)).toBe(at(2026, 2, 1, 0));
    expect(addMonths(startOfMonth(friday), 1)).toBe(at(2026, 3, 1, 0));
  });
});

describe('entryLabel', () => {
  it('pluralizes entry counts', () => {
    expect(entryLabel(1)).toBe('1 entry');
    expect(entryLabel(3)).toBe('3 entries');
  });
});
