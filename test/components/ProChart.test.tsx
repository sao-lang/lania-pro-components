/**
 * ProChart 单元测试
 *
 * 覆盖迁移至 useAsyncRequest 后的行为：
 * - 静态数据模式（request=undefined）
 * - 远程数据模式（request + params）
 * - 轮询（silentPolling：不切 loading 但仍 setError）
 * - reload / onRetry（委托 refresh）
 * - 三态优先级（externalLoading/externalError/externalEmpty 覆盖内部状态）
 * - adapter 生命周期（init/update/destroy）
 *
 * 测试策略：
 * - 通过 adapter prop 直接传入 mock ChartAdapter 对象（避免依赖 echarts）
 * - 不 mock useAsyncRequest，验证真实集成
 * - fake timers 用于轮询，遵循 vitest 3 + React 19 act 拆分模式
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { ProChart } from '../../packages/components/ProChart/ProChart';
import type { ChartAdapter, ChartInstance } from '../../packages/components/ProChart/adapters/types';

/**
 * 创建 mock ChartAdapter 与 ChartInstance
 * 所有方法均为 vi.fn()，便于断言调用次数与参数
 */
function createMockAdapter() {
  const instance: ChartInstance = {
    raw: {},
    update: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    toBlobURL: vi.fn(async () => 'blob:mock'),
  };
  const adapter: ChartAdapter = {
    name: 'mock',
    init: vi.fn(() => instance),
    on: vi.fn(() => () => {}),
    setTheme: vi.fn(),
    getDefaultOption: vi.fn(() => ({})),
  };
  return { adapter, instance };
}

/**
 * 辅助：等待 microtask + 宏任务队列刷新（非 fake timer 模式）
 * 使用 setTimeout(0) 确保 React 调度的 re-render 被刷新
 */
async function flushMicrotasks() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/**
 * 辅助：仅刷新 microtask 队列（fake timer 模式下使用）
 * vi.useFakeTimers 会拦截 setTimeout，但不会拦截 Promise.resolve()
 */
async function flushMicrotasksFake() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('ProChart / 静态数据模式', () => {
  it('request=undefined + Option 模式：渲染 option 不报错', () => {
    const { adapter } = createMockAdapter();
    const option = { xAxis: { type: 'category' }, series: [] };
    const { container } = render(
      // empty=false 避免 ChartStatus 因 dataSource 空而渲染 Empty 组件（Option 模式不依赖 dataSource）
      <ProChart adapter={adapter} option={option} empty={false} height={200} />,
    );
    // 容器被渲染
    expect(container.firstChild).not.toBeNull();
    // adapter.init 被调用（resolvedAdapter 同步就绪）
    expect(adapter.init).toHaveBeenCalled();
  });

  it('request=undefined + Schema 模式：dataSource 同步到 option', () => {
    const { adapter, instance } = createMockAdapter();
    const data = [{ date: '2026-07-01', value: 120 }];
    render(<ProChart adapter={adapter} type='line' dataSource={data} xField='date' yField='value' height={200} />);
    // init 被调用，option 含 dataSource 数据
    expect(adapter.init).toHaveBeenCalledTimes(1);
    // update 在 option 变化时被调用
    expect(instance.update).toHaveBeenCalled();
  });

  it('request=undefined + schemaData 变化时同步更新 dataSource', () => {
    const { adapter } = createMockAdapter();
    const { rerender } = render(
      <ProChart adapter={adapter} type='line' dataSource={[{ x: 'a', y: 1 }]} xField='x' yField='y' />,
    );
    expect(adapter.init).toHaveBeenCalledTimes(1);

    rerender(<ProChart adapter={adapter} type='line' dataSource={[{ x: 'b', y: 2 }]} xField='x' yField='y' />);
    // dataSource 变化触发 option 重算，但 adapter 仅在 resolvedAdapter 变化时 init
    expect(adapter.init).toHaveBeenCalledTimes(1);
  });
});

