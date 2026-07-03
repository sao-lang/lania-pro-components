/**
 * ProTable Hooks 模块
 *
 * 提供表格的各种业务逻辑 Hook，实现与 UI 解耦：
 *
 * - useProTable: 编程式表格控制 Hook（ref 替代方案）
 * - useUrlSync: URL 参数与表格状态的同步（刷新/分享时恢复状态）
 * - useSearchSchema: 动态搜索 Schema 生成
 * - useVirtualScroll: 虚拟滚动优化
 * - useDragSort: 拖拽排序
 * - useCache: 数据缓存
 * - useResponsive: 响应式适配
 */
export * from './useUrlSync';
export * from './useSearchSchema';
export * from './useProTable';
export { useVirtualScroll, useDynamicVirtualScroll } from '@lania-pro-components/shared';
export type {
  VirtualScrollConfig,
  VirtualScrollState,
  UseVirtualScrollReturn,
  DynamicVirtualScrollConfig,
  UseDynamicVirtualScrollReturn,
} from '@lania-pro-components/shared';
export * from './useDragSort';
export {
  useCache,
  getGlobalCache,
  removeGlobalCache,
  clearAllGlobalCaches,
  CacheStorage,
} from '@lania-pro-components/shared';
export type { CacheConfig, UseCacheReturn } from '@lania-pro-components/shared';
export { useResponsive, useResponsiveColumns } from '@lania-pro-components/shared';
export type {
  Breakpoints,
  ResponsiveConfig,
  ResponsiveState,
  Breakpoint,
  UseResponsiveReturn,
} from '@lania-pro-components/shared';
