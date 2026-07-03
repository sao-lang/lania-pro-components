import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';

// 轻量级 Mock
interface MockStore {
  value?: unknown;
  mode?: string;
  placeholder?: string;
  disabled?: boolean;
  showSearch?: boolean;
  onChange?: (value: unknown, option?: unknown) => void;
  onSearch?: (value: string) => void;
  onVisibleChange?: (visible: boolean) => void;
  renderTag?: unknown;
  virtualListProps?: unknown;
  maxTagCount?: number;
  children?: React.ReactNode;
  notFoundContent?: React.ReactNode;
  dropdownRender?: (menu: React.ReactNode) => React.ReactNode;
}
const mockStore: MockStore = {};

vi.mock('@arco-design/web-react', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Option = ({ disabled, children, value: _v, ...rest }: any) =>
    React.createElement('div', { 'data-testid': 'mock-option', 'data-disabled': disabled, ...rest }, children);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const OptGroup = ({ label, children }: any) =>
    React.createElement('div', { 'data-testid': 'mock-optgroup' }, children);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockSelect = React.forwardRef((props: any, ref: React.Ref<HTMLDivElement>) => {
    React.useImperativeHandle(ref, () => document.createElement('div'), []);
    Object.assign(mockStore, props);
    return React.createElement(
      'div',
      { 'data-testid': 'mock-select', 'data-value': JSON.stringify(props.value), 'data-mode': props.mode },
      props.placeholder ? React.createElement('span', { 'data-testid': 'placeholder' }, props.placeholder) : null,
      props.showSearch
        ? React.createElement('input', {
            'data-testid': 'search-input',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.onSearch?.(e.target.value),
          })
        : null,
      props.notFoundContent ? React.createElement('div', { 'data-testid': 'not-found' }, props.notFoundContent) : null,
      // 只渲染 children，不通过 dropdownRender 再渲染一遍（避免重复）
      props.children,
      // dropdownRender 只在有值时渲染（和 children 分开，避免重复）
      props.dropdownRender
        ? React.createElement(
            'div',
            { key: 'dd-wrapper' },
            props.dropdownRender(React.createElement('div', { key: 'dd-menu' })),
          )
        : null,
      props.renderTag && Array.isArray(props.value)
        ? React.createElement(
            'div',
            { 'data-testid': 'tag-area' },
            ...props.value.map((v: string | number) =>
              React.createElement('span', { key: v, 'data-testid': 'mock-tag' }, String(v)),
            ),
          )
        : null,
    );
  });
  MockSelect.displayName = 'Select';
  (MockSelect as unknown as Record<string, unknown>).Option = Option;
  (MockSelect as unknown as Record<string, unknown>).OptGroup = OptGroup;
  return {
    Select: MockSelect,
    Checkbox: () => React.createElement('div'),
    Tag: (p: Record<string, unknown>) => React.createElement('span', null, p.children as React.ReactNode),
    Spin: () => React.createElement('span', null),
    Empty: () => React.createElement('div', null),
  };
});

import { ProSelect } from '../../packages/components/ProSelect/index';
import type { ProSelectInstance, ProSelectOption } from '../../packages/components/ProSelect/types';

