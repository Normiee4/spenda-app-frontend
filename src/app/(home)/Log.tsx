// app/(home)/Log.tsx — the one primary screen of V1 (PRD §5).
// State machine: note pad text → parse → gate/preview → save → today list.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import NotePad, { PadSelection } from '../../components/log/NotePad';
import TodayList from '../../components/log/TodayList';
import Button from '../../components/ui/Button';
import { showToast } from '../../components/ui/Toast';
import { Category, CATEGORIES } from '../../constants/categories';
import { ColorSet } from '../../constants/theme';
import {
  NoteAnalysis,
  ParsedLine,
  formatPeso,
  gateBlocksNewline,
  lineAt,
  parseLine,
  parseNote,
} from '../../lib/parse';
import {
  Expense,
  deleteExpense,
  expensesBetween,
  insertExpenses,
  restoreExpense,
  updateExpense,
} from '../../lib/db';
import { endOfDay, startOfDay } from '../../lib/time';
import { useThemedStyles } from '../../theme/useThemedStyles';

type Gate = { lineStart: number; lineEnd: number; addNewline: boolean };
type SnackState = {
  message: string;
  action?: { label: string; run: () => void };
};

/** Offsets of every non-empty line — used to jump the gate at a blocked line. */
function findLineRanges(text: string): { start: number; end: number; parsed: ParsedLine }[] {
  const out: { start: number; end: number; parsed: ParsedLine }[] = [];
  let pos = 0;
  for (const raw of text.split(/\r?\n/)) {
    const start = pos;
    const end = pos + raw.length;
    pos = end + 1;
    const parsed = parseLine(raw);
    if (parsed.status !== 'empty') out.push({ start, end, parsed });
  }
  return out;
}

function blockedMessage(a: NoteAnalysis): string {
  const first = a.blocked[0];
  if (!first) return 'Fix the flagged lines before saving.';
  const snippet = first.raw.trim().slice(0, 40);
  const more = a.blocked.length > 1 ? ` (+${a.blocked.length - 1} more)` : '';
  if (first.status === 'invalid-amount') {
    return `"${snippet}" — amount must be over ₱0.${more}`;
  }
  return `"${snippet}" — pick a category to finish this line.${more}`;
}

