/**
 * 设计令牌（Design Tokens）定义
 *
 * 提供 light（明亮）和 dark（暗黑）两种主题的设计令牌。
 * 包含 10 大类 ~90 个原子级令牌。
 *
 * 设计原则：
 * - 所有令牌值均为原子级别的 CSS 值
 * - 主题间结构完全一致，仅值不同
 * - 命名遵循语义化规范
 */

import type { ThemeTokens } from './types';

export const lightTheme: ThemeTokens = {
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
    successBorder: '#b7eb8f',
    warning: '#ff7d00',
    warningHover: '#ff9533',
    warningActive: '#d96800',
    warningLight: '#fff7e8',
    warningBorder: '#ffd591',
    danger: '#f53f3f',
    dangerHover: '#f76868',
    dangerActive: '#d93636',
    dangerLight: '#fff1f0',
    dangerBorder: '#ffa39e',
    info: '#86909c',
    infoLight: '#f2f3f5',
    link: '#165dff',
    linkHover: '#4080ff',
    linkActive: '#094fd6',
    mask: 'rgba(0, 0, 0, 0.35)',
    disabledBg: '#f5f5f5',
    disabledText: '#b3b3b3',
    disabledBorder: '#e8e8e8',
    rowHover: '#f5f5f5',
    rowSelected: '#e8f0ff',
    rowStriped: '#fafafa',
    highlight: '#fff7e8',
  },
  fontSize: { xs: '12px', sm: '13px', base: '14px', lg: '16px', xl: '18px', xxl: '24px' },
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    code: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    numeric: '"Helvetica Neue", Arial, sans-serif',
  },
  fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeight: { tight: 1.2, base: 1.5, loose: 1.8 },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' },
  radius: { sm: '4px', md: '6px', lg: '8px', xl: '12px', full: '9999px' },
  /** 阴影 */
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.06)',
    md: '0 4px 16px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.10)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.12)',
    dropdown: '0 4px 12px rgba(0, 0, 0, 0.10)',
    drawer: '-4px 0 12px rgba(0, 0, 0, 0.10)',
    modal: '0 8px 24px rgba(0, 0, 0, 0.15)',
    card: '0 1px 4px rgba(0, 0, 0, 0.06)',
    none: 'none',
  },
  opacity: { disabled: 0.4, loading: 0.6, mask: 0.35, secondary: 0.65, placeholder: 0.4 },
  zIndex: { dropdown: 1000, sticky: 1020, drawer: 1030, modal: 1040, message: 1050, tooltip: 1060 },
  transition: {
    durationFast: '0.15s',
    durationNormal: '0.25s',
    durationSlow: '0.35s',
    timingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  breakpoint: { xs: 576, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1600 },
};

export const darkTheme: ThemeTokens = {
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
    successBorder: 'rgba(82, 196, 26, 0.3)',
    warning: '#fa8c16',
    warningHover: '#ffa940',
    warningActive: '#d46b08',
    warningLight: 'rgba(250, 140, 22, 0.15)',
    warningBorder: 'rgba(250, 140, 22, 0.3)',
    danger: '#ff4d4f',
    dangerHover: '#ff7875',
    dangerActive: '#cf1322',
    dangerLight: 'rgba(255, 77, 79, 0.15)',
    dangerBorder: 'rgba(255, 77, 79, 0.3)',
    info: '#919191',
    infoLight: 'rgba(145, 145, 145, 0.1)',
    link: '#66a1ff',
    linkHover: '#8bb8ff',
    linkActive: '#4080ff',
    mask: 'rgba(0, 0, 0, 0.55)',
    disabledBg: '#2d2d2d',
    disabledText: '#595959',
    disabledBorder: '#363636',
    rowHover: '#2d2d2d',
    rowSelected: 'rgba(64, 128, 255, 0.1)',
    rowStriped: '#202020',
    highlight: 'rgba(250, 140, 22, 0.2)',
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '24px',
  },
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    code: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    numeric: '"Helvetica Neue", Arial, sans-serif',
  },
  fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeight: { tight: 1.2, base: 1.5, loose: 1.8 },
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
    dropdown: '0 4px 12px rgba(0, 0, 0, 0.4)',
    drawer: '-4px 0 12px rgba(0, 0, 0, 0.4)',
    modal: '0 8px 24px rgba(0, 0, 0, 0.5)',
    card: '0 1px 4px rgba(0, 0, 0, 0.3)',
    none: 'none',
  },
  opacity: { disabled: 0.35, loading: 0.5, mask: 0.55, secondary: 0.6, placeholder: 0.35 },
  zIndex: { dropdown: 1000, sticky: 1020, drawer: 1030, modal: 1040, message: 1050, tooltip: 1060 },
  transition: {
    durationFast: '0.15s',
    durationNormal: '0.25s',
    durationSlow: '0.35s',
    timingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  breakpoint: { xs: 576, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1600 },
};
