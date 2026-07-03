/**
 * ProChart 类型定义
 *
 * 图表库无关的通用类型，包含 ProChartProps 和 ProChartInstance
 */

import type { CSSProperties, ReactNode } from 'react';
import type { ChartAdapter, ChartInstance } from './adapters/types';

/**
 * ProChart 主组件 Props
 */
export interface ProChartProps<TOption = unknown> {
  /** adapter：注册表名称 或 adapter 实例 */
  adapter: string | ChartAdapter<TOption>;

  /** === Option 模式 === */
  option?: TOption;

  /** === Schema 模式 === */
  type?: string;
  dataSource?: Record<string, unknown>[];
  xField?: string;
  yField?: string | string[];
  seriesField?: string;
  colorField?: string;
  sizeField?: string;

  /** === 远程数据 === */
  request?: (params: Record<string, unknown>) => Promise<{ data: unknown[]; total?: number }>;
  params?: Record<string, unknown>;
  polling?: number;

  /** === 通用 === */
  style?: CSSProperties;
  className?: string;
  height?: number | string;
  width?: number | string;
  theme?: 'light' | 'dark' | 'auto';
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;

  /** === 性能 === */
  performance?: {
    enabled?: boolean;
  };

  /** === 事件 === */
  onChartReady?: (instance: ChartInstance<TOption>) => void;
  onChartEvent?: (event: string, payload: unknown) => void;

  /** === 自定义三态渲染 === */
  renderLoading?: () => ReactNode;
  renderError?: (error: Error, retry: () => void) => ReactNode;
  renderEmpty?: () => ReactNode;
}

/**
 * ProChart 实例（通过 ref 访问）
 */
export interface ProChartInstance<TOption = unknown> {
  /** 原始图表实例（escape hatch） */
  getInstance(): ChartInstance<TOption> | undefined;
  /** 手动更新 option */
  setOption(option: TOption): void;
  /** 手动 resize */
  resize(): void;
  /** 导出图片（base64） */
  toDataURL(type?: 'png' | 'jpeg'): string | undefined;
  /** 下载图片 */
  download(filename?: string, type?: 'png' | 'jpeg'): Promise<void>;
  /** 重新加载数据 */
  reload(): void;
}
