/**
 * ProChart 转换器 barrel
 *
 * 注册所有内置 transformer
 */

import './line';
import './bar';
import './pie';
import './scatter';
import './area';
import './radar';

export { registerChartTransformer, getChartTransformer } from './types';
export type { ChartTransformer, TransformContext } from './types';
