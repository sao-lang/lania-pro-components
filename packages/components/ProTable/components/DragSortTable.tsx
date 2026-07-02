import React, { useState, useCallback } from 'react';
import { Table, Space } from '@arco-design/web-react';
import { IconDragArrow } from '@arco-design/web-react/icon';
import type { TableProps, TableColumnProps } from '@arco-design/web-react';
import { useDragSort } from '../hooks/useDragSort';

export interface DragSortTableProps<T = any> extends Omit<TableProps<T>, 'data' | 'onChange'> {
  /** 数据源 */
  dataSource: T[];
  /** 表格列配置 */
  columns: TableColumnProps<T>[];
  /** 拖拽完成回调 */
  onDragSortEnd?: (newDataSource: T[], oldDataSource: T[]) => void;
  /** 拖拽类型：handle（拖拽句柄）或 row（整行拖拽） */
  dragSortType?: 'handle' | 'row';
  /** 是否禁用拖拽 */
  dragSortDisabled?: boolean | ((record: T, index: number) => boolean);
  /** 自定义拖拽句柄渲染 */
  dragHandleRender?: () => React.ReactNode;
  /** 行 key 获取函数 */
  rowKey: string | ((record: T) => string | number);
  /** 数据变化回调（受控模式） */
  onDataSourceChange?: (dataSource: T[]) => void;
}

/**
 * 拖拽排序表格组件
 * 
 * 封装了拖拽排序功能的表格组件，支持两种拖拽模式：
 * - handle：通过拖拽句柄进行排序
 * - row：整行拖拽排序
 * 
 * @example
 * ```tsx
 * // 拖拽句柄模式
 * <DragSortTable
 *   columns={columns}
 *   dataSource={data}
 *   rowKey="id"
 *   dragSortType="handle"
 *   onDragSortEnd={(newData, oldData) => {
 *     console.log('排序完成', newData);
 *   }}
 * />
 * 
 * // 整行拖拽模式
 * <DragSortTable
 *   columns={columns}
 *   dataSource={data}
 *   rowKey="id"
 *   dragSortType="row"
 * />
 * 
 * // 受控模式
 * <DragSortTable
 *   columns={columns}
   dataSource={data}
 *   rowKey="id"
 *   onDataSourceChange={setData}
 * />
 * ```
 */
export const DragSortTable = <T extends Record<string, any>>({
  dataSource,
  columns,
  onDragSortEnd,
  dragSortType = 'handle',
  dragSortDisabled = false,
  dragHandleRender,
  rowKey,
  onDataSourceChange,
  ...restProps
}: DragSortTableProps<T>) => {
  // 内部状态（非受控模式）
  const [innerDataSource, setInnerDataSource] = useState<T[]>(dataSource);

  // 判断是否受控
  const isControlled = onDataSourceChange !== undefined;
  const currentDataSource = isControlled ? dataSource : innerDataSource;

  // 获取行 key 的函数
  const getRowKey = useCallback(
    (record: T): string | number => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return record[rowKey];
    },
    [rowKey],
  );

  // 使用拖拽排序 Hook
  const { sortedDataSource, getDragRowProps, getDragHandleProps, dragState } = useDragSort<T>({
    dataSource: currentDataSource,
    config: {
      type: dragSortType,
      onDragSortEnd: (newData, oldData) => {
        if (!isControlled) {
          setInnerDataSource(newData);
        }
        onDragSortEnd?.(newData, oldData);
        onDataSourceChange?.(newData);
      },
      disabled: dragSortDisabled,
      handleRender: dragHandleRender,
    },
    enabled: true,
    getRowKey,
  });

  // 渲染拖拽句柄
  const defaultDragHandleRender = () => (
    <IconDragArrow
      style={{
        cursor: 'move',
        color: '#86909c',
        fontSize: 16,
      }}
    />
  );

  // 添加拖拽列
  const dragColumn: TableColumnProps<T> = {
    title: '排序',
    key: 'drag-handle',
    width: 60,
    align: 'center',
    fixed: 'left',
    render: (_: any, record: T, index: number) => {
      const handleProps = getDragHandleProps(index);
      const isDragging = dragState.draggingIndex === index;

      return (
        <span
          {...handleProps}
          style={{
            ...handleProps.style,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            borderRadius: 4,
            backgroundColor: isDragging ? '#e8f4ff' : 'transparent',
            transition: 'background-color 0.2s',
          }}
        >
          {dragHandleRender ? dragHandleRender() : defaultDragHandleRender()}
        </span>
      );
    },
  };

  // 合并列配置
  const mergedColumns: TableColumnProps<T>[] =
    dragSortType === 'handle'
      ? [dragColumn, ...columns]
      : columns.map((col, index) => {
          if (index === 0) {
            return {
              ...col,
              render: (value: any, record: T, rowIndex: number) => {
                const isDragging = dragState.draggingIndex === rowIndex;
                const dragIcon = (
                  <span
                    {...getDragHandleProps(rowIndex)}
                    style={{
                      marginRight: 8,
                      cursor: 'move',
                      color: '#86909c',
                      opacity: isDragging ? 0.5 : 1,
                    }}
                  >
                    {dragHandleRender ? dragHandleRender() : defaultDragHandleRender()}
                  </span>
                );

                const originalRender = col.render;
                const renderedValue = originalRender ? originalRender(value, record, rowIndex) : value;

                return (
                  <Space>
                    {dragIcon}
                    {renderedValue}
                  </Space>
                );
              },
            };
          }
          return col;
        });

  // 处理行属性
  const handleOnRow = (record: T, index: number) => {
    const dragRowProps = getDragRowProps(index, record);
    const originalOnRow = restProps.onRow;
    const originalRowProps = originalOnRow?.(record, index);

    return {
      ...originalRowProps,
      draggable: dragRowProps.draggable,
      onDragStart: dragRowProps.onDragStart,
      onDragOver: dragRowProps.onDragOver,
      onDragEnd: dragRowProps.onDragEnd,
      onDrop: dragRowProps.onDrop,
      style: {
        ...originalRowProps?.style,
        ...dragRowProps.style,
      },
      className: [
        originalRowProps?.className,
        dragState.draggingIndex === index ? 'dragging-row' : '',
        dragState.overIndex === index && dragState.draggingIndex !== index ? 'drag-over-row' : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  };

  return (
    <div className='drag-sort-table-wrapper'>
      <style>{`
        .drag-sort-table-wrapper .dragging-row {
          opacity: 0.5;
          background-color: #f2f3f5;
        }
        .drag-sort-table-wrapper .drag-over-row {
          background-color: rgba(22, 93, 255, 0.1);
          border-top: 2px solid #165dff;
        }
        .drag-sort-table-wrapper .pro-table-drag-handle {
          user-select: none;
        }
        .drag-sort-table-wrapper .pro-table-drag-handle:hover {
          color: #165dff !important;
        }
      `}</style>
      <Table {...restProps} data={sortedDataSource} columns={mergedColumns} onRow={handleOnRow} rowKey={rowKey} />
    </div>
  );
};

export default DragSortTable;
