/**
 * 设计令牌（Design Tokens）定义
 *
 * 提供 light（明亮）和 dark（暗黑）两种主题的设计令牌。
 * 设计令牌是 UI 组件库的基础配置，包含颜色、字体大小、间距、圆角、阴影等。
 *
 * 设计原则：
 * - 所有令牌值均为原子级别的 CSS 值（如 '#ffffff', '14px'）
 * - 主题间结构完全一致（相同的 key 结构），仅值不同
 * - 命名遵循语义化规范（如 primary, success, warning, danger）
 */

/**
 * 明亮主题（Light Theme）设计令牌
 *
 * 背景使用浅色系（白色/灰色），文字使用深色系，适合光线充足的阅读环境。
 */
export const lightTheme = {
  /** 颜色系统 */
  color: {
    /** 背景色层级
     *  1: 主背景（白底）
     *  2-4: 逐层加深的灰色背景
     */
    bg: {
      1: '#ffffff',
      2: '#f5f5f5',
      3: '#f0f0f0',
      4: '#e8e8e8',
    },
    /** 文字色层级
     *  1: 主要文字（深黑）
     *  2-4: 逐层变浅的次要文字/辅助文字
     */
    text: {
      1: '#1a1a1a',
      2: '#4a4a4a',
      3: '#8a8a8a',
      4: '#b3b3b3',
    },
    /** 边框色层级
     *  由深到浅的三个层级
     */
    border: {
      1: '#d9d9d9',
      2: '#e8e8e8',
      3: '#f0f0f0',
    },
    // ---- 功能色 ----
    /** 主色调（蓝色系）- 品牌色，用于按钮、链接等 */
    primary: '#165dff',
    /** 主色调悬停态 */
    primaryHover: '#4080ff',
    /** 主色调按下态 */
    primaryActive: '#094fd6',
    /** 主色调浅色背景 */
    primaryLight: '#e8f0ff',
    /** 成功色（绿色系）- 用于成功状态、正向操作 */
    success: '#00b42a',
    successHover: '#33c357',
    successActive: '#009a24',
    successLight: '#e8f8ed',
    /** 警告色（橙色系）- 用于警告提示 */
    warning: '#ff7d00',
    warningHover: '#ff9533',
    warningActive: '#d96800',
    warningLight: '#fff7e8',
    /** 危险色（红色系）- 用于错误、删除操作 */
    danger: '#f53f3f',
    dangerHover: '#f76868',
    dangerActive: '#d93636',
    dangerLight: '#fff1f0',
    /** 信息色（灰色系）- 用于中性信息提示 */
    info: '#86909c',
    infoLight: '#f2f3f5',
  },
  /** 字体大小 */
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '24px',
  },
  /** 间距 */
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  /** 圆角 */
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px', // 完全圆角（胶囊形）
  },
  /** 阴影 */
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.06)',
    md: '0 4px 16px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.1)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.12)',
  },
};

/**
 * 暗黑主题（Dark Theme）设计令牌
 *
 * 背景使用深色系，文字使用浅色系，适合弱光环境下的阅读体验。
 * 结构完全与 lightTheme 一致，仅值不同。
 * 注意：功能色在暗黑主题下会适当加亮，以保证在深色背景上的可读性。
 */
export const darkTheme = {
  color: {
    bg: {
      1: '#1a1a1a',
      2: '#242424',
      3: '#2d2d2d',
      4: '#3d3d3d',
    },
    text: {
      1: '#f5f5f5',
      2: '#d9d9d9',
      3: '#8c8c8c',
      4: '#595959',
    },
    border: {
      1: '#434343',
      2: '#363636',
      3: '#2d2d2d',
    },
    primary: '#4080ff',
    primaryHover: '#66a1ff',
    primaryActive: '#165dff',
    // 暗黑主题下的浅色背景使用半透明色值，与深色背景融合更好
    primaryLight: 'rgba(64, 128, 255, 0.15)',
    success: '#52c41a',
    successHover: '#73d13d',
    successActive: '#389e0d',
    successLight: 'rgba(82, 196, 26, 0.15)',
    warning: '#fa8c16',
    warningHover: '#ffa940',
    warningActive: '#d46b08',
    warningLight: 'rgba(250, 140, 22, 0.15)',
    danger: '#ff4d4f',
    dangerHover: '#ff7875',
    dangerActive: '#cf1322',
    dangerLight: 'rgba(255, 77, 79, 0.15)',
    info: '#919191',
    infoLight: 'rgba(145, 145, 145, 0.1)',
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '24px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    md: '0 4px 16px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.6)',
  },
};
