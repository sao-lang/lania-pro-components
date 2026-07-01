import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 懒加载配置
 */
export interface LazyFieldConfig {
  /** 延迟加载时间（毫秒） */
  delay?: number;
  /** 是否在视口内才加载 */
  inViewport?: boolean;
  /** 视口根元素 */
  root?: Element | null;
  /** 视口边距 */
  rootMargin?: string;
  /** 阈值 */
  threshold?: number | number[];
  /** 占位符高度 */
  placeholderHeight?: number;
}

/**
 * 懒加载状态
 */
export interface LazyFieldState {
  /** 是否已加载 */
  isLoaded: boolean;
  /** 是否在视口内 */
  isInViewport: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
}

/**
 * 字段懒加载 Hook
 * 用于延迟加载非关键字段，提升首屏性能
 */
export function useLazyField(config: LazyFieldConfig = {}): {
  ref: React.RefObject<HTMLDivElement | null>;
  state: LazyFieldState;
  load: () => void;
} {
  const { delay = 0, inViewport = false, root = null, rootMargin = '50px', threshold = 0 } = config;

  const ref = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(!delay && !inViewport);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 手动加载
  const load = useCallback(() => {
    if (isLoaded) {
      return;
    }

    setIsLoading(true);

    // 使用 requestAnimationFrame 确保流畅
    requestAnimationFrame(() => {
      setIsLoaded(true);
      setIsLoading(false);
    });
  }, [isLoaded]);

  // 延迟加载
  useEffect(() => {
    if (isLoaded || inViewport) {
      return;
    }

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        load();
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, inViewport, isLoaded, load]);

  // 视口内加载
  useEffect(() => {
    if (!inViewport || isLoaded) {
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInViewport(true);
            load();
            // 加载后停止观察
            observerRef.current?.unobserve(element);
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      },
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [inViewport, root, rootMargin, threshold, isLoaded, load]);

  return {
    ref,
    state: {
      isLoaded,
      isInViewport,
      isLoading,
    },
    load,
  };
}

/**
 * 分组懒加载配置
 */
export interface GroupLazyConfig {
  /** 每组字段数 */
  groupSize?: number;
  /** 组间延迟（毫秒） */
  groupDelay?: number;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 分组懒加载 Hook
 * 用于分批加载大量字段
 */
export function useGroupLazyLoad(
  totalCount: number,
  config: GroupLazyConfig = {},
): {
  loadedCount: number;
  isComplete: boolean;
  loadMore: () => void;
  loadAll: () => void;
  reset: () => void;
} {
  const { groupSize = 10, groupDelay = 100, enabled = true } = config;

  const [loadedCount, setLoadedCount] = useState(enabled ? groupSize : totalCount);
  const [isComplete, setIsComplete] = useState(!enabled || totalCount <= groupSize);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 加载更多
  const loadMore = useCallback(() => {
    if (isComplete) {
      return;
    }

    const nextCount = Math.min(loadedCount + groupSize, totalCount);

    timeoutRef.current = setTimeout(() => {
      setLoadedCount(nextCount);
      if (nextCount >= totalCount) {
        setIsComplete(true);
      }
    }, groupDelay);
  }, [loadedCount, totalCount, groupSize, groupDelay, isComplete]);

  // 加载全部
  const loadAll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoadedCount(totalCount);
    setIsComplete(true);
  }, [totalCount]);

  // 重置
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoadedCount(enabled ? groupSize : totalCount);
    setIsComplete(!enabled || totalCount <= groupSize);
  }, [enabled, groupSize, totalCount]);

  // 清理
  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return {
    loadedCount,
    isComplete,
    loadMore,
    loadAll,
    reset,
  };
}

/**
 * 优先级加载配置
 */
export interface PriorityLoadConfig {
  /** 高优先级字段 */
  highPriority?: string[];
  /** 中优先级字段 */
  mediumPriority?: string[];
  /** 低优先级延迟 */
  lowPriorityDelay?: number;
  /** 中优先级延迟 */
  mediumPriorityDelay?: number;
}

/**
 * 优先级加载 Hook
 * 根据字段优先级分批加载
 */
export function usePriorityLoad(
  fieldNames: string[],
  config: PriorityLoadConfig = {},
): {
  visibleFields: string[];
  isComplete: boolean;
  loadPriority: (priority: 'high' | 'medium' | 'low') => void;
} {
  const { highPriority = [], mediumPriority = [], lowPriorityDelay = 500, mediumPriorityDelay = 200 } = config;

  const [visibleFields, setVisibleFields] = useState<string[]>(highPriority);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 按优先级加载
  const loadPriority = useCallback(
    (priority: 'high' | 'medium' | 'low') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // eslint-disable-next-line default-case
      switch (priority) {
        case 'high':
          setVisibleFields(highPriority);
          setIsComplete(false);
          break;
        case 'medium':
          timeoutRef.current = setTimeout(() => {
            setVisibleFields([...highPriority, ...mediumPriority]);
            setIsComplete(false);
          }, mediumPriorityDelay);
          break;
        case 'low':
          timeoutRef.current = setTimeout(() => {
            const lowPriority = fieldNames.filter(
              (name) => !highPriority.includes(name) && !mediumPriority.includes(name),
            );
            setVisibleFields([...highPriority, ...mediumPriority, ...lowPriority]);
            setIsComplete(true);
          }, lowPriorityDelay);
          break;
      }
    },
    [highPriority, mediumPriority, fieldNames, mediumPriorityDelay, lowPriorityDelay],
  );

  // 自动加载流程
  useEffect(() => {
    // 先加载中优先级
    const mediumTimeout = setTimeout(() => {
      setVisibleFields([...highPriority, ...mediumPriority]);

      // 再加载低优先级
      const lowTimeout = setTimeout(() => {
        const lowPriority = fieldNames.filter((name) => !highPriority.includes(name) && !mediumPriority.includes(name));
        setVisibleFields([...highPriority, ...mediumPriority, ...lowPriority]);
        setIsComplete(true);
      }, lowPriorityDelay - mediumPriorityDelay);

      return () => clearTimeout(lowTimeout);
    }, mediumPriorityDelay);

    return () => {
      clearTimeout(mediumTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [highPriority, mediumPriority, fieldNames, mediumPriorityDelay, lowPriorityDelay]);

  return {
    visibleFields,
    isComplete,
    loadPriority,
  };
}

export default useLazyField;
