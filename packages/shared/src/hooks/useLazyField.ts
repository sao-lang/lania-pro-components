/**
 * @lania-pro-components/shared
 *
 * useLazyField — 字段懒加载 Hook 集合
 *
 * 提供三种粒度的字段懒加载能力，用于优化大表单 / 长列表的首次渲染性能：
 *
 * 1. useLazyField：单字段级懒加载
 *    - 延迟加载（delay）
 *    - 视口内加载（IntersectionObserver）
 *    - 手动加载（load）
 *
 * 2. useGroupLazyLoad：分组懒加载
 *    - 按组（groupSize）逐步渲染
 *    - 组间延迟（groupDelay）
 *    - 适合长列表场景
 *
 * 3. usePriorityLoad：优先级加载
 *    - 高/中/低三档优先级
 *    - 不同档位延迟不同
 *    - 适合关键字段优先展示、次要字段后置的场景
 *
 * @example
 * ```tsx
 * // 单字段懒加载
 * const { ref, state, load } = useLazyField({ inViewport: true, rootMargin: '100px' });
 *
 * // 分组懒加载
 * const { loadedCount, loadMore } = useGroupLazyLoad(total, { groupSize: 10, groupDelay: 100 });
 *
 * // 优先级加载
 * const { visibleFields } = usePriorityLoad(allFields, {
 *   highPriority: ['name', 'phone'],
 *   mediumPriority: ['age', 'email'],
 * });
 * ```
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 单字段懒加载配置
 */
export interface LazyFieldConfig {
  /** 延迟加载时间（毫秒），delay>0 时在挂载后定时加载 */
  delay?: number;
  /** 是否在进入视口时才加载（默认 false） */
  inViewport?: boolean;
  /** IntersectionObserver 的 root（默认 null 即视口） */
  root?: Element | null;
  /** IntersectionObserver 的 rootMargin（默认 '50px'，提前 50px 触发） */
  rootMargin?: string;
  /** IntersectionObserver 的 threshold（默认 0） */
  threshold?: number | number[];
  /** 占位高度（用于布局占位，避免抖动） */
  placeholderHeight?: number;
}

/**
 * 单字段懒加载状态
 */
export interface LazyFieldState {
  /** 是否已加载完成 */
  isLoaded: boolean;
  /** 是否进入视口 */
  isInViewport: boolean;
  /** 是否正在加载中 */
  isLoading: boolean;
}

/**
 * 单字段懒加载 Hook
 *
 * 支持延迟加载和视口内加载两种模式，返回 ref 与状态供使用方控制渲染。
 *
 * @param config - 懒加载配置
 * @returns ref（绑定到占位容器）、状态、手动加载函数
 */
export function useLazyField(config: LazyFieldConfig = {}): {
  ref: React.RefObject<HTMLDivElement | null>;
  state: LazyFieldState;
  load: () => void;
} {
  const { delay = 0, inViewport = false, root = null, rootMargin = '50px', threshold = 0 } = config;

  const ref = useRef<HTMLDivElement>(null);
  // 无 delay 且非视口模式时默认已加载
  const [isLoaded, setIsLoaded] = useState(!delay && !inViewport);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 手动触发加载
   *
   * 使用 requestAnimationFrame 在下一帧切换状态，
   * 避免在当前渲染周期内同步更新导致布局抖动。
   */
  const load = useCallback(() => {
    if (isLoaded) {
      return;
    }

    setIsLoading(true);

    requestAnimationFrame(() => {
      setIsLoaded(true);
      setIsLoading(false);
    });
  }, [isLoaded]);

  // 延迟加载模式：delay>0 且非视口模式时启动定时器
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

  // 视口内加载模式：使用 IntersectionObserver 监听元素进入视口
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
            // 进入视口后停止观察（一次性触发）
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
  /** 每组大小（默认 10） */
  groupSize?: number;
  /** 组间延迟（毫秒，默认 100） */
  groupDelay?: number;
  /** 是否启用（默认 true；关闭时一次性加载全部） */
  enabled?: boolean;
}

/**
 * 分组懒加载 Hook
 *
 * 按组逐步渲染列表项，避免一次性渲染过多导致卡顿。
 *
 * @param totalCount - 总项数
 * @param config - 分组配置
 * @returns 已加载数量、是否完成、加载更多、加载全部、重置
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 加载下一组
   *
   * 每次增加 groupSize 项（不超过 totalCount），延迟 groupDelay 后更新状态。
   */
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

  /**
   * 一次性加载全部
   *
   * 取消未执行的定时器并立即加载剩余项。
   */
  const loadAll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoadedCount(totalCount);
    setIsComplete(true);
  }, [totalCount]);

  /**
   * 重置为初始状态
   *
   * 取消未执行的定时器，回到启用时的首组或全部。
   */
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoadedCount(enabled ? groupSize : totalCount);
    setIsComplete(!enabled || totalCount <= groupSize);
  }, [enabled, groupSize, totalCount]);

  // 卸载时清理定时器，避免内存泄漏
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
  /** 高优先级字段列表（立即加载） */
  highPriority?: string[];
  /** 中优先级字段列表（mediumPriorityDelay 后加载） */
  mediumPriority?: string[];
  /** 低优先级延迟（毫秒，默认 500） */
  lowPriorityDelay?: number;
  /** 中优先级延迟（毫秒，默认 200） */
  mediumPriorityDelay?: number;
}

/**
 * 优先级加载 Hook
 *
 * 按高/中/低三档优先级分批加载字段，关键字段优先展示。
 *
 * @param fieldNames - 全部字段名
 * @param config - 优先级配置
 * @returns 可见字段、是否加载完成、手动触发某档加载
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 手动触发指定优先级档位加载
   *
   * @param priority - 'high' 立即重置为高优；'medium' 延迟加载中优；'low' 延迟加载全部
   */
  const loadPriority = useCallback(
    (priority: 'high' | 'medium' | 'low') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

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
            // 低优 = 全部字段中除去高优、中优的部分
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

  // 自动按序加载：高优 → 中优（mediumPriorityDelay 后）→ 低优（lowPriorityDelay 后）
  useEffect(() => {
    const mediumTimeout = setTimeout(() => {
      setVisibleFields([...highPriority, ...mediumPriority]);

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
