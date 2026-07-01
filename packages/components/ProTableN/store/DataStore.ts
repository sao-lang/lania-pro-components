/* eslint-disable @typescript-eslint/naming-convention */
import type { DataStoreState, DataStoreActions, CreateDataStoreOptions } from './types';

/**
 * 监听器类型
 */
type StateChangeListener<T> = (state: DataStoreState<T>, prevState: DataStoreState<T>) => void;

/**
 * DataStore 类
 * 基于原生 Proxy 实现响应式状态管理，不依赖外部库
 */
class DataStoreImpl<T = unknown> implements DataStoreState<T>, DataStoreActions<T> {
  // 内部状态
  private _state: DataStoreState<T>;
  private _listeners: Set<StateChangeListener<T>> = new Set();
  private _initialState: Partial<DataStoreState<T>>;

  // 初始状态引用（用于 reset）
  private _initialData: T[];
  private _initialQuery: Record<string, unknown>;
  private _initialPagination: { current: number; pageSize: number };

  constructor(options: CreateDataStoreOptions<T> = {}) {
    const { initialData = [], initialQuery = {}, initialPagination = { current: 1, pageSize: 20 } } = options;

    this._initialData = initialData;
    this._initialQuery = initialQuery;
    this._initialPagination = initialPagination;

    this._state = {
      dataSource: initialData,
      loading: false,
      error: undefined,
      total: 0,
      query: initialQuery,
      pagination: initialPagination,
      sorter: {},
      filters: {},
      selectedRowKeys: [],
      selectedRows: [],
      isPolling: false,
      pollingInterval: undefined,
    };

    this._initialState = { ...this._state };
  }

  /**
   * 通知所有监听器
   */
  private _notify<K extends keyof DataStoreState<T>>(key: K, prevValue: DataStoreState<T>[K]) {
    const prevState: DataStoreState<T> = { ...this._state, [key]: prevValue };
    this._listeners.forEach((listener) => listener(this._state, prevState));
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: StateChangeListener<T>): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * 获取当前状态
   */
  getState(): DataStoreState<T> {
    return this._state;
  }

  // ==================== 数据操作 ====================

  setDataSource(data: T[]): void {
    const prev = this._state.dataSource;
    this._state.dataSource = data;
    this._notify('dataSource', prev);
  }

  setLoading(loading: boolean): void {
    const prev = this._state.loading;
    this._state.loading = loading;
    this._notify('loading', prev);
  }

  setError(error?: Error): void {
    const prev = this._state.error;
    this._state.error = error;
    this._notify('error', prev);
  }

  setTotal(total: number): void {
    const prev = this._state.total;
    this._state.total = total;
    this._notify('total', prev);
  }

  // ==================== 查询操作 ====================

  setQuery(query: Record<string, unknown>): void {
    const prevQuery = this._state.query;
    const prevPagination = this._state.pagination;
    const prevSelectedRowKeys = this._state.selectedRowKeys;
    const prevSelectedRows = this._state.selectedRows;

    this._state.query = query;
    this._state.pagination = { ...prevPagination, current: 1 };
    this._state.selectedRowKeys = [];
    this._state.selectedRows = [];

    this._notify('query', prevQuery);
    this._notify('pagination', prevPagination);
    this._notify('selectedRowKeys', prevSelectedRowKeys);
    this._notify('selectedRows', prevSelectedRows);
  }

  setPage(current: number): void {
    const prev = this._state.pagination;
    this._state.pagination = { ...prev, current };
    this._notify('pagination', prev);
  }

  setPageSize(pageSize: number): void {
    const prevPagination = this._state.pagination;
    const prevSelectedRowKeys = this._state.selectedRowKeys;
    const prevSelectedRows = this._state.selectedRows;

    this._state.pagination = { current: 1, pageSize };
    this._state.selectedRowKeys = [];
    this._state.selectedRows = [];

    this._notify('pagination', prevPagination);
    this._notify('selectedRowKeys', prevSelectedRowKeys);
    this._notify('selectedRows', prevSelectedRows);
  }