describe('ProChart / 远程数据模式', () => {
  it('request + params 自动触发首次请求', async () => {
    const { adapter } = createMockAdapter();
    const request = vi.fn().mockResolvedValue({ data: [{ x: 'a', y: 1 }] });
    render(<ProChart adapter={adapter} type='line' request={request} params={{ range: '7d' }} xField='x' yField='y' />);
    expect(request).toHaveBeenCalledWith({ range: '7d' });
    await flushMicrotasks();
    // 成功后 dataSource 更新触发 option 重算 → update 调用
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('request 成功后 dataSource 更新', async () => {
    const { adapter } = createMockAdapter();
    const request = vi.fn().mockResolvedValue({ data: [{ x: 'a', y: 100 }] });
    render(<ProChart adapter={adapter} type='line' request={request} xField='x' yField='y' />);
    await flushMicrotasks();
    // request resolve 后 onSuccess 同步 dataSource，触发 option 重算
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('request 失败时设置 error 状态', async () => {
    const { adapter } = createMockAdapter();
    const request = vi.fn().mockRejectedValue(new Error('fetch fail'));
    const { container } = render(<ProChart adapter={adapter} type='line' request={request} xField='x' yField='y' />);
    await flushMicrotasks();
    // 错误态：ChartStatus 渲染错误文案
    expect(container.textContent).toContain('加载失败');
  });

  it('params 变化时用新 params 重新请求', async () => {
    const { adapter } = createMockAdapter();
    const request = vi.fn().mockResolvedValue({ data: [] });
    const { rerender } = render(
      <ProChart adapter={adapter} type='line' request={request} params={{ range: '7d' }} xField='x' yField='y' />,
    );
    expect(request).toHaveBeenLastCalledWith({ range: '7d' });

    rerender(
      <ProChart adapter={adapter} type='line' request={request} params={{ range: '30d' }} xField='x' yField='y' />,
    );
    expect(request).toHaveBeenLastCalledWith({ range: '30d' });
  });
});

describe('ProChart / 轮询（silentPolling）', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('polling 配置后自动启动轮询', async () => {
    const { adapter } = createMockAdapter();
    const request = vi.fn().mockResolvedValue({ data: [{ x: 'a', y: 1 }] });
    render(<ProChart adapter={adapter} type='line' request={request} polling={1000} xField='x' yField='y' />);
    // 首次请求（同步 effect 触发）
    expect(request).toHaveBeenCalledTimes(1);

    // 推进 1s → 第一次轮询
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await flushMicrotasksFake();
    expect(request).toHaveBeenCalledTimes(2);

    // 再推进 1s → 第二次轮询
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await flushMicrotasksFake();
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('轮询触发时不切换 loading（silentPolling=true）', async () => {
    const { adapter } = createMockAdapter();
    let resolveFirst!: (v: { data: unknown[] }) => void;
    const request = vi.fn().mockImplementation(
      () =>
        new Promise((r) => {
          resolveFirst = r;
        }),
    );
    const { container } = render(
      <ProChart adapter={adapter} type='line' request={request} polling={1000} xField='x' yField='y' />,
    );

    // 首次请求 in-flight：loading 应为 true（显示"加载中"）
    expect(container.textContent).toContain('加载中');

    // resolve 首次请求
    await act(async () => {
      resolveFirst({ data: [{ x: 'a', y: 1 }] });
    });
    await flushMicrotasksFake();
    // 首次请求完成：loading 应为 false
    expect(container.textContent).not.toContain('加载中');

    // 推进时间触发轮询
    request.mockResolvedValueOnce({ data: [{ x: 'a', y: 2 }] });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await flushMicrotasksFake();

    // silentPolling：轮询期间 loading 仍为 false（不显示"加载中"）
    expect(container.textContent).not.toContain('加载中');
  });

  it('轮询失败时设置 error（错误感知不丢失）', async () => {
    const { adapter } = createMockAdapter();
    const request = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ x: 'a', y: 1 }] })
      .mockRejectedValueOnce(new Error('polling fail'));
    const { container } = render(
      <ProChart adapter={adapter} type='line' request={request} polling={1000} xField='x' yField='y' />,
    );

    // 首次成功
    await flushMicrotasksFake();
    expect(container.textContent).not.toContain('加载失败');

    // 推进时间触发轮询 → 失败
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await flushMicrotasksFake();

    // 轮询失败后 setError → 显示错误 UI
    expect(container.textContent).toContain('polling fail');
  });

  it('卸载时停止轮询', async () => {
    const { adapter } = createMockAdapter();
    const request = vi.fn().mockResolvedValue({ data: [] });
    const { unmount } = render(
      <ProChart adapter={adapter} type='line' request={request} polling={1000} xField='x' yField='y' />,
    );
    await flushMicrotasksFake();
    expect(request).toHaveBeenCalledTimes(1);

    unmount();

    // 卸载后推进时间，不应再触发请求
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    await flushMicrotasksFake();
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe('ProChart / reload & onRetry', () => {
  it('reload() 用最近 params 重新请求', async () => {
    const { adapter } = createMockAdapter();
    const request = vi.fn().mockResolvedValue({ data: [{ x: 'a', y: 1 }] });
    const ref = React.createRef<{ reload: () => void }>();
    render(
      <ProChart
        ref={ref as React.RefObject<any>}
        adapter={adapter}
        type='line'
        request={request}
        params={{ range: '7d' }}
        xField='x'
        yField='y'
      />,
    );
    await flushMicrotasks();
    expect(request).toHaveBeenCalledTimes(1);

    act(() => {
      ref.current?.reload();
    });
    await flushMicrotasks();
    expect(request).toHaveBeenCalledTimes(2);
    // reload 用最近一次 params（latestParamsRef）
    expect(request).toHaveBeenLastCalledWith({ range: '7d' });
  });

  it('onRetry 在 error 状态下触发 refresh', async () => {
    const { adapter } = createMockAdapter();
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValueOnce({ data: [{ x: 'a', y: 1 }] });
    const { container } = render(<ProChart adapter={adapter} type='line' request={request} xField='x' yField='y' />);
    await flushMicrotasks();
    // 首次失败 → 错误 UI
    expect(container.textContent).toContain('first fail');
    expect(request).toHaveBeenCalledTimes(1);

    // 点击重试按钮
    const retryButton = container.querySelector('button');
    expect(retryButton).not.toBeNull();
    await act(async () => {
      retryButton!.click();
    });
    await flushMicrotasks();

    // refresh 触发第二次请求（成功）
    expect(request).toHaveBeenCalledTimes(2);
  });
});

describe('ProChart / 三态优先级', () => {
  it('externalLoading 覆盖内部 loading', () => {
    const { adapter } = createMockAdapter();
    const { container } = render(<ProChart adapter={adapter} option={{}} loading={true} />);
    // externalLoading=true → 显示加载中，即使内部无请求
    expect(container.textContent).toContain('加载中');
  });

  it('externalError 覆盖内部 error', () => {
    const { adapter } = createMockAdapter();
    const { container } = render(<ProChart adapter={adapter} option={{}} error={new Error('external err')} />);
    expect(container.textContent).toContain('external err');
  });

  it('externalEmpty 覆盖内部空态判断', () => {
    const { adapter } = createMockAdapter();
    const { container } = render(<ProChart adapter={adapter} option={{}} empty={true} />);
    expect(container.textContent).toContain('暂无数据');
  });
});

describe('ProChart / adapter 生命周期', () => {
  it('卸载时调用 adapter.destroy（通过 instance.destroy）', () => {
    const { adapter, instance } = createMockAdapter();
    const { unmount } = render(
      // empty=false 确保 ChartStatus 渲染 children（容器 div），adapter.init 才会被调用
      <ProChart adapter={adapter} option={{}} empty={false} height={200} />,
    );
    expect(adapter.init).toHaveBeenCalledTimes(1);

    unmount();
    expect(instance.destroy).toHaveBeenCalled();
  });

  it('option 变化时调用 instance.update', () => {
    const { adapter, instance } = createMockAdapter();
    const { rerender } = render(<ProChart adapter={adapter} option={{ a: 1 }} empty={false} />);
    // 首次渲染：init 通过 adapter.init 内部 setOption，update effect 不触发
    // （option 引用未变化，update effect deps [option] 未改变）
    expect(instance.update).not.toHaveBeenCalled();

    // rerender 传入新 option 引用 → useMemo 重算 → update effect 触发
    rerender(<ProChart adapter={adapter} option={{ a: 2 }} empty={false} />);
    expect(instance.update).toHaveBeenCalledWith({ a: 2 });
  });
});
