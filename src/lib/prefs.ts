// Small typed prefs layer over AsyncStorage (PRD §8).
// Profile, theme mode, and the onboarding flag live here — no profile table.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export type Profile = {
  name: string;
  email: string;
};

const K = {
  onboarded: 'spenda.onboarded',
  theme: 'spenda.themeMode',
  profile: 'spenda.profile',
} as const;

export const DEFAULT_PROFILE: Profile = {
  name: '',
  email: '',
};

async function read<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Prefs are non-critical; a failed write must never crash the app.
  }
}

export const prefs = {
  async getOnboarded(): Promise<boolean> {
    return (await read<boolean>(K.onboarded)) ?? false;
  },
  setOnboarded(value: boolean): Promise<void> {
    return write(K.onboarded, value);
  },

  async getThemeMode(): Promise<ThemeMode> {
    return (await read<ThemeMode>(K.theme)) ?? 'system';
  },
  setThemeMode(mode: ThemeMode): Promise<void> {
    return write(K.theme, mode);
  },

  async getProfile(): Promise<Profile> {
    return { ...DEFAULT_PROFILE, ...((await read<Profile>(K.profile)) ?? {}) };
  },
  setProfile(profile: Profile): Promise<void> {
    return write(K.profile, profile);
  },

  /** Logout: clears profile + onboarding flag; expense data is kept (PRD §3). */
  async clearIdentity(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([K.onboarded, K.profile]);
    } catch {
      // ignore
    }
  },
};
