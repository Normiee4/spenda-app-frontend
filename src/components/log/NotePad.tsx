import { RefObject } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorSet } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

export type PadSelection = { start: number; end: number };

type Props = {
  value: string;
  /** Controlled value; called on every keystroke (gate logic lives in the parent). */
  onChangeText: (next: string) => void;
  /** Cursor position of the line being edited — drives the parse preview. */
  onSelectionChange: (sel: PadSelection) => void;
  /**
   * One-shot controlled selection, applied after a programmatic edit
   * (category applied, undo/redo). Parent clears it on the next cursor event.
   */
  pendingSelection: PadSelection | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  inputRef?: RefObject<TextInput | null>;
};

export default function NotePad({
  value,
  onChangeText,
  onSelectionChange,
  pendingSelection,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  inputRef,
}: Props) {
  const s = useStyles();

  return (
    <View style={s.card}>
      <TextInput
        ref={inputRef}
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={(e) => onSelectionChange(e.nativeEvent.selection)}
        selection={pendingSelection ?? undefined}
        multiline
        autoFocus
        autoCorrect
        spellCheck={false}
        textAlignVertical="top"
        placeholder={'Write one expense per line'}
        placeholderTextColor={s.placeholderColor}
        accessibilityLabel="Expense note"
        returnKeyType="default"
        scrollEnabled
      />

      <View style={s.history}>
        <Pressable
          onPress={onUndo}
          disabled={!canUndo}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Undo"
          accessibilityState={{ disabled: !canUndo }}
          style={({ pressed }) => [
            s.historyBtn,
            !canUndo && s.historyBtnOff,
            pressed && canUndo && s.pressed,
          ]}
        >
          <Ionicons
            name="arrow-undo-outline"
            size={16}
            color={canUndo ? s.iconOn : s.iconOff}
          />
          <Text style={[s.historyLabel, !canUndo && s.historyLabelOff]}>Undo</Text>
        </Pressable>
        <Pressable
          onPress={onRedo}
          disabled={!canRedo}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Redo"
          accessibilityState={{ disabled: !canRedo }}
          style={({ pressed }) => [
            s.historyBtn,
            !canRedo && s.historyBtnOff,
            pressed && canRedo && s.pressed,
          ]}
        >
          <Ionicons
            name="arrow-redo-outline"
            size={16}
            color={canRedo ? s.iconOn : s.iconOff}
          />
          <Text style={[s.historyLabel, !canRedo && s.historyLabelOff]}>Redo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.divider,
      // soft-UI inset for the writing surface
      shadowColor: c.background,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.9,
      shadowRadius: 4,
      elevation: 0,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 14,
      paddingRight: 14,
    },
    history: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.divider,
    },
    historyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 44,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.divider,
    },
    historyBtnOff: { opacity: 0.5 },
    historyLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: c.primary,
    },
    historyLabelOff: { color: c.textMuted },
    pressed: { opacity: 0.6 },
    iconOn: c.primary,
    iconOff: c.textMuted,
    placeholderColor: c.textFaint,
    input: {
      minHeight: 96,
      maxHeight: 200,
      paddingTop: 2,
      fontSize: 16,
      lineHeight: 24,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
  }));
