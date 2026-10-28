// Line parser — the one piece of real logic in V1 (PRD §6).
// Pure functions only: no React, no storage, no keyboard concerns.
import { Category, matchCategory } from '../constants/categories';

/** Above this, saving asks for confirmation (PRD §7). ₱100,000. */
export const CONFIRM_THRESHOLD_CENTAVOS = 100_000 * 100;

/**
 * empty            → blank line, not part of the note
 * ignored          → no number found; dropped silently on save (PRD §7)
 * needs-category   → number but no valid "- Category"; blocks save (flagged inline)
 * invalid-amount   → amount ≤ 0; blocks save with a validation message
 * ok               → savable entry
 */
export type LineStatus = 'empty' | 'ignored' | 'needs-category' | 'invalid-amount' | 'ok';

export type ParsedLine = {
  raw: string;
  name: string | null;
  category: Category | null;
  amountCentavos: number | null;
  status: LineStatus;
  /** ok + above CONFIRM_THRESHOLD_CENTAVOS → confirm before saving. */
  needsConfirm: boolean;
};

export type NoteAnalysis = {
  /** All non-empty lines, in note order. */
  lines: ParsedLine[];
  /** Status ok — what a successful save writes. */
  savable: ParsedLine[];
  /** needs-category | invalid-amount — blocks the save. */
  blocked: ParsedLine[];
  /** Lines with no number (dropped on save). */
  ignored: ParsedLine[];
  /** Any line carrying a number → enables the Save button (PRD §7). */
  hasNumber: boolean;
};

// First number in text: "1,200" · "45.50" · "-50" · optional ₱ sign before it.
const NUMBER_RE = /(-?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/;

type FoundNumber = { centavos: number; literal: string; start: number };

function findFirstNumber(text: string): FoundNumber | null {
  const m = NUMBER_RE.exec(text);
  if (!m) return null;
  const negative = m[1] === '-';
  const whole = Number(m[2].replace(/,/g, ''));
  const frac = m[3] ? Number(m[3].padEnd(2, '0')) : 0;
  const centavos = negative ? -(whole * 100 + frac) : whole * 100 + frac;
  return { centavos, literal: m[0], start: m.index };
}

function tidyName(text: string): string | null {
  const name = text
    .replace(/[₱$€£]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s-]+/, '')
    .replace(/[\s-]+$/, '')
    .trim();
  return name.length > 0 ? name : null;
}

/**
 * PRD §6, single line:
 *  - category = text after the last "-" if it matches a category (case-insensitive)
 *  - amount   = first number in the rest
 *  - name     = the rest with that number removed
 */
export function parseLine(raw: string): ParsedLine {
  const text = raw.trim();
  const base: ParsedLine = {
    raw,
    name: null,
    category: null,
    amountCentavos: null,
    status: 'empty',
    needsConfirm: false,
  };
  if (!text) return base;

  let category: Category | null = null;
  let left = text;
  const dash = text.lastIndexOf('-');
  if (dash !== -1) {
    const candidate = matchCategory(text.slice(dash + 1));
    if (candidate) {
      category = candidate;
      left = text.slice(0, dash);
    }
  }

  const num = findFirstNumber(left);
  if (!num) {
    return { ...base, status: 'ignored', name: tidyName(left), category };
  }

  const nameLeft = tidyName(left.slice(0, num.start) + left.slice(num.start + num.literal.length));

  if (num.centavos <= 0) {
    return {
      ...base,
      status: 'invalid-amount',
      name: nameLeft,
      category,
      amountCentavos: num.centavos,
    };
  }

  if (!category) {
    return {
      ...base,
      status: 'needs-category',
      name: nameLeft,
      amountCentavos: num.centavos,
    };
  }

  return {
    ...base,
    status: 'ok',
    name: nameLeft,
    category,
    amountCentavos: num.centavos,
    needsConfirm: num.centavos > CONFIRM_THRESHOLD_CENTAVOS,
  };
}

/** Split a note into lines and classify everything (PRD §6/§7). */
export function parseNote(text: string): NoteAnalysis {
  const lines = text
    .split(/\r?\n/)
    .map(parseLine)
    .filter((l) => l.status !== 'empty');

  const savable = lines.filter((l) => l.status === 'ok');
  const blocked = lines.filter((l) => l.status === 'needs-category' || l.status === 'invalid-amount');
  const ignored = lines.filter((l) => l.status === 'ignored');

  return {
    lines,
    savable,
    blocked,
    ignored,
    hasNumber: lines.some((l) => l.status !== 'ignored'),
  };
}

/**
 * Newline gate (PRD §5.1): a line with a number but no category must not
 * receive a newline until a category is chosen.
 */
export function gateBlocksNewline(line: string): boolean {
  return parseLine(line).status === 'needs-category';
}

/** Line boundaries around a cursor offset — used by the gate and the preview. */
export function lineAt(text: string, offset: number): { line: string; start: number; end: number } {
  const clamped = Math.max(0, Math.min(offset, text.length));
  const start = text.lastIndexOf('\n', clamped - 1) + 1;
  const nextBreak = text.indexOf('\n', clamped);
  const end = nextBreak === -1 ? text.length : nextBreak;
  return { line: text.slice(start, end), start, end };
}

// --- money formatting (Intl with a Hermes-safe fallback) ------------------

let formatter: Intl.NumberFormat | null = null;
try {
  formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'narrowSymbol',
  });
} catch {
  formatter = null;
}

export function formatPeso(centavos: number): string {
  const value = centavos / 100;
  if (formatter) return formatter.format(value);
  const whole = Math.trunc(Math.abs(value));
  const frac = Math.abs(Math.round((Math.abs(value) % 1) * 100));
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = value < 0 ? '-' : '';
  return `${sign}₱${grouped}.${String(frac).padStart(2, '0')}`;
}

/** Short form for dense rows: ₱1,270 → ₱1.3k (labels stay exact elsewhere). */
export function formatPesoCompact(centavos: number): string {
  const value = centavos / 100;
  if (value < 1000) return formatPeso(centavos);
  const k = value / 1000;
  const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
  return `₱${rounded}k`;
}
