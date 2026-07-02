import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemeType } from './types';
import type { ReactNode } from 'react';

const THEME_KEY = 'lania-pro-theme';

interface ThemeContextValue {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, initialTheme = 'light' }: { children: ReactNode; initialTheme?: ThemeType }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY) as ThemeType | null;
      if (stored) {
        return stored;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return initialTheme;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_KEY, theme);
      if (theme === 'dark') {
        document.documentElement.setAttribute('arco-theme', 'dark');
        document.body.setAttribute('arco-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('arco-theme');
        document.body.removeAttribute('arco-theme');
      }
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
