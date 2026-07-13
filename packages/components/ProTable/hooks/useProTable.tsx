/**
 * useProTable - 编程式表格控制 Hook
 *
 * 提供 ref 替代方案的编程式表格控制方式：
 * 1. 声明式：直接传入 schemas 和 onFinish 等配置
 * 2. 命令式：通过返回的 dialog / form / table 实例控制
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { open, bindingProps } = useProTable({ columns: [...] });
 *   return (
 *     <>
 *       <Button onClick={() => open()}>打开弹窗</Button>
 *       <ProTable {...bindingProps} />
 *     </>
 *   );
 * };
 * ```
 */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { useRef, useCallback, useMemo, createContext, useContext, useState } from 'react';
import type { DataStoreImpl } from '../store/DataStore';
import { createDataStore } from '../store/DataStore';
import type {
  ProTableProps,
  ProTableInstance,
  ProTableActionType,
  UseProTableOptions,
  UseProTableReturn,
} from '../types';
import type { ProFormInstance } from '../../ProForm/types';
import { useRequest } from './useRequest';
import { useEditableTable } from '../editable';
import { useCache } from '@lania-pro-components/shared';

export interface ProTableContextValue<T = Record<string, unknown>> {
  instance: ProTableInstance<T>;
  bindingProps: ProTableProps<T>;
  store: DataStoreImpl<T>;
}

export const ProTableContext = createContext<ProTableContextValue<Record<string, unknown>> | null>(null);

export const useProTableContext = <T extends Record<string, unknown> = Record<string, unknown>>() => {
  const context = useContext(ProTableContext);
  return context as ProTableContextValue<T> | null;
};

/**
 * ProTable 实例管理 Hook
 * 提供表格实例方法和可直接绑定的 props
 */
