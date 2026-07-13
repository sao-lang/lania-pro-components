/**
 * @lania-pro-components/shared
 *
 * React 抽象底座包入口文件
 *
 * 本包提供跨组件复用的 React 抽象能力：
 * - Hooks：虚拟滚动、远程请求、缓存、响应式、URL 同步等
 * - 组件：PerformanceMonitor 性能监控
 * - 工厂函数：createProProvider、createImperativeInstance、useActionButton
 * - 类型：性能配置、状态枚举、布局配置等
 *
 * 所有模块通过 re-export 在此统一对外暴露，
 * 使用者可通过 `import { xxx } from '@lania-pro-components/shared'` 按需引入。
 */

// ======================== 类型定义 ========================
export type { LazyLoadConfig, BatchUpdateConfig, PerformanceConfig } from './types/performance';
export type { ComponentStatus } from './types/status';
export type { CardContainerConfig, LayoutMode } from './types/layout';
export type { AsyncDataConfig } from './types/request';

// ======================== Hooks ========================
export { useVirtualScroll, useDynamicVirtualScroll } from './hooks/useVirtualScroll';
export type {
  VirtualScrollConfig,
  VirtualScrollState,
  UseVirtualScrollReturn,
  DynamicVirtualScrollConfig,
  UseDynamicVirtualScrollReturn,
} from './hooks/useVirtualScroll';

export { useCache, getGlobalCache, removeGlobalCache, clearAllGlobalCaches, CacheStorage } from './hooks/useCache';
export type { CacheConfig, UseCacheReturn } from './hooks/useCache';

export { useResponsive, useResponsiveColumns } from './hooks/useResponsive';
export type {
  Breakpoints,
  ResponsiveConfig,
  ResponsiveState,
  Breakpoint,
  UseResponsiveReturn,
} from './hooks/useResponsive';

// ======================== 工厂函数 ========================
export { useActionButton } from './factories/useActionButton';
export type { UseActionButtonOptions, UseActionButtonReturn } from './factories/useActionButton';
export { createImperativeInstance, createPromiseConfirm } from './factories/index';
export type { ImperativeInstanceManager, PromiseConfirmOptions } from './factories/index';
export { createProProvider } from './factories/createProProvider';
export type { ProProviderResult } from './factories/createProProvider';

export { useAsyncRequest } from './hooks/useAsyncRequest';
export type { AsyncRequestOptions, AsyncRequestReturn } from './hooks/useAsyncRequest';
export { useUrlSync } from './hooks/useUrlSync';
export type { UseUrlSyncOptions, UseUrlSyncReturn } from './hooks/useUrlSync';
export { usePresetManager } from './hooks/usePresetManager';
export type { PresetItem, UsePresetManagerOptions, UsePresetManagerReturn } from './hooks/usePresetManager';
// export { usePersistedState } from './hooks/usePersistedState';
export { useChartInstance } from './hooks/useChartInstance';
export type { InstanceAdapter, UseChartInstanceReturn } from './hooks/useChartInstance';
export { useResizeObserver } from './hooks/useResizeObserver';
export type { Size, UseResizeObserverOptions, UseResizeObserverReturn } from './hooks/useResizeObserver';

export { useDragSort } from './hooks/useDragSort';
export type { DragSortConfig, DragState, UseDragSortReturn } from './hooks/useDragSort';

export { useLazyField, useGroupLazyLoad, usePriorityLoad } from './hooks/useLazyField';
export type { LazyFieldConfig, LazyFieldState, GroupLazyConfig, PriorityLoadConfig } from './hooks/useLazyField';

export { useFieldNavigation } from './hooks/useFieldNavigation';
export type {
  KeyboardNavigationConfig,
  FocusableItem,
  FieldNavigationOptions,
  UseFieldNavigationReturn,
} from './hooks/useFieldNavigation';

export { useDraft } from './hooks/useDraft';
export type { DraftStoreLike, UseDraftOptions, UseDraftReturn } from './hooks/useDraft';

// ======================== 组件 ========================
export { PerformanceMonitor } from './components/PerformanceMonitor';
export type { PerformanceMonitorProps } from './components/PerformanceMonitor/types';

export { VirtualScroll } from './components/VirtualScroll';
export type { VirtualScrollProps, VirtualScrollHandle } from './components/VirtualScroll/types';
