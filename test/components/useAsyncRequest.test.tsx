/**
 * useAsyncRequest 单元测试
 *
 * 覆盖：
 * - 基础行为（auto-execute / manual / execute / 拦截器 / 回调 / cancel）
 * - 防抖
 * - 轮询（基础 + silentPolling + race 修正）
 * - refreshDeps（含 ProTable 兼容验证）
 * - refresh
 * - reset
 * - 卸载清理
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncRequest } from '@lania-pro-components/shared';

/**
 * 辅助：记录 loading 变化历史
 * 在 render 阶段直接 push（非 useEffect），以捕获中间状态。
 * vitest 3 + React 19 的 act() 会批量刷新 effects，useEffect 可能跳过
 * setLoading(true)→setLoading(false) 的中间值。
 */
function createLoadingTracker() {
  const history: boolean[] = [];
  const track = (loading: boolean) => {
    if (history.length === 0 || history[history.length - 1] !== loading) {
      history.push(loading);
    }
  };
  return { history, track };
}

describe('useAsyncRequest / 基础行为', () => {
  it('manual=false + defaultParams 时自动触发首次请求', async () => {
    const request = vi.fn().mockResolvedValue({ data: [1, 2, 3] });
    const { result } = renderHook(() => useAsyncRequest({ request, defaultParams: { page: 1 } }));

    expect(request).toHaveBeenCalledWith({ page: 1 });
    expect(result.current.loading).toBe(true);

    // vitest 3 的 vi.waitFor 与 React 19 act 刷新不完全兼容，
    // 改用 setTimeout(0) 让 microtask 队列中的 request resolve 被刷新
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ data: [1, 2, 3] });
  });

  it('manual=true 时不自动触发', () => {
    const request = vi.fn();
    renderHook(() => useAsyncRequest({ request, manual: true }));
    expect(request).not.toHaveBeenCalled();
  });

  it('execute(params) 触发请求并返回 response', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true }));

    let res: unknown;
    await act(async () => {
      res = await result.current.execute({ q: 'x' });
    });

    expect(request).toHaveBeenCalledWith({ q: 'x' });
    expect(res).toBe('ok');
    expect(result.current.data).toBe('ok');
  });

  it('execute 失败时设置 error 并返回 undefined', async () => {
    const request = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true }));

    let res: unknown;
    await act(async () => {
      res = await result.current.execute({});
    });

    expect(res).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('boom');
    expect(result.current.loading).toBe(false);
  });

  it('onSuccess / onError 回调被正确调用', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result: r1 } = renderHook(() =>
      useAsyncRequest({
        request: vi.fn().mockResolvedValue('ok'),
        manual: true,
        onSuccess,
        onError,
      }),
    );
    await act(async () => {
      await r1.current.execute({});
    });
    expect(onSuccess).toHaveBeenCalledWith('ok', {});
    expect(onError).not.toHaveBeenCalled();

    const { result: r2 } = renderHook(() =>
      useAsyncRequest({
        request: vi.fn().mockRejectedValue(new Error('fail')),
        manual: true,
        onSuccess,
        onError,
      }),
    );
    await act(async () => {
      await r2.current.execute({});
    });
    expect(onError).toHaveBeenCalledWith(expect.any(Error), {});
  });

  it('beforeRequest / afterRequest 拦截器被调用', async () => {
    const beforeRequest = vi.fn((p: Record<string, unknown>): Record<string, unknown> => ({ ...p, modified: true }));
    const afterRequest = vi.fn((r: { data: number[] }): { data: number[]; wrapped: boolean } => ({
      ...r,
      wrapped: true,
    }));
    const request = vi.fn().mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true, beforeRequest, afterRequest }));

    await act(async () => {
      await result.current.execute({ page: 1 });
    });

    expect(beforeRequest).toHaveBeenCalledWith({ page: 1 });
    expect(request).toHaveBeenCalledWith({ page: 1, modified: true });
    expect(afterRequest).toHaveBeenCalledWith({ data: [] });
    expect(result.current.data).toEqual({ data: [], wrapped: true });
  });

  it('cancel 后不再 setData（aborted 路径）', async () => {
    let resolveReq!: (v: unknown) => void;
    const request = vi.fn().mockImplementation(
      () =>
        new Promise((r) => {
          resolveReq = r;
        }),
    );
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true }));

    act(() => {
      result.current.execute({});
    });
    act(() => {
      result.current.cancel();
    });
    await act(async () => {
      resolveReq('late');
    });

    expect(result.current.data).toBeUndefined();
  });
});