export default function LogScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const s = useStyles();
  const inputRef = useRef<TextInput>(null);

  // --- pad state -----------------------------------------------------------
  const [text, setText] = useState('');
  const textRef = useRef('');
  const [cursor, setCursor] = useState<PadSelection>({ start: 0, end: 0 });
  const [pendingSel, setPendingSel] = useState<PadSelection | null>(null);
  const [gate, setGate] = useState<Gate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyText = useCallback((next: string) => {
    textRef.current = next;
    setText(next);
  }, []);

  // --- history (undo / redo) ----------------------------------------------
  const histRef = useRef<{ stack: string[]; index: number }>({ stack: [''], index: 0 });
  const histTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHist = useRef<string | null>(null);
  // Render never reads the refs above (react-hooks/refs) — these mirror them:
  const [histIndex, setHistIndex] = useState(0);
  const [histLength, setHistLength] = useState(1);
  const [pendingSnapshot, setPendingSnapshot] = useState(false);

  const syncHist = useCallback(() => {
    setHistIndex(histRef.current.index);
    setHistLength(histRef.current.stack.length);
  }, []);

  const doCommit = useCallback(
    (value: string) => {
      const h = histRef.current;
      if (h.stack[h.index] !== value) {
        h.stack = h.stack.slice(0, h.index + 1);
        h.stack.push(value);
        if (h.stack.length > 50) h.stack.shift();
        h.index = h.stack.length - 1;
      }
      setPendingSnapshot(false);
      syncHist();
    },
    [syncHist],
  );

  const scheduleCommit = useCallback(
    (value: string) => {
      pendingHist.current = value;
      setPendingSnapshot(true);
      if (histTimer.current) clearTimeout(histTimer.current);
      histTimer.current = setTimeout(() => {
        histTimer.current = null;
        doCommit(pendingHist.current ?? '');
      }, 400);
    },
    [doCommit],
  );

  const commitNow = useCallback(
    (value: string) => {
      pendingHist.current = null;
      if (histTimer.current) {
        clearTimeout(histTimer.current);
        histTimer.current = null;
      }
      doCommit(value);
    },
    [doCommit],
  );

  const flushCommit = useCallback(() => {
    if (histTimer.current) {
      clearTimeout(histTimer.current);
      histTimer.current = null;
      doCommit(pendingHist.current ?? '');
    }
    pendingHist.current = null;
    setPendingSnapshot(false);
  }, [doCommit]);

  const undo = useCallback(() => {
    flushCommit();
    const h = histRef.current;
    if (h.index <= 0) return;
    h.index -= 1;
    const v = h.stack[h.index];
    applyText(v);
    setPendingSel({ start: v.length, end: v.length });
    setGate(null);
    syncHist();
  }, [flushCommit, applyText, syncHist]);

  const redo = useCallback(() => {
    flushCommit();
    const h = histRef.current;
    if (h.index >= h.stack.length - 1) return;
    h.index += 1;
    const v = h.stack[h.index];
    applyText(v);
    setPendingSel({ start: v.length, end: v.length });
    setGate(null);
    syncHist();
  }, [flushCommit, applyText, syncHist]);

  // A pending debounced snapshot also enables undo (it flushes, then steps back).
  const canUndo = histIndex > 0 || pendingSnapshot;
  const canRedo = histIndex < histLength - 1;

  // --- list / db -----------------------------------------------------------
  const [entries, setEntries] = useState<Expense[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const rows = await expensesBetween(db, startOfDay(), endOfDay());
      setEntries(rows);
    } catch {
      showToast({ message: 'Could not load entries.', variant: 'error' });
    } finally {
      setLoadingEntries(false);
    }
  }, [db]);

  // The save bar sits above the tab pill; once the keyboard hides the pill,
  // that reserved space would otherwise stay as dead padding.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const totalCentavos = useMemo(() => entries.reduce((sum, e) => sum + e.amount_centavos, 0), [entries]);

  // --- parse (recomputed per keystroke — the note is small) ----------------
  const analysis = useMemo(() => parseNote(text), [text]);
  const cursorLine = lineAt(text, cursor.start);
  const cursorParse = parseLine(cursorLine.line);
  const flaggedRanges = useMemo(
    () =>
      findLineRanges(text).filter(
        (r) =>
          r.parsed.status === 'needs-category' || r.parsed.status === 'invalid-amount',
      ),
    [text],
  );

  // --- undo snackbar (delete) ----------------------------------------------
  // Distinct from showToast(): this one carries an action, so it lives at the
  // bottom above the save bar; confirmations go to the global top-right toast.
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [snack, setSnack] = useState<SnackState | null>(null);
  const lastDeleted = useRef<Expense | null>(null);

  const showSnack = useCallback((message: string, action?: SnackState['action']) => {
    if (snackTimer.current) clearTimeout(snackTimer.current);
    setSnack({ message, action });
    snackTimer.current = setTimeout(() => {
      setSnack(null);
      snackTimer.current = null;
    }, 5000);
  }, []);

  const dismissSnack = useCallback(() => {
    if (snackTimer.current) {
      clearTimeout(snackTimer.current);
      snackTimer.current = null;
    }
    setSnack(null);
  }, []);

  // Unmount: drop pending debounce/snack timers so no callback fires after unmount.
  useEffect(() => {
    return () => {
      if (histTimer.current) clearTimeout(histTimer.current);
      if (snackTimer.current) clearTimeout(snackTimer.current);
    };
  }, []);

  // --- editing the pad -----------------------------------------------------
  const handleSelection = useCallback((sel: PadSelection) => {
    setCursor(sel);
    if (pendingSel) {
      setPendingSel(null); // echo of a programmatic move — keep the gate
    } else {
      setGate(null); // the user took the cursor somewhere else
    }
  }, [pendingSel]);

  const handleChange = useCallback(
    (next: string) => {
      const prev = textRef.current;
      if (next === prev) return;
      setError(null);

      if (next.length > prev.length) {
        // first differing index = insertion point
        let i = 0;
        const minLen = Math.min(prev.length, next.length);
        while (i < minLen && prev[i] === next[i]) i++;
        if (next[i] === '\n') {
          const lineStart = prev.lastIndexOf('\n', i - 1) + 1;
          const line = prev.slice(lineStart, i);
          if (gateBlocksNewline(line)) {
            // newline gate (PRD §5.1): refuse, ask for a category first
            applyText(prev);
            setPendingSel({ start: i, end: i });
            setGate({ lineStart, lineEnd: i, addNewline: true });
            return;
          }
        }
      }

      applyText(next);
      setPendingSel(null);
      setGate(null);
      scheduleCommit(next);
    },
    [applyText, scheduleCommit],
  );

  /** Applies a category: through the gate (completing a line) or to the line at the cursor. */
  const applyCategory = useCallback(
    (cat: Category) => {
      const base = textRef.current;
      setError(null);

      if (gate) {
        const line = base.slice(gate.lineStart, gate.lineEnd);
        const completed = line.replace(/\s+$/, '') + ' - ' + cat;
        const hasBreakAfter = base[gate.lineEnd] === '\n';
        const needBreak = gate.addNewline && !hasBreakAfter;
        const insert = completed + (needBreak ? '\n' : '');
        const next = base.slice(0, gate.lineStart) + insert + base.slice(gate.lineEnd);
        const pos = Math.min(gate.lineStart + completed.length + (gate.addNewline ? 1 : 0), next.length);
        applyText(next);
        commitNow(next);
        setPendingSel({ start: pos, end: pos });
        setGate(null);
        return;
      }

      const at = lineAt(base, cursor.start);
      if (!at.line.trim()) return;
      const parsed = parseLine(at.line);
      let newLine: string;
      if (parsed.category) {
        const dash = at.line.lastIndexOf('-');
        newLine = at.line.slice(0, dash) + `- ${cat}`;
      } else {
        newLine = at.line.replace(/\s+$/, '') + ' - ' + cat;
      }
      const next = base.slice(0, at.start) + newLine + base.slice(at.end);
      applyText(next);
      commitNow(next);
      setPendingSel({ start: at.start + newLine.length, end: at.start + newLine.length });
    },
    [gate, cursor.start, applyText, commitNow],
  );

  // --- save ----------------------------------------------------------------
  const clearPad = useCallback(() => {
    applyText('');
    commitNow('');
    setPendingSel(null);
    setGate(null);
    setError(null);
  }, [applyText, commitNow]);

  async function performSave(a: NoteAnalysis, confirmed: boolean): Promise<void> {
    const big = a.savable.find((l) => l.needsConfirm);
    if (big && !confirmed) {
      Alert.alert('Large amount', `${formatPeso(big.amountCentavos ?? 0)} is above ₱100,000. Save it?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => void performSave(a, true) },
      ]);
      return;
    }

    setBusy(true);
    try {
      if (editingId != null) {
        const line = a.savable[0];
        if (!line) return;
        await updateExpense(db, editingId, {
          amountCentavos: line.amountCentavos ?? 0,
          category: line.category ?? 'Other',
          rawText: (line.raw || textRef.current).trim(),
        });
        setEditingId(null);
        clearPad();
        showToast({ message: 'Entry updated.' });
      } else {
        const ids = await insertExpenses(
          db,
          a.savable.map((l) => ({
            amountCentavos: l.amountCentavos ?? 0,
            category: l.category ?? 'Other',
            rawText: l.raw.trim(),
          })),
        );
        clearPad();
        showToast({
          message: ids.length === 1 ? 'Saved 1 entry.' : `Saved ${ids.length} entries.`,
        });
      }
      await refresh();
    } catch {
      setError('Could not save — please try again.');
      showToast({ message: 'Could not save — please try again.', variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function onSave(): void {
    const a = parseNote(textRef.current);
    if (!a.hasNumber) return;

    if (a.blocked.length > 0) {
      setError(blockedMessage(a));
      const ranges = findLineRanges(textRef.current);
      const first = ranges.find((r) => r.parsed.status === 'needs-category' || r.parsed.status === 'invalid-amount');
      if (first) {
        setPendingSel({ start: first.start, end: first.start });
        if (first.parsed.status === 'needs-category') {
          setGate({ lineStart: first.start, lineEnd: first.end, addNewline: false });
        }
      }
      return;
    }

    if (editingId != null && a.lines.length !== 1) {
      setError('Editing one entry — keep it to a single line.');
      return;
    }

    void performSave(a, false);
  }

  // --- list interactions ---------------------------------------------------
  const startEdit = useCallback(
    (entry: Expense) => {
      commitNow(textRef.current); // keep any draft recoverable via undo
      applyText(entry.raw_text);
      commitNow(entry.raw_text);
      setEditingId(entry.id);
      setGate(null);
      setError(null);
      setPendingSel({ start: entry.raw_text.length, end: entry.raw_text.length });
      inputRef.current?.focus();
    },
    [applyText, commitNow],
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    clearPad();
  }, [clearPad]);

  const onDelete = useCallback(
    async (entry: Expense) => {
      await deleteExpense(db, entry.id);
      lastDeleted.current = entry;
      if (editingId === entry.id) {
        setEditingId(null);
        clearPad();
      }
      await refresh();
      showSnack(`Deleted "${entry.raw_text.trim()}"`, {
        label: 'Undo',
        run: async () => {
          if (lastDeleted.current) {
            await restoreExpense(db, lastDeleted.current);
            lastDeleted.current = null;
            await refresh();
          }
          dismissSnack();
        },
      });
    },
    [db, editingId, clearPad, refresh, showSnack, dismissSnack],
  );

  // --- derived labels ------------------------------------------------------
  const ignoredCount = analysis.ignored.filter((l) => l.raw.trim()).length;
  const blockedCount = analysis.blocked.length;
  const saveLabel =
    blockedCount > 0
      ? `Fix ${blockedCount} flagged line${blockedCount === 1 ? '' : 's'}`
      : editingId != null
        ? 'Update entry'
        : analysis.savable.length > 1
          ? `Save ${analysis.savable.length} entries`
          : 'Save entry';

  const saveButton = (
    <Button
      title={saveLabel}
      onPress={() => void onSave()}
      disabled={!analysis.hasNumber || busy || blockedCount > 0}
      variant="solid"
      full
    />
  );

  // --- preview -------------------------------------------------------------
  let previewText = 'Amount and category appear here';
  let previewTone: 'faint' | 'muted' | 'ok' | 'error' = 'faint';
  if (cursorLine.line.trim()) {
    if (cursorParse.status === 'ok') {
      previewText = `${formatPeso(cursorParse.amountCentavos ?? 0)} · ${cursorParse.category}`;
      previewTone = 'ok';
    } else if (cursorParse.status === 'needs-category') {
      previewText = `${formatPeso(cursorParse.amountCentavos ?? 0)} · pick a category →`;
      previewTone = 'muted';
    } else if (cursorParse.status === 'invalid-amount') {
      previewText = 'amount must be over ₱0';
      previewTone = 'error';
    } else {
      previewText = 'add an amount (e.g. 13)';
      previewTone = 'muted';
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView
        style={[s.safe, { paddingBottom: insets.bottom + (keyboardVisible ? 12 : 92) }]}
        edges={['top']}
      >
        <View style={s.header}>
          <Text accessibilityRole="header" style={s.h1}>
            Log
          </Text>
        </View>

        {editingId != null && (
          <View style={s.editBanner}>
            <Ionicons name="create-outline" size={15} color={s.editIcon} />
            <Text style={s.editText}>Editing an entry</Text>
            <Pressable
              onPress={cancelEdit}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
              style={s.editCancelBtn}
            >
              <Text style={s.editCancel}>Cancel</Text>
            </Pressable>
          </View>
        )}

        <ScrollView
          style={s.top}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.topContent}
        >
          <Text style={s.formatHint}>One expense per line · end with “- Category”</Text>
          <NotePad
            value={text}
            onChangeText={handleChange}
            onSelectionChange={handleSelection}
            pendingSelection={pendingSel}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            inputRef={inputRef}
          />

          <View style={s.previewRow}>
            <Text
              style={[
                s.previewText,
                previewTone === 'faint' && s.previewFaint,
                previewTone === 'muted' && s.previewMuted,
                previewTone === 'ok' && s.previewOk,
                previewTone === 'error' && s.previewError,
              ]}
            >
              {previewText}
            </Text>
          </View>

          {flaggedRanges.length > 1 && (
            <View style={s.flagged} accessibilityRole="alert">
              <View style={s.flaggedHeader}>
                <Ionicons name="alert-circle" size={15} color={s.errorIcon} />
                <Text style={s.flaggedTitle}>Flagged lines</Text>
              </View>
              {flaggedRanges.slice(0, 3).map((range) => (
                <Pressable
                  key={range.start}
                  onPress={() => {
                    setPendingSel({ start: range.start, end: range.start });
                    setGate(null);
                    inputRef.current?.focus();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to line: ${range.parsed.raw.trim()}`}
                  style={({ pressed }) => [s.flaggedRow, pressed && s.flaggedPressed]}
                >
                  <Text style={s.flaggedText} numberOfLines={1}>
                    {range.parsed.raw.trim() || 'This line'}
                  </Text>
                  <Text style={s.flaggedReason}>
                    {range.parsed.status === 'invalid-amount'
                      ? 'amount must be over ₱0'
                      : 'pick a category'}
                  </Text>
                </Pressable>
              ))}
              {flaggedRanges.length > 3 && (
                <Text style={s.flaggedMore}>+{flaggedRanges.length - 3} more</Text>
              )}
            </View>
          )}

          {gate && (
            <View style={s.gateRow}>
              <View style={s.gatePill}>
                <Text style={s.gateHint} numberOfLines={1}>
                  Category for “
                  {(text.slice(gate.lineStart, gate.lineEnd).trim() || 'this line').slice(0, 28)}” →
                </Text>
              </View>
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.chips}
          >
            {CATEGORIES.map((cat) => {
              const isActive = cursorParse.category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => applyCategory(cat)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tag as ${cat}`}
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    s.chip,
                    gate != null && s.chipGate,
                    isActive && s.chipActive,
                    pressed && s.chipPressed,
                  ]}
                >
                  <Text style={[s.chipText, isActive && s.chipTextActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {error && (
            <View style={s.errorBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={16} color={s.errorIcon} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={s.listZone}>
          <TodayList
            entries={entries}
            totalCentavos={totalCentavos}
            editingId={editingId}
            loading={loadingEntries}
            onPressEntry={startEdit}
            onDeleteEntry={(entry) => void onDelete(entry)}
          />
        </View>

        <View style={s.saveBar}>
          {ignoredCount > 0 && (
            <Text style={s.skipNote}>
              {ignoredCount} line{ignoredCount === 1 ? '' : 's'} without an amount will be skipped
            </Text>
          )}
          {saveButton}
        </View>

        {snack && (
          <View style={s.snack} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={s.snackText}>{snack.message}</Text>
            {snack.action && (
              <Pressable
                onPress={() => void snack.action?.run()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={snack.action.label}
                style={({ pressed }) => [s.snackActionBtn, pressed && s.snackActionPressed]}
              >
                <Text style={s.snackAction}>{snack.action.label}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={dismissSnack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              style={s.snackClose}
            >
              <Ionicons name="close" size={16} color={s.snackIcon} />
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet, isDark: boolean) => ({
    flex: { flex: 1 },
    safe: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 20,
    },
    header: {
      paddingTop: 4,
      paddingBottom: 10,
    },
    h1: {
      fontSize: 28,
      fontWeight: '700',
      color: c.text,
    },
    editBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.surface,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 10,
    },
    editIcon: c.primary,
    editText: {
      flex: 1,
      fontSize: 13,
      color: c.text,
    },
    editCancelBtn: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    editCancel: {
      fontSize: 13,
      fontWeight: '600',
      color: c.primary,
    },
    top: {
      flexGrow: 0,
      flexShrink: 0,
    },
    topContent: {
      gap: 10,
      paddingBottom: 2,
    },
    formatHint: {
      fontSize: 12,
      color: c.textMuted,
      paddingLeft: 6,
    },
    previewRow: {
      paddingLeft: 6,
      minHeight: 18,
    },
    previewText: {
      fontSize: 13,
      fontVariant: ['tabular-nums'],
    },
    previewFaint: { color: c.textFaint },
    previewMuted: { color: c.textMuted },
    previewOk: { color: c.text, fontWeight: '600' },
    previewError: { color: c.error, fontWeight: '500' },
    flagged: {
      gap: 6,
      backgroundColor: c.errorSoft,
      borderLeftWidth: 3,
      borderLeftColor: c.error,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    flaggedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    flaggedTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: c.error,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    flaggedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 32,
    },
    flaggedPressed: {
      opacity: 0.6,
    },
    flaggedText: {
      flex: 1,
      fontSize: 13,
      color: c.text,
    },
    flaggedReason: {
      fontSize: 12,
      color: c.error,
    },
    flaggedMore: {
      fontSize: 12,
      color: c.textMuted,
    },
    gateRow: {
      paddingLeft: 6,
    },
    // warning-role cue: the line is blocked until a category is picked
    gatePill: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
      backgroundColor: c.warning,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    // coral fill + label: dark mode lightens the fill, so the label inverts there
    gateHint: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? c.background : c.onAccent,
    },
    chips: {
      gap: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    chip: {
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.divider,
      justifyContent: 'center',
    },
    chipGate: {
      borderColor: c.warning,
    },
    chipActive: {
      // active state → accent (sevings-token.css: CTAs, FAB, warnings, active states)
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    chipPressed: {
      opacity: 0.7,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textMuted,
    },
    chipTextActive: {
      color: isDark ? c.background : c.onAccent,
      fontWeight: '600',
    },
    errorBanner: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
      backgroundColor: c.errorSoft,
      borderLeftWidth: 3,
      borderLeftColor: c.error,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    errorIcon: c.error,
    errorText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: c.error,
    },
    listZone: {
      flex: 1,
      marginTop: 14,
    },
    saveBar: {
      gap: 8,
      paddingTop: 10,
    },
    skipNote: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
    },
    snack: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 104,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.text,
      borderRadius: 14,
      paddingVertical: 6,
      paddingHorizontal: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    snackText: {
      flex: 1,
      fontSize: 14,
      color: c.background,
    },
    // inverted action chip — reads as a button in both palettes (no accent tokens:
    // accent2 is reserved for the savings bucket, accent fails 3:1 on this surface)
    snackActionBtn: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: c.background,
    },
    snackClose: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    snackActionPressed: { opacity: 0.7 },
    snackAction: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    snackIcon: c.background,
  }));
