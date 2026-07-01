/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { useRef, useImperativeHandle, useCallback, useMemo, useState } from 'react';
import type { DataStoreImpl } from '../store/DataStore';
import type { EditableTableInstance } from '../editable/types';
import type { ProTableProps, ProColumnType } from '../types';

/**
 * 表格实例方法
 */
export interface ProTableInstance {
  /** 重新加载数据 */
  reload: () => Promise<void>;
  /** 刷新数据（保持当前分页和查询条件） */
  refresh: () => Promise<void>;
  /** 重置查询条件并重新加载 */
  reset: () => Promise<void>;
  /** 获取当前分页信息 */
  getPagination: () => {
    current: number;
    pageSize: number;
    total: number;
  };
  /** 设置分页 */
  setPagination: (pagination: { current?: number; pageSize?: number }) => void;
  /** 获取当前查询参数 */
  getQueryParams: () => Record<string, unknown>;
  /** 设置查询参数 */
  setQueryParams: (params: Record<string, unknown>) => void;
  /** 获取当前排序信息 */
  getSorter: () => { field?: string; direction?: 'ascend' | 'descend' } | null;
  /** 清除排序 */
  clearSorter: () => void;
  /** 获取选中的行数据 */
  getSelectedRows: () => Record<string, unknown>[];
  /** 获取选中的行 keys */
  getSelectedRowKeys: () => (string | number)[];
  /** 设置选中的行 */
  setSelectedRows: (keys: (string | number)[], rows: Record<string, unknown>[]) => void;
  /** 清除选中 */
  clearSelection: () => void;
  /** 获取表格数据 */
  getDataSource: () => Record<string, unknown>[];
  /** 设置表格数据 */
  setDataSource: (data: Record<string, unknown>[]) => void;
  /** 获取表格 loading 状态 */
  getLoading: () => boolean;
  /** 展开所有行 */
  expandAll: () => void;
  /** 收起所有行 */
  collapseAll: () => void;
  /** 展开指定行 */
  expandRow: (rowKey: string | number) => void;
  /** 收起指定行 */
  collapseRow: (rowKey: string | number) => void;
}

export interface UseProTableOptions<T = Record<string, unknown>> {
  /** 表格 store */
  store: DataStoreImpl<T>;
  /** 可编辑表格实例 */
  editableInstance?: EditableTableInstance<T>;
  /** 展开控制 */
  expandedRowKeys?: (string | number)[];
  /** 设置展开 keys */
  setExpandedRowKeys?: (keys: (string | number)[]) => void;
  /** 获取行 key */
  getRowKey: (record: T) => string | number;
  /** 数据源 */
  dataSource: T[];
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
}

export interface UseProTableReturn<T = Record<string, unknown>> {
  /** 表格实例 ref */
  tableRef: React.RefObject<ProTableInstance>;
  /** 表格实例方法 */
  instance: ProTableInstance;
  /** 可直接绑定到 ProTableN 组件的 props */
  bindingProps: ProTableProps<T>;
  /** 当前数据 */
  dataSource: T[];
  /** 加载状态 */
  loading: boolean;
  /** 分页信息 */
  pagination: {
    current: number;
    pageSize: number;
  };
  /** 选中行 keys */
  selectedRowKeys: (string | number)[];
  /** 选中行数据 */
  selectedRows: T[];
  /** 查询参数 */
  query: Record<string, unknown>;
}

/**
 * ProTable 实例管理 Hook
 * 提供表格实例方法和可直接绑定的 props
 */
