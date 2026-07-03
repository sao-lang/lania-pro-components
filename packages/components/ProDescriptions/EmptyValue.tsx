/**
 * EmptyValue — 空值占位组件
 *
 * 默认显示 '-'
 * 通过 emptyText prop 自定义
 */

import React from 'react';
import type { ReactNode } from 'react';

export interface EmptyValueProps {
  /** 空值占位文本 */
  text?: ReactNode;
}

export const EmptyValue: React.FC<EmptyValueProps> = ({ text = '-' }) => (
  <span style={{ color: 'var(--color-text-4)' }}>{text}</span>
);
