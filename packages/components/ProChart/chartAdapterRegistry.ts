/**
 * chartAdapterRegistry — adapter 运行时注册表
 *
 * 支持运行时注册，便于按需 import
 * 支持别名（大小写归一）
 * 与 ProForm componentRegistry / instanceRegistry 模式一致
 */

import type { ChartAdapter, ChartAdapterFactory } from './adapters/types';

const registry = new Map<string, ChartAdapterFactory>();
const aliasMap = new Map<string, string>(); // 大小写/别名归一

/**
 * 注册 chart adapter
 */
export function registerChartAdapter(name: string, factory: ChartAdapterFactory, aliases?: string[]): void {
  const key = name.toLowerCase();
  registry.set(key, factory);
  aliasMap.set(key, key);
  aliases?.forEach((alias) => aliasMap.set(alias.toLowerCase(), key));
}

/**
 * 检查是否已注册
 */
export function hasChartAdapter(name: string): boolean {
  return aliasMap.has(name.toLowerCase());
}

/**
 * 解析 adapter（支持异步 factory）
 */
export async function resolveChartAdapter(name: string): Promise<ChartAdapter | undefined> {
  const key = aliasMap.get(name.toLowerCase());
  if (!key) return undefined;
  const factory = registry.get(key);
  if (!factory) return undefined;
  return typeof factory === 'function' ? await (factory as () => Promise<ChartAdapter>)() : factory;
}

/**
 * 注销 adapter
 */
export function unregisterChartAdapter(name: string): void {
  const key = aliasMap.get(name.toLowerCase());
  if (!key) return;
  registry.delete(key);
  for (const [alias, target] of aliasMap) {
    if (target === key) aliasMap.delete(alias);
  }
}
