// Data-access layer over expo-sqlite (PRD §8).
// Amounts are integer centavos. Timestamps are epoch milliseconds.
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category } from '../constants/categories';

export type Expense = {
  id: number;
  amount_centavos: number;
  category: string;
  raw_text: string;
  created_at: number;
  updated_at: number;
};

export type NewExpense = {
  amountCentavos: number;
  category: Category;
  rawText: string;
  createdAt?: number;
};

const SCHEMA = `
PRAGMA journal_mode = 'wal';
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY NOT NULL,
  amount_centavos INTEGER NOT NULL,
  category TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses (created_at);
`;

/** Called by <SQLiteProvider onInit>. Idempotent. */
export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA);
}

/** Insert many entries in one save action (PRD §5.1). Returns new row ids. */
export async function insertExpenses(db: SQLiteDatabase, entries: NewExpense[]): Promise<number[]> {
  const now = Date.now();
  const ids: number[] = [];
  await db.withTransactionAsync(async () => {
    for (const entry of entries) {
      const result = await db.runAsync(
        'INSERT INTO expenses (amount_centavos, category, raw_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        entry.amountCentavos,
        entry.category,
        entry.rawText,
        entry.createdAt ?? now,
        now,
      );
      ids.push(result.lastInsertRowId);
    }
  });
  return ids;
}

export async function updateExpense(
  db: SQLiteDatabase,
  id: number,
  entry: Omit<NewExpense, 'createdAt'>,
): Promise<void> {
  await db.runAsync(
    'UPDATE expenses SET amount_centavos = ?, category = ?, raw_text = ?, updated_at = ? WHERE id = ?',
    entry.amountCentavos,
    entry.category,
    entry.rawText,
    Date.now(),
    id,
  );
}

export async function deleteExpense(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

/**
 * Re-insert an undone delete at its original time so the list looks untouched.
 * Gets a fresh id (the old id may already be reused by a later insert).
 */
export async function restoreExpense(db: SQLiteDatabase, expense: Expense): Promise<void> {
  await db.runAsync(
    'INSERT INTO expenses (amount_centavos, category, raw_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    expense.amount_centavos,
    expense.category,
    expense.raw_text,
    expense.created_at,
    expense.updated_at,
  );
}

/** Newest first within the window [from, to). */
export async function expensesBetween(
  db: SQLiteDatabase,
  from: number,
  to: number,
): Promise<Expense[]> {
  return db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE created_at >= ? AND created_at < ? ORDER BY created_at DESC, id DESC',
    from,
    to,
  );
}

/** Every expense, newest first — used by the History tab. */
export async function allExpenses(db: SQLiteDatabase): Promise<Expense[]> {
  return db.getAllAsync<Expense>(
    'SELECT * FROM expenses ORDER BY created_at DESC, id DESC',
  );
}

export async function deleteAllExpenses(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM expenses');
}
