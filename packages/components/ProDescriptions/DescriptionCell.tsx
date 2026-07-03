/**
 * DescriptionCell — 单项渲染组件
 *
 * 核心逻辑：
 * 1. 调用 renderColumnByValueType（ProTable 渲染器，零拷贝复用）
 * 2. 处理 useState 陷阱：DescriptionCell 本身是 React 组件，渲染器内部 useState 正常工作
 * 3. 支持脱敏：若 column.masking 为 true，叠加 ProForm readonlyRegistry 渲染器
 * 4. 支持复制：若 column.copyable 为 true，渲染 CopyButton
 *
 * 优先级：column.render > masking + readonlyRegistry > renderColumnByValueType
 */

import React from 'react';
import { renderColumnByValueType } from '../ProTable/utils/columnRender';
import { getReadonlyRenderer } from '../ProForm/registry/readonlyRegistry';
import { CopyButton } from './CopyButton';
import { EmptyValue } from './EmptyValue';
import type { DescriptionCellProps } from './types';

export const DescriptionCell = <T extends Record<string, unknown>>({
  column,
  value,
  record,
  index,
  emptyText = '-',
}: DescriptionCellProps<T>) => {
  // 1. 优先级：column.render > masking + readonlyRegistry > renderColumnByValueType
  let content: React.ReactNode;

  if (typeof column.render === 'function') {
    // 逃生舱：用户自定义 render（兼容 ProColumnType render 签名）
    content = column.render(value, record, index);
  } else if (column.masking && column.valueType) {
    // 脱敏渲染（消费 ProForm readonlyRegistry）
    const renderer = getReadonlyRenderer(column.valueType);
    if (renderer) {
      content = renderer(value, [], {});
    } else {
      content = renderColumnByValueType(value, column as Record<string, unknown>, record, index);
    }
  } else {
    // 标准渲染（消费 ProTable 渲染器）
    content = renderColumnByValueType(value, column as Record<string, unknown>, record, index);
  }

  // 2. 空值处理
  const isEmpty = value === null || value === undefined || value === '';
  if (isEmpty && !column.render) {
    content = <EmptyValue text={emptyText} />;
  }

  // 3. 复制按钮
  const showCopy = column.copyable && !isEmpty && value != null;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span>{content}</span>
      {showCopy && <CopyButton text={String(value)} />}
    </span>
  );
};
