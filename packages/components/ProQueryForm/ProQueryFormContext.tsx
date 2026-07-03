/**
 * ProQueryForm Context
 *
 * 与 ProTable 多层 Context 风格保持一致：
 * - RootContext: 全局配置层（布局/列数/折叠/主题）
 * - SchemaContext: 字段定义层（schemas + formRef）
 * - ActionContext: 行为层（onSearch/onReset/store）
 */

import React, { createContext, useContext } from 'react';
import type { ProFormInstance, ProFormSchema } from '../ProForm/types';

/* ───────────────── RootContext ───────────────── */

export interface ProQueryFormRootContextValue {
  /** 表单布局 */
  layout: 'horizontal' | 'vertical' | 'inline';
  /** Grid 列数 */
  columns: number;
  /** 是否可折叠 */
  collapsible: boolean;
  /** 默认是否折叠 */
  defaultCollapsed: boolean;
  /** 折叠行数 */
  collapsedRows: number;
}

const RootContext = createContext<ProQueryFormRootContextValue>({
  layout: 'inline',
  columns: 3,
  collapsible: true,
  defaultCollapsed: true,
  collapsedRows: 1,
});

export const useProQueryFormRootContext = (): ProQueryFormRootContextValue => useContext(RootContext);
export const ProQueryFormRootProvider = RootContext.Provider;

/* ───────────────── SchemaContext ───────────────── */

export interface ProQueryFormSchemaContextValue {
  /** 处理后的 ProFormSchema 列表 */
  schemas: ProFormSchema[];
  /** ProForm 实例引用 */
  formRef: React.RefObject<ProFormInstance | null>;
}

const SchemaContext = createContext<ProQueryFormSchemaContextValue>({
  schemas: [],
  formRef: { current: null },
});

export const useProQueryFormSchemaContext = (): ProQueryFormSchemaContextValue => useContext(SchemaContext);
export const ProQueryFormSchemaProvider = SchemaContext.Provider;

/* ───────────────── ActionContext ───────────────── */

export interface ProQueryFormActionContextValue {
  /** 查询回调 */
  onSearch: (params: Record<string, unknown>) => void;
  /** 重置回调 */
  onReset: () => void;
}

const ActionContext = createContext<ProQueryFormActionContextValue>({
  onSearch: () => {},
  onReset: () => {},
});

export const useProQueryFormActionContext = (): ProQueryFormActionContextValue => useContext(ActionContext);
export const ProQueryFormActionProvider = ActionContext.Provider;