export const useProTable = <T extends Record<string, unknown>>(
  options: UseProTableOptions<T>,
): UseProTableReturn<T> => {
  const {
    store,
    expandedRowKeys,
    setExpandedRowKeys,
    getRowKey,
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
  } = options;

  const tableRef = useRef<ProTableInstance>(null);

  // 本地状态（用于受控模式）
  const [localDataSource, setLocalDataSource] = useState<T[]>(propDataSource || []);
  const [localLoading] = useState(false);

  // 使用外部或本地数据
  const dataSource = propDataSource !== undefined ? propDataSource : localDataSource;
  const loading = propLoading !== undefined ? propLoading : localLoading;

  // 重新加载数据
  const reload = useCallback(async () => {
    store.reload();
  }, [store]);

  // 刷新数据（保持当前分页和查询条件）
  const refresh = useCallback(async () => {
    store.reload();
  }, [store]);

  // 重置查询条件并重新加载
  const reset = useCallback(async () => {
    store.reset();
    store.reload();
  }, [store]);

  // 获取当前分页信息
  const getPagination = useCallback(
    () => ({
      current: store.pagination.current,
      pageSize: store.pagination.pageSize,
      total: store.total,
    }),
    [store.pagination, store.total],
  );

  // 设置分页
  const setPagination = useCallback(
    (pagination: { current?: number; pageSize?: number }) => {
      if (pagination.current !== undefined) {
        store.setPage(pagination.current);
      }
      if (pagination.pageSize !== undefined) {
        store.setPageSize(pagination.pageSize);
      }
    },
    [store],
  );

  // 获取当前查询参数
  const getQueryParams = useCallback(() => ({ ...store.query }), [store.query]);

  // 设置查询参数
  const setQueryParams = useCallback(
    (params: Record<string, unknown>) => {
      store.setQuery(params);
    },
    [store],
  );

  // 获取当前排序信息
  const getSorter = useCallback(
    () => (store.sorter.field ? { field: store.sorter.field, direction: store.sorter.order } : null),
    [store.sorter],
  );

  // 清除排序
  const clearSorter = useCallback(() => {
    store.setSorter(undefined, undefined);
  }, [store]);

  // 获取选中的行数据
  const getSelectedRows = useCallback(() => [...store.selectedRows], [store.selectedRows]);

  // 获取选中的行 keys
  const getSelectedRowKeys = useCallback(() => [...store.selectedRowKeys], [store.selectedRowKeys]);

  // 设置选中的行
  const setSelectedRows = useCallback(
    (keys: (string | number)[], rows: Record<string, unknown>[]) => {
      store.setSelectedRows(keys, rows as T[]);
    },
    [store],
  );

  // 清除选中
  const clearSelection = useCallback(() => {
    store.clearSelected();
  }, [store]);

  // 获取表格数据
  const getDataSource = useCallback(() => [...dataSource], [dataSource]);

  // 设置表格数据
  const setDataSource = useCallback(
    (data: Record<string, unknown>[]) => {
      store.setDataSource(data as T[]);
      store.setTotal(data.length);
      setLocalDataSource(data as T[]);
    },
    [store],
  );

  // 获取表格 loading 状态
  const getLoading = useCallback(() => store.loading, [store.loading]);

  // 展开所有行
  const expandAll = useCallback(() => {
    if (setExpandedRowKeys) {
      const allKeys = dataSource.map((record) => getRowKey(record));
      setExpandedRowKeys(allKeys);
    }
  }, [dataSource, getRowKey, setExpandedRowKeys]);

  // 收起所有行
  const collapseAll = useCallback(() => {
    if (setExpandedRowKeys) {
      setExpandedRowKeys([]);
    }
  }, [setExpandedRowKeys]);

  // 展开指定行
  const expandRow = useCallback(
    (rowKeyValue: string | number) => {
      if (setExpandedRowKeys && expandedRowKeys) {
        if (!expandedRowKeys.includes(rowKeyValue)) {
          setExpandedRowKeys([...expandedRowKeys, rowKeyValue]);
        }
      }
    },
    [expandedRowKeys, setExpandedRowKeys],
  );

  // 收起指定行
  const collapseRow = useCallback(
    (rowKeyValue: string | number) => {
      if (setExpandedRowKeys && expandedRowKeys) {
        setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKeyValue));
      }
    },
    [expandedRowKeys, setExpandedRowKeys],
  );

  // 构建实例
  const instance: ProTableInstance = {
    reload,
    refresh,
    reset,
    getPagination,
    setPagination,
    getQueryParams,
    setQueryParams,
    getSorter,
    clearSorter,
    getSelectedRows,
    getSelectedRowKeys,
    setSelectedRows,
    clearSelection,
    getDataSource,
    setDataSource,
    getLoading,
    expandAll,
    collapseAll,
    expandRow,
    collapseRow,
  };

  // 使用 useImperativeHandle 暴露实例方法
  useImperativeHandle(tableRef, () => instance);

  // 组合 bindingProps
  const bindingProps = useMemo<ProTableProps<T>>(
    () => ({
      columns: columns || [],
      dataSource,
      request,
      toolbar,
      search,
      rowSelection,
      batchOperation,
      pagination:
        propPagination === false
          ? false
          : {
              pageSize: defaultPageSize || 20,
              ...propPagination,
            },
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
    ],
  );

  return {
    tableRef,
    instance,
    bindingProps,
    dataSource,
    loading: store.loading,
    pagination: store.pagination,
    selectedRowKeys: store.selectedRowKeys,
    selectedRows: store.selectedRows,
    query: store.query,
  };
};

export default useProTable;
