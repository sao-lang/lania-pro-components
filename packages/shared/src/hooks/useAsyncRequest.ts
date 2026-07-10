/**
 * @lania-pro-components/shared
 *
 * useAsyncRequest — 通用异步请求 Hook
 *
 * 泛化自 ProTable/request/RequestEngine.ts + useRequest.ts，
 * 提供通用的远程请求管理能力：
 * - 自动/手动触发
 * - 防抖（debounceTime）
 * - 请求取消（AbortController）
 * - 轮询（pollingInterval）
 * - 请求/响应拦截器（beforeRequest / afterRequest）
 * - 缓存（cache 集成）
 * - 错误处理
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute, cancel } = useAsyncRequest({
 *   request: async (params) => fetch('/api/data', { ...params }),
 *   debounceTime: 300,
 *   manual: true,
 *   onSuccess: (data) => console.log(data),
 * });
 *
 * // 手动触发
 * execute({ page: 1, pageSize: 20 });
 * // 取消请求
 * cancel();
 * ```
 */
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useAsyncRequest 配置选项
 */
export interface AsyncRequestOptions<TParams, TResponse> {
  /** 请求函数 */
  request: (params: TParams) => Promise<TResponse>;
  /** 是否手动触发（默认 false，自动触发） */
  manual?: boolean;
  /** 默认参数（自动模式时使用） */
  defaultParams?: TParams;
  /** 防抖时间（毫秒），默认 0 不防抖 */
  debounceTime?: number;
  /** 轮询间隔（毫秒），不设置则不轮询 */
  pollingInterval?: number;
  /** 请求前拦截器（可修改参数） */
  beforeRequest?: (params: TParams) => TParams | Promise<TParams>;
  /** 响应后拦截器 */
  afterRequest?: (response: TResponse) => TResponse | Promise<TResponse>;
  /** 成功回调 */
  onSuccess?: (data: TResponse, params: TParams) => void;
  /** 失败回调 */
  onError?: (error: Error, params: TParams) => void;
  /**
   * 轮询时是否静默切换 loading 状态（默认 false）。
   * - true：轮询触发 execute 时跳过 setLoading(true) + setError(undefined)，
   *   但成功仍 setData、失败仍 setError（错误感知不丢失）。适合图表静默刷新。
   * - 仅作用于 startPolling 内部触发的 execute；用户主动 execute/refresh/debouncedExecute 不受影响。
   * @default false
   */
  silentPolling?: boolean;
  /**
   * 依赖项数组：变化时自动用最近一次 params 重新 execute（跳过首次）。
   * - 不传或 undefined：完全禁用此机制
   * - 注意：使用 latestParamsRef.current（旧 params），适合"非 params 依赖变化"场景
   *   （如 schemaData 变化用当前 params 重拉）。不适合"params 变化用新 params"场景。
   * - inline 数组引用每次变化会重复触发，建议传 useMemo 后的稳定引用。
   * 参考 ahooks useRequest refreshDeps。
   */
  refreshDeps?: unknown[];
}

/**
 * useAsyncRequest 返回值
 */
export interface AsyncRequestReturn<TParams, TResponse> {
  /** 响应数据 */
  data: TResponse | undefined;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: Error | undefined;
  /** 执行请求 */
  execute: (params: TParams) => Promise<TResponse | undefined>;
  /** 防抖执行请求 */
  debouncedExecute: (params: TParams) => void;
  /** 取消请求 */
  cancel: () => void;
  /** 开始轮询 */
  startPolling: () => void;
  /** 停止轮询 */
  stopPolling: () => void;
  /** 重置状态 */
  reset: () => void;
  /**
   * 用最近一次 params 重新 execute。
   * - latestParamsRef.current 为 undefined（从未 execute 且未传 defaultParams）时返回 undefined
   * - 不受 silentPolling 影响（始终走非 silent 路径，会 setLoading）
   */
  refresh: () => Promise<TResponse | undefined>;
}

/**
 * 通用异步请求 Hook
 */
