// app/(home)/_layout.tsx — two tabs: Log (landing after onboarding) + Profile (PRD §3).
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PlatformPressable } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorSet, radius } from '../../constants/theme';
import { useThemedStyles } from '../../theme/useThemedStyles';

export default function HomeLayout() {
  const insets = useSafeAreaInsets();
  const s = useStyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: s.tintActive,
        tabBarInactiveTintColor: s.tintInactive,
        tabBarLabelStyle: s.label,
        // Save stays reachable while typing (PRD §5.1) — hide only the pill.
        tabBarHideOnKeyboard: true,
        // 26pt from the screen edges, 20pt above the phone's nav bar
        tabBarStyle: [s.tabBar, { bottom: insets.bottom + 20 }],
        // clip the Android borderless ripple to a rounded chip per tab
        tabBarItemStyle: s.tabItem,

        tabBarButton: (props) => (
          <PlatformPressable {...props} pressColor="transparent" pressOpacity={1} />
        ),
        // soft-UI: two stacked layers = white catch-light top-left, grey shade bottom-right
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <View style={[StyleSheet.absoluteFill, s.pill, s.pillShade]} />
            <View style={[StyleSheet.absoluteFill, s.pill, s.pillLight]} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="Log"
        options={{
          title: 'Log',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'create' : 'create-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="History"
        options={{
          title: 'History',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile-settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const useStyles = () =>
  useThemedStyles((c: ColorSet, isDark) => ({
    tintActive: c.primary,
    tintInactive: c.textMuted,
    label: {
      fontSize: 11,
      fontWeight: '600' as const,
    },
    tabBar: {
      position: 'absolute' as const,
      start: 26,
      end: 26,
      left: 26,
      right: 26,
      height: 64,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      // cancel the defaults React Navigation merges in before tabBarStyle:
      // it reserves insets.bottom inside our fixed height (clips labels)
      paddingBottom: 0,
      paddingHorizontal: 0,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabItem: {
      borderRadius: radius.full,
      overflow: 'hidden' as const,
    },
    pill: {
      borderRadius: radius.full,
      backgroundColor: c.background,
    },
    pillShade: {
      shadowColor: isDark ? '#000000' : '#A7B1AC',
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: isDark ? 0.7 : 0.5,
      shadowRadius: 10,
      elevation: 8,
    },
    pillLight: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: -5, height: -5 },
      shadowOpacity: isDark ? 0.05 : 1,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)',
    },
  }));
