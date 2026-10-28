import { Text, View } from 'react-native';
import { ColorSet } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

export default function GetStartedScreen() {
  const s = useStyles();
  return (
    <View style={s.wrap}>
      <View style={s.logo}>
        <Text style={s.logoMark}>₱</Text>
      </View>
      <Text style={s.tag}>Your expenses, written like notes.</Text>
      <Text style={s.points}>
        Offline always{'\u00A0'}·{'\u00A0'}seconds per entry{'\u00A0'}·{'\u00A0'}nothing leaves your
        phone
      </Text>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet) => ({
    wrap: {
      alignItems: 'center',
      gap: 16,
    },
    logo: {
      width: 88,
      height: 88,
      borderRadius: 24,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      // soft-UI dual layer
      shadowColor: '#A7B1AC',
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 6,
    },
    logoMark: {
      fontSize: 44,
      fontWeight: '700',
      color: c.onPrimary,
    },
    tag: {
      fontSize: 18,
      lineHeight: 26,
      color: c.text,
      textAlign: 'center',
    },
    points: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
  }));
