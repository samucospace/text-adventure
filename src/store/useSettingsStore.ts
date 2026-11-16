import { create } from 'zustand';

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'oled';

export const READER_THEMES: Record<
  ReaderTheme,
  {
    label: string;
    bg: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentText: string;
  }
> = {
  light: {
    label: 'Paper',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0',
    accent: '#4F46E5',
    accentText: '#FFFFFF',
  },
  sepia: {
    label: 'Sepia',
    bg: '#F4ECD8',
    surface: '#FAF4E6',
    text: '#433422',
    muted: '#7C6A54',
    border: '#DFD2B7',
    accent: '#9A5B25',
    accentText: '#FFFFFF',
  },
  dark: {
    label: 'Slate',
    bg: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    muted: '#94A3B8',
    border: '#334155',
    accent: '#6366F1',
    accentText: '#FFFFFF',
  },
  oled: {
    label: 'OLED',
    bg: '#000000',
    surface: '#111111',
    text: '#E5E7EB',
    muted: '#737373',
    border: '#262626',
    accent: '#818CF8',
    accentText: '#000000',
  },
};

interface SettingsState {
  theme: ReaderTheme;
  fontSize: number;
  setTheme: (theme: ReaderTheme) => void;
  setFontSize: (fontSize: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  fontSize: 17,
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize: Math.min(26, Math.max(13, fontSize)) }),
}));
