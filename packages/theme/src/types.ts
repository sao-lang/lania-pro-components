/**
 * 主题系统类型定义
 *
 * 定义了主题系统所需的类型，包括主题类型、上下文值等。
 */

/**
 * 主题类型
 *
 * - 'light': 明亮主题（强制使用浅色模式）
 * - 'dark': 暗黑主题（强制使用深色模式）
 * - 'system': 跟随系统（根据操作系统主题自动切换）
 */
export type ThemeType = 'light' | 'dark' | 'system';

/**
 * 解析后的主题类型
 *
 * 经过 resolveTheme 处理后，'system' 会被解析为具体的 'light' 或 'dark'。
 * 这是最终实际应用的主题（只有两种可能），不再包含 'system'。
 */
export type ResolvedThemeType = 'light' | 'dark';

/**
 * 主题上下文值
 *
 * 通过 React Context 向下传递的主题状态和操作方法。
 * 子组件通过 useTheme() 获取此对象。
 */
export interface ThemeContextValue {
  /** 当前主题设置（可能为 'system'） */
  theme: ThemeType;
  /** 解析后的实际主题（'light' 或 'dark'） */
  resolvedTheme: ResolvedThemeType;
  /** 设置为指定主题 */
  setTheme: (theme: ThemeType) => void;
  /** 切换明暗主题（在 light/dark 之间切换） */
  toggleTheme: () => void;
  /** 设置为明亮主题 */
  setLightTheme: () => void;
  /** 设置为暗黑主题 */
  setDarkTheme: () => void;
  /** 设置为跟随系统主题 */
  setSystemTheme: () => void;
}
