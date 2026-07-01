import React, { createContext, useContext, ReactNode } from 'react';
import type { FieldBehavior, FieldReaction, FieldLifecycle, ReadonlyRenderConfig, ValidationRule } from '../types';

/**
 * SchemaContext 值类型
 * 字段静态配置，来自用户定义的 Schema
 */
export interface SchemaContextValue {
  /** 字段名称 */
  name: string | string[];
  /** 字段标签 */
  label?: string;
  /** 使用的组件名称 */
  component: string;
  /** 组件属性 */
  componentProps?: Record<string, unknown>;
  /** 验证规则 */
  rules?: ValidationRule[];
  /** 依赖的字段名列表 */
  dependencies?: string[];
  /** 字段行为配置 */
  behavior?: FieldBehavior;
  /** 字段联动规则 */
  reactions?: FieldReaction[];
  /** 字段生命周期 */
  lifecycle?: FieldLifecycle;
  /** 初始值 */
  initialValue?: unknown;
  /** 标签提示信息 */
  tooltip?: string;
  /** 表单项额外提示信息 */
  extra?: React.ReactNode;
  /** 占位符文本 */
  placeholder?: string;
  /** 选项数据 */
  options?: Array<{ label: string; value: unknown; [key: string]: unknown }>;
  /** 日期/时间格式化字符串 */
  format?: string;
  /** 前缀文本 */
  prefix?: string;
  /** 后缀文本 */
  suffix?: string;
  /** 是否必填 */
  required?: boolean;
  /** 只读/预览渲染模式 */
  readonlyMode?: ReadonlyRenderConfig['mode'];
  /** 只读/预览渲染配置 */
  readonlyConfig?: ReadonlyRenderConfig;
  /** 只读/预览时使用的渲染器名称 */
  readonlyComponent?: string;
  /** 子字段配置 */
  children?: Omit<SchemaContextValue, 'children'>[];
  /** 原始 schema 配置 */
  rawSchema: unknown;
}

/**
 * SchemaContext 默认值
 */
const defaultSchemaContext: SchemaContextValue = {
  name: '',
  component: 'Input',
  rawSchema: {},
};

/**
 * SchemaContext - 字段静态配置上下文
 */
export const SchemaContext = createContext<SchemaContextValue>(defaultSchemaContext);

/**
 * SchemaContext Provider 组件
 */
export interface SchemaContextProviderProps {
  value: SchemaContextValue;
  children: ReactNode;
}

export const SchemaContextProvider: React.FC<SchemaContextProviderProps> = ({ value, children }) => (
  <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>
);

/**
 * 使用 SchemaContext 的 Hook
 */
export const useSchemaContext = (): SchemaContextValue => {
  const context = useContext(SchemaContext);
  if (!context) {
    throw new Error('useSchemaContext must be used within SchemaContextProvider');
  }
  return context;
};
