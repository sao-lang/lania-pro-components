/**
 * Sider 组件 — ProLayout 侧边栏
 *
 * 支持折叠状态管理（localStorage 持久化）
 * 展开宽度 200px，折叠宽度 64px
 * children 注入菜单内容（不内置菜单系统）
 */

import React from 'react';
import type { SiderConfig } from '../types';

export interface SiderProps {
  /** Sider 配置（可从 context 或 props 传入） */
  config?: SiderConfig;
  /** 是否折叠 */
  collapsed?: boolean;
  /** 折叠状态变化回调 */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 展开宽度（默认 200） */
  width?: number;
  /** 折叠宽度（默认 64） */
  collapsedWidth?: number;
}

export const Sider: React.FC<SiderProps> = ({
  config,
  collapsed,
  onCollapsedChange: _onCollapsedChange,
  width: propWidth,
  collapsedWidth: propCollapsedWidth,
}) => {
  const mergedConfig = config || {};
  const isCollapsed = collapsed ?? mergedConfig.collapsed ?? false;
  const siderWidth = isCollapsed
    ? (propCollapsedWidth ?? mergedConfig.collapsedWidth ?? 64)
    : (propWidth ?? mergedConfig.width ?? 200);

  if (mergedConfig.visible === false) return null;

  return (
    <aside
      style={{
        width: siderWidth,
        minHeight: '100%',
        background: 'var(--color-bg-2)',
        borderRight: '1px solid var(--color-border-2)',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...mergedConfig.style,
      }}
    >
      {mergedConfig.children}
    </aside>
  );
};
