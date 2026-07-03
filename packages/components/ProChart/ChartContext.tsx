/**
 * ProChart Context
 *
 * 与 ProTable 多层 Context 风格保持一致：
 * - RootContext: 全局配置层（adapter/theme/performance）
 * - DataContext: 数据状态层（dataSource/loading/error）
 * - ChartContext: 图表实例层（instance/option/resize）
 */

import { createContext, useContext } from 'react';
import type { ChartInstance } from './adapters/types';

/* ───────────────── RootContext ───────────────── */

export interface ChartRootContextValue {
  /** adapter 名称 */
  adapterName: string;
  /** 当前主题 */
  theme: string;
  /** 是否启用性能打点 */
  performanceEnabled: boolean;
}

const RootContext = createContext<ChartRootContextValue>({
  adapterName: '',
  theme: 'light',
  performanceEnabled: false,
});

export const useChartRootContext = (): ChartRootContextValue => useContext(RootContext);
export const ChartRootProvider = RootContext.Provider;

/* ───────────────── DataContext ───────────────── */

export interface ChartDataContextValue {
  /** 原始数据 */
  dataSource: Record<string, unknown>[];
  /** 是否加载中 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 是否为空 */
  isEmpty: boolean;
}

const DataContext = createContext<ChartDataContextValue>({
  dataSource: [],
  loading: false,
  error: null,
  isEmpty: false,
});

export const useChartDataContext = (): ChartDataContextValue => useContext(DataContext);
export const ChartDataProvider = DataContext.Provider;

/* ───────────────── ChartInstanceContext ───────────────── */

export interface ChartInstanceContextValue<TOption = unknown> {
  /** 图表实例 */
  instance: ChartInstance<TOption> | null;
  /** 手动 resize */
  resize: () => void;
  /** 导出图片 */
  toDataURL: (type?: 'png' | 'jpeg') => string | undefined;
}

const InstanceContext = createContext<ChartInstanceContextValue>({
  instance: null,
  resize: () => {},
  toDataURL: () => undefined,
});

export const useChartInstanceContext = <TOption = unknown,>(): ChartInstanceContextValue<TOption> =>
  useContext(InstanceContext) as ChartInstanceContextValue<TOption>;
export const ChartInstanceProvider = InstanceContext.Provider;
