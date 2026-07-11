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
import type { EditableTableInstance } from '../editable/types';
import type { ProTableProps, ProColumnType } from '../types';
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
 * 表格实例 — useProTable 返回的唯一状态 + 操作接口。
 *
 * 状态直接以属性形式访问（如 instance.dataSource），
 * 操作方法直接调用（如 instance.reload()）。
 */
export interface ProTableInstance<T = Record<string, unknown>> {
  // === 状态（直接属性访问）===
  dataSource: T[];
  loading: boolean;
  pagination: { current: number; pageSize: number; total: number };
  selectedRowKeys: (string | number)[];
  selectedRows: T[];
  query: Record<string, unknown>;
  error?: Error;
  isPolling: boolean;
  pollingInterval?: number;

  // === 操作方法 ===
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  setPagination: (pagination: { current?: number; pageSize?: number }) => void;
  setQueryParams: (params: Record<string, unknown>) => void;
  getSorter: () => { field?: string; direction?: 'ascend' | 'descend' } | null;
  clearSorter: () => void;
  setSelectedRows: (keys: (string | number)[], rows: T[]) => void;
  clearSelection: () => void;
  setDataSource: (data: T[]) => void;
  /** 执行数据请求（可用于手动触发） */
  fetchData: () => Promise<void>;
  /** 开始轮询 */
  startPolling: () => void;
  /** 停止轮询 */
  stopPolling: () => void;
  /** 开始编辑指定行 */
  startEditable: (rowKey: string | number) => boolean;
  /** 取消编辑指定行 */
  cancelEditable: (rowKey: string | number) => Promise<boolean>;
  /** 保存编辑行 */
  saveEditable: (rowKey: string | number) => Promise<boolean>;
  /** 删除编辑行 */
  deleteEditable?: (rowKey: string | number) => Promise<boolean>;
  /** 滚动到指定行（仅虚拟滚动开启时有效） */
  scrollToIndex?: (index: number) => void;
  /** 滚动到顶部 */
  scrollToTop?: () => void;
  /** 滚动到底部 */
  scrollToBottom?: () => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandRow: (rowKey: string | number) => void;
  collapseRow: (rowKey: string | number) => void;
}

export interface UseProTableOptions<T = Record<string, unknown>> {
  /** 表格 store */
  store?: DataStoreImpl<T>;
  /** 可编辑表格实例 */
  editableInstance?: EditableTableInstance<T>;
  /** 展开控制 */
  expandedRowKeys?: (string | number)[];
  /** 设置展开 keys */
  setExpandedRowKeys?: (keys: (string | number)[]) => void;
  /** 获取行 key */
  getRowKey?: (record: T) => string | number;
  /** 数据源 */
  dataSource?: T[];
  /** 列配置 */
  columns?: ProColumnType<T>[];
  /** 请求函数 */
  request?: ProTableProps<T>['request'];
  /** 工具栏配置 */
  toolbar?: ProTableProps<T>['toolbar'];
  /** 搜索表单配置 */
  search?: ProTableProps<T>['search'];
  /** 行选择配置 */
  rowSelection?: ProTableProps<T>['rowSelection'];
  /** 批量操作配置 */
  batchOperation?: ProTableProps<T>['batchOperation'];
  /** 分页配置 */
  pagination?: ProTableProps<T>['pagination'];
  /** 卡片容器配置 */
  cardContainer?: ProTableProps<T>['cardContainer'];
  /** URL 同步配置 */
  urlSync?: ProTableProps<T>['urlSync'];
  /** 查询方案配置 */
  searchSchema?: ProTableProps<T>['searchSchema'];
  /** 编辑配置 */
  editable?: ProTableProps<T>['editable'];
  /** 默认页码 */
  defaultPageSize?: number;
  /** 页码选项 */
  pageSizeOptions?: number[];
  /** 行 key */
  rowKey?: string | ((record: T) => string | number);
  /** 加载状态 */
  loading?: boolean;
  /** 空状态渲染 */
  emptyRender?: ProTableProps<T>['emptyRender'];
  /** 错误状态渲染 */
  errorRender?: ProTableProps<T>['errorRender'];
  /** 请求前钩子 */
  beforeRequest?: ProTableProps<T>['beforeRequest'];
  /** 请求后钩子 */
  afterRequest?: ProTableProps<T>['afterRequest'];
  /** 请求错误回调 */
  onRequestError?: ProTableProps<T>['onRequestError'];
  /** 数据格式化 */
  postData?: ProTableProps<T>['postData'];
  /** 防抖时间 */
  debounceTime?: number;
  /** 轮询间隔 */
  polling?: ProTableProps<T>['polling'];
  /** 是否手动触发请求 */
  manual?: boolean;
  /** 拖拽排序配置 */
  dragSort?: ProTableProps<T>['dragSort'];
  /** 虚拟滚动配置 */
  virtualScroll?: ProTableProps<T>['virtualScroll'];
  /** 虚拟滚动详细配置 */
  virtualScrollConfig?: ProTableProps<T>['virtualScrollConfig'];
  /** 卡片模式配置 */
  cardMode?: ProTableProps<T>['cardMode'];
  /** 缓存配置 */
  cache?: ProTableProps<T>['cache'];
  /** 缓存 key */
  cacheKey?: string;
  /** 视图模式 */
  viewMode?: 'table' | 'card';
  /** 视图模式变化回调 */
  onViewModeChange?: (mode: 'table' | 'card') => void;
}

