/**
 * ProChart 组件 barrel 导出
 */

export { ProChart } from './ProChart';
export type { ProChartProps, ProChartInstance } from './types';
export type { ChartSchema } from './ChartSchema';

// Adapter 接口
export type { ChartAdapter, ChartInstance } from './adapters/types';

// 注册表
export {
  registerChartAdapter,
  hasChartAdapter,
  resolveChartAdapter,
  unregisterChartAdapter,
} from './chartAdapterRegistry';

// ECharts adapter（按需引入）
export { EChartsAdapter, setEChartsInstance } from './adapters/echarts';

// Transformers
export { registerChartTransformer, getChartTransformer } from './transformers';
export type { ChartTransformer, TransformContext } from './transformers';

// ChartStatus
export { ChartStatus } from './ChartStatus';
export type { ChartStatusProps } from './ChartStatus';

// Context
export { useChartRootContext, useChartDataContext, useChartInstanceContext } from './ChartContext';
export type { ChartRootContextValue, ChartDataContextValue, ChartInstanceContextValue } from './ChartContext';
