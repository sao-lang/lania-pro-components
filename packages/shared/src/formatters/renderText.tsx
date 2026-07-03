/**
 * @lania-pro-components/shared
 *
 * renderText — 公共文本格式器
 *
 * 合并自 ProTable columnRender (renderText) 和 ProForm readonlyRegistry (textRenderer)
 */

import React from 'react';

export interface RenderTextOptions {
  /** 空值占位符 */
  emptyText?: string;
  /** 最大长度超出后截断 */
  maxLength?: number;
  /** 截断后缀 */
  ellipsis?: string;
  /** 是否保留换行（textarea 模式） */
  preserveNewlines?: boolean;
  /** 前缀 */
  prefix?: React.ReactNode;
  /** 后缀 */
  suffix?: React.ReactNode;
}

/** 默认空值文本 */
export const DEFAULT_EMPTY = '--';

/**
 * 文本渲染
 */
export function renderText(value: unknown, options: RenderTextOptions = {}): React.ReactNode {
  const { emptyText = DEFAULT_EMPTY, maxLength, ellipsis = '...', preserveNewlines = false, prefix, suffix } = options;

  if (value === null || value === undefined || value === '') {
    return wrapAffix(emptyText, prefix, suffix);
  }

  let text = String(value);

  if (maxLength && text.length > maxLength) {
    text = text.slice(0, maxLength) + ellipsis;
  }

  if (preserveNewlines) {
    const lines = text.split('\n');
    const content = lines.map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < lines.length - 1 && <br />}
      </React.Fragment>
    ));
    return wrapAffix(content, prefix, suffix);
  }

  return wrapAffix(text, prefix, suffix);
}

function wrapAffix(content: React.ReactNode, prefix?: React.ReactNode, suffix?: React.ReactNode): React.ReactNode {
  if (!prefix && !suffix) return content;
  return (
    <span>
      {prefix && <span style={{ marginRight: 4 }}>{prefix}</span>}
      {content}
      {suffix && <span style={{ marginLeft: 4 }}>{suffix}</span>}
    </span>
  );
}
