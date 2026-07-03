/**
 * @lania-pro-components/shared
 *
 * renderOption — 公共选项/选择格式器
 *
 * 合并自 ProTable columnRender (renderSelect) 和 ProForm readonlyRegistry (optionRenderer/checkboxRenderer)
 */

import React from 'react';
import { Tag, Space } from '@arco-design/web-react';

export interface OptionItem {
  value: string | number;
  label: React.ReactNode;
}

export interface RenderOptionOptions {
  /** 空值占位符 */
  emptyText?: string;
  /** 多选分隔符（仅非 tag 模式） */
  separator?: string;
  /** Tag 模式 */
  tagMode?: boolean;
  /** Tag 颜色映射 */
  tagColors?: Record<string, string>;
}

const DEFAULT_EMPTY = '--';

/**
 * 选项渲染（单选/多选 → 标签）
 */
export function renderOption(
  value: unknown,
  options: OptionItem[] = [],
  renderOptions: RenderOptionOptions = {},
): React.ReactNode {
  const { emptyText = DEFAULT_EMPTY, separator = ', ', tagMode, tagColors } = renderOptions;

  if (value === null || value === undefined || value === '') {
    return <>{emptyText}</>;
  }

  const getLabel = (v: unknown): React.ReactNode => {
    const opt = options.find((o) => o.value === v);
    return opt?.label ?? String(v);
  };

  if (Array.isArray(value)) {
    if (value.length === 0) return <>{emptyText}</>;
    const labels = value.map((v) => getLabel(v));

    if (tagMode) {
      return (
        <Space wrap>
          {labels.map((label, i) => (
            <Tag key={i} color={tagColors?.[String(value[i])]}>
              {label}
            </Tag>
          ))}
        </Space>
      );
    }

    return <>{labels.join(separator)}</>;
  }

  const label = getLabel(value);

  if (tagMode) {
    return <Tag color={tagColors?.[String(value)]}>{label}</Tag>;
  }

  return <>{String(label)}</>;
}

/**
 * Switch/布尔值渲染（是/否 Tag）
 */
export function renderSwitch(value: unknown, options: { trueText?: string; falseText?: string } = {}): React.ReactNode {
  const { trueText = '是', falseText = '否' } = options;
  if (value === null || value === undefined || value === '') return <>{DEFAULT_EMPTY}</>;
  const isChecked = value === true || value === 'true' || value === 1 || value === '1';
  return <Tag color={isChecked ? 'green' : 'gray'}>{isChecked ? trueText : falseText}</Tag>;
}