export function useAsyncRequest<TParams = Record<string, unknown>, TResponse = unknown>(
  options: AsyncRequestOptions<TParams, TResponse>,
): AsyncRequestReturn<TParams, TResponse> {
  const {
    request,
    manual = false,
    defaultParams,
    debounceTime = 0,
    pollingInterval,
    beforeRequest,
    afterRequest,
    onSuccess,
    onError,
    silentPolling = false,
    refreshDeps,
  } = options;

  const [data, setData] = useState<TResponse | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingEnabledRef = useRef(true);
  const mountedRef = useRef(true);
  const latestParamsRef = useRef<TParams | undefined>(defaultParams);
  const isFirstRefreshRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, []);

  /**
   * 执行请求的核心函数
   *
   * 流程：取消上次请求 → 新建 AbortController → beforeRequest 拦截 → request → afterRequest 拦截 → setData/onSuccess。
   * silentPolling 启用且本次被标记 silent 时跳过 loading/error 切换，适合轮询静默刷新。
   * 请求被取消或组件已卸载时返回 undefined，不更新状态。
   */
  const execute = useCallback(
    async (
      params: TParams,
      /** @internal 内部标记，外部不应使用 */
      internalOptions?: { silent?: boolean },
    ): Promise<TResponse | undefined> => {
      // 取消上一次请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      latestParamsRef.current = params;

      // 仅当 silentPolling 启用且本次调用被标记为 silent 时才跳过 loading/error 切换
      if (!silentPolling || !internalOptions?.silent) {
        setLoading(true);
        setError(undefined);
      }

      try {
        let finalParams = params;
        if (beforeRequest) {
          finalParams = await beforeRequest(params);
        }

        const response = await request(finalParams);

        if (controller.signal.aborted || !mountedRef.current) {
          return undefined;
        }

        let finalResponse = response;
        if (afterRequest) {
          finalResponse = await afterRequest(response);
        }

        if (mountedRef.current) {
          setData(finalResponse);
          setLoading(false);
        }

        onSuccess?.(finalResponse, finalParams);
        return finalResponse;
      } catch (err) {
        if (controller.signal.aborted || !mountedRef.current) {
          return undefined;
        }
        const error = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) {
          setError(error);
          setLoading(false);
        }
        onError?.(error, params);
        return undefined;
      }
    },
    [request, beforeRequest, afterRequest, onSuccess, onError, silentPolling],
  );

  /**
   * 防抖执行请求
   */
  const debouncedExecute = useCallback(
    (params: TParams) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        execute(params);
      }, debounceTime);
    },
    [execute, debounceTime],
  );

  /**
   * 取消请求
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  /**
   * 开始轮询
   */
  const startPolling = useCallback(() => {
    if (!pollingInterval || pollingInterval <= 0) return;
    isPollingEnabledRef.current = true;

    const poll = () => {
      if (!isPollingEnabledRef.current || !latestParamsRef.current) return;
      pollingTimerRef.current = setTimeout(async () => {
        await execute(latestParamsRef.current!, { silent: true });
        if (isPollingEnabledRef.current) {
          poll();
        }
      }, pollingInterval);
    };

    poll();
  }, [pollingInterval, execute]);

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    isPollingEnabledRef.current = false;
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setData(undefined);
    setLoading(false);
    setError(undefined);
    cancel();
    stopPolling();
  }, [cancel, stopPolling]);

  /**
   * 用最近一次 params 重新 execute
   */
  const refresh = useCallback(async (): Promise<TResponse | undefined> => {
    if (latestParamsRef.current === undefined) {
      return undefined;
    }
    return execute(latestParamsRef.current);
  }, [execute]);

  // 自动发起首次请求
  useEffect(() => {
    if (!manual && defaultParams) {
      execute(defaultParams);
    }
    return () => {
      cancel();
      stopPolling();
    };
  }, []);

  // refreshDeps 变化时用最近一次 params 重新 execute（跳过首次）
  useEffect(() => {
    if (!refreshDeps) return;
    if (isFirstRefreshRef.current) {
      isFirstRefreshRef.current = false;
      return;
    }
    if (latestParamsRef.current !== undefined) {
      execute(latestParamsRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refreshDeps);

  return {
    data,
    loading,
    error,
    execute,
    debouncedExecute,
    cancel,
    startPolling,
    stopPolling,
    reset,
    refresh,
  };
}
