import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';

// ===== mock ProDialog 模块（避免实际渲染弹窗）=====
// ProDialog 既是一个组件，又挂载了 form/confirm/message 等静态方法
const { ProDialog: MockedProDialog } = vi.hoisted(() => {
  const Comp = (() => null) as unknown as React.ComponentType<Record<string, unknown>> & {
    form: ReturnType<typeof vi.fn>;
    confirm: ReturnType<typeof vi.fn>;
    open: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    message: Record<string, ReturnType<typeof vi.fn>>;
    notify: Record<string, ReturnType<typeof vi.fn>>;
  };
  Comp.form = vi.fn();
  Comp.confirm = vi.fn();
  Comp.open = vi.fn();
  Comp.info = vi.fn();
  Comp.success = vi.fn();
  Comp.warning = vi.fn();
  Comp.error = vi.fn();
  Comp.message = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
  };
  Comp.notify = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };
  return { ProDialog: Comp };
});

vi.mock('../ProDialog', () => ({
  ProDialog: MockedProDialog,
}));

import { AddButton } from '../ActionButton/AddButton';
import { DeleteButton } from '../ActionButton/DeleteButton';
import { JumpButton } from '../ActionButton/JumpButton';
import { BatchButton } from '../ActionButton/BatchButton';
import { ExportButton } from '../ActionButton/ExportButton';
import { ViewButton } from '../ActionButton/ViewButton';
import { EditButton } from '../ActionButton/EditButton';
import { ImportButton } from '../ActionButton/ImportButton';

describe('ActionButton / 公共行为', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('所有按钮 visible=false 时不渲染', () => {
    const { rerender } = render(<AddButton visible={false} schemas={[]} onSubmit={() => true} />);
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<DeleteButton visible={false} onDelete={() => true} />);
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<JumpButton visible={false} to='/x' />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

/**
 * AddButton 测试
 */
describe('AddButton', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it('默认渲染：text="新增"、type="primary"', () => {
    render(<AddButton schemas={[]} onSubmit={() => true} />);
    const btn = screen.getByRole('button', { name: /新增/ });
    expect(btn).toBeInTheDocument();
    // Arco primary button 包含 arco-btn-primary class
    expect(btn.className).toContain('primary');
  });

  it('支持自定义 text', () => {
    render(<AddButton text='新增用户' schemas={[]} onSubmit={() => true} />);
    expect(screen.getByRole('button', { name: /新增用户/ })).toBeInTheDocument();
  });

  it('点击触发 onClick 后再打开 ProDialog.form（附加而非覆盖）', async () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <AddButton schemas={[{ name: 'x', label: 'X', component: 'Input' }]} onSubmit={onSubmit} onClick={onClick} />,
    );
    await user.click(screen.getByRole('button'));

    // 用户 onClick 被调用（附加语义）
    expect(onClick).toHaveBeenCalledTimes(1);
    // 内置交互也被触发（没有被覆盖）
    expect(MockedProDialog.form).toHaveBeenCalledTimes(1);
    // onSubmit 此时不应被调用（需要用户在弹窗中提交）
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('ProDialog.form 接收 title/schemas/initialValues/formProps 配置', async () => {
    const schemas = [{ name: 'name', label: '姓名', component: 'Input' as const }];
    render(
      <AddButton
        title='自定义标题'
        width={800}
        schemas={schemas}
        initialValues={{ name: 'default' }}
        onSubmit={() => true}
      />,
    );
    await user.click(screen.getByRole('button'));

    expect(MockedProDialog.form).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '自定义标题',
        width: 800,
        schemas,
        initialValues: { name: 'default' },
      }),
    );
  });

  it('onBeforeOpen 返回 false 时不打开弹窗', async () => {
    const onBeforeOpen = vi.fn().mockResolvedValue(false);
    render(<AddButton schemas={[]} onSubmit={() => true} onBeforeOpen={onBeforeOpen} />);
    await user.click(screen.getByRole('button'));

    expect(onBeforeOpen).toHaveBeenCalledTimes(1);
    expect(MockedProDialog.form).not.toHaveBeenCalled();
  });

  it('onBeforeOpen 返回 true 时正常打开弹窗', async () => {
    const onBeforeOpen = vi.fn().mockResolvedValue(true);
    render(<AddButton schemas={[]} onSubmit={() => true} onBeforeOpen={onBeforeOpen} />);
    await user.click(screen.getByRole('button'));

    expect(onBeforeOpen).toHaveBeenCalledTimes(1);
    expect(MockedProDialog.form).toHaveBeenCalledTimes(1);
  });

  it('ref 暴露 open 方法可手动触发', async () => {
    const ref = React.createRef<{ open: () => void }>();
    render(<AddButton ref={ref} schemas={[]} onSubmit={() => true} />);
    expect(typeof ref.current?.open).toBe('function');
    ref.current?.open();
    expect(MockedProDialog.form).toHaveBeenCalledTimes(1);
  });

  it('dialogProps 透传给 ProDialog.form', async () => {
    render(
      <AddButton schemas={[]} onSubmit={() => true} dialogProps={{ maskClosable: false, escToExit: false } as never} />,
    );
    await user.click(screen.getByRole('button'));
    expect(MockedProDialog.form).toHaveBeenCalledWith(
      expect.objectContaining({
        maskClosable: false,
        escToExit: false,
      }),
    );
  });
});

