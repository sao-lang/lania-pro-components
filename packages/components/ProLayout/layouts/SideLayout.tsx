/**
 * SideLayout — ProLayout Side 布局
 *
 * 结构：
 * ┌──────────┬──────────────────────────────┐
 * │          │         PageHeader            │
 │  Sider   ├──────────────────────────────┤
 * │          │          Content              │
 * │          ├──────────────────────────────┤
 * │          │          Footer               │
 * └──────────┴──────────────────────────────┘
 *
 * Sider 在左，PageHeader + Content + Footer 在右
 * mobile 下 Sider 转 Drawer 模式
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

export const SideLayout: React.FC<ProLayoutProps> = ({ header, sider, content, footer, children }) => {
  const { isMobile } = useRootContext();
  const [collapsed, setCollapsed] = useSiderCollapsed({
    collapsed: sider?.collapsed,
    onCollapsedChange: sider?.onCollapsedChange,
    storageKey: sider?.storageKey,
  });

  // mobile: Sider 转 Drawer
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

  // desktop: Sider 固定左侧
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-bg-1)' }}>
      <Sider config={sider} collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PageHeader config={header} />
        <main style={{ flex: 1, padding: 24 }}>
          <Content config={content}>{children}</Content>
        </main>
        <Footer config={footer} />
      </div>
    </div>
  );
};
