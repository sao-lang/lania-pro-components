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
  // 用 ref 持有 adapter，避免 adapter 变化触发重建，同时保证回调拿到最新值
  const adapterRef = useRef(adapter);

  useEffect(() => {
    adapterRef.current = adapter;
  }, [adapter]);

  /**
   * 销毁当前实例
   *
   * 调用 adapter.destroy 并清空 instanceRef，重复调用安全（空操作）。
   */
  const destroy = useCallback(() => {
    if (instanceRef.current) {
      adapterRef.current.destroy(instanceRef.current);
      instanceRef.current = null;
    }
  }, []);

  /**
   * 更新实例配置
   *
   * 委托给 adapter.update（如 echarts.setOption）。
   * 实例不存在时安全跳过。
   */
  const update = useCallback((opts: TOptions) => {
    if (instanceRef.current) {
      adapterRef.current.update(instanceRef.current, opts);
    }
  }, []);

  /**
   * 重新创建实例
   *
   * 先销毁旧实例，再用新（或默认）options 创建新实例。
   * 适用于容器尺寸变化、配置全量变更等场景。
   */
  const recreate = useCallback(
    (opts?: TOptions) => {
      destroy();
      if (containerRef.current) {
        instanceRef.current = adapterRef.current.create(containerRef.current, opts ?? options);
      }
    },
    [destroy, options],
  );

  // 挂载时创建实例，卸载时销毁（仅首次执行，避免重建循环）
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
