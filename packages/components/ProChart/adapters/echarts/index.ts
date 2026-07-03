/**
 * ECharts adapter barrel
 *
 * 副作用：自动注册到 chartAdapterRegistry
 */

import { EChartsAdapter, setEChartsInstance } from './EChartsAdapter';
import { registerChartAdapter } from '../../chartAdapterRegistry';

registerChartAdapter('echarts', EChartsAdapter, ['ECharts', 'EChats']);

export { EChartsAdapter, setEChartsInstance };
