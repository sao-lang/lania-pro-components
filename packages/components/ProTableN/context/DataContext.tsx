import React, { createContext, useContext, useMemo, useEffect, useRef, useState } from 'react';
import type { DataStoreImpl } from '../store/DataStore';
import type { DataStoreState, DataStoreActions } from '../store/types';
import type { ProTableActionType } from '../types';
import type { ProFormInstance } from '../../ProFormN/types';
import { useRootContext } from './RootContext';

/**
 * DataContext - 数据状态层
 * 从 DataStore 读取状态，提供 action 方法
 */
export interface DataContextValue<T = Record<string, any>> extends DataStoreState<T>, DataStoreActions<T> {
  /** 表格操作方法 */
  action: ProTableActionType;
  /** 表单 ref */
  formRef: React.RefObject<ProFormInstance | null>;
}

const DataContext = createContext<DataContextValue<any> | null>(null);

export interface DataProviderProps<T extends Record<string, any> = Record<string, any>> {
  children: React.ReactNode;
  store: DataStoreImpl<T>;
  formRef: React.RefObject<ProFormInstance | null>;
  action: ProTableActionType;
}

export const DataProvider = <T extends Record<string, any>>({
  children,
  store,
  formRef,
  action,
}: DataProviderProps<T>) => {
  const [, forceUpdate] = useState({});
  const prevTotalRef = useRef(store.total);

  // 订阅 Store 状态变化
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [store]);

  // 处理删除最后一页数据后的分页调整
  useEffect(() => {
    const { total } = store;
    const { current, pageSize } = store.pagination;

    // 只有 total 变化时才检查
    if (total !== prevTotalRef.current) {
      prevTotalRef.current = total;

      let shouldAdjust = false;
      let newCurrent = current;

      if (total > 0) {
        const maxPage = Math.ceil(total / pageSize);
        if (current > maxPage) {
          newCurrent = Math.max(1, maxPage);
          shouldAdjust = true;
        }
      } else if (total === 0 && current > 1) {
        newCurrent = 1;
        shouldAdjust = true;
      }

      if (shouldAdjust && newCurrent !== current) {
        store.setPage(newCurrent);
      }
    }
  }, [store, store.total, store.pagination.current, store.pagination.pageSize]);

  const value = useMemo<DataContextValue<T>>(
    () => ({
      // 状态
      dataSource: store.dataSource,
      loading: store.loading,
      error: store.error,
      total: store.total,
      query: store.query,
      pagination: store.pagination,
      sorter: store.sorter,
      filters: store.filters,
      selectedRowKeys: store.selectedRowKeys,
      selectedRows: store.selectedRows,
      isPolling: store.isPolling,
      pollingInterval: store.pollingInterval,
      // 方法
      setDataSource: store.setDataSource.bind(store),
      setLoading: store.setLoading.bind(store),
      setError: store.setError.bind(store),
      setTotal: store.setTotal.bind(store),
      setQuery: store.setQuery.bind(store),
      setPage: store.setPage.bind(store),
      setPageSize: store.setPageSize.bind(store),
      setSorter: store.setSorter.bind(store),
      setFilters: store.setFilters.bind(store),
      setSelectedRows: store.setSelectedRows.bind(store),
      clearSelected: store.clearSelected.bind(store),
      setPolling: store.setPolling.bind(store),
      startPolling: store.startPolling.bind(store),
      stopPolling: store.stopPolling.bind(store),
      reload: store.reload.bind(store),
      reset: store.reset.bind(store),
      // action 和 formRef
      action,
      formRef,
    }),
    [
      store,
      action,
      formRef,
      store.dataSource,
      store.loading,
      store.error,
      store.total,
      store.query,
      store.pagination,
      store.sorter,
      store.filters,
      store.selectedRowKeys,
      store.selectedRows,
      store.isPolling,
      store.pollingInterval,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
