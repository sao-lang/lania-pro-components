/**
 * 表格数据请求 Hook
 *
 * 封装 ProTable 的数据请求流程，直接基于 @lania-pro-components/shared 的 useAsyncRequest。
 *
 * 职责：
 * - DataStore 状态同步（store.setLoading / setDataSource / setTotal）
 * - ⭐ 分页自动调整（删除最后一条数据时自动回退）
 * - DataStore 订阅自动触发请求
 * - 缓存集成（cache + cacheKey）
 * - store.onReload 注册（架构债务 #1/#7：替代 window.dispatchEvent 全局广播）
 * - 动态轮询（polling 支持函数形式，根据数据动态计算间隔）
 *
 * 自 2026-07 重构：移除 RequestEngine 层，消除双重重 wrap。
 */
import { useCallback, useEffect, useState } from 'react';
import { useAsyncRequest } from '@lania-pro-components/shared';
import type { AsyncRequestOptions } from '@lania-pro-components/shared';
import type { ProTableRequest, ProTableRequestParams, ProTableRequestResponse } from '../types';
import type { DataStoreImpl } from '../store/DataStore';
import type { DataStoreState } from '../store/types';
import type { UseCacheReturn } from '@lania-pro-components/shared';

export interface UseRequestOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  /** DataStore 实例 */
  store: DataStoreImpl<T>;
  /** 请求函数 */
  request?: ProTableRequest<T>;
  /** 是否手动触发（默认 false，自动触发首次请求） */
  manual?: boolean;
  /** 防抖延迟时间（毫秒），默认 300ms */
  debounceTime?: number;
  /** 轮询配置：固定间隔或根据数据动态计算间隔 */
  polling?: number | ((data: T[]) => number);
  /** 请求前钩子 */
  beforeRequest?: (params: ProTableRequestParams) => ProTableRequestParams | Promise<ProTableRequestParams>;
  /** 请求后钩子 */
  afterRequest?: (data: T[], total: number) => { data: T[]; total: number } | Promise<{ data: T[]; total: number }>;
  /** 请求错误回调 */
  onRequestError?: (error: Error) => void;
  /** 数据格式化 */
  postData?: (data: T[]) => T[];
  /** 缓存实例 */
  cache?: UseCacheReturn<{ data: T[]; total: number }>;
  /** 缓存键 */
  cacheKey?: string;
  /** 是否启用缓存 */
  cacheEnabled?: boolean;
}

export interface UseRequestReturn {
  /** 执行数据请求 */
  fetchData: () => Promise<void>;
  /** 防抖后的数据请求 */
  debouncedFetchData: () => void;
  /** 取消进行中的请求 */
  cancelRequest: () => void;
  /** 开始轮询 */
  startPolling: () => void;
  /** 停止轮询 */
  stopPolling: () => void;
}

