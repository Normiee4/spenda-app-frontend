import { Pressable, Text, StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { ColorSet } from "../../constants/theme";
import { useThemedStyles } from "../../theme/useThemedStyles";

type ButtonProps = {
  onPress: () => void;
  title: string;
  /** accent = the design system's CTA / active-state fill (styles/sevings-token.css). */
  variant?: "primary" | "secondary" | "outlined" | "danger" | "accent" | "solid";
  isActive?: boolean;
  /** Stretch to the parent's width — used for onboarding / save CTAs. */
  full?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Button({
  onPress,
  title,
  variant = "primary",
  isActive,
  full = false,
  disabled = false,
  style,
}: ButtonProps) {
  // isActive present → state design (active/inactive), otherwise variant design
  const hasState = isActive !== undefined;
  const inset = hasState ? !isActive : variant === "outlined";
  const fill = hasState
    ? isActive
      ? "activeFill"
      : "inactiveFill"
    : inset
      ? "fillInset"
      : variant === "danger"
        ? "fillDanger"
        : variant === "accent"
          ? "fillAccent"
          : variant === "solid"
            ? "fillSolid"
            : "fill";
  const labelColor = hasState
    ? isActive
      ? "activeLabel"
      : "inactiveLabel"
    : `${variant}Label`;
  const s = useStyles();

  // Narrowed key unions so fill lookups type as ViewStyle and label lookups
  // as TextStyle — a single `keyof` union would mix them and fail JSX typing.
  const fillStyle = s[
    fill as
      | "fill"
      | "fillInset"
      | "fillDanger"
      | "fillAccent"
      | "fillSolid"
      | "activeFill"
      | "inactiveFill"
  ];
  const labelStyle = s[
    labelColor as
      | "activeLabel"
      | "inactiveLabel"
      | "primaryLabel"
      | "secondaryLabel"
      | "outlinedLabel"
      | "dangerLabel"
      | "accentLabel"
      | "solidLabel"
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        s.base,
        full && s.full,
        fillStyle,
        // Android elevation lives here, NOT on the layers: an elevated layer
        // composites above its siblings (including the label) and hides it
        !inset && s.raiseElevation,
        pressed && s.pressed,
        disabled && s.disabled,
        style,
      ]}
    >
      {/* two stacked layers: RN allows one shadow per view, soft-UI needs two */}
      <View style={[StyleSheet.absoluteFill, fillStyle, inset ? s.insetShade : s.raiseShade]} />
      <View style={[StyleSheet.absoluteFill, fillStyle, inset ? s.insetLight : s.raiseLight]} />
      <Text style={[s.label, labelStyle]}>{title}</Text>
    </Pressable>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet, isDark) => ({
    base: {
      minHeight: 44,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    full: { width: "100%" },
    // fills
    fill: { backgroundColor: c.background },
    fillInset: { backgroundColor: c.surface },
    fillDanger: { backgroundColor: c.error },
    fillAccent: { backgroundColor: c.accent },
    fillSolid: { backgroundColor: c.primary },
    activeFill: { backgroundColor: c.primary },
    inactiveFill: { backgroundColor: c.surface },
    // elevated: shade bottom-right, catch-light top-left
    raiseShade: {
      shadowColor: isDark ? "#000000" : "#A7B1AC",
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: isDark ? 0.6 : 0.6,
      shadowRadius: 8,
    },
    raiseElevation: { elevation: 6 },
    raiseLight: {
      shadowColor: "#FFFFFF",
      shadowOffset: { width: -4, height: -4 },
      shadowOpacity: isDark ? 0.06 : 1,
      shadowRadius: 6,
      // Android can't render the white shadow — fake the light edge with a rim
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.7)",
    },
    // inset (opposite): light source inverted — dark top-left, light bottom-right
    insetShade: {
      shadowColor: isDark ? "#000000" : "#A7B1AC",
      shadowOffset: { width: -4, height: -4 },
      shadowOpacity: 0.55,
      shadowRadius: 6,
      elevation: 0,
    },
    insetLight: {
      shadowColor: "#FFFFFF",
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: isDark ? 0.06 : 0.9,
      shadowRadius: 6,
      elevation: 0,
    },
    pressed: { transform: [{ scale: 0.97 }] },
    disabled: { opacity: 0.45 },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: c.secondary,
    },
    // state designs
    activeLabel: { color: c.onPrimary },
    inactiveLabel: { color: c.secondary },
    // variant designs (fallback when isActive is not passed)
    primaryLabel: { color: c.primary },
    secondaryLabel: { color: c.secondary },
    outlinedLabel: { color: c.primary },
    dangerLabel: { color: c.onPrimary },
    // the dark palette lightens accent, so onAccent (white) would fall to ~3:1 there
    accentLabel: { color: isDark ? c.background : c.onAccent },
    solidLabel: { color: isDark ? c.background : c.onPrimary },
  }));
