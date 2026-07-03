/**
 * TableRenderer — 表格渲染器
 *
 * 负责将 ProTable 的数据和列配置转换为 Arco Design Table 组件：
 * - 列转换（ProColumnType → Arco TableColumnProps）
 * - 行选择（checkbox/radio）
 * - 行展开/行操作按钮列
 * - 拖拽行句柄
 * - 骨架屏/空状态/加载状态
 * - 单元格合并
 */
/**
 * TableRenderer — 表格渲染器组件
 *
 * 核心渲染组件：
 * 1. 从 DataContext/ColumnContext/RootContext 读取合并后的配置
 * 2. 使用 convertColumns 将 ProColumnType 转换为 Arco TableColumnProps
 * 3. 注入行选择、行展开、行操作按钮列
 * 4. 根据状态渲染不同内容：loading → SkeletonTable | error → 错误提示 | empty → Empty
 * 5. 支持拖拽行、可编辑表格、单元格合并
 * 6. 通过 ProTableActionType 暴露命令式操作方法
 */
import React, { useMemo } from 'react';
import { Table, Spin, ConfigProvider, Empty } from '@arco-design/web-react';
import type { TableProps, PaginationProps } from '@arco-design/web-react';
import { useDataContext, useColumnContext, useRootContext } from '../context';
import { convertColumns } from '../utils/columnRender';
import { SkeletonTable } from '../components';
import type { ProTableRowSelectionConfig, ProTableNEventHandlers, ProTableProps, ProColumnType } from '../types';
import type { TableColumnProps } from '@arco-design/web-react';
import { getCellMergeProps } from '../utils/cellMerge';

