/**
 * @lania-pro-components/shared
 *
 * 虚拟滚动 Hook（统一版）
 *
 * 合并自 ProForm 版（完整功能）和 ProTable 版（简洁模式）。
 * 提供固定高度和动态高度两种虚拟滚动模式。
 *
 * 设计要点：
 * - 固定高度模式（useVirtualScroll）：计算简单，性能好
 * - 动态高度模式（useDynamicVirtualScroll）：支持高度不固定的列表项
 * - 同时支持原生 scroll 事件监听和 React 合成事件 onScroll
 * - 返回值兼容 ProForm 风格的 `virtualState` 和 ProTable 风格的 `state`
 * - 支持 `enabled` 开关，关闭时直接显示所有项
 * - isScrolling 状态用于滚动中 UI 优化（150ms 防抖）
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * 虚拟滚动配置
 */
export interface VirtualScrollConfig {
  /** 是否启用虚拟滚动 */
  enabled?: boolean;
  /** 列表项高度（像素），固定高度模式必填，动态高度模式下为预估高度 */
  itemHeight?: number;
  /** 可视区域外额外渲染的项数 */
  overscan?: number;
  /** 容器高度（像素），不设置则自动计算 */
  containerHeight?: number;
}

/**
 * 虚拟滚动状态
 */
export interface VirtualScrollState<T = unknown> {
  /** 可视区域起始索引 */
  startIndex: number;
  /** 可视区域结束索引 */
  endIndex: number;
  /** 可视区域项 */
  visibleItems: T[];
  /** 总内容高度 */
  totalHeight: number;
  /** Y 轴偏移量 */
  offsetY: number;
  /** 是否正在滚动 */
  isScrolling: boolean;
  /** 是否启用虚拟滚动 */
  enabled: boolean;
}

/**
 * 虚拟滚动 Hook 返回值
 */
export interface UseVirtualScrollReturn<T = unknown> {
  /** 容器 ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 虚拟滚动状态（ProForm 风格） */
  virtualState: VirtualScrollState<T>;
  /** 虚拟滚动状态（ProTable 风格，与 virtualState 同引用） */
  state: VirtualScrollState<T>;
  /** React 合成事件 onScroll 回调 */
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** 滚动到指定索引 */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  /** 滚动到顶部 */
  scrollToTop: (behavior?: ScrollBehavior) => void;
  /** 滚动到底部 */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** 获取当前滚动位置 */
  getScrollPosition: () => { scrollTop: number; scrollHeight: number; clientHeight: number };
}

/**
 * 虚拟滚动 Hook
 *
 * 用于大数据量列表/表格的虚拟滚动渲染，只渲染可见区域的数据。
 * 固定高度模式，计算简单性能好。
 *
 * @example
 * ```tsx
 * const { containerRef, virtualState, onScroll } = useVirtualScroll(dataSource, {
 *   itemHeight: 50,
 *   overscan: 5,
 *   enabled: dataSource.length > 100,
 * });
 *
 * return (
 *   <div ref={containerRef} onScroll={onScroll} style={{ height: 400, overflow: 'auto' }}>
 *     <div style={{ height: virtualState.totalHeight }}>
 *       <div style={{ transform: `translateY(${virtualState.offsetY}px)` }}>
 *         {virtualState.visibleItems.map((item, i) => (
 *           <div key={i} style={{ height: 50 }}>{item.name}</div>
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualScroll<T = unknown>(items: T[], config?: VirtualScrollConfig): UseVirtualScrollReturn<T> {
  const { enabled: configEnabled, itemHeight = 50, overscan = 5, containerHeight: fixedContainerHeight } = config || {};

  // 是否启用：默认 items > 100 时自动启用
  const enabled = configEnabled ?? items.length > 100;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 计算容器高度
  const containerHeight = useMemo(() => {
    if (fixedContainerHeight) return fixedContainerHeight;
    if (typeof window === 'undefined') return 400;
    return Math.min(window.innerHeight * 0.6, items.length * itemHeight);
  }, [fixedContainerHeight, items.length, itemHeight]);

  // 计算虚拟滚动状态
  const virtualState = useMemo<VirtualScrollState<T>>(() => {
    if (!enabled) {
      return {
        startIndex: 0,
        endIndex: items.length - 1,
        visibleItems: items,
        totalHeight: items.length * itemHeight,
        offsetY: 0,
        isScrolling: false,
        enabled: false,
      };
    }

    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY,
      isScrolling,
      enabled: true,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan, isScrolling, enabled]);

  // 原生 scroll 事件监听
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // React 合成事件 onScroll 回调（ProTable 兼容）
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container) return;
      const targetScrollTop = index * itemHeight;
      container.scrollTo({ top: targetScrollTop, behavior });
    },
    [itemHeight],
  );

  // 滚动到顶部
  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    containerRef.current?.scrollTo({ top: 0, behavior });
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container) return;
      const { totalHeight } = virtualState;
      container.scrollTo({ top: totalHeight, behavior });
    },
    [virtualState],
  );

  // 获取当前滚动位置
  const getScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
    return {
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
    };
  }, []);

  return {
    containerRef,
    virtualState,
    state: virtualState,
    onScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getScrollPosition,
  };
}

/**
 * 动态高度虚拟滚动配置
 */
