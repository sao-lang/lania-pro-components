/**
 * useProTable — 编程式表格控制 Hook
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
import { useRef, useCallback, useMemo, createContext, useContext } from 'react';
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
    toolbar,
    search,
    rowSelection,
    batchOperation,
    pagination: propPagination,
    cardContainer,
    urlSync,
    searchSchema,
    editable,
    defaultPageSize,
    pageSizeOptions,
    rowKey,
    loading: propLoading,
    emptyRender,
    errorRender,
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
    setExpandedRowKeys,
  } = options;

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
  // fetchData 通过 store.onReload(fetchData) 内部注册，外部调 store.reload() 就会触发
  const { startPolling, stopPolling, debouncedFetchData } = useRequest<T>({
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

  // ===== 展开行 keys（由外部受控或内部管理）=====
  const expandedRowKeysRef = useRef<(string | number)[]>(expandedRowKeys ?? []);

  // ===== 请求数据底层函数（fetchData / debouncedFetchData 共用）=====
  const requestDataFn = useCallback(
    (params?: Record<string, unknown>) => {
      if (params) {
        const { pageSize, current, ...queryParams } = params;
        // 分离分页参数：pageSize/current 设置到分页，其余合并到查询条件
        if (pageSize !== undefined) {
          store.setPageSize(pageSize as number);
        }
        if (current !== undefined) {
          store.setPage(current as number);
        } else {
          // 传入其他查询参数时默认重置到第 1 页
          store.setPage(1);
        }
        store.setQuery({ ...store.query, ...queryParams });
      }
      store.reload();
    },
    [store],
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

      // --- 展开行 ---
      getExpandedRowKeys: () => expandedRowKeysRef.current,
      setExpandedRowKeys: (keys) => {
        expandedRowKeysRef.current = keys;
        setExpandedRowKeys?.(keys);
      },

      // --- 可编辑表格 ---
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

      // --- 弹窗（需与 ProDialog 集成）---
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

  // ===== 构建 instance（严格对齐 ProTableInstance，用 useMemo 稳定引用）=====
  const instance = useMemo<ProTableInstance<T>>(
    () => ({
      action,
      form: formInstanceRef.current,
      dataSource,
      loading,
      selectedRows: store.selectedRows,
      selectedRowKeys: store.selectedRowKeys,
      pagination: {
        current: store.pagination.current,
        pageSize: store.pagination.pageSize,
        total: store.total,
      },
      params: store.query,
      fetchData: (params?: Record<string, unknown>) => requestDataFn(params),
    }),
    [
      action,
      formInstanceRef.current,
      dataSource,
      loading,
      store.selectedRows,
      store.selectedRowKeys,
      store.pagination.current,
      store.pagination.pageSize,
      store.total,
      store.query,
      requestDataFn,
    ],
  );

  // ===== 暴露 formRef 设置接口供 ProTable 内部使用 =====
  const setFormInstance = useCallback((form: ProFormInstance | undefined) => {
    formInstanceRef.current = form;
  }, []);

  // ===== bindingProps =====
  const bindingProps = useMemo<ProTableProps<T>>(
    () => ({
      columns: columns || [],
      dataSource,
      request,
      toolbar,
      search,
      rowSelection,
      batchOperation,
      pagination: propPagination === false ? false : { pageSize: defaultPageSize || 20, ...propPagination },
      cardContainer,
      urlSync,
      searchSchema,
      editable,
      defaultPageSize,
      pageSizeOptions,
      rowKey,
      loading,
      emptyRender,
      errorRender,
      beforeRequest,
      afterRequest,
      onRequestError,
      postData,
      debounceTime,
      polling,
      manual,
      dragSort: options.dragSort,
      virtualScroll: options.virtualScroll,
      virtualScrollConfig: options.virtualScrollConfig,
      cache: options.cache,
      cacheKey: options.cacheKey,
    }),
    [
      columns,
      dataSource,
      request,
      toolbar,
      search,
      rowSelection,
      batchOperation,
      propPagination,
      cardContainer,
      urlSync,
      searchSchema,
      editable,
      defaultPageSize,
      pageSizeOptions,
      rowKey,
      loading,
      emptyRender,
      errorRender,
      beforeRequest,
      afterRequest,
      onRequestError,
      postData,
      debounceTime,
      polling,
      manual,
      options.dragSort,
      options.virtualScroll,
      options.virtualScrollConfig,
      options.cache,
      options.cacheKey,
    ],
  );

  return { instance, bindingProps, store, setFormInstance };
};

export default useProTable;
