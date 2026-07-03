/**
 * 主题系统类型定义
 *
 * 定义了主题系统所需的类型，包括主题类型、上下文值、设计令牌结构等。
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
 * 设计令牌（Design Tokens）完整结构
 *
 * 主题包的核心数据模型，lightTheme / darkTheme 均实现此接口。
 */
export interface ThemeTokens {
  color: {
    bg: { 1: string; 2: string; 3: string; 4: string };
    text: { 1: string; 2: string; 3: string; 4: string };
    border: { 1: string; 2: string; 3: string };
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primaryLight: string;
    success: string;
    successHover: string;
    successActive: string;
    successLight: string;
    successBorder: string;
    warning: string;
    warningHover: string;
    warningActive: string;
    warningLight: string;
    warningBorder: string;
    danger: string;
    dangerHover: string;
    dangerActive: string;
    dangerLight: string;
    dangerBorder: string;
    info: string;
    infoLight: string;
    link: string;
    linkHover: string;
    linkActive: string;
    mask: string;
    disabledBg: string;
    disabledText: string;
    disabledBorder: string;
    rowHover: string;
    rowSelected: string;
    rowStriped: string;
    highlight: string;
  };
  fontSize: { xs: string; sm: string; base: string; lg: string; xl: string; xxl: string };
  fontFamily: { base: string; code: string; numeric: string };
  fontWeight: { regular: number; medium: number; semibold: number; bold: number };
  lineHeight: { tight: number; base: number; loose: number };
  spacing: { xs: string; sm: string; md: string; lg: string; xl: string; xxl: string };
  radius: { sm: string; md: string; lg: string; xl: string; full: string };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    dropdown: string;
    drawer: string;
    modal: string;
    card: string;
    none: string;
  };
  opacity: { disabled: number; loading: number; mask: number; secondary: number; placeholder: number };
  zIndex: { dropdown: number; sticky: number; drawer: number; modal: number; message: number; tooltip: number };
  transition: { durationFast: string; durationNormal: string; durationSlow: string; timingFunction: string };
  breakpoint: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
}

/**
 * 主题上下文值
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
