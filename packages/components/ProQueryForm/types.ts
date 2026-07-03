/**
 * ProQueryForm 类型定义
 *
 * 独立查询表单组件类型，支持双形态入参（columns / schemas）和双模式（轻量/重量）
 */

import type { ProColumnType } from '../ProTable/types';
import type { ProFormSchema, ProFormInstance, ProFormProps, SchemaProcessOptions } from '../ProForm/types';
import type { DataStoreImpl } from '../ProTable/store/DataStore';

/** ProQueryForm 主组件 Props */
export interface ProQueryFormProps<T = Record<string, unknown>> {
  /** === 字段定义（二选一）=== */
  /** 形态 A：列驱动（与 ProTable 互通），内部转 schema */
  columns?: ProColumnType<T>[];
  /** 形态 B：Schema 驱动，跳过转换 */
  schemas?: ProFormSchema<T>[];

  /** === 布局 === */
  /** 表单布局 */
  layout?: 'horizontal' | 'vertical' | 'inline';
  /** Grid 列数 */
  column?: number;
  /** 折叠模式 */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  collapsedRows?: number;

  /** === 查询行为 === */
  /** 查询回调（轻量模式必填，或与 store 二选一） */
  onSearch?: (params: Record<string, unknown>) => void;
  /** 重置回调 */
  onReset?: () => void;
  /** 查询前参数转换 */
  beforeSearch?: (params: Record<string, unknown>) => Record<string, unknown>;
  /** 是否显示查询按钮（默认 true） */
  showSearch?: boolean;
  /** 是否显示重置按钮（默认 true） */
  showReset?: boolean;
  /** 查询按钮文本 */
  searchButtonText?: string;
  /** 重置按钮文本 */
  resetButtonText?: string;

  /** === 重量模式（与 ProTable DataStore 集成）=== */
  /** DataStore 实例（传入则启用重量模式） */
  store?: DataStoreImpl<T>;
  /** URL 同步（仅重量模式生效） */
  urlSync?: boolean | UrlSyncConfig;
  /** 查询方案管理（轻量/重量模式均可） */
  searchSchema?: SearchSchemaConfig;

  /** === ProForm 透传 === */
  /** 透传给 ProForm 的配置（除 schemas/onFinish/onReset 外） */
  formProps?: Omit<ProFormProps, 'schemas' | 'onFinish' | 'onReset'>;
  /** formRef（暴露 ProFormInstance） */
  formRef?: React.Ref<ProFormInstance>;
  /** Schema 自动补全配置 */
  schemaProcessOptions?: SchemaProcessOptions;

  /** === 通用 === */
  className?: string;
  style?: React.CSSProperties;
}

/** ProQueryForm 实例（通过 ref 访问） */
export interface ProQueryFormInstance {
  /** 提交查询（等价于点击查询按钮） */
  submit(): Promise<void>;
  /** 重置表单（等价于点击重置按钮） */
  reset(): void;
  /** 获取当前表单值 */
  getFieldsValue(): Record<string, unknown>;
  /** 设置表单值 */
  setFieldsValue(values: Record<string, unknown>): void;
  /** 获取 ProForm 原始实例（escape hatch） */
  getFormInstance(): ProFormInstance | null;
}

/** URL 同步配置 */
export interface UrlSyncConfig {
  prefix?: string;
  include?: string[];
  exclude?: string[];
}

/** 查询方案管理配置 */
export interface SearchSchemaConfig {
  enabled?: boolean;
  persistenceKey?: string;
  defaultSchema?: string;
  schemas?: Array<{ key: string; name: string; params: Record<string, unknown> }>;
  initialSchemas?: Array<{ key: string; name: string; params: Record<string, unknown> }>;
  maxCount?: number;
}

/** 轻量 Store 适配器类型（实现 DataStoreImpl 最小接口子集） */
export interface LightweightStore {
  getState(): {
    query: Record<string, unknown>;
    pagination: { current: number; pageSize: number };
    sorter: Record<string, unknown>;
    filters: Record<string, unknown>;
  };
  setQuery(query: Record<string, unknown>): void;
  setPage(current: number): void;
  setPageSize(pageSize: number): void;
  setSorter(field?: string, order?: 'ascend' | 'descend'): void;
  setFilters(filters: Record<string, string[]>): void;
  subscribe(listener: () => void): () => void;
}
