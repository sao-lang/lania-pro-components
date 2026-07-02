import type { ReactNode } from 'react';
import type { ProColumnType } from '../types';

/**
 * 单元格合并配置
 */
export interface CellMergeConfig<T = any> {
  /** 行合并配置 */
  rowSpan?: (
    record: T,
    index: number,
    column: ProColumnType<T>,
    dataSource: T[],
  ) => number | { rowSpan: number; content?: ReactNode };
  /** 列合并配置 */
  colSpan?: (
    record: T,
    index: number,
    column: ProColumnType<T>,
    dataSource: T[],
  ) => number | { colSpan: number; content?: ReactNode };
}

/**
 * 合并状态
 */
export interface MergeState {
  /** 行合并数 */
  rowSpan?: number;
  /** 列合并数 */
  colSpan?: number;
  /** 是否被合并（不显示） */
  merged?: boolean;
}

/**
 * 创建行合并函数
 * 根据指定字段值相同的行进行合并
 *
 * @example
 * ```tsx
 * const rowMerge = createRowMerge('category');
 * <ProTable
 *   cellMerge={{ rowSpan: rowMerge }}
 * />
 * ```
 */
export function createRowMerge<T>(
  dataIndex: string | string[],
): (record: T, index: number, column: ProColumnType<T>, dataSource: T[]) => number {
  return (record: T, index: number, column: ProColumnType<T>, dataSource: T[]) => {
    // 获取字段值
    const getValue = (r: T) => {
      if (Array.isArray(dataIndex)) {
        return dataIndex.reduce((obj, key) => obj?.[key], r as any);
      }
      return (r as any)[dataIndex];
    };

    const currentValue = getValue(record);

    // 检查是否是合并组的起始行
    if (index > 0) {
      const prevValue = getValue(dataSource[index - 1]);
      if (currentValue === prevValue) {
        // 不是起始行，返回 0 表示被合并
        return 0;
      }
    }

    // 计算合并行数
    let rowSpan = 1;
    for (let i = index + 1; i < dataSource.length; i++) {
      const nextValue = getValue(dataSource[i]);
      if (nextValue === currentValue) {
        rowSpan++;
      } else {
        break;
      }
    }

    return rowSpan;
  };
}

/**
 * 创建列合并函数
 * 根据条件合并列
 *
 * @example
 * ```tsx
 * const colMerge = createColMerge((record, index) => {
 *   return record.type === 'summary' ? 2 : 1;
 * });
 * <ProTable
 *   cellMerge={{ colSpan: colMerge }}
 * />
 * ```
 */
export function createColMerge<T>(
  condition: (record: T, index: number, column: ProColumnType<T>) => number,
): (record: T, index: number, column: ProColumnType<T>, dataSource: T[]) => number {
  return (record: T, index: number, column: ProColumnType<T>) => condition(record, index, column);
}

/**
 * 组合多个合并配置
 * 按顺序应用多个合并函数
 *
 * @example
 * ```tsx
 * const merged = combineMerge(
 *   { rowSpan: createRowMerge('category') },
 *   { colSpan: createColMerge((r) => r.type === 'summary' ? 2 : 1) }
 * );
 * ```
 */
export function combineMerge<T>(...configs: CellMergeConfig<T>[]): CellMergeConfig<T> {
  return {
    rowSpan: (record, index, column, dataSource) => {
      for (const config of configs) {
        if (config.rowSpan) {
          const result = config.rowSpan(record, index, column, dataSource);
          if (result && (typeof result === 'number' ? result > 1 : result.rowSpan > 1)) {
            return result;
          }
        }
      }
      return 1;
    },
    colSpan: (record, index, column, dataSource) => {
      for (const config of configs) {
        if (config.colSpan) {
          const result = config.colSpan(record, index, column, dataSource);
          if (result && (typeof result === 'number' ? result > 1 : result.colSpan > 1)) {
            return result;
          }
        }
      }
      return 1;
    },
  };
}

/**
 * 计算单元格合并状态
 * 用于表格渲染时确定每个单元格的合并状态
 */
export function calculateMergeState<T>(
  dataSource: T[],
  columns: ProColumnType<T>[],
  cellMerge?: CellMergeConfig<T>,
): Map<string, MergeState> {
  const mergeStateMap = new Map<string, MergeState>();

  if (!cellMerge) {
    return mergeStateMap;
  }

  dataSource.forEach((record, rowIndex) => {
    columns.forEach((column, colIndex) => {
      const key = `${rowIndex}-${colIndex}`;
      const state: MergeState = {};

      // 计算行合并
      if (cellMerge.rowSpan) {
        const rowSpanResult = cellMerge.rowSpan(record, rowIndex, column, dataSource);
        if (typeof rowSpanResult === 'number') {
          state.rowSpan = rowSpanResult;
          if (rowSpanResult === 0) {
            state.merged = true;
          }
        } else {
          state.rowSpan = rowSpanResult.rowSpan;
          if (rowSpanResult.rowSpan === 0) {
            state.merged = true;
          }
        }
      }

      // 计算列合并
      if (cellMerge.colSpan) {
        const colSpanResult = cellMerge.colSpan(record, rowIndex, column, dataSource);
        if (typeof colSpanResult === 'number') {
          state.colSpan = colSpanResult;
        } else {
          state.colSpan = colSpanResult.colSpan;
        }
      }

      if (state.rowSpan !== undefined || state.colSpan !== undefined) {
        mergeStateMap.set(key, state);
      }
    });
  });

  return mergeStateMap;
}

/**
 * 获取单元格的 onCell 属性
 * 用于 Arco Table 的 onCell 配置
 */
export function getCellMergeProps<T>(
  record: T,
  index: number,
  column: ProColumnType<T>,
  dataSource: T[],
  cellMerge?: CellMergeConfig<T>,
): { rowSpan?: number; colSpan?: number } {
  if (!cellMerge) {
    return {};
  }

  const props: { rowSpan?: number; colSpan?: number } = {};

  if (cellMerge.rowSpan) {
    const result = cellMerge.rowSpan(record, index, column, dataSource);
    if (typeof result === 'number') {
      props.rowSpan = result;
    } else {
      props.rowSpan = result.rowSpan;
    }
  }

  if (cellMerge.colSpan) {
    const result = cellMerge.colSpan(record, index, column, dataSource);
    if (typeof result === 'number') {
      props.colSpan = result;
    } else {
      props.colSpan = result.colSpan;
    }
  }

  return props;
}

export default {
  createRowMerge,
  createColMerge,
  combineMerge,
  calculateMergeState,
  getCellMergeProps,
};
