/**
 * URL 参数同步 Hook（useUrlSync）
 *
 * @deprecated 请从 @lania-pro-components/shared 导入 useUrlSync
 * 此文件为向后兼容保留的 DataStore 集成壳
 */
import { useUrlSync as useUrlSyncShared } from '@lania-pro-components/shared';
import type { DataStoreImpl } from '../store/DataStore';

export interface UrlSyncConfig {
  prefix?: string;
  include?: string[];
  exclude?: string[];
}

export interface UseUrlSyncOptions<T = Record<string, unknown>> {
  enabled: boolean;
  store: DataStoreImpl<T>;
  config?: UrlSyncConfig;
  debounceTime?: number;
}

const parseParamValue = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }
};

const filterParams = (params: Record<string, unknown>, config: UrlSyncConfig): Record<string, string> => {
  const { prefix = '', include, exclude } = config;
  const result: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    const paramKey = prefix ? `${prefix}${key}` : key;
    if (include && !include.includes(key)) return;
    if (exclude && exclude.includes(key)) return;
    if (value !== undefined && value !== null && value !== '') {
      result[paramKey] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
  });
  return result;
};

export const useUrlSync = <T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseUrlSyncOptions<T>,
) => {
  const { enabled, store, config = {}, debounceTime = 300 } = options;
  const { prefix = '' } = config;

  return useUrlSyncShared({
    enabled,
    getState: () => store.getState(),
    setState: (partial: Record<string, unknown>) => {
      if (partial.current && typeof partial.current === 'number') store.setPage(partial.current);
      if (partial.pageSize && typeof partial.pageSize === 'number') store.setPageSize(partial.pageSize);
      if (partial.sortField)
        store.setSorter(String(partial.sortField), partial.sortOrder as 'ascend' | 'descend' | undefined);
      if (partial.params) store.setQuery(partial.params as Record<string, unknown>);
    },
    serialize: (state) =>
      filterParams({ current: state.pagination.current, pageSize: state.pagination.pageSize, ...state.query }, config),
    deserialize: (params) => {
      const state: Record<string, unknown> = {};
      Object.entries(params).forEach(([key, value]) => {
        const stateKey = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;
        state[stateKey] = parseParamValue(value);
      });
      return state;
    },
    debounceTime,
  });
};
