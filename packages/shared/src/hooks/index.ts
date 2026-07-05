/**
 * @lania-pro-components/shared
 *
 * Hooks barrels
 */

export { useVirtualScroll, useDynamicVirtualScroll } from './useVirtualScroll';
export type {
  VirtualScrollConfig,
  VirtualScrollState,
  UseVirtualScrollReturn,
  DynamicVirtualScrollConfig,
  UseDynamicVirtualScrollReturn,
} from './useVirtualScroll';

export { useCache, getGlobalCache, removeGlobalCache, clearAllGlobalCaches, CacheStorage } from './useCache';
export type { CacheConfig, UseCacheReturn } from './useCache';

export { useResponsive, useResponsiveColumns } from './useResponsive';
export type { Breakpoints, ResponsiveConfig, ResponsiveState, Breakpoint, UseResponsiveReturn } from './useResponsive';

export { useAsyncRequest } from './useAsyncRequest';
export type { AsyncRequestOptions, AsyncRequestReturn } from './useAsyncRequest';
export { useUrlSync } from './useUrlSync';
export type { UseUrlSyncOptions, UseUrlSyncReturn } from './useUrlSync';
export { usePresetManager } from './usePresetManager';
export type { PresetItem, UsePresetManagerOptions, UsePresetManagerReturn } from './usePresetManager';
export { useChartInstance } from './useChartInstance';
export type { InstanceAdapter, UseChartInstanceReturn } from './useChartInstance';
export { useResizeObserver } from './useResizeObserver';
export type { Size, UseResizeObserverOptions, UseResizeObserverReturn } from './useResizeObserver';

export { useDragSort } from './useDragSort';
export type { DragSortConfig, DragState, UseDragSortReturn } from './useDragSort';

export { useLazyField, useGroupLazyLoad, usePriorityLoad } from './useLazyField';
export type { LazyFieldConfig, LazyFieldState, GroupLazyConfig, PriorityLoadConfig } from './useLazyField';

export { useFieldNavigation } from './useFieldNavigation';
export type {
  KeyboardNavigationConfig,
  FocusableItem,
  FieldNavigationOptions,
  UseFieldNavigationReturn,
} from './useFieldNavigation';

export { useDraft } from './useDraft';
export type { DraftStoreLike, UseDraftOptions, UseDraftReturn } from './useDraft';
