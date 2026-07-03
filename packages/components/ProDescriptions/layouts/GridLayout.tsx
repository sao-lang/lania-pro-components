/**
 * GridLayout — ProDescriptions grid 布局
 *
 * CSS Grid 实现，每项 label 上 value 下
 * 消费 useResponsive 计算响应式列数
 * 支持卡片容器（消费 CardContainerConfig）
 */

import React from 'react';
import { Card } from '@arco-design/web-react';
import { useResponsive } from '@lania-pro-components/shared';
import { DescriptionCell } from '../DescriptionCell';
import type { ProDescriptionColumn } from '../types';
import { getNestedValue } from '@lania-pro-components/utils';
import type { CardContainerConfig } from '@lania-pro-components/shared';

export interface GridLayoutProps<T = Record<string, unknown>> {
  columns: ProDescriptionColumn<T>[];
  dataSource: T;
  column?: number;
  responsiveColumns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  emptyText?: React.ReactNode;
  cardContainer?: CardContainerConfig;
}

export const GridLayout = <T extends Record<string, unknown>>({
  columns,
  dataSource,
  column = 3,
  responsiveColumns,
  emptyText = '-',
  cardContainer,
}: GridLayoutProps<T>) => {
  const { state: responsive } = useResponsive({ enabled: true });
  const { isMobile, isTablet } = responsive;

  const actualColumn = responsiveColumns
    ? isMobile
      ? (responsiveColumns.mobile ?? 1)
      : isTablet
        ? (responsiveColumns.tablet ?? 2)
        : (responsiveColumns.desktop ?? column)
    : column;

  const items = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${actualColumn}, 1fr)`,
        gap: 16,
      }}
    >
      {columns.map((col, idx) => (
        <div key={String(col.dataIndex ?? idx)} style={{ gridColumn: col.span ? `span ${col.span}` : undefined }}>
          <div style={{ color: 'var(--color-text-2)', fontSize: 12, marginBottom: 4 }}>{col.title as string}</div>
          <div style={{ marginTop: 4 }}>
            <DescriptionCell
              column={col}
              value={col.dataIndex ? getNestedValue(dataSource, col.dataIndex) : undefined}
              record={dataSource}
              index={idx}
              emptyText={emptyText}
            />
          </div>
        </div>
      ))}
    </div>
  );

  if (cardContainer) {
    const cc = cardContainer as Record<string, unknown>;
    return (
      <Card
        title={cc.title as React.ReactNode}
        extra={cc.extra as React.ReactNode}
        bordered={cc.bordered as boolean | undefined}
        className={cc.className as string | undefined}
        style={cc.style as React.CSSProperties}
      >
        {items}
      </Card>
    );
  }

  return items;
};