describe('ProSelect', () => {
  const defaultOptions: ProSelectOption[] = [
    { label: 'Option 1', value: 1 },
    { label: 'Option 2', value: 2 },
    { label: 'Option 3', value: 3 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStore).forEach((k) => delete (mockStore as Record<string, unknown>)[k]);
  });

  afterEach(() => {
    cleanup();
  });

  // ===== 基础渲染 =====
  describe('基础渲染', () => {
    it('渲染静态 options', () => {
      render(React.createElement(ProSelect, { options: defaultOptions, placeholder: '请选择' }));
      expect(screen.getByTestId('mock-select')).toBeInTheDocument();
      expect(screen.getByTestId('placeholder')).toHaveTextContent('请选择');
      expect(screen.getAllByTestId('mock-option')).toHaveLength(3);
    });

    it('空 options 不报错', () => {
      render(React.createElement(ProSelect, { options: [] }));
      expect(screen.getByTestId('mock-select')).toBeInTheDocument();
    });

    it('受控模式 value', () => {
      render(React.createElement(ProSelect, { options: defaultOptions, value: 2 }));
      expect(screen.getByTestId('mock-select')).toHaveAttribute('data-value', '2');
    });

    it('非受控模式 defaultValue', () => {
      render(React.createElement(ProSelect, { options: defaultOptions, defaultValue: 1 }));
      expect(screen.getByTestId('mock-select')).toHaveAttribute('data-value', '1');
    });

    it('透传 disabled', () => {
      render(React.createElement(ProSelect, { options: defaultOptions, disabled: true }));
      expect(mockStore.disabled).toBe(true);
    });
  });

  // ===== mode =====
  describe('选择模式', () => {
    it('多选模式', () => {
      render(React.createElement(ProSelect, { options: defaultOptions, mode: 'multiple' }));
      expect(screen.getByTestId('mock-select')).toHaveAttribute('data-mode', 'multiple');
    });
  });

  // ===== search =====
  describe('搜索功能', () => {
    it('search=true 显示搜索框', () => {
      render(React.createElement(ProSelect, { options: defaultOptions, search: true }));
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
  });

  // ===== allowCreate =====
  describe('允许创建', () => {
    it('allowCreate 且搜索不存在值时显示创建选项', () => {
      render(React.createElement(ProSelect, { options: defaultOptions, allowCreate: true, search: true }));
      act(() => {
        mockStore.onSearch?.('new');
      });
      expect(screen.getAllByTestId('mock-option').some((o) => o.textContent?.includes('创建'))).toBe(true);
    });
  });

  // ===== optionRender =====
  describe('自定义选项渲染', () => {
    it('optionRender 被调用', () => {
      const renderFn = vi.fn((opt: ProSelectOption) => React.createElement('span', { 'data-testid': 'cr' }, opt.label));
      render(React.createElement(ProSelect, { options: defaultOptions, optionRender: renderFn }));
      expect(screen.getAllByTestId('cr')).toHaveLength(3);
      expect(renderFn).toHaveBeenCalledTimes(3);
    });
  });

  // ===== 分组 =====
  describe('选项分组', () => {
    it('渲染分组', () => {
      const opts: ProSelectOption[] = [{ label: 'A', value: 'a', group: 'G1' }];
      render(React.createElement(ProSelect, { options: opts }));
      expect(screen.getAllByTestId('mock-optgroup')).toHaveLength(1);
    });
  });

  // ===== tagMode =====
  describe('标签模式', () => {
    it('tagMode 多选渲染标签', () => {
      render(
        React.createElement(ProSelect, { options: defaultOptions, mode: 'multiple', tagMode: true, value: [1, 2] }),
      );
      expect(screen.getByTestId('tag-area')).toBeInTheDocument();
    });
  });

  // ===== 虚拟滚动 =====
  describe('虚拟滚动', () => {
    it('传递 virtualListProps', () => {
      render(
        React.createElement(ProSelect, {
          options: defaultOptions,
          virtual: true,
          virtualHeight: 200,
          virtualItemHeight: 30,
        }),
      );
      expect(mockStore.virtualListProps).toEqual({ height: 200, itemHeight: 30 });
    });
  });

  // ===== 值变更 =====
  describe('值变更事件', () => {
    it('受控模式 onChange', () => {
      const onChange = vi.fn();
      render(React.createElement(ProSelect, { options: defaultOptions, value: 1, onChange }));
      act(() => {
        mockStore.onChange?.(2);
      });
      expect(onChange).toHaveBeenCalledWith(2, undefined);
    });

    it('非受控模式 onChange', () => {
      const onChange = vi.fn();
      render(React.createElement(ProSelect, { options: defaultOptions, defaultValue: 1, onChange }));
      act(() => {
        mockStore.onChange?.(2);
      });
      expect(onChange).toHaveBeenCalledWith(2, undefined);
    });
  });

  // ===== onVisibleChange =====
  describe('下拉可见性', () => {
    it('onVisibleChange 被调用', () => {
      const fn = vi.fn();
      render(React.createElement(ProSelect, { options: defaultOptions, onVisibleChange: fn }));
      act(() => {
        mockStore.onVisibleChange?.(true);
      });
      expect(fn).toHaveBeenCalledWith(true);
    });
  });

  // ===== maxTagCount =====
  describe('maxTagCount', () => {
    it('传递 maxTagCount', () => {
      render(
        React.createElement(ProSelect, {
          options: defaultOptions,
          mode: 'multiple',
          tagMode: true,
          value: [1, 2, 3],
          maxTagCount: 2,
        }),
      );
      expect(mockStore.maxTagCount).toBe(2);
    });
  });

  // ===== request =====
  describe('远程数据请求', () => {
    it('request 在打开下拉时被调用', async () => {
      const request = vi.fn().mockResolvedValue({ data: [{ label: 'R1', value: 'r1' }], total: 1 });
      render(React.createElement(ProSelect, { request }));
      await act(async () => {
        mockStore.onVisibleChange?.(true);
      });
      expect(request).toHaveBeenCalled();
    });

    it('request 失败不崩溃', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const request = vi.fn().mockRejectedValue(new Error('err'));
      render(React.createElement(ProSelect, { request }));
      await act(async () => {
        mockStore.onVisibleChange?.(true);
      });
      expect(request).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ===== Ref API =====
  describe('Ref API', () => {
    it('暴露所有方法', () => {
      const ref = React.createRef<ProSelectInstance>();
      render(React.createElement(ProSelect, { ref, options: defaultOptions }));
      expect(typeof ref.current!.refresh).toBe('function');
      expect(typeof ref.current!.loadMore).toBe('function');
      expect(typeof ref.current!.clearOptions).toBe('function');
      expect(typeof ref.current!.getOptions).toBe('function');
      expect(typeof ref.current!.setOptions).toBe('function');
      expect(typeof ref.current!.selectAll).toBe('function');
      expect(typeof ref.current!.unselectAll).toBe('function');
      expect(typeof ref.current!.getSelectedOptions).toBe('function');
      expect(typeof ref.current!.focus).toBe('function');
      expect(typeof ref.current!.blur).toBe('function');
      expect(typeof ref.current!.create).toBe('function');
    });

    it('getOptions / setOptions / clearOptions', () => {
      const ref = React.createRef<ProSelectInstance>();
      render(React.createElement(ProSelect, { ref, options: defaultOptions }));
      expect(ref.current!.getOptions()).toHaveLength(3);
      // setOptions 是直接更新内部状态，要通过 act 包裹
      act(() => {
        ref.current!.setOptions([{ label: 'X', value: 'x' }]);
      });
      expect(ref.current!.getOptions()).toHaveLength(1);
      act(() => {
        ref.current!.clearOptions();
      });
      expect(ref.current!.getOptions()).toHaveLength(0);
    });

    it('getSelectedOptions', () => {
      const ref = React.createRef<ProSelectInstance>();
      render(React.createElement(ProSelect, { ref, options: defaultOptions, value: 2 }));
      expect(ref.current!.getSelectedOptions()).toHaveLength(1);
      expect(ref.current!.getSelectedOptions()[0].value).toBe(2);
    });

    it('selectAll 多选选中未禁用的', () => {
      const onChange = vi.fn();
      const opts: ProSelectOption[] = [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b', disabled: true },
        { label: 'C', value: 'c' },
      ];
      const ref = React.createRef<ProSelectInstance>();
      render(React.createElement(ProSelect, { ref, options: opts, mode: 'multiple', onChange }));
      ref.current!.selectAll();
      expect(onChange).toHaveBeenCalledWith(['a', 'c'], undefined);
    });

    it('selectAll 单选不生效', () => {
      const onChange = vi.fn();
      const ref = React.createRef<ProSelectInstance>();
      render(React.createElement(ProSelect, { ref, options: defaultOptions, onChange }));
      ref.current!.selectAll();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('unselectAll 清空多选', () => {
      const onChange = vi.fn();
      const ref = React.createRef<ProSelectInstance>();
      render(
        React.createElement(ProSelect, { ref, options: defaultOptions, mode: 'multiple', value: [1, 2], onChange }),
      );
      ref.current!.unselectAll();
      expect(onChange).toHaveBeenCalledWith([], undefined);
    });

    it('unselectAll 单选不生效', () => {
      const onChange = vi.fn();
      const ref = React.createRef<ProSelectInstance>();
      render(React.createElement(ProSelect, { ref, options: defaultOptions, value: 1, onChange }));
      ref.current!.unselectAll();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
