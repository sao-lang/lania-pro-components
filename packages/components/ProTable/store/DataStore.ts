/**
 * 数据存储（DataStore）
 *
 * ProTable 的核心数据管理层，底层使用 @lania-pro-components/utils 的 createStore
 * 作为状态容器，外部接口保持不变。
 */

/* eslint-disable @typescript-eslint/naming-convention */
import { createStore } from '@lania-pro-components/utils';
import type { Store } from '@lania-pro-components/utils';
import type { DataStoreState, DataStoreActions, CreateDataStoreOptions } from './types';

/**
 * 监听器类型
 */
type StateChangeListener<T> = (state: DataStoreState<T>, prevState: DataStoreState<T>) => void;

/**
 * DataStore 类
 * 基于 createStore 实现状态管理
 */
class DataStoreImpl<T = unknown> implements DataStoreState<T>, DataStoreActions<T> {
  /** 底层 Store 实例 */
  private store: Store<DataStoreState<T>>;

  /** 初始值（用于 reset） */
  private _initialData: T[];
  private _initialQuery: Record<string, unknown>;
  private _initialPagination: { current: number; pageSize: number };

  constructor(options: CreateDataStoreOptions<T> = {}) {
    const { initialData = [], initialQuery = {}, initialPagination = { current: 1, pageSize: 20 } } = options;

    this._initialData = initialData;
    this._initialQuery = initialQuery;
    this._initialPagination = initialPagination;

    this.store = createStore<DataStoreState<T>>({
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
    });
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: StateChangeListener<T>): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * 获取当前状态
   */
  getState(): DataStoreState<T> {
    return this.store.getState();
  }

  // ==================== 数据操作 ====================

  setDataSource(data: T[]): void {
    this.store.setState({ dataSource: data });
  }

  setLoading(loading: boolean): void {
    this.store.setState({ loading });
  }

  setError(error?: Error): void {
    this.store.setState({ error });
  }

  setTotal(total: number): void {
    this.store.setState({ total });
  }

  // ==================== 查询操作 ====================

  setQuery(query: Record<string, unknown>): void {
    this.store.setState({
      query,
      pagination: { current: 1, pageSize: this.store.getState().pagination.pageSize },
      selectedRowKeys: [],
      selectedRows: [],
    });
  }

  setPage(current: number): void {
    this.store.setState((prev) => ({ pagination: { ...prev.pagination, current } }));
  }

  setPageSize(pageSize: number): void {
    this.store.setState({
      pagination: { current: 1, pageSize },
      selectedRowKeys: [],
      selectedRows: [],
    });
  }

  setSorter(field?: string, order?: 'ascend' | 'descend'): void {
    this.store.setState((prev) => ({
      sorter: { field, order },
      pagination: { ...prev.pagination, current: 1 },
    }));
  }

  setFilters(filters: Record<string, string[]>): void {
    this.store.setState((prev) => ({
      filters,
      pagination: { ...prev.pagination, current: 1 },
    }));
  }

  // ==================== 选择操作 ====================

  setSelectedRows(keys: (string | number)[], rows: T[]): void {
    this.store.setState({ selectedRowKeys: keys, selectedRows: rows });
  }

  clearSelected(): void {
    this.store.setState({ selectedRowKeys: [], selectedRows: [] });
  }

  // ==================== 轮询操作 ====================

  setPolling(isPolling: boolean, interval?: number): void {
    this.store.setState({ isPolling, pollingInterval: interval });
  }

  startPolling(): void {
    this.store.setState({ isPolling: true });
  }

  stopPolling(): void {
    this.store.setState({ isPolling: false, pollingInterval: undefined });
  }

  // ==================== 批量操作 ====================

  reload(): void {
    const event = new CustomEvent('protable:reload', { detail: this.store.getState() });
    window.dispatchEvent(event);
  }

  reset(): void {
    this.store.reset();
  }

  // ==================== Getter 访问器 ====================

  get dataSource(): T[] {
    return this.store.getState().dataSource;
  }

  get loading(): boolean {
    return this.store.getState().loading;
  }

  get error(): Error | undefined {
    return this.store.getState().error;
  }

  get total(): number {
    return this.store.getState().total;
  }

  get query(): Record<string, unknown> {
    return this.store.getState().query;
  }

  get pagination(): { current: number; pageSize: number } {
    return this.store.getState().pagination;
  }

  get sorter(): { field?: string; order?: 'ascend' | 'descend' } {
    return this.store.getState().sorter;
  }

  get filters(): Record<string, string[]> {
    return this.store.getState().filters;
  }

  get selectedRowKeys(): (string | number)[] {
    return this.store.getState().selectedRowKeys;
  }

  get selectedRows(): T[] {
    return this.store.getState().selectedRows;
  }

  get isPolling(): boolean {
    return this.store.getState().isPolling;
  }

  get pollingInterval(): number | undefined {
    return this.store.getState().pollingInterval;
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
