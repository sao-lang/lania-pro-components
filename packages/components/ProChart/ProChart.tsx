/**
 * ProChart 组件 — 图表库无关的数据可视化组件
 *
 * 核心特性：
 * 1. Adapter 模式：通过 ChartAdapter 抽象 echarts/highcharts/g2
 * 2. Schema 与 Option 双形态
 * 3. React 18 StrictMode 安全
 * 4. loading/error/empty 三态
 * 5. 主题联动
 *
 * @example
 * ```tsx
 * // Option 模式
 * <ProChart adapter="echarts" option={{ xAxis: {...}, series: [...] }} style={{ height: 320 }} />
 *
 * // Schema 模式
 * <ProChart adapter="echarts" type="line" dataSource={data} xField="date" yField="value" />
 * ```
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useMemo, useCallback } from 'react';
import { useAsyncRequest } from '@lania-pro-components/shared';
import { resolveChartAdapter } from './chartAdapterRegistry';
import { getChartTransformer } from './transformers';
import { ChartStatus } from './ChartStatus';
import type { ChartAdapter, ChartInstance } from './adapters/types';
import type { ProChartProps, ProChartInstance } from './types';
import type { ChartSchema } from './ChartSchema';

export const ProChart = forwardRef<ProChartInstance, ProChartProps>((props, ref) => {
  const {
    adapter: adapterProp,
    option: optionProp,
    type,
    dataSource: schemaData,
    xField,
    yField,
    seriesField,
    style,
    className,
    height = 320,
    width,
    theme = 'auto',
    loading: externalLoading,
    error: externalError,
    empty: externalEmpty,
    onChartReady,
    request,
    params,
    polling,
    renderLoading,
    renderError,
    renderEmpty,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<ChartAdapter | null>(null);
  const destroyedRef = useRef(false);
  // dataSource 仍保留本地 state（兼容 request=undefined 时静态数据回退）
  // loading / error 委托给 useAsyncRequest（见下方 useAsyncRequest 调用）
  const [dataSource, setDataSource] = useState<Record<string, unknown>[]>(schemaData ?? []);

  // 解析 adapter
  const [resolvedAdapter, setResolvedAdapter] = useState<ChartAdapter | null>(null);

  useEffect(() => {
    let cancelled = false;
    const name = typeof adapterProp === 'string' ? adapterProp : adapterProp.name;
    const adapter = typeof adapterProp === 'string' ? undefined : adapterProp;

    if (adapter) {
      setResolvedAdapter(adapter);
    } else {
      resolveChartAdapter(name).then((a) => {
        if (!cancelled && a) setResolvedAdapter(a);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [adapterProp]);

  // ===== 远程数据请求：委托 useAsyncRequest =====
  // request=undefined 时使用 no-op 函数（hooks 不能条件调用，需保持调用一致）
  const requestFn = request ?? (async () => ({ data: [] as unknown[] }));

  // onSuccess 必须用 useCallback 稳定引用，否则每次渲染生成新函数 → execute useCallback
  // 依赖变化 → 下方 effect 重复触发 → 死循环
  const handleSuccess = useCallback((response: { data: unknown[]; total?: number }) => {
    setDataSource(response.data as Record<string, unknown>[]);
  }, []);

  const {
    loading: requestLoading,
    error: requestError,
    execute,
    refresh,
    cancel,
    startPolling,
    stopPolling,
  } = useAsyncRequest<Record<string, unknown>, { data: unknown[]; total?: number }>({
    request: requestFn,
    manual: true, // 由下方 effect 显式控制触发时机
    pollingInterval: polling,
    silentPolling: true, // 图表轮询静默刷新：不切 loading，但仍 setError（错误感知不丢失）
    onSuccess: handleSuccess,
  });

  // params / request 变化时触发请求（首次挂载也会触发）
  useEffect(() => {
    if (!request) return;
    execute(params ?? {});
    return () => cancel();
  }, [request, params, execute, cancel]);

  // 静态数据模式：request=undefined 时同步 schemaData 到 dataSource
  useEffect(() => {
    if (!request) {
      setDataSource(schemaData ?? []);
    }
  }, [request, schemaData]);

  // 自动启停轮询（用 useAsyncRequest 的 polling 能力，含 silentPolling + AbortController）
  useEffect(() => {
    if (!request || !polling) return;
    startPolling();
    return () => stopPolling();
  }, [request, polling, startPolling, stopPolling]);

  // 生成 option（Schema 模式）
  const option = useMemo(() => {
    if (optionProp) return optionProp as Record<string, unknown>;

    if (type && resolvedAdapter) {
      const transformer = getChartTransformer(type);
      if (transformer) {
        const schema: ChartSchema = {
          type,
          dataSource,
          xField,
          yField: yField as string | string[],
          seriesField,
        };
        return transformer.transform(schema, {
          adapterName: resolvedAdapter.name,
          theme: theme === 'dark' ? 'dark' : 'light',
        }) as Record<string, unknown>;
      }
    }
    return null;
  }, [optionProp, type, dataSource, xField, yField, seriesField, resolvedAdapter, theme]);

  // 初始化图表实例
  useEffect(() => {
    if (!containerRef.current || !resolvedAdapter || !option) return;
    destroyedRef.current = false;

    const resolvedTheme = theme === 'auto' ? 'light' : theme;
    const inst = resolvedAdapter.init(containerRef.current, option, resolvedTheme);
    instanceRef.current = inst;
    adapterRef.current = resolvedAdapter;
    onChartReady?.(inst);

    return () => {
      destroyedRef.current = true;
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, [resolvedAdapter]); // 仅 adapter 变化时重新 init

  // option 变化时 update
  useEffect(() => {
    if (instanceRef.current && option) {
      instanceRef.current.update(option);
    }
  }, [option]);

  // resize 监听
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      instanceRef.current?.resize();
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // ref API
  useImperativeHandle(
    ref,
    () => ({
      getInstance: () => instanceRef.current ?? undefined,
      setOption: (opt) => {
        if (instanceRef.current) {
          instanceRef.current.update(opt);
        }
      },
      resize: () => instanceRef.current?.resize(),
      toDataURL: (type) => instanceRef.current?.toDataURL(type),
      download: async (filename = 'chart', type = 'png') => {
        const url = instanceRef.current?.toDataURL(type);
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.${type}`;
          link.click();
        }
      },
      reload: () => {
        if (request) refresh();
      },
    }),
    [request, refresh],
  );

  // requestError 类型为 Error | undefined，归一化为 Error | null 与原签名一致
  const isError = externalError ?? requestError ?? null;
  const isLoading = externalLoading ?? requestLoading;
  const isEmpty = externalEmpty ?? (!isLoading && !isError && dataSource.length === 0);

  return (
    <div className={className} style={{ width: width ?? '100%', ...style }}>
      <ChartStatus
        loading={isLoading}
        error={isError}
        empty={isEmpty}
        renderLoading={renderLoading}
        renderError={renderError}
        renderEmpty={renderEmpty}
        onRetry={() => {
          if (request) refresh();
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: typeof height === 'number' ? height : height }} />
      </ChartStatus>
    </div>
  );
});

ProChart.displayName = 'ProChart';

export default ProChart;
