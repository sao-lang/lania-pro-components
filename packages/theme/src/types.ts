export type ThemeType = 'light' | 'dark' | 'system';

export type ResolvedThemeType = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeType;
  resolvedTheme: ResolvedThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  setLightTheme: () => void;
  setDarkTheme: () => void;
  setSystemTheme: () => void;
}
