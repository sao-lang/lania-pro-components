import React from 'react';
import { Skeleton, Table } from '@arco-design/web-react';
import type { ProColumnType } from '../types';

/**
 * 骨架屏表格属性
 */
export interface SkeletonTableProps<T = Record<string, unknown>> {
  /** 列配置 */
  columns: ProColumnType<T>[];
  /** 行数 */
  rowCount?: number;
  /** 是否显示表头 */
  showHeader?: boolean;
  /** 是否显示操作列 */
  showOperation?: boolean;
  /** 操作列宽度 */
  operationWidth?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 骨架屏表格组件
 *
 * 用于数据加载时显示骨架屏效果
 *
 * @example
 * ```tsx
 * {loading && <SkeletonTable columns={columns} rowCount={5} />}
 * ```
 */
export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  columns,
  rowCount = 5,
  showHeader = true,
  showOperation = true,
  operationWidth = 120,
  className,
  style,
}) => {
  // 过滤出可见列
  const visibleColumns = columns.filter((col) => !col.hideInTable);

  // 生成骨架屏列
  const skeletonColumns = visibleColumns.map((col, index) => ({
    title: showHeader ? <Skeleton animation text={{ rows: 1, width: '80%' }} style={{ width: '100%' }} /> : undefined,
    dataIndex: `skeleton_${index}`,
    key: `skeleton_${index}`,
    width: col.width,
    render: () => (
      <Skeleton animation text={{ rows: 1, width: `${60 + Math.random() * 30}%` }} style={{ width: '100%' }} />
    ),
  }));

  // 添加操作列骨架屏
  const finalColumns = showOperation
    ? [
        ...skeletonColumns,
        {
          title: showHeader ? '操作' : undefined,
          dataIndex: 'operation',
          key: 'operation',
          width: operationWidth,
          render: () => <Skeleton animation text={{ rows: 1, width: '60%' }} style={{ width: '100%' }} />,
        },
      ]
    : skeletonColumns;

  // 生成骨架屏数据
  const skeletonData = Array.from({ length: rowCount }, (_, index) => ({
    key: index,
    ...visibleColumns.reduce(
      (acc, _, colIndex) => {
        acc[`skeleton_${colIndex}`] = '';
        return acc;
      },
      {} as Record<string, string>,
    ),
  }));

  return (
    <div className={`pro-table-skeleton ${className || ''}`} style={style}>
      <Table columns={finalColumns} data={skeletonData} pagination={false} borderCell size='default' />
    </div>
  );
};

/**
 * 卡片骨架屏组件
 */
export interface SkeletonCardProps {
  /** 卡片数量 */
  count?: number;
  /** 列数 */
  columns?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 卡片骨架屏
 *
 * 用于卡片视图加载时显示骨架屏效果
 *
 * @example
 * ```tsx
 * {loading && <SkeletonCard count={8} columns={4} />}
 * ```
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 8, columns = 4, className, style }) => (
  <div
    className={`pro-table-skeleton-card ${className || ''}`}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 16,
      ...style,
    }}
  >
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        style={{
          padding: 16,
          border: '1px solid var(--color-border-2)',
          borderRadius: 4,
          background: '#fff',
        }}
      >
        <Skeleton animation text={{ rows: 4, width: ['60%', '80%', '70%', '50%'] }} />
      </div>
    ))}
  </div>
);

export default SkeletonTable;
