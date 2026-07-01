import { useCallback, useEffect, useRef } from 'react';
import { createRequestEngine } from './RequestEngine';
import type { RequestEngine, RequestEngineOptions } from './RequestEngine';
import type { ProTableRequestParams } from '../types';
import type { DataStoreImpl } from '../store/DataStore';
import type { DataStoreState } from '../store/types';
import type { UseCacheReturn } from '../hooks/useCache';

export interface UseRequestOptions<
  T extends Record<string, any> = Record<string, any>,
> extends RequestEngineOptions<T> {
  store: DataStoreImpl<T>;
  manual?: boolean;
  debounceTime?: number;
  polling?: number | ((data: T[]) => number);
  cache?: UseCacheReturn<{ data: T[]; total: number }>;
  cacheKey?: string;
  cacheEnabled?: boolean;
}

export interface UseRequestReturn<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  T extends Record<string, any> = Record<string, any>,
> {
  fetchData: () => Promise<void>;
  debouncedFetchData: () => void;
  cancelRequest: () => void;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useRequest = <T extends Record<string, any> = Record<string, any>>(
  options: UseRequestOptions<T>,
): UseRequestReturn<T> => {
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

  const engineRef = useRef<RequestEngine<T>>();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingEnabledRef = useRef(true);

  // 创建请求引擎
  if (!engineRef.current) {
    engineRef.current = createRequestEngine<T>(engineOptions);
  }

  const engine = engineRef.current;

  // 获取当前请求参数
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

  // 生成缓存 key
  const generateCacheKey = useCallback(
    (params: ProTableRequestParams): string =>
      cacheKey ? `${cacheKey}:${JSON.stringify(params)}` : JSON.stringify(params),
    [cacheKey],
  );

  // 执行请求
  const fetchData = useCallback(async () => {
    if (!engineOptions.request) {
      return;
    }

    // 先设置 loading 状态，确保 UI 及时响应
    store.setLoading(true);
    store.setError(undefined);

    try {
      const params = getRequestParams();

      // 检查缓存
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

      const response = await engine.execute(params);

      // 检查是否需要调整分页（最后一页只有一条数据被删除的情况）
      const { current, pageSize } = store.pagination;
      const totalPages = Math.ceil(response.total / pageSize);

      // 如果当前页超过了总页数，且不是第一页，则自动调整到最后一页
      if (current > totalPages && totalPages > 0) {
        store.setPage(totalPages);
        return;
      }

      // 如果当前页没有数据了，且不是第一页，则回到上一页
      if (response.data.length === 0 && current > 1 && response.total > 0) {
        store.setPage(current - 1);
        return;
      }

      store.setDataSource(response.data);
      store.setTotal(response.total);
      store.setLoading(false);

      // 保存到缓存
      if (cacheEnabled && cache) {
        const cachedKey = generateCacheKey(params);
        cache.setCache(cachedKey, response);
      }

      // 触发轮询
      if (polling && isPollingEnabledRef.current) {
        startPollingWithData(response.data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      store.setError(error);
      store.setLoading(false);
      store.stopPolling();
    }
  }, [store, engine, getRequestParams, engineOptions.request, polling, cacheEnabled, cache, generateCacheKey]);

  // 防抖请求
  const debouncedFetchData = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchData();
    }, debounceTime);
  }, [fetchData, debounceTime]);

  // 取消请求
  const cancelRequest = useCallback(() => {
    engine.cancel();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, [engine]);

  // 轮询逻辑
  const startPollingWithData = useCallback(
    (data: T[]) => {
      if (!polling || !isPollingEnabledRef.current) {
        return;
      }

      const interval = typeof polling === 'function' ? polling(data) : polling;
      if (!interval || interval <= 0) {
        return;
      }

      store.setPolling(true, interval);

      pollingTimerRef.current = setTimeout(() => {
        fetchData();
      }, interval);
    },
    [polling, store, fetchData],
  );

  // 开始轮询
  const startPolling = useCallback(() => {
    if (!polling) {
      return;
    }
    isPollingEnabledRef.current = true;
    startPollingWithData(store.dataSource);
  }, [polling, store, startPollingWithData]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    isPollingEnabledRef.current = false;
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    store.stopPolling();
  }, [store]);

  // 监听 Store 变化自动请求
  useEffect(() => {
    if (manual || !engineOptions.request) {
      return;
    }

    const unsubscribe = store.subscribe((state: DataStoreState<T>, prevState: DataStoreState<T>) => {
      // 监听分页、排序、筛选、查询变化
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

    // 初始请求
    fetchData();

    return () => {
      unsubscribe();
      cancelRequest();
      stopPolling();
    };
  }, [manual, engineOptions.request, store, fetchData, debouncedFetchData, cancelRequest, stopPolling]);

  // 监听 reload 事件
  useEffect(() => {
    const handleReload = () => {
      fetchData();
    };

    window.addEventListener('protable:reload', handleReload);
    return () => {
      window.removeEventListener('protable:reload', handleReload);
    };
  }, [fetchData]);

  return {
    fetchData,
    debouncedFetchData,
    cancelRequest,
    startPolling,
    stopPolling,
  };
};
