/**
 * Content 组件 — ProLayout 内容区
 *
 * 消费 shared CardContainerConfig，支持卡片容器包裹
 * 支持内容区布局方向（horizontal / vertical / inline）
 *
 * 不传 cardContainer 时，直接渲染 children（无卡片包裹）
 */

import React from 'react';
import { Card } from '@arco-design/web-react';
import type { ContentConfig, ContentLayoutMode } from '../types';
import { useContentContext } from '../LayoutContext';

export interface ContentProps {
  /** 内容区配置（可从 context 或 props 传入） */
  config?: ContentConfig;
  /** 业务内容 */
  children?: React.ReactNode;
}

/**
 * 内容区布局方向映射为 CSS flex-direction
 */
const layoutToFlexDirection: Record<ContentLayoutMode, React.CSSProperties['flexDirection']> = {
  horizontal: 'row',
  vertical: 'column',
  inline: 'row',
};

export const Content: React.FC<ContentProps> = ({ config: propConfig, children }) => {
  const { config: contextConfig } = useContentContext();
  const config = propConfig ?? contextConfig;

  if (!config) return <>{children}</>;

  const { cardContainer, layout, style, className } = config;

  // 卡片容器模式
  if (cardContainer) {
    const cc = cardContainer as Record<string, unknown>;
    const cardTitle = cc.title as React.ReactNode;
    const cardExtra = cc.extra as React.ReactNode;
    const cardBordered = cc.bordered as boolean | undefined;
    const cardBodyStyle = cc.bodyStyle as React.CSSProperties | undefined;

    return (
      <Card
        title={cardTitle}
        extra={cardExtra}
        bordered={cardBordered}
        bodyStyle={cardBodyStyle}
        className={className}
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: layout ? layoutToFlexDirection[layout] : 'column',
            gap: 16,
          }}
        >
          {children}
        </div>
      </Card>
    );
  }

  // 无卡片包裹，直接渲染
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: layout ? layoutToFlexDirection[layout] : 'column',
        gap: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
