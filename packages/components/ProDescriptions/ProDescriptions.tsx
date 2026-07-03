/**
 * ProDescriptions 组件 — 详情视图
 *
 * Schema 驱动，与 ProTable 列定义互通。
 * 支持三种布局：table（默认）/ grid / inline
 *
 * @example
 * ```tsx
 * // 基础用法
 * <ProDescriptions
 *   columns={[
 *     { title: '订单号', dataIndex: 'orderNo', valueType: 'text', copyable: true },
 *     { title: '金额', dataIndex: 'amount', valueType: 'money' },
 *   ]}
 *   dataSource={{ orderNo: 'ORD001', amount: 1234.5 }}
 * />
 *
 * // grid 布局 + 卡片容器
 * <ProDescriptions
 *   layout="grid"
 *   columns={columns}
 *   dataSource={order}
 *   cardContainer={{ title: '订单信息' }}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import type { ProDescriptionsProps } from './types';
import { adaptColumns } from './columnAdapter';
import { DescriptionsRootProvider, DescriptionsColumnProvider } from './DescriptionsContext';
import { TableLayout } from './layouts/TableLayout';
import { GridLayout } from './layouts/GridLayout';
import { InlineLayout } from './layouts/InlineLayout';

const layoutComponents = {
  table: TableLayout,
  grid: GridLayout,
  inline: InlineLayout,
} as const;

export const ProDescriptions = <T extends Record<string, unknown>>(props: ProDescriptionsProps<T>) => {
  const {
    columns: rawColumns,
    dataSource,
    layout = 'table',
    column = 3,
    bordered = false,
    size = 'default',
    direction = 'horizontal',
    emptyText = '-',
    responsiveColumns,
    cardContainer,
    className,
    style,
    title,
    extra,
  } = props;

  // 适配列定义
  const columns = useMemo(() => adaptColumns(rawColumns), [rawColumns]);

  // Context 值
  const rootContext = useMemo(
    () => ({
      layout,
      column,
      bordered,
      size,
      direction,
      emptyText,
      responsiveColumns,
    }),
    [layout, column, bordered, size, direction, emptyText, responsiveColumns],
  );

  const columnContext = useMemo(() => ({ columns, dataSource }), [columns, dataSource]);

  const LayoutComponent = layoutComponents[layout];

  return (
    <DescriptionsRootProvider value={rootContext}>
      <DescriptionsColumnProvider value={columnContext}>
        <div className={className} style={style}>
          <LayoutComponent
            columns={columns}
            dataSource={dataSource}
            column={column}
            bordered={bordered}
            direction={direction}
            size={size}
            emptyText={emptyText}
            title={title}
            extra={extra}
            responsiveColumns={responsiveColumns}
            cardContainer={cardContainer}
          />
        </div>
      </DescriptionsColumnProvider>
    </DescriptionsRootProvider>
  );
};

export default ProDescriptions;
