// components/ui/Toast.tsx — transient top-right feedback for optimistic actions.
// Context-free: any screen calls showToast(), <ToastViewport /> renders it.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ColorSet } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

export type ToastVariant = 'success' | 'error';

export type ToastOptions = {
  message: string;
  /** Defaults to 'success'. */
  variant?: ToastVariant;
};

type ToastPayload = Required<ToastOptions>;
type Listener = (toast: ToastPayload) => void;

const DISMISS_AFTER_MS = 2800;
const listeners = new Set<Listener>();

/** Announce a transient confirmation in the top-right corner. Safe from any screen. */
export function showToast(options: ToastOptions): void {
  const payload: ToastPayload = {
    message: options.message,
    variant: options.variant ?? 'success',
  };
  listeners.forEach((listen) => listen(payload));
}

/** Global overlay — mount once in the root layout, inside <ThemeProvider>. */
export function ToastViewport() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastPayload | null>(null);
  // Animated.Value is created once and read during render, so it lives in
  // state (react-hooks/refs forbids dereferencing a ref in render).
  const [progress] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // A newer toast may have replaced this one mid-exit — only clear when we own it.
      if (finished) setToast(null);
    });
  }, [clearTimer, progress]);

  useEffect(() => {
    const listener: Listener = (payload) => {
      clearTimer();
      progress.stopAnimation();
      setToast(payload);
      progress.setValue(0);
      AccessibilityInfo.announceForAccessibility(payload.message);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(dismiss, DISMISS_AFTER_MS);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      clearTimer();
    };
  }, [clearTimer, dismiss, progress]);

  const tone = toast?.variant === 'error' ? s.errorTone : s.successTone;

  return (
    <View
      pointerEvents="box-none"
      style={[s.viewport, { paddingTop: insets.top + 8, paddingRight: insets.right + 12 }]}
    >
      {toast && (
        <Animated.View
          accessibilityRole="alert"
          accessible
          style={[
            s.card,
            toast.variant === 'error' ? s.cardError : s.cardSuccess,
            {
              opacity: progress,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [28, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={toast.variant === 'error' ? 'alert-circle' : 'checkmark-circle'}
            size={18}
            color={tone}
          />
          <Text style={[s.message, { color: tone }]}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet, isDark: boolean) => ({
    viewport: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'flex-end',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: 300,
      maxWidth: '100%',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 8,
    },
    cardSuccess: { backgroundColor: c.success },
    cardError: { backgroundColor: c.error },
    message: {
      flex: 1,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '600',
    },
    successTone: c.onPrimary,
    // light error fill is mid-tone (white label); dark error fill is light (dark label)
    errorTone: isDark ? c.background : c.onPrimary,
  }));
