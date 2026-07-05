import { useState, useEffect, useRef, useCallback } from 'react';

export interface LazyFieldConfig {
  delay?: number;
  inViewport?: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  placeholderHeight?: number;
}

export interface LazyFieldState {
  isLoaded: boolean;
  isInViewport: boolean;
  isLoading: boolean;
}

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

export interface GroupLazyConfig {
  groupSize?: number;
  groupDelay?: number;
  enabled?: boolean;
}

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

  const loadAll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoadedCount(totalCount);
    setIsComplete(true);
  }, [totalCount]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoadedCount(enabled ? groupSize : totalCount);
    setIsComplete(!enabled || totalCount <= groupSize);
  }, [enabled, groupSize, totalCount]);

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

export interface PriorityLoadConfig {
  highPriority?: string[];
  mediumPriority?: string[];
  lowPriorityDelay?: number;
  mediumPriorityDelay?: number;
}

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
