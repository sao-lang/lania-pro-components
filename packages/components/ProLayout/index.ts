/**
 * ProLayout 组件 barrel 导出
 */

export { ProLayout } from './ProLayout';
export type {
  ProLayoutProps,
  ProLayoutMode,
  ContentLayoutMode,
  PageHeaderConfig,
  SiderConfig,
  ContentConfig,
  FooterConfig,
  BreadcrumbItem,
} from './types';

// 子组件（独立使用场景）
export { PageHeader } from './components/PageHeader';
export type { PageHeaderProps } from './components/PageHeader';
export { Content } from './components/Content';
export type { ContentProps } from './components/Content';
export { Footer } from './components/Footer';
export type { FooterProps } from './components/Footer';
export { Sider } from './components/Sider';
export type { SiderProps } from './components/Sider';

// Hooks
export { useSiderCollapsed } from './hooks/useSiderCollapsed';
export type { UseSiderCollapsedOptions, UseSiderCollapsedReturn } from './hooks/useSiderCollapsed';

// Context
export { useRootContext, useHeaderContext, useContentContext, useFooterContext } from './LayoutContext';
export type { RootContextValue, HeaderContextValue, ContentContextValue, FooterContextValue } from './LayoutContext';
