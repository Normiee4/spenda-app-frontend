import { useEffect, useState } from 'react';
import { Animated, DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { useThemedStyles } from '../../theme/useThemedStyles';

type Props = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Pulsing placeholder block for loading states. Hidden from assistive tech. */
export default function Skeleton({ width = '100%', height = 14, radius = 8, style }: Props) {
  const s = useStyles();
  const [opacity] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius, backgroundColor: s.base },
        { opacity },
        style,
      ]}
    />
  );
}

const useStyles = () =>
  useThemedStyles((c) => ({
    base: c.skeleton,
  }));
