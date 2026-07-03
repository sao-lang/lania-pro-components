/**
 * @lania-pro-components/theme
 *
 * 主题包入口文件
 *
 * 本包提供 Lania Pro Components 的主题系统，包含：
 * - ThemeProvider: 主题提供者 React 组件，管理全局主题状态
 * - useTheme: 在组件中获取主题上下文的 Hook
 * - lightTheme / darkTheme: 设计令牌（Design Tokens）定义（10 大类 ~90 个原子级令牌）
 * - cssVar / cssVarRef: 类型安全的 CSS 变量名生成器
 * - createLightTheme / createDarkTheme: 自定义主题创建工具
 * - 类型定义：ThemeType, ResolvedThemeType, ThemeContextValue, ThemeTokens
 *
 * @example
 * ```tsx
 * // 1. 在应用入口包裹 ThemeProvider
 * import { ThemeProvider } from '@lania-pro-components/theme';
 * <ThemeProvider initialTheme="system">
 *   <App />
 * </ThemeProvider>
 *
 * // 2. 在组件中使用主题
 * import { useTheme } from '@lania-pro-components/theme';
 * const { resolvedTheme, toggleTheme } = useTheme();
 * ```
 */

export { ThemeProvider } from './ThemeProvider';
export type { ThemeProviderProps } from './ThemeProvider';
export { useTheme } from './useTheme';
export type { ThemeType, ResolvedThemeType, ThemeContextValue, ThemeTokens } from './types';
export { lightTheme, darkTheme } from './themes';
export { cssVar, cssVarRef } from './cssVar';
export { createLightTheme, createDarkTheme } from './createTheme';
