/**
 * ProLayout 组件 — 页面级布局容器
 *
 * 封装 PageHeader + Content + Footer + Sider 四个区域
 * 支持三种布局模式：top（默认）/ side / mix
 * 响应式内置：mobile 自动切换布局
 * 主题联动：所有颜色用 CSS 变量（var(--color-*)），自动跟随 light/dark
 *
 * @example
 * ```tsx
 * // 基础 top 布局
 * <ProLayout
 *   header={{ title: '订单管理', subTitle: '管理所有订单信息' }}
 *   footer={{ position: 'right', children: <Button type="primary">提交</Button> }}
 * >
 *   <ProTable columns={columns} request={request} />
 * </ProLayout>
 *
 * // side 布局
 * <ProLayout
 *   layout="side"
 *   header={{ title: '管理后台' }}
 *   sider={{ children: <Menu items={menuItems} /> }}
 * >
 *   <ProTable columns={columns} request={request} />
 * </ProLayout>
 * ```
 */

import React, { useMemo } from 'react';
import { useResponsive } from '@lania-pro-components/shared';
import { useTheme } from '@lania-pro-components/theme';
import type { ProLayoutProps, ProLayoutMode } from './types';
import {
  RootContextProvider,
  HeaderContextProvider,
  ContentContextProvider,
  FooterContextProvider,
} from './LayoutContext';
import { TopLayout } from './layouts/TopLayout';
import { SideLayout } from './layouts/SideLayout';
import { MixLayout } from './layouts/MixLayout';

const layoutComponents: Record<ProLayoutMode, React.FC<ProLayoutProps>> = {
  top: TopLayout,
  side: SideLayout,
  mix: MixLayout,
};

/**
 * ProLayout 主组件
 */
export const ProLayout: React.FC<ProLayoutProps> = ({
  layout: layoutMode = 'top',
  header,
  sider,
  content,
  footer,
  children,
  responsive,
  className,
  style,
}) => {
  const { state: responsiveState } = useResponsive({
    enabled: true,
    breakpoints: {
      xs: responsive?.mobile ?? 576,
      md: responsive?.tablet ?? 768,
    },
  });

  const { isMobile, isTablet, isDesktop } = responsiveState;

  // mobile 下强制转为 top 布局
  const effectiveLayout: ProLayoutMode = isMobile ? 'top' : layoutMode;

  // Context 值
  const rootContext = useMemo(
    () => ({
      layout: effectiveLayout,
      collapsed: false,
      toggleCollapsed: () => {},
      isMobile,
      isTablet,
      isDesktop,
    }),
    [effectiveLayout, isMobile, isTablet, isDesktop],
  );

  const headerContext = useMemo(() => ({ config: header }), [header]);
  const contentContext = useMemo(() => ({ config: content }), [content]);
  const footerContext = useMemo(() => ({ config: footer }), [footer]);

  const LayoutComponent = layoutComponents[effectiveLayout];

  return (
    <RootContextProvider value={rootContext}>
      <HeaderContextProvider value={headerContext}>
        <ContentContextProvider value={contentContext}>
          <FooterContextProvider value={footerContext}>
            <div className={className} style={style}>
              <LayoutComponent header={header} sider={sider} content={content} footer={footer}>
                {children}
              </LayoutComponent>
            </div>
          </FooterContextProvider>
        </ContentContextProvider>
      </HeaderContextProvider>
    </RootContextProvider>
  );
};

export default ProLayout;
