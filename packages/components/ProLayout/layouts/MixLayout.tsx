/**
 * MixLayout — ProLayout Mix 布局
 *
 * 结构：
 * ┌─────────────────────────────────────────┐
 * │              PageHeader                  │
 * ├──────────┬──────────────────────────────┤
 * │          │                              │
 * │  Sider   │          Content              │
 * │          │                              │
 * ├──────────┴──────────────────────────────┤
 * │                Footer                    │
 * └─────────────────────────────────────────┘
 *
 * top 布局 + Sider 在 Content 区域内
 * 适用于顶部全局导航 + 侧边二级导航的复杂场景
 * mobile 下自动转 top 布局
 */

import React from 'react';
import { Drawer } from '@arco-design/web-react';
import type { ProLayoutProps } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Content } from '../components/Content';
import { Footer } from '../components/Footer';
import { Sider } from '../components/Sider';
import { useRootContext } from '../LayoutContext';
import { useSiderCollapsed } from '../hooks/useSiderCollapsed';

export const MixLayout: React.FC<ProLayoutProps> = ({ header, sider, content, footer, children }) => {
  const { isMobile } = useRootContext();
  const [collapsed, setCollapsed] = useSiderCollapsed({
    collapsed: sider?.collapsed,
    onCollapsedChange: sider?.onCollapsedChange,
    storageKey: sider?.storageKey,
  });

  // mobile: 自动转 top 布局 + Sider Drawer
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-1)' }}>
        <PageHeader config={header} />
        <main style={{ flex: 1, padding: 24 }}>
          <Content config={content}>{children}</Content>
        </main>
        <Footer config={footer} />
        <Drawer
          visible={!collapsed}
          onCancel={() => setCollapsed(true)}
          placement='left'
          width={sider?.width ?? 200}
          title='菜单'
          footer={null}
        >
          {sider?.children}
        </Drawer>
      </div>
    );
  }

  // desktop: Sider 在 Content 区域内左侧
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-1)' }}>
      <PageHeader config={header} />
      <main style={{ flex: 1, display: 'flex', padding: 24, gap: 16 }}>
        <Sider config={sider} collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Content config={content}>{children}</Content>
        </div>
      </main>
      <Footer config={footer} />
    </div>
  );
};