export interface UseProTableReturn<T = Record<string, unknown>> {
  /** 表格实例（状态 + 操作方法） */
  instance: ProTableInstance<T>;
  /** 可直接绑定到 ProTable 组件的 props */
  bindingProps: ProTableProps<T>;
  /** DataStore 实例（供 ProTable 内部 Context 使用） */
  store: DataStoreImpl<T>;
}

/**
 * ProTable 实例管理 Hook
 * 提供表格实例方法和可直接绑定的 props
 */
export const useProTable = <T extends Record<string, unknown>>(
  options: UseProTableOptions<T>,
): UseProTableReturn<T> => {
  const {
    store: propStore,
    expandedRowKeys,
    setExpandedRowKeys,
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
    dragSort: _dragOpt,
    virtualScroll: _virtOpt,
    virtualScrollConfig: _virtCfg,
    cache,
    cacheKey,
    viewMode: _viewMode,
    onViewModeChange: _onViewChange,
  } = options;

  void _dragOpt;
  void _virtOpt;
  void _virtCfg;
  void _viewMode;
  void _onViewChange;

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
  const { fetchData, startPolling, stopPolling } = useRequest<T>({
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

  // ===== 方法定义 =====
  const reload = useCallback(async () => {
    store.reload();
  }, [store]);

  const refresh = useCallback(async () => {
    store.reload();
  }, [store]);

  const reset = useCallback(async () => {
    store.reset();
    store.reload();
  }, [store]);

  const setPagination = useCallback(
    (pagination: { current?: number; pageSize?: number }) => {
      if (pagination.current !== undefined) store.setPage(pagination.current);
      if (pagination.pageSize !== undefined) store.setPageSize(pagination.pageSize);
    },
    [store],
  );

  const setQueryParams = useCallback((params: Record<string, unknown>) => store.setQuery(params), [store]);

  const getSorter = useCallback(
    () => (store.sorter.field ? { field: store.sorter.field, direction: store.sorter.order } : null),
    [store.sorter],
  );

  const clearSorter = useCallback(() => store.setSorter(undefined, undefined), [store]);

  const setSelectedRowsCallback = useCallback(
    (keys: (string | number)[], rows: T[]) => store.setSelectedRows(keys, rows),
    [store],
  );

  const clearSelection = useCallback(() => store.clearSelected(), [store]);

  const setDataSource = useCallback(
    (data: T[]) => {
      store.setDataSource(data);
      store.setTotal(data.length);
    },
    [store],
  );

  const expandAll = useCallback(() => {
    if (setExpandedRowKeys) {
      setExpandedRowKeys(dataSource.map((r) => getRowKey(r)));
    }
  }, [dataSource, getRowKey, setExpandedRowKeys]);

  const collapseAll = useCallback(() => {
    setExpandedRowKeys?.([]);
  }, [setExpandedRowKeys]);

  const expandRow = useCallback(
    (key: string | number) => {
      if (setExpandedRowKeys && expandedRowKeys && !expandedRowKeys.includes(key)) {
        setExpandedRowKeys([...expandedRowKeys, key]);
      }
    },
    [expandedRowKeys, setExpandedRowKeys],
  );

  const collapseRow = useCallback(
    (key: string | number) => {
      if (setExpandedRowKeys && expandedRowKeys) {
        setExpandedRowKeys(expandedRowKeys.filter((k) => k !== key));
      }
    },
    [expandedRowKeys, setExpandedRowKeys],
  );

  // ===== 构建 instance =====
  const instance: ProTableInstance<T> = {
    // 状态
    dataSource,
    loading,
    pagination: {
      current: store.pagination.current,
      pageSize: store.pagination.pageSize,
      total: store.total,
    },
    selectedRowKeys: store.selectedRowKeys,
    selectedRows: store.selectedRows,
    query: store.query,
    error: store.error,
    isPolling: store.isPolling,
    pollingInterval: store.pollingInterval,

    // 操作
    reload,
    refresh,
    reset,
    setPagination,
    setQueryParams,
    getSorter,
    clearSorter,
    setSelectedRows: setSelectedRowsCallback,
    clearSelection,
    setDataSource,
    fetchData,
    startPolling,
    stopPolling,
    startEditable,
    cancelEditable,
    saveEditable,
    deleteEditable,
    expandAll,
    collapseAll,
    expandRow,
    collapseRow,
  };

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

  return { instance, bindingProps, store };
};

export default useProTable;
