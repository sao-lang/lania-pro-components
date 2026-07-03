/**
 * 布局上下文（LayoutContext）
 *
 * 向表单子组件传递布局配置，如列数（columns）、标签列宽度（labelCol）、
 * 内容列宽度（wrapperCol）、间距（gutter）等。
 *
 * 布局配置可以：
 * - 在表单级别全局设置
 * - 在 Schema 级别按字段覆盖
 * - 在 FormField 内合并使用
 */
import React, { createContext, useContext, ReactNode } from 'react';
import type { ColProps } from '@arco-design/web-react/lib/Grid';

/**
 * LayoutContext 值类型
 * 布局配置上下文
 */
export interface LayoutContextValue {
  /** Grid 布局列数 */
  columns: number;
  /** Grid 布局间距 */
  gutter: number | [number, number];
  /** 标签列配置 */
  labelCol?: ColProps;
  /** 内容列配置 */
  wrapperCol?: ColProps;
  /** 当前字段的列跨度 */
  col?: number;
  /** Row 组件属性 */
  rowProps?: Record<string, unknown>;
  /** Col 组件属性 */
  colProps?: Record<string, unknown>;
  /** 是否显示冒号 */
  colon?: boolean;
  /** 标签对齐方式 */
  labelAlign?: 'left' | 'right';
  /** 是否折叠 */
  collapsed?: boolean;
  /** 折叠行数 */
  collapsedRows?: number;
}

/**
 * LayoutContext 默认值
 */
const defaultLayoutContext: LayoutContextValue = {
  columns: 1,
  gutter: 16,
  colon: true,
  labelAlign: 'left',
  collapsed: false,
  collapsedRows: 1,
};

/**
 * LayoutContext - 布局配置上下文
 */
export const LayoutContext = createContext<LayoutContextValue>(defaultLayoutContext);

/**
 * LayoutContext Provider 组件
 */
export interface LayoutContextProviderProps {
  value: LayoutContextValue;
  children: ReactNode;
}

export const LayoutContextProvider: React.FC<LayoutContextProviderProps> = ({ value, children }) => (
  <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
);

/**
 * 使用 LayoutContext 的 Hook
 */
export const useLayoutContext = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within LayoutContextProvider');
  }
  return context;
};

/**
 * 使用 LayoutContext 的 Hook（可选，可能返回 null）
 */
export const useLayoutContextOptional = (): LayoutContextValue | null => useContext(LayoutContext);
