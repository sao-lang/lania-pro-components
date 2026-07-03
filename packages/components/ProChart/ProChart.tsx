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

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useMemo } from 'react';
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    performance,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
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

  // 加载远程数据
  useEffect(() => {
    if (!request) {
      setDataSource(schemaData ?? []);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    request(params ?? {})
      .then((res) => {
        if (!cancelled) {
          setDataSource(res.data as Record<string, unknown>[]);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [request, params, schemaData]);

  // 轮询
  useEffect(() => {
    if (!request || !polling) return;
    const interval = setInterval(() => {
      request(params ?? {})
        .then((res) => {
          setDataSource(res.data as Record<string, unknown>[]);
        })
        .catch(() => {});
    }, polling);
    return () => clearInterval(interval);
  }, [request, params, polling]);

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
        if (request) {
          setLoading(true);
          setError(null);
          request(params ?? {})
            .then((res) => {
              setDataSource(res.data as Record<string, unknown>[]);
              setLoading(false);
            })
            .catch((err) => {
              setError(err);
              setLoading(false);
            });
        }
      },
    }),
    [request, params],
  );

  const isError = externalError ?? error;
  const isLoading = externalLoading ?? loading;
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
          if (request) {
            setLoading(true);
            setError(null);
            request(params ?? {})
              .then((res) => {
                setDataSource(res.data as Record<string, unknown>[]);
                setLoading(false);
              })
              .catch((err) => {
                setError(err);
                setLoading(false);
              });
          }
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: typeof height === 'number' ? height : height }} />
      </ChartStatus>
    </div>
  );
});

ProChart.displayName = 'ProChart';

export default ProChart;
