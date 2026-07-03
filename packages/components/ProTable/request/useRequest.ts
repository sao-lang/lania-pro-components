/**
 * 表格数据请求 Hook
 *
 * 封装 ProTable 的数据请求流程：
 * - 自动/手动触发请求（manual 参数控制）
 * - 防抖请求（debounceTime）
 * - 轮询（polling）
 * - 请求/响应拦截（beforeRequest / afterRequest）
 * - 错误处理（onRequestError）
 * - 缓存（cache + cacheKey）
 * - 首次加载自动请求
 */
import { useCallback, useEffect, useRef } from 'react';
import { createRequestEngine } from './RequestEngine';
import type { RequestEngine, RequestEngineOptions } from './RequestEngine';
import type { ProTableRequestParams } from '../types';
import type { DataStoreImpl } from '../store/DataStore';
import type { DataStoreState } from '../store/types';
import type { UseCacheReturn } from '../hooks/useCache';

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
  const engineRef = useRef<RequestEngine<T> | null>(null); // 请求引擎实例
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 防抖定时器
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 轮询定时器
  const isPollingEnabledRef = useRef(true); // 轮询是否可用

  // ===== 创建请求引擎（仅在组件挂载时创建一次） =====
  if (!engineRef.current) {
    engineRef.current = createRequestEngine<T>(engineOptions);
  }
  const engine = engineRef.current;

  /**
   * 从 DataStore 获取当前请求参数
   * 包含：分页信息、排序字段/方向、筛选条件、查询参数
   */
  const getRequestParams = useCallback(
    (): ProTableRequestParams => ({
      current: store.pagination.current, // 当前页码
      pageSize: store.pagination.pageSize, // 每页条数
      sortField: store.sorter.field, // 排序字段
      sortOrder: store.sorter.order, // 排序方向（ascend/descend）
      filters: store.filters, // 筛选条件
      params: store.query, // 查询参数
    }),
    [store],
  );

  /**
   * 生成缓存键
   * 如果指定了 cacheKey，则前缀+参数序列化；否则直接参数序列化
   */
  const generateCacheKey = useCallback(
    (params: ProTableRequestParams): string =>
      cacheKey ? `${cacheKey}:${JSON.stringify(params)}` : JSON.stringify(params),
    [cacheKey],
  );

  /**
   * 核心：执行数据请求
   *
   * 请求流程：
   * 1. 设置 loading → true，清除旧错误
   * 2. 组装请求参数
   * 3. 检查缓存 → 命中则直接返回
   * 4. 发送请求 → 检查响应是否需要调整分页（核心优化）
   * 5. 更新 DataStore（dataSource / total）
   * 6. 写入缓存
   * 7. 触发轮询
   *
   * ⭐ 分页自动调整机制：
   * 当最后一页的数据被删除时，当前页可能为空（totalPages < current），
   * 此时自动回退到上一页，避免显示空白页。
   */
  const fetchData = useCallback(async () => {
    if (!engineOptions.request) {
      return; // 没有配置 request 函数，不执行请求
    }

    // 设置 loading 状态，确保 UI 及时响应
    store.setLoading(true);
    store.setError(undefined);

    try {
      const params = getRequestParams();

      // ===== 缓存检查 =====
      if (cacheEnabled && cache) {
        const cachedKey = generateCacheKey(params);
        const cachedData = cache.getCache(cachedKey);
        if (cachedData) {
          // 缓存命中：直接从缓存恢复数据，不发请求
          store.setDataSource(cachedData.data);
          store.setTotal(cachedData.total);
          store.setLoading(false);
          if (polling && isPollingEnabledRef.current) {
            startPollingWithData(cachedData.data);
          }
          return;
        }
      }

      // ===== 发送请求 =====
      const response = await engine.execute(params);

      // ===== ⭐ 分页自动调整（核心逻辑） =====
      const { current, pageSize } = store.pagination;
      const totalPages = Math.ceil(response.total / pageSize);

      // 场景1：当前页 > 总页数（通常是删除最后一条数据导致）
      if (current > totalPages && totalPages > 0) {
        store.setPage(totalPages); // 跳转到最后一页
        return; // 触发下一轮请求（setPage 会触发 subscribe）
      }

      // 场景2：当前页无数据但总记录数 > 0（页码变化导致）
      if (response.data.length === 0 && current > 1 && response.total > 0) {
        store.setPage(current - 1); // 回退到上一页
        return; // 触发下一轮请求
      }

      // ===== 更新数据 =====
      store.setDataSource(response.data);
      store.setTotal(response.total);
      store.setLoading(false);

      // ===== 写入缓存 =====
      if (cacheEnabled && cache) {
        const cachedKey = generateCacheKey(params);
        cache.setCache(cachedKey, response);
      }

      // ===== 触发轮询 =====
      if (polling && isPollingEnabledRef.current) {
        startPollingWithData(response.data);
      }
    } catch (err) {
      // 请求异常处理：设置错误状态并停止轮询
      const error = err instanceof Error ? err : new Error(String(err));
      store.setError(error);
      store.setLoading(false);
      store.stopPolling();
    }
  }, [store, engine, getRequestParams, engineOptions.request, polling, cacheEnabled, cache, generateCacheKey]);

  /**
   * 防抖请求
   * 在 debounceTime 内连续调用只会执行最后一次
   * 用于搜索输入、切换分页等高频操作场景
   */
  const debouncedFetchData = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchData();
    }, debounceTime);
  }, [fetchData, debounceTime]);

  /** 取消进行中的请求（通过 AbortController）和防抖定时器 */
  const cancelRequest = useCallback(() => {
    engine.cancel(); // 取消 HTTP 请求
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, [engine]);

  /**
   * 使用当前数据启动轮询
   * polling 可以是固定数字（固定间隔）或函数（动态计算下一轮间隔）
   */
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

  /** 开始轮询 */
  const startPolling = useCallback(() => {
    if (!polling) {
      return;
    }
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
    store.stopPolling();
  }, [store]);

  // ===== 核心：监听 DataStore 状态变化自动触发请求 =====
  useEffect(() => {
    // 手动模式或未配置 request 时不自动请求
    if (manual || !engineOptions.request) {
      return;
    }

    /**
     * 订阅 DataStore 的状态变化
     * 当分页/排序/筛选/查询参数变化时，自动触发防抖请求
     * 使用 deep compare (JSON.stringify) 避免引用变化导致的误触发
     */
    const unsubscribe = store.subscribe((state: DataStoreState<T>, prevState: DataStoreState<T>) => {
      const shouldFetch =
        state.pagination.current !== prevState.pagination.current || // 页码变化
        state.pagination.pageSize !== prevState.pagination.pageSize || // 每页条数变化
        state.sorter.field !== prevState.sorter.field || // 排序字段变化
        state.sorter.order !== prevState.sorter.order || // 排序方向变化
        JSON.stringify(state.filters) !== JSON.stringify(prevState.filters) || // 筛选变化
        JSON.stringify(state.query) !== JSON.stringify(prevState.query); // 查询参数变化

      if (shouldFetch) {
        debouncedFetchData();
      }
    });

    // 组件挂载时发起首次请求
    fetchData();

    // 组件卸载时清理订阅和定时器，防止内存泄漏
    return () => {
      unsubscribe();
      cancelRequest();
      stopPolling();
    };
  }, [manual, engineOptions.request, store, fetchData, debouncedFetchData, cancelRequest, stopPolling]);

  // ===== 监听通过 CustomEvent 触发的 reload 请求 =====
  useEffect(() => {
    const handleReload = () => {
      fetchData();
    };

    // DataStore 的 reload() 方法会派发 'protable:reload' 事件
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
