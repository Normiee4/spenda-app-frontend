import {
  parseLine,
  parseNote,
  gateBlocksNewline,
  lineAt,
  formatPeso,
  CONFIRM_THRESHOLD_CENTAVOS,
} from '../src/lib/parse';

describe('parseLine — PRD §6 formats', () => {
  it('parses amount-first: "45 Jeep - Commute"', () => {
    const r = parseLine('45 Jeep - Commute');
    expect(r.status).toBe('ok');
    expect(r.amountCentavos).toBe(4500);
    expect(r.category).toBe('Commute');
    expect(r.name).toBe('Jeep');
  });

  it('parses name-first: "Snack 20 - Food"', () => {
    const r = parseLine('Snack 20 - Food');
    expect(r.status).toBe('ok');
    expect(r.amountCentavos).toBe(2000);
    expect(r.category).toBe('Food');
    expect(r.name).toBe('Snack');
  });

  it('matches category case-insensitively', () => {
    expect(parseLine('jeep 15 - commute').category).toBe('Commute');
    expect(parseLine('jeep 15 - COMMUTE').category).toBe('Commute');
    expect(parseLine('jeep 15 -  Commute  ').category).toBe('Commute');
  });

  it('accepts commas and decimals', () => {
    expect(parseLine('Load 1,200 - Utility').amountCentavos).toBe(120000);
    expect(parseLine('Lunch 45.50 - Food').amountCentavos).toBe(4550);
    expect(parseLine('Water 45.5 - Utility').amountCentavos).toBe(4550);
  });

  it('uses the first number when several appear', () => {
    expect(parseLine('2 in 1 promo 99 - Shopping').amountCentavos).toBe(200);
  });

  it('strips the ₱ sign from the name', () => {
    const r = parseLine('Dinner ₱1,200 - Food');
    expect(r.amountCentavos).toBe(120000);
    expect(r.name).toBe('Dinner');
  });

  it('treats only the last "- suffix" as the category', () => {
    const r = parseLine('50 - grab - ride - Commute');
    expect(r.category).toBe('Commute');
    expect(r.amountCentavos).toBe(5000);
  });
});

describe('parseLine — edge cases (PRD §7)', () => {
  it('line with no number → ignored', () => {
    const r = parseLine('just a note about lunch - Food');
    expect(r.status).toBe('ignored');
  });

  it('empty/whitespace line → empty', () => {
    expect(parseLine('').status).toBe('empty');
    expect(parseLine('   ').status).toBe('empty');
  });

  it('number but no category → needs-category (blocks save)', () => {
    expect(parseLine('Jeep 13').status).toBe('needs-category');
    expect(parseLine('Jeep 13 - Commut').status).toBe('needs-category'); // typo ≠ category
  });

  it('unknown category suffix does not count', () => {
    expect(parseLine('Jeep 13 - Travel').status).toBe('needs-category');
  });

  it('zero amount → invalid-amount', () => {
    expect(parseLine('Free 0 - Food').status).toBe('invalid-amount');
  });

  it('negative amount → invalid-amount', () => {
    expect(parseLine('Refund -50 - Shopping').status).toBe('invalid-amount');
  });

  it('unknown category with no Other fallback on save', () => {
    // "other" must be written explicitly — nothing is auto-fallbacked
    expect(parseLine('Mystery 40 - other').category).toBe('Other');
    expect(parseLine('Mystery 40').status).toBe('needs-category');
  });

  it('flags huge amounts for confirmation', () => {
    expect(parseLine('Laptop 100,001 - Shopping').needsConfirm).toBe(true);
    expect(parseLine('Laptop 100,000 - Shopping').needsConfirm).toBe(false);
    expect(CONFIRM_THRESHOLD_CENTAVOS).toBe(10_000_000);
  });

  it('other valid categories pass', () => {
    for (const cat of ['Grocery', 'Gas', 'Bills', 'Loans', 'Debt', 'Drinks', 'Leisure']) {
      expect(parseLine(`x 10 - ${cat}`).category).toBe(cat);
    }
  });
});

describe('parseNote — PRD §6/§7 save classification', () => {
  const note = ['45 Jeep - Commute', '', 'Snack 20 - Food', 'no numbers here', 'Jeep 15'].join('\n');

  it('splits, skips blanks, classifies each line', () => {
    const a = parseNote(note);
    expect(a.lines).toHaveLength(4);
    expect(a.savable).toHaveLength(2);
    expect(a.ignored).toHaveLength(1);
    expect(a.blocked).toHaveLength(1);
    expect(a.blocked[0].status).toBe('needs-category');
    expect(a.hasNumber).toBe(true);
  });

  it('no numbers anywhere → hasNumber false (Save disabled)', () => {
    expect(parseNote('hello\nworld').hasNumber).toBe(false);
    expect(parseNote('').hasNumber).toBe(false);
  });

  it('all-good note has no blocks', () => {
    const a = parseNote('45 Jeep - Commute\nSnack 20 - Food');
    expect(a.blocked).toHaveLength(0);
    expect(a.savable).toHaveLength(2);
  });

  it('drops ignored lines from savable', () => {
    const a = parseNote('no numbers - Food\nCoffee 85 - Drinks');
    expect(a.savable).toHaveLength(1);
    expect(a.savable[0].name).toBe('Coffee');
    expect(a.ignored).toHaveLength(1);
  });
});

describe('gateBlocksNewline — PRD §5.1', () => {
  it('blocks a numbered line without category', () => {
    expect(gateBlocksNewline('jeep 15')).toBe(true);
  });

  it('lets a categorized line through', () => {
    expect(gateBlocksNewline('jeep 15 - Commute')).toBe(false);
  });

  it('lets a numberless line through', () => {
    expect(gateBlocksNewline('buy milk later')).toBe(false);
  });

  it('lets an empty line through', () => {
    expect(gateBlocksNewline('')).toBe(false);
  });
});

describe('lineAt', () => {
  const text = 'one two\nthree\nfour';

  it('finds the line around a cursor', () => {
    expect(lineAt(text, 0).line).toBe('one two');
    expect(lineAt(text, 8).line).toBe('three');
    expect(lineAt(text, text.length).line).toBe('four');
  });

  it('clamps out-of-range offsets', () => {
    expect(lineAt(text, -5).line).toBe('one two');
    expect(lineAt(text, 999).line).toBe('four');
  });
});

describe('formatPeso', () => {
  it('formats centavos as ₱', () => {
    expect(formatPeso(4500)).toMatch(/₱45(\.00)?/);
    expect(formatPeso(8550)).toMatch(/₱85\.50/);
    expect(formatPeso(120000)).toMatch(/1,200/);
  });
});
