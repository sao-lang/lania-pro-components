/**
 * 格式化工具模块
 *
 * 提供常用的数据格式化函数，包括：
 * - 数字千分位格式化
 * - 货币格式化
 * - 百分比格式化
 * - 日期格式化
 *
 * 日期格式化依赖于 dayjs 库。
 */

import dayjs from 'dayjs';

/**
 * 格式化数字为千分位字符串
 *
 * 将数字或数字字符串格式化为带千分位分隔符和指定小数位的字符串。
 * 适用于表格数据展示、统计数值显示等场景。
 *
 * @param value - 待格式化的数字或数字字符串
 * @param options - 格式化选项
 * @param options.precision - 保留的小数位数，默认为 0
 * @param options.thousandsSeparator - 是否使用千分位逗号分隔，默认为 true
 * @returns 格式化后的数字字符串；如果输入无法解析为数字，则原样返回输入的字符串
 *
 * @example
 * ```ts
 * formatNumber(1234567);           // '1,234,567'
 * formatNumber(1234567.89, { precision: 2 }); // '1,234,567.89'
 * formatNumber('abc');             // 'abc'（无法解析，原样返回）
 * ```
 */
export const formatNumber = (
  value: number | string,
  options: {
    precision?: number;
    thousandsSeparator?: boolean;
  } = {},
): string => {
  const { precision = 0, thousandsSeparator = true } = options;
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // 无法解析为有效数字时，返回原始字符串
  if (isNaN(num)) {
    return String(value);
  }

  // 先格式化为指定小数位
  let result = num.toFixed(precision);

  // 添加千分位逗号分隔：利用正则表达式每三位数字前插入逗号
  if (thousandsSeparator) {
    const parts = result.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    result = parts.join('.');
  }

  return result;
};

/**
 * 格式化货币金额
 *
 * 在数字格式化的基础上添加货币符号前缀，默认保留两位小数并使用千分位分隔。
 * 适用于金额展示、订单金额等场景。
 *
 * @param value - 金额数值或数字字符串
 * @param symbol - 货币符号，默认为人民币符号 '¥'
 * @param options - 数字格式化选项（同 formatNumber）
 * @param options.precision - 小数位数，货币默认 2 位
 * @param options.thousandsSeparator - 是否使用千分位分隔，默认 true
 * @returns 带货币符号的格式化金额字符串
 *
 * @example
 * ```ts
 * formatMoney(1234567.89);           // '¥1,234,567.89'
 * formatMoney(100, '$');             // '$100.00'
 * formatMoney(99.9, '¥', { precision: 0 }); // '¥100'
 * ```
 */
export const formatMoney = (
  value: number | string,
  symbol = '¥',
  options: {
    precision?: number;
    thousandsSeparator?: boolean;
  } = {},
): string => {
  // 货币默认保留 2 位小数，允许通过 options 覆盖
  const formatted = formatNumber(value, {
    precision: 2,
    thousandsSeparator: true,
    ...options,
  });
  return `${symbol}${formatted}`;
};

/**
 * 格式化百分比
 *
 * 将小数或整数值转换为百分比字符串。
 * 注意：输入 0.5 表示 50%，而非 0.5%。
 *
 * @param value - 百分比数值（如 50.123 表示 50.123%）
 * @param options - 格式化选项
 * @param options.precision - 保留小数位数，默认 2 位
 * @param options.showSymbol - 是否显示百分号，默认 true
 * @returns 格式化后的百分比字符串；如果输入无法解析则返回原始字符串
 *
 * @example
 * ```ts
 * formatPercent(50.123);            // '50.12%'
 * formatPercent(0.5);               // '0.50%'（注意不是 50%）
 * formatPercent(75, { showSymbol: false }); // '75.00'
 * ```
 */
export const formatPercent = (
  value: number | string,
  options: {
    precision?: number;
    showSymbol?: boolean;
  } = {},
): string => {
  const { precision = 2, showSymbol = true } = options;
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // 无法解析为有效数字时，返回原始字符串
  if (isNaN(num)) {
    return String(value);
  }

  const result = num.toFixed(precision);
  return showSymbol ? `${result}%` : result;
};

/**
 * 格式化日期
 *
 * 使用 dayjs 将日期值格式化为指定格式的字符串。
 * 支持多种输入类型（时间戳、字符串、Date 对象）。
 *
 * @param value - 日期值，支持：
 *   - string: ISO 日期字符串或时间戳字符串
 *   - number: Unix 时间戳（毫秒）
 *   - Date: 原生 Date 对象
 * @param format - dayjs 格式模板字符串，默认为 'YYYY-MM-DD'
 *                 常用格式：
 *                 - 'YYYY-MM-DD' → 2024-01-15
 *                 - 'YYYY-MM-DD HH:mm:ss' → 2024-01-15 14:30:00
 *                 - 'YYYY年MM月DD日' → 2024年01月15日
 * @returns 格式化后的日期字符串；空值返回 '-'，无效日期返回原始输入字符串
 *
 * @example
 * ```ts
 * formatDate('2024-01-15');                          // '2024-01-15'
 * formatDate(1705312800000, 'YYYY-MM-DD HH:mm:ss');  // '2024-01-15 14:00:00'
 * formatDate('');                                     // '-'
 * ```
 */
export const formatDate = (value: string | number | Date, format: string = 'YYYY-MM-DD'): string => {
  // 空值（null/undefined/空字符串）返回占位符
  if (!value) {
    return '-';
  }

  const date = dayjs(value);

  // dayjs 无法解析的日期返回原始字符串
  if (!date.isValid()) {
    return String(value);
  }

  return date.format(format);
};
