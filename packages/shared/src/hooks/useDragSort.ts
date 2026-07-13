/**
 * @lania-pro-components/shared
 *
 * useDragSort — 拖拽排序 Hook
 *
 * 为表格 / 列表提供基于 HTML5 Drag and Drop API 的行拖拽排序能力：
 * - 两种拖拽模式：'handle'（拖拽手柄）/ 'row'（整行可拖拽）
 * - 灵活的禁用策略：全局禁用 / 按行禁用 / 函数动态判断
 * - 数据源变化时自动同步（基于 getRowKey 判断是否需要重置排序）
 * - 拖拽视觉反馈：拖拽中行半透明、悬停目标行高亮
 * - 提供 getDragRowProps / getDragHandleProps 两个 props 注入器，
 *   可无缝接入 Arco Table 或自定义列表
 *
 * @example
 * ```tsx
 * const { sortedDataSource, getDragRowProps, getDragHandleProps } = useDragSort({
 *   dataSource,
 *   enabled: true,
 *   getRowKey: (row) => row.id,
 *   config: {
 *     type: 'handle',
 *     onDragSortEnd: (next, prev) => updateSortApi(next),
 *     disabled: (record, index) => record.locked,
 *   },
 * });
 *
 * <Table
 *   data={sortedDataSource}
 *   columns={[..., { render: (_, i) => <span {...getDragHandleProps(i)}>⠿</span> }]}
 * />
 * ```
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

/**
 * 拖拽排序配置
 */
export interface DragSortConfig<T = Record<string, unknown>> {
  /** 拖拽模式：'handle' 通过手柄拖拽，'row' 整行可拖拽（默认 'handle'） */
  type?: 'handle' | 'row';
  /** 自定义拖拽手柄的渲染（type='handle' 时使用） */
  handleRender?: () => ReactNode;
  /** 拖拽结束回调，返回新顺序与原始顺序便于差异比较与提交后端 */
  onDragSortEnd?: (newDataSource: T[], oldDataSource: T[]) => void;
  /** 禁用策略：true 全局禁用 / 函数按行动态判断 */
  disabled?: boolean | ((record: T, index: number) => boolean);
}

/**
 * 拖拽过程状态
 */
export interface DragState {
  /** 当前正在拖拽的行索引，null 表示未拖拽 */
  draggingIndex: number | null;
  /** 当前悬停的目标行索引，用于高亮反馈 */
  overIndex: number | null;
  /** 是否处于拖拽中 */
  isDragging: boolean;
}

/**
 * useDragSort 返回值
 */
export interface UseDragSortReturn<T = Record<string, unknown>> {
  /** 当前拖拽状态 */
  dragState: DragState;
  /** 排序后的数据源（拖拽过程中实时更新） */
  sortedDataSource: T[];
  /** 拖拽开始事件（索引） */
  handleDragStart: (index: number) => void;
  /** 拖拽悬停事件（索引），用于高亮目标行 */
  handleDragOver: (index: number) => void;
  /** 拖拽结束事件，重置状态 */
  handleDragEnd: () => void;
  /** 拖拽放置事件（目标索引），执行实际排序 */
  handleDrop: (targetIndex: number) => void;
  /** 获取整行拖拽属性（type='row' 模式下注入到 <tr>） */
  getDragRowProps: (
    index: number,
    record: T,
  ) => {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onDrop: (e: React.DragEvent) => void;
    style: React.CSSProperties;
  };
  /** 获取拖拽手柄属性（type='handle' 模式下注入到手柄元素） */
  getDragHandleProps: (index: number) => {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    style: React.CSSProperties;
    className: string;
  };
  /** 重置排序为原始顺序 */
  resetSort: () => void;
  /** 外部强制设置排序后的数据源 */
  setDataSource: (data: T[]) => void;
}

/**
 * 拖拽排序 Hook
 *
 * @param options.dataSource - 原始数据源
 * @param options.config - 拖拽配置
 * @param options.enabled - 是否启用拖拽（默认 false）
 * @param options.getRowKey - 行唯一标识函数，用于检测数据源是否变化
 * @returns 拖拽状态、排序后数据源与事件注入器
 */
