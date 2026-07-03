/**
 * Transformer 类型定义
 */

import type { ChartSchema } from '../ChartSchema';

export interface TransformContext {
  /** 当前 adapter 名称（用于处理图表库差异） */
  adapterName: string;
  /** 当前主题 */
  theme: 'light' | 'dark';
}

export interface ChartTransformer<TOption = unknown> {
  /** 图表类型，对应 ChartSchema.type */
  type: string;
  /** 将 Schema 转为图表库 option */
  transform(schema: ChartSchema, ctx: TransformContext): TOption;
}

const transformerRegistry = new Map<string, ChartTransformer>();

export function registerChartTransformer<T>(transformer: ChartTransformer<T>): void {
  transformerRegistry.set(transformer.type, transformer as ChartTransformer);
}

export function getChartTransformer(type: string): ChartTransformer | undefined {
  return transformerRegistry.get(type);
}