/**
 * DeleteButton 测试
 */
describe('DeleteButton', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it('默认渲染：text="删除"、status="danger"', () => {
    render(<DeleteButton onDelete={() => true} />);
    const btn = screen.getByRole('button', { name: /删除/ });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('danger');
  });

  it('点击触发 onClick 后再打开 ProDialog.confirm（附加而非覆盖）', async () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();
    render(<DeleteButton onDelete={onDelete} onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(MockedProDialog.confirm).toHaveBeenCalledTimes(1);
    // onDelete 在用户确认弹窗后才执行
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('confirmContent 支持函数形式', async () => {
    const confirmContent = vi.fn().mockReturnValue('确定删除该行?');
    render(<DeleteButton onDelete={() => true} confirmContent={confirmContent} />);
    await user.click(screen.getByRole('button'));

    expect(confirmContent).toHaveBeenCalledTimes(1);
    expect(MockedProDialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '确定删除该行?',
      }),
    );
  });

  it('confirmContent 支持字符串/ReactNode 形式', async () => {
    render(<DeleteButton onDelete={() => true} confirmContent='静态内容' />);
    await user.click(screen.getByRole('button'));
    expect(MockedProDialog.confirm).toHaveBeenCalledWith(expect.objectContaining({ content: '静态内容' }));
  });

  it('ref 暴露 openConfirm 方法可手动触发', () => {
    const ref = React.createRef<{ openConfirm: () => void; loading: boolean }>();
    render(<DeleteButton ref={ref} onDelete={() => true} />);
    expect(typeof ref.current?.openConfirm).toBe('function');
    expect(ref.current?.loading).toBe(false);
    ref.current?.openConfirm();
    expect(MockedProDialog.confirm).toHaveBeenCalledTimes(1);
  });

  it('okButtonProps 透传（默认 status=danger）', async () => {
    render(<DeleteButton onDelete={() => true} okButtonProps={{ disabled: true } as never} />);
    await user.click(screen.getByRole('button'));
    expect(MockedProDialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        okButtonProps: expect.objectContaining({
          status: 'danger',
          disabled: true,
        }),
      }),
    );
  });
});

/**
 * JumpButton 测试
 */
describe('JumpButton', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it('默认渲染：text="跳转"、type="text"', () => {
    render(<JumpButton to='/path' />);
    const btn = screen.getByRole('button', { name: /跳转/ });
    expect(btn).toBeInTheDocument();
    // Arco text button 包含 arco-btn-text class
    expect(btn.className).toContain('text');
  });

  it('点击触发 onClick 后再执行跳转（附加而非覆盖）', async () => {
    const onClick = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<JumpButton to='https://example.com' target='_blank' onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank');
    openSpy.mockRestore();
  });

  it('target="_blank" 调用 window.open', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<JumpButton to='https://example.com' target='_blank' />);
    await user.click(screen.getByRole('button'));
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank');
    openSpy.mockRestore();
  });

  it('target="_self" 修改 window.location.href', async () => {
    // jsdom 中 window.location.href 是只读的，用 delete + defineProperty 绕过
    const original = window.location.href;
    delete (window as Partial<Window & typeof globalThis>).location;
    Object.defineProperty(window, 'location', {
      value: { href: original },
      writable: true,
    });
    render(<JumpButton to='/internal' target='_self' />);
    await user.click(screen.getByRole('button'));
    expect(window.location.href).toBe('/internal');
  });

  it('onBeforeJump 返回 false 阻止跳转', async () => {
    const onBeforeJump = vi.fn().mockResolvedValue(false);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<JumpButton to='/x' target='_blank' onBeforeJump={onBeforeJump} />);
    await user.click(screen.getByRole('button'));
    expect(onBeforeJump).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('ref 暴露 jump 方法可手动触发', async () => {
    const ref = React.createRef<{ jump: () => void }>();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<JumpButton ref={ref} to='/x' target='_blank' />);
    expect(typeof ref.current?.jump).toBe('function');
    await ref.current?.jump();
    expect(openSpy).toHaveBeenCalledWith('/x', '_blank');
    openSpy.mockRestore();
  });
});

