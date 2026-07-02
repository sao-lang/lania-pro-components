import { describe, it, expect } from 'vitest';
import { getSizeWidth, getFooterJustify } from '../ProDialog/utils';
import { deepMerge } from '@lania-pro-components/utils';

describe('ProDialog/utils / getSizeWidth', () => {
  it('small → 400', () => {
    expect(getSizeWidth('small')).toBe(400);
  });
  it('medium → 600', () => {
    expect(getSizeWidth('medium')).toBe(600);
  });
  it('large → 800', () => {
    expect(getSizeWidth('large')).toBe(800);
  });
  it('xlarge → 1000', () => {
    expect(getSizeWidth('xlarge')).toBe(1000);
  });
  it('fullscreen → "100%"', () => {
    expect(getSizeWidth('fullscreen')).toBe('100%');
  });
  it('未知值默认返回 600', () => {
    expect(getSizeWidth('unknown' as never)).toBe(600);
  });
});

describe('ProDialog/utils / getFooterJustify', () => {
  it('left → flex-start', () => {
    expect(getFooterJustify('left')).toBe('flex-start');
  });
  it('center → center', () => {
    expect(getFooterJustify('center')).toBe('center');
  });
  it('right → flex-end', () => {
    expect(getFooterJustify('right')).toBe('flex-end');
  });
  it('未知值默认 flex-end', () => {
    expect(getFooterJustify('unknown' as never)).toBe('flex-end');
  });
});

describe('ProDialog/utils / deepMerge', () => {
  it('浅层合并：source 覆盖 target 同名字段', () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('深层对象递归合并', () => {
    const target = { a: { x: 1, y: 2 }, b: 1 };
    const source = { a: { y: 3, z: 4 } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: { x: 1, y: 3, z: 4 }, b: 1 });
  });

  it('source 中 null 值会直接覆盖（不递归）', () => {
    const result = deepMerge({ a: { x: 1 } }, { a: null });
    expect(result).toEqual({ a: null });
  });

  it('source 中数组直接覆盖 target 中的数组（不深合并）', () => {
    const result = deepMerge({ a: [1, 2, 3] }, { a: [4] });
    expect(result).toEqual({ a: [4] });
  });

  it('target 中存在对象、source 中为原始值时直接覆盖', () => {
    const result = deepMerge({ a: { x: 1 } }, { a: 2 });
    expect(result).toEqual({ a: 2 });
  });

  it('target 中不存在该 key 时直接采用 source 的值', () => {
    const result = deepMerge({ a: 1 }, { b: { x: 1 } });
    expect(result).toEqual({ a: 1, b: { x: 1 } });
  });

  it('source 为空对象时返回 target 拷贝', () => {
    const target = { a: 1 };
    const result = deepMerge(target, {});
    expect(result).toEqual({ a: 1 });
    // 不应修改原对象
    expect(result).not.toBe(target);
  });

  it('source 为 null/undefined 时返回 target 拷贝', () => {
    const target = { a: 1 };
    const result = deepMerge(target, null as never);
    expect(result).toEqual({ a: 1 });
  });

  it('多层嵌套对象递归合并', () => {
    const target = { a: { b: { c: 1, d: 2 } } };
    const source = { a: { b: { d: 3, e: 4 } } };
    expect(deepMerge(target, source)).toEqual({ a: { b: { c: 1, d: 3, e: 4 } } });
  });

  it('不修改原始 target', () => {
    const target = { a: { x: 1 } };
    const targetClone = JSON.parse(JSON.stringify(target));
    deepMerge(target, { a: { y: 2 } });
    expect(target).toEqual(targetClone);
  });
});
