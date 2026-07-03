/**
 * 颜色工具模块
 *
 * 提供前端常见的颜色映射和处理工具函数。
 * 当前主要支持标签（Tag）组件的状态颜色映射。
 */

/**
 * 标签颜色映射表
 *
 * 将常见的业务状态（如 success/error/warning/info）以及
 * 英文状态词（如 active/inactive/pending/enabled/disabled 等）
 * 映射到 Arco Design 支持的标签颜色值。
 *
 * 适用于表格列渲染中将业务状态显示为彩色标签。
 */
const tagColorMap: Record<string, string> = {
  success: 'green',
  error: 'red',
  warning: 'orange',
  info: 'blue',
  default: 'gray',
  red: 'red',
  orange: 'orange',
  yellow: 'yellow',
  green: 'green',
  cyan: 'cyan',
  blue: 'blue',
  purple: 'purple',
  pink: 'pink',
  gray: 'gray',
  active: 'green',
  inactive: 'red',
  pending: 'orange',
  enabled: 'green',
  disabled: 'gray',
  online: 'green',
  offline: 'gray',
  running: 'green',
  stopped: 'red',
  completed: 'green',
  failed: 'red',
  processing: 'blue',
};

/**
 * Arco Design 内置的合法标签颜色列表
 */
const VALID_TAG_COLORS = [
  'red',
  'orangered',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'arcoblue',
  'purple',
  'pinkpurple',
  'magenta',
  'gray',
];

/**
 * 获取标签颜色
 *
 * 将传入的颜色值或状态名解析为 Arco Design Tag 组件支持的颜色。
 * 1. 如果是合法的 Arco 内置颜色值，直接返回
 * 2. 如果是业务状态名，从映射表中查找对应的颜色
 * 3. 如果都不匹配，返回 undefined（使用 Tag 的默认颜色）
 *
 * @param colorOrStatus - 颜色值或业务状态名
 * @returns 对应的 Arco Design 颜色值，或 undefined 使用默认颜色
 * @example
 * ```ts
 * getTagColor('success');   // 'green'
 * getTagColor('red');       // 'red'（合法颜色值直接返回）
 * getTagColor('unknown');   // undefined
 * ```
 */
export const getTagColor = (colorOrStatus?: string): string | undefined => {
  if (!colorOrStatus) {
    return undefined;
  }

  if (VALID_TAG_COLORS.includes(colorOrStatus)) {
    return colorOrStatus;
  }

  return tagColorMap[colorOrStatus.toLowerCase()];
};
