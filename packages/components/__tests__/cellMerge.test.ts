import { describe, it, expect } from 'vitest';
import {
  createRowMerge,
  createColMerge,
  combineMerge,
  calculateMergeState,
  getCellMergeProps,
} from '../ProTable/utils/cellMerge';
import type { ProColumnType } from '../ProTable/types';

interface RecordT {
  category: string;
  name: string;
  type?: string;
  nested?: { value: string };
}

const dataSource: RecordT[] = [
  { category: 'A', name: 'a1' },
  { category: 'A', name: 'a2' },
  { category: 'A', name: 'a3' },
  { category: 'B', name: 'b1' },
  { category: 'B', name: 'b2' },
  { category: 'C', name: 'c1' },
];

const columns: ProColumnType<RecordT>[] = [
  { title: '分类', dataIndex: 'category' },
  { title: '名称', dataIndex: 'name' },
];

describe('cellMerge / createRowMerge', () => {
  it('应合并连续相同字段值的行：起始行返回合并数，非起始行返回 0', () => {
    const rowMerge = createRowMerge<RecordT>('category');
    // A 组：3 行
    expect(rowMerge(dataSource[0], 0, columns[0], dataSource)).toBe(3);
    expect(rowMerge(dataSource[1], 1, columns[0], dataSource)).toBe(0);
    expect(rowMerge(dataSource[2], 2, columns[0], dataSource)).toBe(0);
    // B 组：2 行
    expect(rowMerge(dataSource[3], 3, columns[0], dataSource)).toBe(2);
    expect(rowMerge(dataSource[4], 4, columns[0], dataSource)).toBe(0);
    // C 组：1 行
    expect(rowMerge(dataSource[5], 5, columns[0], dataSource)).toBe(1);
  });

  it('第一行（index=0）不检查上一行，直接计算后续连续相同值', () => {
    const rowMerge = createRowMerge<RecordT>('category');
    expect(rowMerge(dataSource[0], 0, columns[0], dataSource)).toBe(3);
  });

  it('支持嵌套字段路径（数组形式）', () => {
    const nestedData: RecordT[] = [
      { category: 'X', name: 'x1', nested: { value: 'v1' } },
      { category: 'X', name: 'x2', nested: { value: 'v1' } },
      { category: 'X', name: 'x3', nested: { value: 'v2' } },
    ];
    const rowMerge = createRowMerge<RecordT>(['nested', 'value']);
    expect(rowMerge(nestedData[0], 0, columns[0], nestedData)).toBe(2);
    expect(rowMerge(nestedData[1], 1, columns[0], nestedData)).toBe(0);
    expect(rowMerge(nestedData[2], 2, columns[0], nestedData)).toBe(1);
  });

  it('单行数据返回 1', () => {
    const rowMerge = createRowMerge<RecordT>('category');
    expect(rowMerge({ category: 'Z', name: 'z1' }, 0, columns[0], [{ category: 'Z', name: 'z1' }])).toBe(1);
  });
});

describe('cellMerge / createColMerge', () => {
  it('根据条件返回列合并数', () => {
    const colMerge = createColMerge<RecordT>((record) => (record.type === 'summary' ? 2 : 1));
    expect(colMerge({ category: 'A', name: 'a1', type: 'summary' }, 0, columns[0], dataSource)).toBe(2);
    expect(colMerge({ category: 'A', name: 'a1', type: 'normal' }, 0, columns[0], dataSource)).toBe(1);
  });

  it('condition 接收 record/index/column 参数', () => {
    const colMerge = createColMerge<RecordT>((record, index, column) => {
      expect(record).toBeDefined();
      expect(typeof index).toBe('number');
      expect(column).toBe(columns[0]);
      return 1;
    });
    colMerge(dataSource[0], 0, columns[0], dataSource);
  });
});

describe('cellMerge / combineMerge', () => {
  it('按顺序应用多个合并配置，返回首个 >1 的结果', () => {
    const merged = combineMerge<RecordT>({ rowSpan: createRowMerge('category') }, { colSpan: createColMerge(() => 1) });

    expect(merged.rowSpan).toBeDefined();
    expect(merged.colSpan).toBeDefined();

    // rowSpan 命中：A 组起始行 = 3
    expect(merged.rowSpan?.(dataSource[0], 0, columns[0], dataSource)).toBe(3);
    // colSpan 第一个配置返回 1，最终返回 1
    expect(merged.colSpan?.(dataSource[0], 0, columns[0], dataSource)).toBe(1);
  });

  it('所有配置都返回 <=1 时，rowSpan/colSpan 返回默认值 1', () => {
    const merged = combineMerge<RecordT>({ rowSpan: createColMerge(() => 1) }, { colSpan: createColMerge(() => 1) });
    expect(merged.rowSpan?.(dataSource[0], 0, columns[0], dataSource)).toBe(1);
    expect(merged.colSpan?.(dataSource[0], 0, columns[0], dataSource)).toBe(1);
  });
});

describe('cellMerge / calculateMergeState', () => {
  it('无 cellMerge 时返回空 Map', () => {
    const map = calculateMergeState(dataSource, columns);
    expect(map.size).toBe(0);
  });

  it('计算所有单元格的合并状态：被合并行标记 merged=true', () => {
    const rowMerge = createRowMerge<RecordT>('category');
    const map = calculateMergeState(dataSource, columns, { rowSpan: rowMerge });

    // (0,0) 起始行 rowSpan=3
    expect(map.get('0-0')?.rowSpan).toBe(3);
    expect(map.get('0-0')?.merged).toBeUndefined();
    // (1,0) 被合并 rowSpan=0 → merged=true
    expect(map.get('1-0')?.rowSpan).toBe(0);
    expect(map.get('1-0')?.merged).toBe(true);
    // (3,0) B 组起始 rowSpan=2
    expect(map.get('3-0')?.rowSpan).toBe(2);
  });

  it('同时计算 rowSpan 和 colSpan', () => {
    const map = calculateMergeState(dataSource, columns, {
      rowSpan: createRowMerge<RecordT>('category'),
      colSpan: createColMerge<RecordT>(() => 2),
    });
    const state = map.get('0-0');
    expect(state?.rowSpan).toBe(3);
    expect(state?.colSpan).toBe(2);
  });
});

describe('cellMerge / getCellMergeProps', () => {
  it('无 cellMerge 时返回空对象', () => {
    expect(getCellMergeProps(dataSource[0], 0, columns[0], dataSource)).toEqual({});
  });

  it('返回 rowSpan/colSpan 属性', () => {
    const props = getCellMergeProps(dataSource[0], 0, columns[0], dataSource, {
      rowSpan: createRowMerge<RecordT>('category'),
    });
    expect(props).toEqual({ rowSpan: 3 });
  });

  it('同时返回 rowSpan 和 colSpan', () => {
    const props = getCellMergeProps(dataSource[0], 0, columns[0], dataSource, {
      rowSpan: createRowMerge<RecordT>('category'),
      colSpan: createColMerge<RecordT>(() => 2),
    });
    expect(props).toEqual({ rowSpan: 3, colSpan: 2 });
  });
});
