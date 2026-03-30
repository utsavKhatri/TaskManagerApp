import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, useColorScheme, Platform } from 'react-native';

const lightPalette = {
  // Core
  background: '#FFFFFF',
  surface: '#F4F2EF',
  surfaceHighlight: '#E8E4DE',
  /** Elevated panels (cards, sheets, fields) */
  card: '#FFFFFF',
  /** Completed task row — slightly softer than active cards */
  cardDone: '#F5F2EE',
  /** Modal / bottom sheet scrim */
  overlay: 'rgba(28, 24, 20, 0.52)',

  // Text
  textPrimary: '#1C1C1E',
  textSecondary: '#5A5A60',
  textTertiary: '#C7C7CC',
  /** Done tasks — readable contrast, still secondary to active */
  completedTitle: '#3A3A40',
  completedBody: '#65656E',

  // Accents
  accent: '#B45309', // Burnt Copper
  border: '#E6D3C1', // Warm neutral divider
  /** `TextInput` / form fields (unfocused); must read on `card` */
  inputBorder: '#D2C2B3',

  // Functional
  success: '#2F7D4E', // Muted green (not loud)
  error: '#B3261E', // Deep red (less aggressive)
  warning: '#C7771A', // Copper-adjacent amber
  transparent: 'transparent',
};

const darkPalette = {
  // Core
  background: '#0B0B0E',
  surface: '#141418',
  surfaceHighlight: '#2A2A31',
  card: '#1E1E24',
  cardDone: '#18181E',
  overlay: 'rgba(0, 0, 0, 0.72)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B8',
  textTertiary: '#6E6E78',
  completedTitle: '#C8C8D4',
  completedBody: '#9494A3',

  // Accents
  accent: '#D97706', // Warm copper glow
  border: '#3A2A1F', // Deep warm divider (lists, chrome)
  /** Visible on `card` / sheets — `border` is too low-contrast for inputs */
  inputBorder: 'rgba(255, 255, 255, 0.22)',

  // Functional
  success: '#4CAF83', // Soft emerald
  error: '#EF6A5B', // Warm red
  warning: '#E0A84E', // Muted gold
  transparent: 'transparent',
};

export type ThemeColors = typeof lightPalette;

// For backward compatibility while refactoring, we export a static palette
export const palette = lightPalette;

export const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

/** Minimum interactive target (WCAG / platform HIG ~44pt) */
export const touchTargetMin = 44;

/**
 * `useSafeAreaInsets().bottom` is often 0 inside React Native `Modal`, so footers
 * can sit under the home indicator. Combine the hook value with a platform floor.
 */
export function getModalSafeBottomInset(hookBottomInset: number): number {
  const fallback = Platform.select({
    ios: 34,
    android: 28,
    default: 20,
  })!;
  return Math.max(hookBottomInset, fallback);
}

export const radius = {
  s: 8,
  m: 12,
  l: 16,
  full: 999,
};

export const typography = {
  title1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 38,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.4,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
};

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const themeValue = useMemo(() => {
    return {
      colors: isDark ? darkPalette : lightPalette,
      isDark,
    };
  }, [isDark]);

  return (
    <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadowSubtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
