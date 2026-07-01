import React, { useMemo, useCallback } from 'react';
import { Table, Spin, ConfigProvider, Empty } from '@arco-design/web-react';
import { useDataContext, useColumnContext, useRootContext } from '../context';
import { convertColumns } from '../utils/columnRender';
import type { ProColumnType, ProTableRowSelectionConfig, ProTableNEventHandlers } from '../types';
import type { TableColumnProps } from '@arco-design/web-react';

export interface TableRendererProps {
  className?: string;
  style?: React.CSSProperties;
  emptyRender?: React.ReactNode | (() => React.ReactNode);
  /** 数据源（用于虚拟滚动） */
  dataSource?: any[];
  /** 是否启用拖拽排序 */
  dragSort?: boolean;
  /** 获取拖拽行属性 */
  getDragRowProps?: (
    index: number,
    record: any,
  ) => {
    draggable: boolean;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onDrop: (e: React.DragEvent) => void;
    style: React.CSSProperties;
  };
  /** 获取拖拽句柄属性 */
  getDragHandleProps?: (index: number) => {
    draggable: boolean;
    onDragStart: () => void;
    style: React.CSSProperties;
    className: string;
  };
  /** 事件处理器 */
  handlers?: ProTableNEventHandlers;
  /** 刷新表格函数 */
  refreshTable?: () => void;
}

/**
 * TableRenderer - 表格渲染组件
 * 负责渲染数据表格，支持 valueType 渲染和行选择
 */
export const TableRenderer: React.FC<TableRendererProps> = ({
  className,
  style,
  emptyRender,
  dataSource: propDataSource,
  dragSort,
  getDragRowProps,
  getDragHandleProps,
  handlers,
  refreshTable,
}) => {
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
    pagination,
  } = useDataContext();

  // 使用传入的数据源或上下文数据源
  // 注意：只有当 propDataSource 确实是一个有效的数组（非空）时才使用它
  // 否则使用 contextDataSource
  const dataSource = propDataSource && propDataSource.length > 0 ? propDataSource : contextDataSource;

  const { columns, density } = useColumnContext();
  const { props, getRowKey } = useRootContext();

  const {
    rowKey = 'id',
    bordered,
    scroll,
    expandedRowRender,
    expandProps,
    rowSelection: propRowSelection,
    onChange,
    onExpand,
    onExpandedRowsChange,
    ...restProps
  } = props;

  // 行选择配置
  const rowSelectionConfig = useMemo(() => {
    if (!propRowSelection) {
      return undefined;
    }

    const config: ProTableRowSelectionConfig = typeof propRowSelection === 'object' ? propRowSelection : {};
    const { preserveSelectedRowKeys = false, checkCrossPage = false } = config;

    // 构建 Arco Table 的行选择配置
    const arcoRowSelection: {
      type: 'checkbox' | 'radio';
      selectedRowKeys: (string | number)[];
      onChange: (keys: (string | number)[], rows: unknown[]) => void;
      getCheckboxProps?: (record: any) => {
        disabled?: boolean;
        indeterminate?: boolean;
      };
      columnWidth?: number;
      columnTitle?: React.ReactNode;
      fixed?: 'left' | 'right';
      selections?: Array<{
        key: string;
        text: React.ReactNode;
        onSelect?: (changeableRowKeys: (string | number)[]) => void;
      }>;
    } = {
      type: config.type || 'checkbox',
      selectedRowKeys,
      onChange: (keys: (string | number)[], rows: unknown[]) => {
        // 处理跨页选择
        if (preserveSelectedRowKeys || checkCrossPage) {
          // 获取当前页的数据 key
          const currentPageKeys = dataSource.map((record: Record<string, unknown>) =>
            typeof rowKey === 'function' ? rowKey(record) : (record[rowKey] as string | number),
          );

          // 过滤掉当前页已取消选择的数据
          const otherPageKeys = selectedRowKeys.filter((key) => !currentPageKeys.includes(key));
          const otherPageRows = selectedRows.filter((row: Record<string, unknown>) => {
            const rowKeyValue = typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] as string | number);
            return !currentPageKeys.includes(rowKeyValue);
          });

          // 合并当前页选择和其他页选择
          const newKeys = [...otherPageKeys, ...keys];
          const newRows = [...otherPageRows, ...rows];

          setSelectedRows(newKeys, newRows as Record<string, unknown>[]);
          config.onChange?.(newKeys, newRows as Record<string, unknown>[]);
        } else {
          setSelectedRows(keys, rows as Record<string, unknown>[]);
          config.onChange?.(keys, rows as Record<string, unknown>[]);
        }
      },
    };

    if (config.getCheckboxProps) {
      arcoRowSelection.getCheckboxProps = config.getCheckboxProps;
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
    if (config.selections !== undefined) {
      arcoRowSelection.selections = config.selections;
    }

    return arcoRowSelection;
  }, [propRowSelection, selectedRowKeys, selectedRows, dataSource, rowKey, setSelectedRows]);

  // 表格大小
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

  // 转换列为 Arco Table 格式（使用新的列渲染系统）
  const tableColumns = useMemo<TableColumnProps<any>[]>(() => {
    const convertedColumns = convertColumns(columns, action, handlers, refreshTable);

    // 如果启用了拖拽排序，添加拖拽句柄列
    if (dragSort && getDragHandleProps) {
      const dragHandleColumn: TableColumnProps<any> = {
        title: '',
        dataIndex: '__drag_handle__',
        width: 50,
        fixed: 'left',
        render: (_: any, __: any, index: number) => {
          const dragProps = getDragHandleProps(index);
          return (
            <span
              {...dragProps}
              style={{
                ...dragProps.style,
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
      return [dragHandleColumn, ...convertedColumns];
    }

    return convertedColumns;
  }, [columns, action, handlers, refreshTable, dragSort, getDragHandleProps]);

  // 处理表格变化（排序、筛选、分页）
  const handleTableChange = (pageInfo: any, sorter: any, filters: any, extra: any) => {
    // 处理分页
    if (pageInfo) {
      setPage(pageInfo.current);
      setPageSize(pageInfo.pageSize);
    }

    // 处理排序
    if (sorter) {
      setSorter(sorter.field, sorter.direction);
    }

    // 处理筛选
    if (filters) {
      setFilters(filters);
    }

    // 调用用户传入的 onChange
    onChange?.(pageInfo, sorter, filters, extra);
  };

  // 渲染空状态
  const renderEmpty = () => {
    if (emptyRender) {
      return typeof emptyRender === 'function' ? emptyRender() : emptyRender;
    }
    return <Empty description='暂无数据' />;
  };

  // 获取行属性（用于拖拽排序）
  const getRowProps = (record: any, index: number) => {
    if (dragSort && getDragRowProps) {
      return getDragRowProps(index, record);
    }
    return {};
  };

  return (
    <Spin loading={loading} style={{ width: '100%' }}>
      <ConfigProvider componentConfig={{ Table: { borderCell: bordered } }}>
        <Table
          {...restProps}
          columns={tableColumns}
          data={dataSource}
          rowKey={rowKey}
          rowSelection={rowSelectionConfig as any}
          onChange={handleTableChange}
          onExpand={onExpand}
          onExpandedRowsChange={onExpandedRowsChange}
          scroll={scroll}
          className={`${className || ''} pro-table-density-${density}`}
          style={style}
          size={tableSize}
          pagination={false}
          expandedRowRender={expandedRowRender}
          expandProps={expandProps}
          noDataElement={renderEmpty()}
          onRow={(_record, index) => getRowProps(_record, index || 0)}
        />
      </ConfigProvider>
    </Spin>
  );
};
