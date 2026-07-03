/**
 * 表格数据请求 Hook
 *
 * 封装 ProTable 的数据请求流程，基于 @lania-pro-components/shared 的 useAsyncRequest。
 *
 * 职责划分：
 * - shared useAsyncRequest：通用请求生命周期（AbortController / 防抖 / 轮询 / 拦截器）
 * - 本文件：ProTable 特有逻辑（DataStore 集成、分页自动调整、缓存、store 订阅刷新）
 *
 * 迁移至 shared useAsyncRequest 后，已受益：
 * - ✅ 修复 AbortController 透传（架构债务 #3）
 * - ✅ 统一的请求取消语义
 * - ✅ 通用的 beforeRequest / afterRequest 拦截器
 *
 * 仍保留在本层的 ProTable 特有逻辑：
 * - DataStore 状态同步（store.setLoading / setDataSource / setTotal）
 * - ⭐ 分页自动调整（删除最后一条数据时自动回退）
 * - DataStore 订阅自动触发请求
 * - 缓存集成（cache + cacheKey）
 * - window 'protable:reload' 事件监听
 */
import { useCallback, useEffect, useRef } from 'react';
import { createRequestEngine } from './RequestEngine';
import { useAsyncRequest } from '@lania-pro-components/shared';
import type { RequestEngine, RequestEngineOptions } from './RequestEngine';
import type { ProTableRequestParams, ProTableRequestResponse } from '../types';
import type { DataStoreImpl } from '../store/DataStore';
import type { DataStoreState } from '../store/types';
import type { UseCacheReturn } from '@lania-pro-components/shared';

export interface UseRequestOptions<T extends Record<string, unknown> = Record<string, unknown>>
  extends RequestEngineOptions<T> {
  /** DataStore 实例 */
  store: DataStoreImpl<T>;
  /** 是否手动触发（默认 false，自动触发首次请求） */
  manual?: boolean;
  /** 防抖延迟时间（毫秒），默认 300ms */
  debounceTime?: number;
  /** 轮询配置：固定间隔或根据数据动态计算间隔 */
  polling?: number | ((data: T[]) => number);
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
    manual = false,
    debounceTime = 300,
    polling,
    cache,
    cacheKey,
    cacheEnabled = false,
    ...engineOptions
  } = options;

  // ===== Refs（持久引用，不触发重新渲染） =====
  const engineRef = useRef<RequestEngine<T> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingEnabledRef = useRef(true);

  // ===== 创建请求引擎（仅在组件挂载时创建一次） =====
  if (!engineRef.current) {
    engineRef.current = createRequestEngine<T>(engineOptions);
  }
  const engine = engineRef.current;

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
   * 生成缓存键
   */
  const generateCacheKey = useCallback(
    (params: ProTableRequestParams): string =>
      cacheKey ? `${cacheKey}:${JSON.stringify(params)}` : JSON.stringify(params),
    [cacheKey],
  );

  // ===== 基于 shared useAsyncRequest 的通用请求管理 =====
  const asyncRequest = useAsyncRequest<ProTableRequestParams, ProTableRequestResponse<T>>({
    request: async (params) => {
      // 委托给 RequestEngine，它内部已修复 AbortController 透传
      return engine.execute(params);
    },
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
    },
  });

  /**
   * 核心：执行数据请求
   *
   * DataStore 集成版，支持：
   * - 缓存检查（命中则不走网络）
   * - loading/error 状态同步到 DataStore
   * - 分页自动调整
   */
  const fetchData = useCallback(async () => {
    if (!engineOptions.request) return;

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

    // 委托给 useAsyncRequest.execute，它已包含 AbortController + 拦截器
    await asyncRequest.execute(params);
  }, [engineOptions.request, store, getRequestParams, cacheEnabled, cache, generateCacheKey, polling, asyncRequest]);

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
    engine.cancel();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, [asyncRequest, engine]);

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
    if (manual || !engineOptions.request) return;

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
  }, [manual, engineOptions.request, store, fetchData, debouncedFetchData, cancelRequest, stopPolling]);

  // ===== 监听 'protable:reload' CustomEvent =====
  useEffect(() => {
    const handleReload = () => void fetchData();
    window.addEventListener('protable:reload', handleReload);
    return () => window.removeEventListener('protable:reload', handleReload);
  }, [fetchData]);

  return {
    fetchData,
    debouncedFetchData,
    cancelRequest,
    startPolling,
    stopPolling,
  };
};
