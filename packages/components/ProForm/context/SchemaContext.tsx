/**
 * Schema 上下文（SchemaContext）
 *
 * 向当前字段的子组件暴露 Schema 配置信息，包括：
 * - 字段名称 / 标签
 * - 组件类型 / 组件属性
 * - 验证规则 / 行为配置 / 联动规则
 * - 生命周期配置
 * - 只读渲染模式 / 配置
 *
 * 子组件通过 useSchemaContext() 获取这些配置。
 */
import React, { createContext, useContext, ReactNode } from 'react';
import type { BehaviorDecl, FieldReaction, FieldLifecycle, ReadonlyRenderConfig, ValidationRule } from '../types';

/**
 * SchemaContext 值类型
 * 已解析的字段静态配置（函数模式的值已被解析为具体值），来自用户定义的 Schema
 */
export interface SchemaContextValue {
  /** 字段名称 */
  name: string | string[];
  /** 字段标签（已解析） */
  label?: string;
  /** 使用的组件名称（已解析） */
  component: string;
  /** 组件属性（已解析） */
  componentProps?: Record<string, unknown>;
  /** 验证规则（已解析） */
  rules?: ValidationRule[];
  /** 依赖的字段名列表 */
  dependencies?: string[];
  /** 字段行为声明 */
  behavior?: BehaviorDecl;
  /** 字段联动规则 */
  reactions?: FieldReaction[];
  /** 字段生命周期 */
  lifecycle?: FieldLifecycle;
  /** 初始值 */
  initialValue?: unknown;
  /** Grid 列数（已解析） */
  col?: number;
  /** 标签列配置（已解析） */
  labelCol?: unknown;
  /** 内容列配置（已解析） */
  wrapperCol?: unknown;
  /** 标签提示信息（已解析） */
  tooltip?: string;
  /** 表单项额外提示信息（已解析） */
  extra?: React.ReactNode;
  /** 占位符文本（已解析） */
  placeholder?: string | string[];
  /** 选项数据（已解析） */
  options?: Array<{ label: string; value: unknown; [key: string]: unknown }>;
  /** 日期/时间格式化字符串（已解析） */
  format?: string;
  /** 日期值格式（已解析） */
  valueFormat?: string;
  /** 前缀文本（已解析） */
  prefix?: string;
  /** 后缀文本（已解析） */
  suffix?: string;
  /** 是否必填（支持函数形式实现条件必填） */
  required?: boolean | ((values: Record<string, unknown>) => boolean);
  /** 只读/预览渲染模式（已解析） */
  readonlyMode?: ReadonlyRenderConfig['mode'];
  /** 只读/预览渲染配置（已解析） */
  readonlyConfig?: ReadonlyRenderConfig;
  /** 只读/预览时使用的渲染器名称（已解析） */
  readonlyComponent?: string;
  /** 必填项错误提示（已解析） */
  requiredMessage?: string;
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