/**
 * BatchButton 测试
 */
describe('BatchButton', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it('默认渲染：text="批量操作"、type="secondary"', () => {
    render(<BatchButton selectedRows={[]} selectedKeys={[]} onAction={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /批量操作/ });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('secondary');
  });

  it('点击触发 onClick 后再执行 handleExecute（附加而非覆盖）', async () => {
    const onClick = vi.fn();
    const onAction = vi.fn().mockResolvedValue(true);
    render(
      <BatchButton
        selectedRows={[{ id: 1 }]}
        selectedKeys={[1]}
        needSelection={false}
        needConfirm={false}
        onAction={onAction}
        onClick={onClick}
      />,
    );
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    // needConfirm=false 时直接执行 onAction
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('needSelection=true 且未选择时弹出 warning 提示', async () => {
    const onAction = vi.fn();
    render(
      <BatchButton selectedRows={[]} selectedKeys={[]} needSelection={true} minSelection={1} onAction={onAction} />,
    );
    await user.click(screen.getByRole('button'));

    expect(MockedProDialog.message.warning).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('needConfirm=true 时点击后弹出 confirm 弹窗', async () => {
    const onAction = vi.fn();
    render(
      <BatchButton
        selectedRows={[{ id: 1 }]}
        selectedKeys={[1]}
        needConfirm={true}
        confirmTitle='确认批量删除'
        confirmContent={(rows) => `将删除 ${rows.length} 条`}
        onAction={onAction}
      />,
    );
    await user.click(screen.getByRole('button'));

    expect(MockedProDialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '确认批量删除',
        content: '将删除 1 条',
      }),
    );
    // onAction 在用户确认后才执行
    expect(onAction).not.toHaveBeenCalled();
  });

  it('maxSelection 限制：超出时弹出 warning', async () => {
    const onAction = vi.fn();
    render(
      <BatchButton
        selectedRows={[{ id: 1 }, { id: 2 }, { id: 3 }]}
        selectedKeys={[1, 2, 3]}
        maxSelection={2}
        onAction={onAction}
      />,
    );
    await user.click(screen.getByRole('button'));

    expect(MockedProDialog.message.warning).toHaveBeenCalledWith('最多只能选择 2 条数据');
    expect(onAction).not.toHaveBeenCalled();
  });

  it('ref 暴露 execute / loading / setSelectedKeys / setSelectedRows', () => {
    const ref = React.createRef<{
      execute: () => void;
      loading: boolean;
      setSelectedKeys: (k: (string | number)[]) => void;
      setSelectedRows: (r: unknown[]) => void;
    }>();
    render(<BatchButton ref={ref} selectedRows={[]} selectedKeys={[]} onAction={vi.fn()} />);
    expect(typeof ref.current?.execute).toBe('function');
    expect(ref.current?.loading).toBe(false);
    expect(typeof ref.current?.setSelectedKeys).toBe('function');
    expect(typeof ref.current?.setSelectedRows).toBe('function');
  });
});

/**
 * ExportButton 测试
 */
describe('ExportButton', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it('默认渲染：text="导出"、type="secondary"', () => {
    render(<ExportButton exportUrl='/api/export' />);
    const btn = screen.getByRole('button', { name: /导出/ });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('secondary');
  });

  it('点击触发 onClick 后再执行导出（附加而非覆盖）', async () => {
    const onClick = vi.fn();
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportButton onExport={onExport} onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('onBeforeExport 返回 false 时不执行导出', async () => {
    const onBeforeExport = vi.fn().mockResolvedValue(false);
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} onBeforeExport={onBeforeExport} />);
    await user.click(screen.getByRole('button'));

    expect(onBeforeExport).toHaveBeenCalledTimes(1);
    expect(onExport).not.toHaveBeenCalled();
  });

  it('onBeforeExport 返回 true 时正常导出', async () => {
    const onBeforeExport = vi.fn().mockResolvedValue(true);
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportButton onExport={onExport} onBeforeExport={onBeforeExport} />);
    await user.click(screen.getByRole('button'));

    expect(onBeforeExport).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('优先使用 onExport 而非 exportUrl', async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<ExportButton exportUrl='/api/export' onExport={onExport} />);
    await user.click(screen.getByRole('button'));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('ref 暴露 export / loading', () => {
    const ref = React.createRef<{ export: () => void; loading: boolean }>();
    render(<ExportButton ref={ref} exportUrl='/api/export' />);
    expect(typeof ref.current?.export).toBe('function');
    expect(ref.current?.loading).toBe(false);
  });
});

/**
 * ViewButton 测试
 */
describe('ViewButton', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it('默认渲染：text="查看"、type="text"', () => {
    render(<ViewButton renderContent={() => null} />);
    const btn = screen.getByRole('button', { name: /查看/ });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('text');
  });

  it('visible=false 时不渲染', () => {
    render(<ViewButton visible={false} renderContent={() => null} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('点击触发 onClick 后再打开 ProDialog.open（附加而非覆盖）', async () => {
    const onClick = vi.fn();
    render(<ViewButton renderContent={() => <div>详情</div>} onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(MockedProDialog.open).toHaveBeenCalledTimes(1);
  });

  it('ProDialog.open 接收 title/width/content/showOk:false/cancelText:"关闭"', async () => {
    const content = <div>详情内容</div>;
    render(<ViewButton title='用户详情' width={800} renderContent={() => content} />);
    await user.click(screen.getByRole('button'));

    expect(MockedProDialog.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '用户详情',
        width: 800,
        content,
        showOk: false,
        cancelText: '关闭',
      }),
    );
  });

  it('renderContent 在打开时被调用', async () => {
    const renderContent = vi.fn().mockReturnValue(<div>x</div>);
    render(<ViewButton renderContent={renderContent} />);
    await user.click(screen.getByRole('button'));
    expect(renderContent).toHaveBeenCalledTimes(1);
  });

  it('ref 暴露 open 方法可手动触发', () => {
    const ref = React.createRef<{ open: () => void }>();
    render(<ViewButton ref={ref} renderContent={() => null} />);
    expect(typeof ref.current?.open).toBe('function');
    ref.current?.open();
    expect(MockedProDialog.open).toHaveBeenCalledTimes(1);
  });

  it('dialogProps 透传给 ProDialog.open', async () => {
    render(<ViewButton renderContent={() => null} dialogProps={{ maskClosable: false } as never} />);
    await user.click(screen.getByRole('button'));
    expect(MockedProDialog.open).toHaveBeenCalledWith(expect.objectContaining({ maskClosable: false }));
  });
});

/**
 * EditButton 测试
 */
describe('EditButton', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it('默认渲染：text="编辑"、type="text"', () => {
    render(<EditButton schemas={[]} getInitialValues={async () => ({})} onSubmit={async () => true} />);
    const btn = screen.getByRole('button', { name: /编辑/ });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('text');
  });

  it('visible=false 时不渲染', () => {
    render(<EditButton visible={false} schemas={[]} getInitialValues={async () => ({})} onSubmit={async () => true} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('点击触发 onClick 后再打开 ProDialog.form（附加而非覆盖）', async () => {
    const onClick = vi.fn();
    const getInitialValues = vi.fn().mockResolvedValue({ name: 'a' });
    render(
      <EditButton
        schemas={[{ name: 'name', label: '姓名', component: 'Input' as const }]}
        getInitialValues={getInitialValues}
        onSubmit={async () => true}
        onClick={onClick}
      />,
    );
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(getInitialValues).toHaveBeenCalledTimes(1);
    expect(MockedProDialog.form).toHaveBeenCalledTimes(1);
  });

  it('ProDialog.form 接收 schemas/initialValues（来自 getInitialValues）/formProps.layout="vertical"', async () => {
    const schemas = [{ name: 'name', label: '姓名', component: 'Input' as const }];
    const getInitialValues = vi.fn().mockResolvedValue({ name: '回填值' });
    render(
      <EditButton
        title='编辑用户'
        width={700}
        schemas={schemas}
        getInitialValues={getInitialValues}
        onSubmit={async () => true}
      />,
    );
    await user.click(screen.getByRole('button'));

    expect(MockedProDialog.form).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '编辑用户',
        width: 700,
        schemas,
        initialValues: { name: '回填值' },
        formProps: expect.objectContaining({ layout: 'vertical' }),
      }),
    );
  });

  it('onBeforeOpen 返回 false 时不打开弹窗、不调用 getInitialValues', async () => {
    const onBeforeOpen = vi.fn().mockResolvedValue(false);
    const getInitialValues = vi.fn();
    render(
      <EditButton
        schemas={[]}
        getInitialValues={getInitialValues}
        onSubmit={async () => true}
        onBeforeOpen={onBeforeOpen}
      />,
    );
    await user.click(screen.getByRole('button'));

    expect(onBeforeOpen).toHaveBeenCalledTimes(1);
    expect(getInitialValues).not.toHaveBeenCalled();
    expect(MockedProDialog.form).not.toHaveBeenCalled();
  });

  it('onBeforeOpen 返回 true 时正常打开弹窗', async () => {
    const onBeforeOpen = vi.fn().mockResolvedValue(true);
    render(
      <EditButton
        schemas={[]}
        getInitialValues={async () => ({})}
        onSubmit={async () => true}
        onBeforeOpen={onBeforeOpen}
      />,
    );
    await user.click(screen.getByRole('button'));
    expect(MockedProDialog.form).toHaveBeenCalledTimes(1);
  });

  it('ProDialog.form 的 onSubmit 包装：原 onSubmit 返回 true → 包装返回 true', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<EditButton schemas={[]} getInitialValues={async () => ({})} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button'));

    const formCall = MockedProDialog.form.mock.calls[0][0] as {
      onSubmit: (v: unknown) => Promise<boolean>;
    };
    const result = await formCall.onSubmit({ name: 'x' });
    expect(onSubmit).toHaveBeenCalledWith({ name: 'x' });
    expect(result).toBe(true);
  });

  it('ProDialog.form 的 onSubmit 包装：原 onSubmit 返回 false → 包装返回 false', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<EditButton schemas={[]} getInitialValues={async () => ({})} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button'));

    const formCall = MockedProDialog.form.mock.calls[0][0] as {
      onSubmit: (v: unknown) => Promise<boolean>;
    };
    const result = await formCall.onSubmit({});
    expect(result).toBe(false);
  });

  it('ref 暴露 open / loading', () => {
    const ref = React.createRef<{ open: () => void; loading: boolean }>();
    render(<EditButton ref={ref} schemas={[]} getInitialValues={async () => ({})} onSubmit={async () => true} />);
    expect(typeof ref.current?.open).toBe('function');
    expect(ref.current?.loading).toBe(false);
  });
});

