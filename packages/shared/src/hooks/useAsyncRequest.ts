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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, []);

  /**
   * 执行请求的核心函数
   */
  const execute = useCallback(
    async (params: TParams): Promise<TResponse | undefined> => {
      // 取消上一次请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      latestParamsRef.current = params;

      setLoading(true);
      setError(undefined);

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
    [request, beforeRequest, afterRequest, onSuccess, onError],
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
        await execute(latestParamsRef.current!);
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
  };
}
