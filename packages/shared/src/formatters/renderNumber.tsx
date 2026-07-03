/**
 * @lania-pro-components/shared
 *
 * renderNumber — 公共数字/货币/百分比格式器
 *
 * 委托 @lania-pro-components/utils 的 formatNumber/formatMoney/formatPercent 做数值格式化，
 * 仅处理 UI 渲染层（空值、颜色、前后缀）。
 */

import React from 'react';
import { formatNumber as utilsFormatNumber, formatMoney, formatPercent } from '@lania-pro-components/utils';

export interface RenderNumberOptions {
  /** 精度 */
  precision?: number;
  /** 千分位分隔 */
  thousandsSeparator?: boolean;
  /** 空值占位符 */
  emptyText?: string;
  /** 前缀 */
  prefix?: React.ReactNode;
  /** 后缀 */
  suffix?: React.ReactNode;
}

export interface RenderMoneyOptions extends RenderNumberOptions {
  /** 货币符号 */
  symbol?: string;
}

export interface RenderPercentOptions {
  /** 精度 */
  precision?: number;
  /** 空值占位符 */
  emptyText?: string;
  /** 正值颜色 */
  positiveColor?: string;
  /** 负值颜色 */
  negativeColor?: string;
}

const DEFAULT_EMPTY = '--';

/**
 * 数字渲染（千分位）
 */
export function renderNumber(value: unknown, options: RenderNumberOptions = {}): React.ReactNode {
  const { precision = 0, thousandsSeparator = true, emptyText = DEFAULT_EMPTY } = options;
  if (value === null || value === undefined || value === '') return <>{emptyText}</>;
  return <>{utilsFormatNumber(value as string | number, { precision, thousandsSeparator })}</>;
}

/**
 * 货币渲染
 */
export function renderMoney(value: unknown, options: RenderMoneyOptions = {}): React.ReactNode {
  const { symbol = '¥', precision = 2, thousandsSeparator = true, emptyText = DEFAULT_EMPTY } = options;
  if (value === null || value === undefined || value === '') return <>{emptyText}</>;
  const formatted = formatMoney(value as string | number, symbol, { precision, thousandsSeparator });
  return <span style={{ fontFamily: 'monospace' }}>{formatted}</span>;
}

/**
 * 百分比渲染
 */
export function renderPercent(value: unknown, options: RenderPercentOptions = {}): React.ReactNode {
  const { precision = 2, emptyText = DEFAULT_EMPTY, positiveColor = '#00b42a', negativeColor = '#f53f3f' } = options;
  if (value === null || value === undefined || value === '') return <>{emptyText}</>;

  const num = typeof value === 'string' ? parseFloat(value) : (value as number);
  const color = num > 0 ? positiveColor : num < 0 ? negativeColor : undefined;

  return (
    <span style={{ color, fontFamily: 'monospace' }}>{formatPercent(value as string | number, { precision })}</span>
  );
}
