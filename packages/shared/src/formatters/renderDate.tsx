/**
 * @lania-pro-components/shared
 *
 * renderDate — 公共日期格式器
 *
 * 委托 @lania-pro-components/utils 的 formatDate 做日期格式化。
 */

import React from 'react';
import { formatDate } from '@lania-pro-components/utils';

export interface RenderDateOptions {
  /** 日期格式（默认 YYYY-MM-DD） */
  format?: string;
  /** 空值占位符 */
  emptyText?: string;
  /** 范围分隔符 */
  rangeSeparator?: string;
}

const DEFAULT_EMPTY = '--';

/**
 * 日期渲染
 */
export function renderDate(value: unknown, options: RenderDateOptions = {}): React.ReactNode {
  const { format = 'YYYY-MM-DD', emptyText = DEFAULT_EMPTY, rangeSeparator = ' ~ ' } = options;
  if (!value) return <>{emptyText}</>;

  if (Array.isArray(value)) {
    const start = value[0] ? formatDate(value[0] as string | number | Date, format) : '';
    const end = value[1] ? formatDate(value[1] as string | number | Date, format) : '';
    return <>{`${start}${rangeSeparator}${end}`}</>;
  }

  return <>{formatDate(value as string | number | Date, format)}</>;
}

/**
 * 日期时间渲染
 */
export function renderDateTime(value: unknown, options: RenderDateOptions = {}): React.ReactNode {
  return renderDate(value, { ...options, format: options.format || 'YYYY-MM-DD HH:mm:ss' });
}

/**
 * 时间渲染
 */
export function renderTime(value: unknown, options: RenderDateOptions = {}): React.ReactNode {
  return renderDate(value, { ...options, format: options.format || 'HH:mm:ss' });
}
