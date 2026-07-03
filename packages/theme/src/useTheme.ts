/**
 * useTheme Hook
 *
 * 必须在 ThemeProvider 内部使用，否则会抛出错误。
 *
 * @returns 主题上下文值，包含当前主题状态和操作方法
 * @throws 如果在 ThemeProvider 外部调用，会抛出 Error
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { resolvedTheme, toggleTheme } = useTheme();
 *   return <button onClick={toggleTheme}>{resolvedTheme}</button>;
 * }
 * ```
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemeContextValue } from './types';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return context;
}
