/**
 * TableLayout — ProDescriptions 默认 table 布局
 *
 * 基于 Arco Descriptions 组件封装
 * 支持 column（列数）/ bordered / size / direction（horizontal/vertical）
 * 支持 span 字段跨列
 */

import React from 'react';
import { Descriptions } from '@arco-design/web-react';
import { DescriptionCell } from '../DescriptionCell';
import type { ProDescriptionColumn } from '../types';
import { getNestedValue } from '@lania-pro-components/utils';

export interface TableLayoutProps<T = Record<string, unknown>> {
  columns: ProDescriptionColumn<T>[];
  dataSource: T;
  column?: number;
  bordered?: boolean;
  direction?: 'horizontal' | 'vertical';
  size?: 'mini' | 'small' | 'default' | 'large';
  emptyText?: React.ReactNode;
  title?: React.ReactNode;
  extra?: React.ReactNode;
}

export const TableLayout = <T extends Record<string, unknown>>({
  columns,
  dataSource,
  column = 3,
  bordered = false,
  direction = 'horizontal',
  size = 'default',
  emptyText = '-',
  title,
}: TableLayoutProps<T>) => {
  const items = columns.map((col, idx) => ({
    label: col.title as string,
    value: (
      <DescriptionCell
        column={col}
        value={col.dataIndex ? getNestedValue(dataSource, col.dataIndex) : undefined}
        record={dataSource}
        index={idx}
        emptyText={emptyText}
      />
    ),
    span: col.span,
  }));

  return (
    <Descriptions
      column={column}
      border={bordered}
      layout={direction}
      size={size === 'default' ? 'default' : size}
      title={title}
      data={items as any}
    />
  );
};
