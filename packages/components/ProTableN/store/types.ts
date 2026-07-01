/**
 * DataStore 状态类型
 */
export interface DataStoreState<T = unknown> {
  // 数据状态
  dataSource: T[];
  loading: boolean;
  error?: Error;
  total: number;

  // 查询状态
  query: Record<string, unknown>;
  pagination: {
    current: number;
    pageSize: number;
  };
  sorter: {
    field?: string;
    order?: 'ascend' | 'descend';
  };
  filters: Record<string, string[]>;

  // 选择状态
  selectedRowKeys: (string | number)[];
  selectedRows: T[];

  // 轮询状态
  isPolling: boolean;
  pollingInterval?: number;
}

/**
 * DataStore 操作类型
 */
export interface DataStoreActions<T = unknown> {
  // 数据操作
  setDataSource: (data: T[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: Error) => void;
  setTotal: (total: number) => void;

  // 查询操作
  setQuery: (query: Record<string, unknown>) => void;
  setPage: (current: number) => void;
  setPageSize: (pageSize: number) => void;
  setSorter: (field?: string, order?: 'ascend' | 'descend') => void;
  setFilters: (filters: Record<string, string[]>) => void;

  // 选择操作
  setSelectedRows: (keys: (string | number)[], rows: T[]) => void;
  clearSelected: () => void;

  // 轮询操作
  setPolling: (isPolling: boolean, interval?: number) => void;
  startPolling: () => void;
  stopPolling: () => void;

  // 批量操作
  reload: () => void;
  reset: () => void;
}

/**
 * 完整 Store 类型
 */
export type DataStore<T = unknown> = DataStoreState<T> & DataStoreActions<T>;

/**
 * 创建 Store 的选项
 */
export interface CreateDataStoreOptions<T = unknown> {
  initialData?: T[];
  initialQuery?: Record<string, unknown>;
  initialPagination?: { current: number; pageSize: number };
}
