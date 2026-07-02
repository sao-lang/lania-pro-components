import { describe, it, expect, vi } from 'vitest';
import { createDataStore, DataStoreImpl } from '../ProTable/store/DataStore';

interface Row {
  id: number;
  name: string;
}

describe('DataStore / 初始状态', () => {
  it('默认初始状态', () => {
    const store = createDataStore<Row>();
    const state = store.getState();
    expect(state.dataSource).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeUndefined();
    expect(state.total).toBe(0);
    expect(state.query).toEqual({});
    expect(state.pagination).toEqual({ current: 1, pageSize: 20 });
    expect(state.sorter).toEqual({});
    expect(state.filters).toEqual({});
    expect(state.selectedRowKeys).toEqual([]);
    expect(state.selectedRows).toEqual([]);
    expect(state.isPolling).toBe(false);
    expect(state.pollingInterval).toBeUndefined();
  });

  it('支持自定义初始数据 / 查询 / 分页', () => {
    const store = createDataStore<Row>({
      initialData: [{ id: 1, name: 'a' }],
      initialQuery: { keyword: 'x' },
      initialPagination: { current: 3, pageSize: 50 },
    });
    expect(store.dataSource).toEqual([{ id: 1, name: 'a' }]);
    expect(store.query).toEqual({ keyword: 'x' });
    expect(store.pagination).toEqual({ current: 3, pageSize: 50 });
  });

  it('createDataStore 返回 DataStoreImpl 实例', () => {
    const store = createDataStore();
    expect(store).toBeInstanceOf(DataStoreImpl);
  });
});