export interface DynamicVirtualScrollConfig extends Omit<VirtualScrollConfig, 'itemHeight'> {
  /** 预估高度（用于初始计算和未测量项） */
  estimateHeight: number;
  /** 获取项的实际高度（可返回预估高度或测量值） */
  getItemHeight: (item: unknown, index: number) => number;
}

/**
 * 动态高度虚拟滚动返回值
 */
export interface UseDynamicVirtualScrollReturn<T = unknown> extends UseVirtualScrollReturn<T> {
  /** 手动测量并记录项高度 */
  measureItem: (index: number, height: number) => void;
}

/**
 * 动态高度虚拟滚动 Hook
 *
 * 用于高度不固定的列表项，通过测量机制动态计算各项高度。
 * 使用二分查找定位可视区域起始项，适用于表单动态列表等场景。
 */
export function useDynamicVirtualScroll<T = unknown>(
  items: T[],
  config: DynamicVirtualScrollConfig,
): UseDynamicVirtualScrollReturn<T> {
  const { estimateHeight, getItemHeight, overscan = 5, containerHeight: fixedContainerHeight } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const measuredHeightsRef = useRef<Map<number, number>>(new Map());
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 计算容器高度
  const containerHeight = useMemo(() => {
    if (fixedContainerHeight) return fixedContainerHeight;
    if (typeof window === 'undefined') return 400;
    return Math.min(window.innerHeight * 0.6, items.length * estimateHeight);
  }, [fixedContainerHeight, items.length, estimateHeight]);

  // 计算位置信息
  const positionInfo = useMemo(() => {
    const positions: { top: number; height: number; bottom: number }[] = [];
    let currentTop = 0;

    for (let i = 0; i < items.length; i++) {
      const height = measuredHeightsRef.current.get(i) ?? getItemHeight(items[i], i);
      positions.push({ top: currentTop, height, bottom: currentTop + height });
      currentTop += height;
    }

    return { positions, totalHeight: currentTop };
  }, [items, getItemHeight]);

  // 计算可视区域（二分查找）
  const virtualState = useMemo<VirtualScrollState<T>>(() => {
    const { positions, totalHeight } = positionInfo;

    // 二分查找起始索引
    let low = 0;
    let high = positions.length - 1;
    let startIndex = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (positions[mid].bottom <= scrollTop) {
        low = mid + 1;
      } else {
        startIndex = mid;
        high = mid - 1;
      }
    }
    startIndex = Math.max(0, startIndex - overscan);

    // 计算结束索引
    const visibleBottom = scrollTop + containerHeight;
    let endIndex = items.length - 1;
    for (let i = startIndex; i < positions.length; i++) {
      if (positions[i].top > visibleBottom) {
        endIndex = Math.min(items.length - 1, i + overscan - 1);
        break;
      }
    }

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = positions[startIndex]?.top ?? 0;

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY,
      isScrolling,
      enabled: true,
    };
  }, [items, positionInfo, scrollTop, containerHeight, overscan, isScrolling]);

  // 原生 scroll 事件监听
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // React 合成事件 onScroll 回调
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // 测量项高度
  const measureItem = useCallback((index: number, height: number) => {
    measuredHeightsRef.current.set(index, height);
  }, []);

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container) return;
      const targetPosition = positionInfo.positions[index];
      if (!targetPosition) return;
      container.scrollTo({ top: targetPosition.top, behavior });
    },
    [positionInfo.positions],
  );

  // 滚动到顶部
  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    containerRef.current?.scrollTo({ top: 0, behavior });
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container) return;
      container.scrollTo({ top: positionInfo.totalHeight, behavior });
    },
    [positionInfo.totalHeight],
  );

  // 获取当前滚动位置
  const getScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
    return {
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
    };
  }, []);

  return {
    containerRef,
    virtualState,
    state: virtualState,
    onScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getScrollPosition,
    measureItem,
  };
}
