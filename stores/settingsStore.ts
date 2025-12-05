import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontSizeMode, DEFAULT_FONT_SIZE_MODE } from '../constants';

interface SettingsState {
  fontSizeMode: FontSizeMode;
  isLoading: boolean;

  initialize: () => Promise<void>;
  setFontSizeMode: (mode: FontSizeMode) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  fontSizeMode: DEFAULT_FONT_SIZE_MODE,
  isLoading: true,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem('fontSizeMode');
      if (stored && ['small', 'medium', 'large'].includes(stored)) {
        set({ fontSizeMode: stored as FontSizeMode, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setFontSizeMode: async (mode: FontSizeMode) => {
    await AsyncStorage.setItem('fontSizeMode', mode);
    set({ fontSizeMode: mode });
  },
}));