/**
 * ImportButton 测试
 */
describe('ImportButton', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it('默认渲染：text="导入"、type="secondary"', () => {
    render(<ImportButton uploadUrl='/api/import' />);
    const btn = screen.getByRole('button', { name: /导入/ });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('secondary');
  });

  it('visible=false 时不渲染', () => {
    render(<ImportButton visible={false} uploadUrl='/api/import' />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('点击触发 onClick 后再打开 ProDialog.open（附加而非覆盖）', async () => {
    const onClick = vi.fn();
    render(<ImportButton uploadUrl='/api/import' onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(MockedProDialog.open).toHaveBeenCalledTimes(1);
  });

  it('ProDialog.open 接收 title/width/confirmLoading/onOk', async () => {
    render(<ImportButton uploadUrl='/api/import' title='导入用户' width={600} />);
    await user.click(screen.getByRole('button'));

    expect(MockedProDialog.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '导入用户',
        width: 600,
        confirmLoading: false,
      }),
    );
    const openCall = MockedProDialog.open.mock.calls[0][0] as { onOk: () => unknown };
    expect(typeof openCall.onOk).toBe('function');
  });

  it('空文件时 onOk 触发 warning 提示并返回 false', async () => {
    render(<ImportButton uploadUrl='/api/import' />);
    await user.click(screen.getByRole('button'));

    const openCall = MockedProDialog.open.mock.calls[0][0] as { onOk: () => Promise<boolean> };
    const result = await openCall.onOk();

    expect(MockedProDialog.message.warning).toHaveBeenCalledWith('请选择要上传的文件');
    expect(result).toBe(false);
  });

  it('renderUpload 自定义渲染被调用，其返回值作为 content', async () => {
    const renderUpload = vi.fn().mockReturnValue(<div>自定义上传区</div>);
    render(<ImportButton uploadUrl='/api/import' renderUpload={renderUpload} />);
    await user.click(screen.getByRole('button'));

    expect(renderUpload).toHaveBeenCalledTimes(1);
    expect(MockedProDialog.open).toHaveBeenCalledWith(expect.objectContaining({ content: <div>自定义上传区</div> }));
  });

  it('ref 暴露 open / loading', () => {
    const ref = React.createRef<{ open: () => void; loading: boolean }>();
    render(<ImportButton ref={ref} uploadUrl='/api/import' />);
    expect(typeof ref.current?.open).toBe('function');
    expect(ref.current?.loading).toBe(false);
  });
});
