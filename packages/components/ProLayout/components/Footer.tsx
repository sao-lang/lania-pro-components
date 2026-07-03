/**
 * Footer 组件 — ProLayout 底部按钮区
 *
 * 消费 ProDialog FooterPosition + getFooterJustify
 * 固定在底部（position: sticky; bottom: 0）
 * 主题联动：背景色 var(--color-bg-1)，边框 var(--color-border-2)
 */

import React from 'react';
import type { FooterConfig } from '../types';
import { useFooterContext } from '../LayoutContext';
import { getFooterJustify } from '../../ProDialog/utils';

export interface FooterProps {
  /** Footer 配置（可从 context 或 props 传入） */
  config?: FooterConfig;
}

export const Footer: React.FC<FooterProps> = ({ config: propConfig }) => {
  const { config: contextConfig } = useFooterContext();
  const config = propConfig ?? contextConfig;

  if (!config || config.visible === false || !config.children) return null;

  const { position = 'right', children, fixed = true, style } = config;
  const justify = getFooterJustify(position);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: justify,
        alignItems: 'center',
        gap: 8,
        padding: '12px 24px',
        background: 'var(--color-bg-1)',
        borderTop: '1px solid var(--color-border-2)',
        ...(fixed ? { position: 'sticky' as const, bottom: 0, zIndex: 10 } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
