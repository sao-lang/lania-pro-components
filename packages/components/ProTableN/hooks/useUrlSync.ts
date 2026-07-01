import { useEffect, useCallback, useRef } from 'react';
import type { DataStoreImpl } from '../store/DataStore';

export interface UrlSyncConfig {
  /** URL 参数前缀 */
  prefix?: string;
  /** 包含的参数 */
  include?: string[];
  /** 排除的参数 */
  exclude?: string[];
}

export interface UseUrlSyncOptions {
  /** 是否启用 URL 同步 */
  enabled: boolean;
  /** DataStore 实例 */
  store: DataStoreImpl<any>;
  /** 同步配置 */
  config?: UrlSyncConfig;
  /** 同步延迟时间（防抖） */
  debounceTime?: number;
}

/**
 * 解析 URL 查询参数
 */
const parseUrlParams = (): Record<string, string> => {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

/**
 * 更新 URL 查询参数
 */
const updateUrlParams = (params: Record<string, string | undefined>, replace = false) => {
  const url = new URL(window.location.href);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  if (replace) {
    window.history.replaceState({}, '', url.toString());
  } else {
    window.history.pushState({}, '', url.toString());
  }
};

/**
 * 过滤参数
 */
const filterParams = (params: Record<string, unknown>, config: UrlSyncConfig): Record<string, string> => {
  const { prefix = '', include, exclude } = config;
  const result: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    // 应用前缀
    const paramKey = prefix ? `${prefix}${key}` : key;

    // 检查 include
    if (include && !include.includes(key)) {
      return;
    }

    // 检查 exclude
    if (exclude && exclude.includes(key)) {
      return;
    }

    // 转换值为字符串
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object') {
        result[paramKey] = JSON.stringify(value);
      } else {
        result[paramKey] = String(value);
      }
    }
  });

  return result;
};

/**
 * 从 URL 参数恢复值
 */
const parseParamValue = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    // 尝试转换为数字
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    // 尝试转换为布尔值
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return value;
  }
};

/**
 * URL 同步 Hook
 * 将表格状态同步到 URL 参数
 */
export const useUrlSync = (options: UseUrlSyncOptions) => {
  const { enabled, store, config = {}, debounceTime = 300 } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringRef = useRef(false);

  const { prefix = '' } = config;

  /**
   * 同步状态到 URL
   */
  const syncToUrl = useCallback(() => {
    if (!enabled) {
      return;
    }

    const state = store.getState();

    // 构建参数对象
    const params: Record<string, unknown> = {
      current: state.pagination.current,
      pageSize: state.pagination.pageSize,
      ...state.query,
    };

    // 添加排序参数
    if (state.sorter.field) {
      params.sortField = state.sorter.field;
      params.sortOrder = state.sorter.order;
    }

    // 过滤并转换参数
    const filteredParams = filterParams(params, config);

    // 更新 URL
    updateUrlParams(filteredParams);
  }, [enabled, store, config]);

  /**
   * 从 URL 恢复状态
   */
  const restoreFromUrl = useCallback(() => {
    if (!enabled) {
      return;
    }

    const urlParams = parseUrlParams();
    const state: Record<string, unknown> = {};

    Object.entries(urlParams).forEach(([key, value]) => {
      // 移除前缀
      const stateKey = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;

      state[stateKey] = parseParamValue(value);
    });

    // 恢复分页
    if (state.current || state.pageSize) {
      const current = typeof state.current === 'number' ? state.current : 1;
      const pageSize = typeof state.pageSize === 'number' ? state.pageSize : 20;
      store.setPage(current);
      store.setPageSize(pageSize);
    }

    // 恢复查询参数
    const queryParams = { ...state };
    delete queryParams.current;
    delete queryParams.pageSize;
    delete queryParams.sortField;
    delete queryParams.sortOrder;

    if (Object.keys(queryParams).length > 0) {
      store.setQuery(queryParams);
    }

    // 恢复排序
    if (state.sortField && state.sortOrder) {
      store.setSorter(String(state.sortField), state.sortOrder as 'ascend' | 'descend');
    }
  }, [enabled, store, prefix]);

  // 监听状态变化，同步到 URL
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribe = store.subscribe(() => {
      if (isRestoringRef.current) {
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        syncToUrl();
      }, debounceTime);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, store, syncToUrl, debounceTime]);

  // 初始加载时从 URL 恢复
  useEffect(() => {
    if (!enabled) {
      return;
    }

    isRestoringRef.current = true;
    restoreFromUrl();

    // 恢复完成后重置标志
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 0);
  }, [enabled, restoreFromUrl]);

  // 监听浏览器前进/后退
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handlePopState = () => {
      isRestoringRef.current = true;
      restoreFromUrl();
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, restoreFromUrl]);

  return {
    syncToUrl,
    restoreFromUrl,
  };
};

export default useUrlSync;
