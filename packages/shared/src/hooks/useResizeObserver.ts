/**
 * @lania-pro-components/shared
 *
 * useResizeObserver — 通用 Resize 监听 Hook
 *
 * 使用 ResizeObserver API 监听 DOM 元素尺寸变化，
 * 适用于图表自适应、虚拟滚动容器、自适应弹窗等场景。
 *
 * @example
 * ```tsx
 * const { ref, size } = useResizeObserver<HTMLDivElement>();
 *
 * return (
 *   <div ref={ref}>
 *     宽度: {size.width}px, 高度: {size.height}px
 *   </div>
 * );
 * ```
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 尺寸信息
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * useResizeObserver 配置
 */
export interface UseResizeObserverOptions {
  /** 是否启用 */
  enabled?: boolean;
  /** 防抖延迟（毫秒），默认 0 不防抖 */
  debounceMs?: number;
  /** 初始尺寸 */
  initialSize?: Size;
  /** 尺寸变化回调 */
  onResize?: (size: Size) => void;
}

/**
 * useResizeObserver 返回值
 */
export interface UseResizeObserverReturn<T extends HTMLElement> {
  /** 被监听的 DOM ref */
  ref: React.RefCallback<T>;
  /** 当前尺寸 */
  size: Size;
  /** 目标元素 */
  element: T | null;
}

/**
 * 通用 Resize 监听 Hook
 */
export function useResizeObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseResizeObserverOptions = {},
): UseResizeObserverReturn<T> {
  const { enabled = true, debounceMs = 0, initialSize = { width: 0, height: 0 }, onResize } = options;

  const [size, setSize] = useState<Size>(initialSize);
  const [element, setElement] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 用 ref 持有最新 onResize，避免回调变化导致 observer 重建
  const callbackRef = useRef(onResize);

  useEffect(() => {
    callbackRef.current = onResize;
  }, [onResize]);

  /**
   * ref 回调：接收 DOM 节点并写入 state，触发后续 observer 绑定
   */
  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  // 元素挂载后创建 ResizeObserver 监听尺寸变化
  useEffect(() => {
    if (!enabled || !element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const newSize: Size = { width, height };

        if (debounceMs > 0) {
          // 防抖模式：仅最后一次变化后 debounceMs 触发更新
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setSize(newSize);
            callbackRef.current?.(newSize);
          }, debounceMs);
        } else {
          // 立即模式：每次变化同步更新
          setSize(newSize);
          callbackRef.current?.(newSize);
        }
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, element, debounceMs]);

  return { ref, size, element };
}
