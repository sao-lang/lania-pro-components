/**
 * DataContext — 表格数据上下文（数据状态层）
 *
 * 向子组件暴露 DataStore 的完整状态（dataSource/loading/pagination 等）
 * 和操作方法（setQuery/setPage/reload 等），以及 ProTable action 实例。
 * 子组件通过 useDataContext() 获取这些数据和操作。
 */
import React, { createContext, useContext, useMemo, useEffect, useRef, useState } from 'react';
import type { DataStoreImpl } from '../store/DataStore';
import type { DataStoreState, DataStoreActions } from '../store/types';
import type { ProTableActionType } from '../types';
import type { ProFormInstance } from '../../ProForm/types';

export interface DataContextValue<T = Record<string, unknown>> extends DataStoreState<T>, DataStoreActions<T> {
  action: ProTableActionType<T>;
  formRef: React.RefObject<ProFormInstance | null>;
  onDataSourceChange?: (dataSource: T[]) => void;
  getState: () => DataStoreState<T>;
}

const DataContext = createContext<DataContextValue<Record<string, unknown>> | null>(null);

export interface DataProviderProps<T extends Record<string, unknown> = Record<string, unknown>> {
  children: React.ReactNode;
  store: DataStoreImpl<T>;
  formRef: React.RefObject<ProFormInstance | null>;
  action: ProTableActionType<T>;
  onDataSourceChange?: (dataSource: T[]) => void;
}

export const DataProvider = <T extends Record<string, unknown>>({
  children,
  store,
  formRef,
  action,
  onDataSourceChange,
}: DataProviderProps<T>) => {
  const [, forceUpdate] = useState({});
  const prevTotalRef = useRef(store.total);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [store]);

  useEffect(() => {
    onDataSourceChange?.(store.dataSource);
  }, [store.dataSource, onDataSourceChange]);

  useEffect(() => {
    const { total } = store;
    const { current, pageSize } = store.pagination;

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
      expandedRowKeys: store.expandedRowKeys,
      expandedRows: store.expandedRows,
      isPolling: store.isPolling,
      pollingInterval: store.pollingInterval,
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
      setExpandedRows: store.setExpandedRows.bind(store),
      clearExpanded: store.clearExpanded.bind(store),
      setPolling: store.setPolling.bind(store),
      startPolling: store.startPolling.bind(store),
      stopPolling: store.stopPolling.bind(store),
      reload: store.reload.bind(store),
      reset: store.reset.bind(store),
      getState: () => ({
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
        expandedRowKeys: store.expandedRowKeys,
        expandedRows: store.expandedRows,
        isPolling: store.isPolling,
        pollingInterval: store.pollingInterval,
      }),
      action,
      formRef,
      onDataSourceChange,
    }),
    [
      store,
      action,
      formRef,
      onDataSourceChange,
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
      store.expandedRowKeys,
      store.expandedRows,
      store.isPolling,
      store.pollingInterval,
    ],
  );

  return (
    <DataContext.Provider value={value as unknown as DataContextValue<Record<string, unknown>>}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = <T extends Record<string, unknown> = Record<string, unknown>>() => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context as DataContextValue<T>;
};
