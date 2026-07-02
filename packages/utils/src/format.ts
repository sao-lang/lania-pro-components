/**
 * 格式化工具
 */
import dayjs from 'dayjs';

/**
 * 格式化数字为千分位
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

  if (isNaN(num)) {
    return String(value);
  }

  let result = num.toFixed(precision);

  if (thousandsSeparator) {
    const parts = result.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    result = parts.join('.');
  }

  return result;
};

/**
 * 格式化货币
 */
export const formatMoney = (
  value: number | string,
  symbol = '¥',
  options: {
    precision?: number;
    thousandsSeparator?: boolean;
  } = {},
): string => {
  const formatted = formatNumber(value, {
    precision: 2,
    thousandsSeparator: true,
    ...options,
  });
  return `${symbol}${formatted}`;
};

/**
 * 格式化百分比
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

  if (isNaN(num)) {
    return String(value);
  }

  const result = num.toFixed(precision);
  return showSymbol ? `${result}%` : result;
};

/**
 * 格式化日期
 * @param value 日期值
 * @param format dayjs 格式字符串，默认 'YYYY-MM-DD'
 */
export const formatDate = (value: string | number | Date, format: string = 'YYYY-MM-DD'): string => {
  if (!value) {
    return '-';
  }
  const date = dayjs(value);
  if (!date.isValid()) {
    return String(value);
  }
  return date.format(format);
};