describe('useAsyncRequest / 防抖', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debouncedExecute 在 debounceTime 后触发 execute', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true, debounceTime: 300 }));

    act(() => {
      result.current.debouncedExecute({ a: 1 });
    });
    expect(request).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(request).toHaveBeenCalledWith({ a: 1 });
  });

  it('debouncedExecute 多次调用只触发最后一次', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true, debounceTime: 300 }));

    act(() => {
      result.current.debouncedExecute({ a: 1 });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.debouncedExecute({ a: 2 });
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({ a: 2 });
  });
});

describe('useAsyncRequest / 轮询与 silentPolling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('silentPolling=false（默认）：轮询触发时切换 loading', async () => {
    const tracker = createLoadingTracker();
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => {
      const r = useAsyncRequest({
        request,
        manual: true,
        pollingInterval: 1000,
      });
      tracker.track(r.loading);
      return r;
    });

    await act(async () => {
      await result.current.execute({});
    });
    tracker.history.length = 0;

    act(() => {
      result.current.startPolling();
    });
    // 拆分 act：同步部分刷新 setLoading(true)，异步部分刷新 setLoading(false)
    // vitest 3 的 await act(async) 会批量合并同一回调内的状态更新，跳过中间值
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(tracker.history).toContain(true);
  });

  it('silentPolling=true：轮询触发时不切换 loading', async () => {
    const tracker = createLoadingTracker();
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => {
      const r = useAsyncRequest({
        request,
        manual: true,
        pollingInterval: 1000,
        silentPolling: true,
      });
      tracker.track(r.loading);
      return r;
    });

    await act(async () => {
      await result.current.execute({});
    });
    tracker.history.length = 0;

    act(() => {
      result.current.startPolling();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(tracker.history).not.toContain(true);
  });

  it('silentPolling=true：轮询失败时仍 setError（错误感知）', async () => {
    const request = vi.fn().mockResolvedValueOnce('ok').mockRejectedValueOnce(new Error('polling fail'));
    const { result } = renderHook(() =>
      useAsyncRequest({
        request,
        manual: true,
        pollingInterval: 1000,
        silentPolling: true,
      }),
    );

    await act(async () => {
      await result.current.execute({});
    });
    expect(result.current.error).toBeUndefined();

    act(() => {
      result.current.startPolling();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('polling fail');
  });

  it('silentPolling=true：用户主动 execute 仍切 loading', async () => {
    const tracker = createLoadingTracker();
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => {
      const r = useAsyncRequest({
        request,
        manual: true,
        pollingInterval: 1000,
        silentPolling: true,
      });
      tracker.track(r.loading);
      return r;
    });

    // 拆分 act：同步部分刷新 setLoading(true)，异步部分刷新 setLoading(false)
    act(() => {
      result.current.execute({});
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(tracker.history).toContain(true);
  });

  it('silentPolling=true：轮询 in-flight 期间用户主动 execute 应切 loading（race 修正）', async () => {
    const tracker = createLoadingTracker();
    let resolvePolling!: (v: string) => void;
    const request = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockImplementationOnce(
        () =>
          new Promise<string>((r) => {
            resolvePolling = r;
          }),
      )
      .mockResolvedValueOnce('user');

    const { result } = renderHook(() => {
      const r = useAsyncRequest({
        request,
        manual: true,
        pollingInterval: 1000,
        silentPolling: true,
      });
      tracker.track(r.loading);
      return r;
    });

    // 初始 execute
    await act(async () => {
      await result.current.execute({});
    });
    tracker.history.length = 0;

    // 启动轮询，推进时间触发（request 挂起中）
    act(() => {
      result.current.startPolling();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(request).toHaveBeenCalledTimes(2);
    expect(tracker.history).not.toContain(true);

    // 用户主动 execute（轮询 in-flight 期间）
    // 拆分 act：同步部分刷新 setLoading(true)（验证 race 修正），异步部分刷新 setLoading(false)
    act(() => {
      result.current.execute({ user: true });
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(tracker.history).toContain(true);
    expect(request).toHaveBeenLastCalledWith({ user: true });

    // 清理：释放挂起的轮询请求 + 停止轮询
    act(() => {
      result.current.stopPolling();
    });
    await act(async () => {
      resolvePolling('late');
    });
  });

  it('stopPolling 停止后续轮询', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() =>
      useAsyncRequest({
        request,
        manual: true,
        pollingInterval: 1000,
      }),
    );

    await act(async () => {
      await result.current.execute({});
    });
    act(() => {
      result.current.startPolling();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(request).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.stopPolling();
    });
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(request).toHaveBeenCalledTimes(2);
  });
});

describe('useAsyncRequest / refreshDeps', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('refreshDeps=undefined 时不触发额外 execute', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { rerender } = renderHook(({ deps }) => useAsyncRequest({ request, manual: true, refreshDeps: deps }), {
      initialProps: { deps: undefined as unknown[] | undefined },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(request).not.toHaveBeenCalled();

    rerender({ deps: undefined });
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('refreshDeps 变化时用最近 params 重新 execute（跳过首次）', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { rerender } = renderHook(
      ({ filter }) =>
        useAsyncRequest({
          request,
          manual: false,
          defaultParams: { page: 1 },
          refreshDeps: [filter],
        }),
      { initialProps: { filter: 'a' } },
    );

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenLastCalledWith({ page: 1 });

    // refreshDeps 变化
    rerender({ filter: 'b' });
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(request).toHaveBeenCalledTimes(2);
    // 用 latestParamsRef（仍是 defaultParams { page: 1 }）
    expect(request).toHaveBeenLastCalledWith({ page: 1 });
  });

  it('refreshDeps 首次渲染不触发', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    renderHook(() => useAsyncRequest({ request, manual: true, refreshDeps: ['x'] }));

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('refreshDeps 变化但 latestParams 为 undefined 时不触发', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { rerender } = renderHook(({ filter }) => useAsyncRequest({ request, manual: true, refreshDeps: [filter] }), {
      initialProps: { filter: 'a' },
    });

    rerender({ filter: 'b' });
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('ProTable 兼容：不传 refreshDeps 完全不触发', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { rerender } = renderHook(() => useAsyncRequest({ request, manual: true }), {
      initialProps: { dummy: 1 },
    });

    rerender({ dummy: 2 });
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(request).not.toHaveBeenCalled();
  });
});

describe('useAsyncRequest / refresh', () => {
  it('未执行过 + 无 defaultParams 时返回 undefined 不抛错', async () => {
    const request = vi.fn();
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true }));

    let res: unknown;
    await act(async () => {
      res = await result.current.refresh();
    });
    expect(res).toBeUndefined();
    expect(request).not.toHaveBeenCalled();
  });

  it('有 defaultParams 但未执行过时 refresh 用 defaultParams', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true, defaultParams: { page: 1 } }));

    let res: unknown;
    await act(async () => {
      res = await result.current.refresh();
    });
    expect(request).toHaveBeenCalledWith({ page: 1 });
    expect(res).toBe('ok');
  });

  it('refresh 使用最近一次 execute 的 params', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true }));

    await act(async () => {
      await result.current.execute({ page: 5 });
    });
    await act(async () => {
      await result.current.refresh();
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenLastCalledWith({ page: 5 });
  });

  it('refresh 不受 silentPolling 影响（始终切 loading）', async () => {
    const tracker = createLoadingTracker();
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => {
      const r = useAsyncRequest({
        request,
        manual: true,
        silentPolling: true,
      });
      tracker.track(r.loading);
      return r;
    });

    await act(async () => {
      await result.current.execute({});
    });
    tracker.history.length = 0;

    // 拆分 act：同步部分刷新 setLoading(true)，异步部分刷新 setLoading(false)
    act(() => {
      result.current.refresh();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(tracker.history).toContain(true);
  });

  it('refresh 返回 Promise<TResponse | undefined>', async () => {
    const request = vi.fn().mockResolvedValue({ data: [1, 2, 3], total: 3 });
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true, defaultParams: {} }));

    let res: unknown;
    await act(async () => {
      res = await result.current.refresh();
    });
    expect(res).toEqual({ data: [1, 2, 3], total: 3 });
  });
});

describe('useAsyncRequest / reset', () => {
  it('reset 清空 data/loading/error 并取消请求', async () => {
    const request = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useAsyncRequest({ request, manual: true }));

    await act(async () => {
      await result.current.execute({});
    });
    expect(result.current.data).toBe('ok');

    act(() => {
      result.current.reset();
    });
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });
});

describe('useAsyncRequest / 卸载清理', () => {
  it('unmount 后不再 setState（mountedRef 守卫）', async () => {
    let resolveReq!: (v: unknown) => void;
    const request = vi.fn().mockImplementation(
      () =>
        new Promise((r) => {
          resolveReq = r;
        }),
    );
    const { result, unmount } = renderHook(() => useAsyncRequest({ request, manual: true }));

    act(() => {
      result.current.execute({});
    });
    unmount();
    // 卸载后释放请求，不应抛 "setState on unmounted" 警告
    await act(async () => {
      resolveReq('late');
    });
    // 无显式断言，只要不抛警告即可
  });
});