  setSorter(field?: string, order?: 'ascend' | 'descend'): void {
    const prev = this._state.sorter;
    const prevPagination = this._state.pagination;

    this._state.sorter = { field, order };
    this._state.pagination = { ...prevPagination, current: 1 };

    this._notify('sorter', prev);
    this._notify('pagination', prevPagination);
  }

  setFilters(filters: Record<string, string[]>): void {
    const prev = this._state.filters;
    const prevPagination = this._state.pagination;

    this._state.filters = filters;
    this._state.pagination = { ...prevPagination, current: 1 };

    this._notify('filters', prev);
    this._notify('pagination', prevPagination);
  }

  // ==================== 选择操作 ====================

  setSelectedRows(keys: (string | number)[], rows: T[]): void {
    const prevKeys = this._state.selectedRowKeys;
    const prevRows = this._state.selectedRows;

    this._state.selectedRowKeys = keys;
    this._state.selectedRows = rows;

    this._notify('selectedRowKeys', prevKeys);
    this._notify('selectedRows', prevRows);
  }

  clearSelected(): void {
    const prevKeys = this._state.selectedRowKeys;
    const prevRows = this._state.selectedRows;

    this._state.selectedRowKeys = [];
    this._state.selectedRows = [];

    this._notify('selectedRowKeys', prevKeys);
    this._notify('selectedRows', prevRows);
  }

  // ==================== 轮询操作 ====================

  setPolling(isPolling: boolean, interval?: number): void {
    const prevIsPolling = this._state.isPolling;
    const prevInterval = this._state.pollingInterval;

    this._state.isPolling = isPolling;
    this._state.pollingInterval = interval;

    this._notify('isPolling', prevIsPolling);
    this._notify('pollingInterval', prevInterval);
  }

  startPolling(): void {
    const prev = this._state.isPolling;
    this._state.isPolling = true;
    this._notify('isPolling', prev);
  }

  stopPolling(): void {
    const prevIsPolling = this._state.isPolling;
    const prevInterval = this._state.pollingInterval;

    this._state.isPolling = false;
    this._state.pollingInterval = undefined;

    this._notify('isPolling', prevIsPolling);
    this._notify('pollingInterval', prevInterval);
  }

  // ==================== 批量操作 ====================

  reload(): void {
    // 触发重新加载事件，由外部监听并执行
    const event = new CustomEvent('protable:reload', { detail: this._state });
    window.dispatchEvent(event);
  }

  reset(): void {
    const prevState = { ...this._state };

    this._state.query = this._initialQuery;
    this._state.pagination = this._initialPagination;
    this._state.sorter = {};
    this._state.filters = {};
    this._state.selectedRowKeys = [];
    this._state.selectedRows = [];
    this._state.error = undefined;

    // 通知所有变化
    this._listeners.forEach((listener) => listener(this._state, prevState));
  }

  // ==================== Getter 访问器 ====================

  get dataSource(): T[] {
    return this._state.dataSource;
  }

  get loading(): boolean {
    return this._state.loading;
  }

  get error(): Error | undefined {
    return this._state.error;
  }

  get total(): number {
    return this._state.total;
  }

  get query(): Record<string, unknown> {
    return this._state.query;
  }

  get pagination(): { current: number; pageSize: number } {
    return this._state.pagination;
  }

  get sorter(): { field?: string; order?: 'ascend' | 'descend' } {
    return this._state.sorter;
  }

  get filters(): Record<string, string[]> {
    return this._state.filters;
  }

  get selectedRowKeys(): (string | number)[] {
    return this._state.selectedRowKeys;
  }

  get selectedRows(): T[] {
    return this._state.selectedRows;
  }

  get isPolling(): boolean {
    return this._state.isPolling;
  }

  get pollingInterval(): number | undefined {
    return this._state.pollingInterval;
  }
}

/**
 * 创建 DataStore 实例
 */
export function createDataStore<T = unknown>(options?: CreateDataStoreOptions<T>): DataStoreImpl<T> {
  return new DataStoreImpl<T>(options);
}

export type { DataStoreImpl as DataStoreType };
export { DataStoreImpl };
