/**
 * TopLayout — ProLayout 默认 Top 布局
 *
 * 结构：
 * ┌─────────────────────────────┐
 * │        PageHeader           │
 * ├─────────────────────────────┤
 * │         Content             │
 * ├─────────────────────────────┤
 * │         Footer              │
 * └─────────────────────────────┘
 *
 * PageHeader 在顶部，Content 在中间，Footer 在底部
 * mobile 下 PageHeader 紧凑显示（隐藏 subTitle/description）
 */

import React from 'react';
import type { ProLayoutProps } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Content } from '../components/Content';
import { Footer } from '../components/Footer';
import { useRootContext } from '../LayoutContext';

export const TopLayout: React.FC<ProLayoutProps> = ({ header, content, footer, children }) => {
  const { isMobile } = useRootContext();

  // mobile 下隐藏 subTitle 和 description 实现紧凑显示
  const compactHeader = isMobile && header ? { ...header, subTitle: undefined, description: undefined } : header;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-1)' }}>
      <PageHeader config={compactHeader} />
      <main style={{ flex: 1, padding: 24 }}>
        <Content config={content}>{children}</Content>
      </main>
      <Footer config={footer} />
    </div>
  );
};
