import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * 虚拟滚动配置
 */
export interface VirtualScrollConfig {
  /** 列表项高度（像素） */
  itemHeight: number;
  /** 可视区域外额外渲染的项数 */
  overscan?: number;
  /** 容器高度（像素），不设置则自动计算 */
  containerHeight?: number;
}

/**
 * 虚拟滚动状态
 */
export interface VirtualScrollState {
  /** 可视区域起始索引 */
  startIndex: number;
  /** 可视区域结束索引 */
  endIndex: number;
  /** 可视区域项 */
  visibleItems: unknown[];
  /** 总高度 */
  totalHeight: number;
  /** 偏移量 */
  offsetY: number;
  /** 是否显示滚动条 */
  isScrolling: boolean;
}

/**
 * 虚拟滚动 Hook
 * 用于大数据量表单的性能优化
 */
export function useVirtualScroll<T>(
  items: T[],
  config: VirtualScrollConfig,
): {
  containerRef: React.RefObject<HTMLDivElement | null>;
  virtualState: VirtualScrollState;
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
} {
  const { itemHeight, overscan = 5, containerHeight: fixedContainerHeight } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 计算容器高度
  const containerHeight = useMemo(() => {
    if (fixedContainerHeight) {
      return fixedContainerHeight;
    }
    if (typeof window === 'undefined') {
      return 400;
    }
    return Math.min(window.innerHeight * 0.6, items.length * itemHeight);
  }, [fixedContainerHeight, items.length, itemHeight]);

  // 计算可视区域
  const virtualState = useMemo<VirtualScrollState>(() => {
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
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan, isScrolling]);

  // 处理滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
      setIsScrolling(true);

      // 清除之前的定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // 滚动停止后重置状态
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

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const targetScrollTop = index * itemHeight;
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    },
    [itemHeight],
  );

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  return {
    containerRef,
    virtualState,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
  };
}

/**
 * 动态高度虚拟滚动 Hook
 * 用于高度不固定的列表项
 */
export function useDynamicVirtualScroll<T>(
  items: T[],
  config: Omit<VirtualScrollConfig, 'itemHeight'> & {
    estimateHeight: number;
    getItemHeight: (item: T, index: number) => number;
  },
) {
  const { estimateHeight, getItemHeight, overscan = 5, containerHeight: fixedContainerHeight } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const measuredHeightsRef = useRef<Map<number, number>>(new Map());
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 计算容器高度
  const containerHeight = useMemo(() => {
    if (fixedContainerHeight) {
      return fixedContainerHeight;
    }
    if (typeof window === 'undefined') {
      return 400;
    }
    return Math.min(window.innerHeight * 0.6, items.length * estimateHeight);
  }, [fixedContainerHeight, items.length, estimateHeight]);

  // 计算位置信息
  const positionInfo = useMemo(() => {
    const positions: { top: number; height: number; bottom: number }[] = [];
    let currentTop = 0;

    for (let i = 0; i < items.length; i++) {
      const height = measuredHeightsRef.current.get(i) || getItemHeight(items[i], i);
      positions.push({
        top: currentTop,
        height,
        bottom: currentTop + height,
      });
      currentTop += height;
    }

    return {
      positions,
      totalHeight: currentTop,
    };
  }, [items, getItemHeight]);

  // 计算可视区域
  const virtualState = useMemo(() => {
    const { positions, totalHeight } = positionInfo;

    // 二分查找起始索引
    let startIndex = 0;
    let endIndex = items.length - 1;

    for (let i = 0; i < positions.length; i++) {
      if (positions[i].bottom >= scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    const visibleBottom = scrollTop + containerHeight;
    for (let i = startIndex; i < positions.length; i++) {
      if (positions[i].top > visibleBottom) {
        endIndex = Math.min(items.length - 1, i + overscan - 1);
        break;
      }
    }

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = positions[startIndex]?.top || 0;

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY,
      isScrolling,
    };
  }, [items, positionInfo, scrollTop, containerHeight, overscan, isScrolling]);

  // 处理滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

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

  // 测量项高度
  const measureItem = useCallback((index: number, height: number) => {
    measuredHeightsRef.current.set(index, height);
  }, []);

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const targetPosition = positionInfo.positions[index];
      if (!targetPosition) {
        return;
      }

      container.scrollTo({
        top: targetPosition.top,
        behavior: 'smooth',
      });
    },
    [positionInfo.positions],
  );

  return {
    containerRef,
    virtualState,
    measureItem,
    scrollToIndex,
  };
}

export default useVirtualScroll;
