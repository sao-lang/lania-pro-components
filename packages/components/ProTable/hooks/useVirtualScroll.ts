/**
 * 虚拟滚动 Hook（ProTable 版本）
 *
 * 为 ProTable 的大数据量表格提供虚拟滚动优化：
 * - 固定高度虚拟滚动
 * - 可配置每项高度和视口外渲染数
 * - 滚动到指定行（scrollToIndex）
 * - 与 ProTable 的 DataStore 和 TableRenderer 配合使用
 */
/**
 * 虚拟滚动 Hook（ProTable 版本）
 *
 * 为 ProTable 的大数据量场景提供虚拟滚动优化：
 * - 只渲染可视区域内的少量行，通过 translateY 模拟滚动效果
 * - 固定高度模式，计算简单性能好
 * - 可配置每项高度（itemHeight）和视口外预留行数（overscan）
 * - 提供 scrollToIndex 支持编程式滚动
 * - 与 ProTable 的 TableRenderer 配合使用
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * 虚拟滚动配置
 */
export interface VirtualScrollConfig {
  /** 每项高度（像素），默认 50 */
  itemHeight?: number;
  /** 视口外额外渲染的项数，默认 5 */
  overscan?: number;
}

/**
 * 虚拟滚动状态
 */
export interface VirtualScrollState<T = Record<string, unknown>> {
  /** 起始索引 */
  startIndex: number;
  /** 结束索引 */
  endIndex: number;
  /** 可见项 */
  visibleItems: T[];
  /** 总高度 */
  totalHeight: number;
  /** 偏移量 */
  offsetY: number;
  /** 是否启用虚拟滚动 */
  enabled: boolean;
}

/**
 * 虚拟滚动 Hook 返回类型
 */
export interface UseVirtualScrollReturn<T = Record<string, unknown>> {
  /** 虚拟滚动状态 */
  state: VirtualScrollState<T>;
  /** 容器 ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 滚动回调 */
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** 滚动到指定索引 */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  /** 滚动到顶部 */
  scrollToTop: (behavior?: ScrollBehavior) => void;
  /** 滚动到底部 */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** 获取当前滚动位置 */
  getScrollPosition: () => {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
  };
}

/**
 * 虚拟滚动 Hook
 *
 * 用于大数据量表格的虚拟滚动渲染，只渲染可见区域的数据
 *
 * @example
 * ```tsx
 * const { state, containerRef, onScroll } = useVirtualScroll({
 *   dataSource: largeData,
 *   config: { itemHeight: 50, overscan: 5 },
 *   enabled: dataSource.length > 100,
 * });
 *
 * return (
 *   <div ref={containerRef} onScroll={onScroll} style={{ height: 400, overflow: 'auto' }}>
 *     <div style={{ height: state.totalHeight }}>
 *       <div style={{ transform: `translateY(${state.offsetY}px)` }}>
 *         {state.visibleItems.map((item, index) => (
 *           <div key={item.id} style={{ height: 50 }}>{item.name}</div>
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualScroll<T = Record<string, unknown>>(options: {
  /** 数据源 */
  dataSource: T[];
  /** 虚拟滚动配置 */
  config?: VirtualScrollConfig;
  /** 是否启用虚拟滚动 */
  enabled?: boolean;
  /** 容器高度 */
  containerHeight?: number;
}): UseVirtualScrollReturn<T> {
  const { dataSource, config, enabled = false, containerHeight = 400 } = options;

  const { itemHeight = 50, overscan = 5 } = config || {};

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // 计算总高度
  const totalHeight = useMemo(() => dataSource.length * itemHeight, [dataSource.length, itemHeight]);

  // 计算可见区域的起始和结束索引
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    if (!enabled) {
      return { startIndex: 0, endIndex: dataSource.length - 1, offsetY: 0 };
    }

    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);

    // 添加 overscan 以优化滚动体验
    const startIndex = Math.max(0, start - overscan);
    const endIndex = Math.min(dataSource.length - 1, start + visibleCount + overscan);

    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, offsetY };
  }, [scrollTop, itemHeight, containerHeight, dataSource.length, enabled, overscan]);

  // 获取可见项
  const visibleItems = useMemo(() => {
    if (!enabled) {
      return dataSource;
    }
    return dataSource.slice(startIndex, endIndex + 1);
  }, [dataSource, startIndex, endIndex, enabled]);

  // 滚动回调
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const targetScrollTop = index * itemHeight;
      container.scrollTo({ top: targetScrollTop, behavior });
    },
    [itemHeight],
  );

  // 滚动到顶部
  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({ top: 0, behavior });
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      container.scrollTo({ top: totalHeight, behavior });
    },
    [totalHeight],
  );

  // 获取当前滚动位置
  const getScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
    }

    return {
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
    };
  }, []);

  // 当数据源变化时，重置滚动位置
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    // 如果当前滚动位置超出新的总高度，滚动到底部
    if (container.scrollTop > totalHeight) {
      container.scrollTop = totalHeight;
    }
  }, [dataSource.length, totalHeight, enabled]);

  const state: VirtualScrollState<T> = {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    enabled: enabled && dataSource.length > 0,
  };

  return {
    state,
    containerRef,
    onScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getScrollPosition,
  };
}

export default useVirtualScroll;
