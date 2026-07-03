/**
 * ProLayout Context
 *
 * 与 ProTable 多层 Context 风格保持一致：
 * - RootContext: 全局配置层（布局模式、主题、响应式、Sider 折叠状态）
 * - HeaderContext: 页头层
 * - ContentContext: 内容层
 * - FooterContext: 底部层
 */

import { createContext, useContext } from 'react';
import type { ProLayoutMode } from './types';
import type { PageHeaderConfig, ContentConfig, FooterConfig } from './types';

/* ───────────────── RootContext ───────────────── */

export interface RootContextValue {
  /** 当前布局模式 */
  layout: ProLayoutMode;
  /** Sider 是否折叠 */
  collapsed: boolean;
  /** 切换 Sider 折叠状态 */
  toggleCollapsed: () => void;
  /** 是否移动端 */
  isMobile: boolean;
  /** 是否平板 */
  isTablet: boolean;
  /** 是否桌面端 */
  isDesktop: boolean;
}

const RootContext = createContext<RootContextValue>({
  layout: 'top',
  collapsed: false,
  toggleCollapsed: () => {},
  isMobile: false,
  isTablet: false,
  isDesktop: true,
});

export const useRootContext = (): RootContextValue => useContext(RootContext);
export const RootContextProvider = RootContext.Provider;

/* ───────────────── HeaderContext ───────────────── */

export interface HeaderContextValue {
  /** 页头配置 */
  config?: PageHeaderConfig;
}

const HeaderContext = createContext<HeaderContextValue>({});
export const useHeaderContext = (): HeaderContextValue => useContext(HeaderContext);
export const HeaderContextProvider = HeaderContext.Provider;

/* ───────────────── ContentContext ───────────────── */

export interface ContentContextValue {
  /** 内容区配置 */
  config?: ContentConfig;
}

const ContentContext = createContext<ContentContextValue>({});
export const useContentContext = (): ContentContextValue => useContext(ContentContext);
export const ContentContextProvider = ContentContext.Provider;

/* ───────────────── FooterContext ───────────────── */

export interface FooterContextValue {
  /** 底部配置 */
  config?: FooterConfig;
}

const FooterContext = createContext<FooterContextValue>({});
export const useFooterContext = (): FooterContextValue => useContext(FooterContext);
export const FooterContextProvider = FooterContext.Provider;
