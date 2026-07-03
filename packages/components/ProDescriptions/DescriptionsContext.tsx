/**
 * ProDescriptions Context
 *
 * 与 ProTable 多层 Context 风格保持一致：
 * - RootContext: 全局配置层（布局/列数/边框/空值/主题）
 * - ColumnContext: 列定义层（columns + dataSource）
 * - CellContext: 单项渲染层（column/value/record/index）
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ProDescriptionColumn } from './types';

/* ───────────────── RootContext ───────────────── */

export interface DescriptionsRootContextValue {
  /** 布局模式 */
  layout: 'table' | 'grid' | 'inline';
  /** 列数 */
  column: number;
  /** 是否带边框 */
  bordered: boolean;
  /** 尺寸 */
  size: 'mini' | 'small' | 'default' | 'large';
  /** label/value 排列方向 */
  direction: 'horizontal' | 'vertical';
  /** 空值占位符 */
  emptyText: ReactNode;
  /** 响应式列数 */
  responsiveColumns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

const RootContext = createContext<DescriptionsRootContextValue>({
  layout: 'table',
  column: 3,
  bordered: false,
  size: 'default',
  direction: 'horizontal',
  emptyText: '-',
});

export const useDescriptionsRootContext = (): DescriptionsRootContextValue => useContext(RootContext);
export const DescriptionsRootProvider = RootContext.Provider;

/* ───────────────── ColumnContext ───────────────── */

export interface DescriptionsColumnContextValue<T = Record<string, unknown>> {
  /** 处理后的列定义 */
  columns: ProDescriptionColumn<T>[];
  /** 数据源 */
  dataSource: T;
}

const ColumnContext = createContext<DescriptionsColumnContextValue>({
  columns: [],
  dataSource: {} as Record<string, unknown>,
});

export const useDescriptionsColumnContext = <T = Record<string, unknown>,>(): DescriptionsColumnContextValue<T> =>
  useContext(ColumnContext) as DescriptionsColumnContextValue<T>;
export const DescriptionsColumnProvider = ColumnContext.Provider;