export interface TableRendererProps<T = Record<string, unknown>> {
  className?: string;
  style?: React.CSSProperties;
  emptyRender?: React.ReactNode | (() => React.ReactNode);
  dataSource?: T[];
  dragSort?: boolean;
  getDragRowProps?: (
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
  getDragHandleProps?: (index: number) => {
    draggable: boolean;
    onDragStart: () => void;
    style: React.CSSProperties;
    className: string;
  };
  handlers?: ProTableNEventHandlers<T>;
  refreshTable?: () => void;
  showSkeleton?: boolean;
  tableSummary?: {
    show?: boolean;
    render?: (records: T[]) => React.ReactNode;
  };
  stickyHeader?:
    | boolean
    | {
        offsetHeader?: number;
        offsetSummary?: number;
        getContainer?: () => HTMLElement;
      };
  cellMerge?: ProTableProps<T>['cellMerge'];
}

export const TableRenderer = <T extends Record<string, unknown>>(props: TableRendererProps<T>) => {
  const {
    className,
    style,
    emptyRender,
    dataSource: propDataSource,
    dragSort,
    getDragRowProps,
    getDragHandleProps,
    handlers,
    refreshTable,
    showSkeleton,
    tableSummary,
    // stickyHeader,
    cellMerge,
  } = props;

  const {
    dataSource: contextDataSource,
    loading,
    selectedRowKeys,
    selectedRows,
    setSelectedRows,
    setPage,
    setPageSize,
    setSorter,
    setFilters,
    action,
  } = useDataContext<T>();

  const dataSource = Array.isArray(propDataSource) && propDataSource.length > 0 ? propDataSource : contextDataSource;

  const { columns, density, groupColumns } = useColumnContext<T>();
  const { props: rootProps } = useRootContext<T>();

  const tableRootProps = rootProps as ProTableProps<T>;
  const {
    rowKey = 'id',
    bordered,
    scroll,
    expandedRowRender,
    expandProps,
    rowSelection: propRowSelection,
    onChange: onTableChange,
    onExpand,
    onExpandedRowsChange,
    ...restProps
  } = tableRootProps;

  const rootClassName = (tableRootProps as unknown as { className?: string }).className;
  const rootStyle = (tableRootProps as unknown as { style?: React.CSSProperties }).style;
  const tableClassName = className || rootClassName || '';
  const tableStyle = style || rootStyle;

  const rowSelectionConfig = useMemo<Record<string, unknown> | undefined>(() => {
    if (!propRowSelection) {
      return undefined;
    }

    const config: ProTableRowSelectionConfig<T> = typeof propRowSelection === 'object' ? propRowSelection : {};
    const { preserveSelectedRowKeys = false, checkCrossPage = false } = config;

    const arcoRowSelection: Record<string, unknown> = {
      type: config.type || 'checkbox',
      selectedRowKeys,
      onChange: (keys: (string | number)[], rows: T[]) => {
        if (preserveSelectedRowKeys || checkCrossPage) {
          const currentPageKeys = dataSource.map((record: T) =>
            typeof rowKey === 'function' ? rowKey(record) : (record[rowKey] as string | number),
          );

          const otherPageKeys = selectedRowKeys.filter((key) => !currentPageKeys.includes(key));
          const otherPageRows = selectedRows.filter((row: T) => {
            const rowKeyValue = typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] as string | number);
            return !currentPageKeys.includes(rowKeyValue);
          });

          const newKeys = [...otherPageKeys, ...keys];
          const newRows = [...otherPageRows, ...rows];

          setSelectedRows(newKeys, newRows);
          config.onChange?.(newKeys, newRows);
        } else {
          setSelectedRows(keys, rows);
          config.onChange?.(keys, rows);
        }
      },
    };

    if (config.getCheckboxProps) {
      arcoRowSelection.checkboxProps = config.getCheckboxProps;
    }
    if (config.columnWidth !== undefined) {
      arcoRowSelection.columnWidth = config.columnWidth;
    }
    if (config.columnTitle !== undefined) {
      arcoRowSelection.columnTitle = config.columnTitle;
    }
    if (config.fixed !== undefined) {
      arcoRowSelection.fixed = config.fixed === true ? 'left' : config.fixed || undefined;
    }

    return arcoRowSelection;
  }, [propRowSelection, selectedRowKeys, selectedRows, dataSource, rowKey, setSelectedRows]);

  const tableSize = useMemo(() => {
    switch (density) {
      case 'compact':
        return 'small' as const;
      case 'middle':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  }, [density]);

  const summaryRender = useMemo(() => {
    if (!tableSummary || !tableSummary.show || !tableSummary.render) {
      return undefined;
    }
    const renderFn = tableSummary.render;
    return () => renderFn(dataSource);
  }, [tableSummary, dataSource]);

  const tableColumns = useMemo<TableColumnProps<T>[]>(() => {
    const convertedColumns = convertColumns(
      columns,
      action,
      handlers as ProTableNEventHandlers<T> | undefined,
      refreshTable as (() => void) | undefined,
    );

    let finalColumns: TableColumnProps<T>[] = convertedColumns;

    if (groupColumns && groupColumns.length > 0) {
      finalColumns = groupColumns.map((group) => ({
        title: group.title,
        key: group.key,
        children: group.children.map((col) => {
          const convertedCol = convertedColumns.find((c) => String(c.dataIndex) === String(col.dataIndex));
          return convertedCol || col;
        }),
      })) as TableColumnProps<T>[];
    }

    if (cellMerge) {
      const addCellMerge = (cols: TableColumnProps<T>[]): TableColumnProps<T>[] => {
        return cols.map((col) => {
          if (col.children) {
            return {
              ...col,
              children: addCellMerge(col.children),
            };
          }
          const originalOnCell = col.onCell;
          return {
            ...col,
            onCell: (record: T, index: number) => {
              const mergeProps = getCellMergeProps(
                record,
                index,
                col as unknown as ProTableProps<T>['columns'][0],
                dataSource,
                cellMerge,
              );
              const originalProps = typeof originalOnCell === 'function' ? originalOnCell(record, index) : {};
              return { ...originalProps, ...mergeProps };
            },
          };
        });
      };
      finalColumns = addCellMerge(finalColumns);
    }

    if (dragSort && getDragHandleProps) {
      const dragHandleColumn: TableColumnProps<T> = {
        title: '',
        dataIndex: '__drag_handle__',
        width: 50,
        fixed: 'left',
        render: (_: unknown, __: T, index: number) => {
          const getPropsFn = getDragHandleProps as (index: number) => {
            draggable: boolean;
            onDragStart: () => void;
            style: React.CSSProperties;
            className: string;
          };
          const { draggable, onDragStart, className: dragClassName, style: dragStyle } = getPropsFn(index);
          return (
            <span
              draggable={draggable}
              onDragStart={onDragStart}
              className={dragClassName}
              style={{
                ...dragStyle,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
              }}
            >
              ⋮⋮
            </span>
          );
        },
      };
      return [dragHandleColumn, ...finalColumns];
    }

    return finalColumns;
  }, [columns, action, handlers, refreshTable, dragSort, getDragHandleProps, groupColumns, cellMerge, dataSource]);

  const handleTableChange = (
    pagination: PaginationProps,
    sorter: { field: string; direction: 'ascend' | 'descend' } | { field: string; direction: 'ascend' | 'descend' }[],
    filters: Partial<Record<keyof T, string[]>>,
    extra: { action: 'sort' | 'filter' | 'paginate'; currentData: T[]; currentAllData: T[] },
  ) => {
    if (pagination.current !== undefined) {
      setPage(pagination.current);
    }
    if (pagination.pageSize !== undefined) {
      setPageSize(pagination.pageSize);
    }

    const sorterInfo = Array.isArray(sorter) ? sorter[0] : sorter;
    if (sorterInfo) {
      setSorter(sorterInfo.field, sorterInfo.direction);
    }

    if (filters) {
      setFilters(filters as Record<string, string[]>);
    }

    if (onTableChange) {
      onTableChange(pagination, sorterInfo, filters, extra);
    }
  };

  const renderEmpty = (): React.ReactNode => {
    if (!emptyRender) {
      return <Empty description='暂无数据' />;
    }
    if (typeof emptyRender === 'function') {
      return emptyRender();
    }
    return emptyRender;
  };

  const getRowProps = (record: T, index: number): Record<string, unknown> => {
    if (dragSort && getDragRowProps) {
      const getPropsFn = getDragRowProps as (index: number, record: T) => Record<string, unknown>;
      return getPropsFn(index, record);
    }
    return {};
  };

  if (loading && showSkeleton) {
    return (
      <SkeletonTable
        columns={columns as ProColumnType<Record<string, unknown>>[]}
        className={tableClassName}
        style={tableStyle}
      />
    );
  }

  return (
    <Spin loading={loading} style={{ width: '100%' }}>
      <ConfigProvider componentConfig={{ Table: { borderCell: bordered } }}>
        <Table<T>
          {...restProps}
          columns={tableColumns}
          data={dataSource}
          rowKey={rowKey}
          rowSelection={rowSelectionConfig as TableProps<T>['rowSelection']}
          onChange={handleTableChange as TableProps<T>['onChange']}
          onExpand={onExpand}
          onExpandedRowsChange={onExpandedRowsChange}
          scroll={scroll}
          className={`${tableClassName} pro-table-density-${density}`}
          style={tableStyle}
          size={tableSize}
          pagination={false}
          expandedRowRender={expandedRowRender}
          expandProps={expandProps}
          noDataElement={renderEmpty()}
          onRow={(_record, index) => getRowProps(_record, index || 0)}
          summary={summaryRender}
        />
      </ConfigProvider>
    </Spin>
  );
};
