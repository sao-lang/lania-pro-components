import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

/**
 * 拖拽排序配置
 */
export interface DragSortConfig<T = any> {
  /** 拖拽类型：handle（拖拽句柄）或 row（整行拖拽） */
  type?: 'handle' | 'row';
  /** 自定义拖拽句柄渲染 */
  handleRender?: () => ReactNode;
  /** 拖拽完成回调 */
  onDragSortEnd?: (newDataSource: T[], oldDataSource: T[]) => void;
  /** 是否禁用拖拽 */
  disabled?: boolean | ((record: T, index: number) => boolean);
}

/**
 * 拖拽状态
 */
export interface DragState {
  /** 正在拖拽的行索引 */
  draggingIndex: number | null;
  /** 拖拽经过的行索引 */
  overIndex: number | null;
  /** 是否正在拖拽 */
  isDragging: boolean;
}

/**
 * 拖拽排序 Hook 返回类型
 */
export interface UseDragSortReturn<T = any> {
  /** 拖拽状态 */
  dragState: DragState;
  /** 排序后的数据源 */
  sortedDataSource: T[];
  /** 拖拽开始处理 */
  handleDragStart: (index: number) => void;
  /** 拖拽经过处理 */
  handleDragOver: (index: number) => void;
  /** 拖拽结束处理 */
  handleDragEnd: () => void;
  /** 放置处理 */
  handleDrop: (targetIndex: number) => void;
  /** 获取拖拽行属性 */
  getDragRowProps: (
    index: number,
    record: T,
  ) => {
    draggable: boolean;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onDrop: (e: React.DragEvent) => void;
    style: React.CSSProperties;
  };
  /** 获取拖拽句柄属性 */
  getDragHandleProps: (index: number) => {
    draggable: boolean;
    onDragStart: () => void;
    style: React.CSSProperties;
    className: string;
  };
  /** 重置排序 */
  resetSort: () => void;
  /** 设置数据源 */
  setDataSource: (data: T[]) => void;
}

/**
 * 拖拽排序 Hook
 *
 * 用于实现表格行的拖拽排序功能
 *
 * @example
 * ```tsx
 * const { sortedDataSource, getDragRowProps, getDragHandleProps, dragState } = useDragSort({
 *   dataSource: tableData,
 *   config: { type: 'handle', onDragSortEnd: handleSortEnd },
 *   enabled: true,
 * });
 *
 * // 在表格行中使用
 * <tr {...getDragRowProps(index, record)}>
 *   <td><span {...getDragHandleProps(index)}>⋮⋮</span></td>
 *   ...
 * </tr>
 * ```
 */
