/**
 * InlineLayout — ProDescriptions inline 布局
 *
 * <span>label: value</span> 横向排列，自动换行
 * 适用于表格行展开、侧栏紧凑展示
 */

import React from 'react';
import { DescriptionCell } from '../DescriptionCell';
import type { ProDescriptionColumn } from '../types';
import { getNestedValue } from '@lania-pro-components/utils';

export interface InlineLayoutProps<T = Record<string, unknown>> {
  columns: ProDescriptionColumn<T>[];
  dataSource: T;
  emptyText?: React.ReactNode;
}

export const InlineLayout = <T extends Record<string, unknown>>({
  columns,
  dataSource,
  emptyText = '-',
}: InlineLayoutProps<T>) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: '4px 16px',
        alignItems: 'center',
      }}
    >
      {columns.map((col, idx) => (
        <span key={String(col.dataIndex ?? idx)}>
          <span style={{ color: 'var(--color-text-2)', marginRight: 4 }}>{col.title as string}:</span>
          <DescriptionCell
            column={col}
            value={col.dataIndex ? getNestedValue(dataSource, col.dataIndex) : undefined}
            record={dataSource}
            index={idx}
            emptyText={emptyText}
          />
        </span>
      ))}
    </span>
  );
};
