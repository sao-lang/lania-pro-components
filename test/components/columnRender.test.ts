import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getNestedValue, formatNumber, formatMoney, formatPercent, formatDate } from '@lania-pro-components/utils';
import {
  registerCellRenderer,
  unregisterCellRenderer,
  registerCellRenderers,
  getCellRenderer,
  hasCellRenderer,
  customRendererRegistry,
} from '../../packages/components/ProTable/utils/columnRender';

describe('columnRender / getNestedValue', () => {
  it('支持点号分隔的字符串路径', () => {
    const obj = { a: { b: { c: 42 } } };
    expect(getNestedValue(obj, 'a.b.c')).toBe(42);
  });

  it('支持数组路径', () => {
    const obj = { a: { b: { c: 42 } } };
    expect(getNestedValue(obj, ['a', 'b', 'c'])).toBe(42);
  });

  it('路径不存在时返回 undefined', () => {
    const obj = { a: { b: 1 } };
    expect(getNestedValue(obj, 'a.b.c')).toBeUndefined();
    expect(getNestedValue(obj, 'x.y.z')).toBeUndefined();
  });

  it('obj 为空时返回 undefined', () => {
    expect(getNestedValue(null as unknown as Record<string, unknown>, 'a')).toBeUndefined();
    expect(getNestedValue(undefined as unknown as Record<string, unknown>, 'a')).toBeUndefined();
  });

  it('中间节点非对象时返回 undefined', () => {
    expect(getNestedValue({ a: 1 } as Record<string, unknown>, 'a.b')).toBeUndefined();
  });
});

describe('columnRender / formatNumber', () => {
  it('整数默认千分位、0 位小数', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('指定 precision 控制小数位数', () => {
    expect(formatNumber(1234.5678, { precision: 2 })).toBe('1,234.57');
    expect(formatNumber(1234, { precision: 2 })).toBe('1,234.00');
  });

  it('thousandsSeparator=false 关闭千分位', () => {
    expect(formatNumber(1234567, { thousandsSeparator: false })).toBe('1234567');
  });

  it('字符串数字会被解析', () => {
    expect(formatNumber('1234.5', { precision: 2 })).toBe('1,234.50');
  });

  it('非数字字符串原样返回', () => {
    expect(formatNumber('abc')).toBe('abc');
  });

  it('负数千分位正确', () => {
    expect(formatNumber(-1234567, { precision: 0 })).toBe('-1,234,567');
  });
});

describe('columnRender / formatMoney', () => {
  it('默认带 ¥ 符号、2 位小数、千分位', () => {
    expect(formatMoney(1234567.891)).toBe('¥1,234,567.89');
  });

  it('自定义货币符号', () => {
    expect(formatMoney(1234.5, '$')).toBe('$1,234.50');
  });

  it('自定义精度', () => {
    expect(formatMoney(1234.567, '¥', { precision: 3 })).toBe('¥1,234.567');
  });

  it('非数字原样返回（带符号前缀）', () => {
    expect(formatMoney('abc')).toBe('¥abc');
  });
});

describe('columnRender / formatPercent', () => {
  it('默认 2 位小数带 % 符号', () => {
    expect(formatPercent(12.3456)).toBe('12.35%');
  });

  it('showSymbol=false 不显示 %', () => {
    expect(formatPercent(12.3456, { showSymbol: false })).toBe('12.35');
  });

  it('自定义精度', () => {
    expect(formatPercent(12.3456, { precision: 1 })).toBe('12.3%');
  });

  it('字符串数字会被解析', () => {
    expect(formatPercent('50', { precision: 0 })).toBe('50%');
  });

  it('非数字原样返回', () => {
    expect(formatPercent('abc')).toBe('abc');
  });
});

describe('columnRender / formatDate', () => {
  it('默认 YYYY-MM-DD 格式', () => {
    expect(formatDate('2024-01-15T10:30:00')).toBe('2024-01-15');
    expect(formatDate(new Date('2024-03-08'))).toBe('2024-03-08');
  });

  it('支持自定义格式', () => {
    expect(formatDate('2024-01-15T10:30:00', 'YYYY/MM/DD')).toBe('2024/01/15');
    expect(formatDate('2024-01-15T10:30:45', 'YYYY-MM-DD HH:mm:ss')).toBe('2024-01-15 10:30:45');
  });

  it('空值返回 "-"', () => {
    expect(formatDate('')).toBe('-');
    expect(formatDate(undefined as unknown as string)).toBe('-');
  });

  it('无效日期返回原值的字符串形式', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

/**
 * 自定义渲染器注册表测试
 * 注意：customRendererRegistry 是模块级单例，测试间需要清理
 */
describe('columnRender / customRendererRegistry', () => {
  beforeEach(() => {
    customRendererRegistry.clear();
  });

  it('registerCellRenderer / getCellRenderer / hasCellRenderer', () => {
    const renderer = () => 'custom';
    registerCellRenderer('rate', renderer);
    expect(hasCellRenderer('rate')).toBe(true);
    expect(hasCellRenderer('not-exist')).toBe(false);
    expect(getCellRenderer('rate')).toBe(renderer);
    expect(getCellRenderer('not-exist')).toBeUndefined();
  });

  it('unregisterCellRenderer 移除渲染器', () => {
    registerCellRenderer('rate', () => 'x');
    expect(hasCellRenderer('rate')).toBe(true);
    unregisterCellRenderer('rate');
    expect(hasCellRenderer('rate')).toBe(false);
  });

  it('registerCellRenderers 批量注册', () => {
    registerCellRenderers({
      rate: () => 'rate',
      color: () => 'color',
    });
    expect(hasCellRenderer('rate')).toBe(true);
    expect(hasCellRenderer('color')).toBe(true);
  });

  it('重复注册会覆盖（带 warn）', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const col = {} as never;
    registerCellRenderer('rate', () => 'v1');
    registerCellRenderer('rate', () => 'v2');
    expect(getCellRenderer('rate')?.(undefined, col)).toBe('v2');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('customRendererRegistry.clear 清空所有', () => {
    registerCellRenderer('rate', () => 'x');
    customRendererRegistry.clear();
    expect(hasCellRenderer('rate')).toBe(false);
  });
});