export function useDragSort<T = any>(options: {
  /** 数据源 */
  dataSource: T[];
  /** 拖拽排序配置 */
  config?: DragSortConfig<T>;
  /** 是否启用拖拽排序 */
  enabled?: boolean;
  /** 行 key 获取函数 */
  getRowKey: (record: T) => string | number;
}): UseDragSortReturn<T> {
  const { dataSource, config, enabled = false, getRowKey } = options;

  const { type = 'handle', onDragSortEnd, disabled } = config || {};

  // 排序后的数据源
  const [sortedDataSource, setSortedDataSource] = useState<T[]>(dataSource);
  // 拖拽状态
  const [dragState, setDragState] = useState<DragState>({
    draggingIndex: null,
    overIndex: null,
    isDragging: false,
  });

  // 使用 ref 保存原始数据源，用于比较
  const originalDataSourceRef = useRef<T[]>(dataSource);
  const sortedDataSourceRef = useRef<T[]>(dataSource);

  // 当外部数据源变化时更新
  useEffect(() => {
    // 只有当数据源真正变化时才更新
    const isDifferent =
      dataSource.length !== originalDataSourceRef.current.length ||
      dataSource.some((item, index) => {
        const originalItem = originalDataSourceRef.current[index];
        return getRowKey(item) !== getRowKey(originalItem);
      });

    if (isDifferent) {
      originalDataSourceRef.current = dataSource;
      setSortedDataSource(dataSource);
      sortedDataSourceRef.current = dataSource;
    }
  }, [dataSource, getRowKey]);

  // 检查某行是否禁用拖拽
  const isDisabled = useCallback(
    (record: T, index: number): boolean => {
      if (!enabled) {
        return true;
      }
      if (typeof disabled === 'function') {
        return disabled(record, index);
      }
      return !!disabled;
    },
    [enabled, disabled],
  );

  // 拖拽开始
  const handleDragStart = useCallback((index: number) => {
    setDragState({
      draggingIndex: index,
      overIndex: null,
      isDragging: true,
    });
  }, []);

  // 拖拽经过
  const handleDragOver = useCallback((index: number) => {
    setDragState((prev) => ({
      ...prev,
      overIndex: index,
    }));
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setDragState({
      draggingIndex: null,
      overIndex: null,
      isDragging: false,
    });
  }, []);

  // 放置处理
  const handleDrop = useCallback(
    (targetIndex: number) => {
      const { draggingIndex } = dragState;

      if (draggingIndex === null || draggingIndex === targetIndex) {
        handleDragEnd();
        return;
      }

      // 创建新的排序数组
      const newDataSource = [...sortedDataSourceRef.current];
      const [movedItem] = newDataSource.splice(draggingIndex, 1);
      newDataSource.splice(targetIndex, 0, movedItem);

      // 更新状态
      setSortedDataSource(newDataSource);
      sortedDataSourceRef.current = newDataSource;

      // 触发回调
      if (onDragSortEnd) {
        onDragSortEnd(newDataSource, originalDataSourceRef.current);
      }

      handleDragEnd();
    },
    [dragState, onDragSortEnd, handleDragEnd],
  );

  // 获取拖拽行属性
  const getDragRowProps = useCallback(
    (index: number, record: T) => {
      const disabled = isDisabled(record, index);

      return {
        draggable: type === 'row' && !disabled,
        onDragStart: () => {
          if (!disabled) {
            handleDragStart(index);
          }
        },
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault();
          if (!disabled && dragState.isDragging) {
            handleDragOver(index);
          }
        },
        onDragEnd: handleDragEnd,
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          if (!disabled) {
            handleDrop(index);
          }
        },
        style: {
          opacity: dragState.draggingIndex === index ? 0.5 : 1,
          backgroundColor:
            dragState.overIndex === index && dragState.draggingIndex !== index ? 'rgba(22, 93, 255, 0.1)' : undefined,
          cursor: type === 'row' && !disabled ? 'move' : 'default',
        } satisfies React.CSSProperties,
      };
    },
    [type, isDisabled, dragState, handleDragStart, handleDragOver, handleDragEnd, handleDrop],
  );

  // 获取拖拽句柄属性
  const getDragHandleProps = useCallback(
    (index: number) => {
      const record = sortedDataSourceRef.current[index];
      const disabled = isDisabled(record, index);

      return {
        draggable: !disabled,
        onDragStart: () => {
          if (!disabled) {
            handleDragStart(index);
          }
        },
        style: {
          cursor: disabled ? 'not-allowed' : 'move',
          opacity: disabled ? 0.5 : 1,
          userSelect: 'none',
        } satisfies React.CSSProperties,
        className: 'pro-table-drag-handle',
      };
    },
    [isDisabled, handleDragStart],
  );

  // 重置排序
  const resetSort = useCallback(() => {
    setSortedDataSource(originalDataSourceRef.current);
    sortedDataSourceRef.current = originalDataSourceRef.current;
  }, []);

  // 设置数据源
  const setDataSource = useCallback((data: T[]) => {
    setSortedDataSource(data);
    sortedDataSourceRef.current = data;
  }, []);

  return {
    dragState,
    sortedDataSource,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    getDragRowProps,
    getDragHandleProps,
    resetSort,
    setDataSource,
  };
}

export default useDragSort;
