import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ThemeType, ResolvedThemeType, ThemeContextValue } from './types';
import type { ReactNode } from 'react';

const THEME_KEY = 'lania-pro-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedThemeType {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: ThemeType, systemTheme: ResolvedThemeType): ResolvedThemeType {
  if (theme === 'system') {
    return systemTheme;
  }
  return theme;
}

function applyTheme(resolvedTheme: ResolvedThemeType) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  if (resolvedTheme === 'dark') {
    root.setAttribute('arco-theme', 'dark');
    body.setAttribute('arco-theme', 'dark');
    root.setAttribute('data-theme', 'dark');
    body.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('arco-theme');
    body.removeAttribute('arco-theme');
    root.removeAttribute('data-theme');
    body.removeAttribute('data-theme');
  }
}

export interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeType;
  storageKey?: string;
  onThemeChange?: (theme: ThemeType, resolvedTheme: ResolvedThemeType) => void;
}

export function ThemeProvider({
  children,
  initialTheme = 'system',
  storageKey = THEME_KEY,
  onThemeChange,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as ThemeType | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return initialTheme;
  });

  const [systemTheme, setSystemThemeState] = useState<ResolvedThemeType>(() => getSystemTheme());

  const resolvedTheme = useMemo<ResolvedThemeType>(() => {
    return resolveTheme(theme, systemTheme);
  }, [theme, systemTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemThemeState(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme);
    }
    applyTheme(resolvedTheme);
    onThemeChange?.(theme, resolvedTheme);
  }, [theme, resolvedTheme, storageKey, onThemeChange]);

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const current = prev === 'system' ? systemTheme : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemTheme]);

  const setLightTheme = useCallback(() => {
    setThemeState('light');
  }, []);

  const setDarkTheme = useCallback(() => {
    setThemeState('dark');
  }, []);

  const setSystemTheme = useCallback(() => {
    setThemeState('system');
  }, []);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      setLightTheme,
      setDarkTheme,
      setSystemTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