export function useDragSort<T = Record<string, unknown>>(options: {
  dataSource: T[];
  config?: DragSortConfig<T>;
  enabled?: boolean;
  getRowKey: (record: T) => string | number;
}): UseDragSortReturn<T> {
  const { dataSource, config, enabled = false, getRowKey } = options;

  const { type = 'handle', onDragSortEnd, disabled } = config || {};

  const [sortedDataSource, setSortedDataSource] = useState<T[]>(dataSource);
  const [dragState, setDragState] = useState<DragState>({
    draggingIndex: null,
    overIndex: null,
    isDragging: false,
  });

  // 保留原始数据源引用，用于 resetSort 和数据源变化检测
  const originalDataSourceRef = useRef<T[]>(dataSource);
  // 保留当前排序后的引用，避免闭包捕获旧值
  const sortedDataSourceRef = useRef<T[]>(dataSource);

  // 数据源变化检测：基于 getRowKey 对比新旧，若不同则重置排序状态
  useEffect(() => {
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

  /**
   * 判断指定行是否禁用拖拽
   *
   * 综合考虑全局 enabled 开关与按行 disabled 策略。
   */
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

  /**
   * 拖拽开始：记录起始索引，进入拖拽中状态
   */
  const handleDragStart = useCallback((index: number) => {
    setDragState({
      draggingIndex: index,
      overIndex: null,
      isDragging: true,
    });
  }, []);

  /**
   * 拖拽悬停：更新目标索引用于高亮反馈
   */
  const handleDragOver = useCallback((index: number) => {
    setDragState((prev) => ({
      ...prev,
      overIndex: index,
    }));
  }, []);

  /**
   * 拖拽结束：清空状态（不论是否完成放置）
   */
  const handleDragEnd = useCallback(() => {
    setDragState({
      draggingIndex: null,
      overIndex: null,
      isDragging: false,
    });
  }, []);

  /**
   * 拖拽放置：执行实际排序逻辑
   *
   * 从 draggingIndex 取出被拖拽项，插入到 targetIndex 位置，
   * 更新数据源并回调 onDragSortEnd。若起止位置相同则仅重置状态。
   */
  const handleDrop = useCallback(
    (targetIndex: number) => {
      const { draggingIndex } = dragState;

      if (draggingIndex === null || draggingIndex === targetIndex) {
        handleDragEnd();
        return;
      }

      const newDataSource = [...sortedDataSourceRef.current];
      const [movedItem] = newDataSource.splice(draggingIndex, 1);
      newDataSource.splice(targetIndex, 0, movedItem);

      setSortedDataSource(newDataSource);
      sortedDataSourceRef.current = newDataSource;

      if (onDragSortEnd) {
        onDragSortEnd(newDataSource, originalDataSourceRef.current);
      }

      handleDragEnd();
    },
    [dragState, onDragSortEnd, handleDragEnd],
  );

  /**
   * 获取整行拖拽属性（type='row' 模式）
   *
   * 将 draggable / onDragStart / onDragOver / onDrop / 样式 注入到行容器，
   * 提供拖拽中半透明、悬停目标高亮等视觉反馈。
   */
  const getDragRowProps = useCallback(
    (index: number, record: T) => {
      const disabled = isDisabled(record, index);

      return {
        draggable: type === 'row' && !disabled,
        onDragStart: (e: React.DragEvent) => {
          if (!disabled) {
            // Firefox 要求必须调用 setData 才能开始拖拽
            e.dataTransfer.setData('text/plain', '');
            e.dataTransfer.effectAllowed = 'move';
            handleDragStart(index);
          }
        },
        onDragOver: (e: React.DragEvent) => {
          // 必须 preventDefault 才能触发 onDrop
          e.preventDefault();
          if (!disabled && dragState.isDragging) {
            e.dataTransfer.dropEffect = 'move';
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

  /**
   * 获取拖拽手柄属性（type='handle' 模式）
   *
   * 仅手柄元素 draggable=true，整行不可拖拽。
   * 适用于行内有可点击元素（按钮、链接）的场景，避免误触。
   */
  const getDragHandleProps = useCallback(
    (index: number) => {
      const record = sortedDataSourceRef.current[index];
      const disabled = isDisabled(record, index);

      return {
        draggable: !disabled,
        onDragStart: (e: React.DragEvent) => {
          if (!disabled) {
            // Firefox 要求必须调用 setData 才能开始拖拽
            e.dataTransfer.setData('text/plain', '');
            e.dataTransfer.effectAllowed = 'move';
            handleDragStart(index);
          }
        },
        onDragEnd: handleDragEnd,
        style: {
          cursor: disabled ? 'not-allowed' : 'move',
          opacity: disabled ? 0.5 : 1,
          userSelect: 'none',
        } satisfies React.CSSProperties,
        className: 'pro-table-drag-handle',
      };
    },
    [isDisabled, handleDragStart, handleDragEnd],
  );

  /**
   * 重置排序为原始数据源顺序
   */
  const resetSort = useCallback(() => {
    setSortedDataSource(originalDataSourceRef.current);
    sortedDataSourceRef.current = originalDataSourceRef.current;
  }, []);

  /**
   * 外部强制设置排序后的数据源（用于服务端排序场景）
   */
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
