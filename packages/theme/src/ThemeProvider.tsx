/**
 * 主题提供者组件和 Hook
 *
 * 提供 React 上下文（Context）机制的主题系统，支持：
 * - 三种主题模式：light（明亮）、dark（暗黑）、system（跟随系统）
 * - 主题持久化（localStorage 存储）
 * - 跟随系统主题变化（通过 matchMedia 监听）
 * - 主题切换 API（setTheme / toggleTheme / setLightTheme / setDarkTheme / setSystemTheme）
 *
 * 工作原理：
 * 1. ThemeProvider 包裹应用根组件，管理全局主题状态
 * 2. theme 存储用户选择的主题类型（可能为 system）
 * 3. resolvedTheme 经过解析后得到实际应用的主题（必定为 light 或 dark）
 * 4. applyTheme() 将解析后的主题应用到 DOM（设置 arco-theme / data-theme 属性）
 * 5. 子组件通过 useTheme() hook 获取主题上下文
 *
 * @example
 * ```tsx
 * // 应用入口
 * <ThemeProvider initialTheme="system" onThemeChange={handleThemeChange}>
 *   <App />
 * </ThemeProvider>
 *
 * // 子组件中使用
 * function MyComponent() {
 *   const { resolvedTheme, toggleTheme } = useTheme();
 *   return (
 *     <div>
 *       <span>当前主题: {resolvedTheme}</span>
 *       <button onClick={toggleTheme}>切换主题</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ThemeType, ResolvedThemeType, ThemeContextValue } from './types';
import type { ReactNode } from 'react';

/** localStorage 存储键名（默认值，可通过 storageKey prop 覆盖） */
const THEME_KEY = 'lania-pro-theme';

/** 主题上下文对象，初始值为 null（Provider 外访问会报错） */
const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 获取系统当前的主题偏好
 *
 * 通过 window.matchMedia 查询系统配色方案。
 * 服务端渲染（SSR）环境下无法获取，默认返回 'light'。
 *
 * @returns 系统偏好的主题（'light' 或 'dark'）
 */
function getSystemTheme(): ResolvedThemeType {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 解析主题类型
 *
 * 将用户选择的 ThemeType（可能包含 'system'）解析为具体的 ResolvedThemeType。
 *
 * @param theme - 用户选择的主题类型
 * @param systemTheme - 当前系统主题偏好
 * @returns 解析后的具体主题
 */
function resolveTheme(theme: ThemeType, systemTheme: ResolvedThemeType): ResolvedThemeType {
  if (theme === 'system') {
    return systemTheme; // 'system' 时跟随系统偏好
  }
  return theme; // 'light' 或 'dark' 时直接使用
}

/**
 * 将主题应用到 DOM 元素
 *
 * 通过设置 HTML/Body 元素的属性来触发 Arco Design 和其他 UI 库的主题切换：
 * - arco-theme：Arco Design 组件库使用的主题属性
 * - data-theme：自定义数据属性，方便 CSS 变量 / 样式选择器使用
 *
 * 深色模式：设置属性值 'dark'
 * 浅色模式：移除属性（默认即为浅色）
 *
 * @param resolvedTheme - 解析后的实际主题
 */
function applyTheme(resolvedTheme: ResolvedThemeType) {
  if (typeof window === 'undefined') return; // SSR 保障

  const root = document.documentElement;
  const body = document.body;

  if (resolvedTheme === 'dark') {
    // 深色模式：设置 arco-theme 和 data-theme 属性
    root.setAttribute('arco-theme', 'dark');
    body.setAttribute('arco-theme', 'dark');
    root.setAttribute('data-theme', 'dark');
    body.setAttribute('data-theme', 'dark');
  } else {
    // 浅色模式：移除属性（Arco Design 默认即为浅色主题）
    root.removeAttribute('arco-theme');
    body.removeAttribute('arco-theme');
    root.removeAttribute('data-theme');
    body.removeAttribute('data-theme');
  }
}

// ======================== 组件 Props ========================

/**
 * ThemeProvider 组件的 Props
 */
export interface ThemeProviderProps {
  /** 子节点（通常是整个应用） */
  children: ReactNode;
  /** 初始主题，默认为 'system' */
  initialTheme?: ThemeType;
  /** localStorage 存储键名，用于持久化用户选择 */
  storageKey?: string;
  /** 主题变化时的回调函数 */
  onThemeChange?: (theme: ThemeType, resolvedTheme: ResolvedThemeType) => void;
}

// ======================== ThemeProvider 组件 ========================

/**
 * 主题提供者组件
 *
 * 必须在应用根节点使用，包裹所有需要访问主题的组件。
 * 管理主题状态、持久化、系统主题监听和 DOM 属性设置。
 *
 * 提供两种主题使用方式：
 * 1. React Context（推荐）：子组件通过 useTheme() 获取主题信息
 * 2. DOM 属性：通过 CSS 选择器 [data-theme="dark"] / [arco-theme="dark"] 定制样式
 */
export function ThemeProvider({
  children,
  initialTheme = 'system',
  storageKey = THEME_KEY,
  onThemeChange,
}: ThemeProviderProps) {
  // ===== 主题状态 =====
  // 初始化时优先从 localStorage 读取，其次使用 initialTheme
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as ThemeType | null;
      // 校验存储值的有效性
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return initialTheme;
  });

  // ===== 系统主题监听 =====
  const [systemTheme, setSystemThemeState] = useState<ResolvedThemeType>(() => getSystemTheme());

  // ===== 解析后的实际主题 =====
  // 使用 useMemo 缓存计算结果，仅在依赖变化时重新计算
  const resolvedTheme = useMemo<ResolvedThemeType>(() => {
    return resolveTheme(theme, systemTheme);
  }, [theme, systemTheme]);

  // ===== 系统主题变化监听 =====
  // 通过 matchMedia 监听操作系统的主题切换（如 macOS 的自动外观切换）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemThemeState(e.matches ? 'dark' : 'light');
    };

    // 兼容新旧 API：addEventListener（现代浏览器） vs addListener（旧浏览器）
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      // 清理监听器
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // ===== 主题应用与持久化 =====
  // 当 theme 或 resolvedTheme 变化时：
  // 1. 持久化用户选择到 localStorage
  // 2. 将主题属性应用到 DOM
  // 3. 触发 onThemeChange 回调
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme);
    }
    applyTheme(resolvedTheme);
    onThemeChange?.(theme, resolvedTheme);
  }, [theme, resolvedTheme, storageKey, onThemeChange]);

  // ===== 主题操作 API =====

  /** 设置指定主题（light / dark / system） */
  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
  }, []);

  /** 在 light 和 dark 之间切换（如果当前是 system，基于 systemTheme 切换） */
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const current = prev === 'system' ? systemTheme : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemTheme]);

  /** 设置为明亮主题 */
  const setLightTheme = useCallback(() => {
    setThemeState('light');
  }, []);

  /** 设置为暗黑主题 */
  const setDarkTheme = useCallback(() => {
    setThemeState('dark');
  }, []);

  /** 设置为跟随系统主题 */
  const setSystemTheme = useCallback(() => {
    setThemeState('system');
  }, []);

  // ===== 组合 Context 值 =====
  // 使用 useMemo 避免每次渲染都创建新对象引用
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

// ======================== useTheme Hook ========================

/**
 * 获取当前主题上下文的 Hook
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
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