export const useRequest = <T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseRequestOptions<T>,
): UseRequestReturn => {
  const {
    store,
    request: requestFn,
    manual = false,
    debounceTime = 300,
    polling,
    beforeRequest,
    afterRequest,
    onRequestError,
    postData,
    cache,
    cacheKey,
    cacheEnabled = false,
  } = options;

  const [currentPollingInterval, setCurrentPollingInterval] = useState<number>(0);

  /**
   * 从 DataStore 获取当前请求参数
   */
  const getRequestParams = useCallback(
    (): ProTableRequestParams => ({
      current: store.pagination.current,
      pageSize: store.pagination.pageSize,
      sortField: store.sorter.field,
      sortOrder: store.sorter.order,
      filters: store.filters,
      params: store.query,
    }),
    [store],
  );

  /**
   * 请求函数：将 ProTableRequest 适配为 useAsyncRequest 所需的签名
   */
  const request = useCallback(
    async (params: ProTableRequestParams): Promise<ProTableRequestResponse<T>> => {
      if (!requestFn) {
        return { data: [], total: 0, success: true };
      }
      const response = await requestFn({
        ...params,
      } as ProTableRequestParams & { signal: AbortSignal });
      return response;
    },
    [requestFn],
  );

  // ===== useAsyncRequest（通用请求管理） =====
  // 注意：我们只使用 useAsyncRequest 的 execute/cancel/polling 能力，
  // 而不使用其 data/loading/error 状态（这些由 DataStore 管理）
  const asyncRequest = useAsyncRequest<ProTableRequestParams, ProTableRequestResponse<T>>({
    request,
    manual: true,
    debounceTime,
    pollingInterval: currentPollingInterval,
    cache,
    cacheKey,
    cacheEnabled,
    beforeRequest: async (params) => {
      store.setLoading(true);
      store.setError(undefined);
      if (beforeRequest) {
        return await beforeRequest(params);
      }
      return params;
    },
    afterRequest: async (response) => {
      let { data, total } = response;

      if (afterRequest) {
        const result = await afterRequest(data, total);
        data = result.data;
        total = result.total;
      }

      if (postData) {
        data = postData(data);
      }

      return { data, total, success: true };
    },
    onSuccess: (response) => {
      const { current, pageSize } = store.pagination;
      const totalPages = Math.ceil(response.total / pageSize);

      if (current > totalPages && totalPages > 0) {
        store.setPage(totalPages);
        return;
      }

      if (response.data.length === 0 && current > 1 && response.total > 0) {
        store.setPage(current - 1);
        return;
      }

      store.setDataSource(response.data);
      store.setTotal(response.total);
      store.setLoading(false);

      if (polling) {
        const interval = typeof polling === 'function' ? polling(response.data) : polling;
        if (interval && interval > 0) {
          store.setPolling(true, interval);
          setCurrentPollingInterval(interval);
        } else {
          store.stopPolling();
          setCurrentPollingInterval(0);
        }
      }
    },
    onError: (error) => {
      store.setError(error);
      store.setLoading(false);
      store.stopPolling();
      setCurrentPollingInterval(0);
      onRequestError?.(error);
    },
  } as AsyncRequestOptions<ProTableRequestParams, ProTableRequestResponse<T>>);

  /**
   * 执行数据请求
   */
  const fetchData = useCallback(async () => {
    if (!requestFn) return;
    if (store.isPolling && currentPollingInterval <= 0) return;
    await asyncRequest.execute(getRequestParams());
  }, [requestFn, store, getRequestParams, asyncRequest, currentPollingInterval]);

  /**
   * 开始轮询
   */
  const startPolling = useCallback(() => {
    if (!polling) return;
    const interval = typeof polling === 'function' ? polling(store.dataSource) : polling;
    if (!interval || interval <= 0) return;
    store.setPolling(true, interval);
    setCurrentPollingInterval(interval);
    asyncRequest.startPolling();
  }, [polling, store, asyncRequest]);

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    store.stopPolling();
    setCurrentPollingInterval(0);
    asyncRequest.stopPolling();
  }, [store, asyncRequest]);

  // ===== 核心：监听 DataStore 状态变化自动触发请求 =====
  useEffect(() => {
    if (manual || !requestFn) return;

    const unsubscribe = store.subscribe((state: DataStoreState<T>, prevState: DataStoreState<T>) => {
      const shouldFetch =
        state.pagination.current !== prevState.pagination.current ||
        state.pagination.pageSize !== prevState.pagination.pageSize ||
        state.sorter.field !== prevState.sorter.field ||
        state.sorter.order !== prevState.sorter.order ||
        JSON.stringify(state.filters) !== JSON.stringify(prevState.filters) ||
        JSON.stringify(state.query) !== JSON.stringify(prevState.query);

      if (shouldFetch) {
        asyncRequest.debouncedExecute(getRequestParams());
      }
    });

    fetchData();

    return () => {
      unsubscribe();
      asyncRequest.cancel();
      stopPolling();
    };
  }, [manual, requestFn, store, fetchData, getRequestParams, asyncRequest, stopPolling]);

  // ===== 注册 store.onReload（替代 window.dispatchEvent 全局广播，架构债务 #1/#7） =====
  useEffect(() => {
    const unregister = store.onReload(fetchData);
    return () => unregister();
  }, [store, fetchData]);

  return {
    fetchData,
    debouncedFetchData: () => asyncRequest.debouncedExecute(getRequestParams()),
    cancelRequest: () => asyncRequest.cancel(),
    startPolling,
    stopPolling,
  };
};