export const useProTable = <T extends Record<string, unknown>>(
  options: UseProTableOptions<T>,
): UseProTableReturn<T> => {
  const {
    store: propStore,
    getRowKey: propGetRowKey,
    dataSource: propDataSource,
    columns,
    request,
    pagination: propPagination,
    editable,
    defaultPageSize,
    loading: propLoading,
    beforeRequest,
    afterRequest,
    onRequestError,
    postData,
    debounceTime,
    polling,
    manual,
    cache,
    cacheKey,
    expandedRowKeys,
  } = options;

  const [dynamicProps, setDynamicProps] = useState<Partial<ProTableProps<T>>>({});

  const defaultStoreRef = useRef<DataStoreImpl<T>>(createDataStore<T>());
  const store = propStore ?? defaultStoreRef.current;

  // ===== 行 key 获取函数 =====
  const getRowKey = useCallback(
    (record: T): string | number => {
      if (propGetRowKey) {
        return propGetRowKey(record);
      }
      return (record as Record<string, unknown>).id as string | number;
    },
    [propGetRowKey],
  );

  // ===== useCache（数据缓存）=====
  const cacheHookResult = useCache<{ data: T[]; total: number }>({
    maxAge: typeof cache === 'object' ? cache.maxAge : undefined,
    maxSize: typeof cache === 'object' ? cache.maxSize : undefined,
  });

  // ===== useRequest（数据请求）=====
  const { fetchData, startPolling, stopPolling, debouncedFetchData } = useRequest<T>({
    store,
    request: request as import('../types').ProTableRequest<T>,
    manual,
    debounceTime,
    polling,
    beforeRequest,
    afterRequest,
    onRequestError,
    postData,
    cache: cache ? cacheHookResult : undefined,
    cacheKey,
    cacheEnabled: !!cache,
  });

  // ===== useEditableTable（可编辑表格）=====
  const { startEditable, cancelEditable, saveEditable, deleteEditable } = useEditableTable<Record<string, unknown>>({
    config: editable as unknown as import('../editable/types').EditableConfig<Record<string, unknown>>,
    getRowKey: (record: Record<string, unknown>) => getRowKey(record as T),
    dataSource: store.dataSource,
  });

  // ===== 从 DataStore 读取状态 =====
  const dataSource = propDataSource !== undefined ? propDataSource : store.dataSource;
  const loading = propLoading !== undefined ? propLoading : store.loading;

  // ===== Form 实例引用（由 ProTable 内部设置）=====
  const formInstanceRef = useRef<ProFormInstance | undefined>(undefined);

  // ===== 展开行状态初始化（从外部传入的初始值）=====
  if (expandedRowKeys && store.expandedRowKeys.length === 0) {
    store.setExpandedRows(expandedRowKeys, []);
  }

  // ===== 请求数据底层函数（fetchData / debouncedFetchData 共用）=====
  const requestDataFn = useCallback(
    (params?: Record<string, unknown>) => {
      if (params) {
        const { pageSize, current, ...queryParams } = params;
        if (pageSize !== undefined) {
          store.setPageSize(pageSize as number);
        }
        if (current !== undefined) {
          store.setPage(current as number);
        } else {
          store.setPage(1);
        }
        store.setQuery({ ...store.query, ...queryParams });
      }
      fetchData();
    },
    [store, fetchData],
  );

  // ===== 防抖请求（委托给 useRequest）=====
  const debouncedFetchDataFn = useCallback(
    (params?: Record<string, unknown>) => {
      if (params) {
        const { pageSize, current, ...queryParams } = params;
        if (pageSize !== undefined) {
          store.setPageSize(pageSize as number);
        }
        if (current !== undefined) {
          store.setPage(current as number);
        } else {
          store.setPage(1);
        }
        store.setQuery({ ...store.query, ...queryParams });
      }
      debouncedFetchData();
    },
    [store, debouncedFetchData],
  );

  // ===== 构建 action（严格对齐 ProTableActionType）=====
  const action = useMemo<ProTableActionType<T>>(
    () => ({
      // --- 数据操作 ---
      reload: (resetPageIndex?: boolean) => {
        if (resetPageIndex) store.setPage(1);
        store.reload();
      },
      fetchData: (params?: Record<string, unknown>) => requestDataFn(params),
      reloadAndRest: () => {
        store.reset();
        store.clearSelected();
        store.reload();
      },
      reset: () => {
        store.reset();
        store.reload();
      },

      // --- 选中操作 ---
      clearSelected: () => store.clearSelected(),
      setSelectedRows: (keys, rows) => store.setSelectedRows(keys, rows),
      setSelectedRowKeys: (keys) => store.setSelectedRows(keys, store.selectedRows),
      getSelectedRows: () => store.selectedRows,
      getSelectedRowKeys: () => store.selectedRowKeys,

      // --- 分页操作 ---
      getPagination: () => ({
        current: store.pagination.current,
        pageSize: store.pagination.pageSize,
        total: store.total,
      }),
      setPagination: (p) => {
        if (p.current !== undefined) store.setPage(p.current);
        if (p.pageSize !== undefined) store.setPageSize(p.pageSize);
      },

      // --- 查询参数 ---
      getParams: () => store.query,
      setParams: (params) => store.setQuery(params),

      // --- 表单实例 ---
      getFormInstance: () => formInstanceRef.current,

      // --- 展开�?---
      getExpandedRowKeys: () => store.expandedRowKeys,
      setExpandedRowKeys: (keys) => store.setExpandedRows(keys, store.expandedRows),
      setExpandedRows: (keys, rows) => store.setExpandedRows(keys, rows),
      getExpandedRows: () => store.expandedRows,
      clearExpanded: () => store.clearExpanded(),

      // --- 可编辑表�?---
      startEditable,
      cancelEditable,
      saveEditable,
      deleteEditable,

      // --- 轮询 ---
      startPolling,
      stopPolling,
      getPollingStatus: () => ({
        isPolling: store.isPolling,
        interval: store.pollingInterval,
      }),

      // --- 防抖请求 ---
      debouncedFetchData: (params) => debouncedFetchDataFn(params),

      // --- 弹窗（需�?ProDialog 集成�?--
      openDialog: () => {
        throw new Error('openDialog is not implemented. Use ProTable with dialog integration.');
      },
      confirm: () => {
        throw new Error('confirm is not implemented. Use ProTable with dialog integration.');
      },

      // --- 可选：虚拟滚动 / 拖拽排序 / 缓存 ---
      scrollToIndex: undefined,
      scrollToTop: undefined,
      scrollToBottom: undefined,
      resetDragSort: undefined,
      clearCache: undefined,
    }),
    [
      store,
      requestDataFn,
      startEditable,
      cancelEditable,
      saveEditable,
      deleteEditable,
      startPolling,
      stopPolling,
      debouncedFetchDataFn,
    ],
  );

  // ===== bindingProps（提前定义，供 instance 使用）=====
  const bindingPropsRef = useRef<ProTableProps<T>>({} as ProTableProps<T>);

  const setProps = useCallback((props: Partial<ProTableProps<T>>) => {
    setDynamicProps((prev) => ({ ...prev, ...props }));
  }, []);

  const getProps = useCallback(() => bindingPropsRef.current, []);

  // ===== 构建 instance（严格对齐 ProTableInstance，用 useMemo 稳定引用）=====
  const instance = useMemo<ProTableInstance<T>>(
    () => ({
      action,
      form: formInstanceRef.current,
      dataSource,
      loading,
      selectedRows: store.selectedRows,
      selectedRowKeys: store.selectedRowKeys,
      expandedRows: store.expandedRows,
      expandedRowKeys: store.expandedRowKeys,
      pagination: {
        current: store.pagination.current,
        pageSize: store.pagination.pageSize,
        total: store.total,
      },
      params: store.query,
      fetchData: (params?: Record<string, unknown>) => requestDataFn(params),
      setProps,
      getProps,
      store,
    }),
    [
      action,
      formInstanceRef.current,
      dataSource,
      loading,
      store.selectedRows,
      store.selectedRowKeys,
      store.expandedRows,
      store.expandedRowKeys,
      store.pagination.current,
      store.pagination.pageSize,
      store.total,
      store.query,
      requestDataFn,
      setProps,
      getProps,
    ],
  );

  // ===== bindingProps =====
  const bindingProps = useMemo<ProTableProps<T>>(() => {
    const props = {
      ...options,
      columns: columns || [],
      dataSource,
      pagination: propPagination === false ? false : { pageSize: defaultPageSize || 20, ...propPagination },
      loading,
      ...dynamicProps,
    } as ProTableProps<T>;
    bindingPropsRef.current = props;
    return props;
  }, [options, columns, dataSource, propPagination, defaultPageSize, loading, dynamicProps]);

  return { instance, bindingProps, store };
};

export default useProTable;
