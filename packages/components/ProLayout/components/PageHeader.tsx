/**
 * PageHeader 组件 — ProLayout 页头
 *
 * 消费 ProTable Toolbar 三件套模式：title / subTitle / description
 * 支持 breadcrumb（Arco Breadcrumb）和 extra（操作按钮区）
 *
 * 主题联动：背景色用 var(--color-bg-2)，边框用 var(--color-border-2)
 */

import React from 'react';
import { Breadcrumb } from '@arco-design/web-react';
import type { PageHeaderConfig } from '../types';
import { useHeaderContext } from '../LayoutContext';

export interface PageHeaderProps {
  /** 页头配置（可从 context 或 props 传入） */
  config?: PageHeaderConfig;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ config: propConfig }) => {
  const { config: contextConfig } = useHeaderContext();
  const config = propConfig ?? contextConfig;

  if (!config || config.visible === false) return null;

  const { title, subTitle, description, breadcrumb, extra, style, className } = config;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'var(--color-bg-2)',
        borderBottom: '1px solid var(--color-border-2)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {breadcrumb && breadcrumb.length > 0 && (
          <Breadcrumb>
            {breadcrumb.map((item, idx) => (
              <Breadcrumb.Item key={idx} href={item.path}>
                {item.icon}
                {item.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        )}
        {(title || subTitle) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {title && <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.4 }}>{title}</h2>}
            {subTitle && (
              <span style={{ color: 'var(--color-text-2)', fontSize: 14, lineHeight: 1.4 }}>{subTitle}</span>
            )}
          </div>
        )}
        {description && (
          <p style={{ margin: 0, color: 'var(--color-text-3)', fontSize: 12, lineHeight: 1.6 }}>{description}</p>
        )}
      </div>
      {extra && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{extra}</div>}
    </div>
  );
};
