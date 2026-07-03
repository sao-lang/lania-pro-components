/**
 * ProLayout 类型定义
 *
 * 页面级布局组件类型，包含：
 * - ProLayoutMode: 三种布局模式
 * - PageHeaderConfig: 页头配置
 * - SiderConfig: 侧边栏配置
 * - ContentConfig: 内容区配置
 * - FooterConfig: 底部按钮区配置
 * - ProLayoutProps: 主组件 Props
 */

import type { ReactNode, CSSProperties } from 'react';
import type { CardContainerConfig } from '@lania-pro-components/shared';
import type { FooterPosition } from '../ProDialog/types';

/** 页面级布局模式 */
export type ProLayoutMode = 'top' | 'side' | 'mix';

/** 内容区布局方向（LayoutMode 子集，不含 ProForm 专用的 compact） */
export type ContentLayoutMode = 'horizontal' | 'vertical' | 'inline';

/** 面包屑项 */
export interface BreadcrumbItem {
  label: ReactNode;
  path?: string;
  icon?: ReactNode;
}

/** PageHeader 配置 */
export interface PageHeaderConfig {
  /** 主标题 */
  title?: ReactNode;
  /** 副标题 */
  subTitle?: ReactNode;
  /** 描述文本 */
  description?: ReactNode;
  /** 面包屑 */
  breadcrumb?: BreadcrumbItem[];
  /** 额外内容（操作按钮区，右对齐） */
  extra?: ReactNode;
  /** 是否显示（默认 true） */
  visible?: boolean;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/** Sider 配置 */
export interface SiderConfig {
  /** 是否折叠（受控） */
  collapsed?: boolean;
  /** 折叠状态变化回调 */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** localStorage 持久化 key（不传则不持久化） */
  storageKey?: string;
  /** 展开宽度（默认 200） */
  width?: number;
  /** 折叠宽度（默认 64） */
  collapsedWidth?: number;
  /** Sider 内容（通常是菜单） */
  children?: ReactNode;
  /** 是否显示（默认 true） */
  visible?: boolean;
  /** 自定义样式 */
  style?: CSSProperties;
}

/** Content 配置 */
export interface ContentConfig {
  /** 卡片容器配置（支持 ProForm 风格的完整配置） */
  cardContainer?:
    | CardContainerConfig
    | {
        title?: ReactNode;
        extra?: ReactNode;
        bordered?: boolean;
        style?: CSSProperties;
        className?: string;
        bodyStyle?: CSSProperties;
      };
  /** 内容区布局方向 */
  layout?: ContentLayoutMode;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/** Footer 配置 */
export interface FooterConfig {
  /** 按钮位置（消费 ProDialog FooterPosition） */
  position?: FooterPosition;
  /** Footer 内容（通常是按钮组） */
  children?: ReactNode;
  /** 是否显示（默认 true） */
  visible?: boolean;
  /** 是否固定在底部（默认 true） */
  fixed?: boolean;
  /** 自定义样式 */
  style?: CSSProperties;
}

/** ProLayout 主组件 Props */
export interface ProLayoutProps {
  /** 布局模式 */
  layout?: ProLayoutMode;
  /** 页头配置 */
  header?: PageHeaderConfig;
  /** 侧边栏配置（仅 side/mix 布局生效） */
  sider?: SiderConfig;
  /** 内容区配置 */
  content?: ContentConfig;
  /** 底部配置 */
  footer?: FooterConfig;
  /** 业务内容 */
  children?: ReactNode;
  /** 响应式断点配置（覆盖默认） */
  responsive?: {
    mobile?: number; // 默认 768
    tablet?: number; // 默认 1024
  };
  /** className */
  className?: string;
  /** style */
  style?: CSSProperties;
}