describe('DataStore / 数据操作', () => {
  it('setDataSource 更新数据并通知', () => {
    const store = createDataStore<Row>();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setDataSource([{ id: 1, name: 'a' }]);
    expect(store.dataSource).toEqual([{ id: 1, name: 'a' }]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('setLoading 更新 loading', () => {
    const store = createDataStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setLoading(true);
    expect(store.loading).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('setError 更新 error', () => {
    const store = createDataStore();
    const err = new Error('boom');
    store.setError(err);
    expect(store.error).toBe(err);
    store.setError(undefined);
    expect(store.error).toBeUndefined();
  });

  it('setTotal 更新 total', () => {
    const store = createDataStore();
    store.setTotal(100);
    expect(store.total).toBe(100);
  });
});

describe('DataStore / 查询操作', () => {
  it('setQuery 重置分页到第 1 页并清空选择', () => {
    const store = createDataStore<Row>({
      initialPagination: { current: 5, pageSize: 10 },
    });
    store.setSelectedRows([1], [{ id: 1, name: 'a' }]);
    store.setQuery({ keyword: 'test' });
    expect(store.query).toEqual({ keyword: 'test' });
    expect(store.pagination.current).toBe(1);
    expect(store.selectedRowKeys).toEqual([]);
    expect(store.selectedRows).toEqual([]);
  });

  it('setPage 仅更新 current，不影响 pageSize', () => {
    const store = createDataStore();
    store.setPage(7);
    expect(store.pagination).toEqual({ current: 7, pageSize: 20 });
  });

  it('setPageSize 重置 current=1 并清空选择', () => {
    const store = createDataStore<Row>({
      initialPagination: { current: 5, pageSize: 10 },
    });
    store.setSelectedRows([1], [{ id: 1, name: 'a' }]);
    store.setPageSize(50);
    expect(store.pagination).toEqual({ current: 1, pageSize: 50 });
    expect(store.selectedRowKeys).toEqual([]);
  });

  it('setSorter 更新 sorter 并重置分页', () => {
    const store = createDataStore({
      initialPagination: { current: 5, pageSize: 10 },
    });
    store.setSorter('name', 'ascend');
    expect(store.sorter).toEqual({ field: 'name', order: 'ascend' });
    expect(store.pagination.current).toBe(1);
  });

  it('setSorter 不传参数清空 sorter', () => {
    const store = createDataStore();
    store.setSorter('name', 'ascend');
    store.setSorter();
    expect(store.sorter).toEqual({});
  });

  it('setFilters 更新 filters 并重置分页', () => {
    const store = createDataStore({
      initialPagination: { current: 5, pageSize: 10 },
    });
    store.setFilters({ status: ['active'] });
    expect(store.filters).toEqual({ status: ['active'] });
    expect(store.pagination.current).toBe(1);
  });
});

describe('DataStore / 选择操作', () => {
  it('setSelectedRows 更新 keys 和 rows', () => {
    const store = createDataStore<Row>();
    store.setSelectedRows(
      [1, 2],
      [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ],
    );
    expect(store.selectedRowKeys).toEqual([1, 2]);
    expect(store.selectedRows).toHaveLength(2);
  });

  it('clearSelected 清空选择', () => {
    const store = createDataStore<Row>();
    store.setSelectedRows([1, 2], [{ id: 1, name: 'a' }]);
    store.clearSelected();
    expect(store.selectedRowKeys).toEqual([]);
    expect(store.selectedRows).toEqual([]);
  });
});

describe('DataStore / 轮询操作', () => {
  it('startPolling / stopPolling', () => {
    const store = createDataStore();
    store.startPolling();
    expect(store.isPolling).toBe(true);
    store.stopPolling();
    expect(store.isPolling).toBe(false);
    expect(store.pollingInterval).toBeUndefined();
  });

  it('setPolling 同时设置状态和间隔', () => {
    const store = createDataStore();
    store.setPolling(true, 5000);
    expect(store.isPolling).toBe(true);
    expect(store.pollingInterval).toBe(5000);
  });
});

describe('DataStore / reset', () => {
  it('reset 恢复到初始 query/pagination/sorter/filters/选择，但保留 dataSource', () => {
    const store = createDataStore<Row>({
      initialData: [{ id: 0, name: 'init' }],
      initialQuery: { keyword: 'init' },
      initialPagination: { current: 2, pageSize: 30 },
    });

    // 改动状态
    store.setDataSource([{ id: 1, name: 'a' }]);
    store.setQuery({ keyword: 'changed' });
    store.setPage(10);
    store.setSorter('name', 'descend');
    store.setFilters({ status: ['x'] });
    store.setSelectedRows([1], [{ id: 1, name: 'a' }]);
    store.setError(new Error('err'));

    store.reset();

    // 恢复到初始值
    expect(store.query).toEqual({ keyword: 'init' });
    expect(store.pagination).toEqual({ current: 2, pageSize: 30 });
    expect(store.sorter).toEqual({});
    expect(store.filters).toEqual({});
    expect(store.selectedRowKeys).toEqual([]);
    expect(store.selectedRows).toEqual([]);
    expect(store.error).toBeUndefined();
    // 注意：reset 不重置 dataSource（保持当前数据）
    expect(store.dataSource).toEqual([{ id: 1, name: 'a' }]);
  });

  it('reset 通知监听器', () => {
    const store = createDataStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.reset();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('DataStore / reload', () => {
  it('reload 派发 protable:reload 事件', () => {
    const store = createDataStore();
    const handler = vi.fn();
    window.addEventListener('protable:reload', handler);
    store.reload();
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('protable:reload', handler);
  });
});

describe('DataStore / subscribe', () => {
  it('返回取消订阅函数', () => {
    const store = createDataStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setLoading(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.setLoading(false);
    expect(listener).toHaveBeenCalledTimes(1); // 取消后不再收到通知
  });

  it('监听器接收 newState 和 prevState', () => {
    const store = createDataStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setLoading(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ loading: true }),
      expect.objectContaining({ loading: false }),
    );
  });
});

describe('DataStore / Getter 访问器', () => {
  it('所有 getter 与 getState() 字段一致', () => {
    const store = createDataStore<Row>({
      initialData: [{ id: 1, name: 'a' }],
      initialPagination: { current: 2, pageSize: 30 },
    });
    const state = store.getState();
    expect(store.dataSource).toBe(state.dataSource);
    expect(store.loading).toBe(state.loading);
    expect(store.total).toBe(state.total);
    expect(store.query).toBe(state.query);
    expect(store.pagination).toBe(state.pagination);
    expect(store.sorter).toBe(state.sorter);
    expect(store.filters).toBe(state.filters);
    expect(store.selectedRowKeys).toBe(state.selectedRowKeys);
    expect(store.selectedRows).toBe(state.selectedRows);
    expect(store.isPolling).toBe(state.isPolling);
    expect(store.pollingInterval).toBe(state.pollingInterval);
  });
});
