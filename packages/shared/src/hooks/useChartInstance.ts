/**
 * @lania-pro-components/shared
 *
 * useChartInstance — 图表/组件实例生命周期 Hook
 *
 * 管理任意需要 create/update/destroy 三态生命周期的实例（图表、编辑器、地图等）。
 * 适配器模式：通过 adapter 隔离具体实例的创建/更新/销毁逻辑。
 *
 * @example
 * ```tsx
 * const chartRef = useChartInstance({
 *   create: (el) => echarts.init(el),
 *   update: (instance, options) => instance.setOption(options),
 *   destroy: (instance) => instance.dispose(),
 * });
 *
 * chartRef.current?.update({ xAxis: ..., series: [...] });
 * ```
 */
import { useRef, useCallback, useEffect } from 'react';

/**
 * 实例适配器：定义实例的创建/更新/销毁生命周期
 */
export interface InstanceAdapter<TInstance, TOptions = unknown> {
  /** 创建实例 */
  create: (container: HTMLElement, options?: TOptions) => TInstance;
  /** 更新实例 */
  update: (instance: TInstance, options: TOptions) => void;
  /** 销毁实例 */
  destroy: (instance: TInstance) => void;
}

/**
 * useChartInstance 返回值
 */
export interface UseChartInstanceReturn<TInstance, TOptions> {
  /** 容器 ref（挂载到 DOM 元素上） */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 当前实例 */
  instance: TInstance | null;
  /** 更新实例（传入新 options） */
  update: (options: TOptions) => void;
  /** 手动销毁实例 */
  destroy: () => void;
  /** 重新创建实例 */
  recreate: (options?: TOptions) => void;
}

/**
 * 组件实例生命周期 Hook
 *
 * 管理任意需要容器 DOM + create/update/destroy 三态的实例。
 */
export function useChartInstance<TInstance, TOptions = unknown>(
  adapter: InstanceAdapter<TInstance, TOptions>,
  options?: TOptions,
): UseChartInstanceReturn<TInstance, TOptions> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<TInstance | null>(null);
  const adapterRef = useRef(adapter);

  useEffect(() => {
    adapterRef.current = adapter;
  }, [adapter]);

  const destroy = useCallback(() => {
    if (instanceRef.current) {
      adapterRef.current.destroy(instanceRef.current);
      instanceRef.current = null;
    }
  }, []);

  const update = useCallback(
    (opts: TOptions) => {
      if (instanceRef.current) {
        adapterRef.current.update(instanceRef.current, opts);
      }
    },
    [],
  );

  const recreate = useCallback(
    (opts?: TOptions) => {
      destroy();
      if (containerRef.current) {
        instanceRef.current = adapterRef.current.create(containerRef.current, opts ?? options);
      }
    },
    [destroy, options],
  );

  // 挂载时创建，卸载时销毁
  useEffect(() => {
    if (containerRef.current) {
      instanceRef.current = adapterRef.current.create(containerRef.current, options);
    }

    return () => {
      destroy();
    };
  }, []);

  return {
    containerRef,
    instance: instanceRef.current,
    update,
    destroy,
    recreate,
  };
}
