// The single source of truth for categories (PRD §6).
// No keyword table exists — categories are only ever written inline
// or picked from the chips.
export const CATEGORIES = [
  'Commute',
  'Food',
  'Grocery',
  'Gas',
  'Utility',
  'Bills',
  'Loans',
  'Debt',
  'Shopping',
  'Drinks',
  'Leisure',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_NAMES: readonly string[] = CATEGORIES;

/** Case-insensitive match of a category suffix against the known list. */
export function matchCategory(raw: string): Category | null {
  const needle = raw.trim().toLowerCase();
  if (!needle) return null;
  const hit = CATEGORIES.find((c) => c.toLowerCase() === needle);
  return hit ?? null;
}
