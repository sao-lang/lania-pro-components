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
import { useCallback, useEffect, useRef } from 'react';
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

/**
 * 请求函数包装器：将 ProTableRequest 适配为 useAsyncRequest 所需的签名，
 * 内置 beforeRequest / afterRequest / postData / AbortSignal 透传逻辑。
 */
function createRequestExecutor<T extends Record<string, unknown>>(
  requestFn: ProTableRequest<T>,
  options: Pick<UseRequestOptions<T>, 'beforeRequest' | 'afterRequest' | 'postData'>,
): (params: ProTableRequestParams) => Promise<ProTableRequestResponse<T>> {
  const { beforeRequest, afterRequest, postData } = options;

  return async (params: ProTableRequestParams): Promise<ProTableRequestResponse<T>> => {
    let finalParams: ProTableRequestParams = params;
    if (beforeRequest) {
      finalParams = await beforeRequest(params);
    }

    // 透传 AbortSignal（修复架构债务 #3）
    const response = await requestFn({
      ...finalParams,
    } as ProTableRequestParams & { signal: AbortSignal });

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
  };
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
    cache,
    cacheKey,
    cacheEnabled = false,
    beforeRequest,
    afterRequest,
    onRequestError,
    postData,
  } = options;

  // ===== Refs =====
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingEnabledRef = useRef(true);

  /**
   * 生成缓存键
   */
  const generateCacheKey = useCallback(
    (params: ProTableRequestParams): string =>
      cacheKey ? `${cacheKey}:${JSON.stringify(params)}` : JSON.stringify(params),
    [cacheKey],
  );

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

  // ===== useAsyncRequest（通用请求管理） =====
  // 注意：我们只使用 useAsyncRequest 的 execute/cancel/polling 能力，
  // 而不使用其 data/loading/error 状态（这些由 DataStore 管理）
  const asyncRequest = useAsyncRequest<ProTableRequestParams, ProTableRequestResponse<T>>({
    request: createRequestExecutor(requestFn ?? (async () => ({ data: [], total: 0 })), {
      beforeRequest,
      afterRequest,
      postData,
    }),
    manual: true, // 由 DataStore 订阅控制触发时机
    debounceTime: 0, // 防抖由本层自行管理（需与 DataStore 集成）
    onSuccess: (response, params) => {
      // ===== ⭐ 分页自动调整（核心逻辑） =====
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

      // 写入缓存
      if (cacheEnabled && cache) {
        const cachedKey = generateCacheKey(params);
        cache.setCache(cachedKey, response);
      }
    },
    onError: (error) => {
      store.setError(error);
      store.setLoading(false);
      store.stopPolling();
      onRequestError?.(error);
    },
  } as AsyncRequestOptions<ProTableRequestParams, ProTableRequestResponse<T>>);

  /**
   * 核心：执行数据请求
   *
   * 支持：
   * - 缓存检查（命中则不走网络）
   * - loading/error 状态同步到 DataStore
   * - 分页自动调整
   */
  const fetchData = useCallback(async () => {
    if (!requestFn) return;

    store.setLoading(true);
    store.setError(undefined);

    const params = getRequestParams();

    // ===== 缓存检查 =====
    if (cacheEnabled && cache) {
      const cachedKey = generateCacheKey(params);
      const cachedData = cache.getCache(cachedKey);
      if (cachedData) {
        store.setDataSource(cachedData.data);
        store.setTotal(cachedData.total);
        store.setLoading(false);
        if (polling && isPollingEnabledRef.current) {
          startPollingWithData(cachedData.data);
        }
        return;
      }
    }

    // 委托给 useAsyncRequest.execute（包含 AbortController + 拦截器）
    await asyncRequest.execute(params);
  }, [requestFn, store, getRequestParams, cacheEnabled, cache, generateCacheKey, polling, asyncRequest]);

  /**
   * 防抖请求
   */
  const debouncedFetchData = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchData();
    }, debounceTime);
  }, [fetchData, debounceTime]);

  /**
   * 取消进行中的请求
   */
  const cancelRequest = useCallback(() => {
    asyncRequest.cancel();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, [asyncRequest]);

  /**
   * 使用当前数据启动轮询
   */
  const startPollingWithData = useCallback(
    (data: T[]) => {
      if (!polling || !isPollingEnabledRef.current) return;
      const interval = typeof polling === 'function' ? polling(data) : polling;
      if (!interval || interval <= 0) return;
      store.setPolling(true, interval);
      pollingTimerRef.current = setTimeout(() => fetchData(), interval);
    },
    [polling, store, fetchData],
  );

  /** 开始轮询 */
  const startPolling = useCallback(() => {
    if (!polling) return;
    isPollingEnabledRef.current = true;
    startPollingWithData(store.dataSource);
  }, [polling, store, startPollingWithData]);

  /** 停止轮询 */
  const stopPolling = useCallback(() => {
    isPollingEnabledRef.current = false;
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    asyncRequest.stopPolling();
    store.stopPolling();
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
        debouncedFetchData();
      }
    });

    fetchData();

    return () => {
      unsubscribe();
      cancelRequest();
      stopPolling();
    };
  }, [manual, requestFn, store, fetchData, debouncedFetchData, cancelRequest, stopPolling]);

  // ===== 注册 store.onReload（替代 window.dispatchEvent 全局广播，架构债务 #1/#7） =====
  useEffect(() => {
    const unregister = store.onReload(fetchData);
    return () => unregister();
  }, [store, fetchData]);

  return {
    fetchData,
    debouncedFetchData,
    cancelRequest,
    startPolling,
    stopPolling,
  };
};
