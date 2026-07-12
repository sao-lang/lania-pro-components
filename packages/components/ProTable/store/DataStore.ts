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
 *
 * === 架构债务修复 #1 / #7 ===
 * reload() 不再使用 window.dispatchEvent('protable:reload') 全局广播，
 * 改为通过 onReload/offReload 注册实例级回调，消除多实例冲突和全局耦合。
 */
class DataStoreImpl<T = unknown> implements DataStoreState<T>, DataStoreActions<T> {
  /** 底层 Store 实例 */
  private store: Store<DataStoreState<T>>;

  /** reload 回调注册表（替代 window.dispatchEvent 全局广播） */
  private reloadCallbacks = new Set<() => void>();

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
      expandedRowKeys: [],
      expandedRows: [],
      isPolling: false,
      pollingInterval: undefined,
    });
  }

  /**
   * 注册 reload 回调（替代 window.addEventListener('protable:reload')）
   * 返回取消注册函数，便于 useEffect 清理
   */
  onReload(callback: () => void): () => void {
    this.reloadCallbacks.add(callback);
    return () => this.reloadCallbacks.delete(callback);
  }

  /**
   * 取消注册 reload 回调
   */
  offReload(callback: () => void): void {
    this.reloadCallbacks.delete(callback);
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

  // ==================== 展开操作 ====================

  setExpandedRows(keys: (string | number)[], rows: T[]): void {
    this.store.setState({ expandedRowKeys: keys, expandedRows: rows });
  }

  clearExpanded(): void {
    this.store.setState({ expandedRowKeys: [], expandedRows: [] });
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
    // 遍历所有注册的 reload 回调（替代 window.dispatchEvent 全局广播）
    this.reloadCallbacks.forEach((cb) => cb());
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

  get expandedRowKeys(): (string | number)[] {
    return this.store.getState().expandedRowKeys;
  }

  get expandedRows(): T[] {
    return this.store.getState().expandedRows;
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
