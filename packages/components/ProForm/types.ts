import React, { ReactNode } from 'react';
import { ColProps } from '@arco-design/web-react/lib/Grid';
import type { DraftStorage, DraftData } from '@lania-pro-components/utils';
import { FormStore } from './core';
import { ArcoFormInstance } from './hooks/useArcoForm';
import { BatchUpdateConfig, LazyLoadConfig, VirtualScrollConfig } from '@lania-pro-components/shared';

/**
 * 验证规则类型
 * 在文件内定义以避免循环依赖
 */
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  len?: number;
  precision?: number;
  step?: number;
  type?: 'number' | 'integer' | 'float' | 'string' | 'boolean';
  sign?: 'positive' | 'negative' | 'zero';
  whitespace?: boolean;
  pattern?: RegExp | string;
  validator?: (value: unknown, values: Record<string, unknown>) => string | undefined | Promise<string | undefined>;
  message?: string;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * @deprecated 请从 @lania-pro-components/shared 导入 LayoutMode
 * 此类型为向后兼容保留的本地副本
 */
export type LayoutMode = 'horizontal' | 'vertical' | 'inline' | 'compact';

/**
 * 按钮组位置
 */
export type ButtonPosition = 'left' | 'center' | 'right';

/**
 * 表单状态
 */
export type FormStatus = 'edit' | 'preview' | 'readonly' | 'disabled';

/**
 * 字段最终状态
 *
 * 由 schema.behavior 与表单级约束合并计算后的最终状态：
 * - edit: 正常编辑态
 * - readonly: 只读态（不可修改值）
 * - disabled: 禁用态（不可交互）
 * - hidden: 隐藏态（不渲染）
 */
export type FieldStatus = 'edit' | 'readonly' | 'disabled' | 'hidden';

/**
 * 字段行为声明
 *
 * 在 schema 中声明字段期望的最终状态。
 * 可以是静态值，也可以是接收全部表单值返回状态的函数（用于联动）。
 *
 * @example
 * // 静态：字段始终只读
 * behavior: 'readonly'
 *
 * // 函数：根据其他字段的值动态决定
 * behavior: (v) => v.type === 'detail' ? 'readonly' : 'edit'
 *
 * // 不声明：由表单级约束决定
 * behavior: undefined
 *
 * 注意：字段声明 'hidden' 为绝对隐藏，不受表单级约束覆盖。
 * 其他值遵循「全局优先级高于字段级」的合并规则。
 */
export type BehaviorDecl = FieldStatus | ((values: Record<string, unknown>) => FieldStatus) | undefined;

/**
 * ProForm 性能优化配置
 *
 * 注意：monitor 字段已移除（P0-3 破坏性变更），
 * 监控 UI 请使用组合方式接入 <PerformanceMonitor> 组件。
 */
export interface ProFormPerformanceConfig {
  /** 虚拟滚动配置 */
  virtualScroll?: VirtualScrollConfig;
  /** 懒加载配置 */
  lazyLoad?: LazyLoadConfig;
  /** 批量更新配置 */
  batchUpdate?: BatchUpdateConfig;
}

/**
 * Schema 处理配置选项
 */
export interface SchemaProcessOptions {
  /** 是否自动生成标签 */
  autoLabel?: boolean;
  /** 是否自动添加 placeholder */
  autoPlaceholder?: boolean;
  /** 是否自动添加 allowClear */
  autoAllowClear?: boolean;
  /** 是否自动添加验证规则 */
  autoRules?: boolean;
  /** 是否自动设置默认值 */
  autoDefaultValue?: boolean;
  /** 是否自动处理 RangePicker 数组字段名 */
  autoRangePickerName?: boolean;
}

/**
 * 字段联动规则
 */
export interface FieldReaction {
  /** 依赖的字段名列表 */
  dependencies: string[];
  /** 当依赖变化时执行 */
  run: (field: FieldNodeAPI, form: FormStoreAPI) => void;
}

/**
 * 字段生命周期
 */
export interface FieldLifecycle {
  /** 字段初始化时触发 */
  onInit?: (field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段值变化时触发 */
  onValueChange?: (value: unknown, oldValue: unknown, field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段错误变化时触发 */
  onError?: (error: string | undefined, field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段状态变化时触发 */
  onStatusChange?: (status: FieldStatus, oldStatus: FieldStatus, field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段销毁时触发 */
  onDestroy?: (field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段挂载时触发（DOM 已渲染） */
  onMount?: (field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段卸载时触发（DOM 即将移除） */
  onUnmount?: (field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段获得焦点时触发 */
  onFocus?: (field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段失去焦点时触发 */
  onBlur?: (field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段验证前触发 */
  onBeforeValidate?: (field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段验证后触发 */
  onAfterValidate?: (error: string | undefined, field: FieldNodeAPI, form: FormStoreAPI) => void;
  /** 字段重置时触发 */
  onReset?: (field: FieldNodeAPI, form: FormStoreAPI) => void;
}

/**
 * 只读/预览渲染配置
 */
export interface ReadonlyRenderConfig {
  mode?:
    | 'text'
    | 'json'
    | 'percentage'
    | 'decimal'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'time'
    | 'image'
    | 'video'
    | 'file'
    | 'link'
    | 'phone'
    | 'email'
    | 'idCard'
    | 'tag'
    | 'custom';
  format?: string;
  emptyText?: string;
  prefix?: string;
  suffix?: string;
  precision?: number;
  thousands?: boolean;
  currencySymbol?: string;
  maxLength?: number;
  ellipsis?: string;
  separator?: string;
  tagColors?: Record<string, string>;
  render?: (
    value: unknown,
    config: ReadonlyRenderConfig,
    options?: Array<{ label: string; value: unknown; [key: string]: unknown }>,
  ) => ReactNode;
  preview?: {
    width?: number;
    height?: number;
  };
  link?: {
    target?: string;
    rel?: string;
  };
}

/**
 * 函数模式辅助类型：静态值 T 或根据表单值动态计算的函数
 */
type SchemaFunctionValue<T, TValues = Record<string, unknown>> = T | ((values: TValues) => T);

/**
 * ProForm Schema 定义
 *
 * 支持函数模式的字段（标注了 "支持函数模式"）可以传入静态值或函数，
 * 函数接收当前所有表单字段的值，返回动态计算的结果，用于实现字段间联动。
 */
export interface ProFormSchema<TValues = Record<string, unknown>> {
  /** 字段名称 */
  name: string | string[];
  /**
   * 字段标签（支持函数模式）
   * @example
   * label: '用户名'
   * label: (v) => v.type === 'edit' ? '编辑用户名' : '新增用户名'
   */
  label?: SchemaFunctionValue<string, TValues>;
  /**
   * 组件类型（支持函数模式）
   * @example
   * component: 'Input'
   * component: (v) => v.amount > 10000 ? 'InputNumber' : 'Input'
   */
  component?: SchemaFunctionValue<string, TValues>;
  /**
   * 组件属性（支持函数模式）
   * @example
   * componentProps: { max: 100 }
   * componentProps: (v) => ({ max: v.amount, disabled: v.readonly })
   */
  componentProps?: SchemaFunctionValue<Record<string, unknown>, TValues>;
  /** 是否必填（支持函数形式实现条件必填） */
  required?: boolean | ((values: Record<string, unknown>) => boolean);
  /**
   * 必填项错误提示（支持函数模式）
   * @example
   * requiredMessage: '此项必填'
   * requiredMessage: (v) => `请填写${v.type === 'edit' ? '修改' : '新增'}信息`
   */
  requiredMessage?: SchemaFunctionValue<string, TValues>;
  /**
   * 验证规则（支持函数模式）
   * @example
   * rules: [{ required: true }]
   * rules: (v) => v.withPhone ? [{ required: true, pattern: /^\d{11}$/ }] : []
   */
  rules?: SchemaFunctionValue<ValidationRule[], TValues>;
  /** 自定义验证函数 */
  validate?: (value: unknown, values: Record<string, unknown>) => string | undefined | Promise<string | undefined>;
  /** 初始值 */
  initialValue?: unknown;
  /**
   * 在 Grid 布局中占用的列数（支持函数模式）
   * @example
   * col: 12
   * col: (v) => v.expanded ? 24 : 12
   */
  col?: SchemaFunctionValue<number, TValues>;
  /**
   * 标签列配置（支持函数模式）
   * @example
   * labelCol: { span: 6 }
   * labelCol: (v) => v.compact ? { span: 4 } : { span: 6 }
   */
  labelCol?: SchemaFunctionValue<ColProps, TValues>;
  /**
   * 内容列配置（支持函数模式）
   */
  wrapperCol?: SchemaFunctionValue<ColProps, TValues>;
  /**
   * 标签提示信息（支持函数模式）
   * @example
   * tooltip: '请输入用户名'
   * tooltip: (v) => v.type === 'phone' ? '请输入11位手机号' : '请输入用户名'
   */
  tooltip?: SchemaFunctionValue<string, TValues>;
  /**
   * 表单项额外提示信息（支持函数模式）
   */
  extra?: SchemaFunctionValue<ReactNode, TValues>;
  /**
   * 占位符文本（支持函数模式）
   * @example
   * placeholder: '请输入'
   * placeholder: (v) => v.mode === 'search' ? '搜索关键词' : '请输入内容'
   */
  placeholder?: SchemaFunctionValue<string | string[], TValues>;
  /**
   * 选项数据（支持函数模式，实现级联选择）
   * @example
   * options: [{ label: 'A', value: 1 }]
   * options: (v) => optionsMap[v.category] || []
   */
  options?: SchemaFunctionValue<Array<{ label: string; value: unknown; [key: string]: unknown }>, TValues>;
  /**
   * 日期/时间格式化字符串（支持函数模式）
   */
  format?: SchemaFunctionValue<string, TValues>;
  /**
   * 日期值格式（提交时的格式，支持函数模式）
   */
  valueFormat?: SchemaFunctionValue<string, TValues>;
  /**
   * 前缀文本（支持函数模式）
   * @example
   * prefix: '¥'
   * prefix: (v) => v.currency === 'usd' ? '$' : '¥'
   */
  prefix?: SchemaFunctionValue<string, TValues>;
  /**
   * 后缀文本（支持函数模式）
   * @example
   * suffix: '元'
   * suffix: (v) => v.unit === 'yuan' ? '元' : '美元'
   */
  suffix?: SchemaFunctionValue<string, TValues>;
  /** 值转换函数（接收整个表单值，可跨字段计算） */
  transform?: {
    input?: (values: Record<string, unknown>) => unknown;
    output?: (values: Record<string, unknown>) => unknown;
  };
  /** 依赖的字段名列表 */
  dependencies?: string[];
  /**
   * 字段行为声明
   *
   * 声明字段期望的最终状态。可以是 FieldStatus 静态值或返回 FieldStatus 的函数。
   * 最终状态由字段声明与表单级约束（preview/readonly/disabled）合并计算。
   *
   * 合并规则：
   *   字段声明 hidden → hidden（绝对隐藏，不受表单级覆盖）
   *   表单级 preview  → readonly
   *   表单级 readonly → readonly
   *   表单级 disabled → disabled
   *   字段自身声明    → 字段声明的值
   *   兜底            → edit
   *
   * @example
   * behavior: 'readonly'
   * behavior: (v) => v.status === 'done' ? 'readonly' : 'edit'
   */
  behavior?: BehaviorDecl;
  /** 字段联动规则 */
  reactions?: FieldReaction[];
  /** 字段生命周期 */
  lifecycle?: FieldLifecycle;
  /**
   * 只读/预览渲染模式（支持函数模式）
   */
  readonlyMode?: SchemaFunctionValue<ReadonlyRenderConfig['mode'], TValues>;
  /**
   * 只读/预览渲染配置（支持函数模式）
   */
  readonlyConfig?: SchemaFunctionValue<ReadonlyRenderConfig, TValues>;
  /**
   * 只读/预览时使用的渲染器名称（支持函数模式）
   */
  readonlyComponent?: SchemaFunctionValue<string, TValues>;
  /** 子字段配置 */
  children?: Array<ProFormSchema<TValues>>;
  /** 字段值变化回调 */
  onFieldChange?: (value: unknown, allValues: TValues) => void;
  /**
   * 字段级键盘导航配置（支持函数模式）
   */
  keyboardNavigation?: SchemaFunctionValue<
    KeyboardNavigationConfig & {
      /** 字段级 focus 回调（优先于全局 onFieldFocus） */
      onFocus?: (name: string) => void;
      /** 字段级 blur 回调（优先于全局 onFieldBlur） */
      onBlur?: (name: string) => void;
    },
    TValues
  >;
}

/**
 * 按钮配置
 */
export interface ButtonConfig<TValues = Record<string, unknown>> {
  key?: string;
  text?: string;
  type?: 'primary' | 'secondary' | 'outline' | 'text';
  status?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  htmlType?: 'button' | 'submit' | 'reset';
  onClick?: (values: TValues, form: ProFormInstance<TValues>) => void;
  props?: Record<string, unknown>;
}

/**
 * 键盘导航配置
 */
export interface KeyboardNavigationConfig {
  /** 是否启用键盘导航 */
  enabled?: boolean;
  /** 是否自动聚焦第一个字段 */
  autoFocusFirstField?: boolean;
  /** Tab 键行为: 'next' 只切换下一个, 'default' 使用浏览器默认行为 */
  tabBehavior?: 'next' | 'default';
  /** 是否启用上下键导航 */
  arrowKeyNavigation?: boolean;
}

/**
 * 草稿持久化配置
 */
export interface DraftConfig {
  /** 表单标识（必填，用于多实例隔离，建议格式：`模块-表单名-ID`） */
  formKey: string;
  /** 是否启用自动保存，默认 true */
  enabled?: boolean;
  /** 自动保存防抖延迟（毫秒），默认 3000ms */
  autoSaveDelay?: number;
  /** 草稿过期时间（毫秒），默认 24 小时 */
  ttl?: number;
  /** 存储类型：'localStorage' | 'sessionStorage' | 自定义策略 */
  storage?: 'localStorage' | 'sessionStorage' | DraftStorage;
  /** 草稿恢复时的回调（用于展示恢复确认 UI） */
  onDraftRestored?: (values: Record<string, unknown>) => void;
  /** 发现草稿时的回调（用于展示提示） */
  onDraftAvailable?: (data: DraftData) => void;
}

/**
 * ProForm 组件属性
 */
export interface ProFormProps<TValues = Record<string, unknown>> {
  /**
   * 表单实例（由 useProForm 返回的 instance）。
   *
   * 传入后 ProForm 复用该状态和数据，不再内部调用 useProForm 创建新实例。
   */
  instance?: ProFormInstance<TValues>;

  /** 表单字段配置数组 */
  schemas?: Array<ProFormSchema<TValues>>;
  /** 表单布局模式 */
  layout?: LayoutMode;
  /** 标签列配置 */
  labelCol?: ColProps;
  /** 内容列配置 */
  wrapperCol?: ColProps;
  /** 是否显示冒号 */
  colon?: boolean;
  /** 标签对齐方式 */
  labelAlign?: 'left' | 'right';
  /** 表单尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 是否禁用所有字段 */
  disabled?: boolean;
  /** 是否只读所有字段 */
  readonly?: boolean;
  /** 是否为草稿模式 */
  draft?: boolean;
  /** 是否为预览模式 */
  preview?: boolean;
  /** 表单初始值 */
  initialValues?: Partial<TValues>;
  /** 表单提交成功回调 */
  onFinish?: (values: TValues) => void | Promise<void>;
  /** 表单提交失败回调 */
  onFinishFailed?: (errorInfo: unknown) => void;
  /** 字段值变化回调 */
  onValuesChange?: (changedValues: Partial<TValues>, allValues: TValues) => void;
  /** 字段变化回调 */
  onFieldsChange?: (changedFields: unknown, allFields: unknown) => void;
  /** 草稿模式变化回调 */
  onDraftChange?: (draft: boolean) => void;
  /** 预览模式变化回调 */
  onPreviewChange?: (preview: boolean) => void;
  /** 是否显示按钮组 */
  showButton?: boolean;
  /** 提交按钮文本 */
  submitText?: string;
  /** 重置按钮文本 */
  resetText?: string;
  /** 提交按钮加载状态 */
  submitLoading?: boolean;
  /** 重置按钮加载状态 */
  resetLoading?: boolean;
  /** 是否显示提交按钮 */
  showSubmitButton?: boolean;
  /** 是否显示重置按钮 */
  showResetButton?: boolean;
  /** 重置按钮点击事件 */
  onReset?: () => void;
  /** 按钮组位置 */
  buttonPosition?: ButtonPosition;
  /** 是否启用展开/收起 */
  collapsible?: boolean;
  /** 折叠状态（受控） */
  collapsed?: boolean;
  /** 默认折叠状态（非受控） */
  defaultCollapsed?: boolean;
  /** 折叠时展示的行数 */
  collapsedRows?: number;
  /** 展开按钮文案 */
  expandText?: string;
  /** 收起按钮文案 */
  collapseText?: string;
  /** 折叠状态变更回调 */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Grid 布局行数 */
  rows?: number;
  /** 自定义按钮组 */
  buttons?: ReactNode;
  /** 自定义按钮列表 */
  buttonList?: Array<ButtonConfig<TValues>>;
  /** 确认按钮属性 */
  okButtonProps?: Record<string, unknown>;
  /** 取消按钮属性 */
  cancelButtonProps?: Record<string, unknown>;
  /** Row 组件属性 */
  rowProps?: Record<string, unknown>;
  /** Col 组件属性 */
  colProps?: Record<string, unknown>;
  /** Grid 布局列数 */
  columns?: number;
  /** Grid 布局间距 */
  gutter?: number | [number, number];
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 验证失败时是否自动滚动到第一个错误字段 */
  scrollToFirstError?: boolean;
  /** 验证触发时机 */
  validateTrigger?: 'onBlur' | 'onChange' | 'onFocus';
  /** 全局标签列配置（别名） */
  labelColProps?: ColProps;
  /** 全局内容列配置（别名） */
  wrapperColProps?: ColProps;

  /** 卡片容器模式 */
  cardContainer?:
    | boolean
    | {
        title?: ReactNode;
        extra?: ReactNode;
        bordered?: boolean;
        style?: React.CSSProperties;
        className?: string;
        bodyStyle?: React.CSSProperties;
      };
  /** 性能优化配置 */
  performance?: ProFormPerformanceConfig;
  /** Schema 处理配置选项 */
  schemaProcessOptions?: SchemaProcessOptions;

  /** 全局值转换配置（作用于所有字段，schema 层可覆盖，接收整个表单值） */
  transform?: {
    input?: (values: Record<string, unknown>) => unknown;
    output?: (values: Record<string, unknown>) => unknown;
  };
  /** 全局生命周期钩子（作用于所有字段） */
  lifecycle?: FieldLifecycle;
  /** 全局校验消息模板 */
  validateMessages?: Record<string, string>;
  /** 全局日期值格式 */
  valueFormat?: string;
  /** 全局日期显示格式 */
  dateFormat?: string;

  /** 键盘导航配置 */
  keyboardNavigation?: KeyboardNavigationConfig;
  /** 全局字段聚焦回调（字段级 schema.keyboardNavigation.onFocus 优先） */
  onFieldFocus?: (name: string) => void;
  /** 全局字段失焦回调（字段级 schema.keyboardNavigation.onBlur 优先） */
  onFieldBlur?: (name: string) => void;
  /** 草稿持久化配置（启用后自动保存表单草稿到 localStorage） */
  draftStorage?: DraftConfig;
}

/**
 * FieldNode API（字段运行时实例接口）
 */
/**
 * 已解析的 Schema（函数模式字段被解析为具体值后的结果）
 * 用于 FieldNode.resolvedSchema 的返回类型
 */
export interface ResolvedSchema {
  label?: string;
  component: string;
  componentProps?: Record<string, unknown>;
  requiredMessage?: string;
  rules?: ValidationRule[];
  col?: number;
  labelCol?: ColProps;
  wrapperCol?: ColProps;
  tooltip?: string;
  extra?: ReactNode;
  placeholder?: string | string[];
  options?: Array<{ label: string; value: unknown; [key: string]: unknown }>;
  format?: string;
  valueFormat?: string;
  prefix?: string;
  suffix?: string;
  readonlyMode?: ReadonlyRenderConfig['mode'];
  readonlyConfig?: ReadonlyRenderConfig;
  readonlyComponent?: string;
}

export interface FieldNodeAPI {
  /** 字段名称 */
  name: string | string[];
  /** 字段 Schema（原始定义，可能包含函数） */
  schema: ProFormSchema;
  /** 已解析的 Schema（所有函数模式字段已被解析为具体值，响应式） */
  resolvedSchema: ResolvedSchema;
  /** 当前值 */
  value: unknown;
  /** 错误信息 */
  error?: string;
  /** 当前状态 */
  status: FieldStatus;
  /** 计算后的必填标识（由 schema.required 解析，支持函数形式） */
  computedRequired: boolean;
  /** 焦点状态 */
  focused?: boolean;
  /** 设置值 */
  setValue: (value: unknown) => void;
  /** 获取值 */
  getValue: () => unknown;
  /** 设置错误 */
  setError: (error?: string) => void;
  /** 设置状态 */
  setStatus: (status: FieldStatus) => void;
  /** 手动刷新有效状态（合并 schema.behavior + 表单级约束） */
  refreshEffectiveStatus: () => void;
  /** 设置焦点 */
  setFocus: () => void;
  /** 移除焦点 */
  removeFocus: () => void;
  /** 订阅值变化（回调参数为组件值，即经过 transform.input 转换后的值） */
  subscribeToValueChange: (callback: (value: unknown, oldValue: unknown) => void) => () => void;
  /** 订阅状态变化 */
  subscribeToStatusChange: (callback: (status: FieldStatus, oldStatus: FieldStatus) => void) => () => void;
  /**
   * 订阅已解析 Schema 变化
   * 当任意表单字段值变化导致 resolvedSchema 重新计算时触发
   */
  subscribeToResolvedSchemaChange: (callback: (resolved: ResolvedSchema) => void) => () => void;
  /** 验证字段 */
  validate: () => Promise<string | undefined>;
}

/**
 * FormStore API（表单存储接口）
 */
export interface FormStoreAPI {
  /** 获取所有值（存储值） */
  getValues: () => Record<string, unknown>;
  /** 获取单个值（存储值） */
  getValue: (name: string) => unknown;
  /** 设置值 */
  setValue: (name: string, value: unknown) => void;
  /** 批量设置值 */
  setValues: (values: Record<string, unknown>) => void;
  /** 获取字段实例 */
  getField: (name: string | string[]) => FieldNodeAPI | undefined;
  /** 注册字段 */
  registerField: (field: FieldNodeAPI) => void;
  /** 注销字段 */
  unregisterField: (name: string | string[]) => void;
  /** 执行联动 */
  runReactions: (changedField: string, newValue?: unknown, oldValue?: unknown) => void;
  /** 获取所有字段 */
  getAllFields: () => Map<string, FieldNodeAPI>;
  /** 设置字段错误 */
  setFieldError: (name: string, error: string | undefined) => void;
  /** 清除所有错误 */
  clearErrors: () => void;
  /** 验证单个字段 */
  validateField: (name: string) => Promise<string | undefined>;
  /** 验证所有字段 */
  validateAllFields: () => Promise<Record<string, string>>;
  /** 重置所有字段到初始值 */
  reset: () => void;
  /** 重置指定字段到初始值 */
  resetField: (name: string) => void;
  /** 设置表单级约束（preview/readonly/disabled） */
  setFormConstraints: (constraints: { preview?: boolean; readonly?: boolean; disabled?: boolean }) => void;
  /** 获取表单级约束 */
  getFormConstraints: () => { preview: boolean; readonly: boolean; disabled: boolean };
  /** 配置批量更新策略（同步/异步） */
  setBatchUpdateConfig: (config?: BatchUpdateConfig) => void;
}

/**
 * ProForm 实例
 */
export interface ProFormInstance<TValues = Record<string, unknown>> {
  /** Arco Design Form 桥接实例 */
  arcoForm: ArcoFormInstance;
  /** 表单数据仓库 */
  store: FormStore;
  /** 验证所有字段 */
  validate: () => Promise<TValues>;
  /** 验证指定字段 */
  validateField: (name: string | string[]) => Promise<unknown>;
  /** 清除验证信息 */
  clearValidate: (name?: string | string[]) => void;
  /** 批量设置字段值 */
  setFieldsValue: (values: Partial<TValues>) => void;
  /** 设置单个字段值 */
  setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  /** 获取单个字段值 */
  getFieldValue: <K extends keyof TValues>(name: K) => TValues[K];
  /** 获取所有字段值 */
  getFieldsValue: (nameList?: Array<keyof TValues>) => TValues;
  /** 获取组件实例引用 */
  getRef: <R = unknown>(name: string) => R | undefined;
  /** 动态更新表单配置 */
  setSchemas: (schemas: Array<ProFormSchema<TValues>>) => void;
  /** 获取表单配置 */
  getSchemas: () => Array<ProFormSchema<TValues>>;
  /** 动态更新表单属性 */
  setProps: (props: Partial<ProFormProps<TValues>>) => void;
  /** 获取表单属性 */
  getProps: () => ProFormProps<TValues>;
  /** 重置字段值 */
  resetFields: (nameList?: Array<keyof TValues>) => void;
  /** 滚动到指定字段 */
  scrollToField: (name: string) => void;
  /** 提交表单 */
  submit: () => Promise<TValues>;
  /** 获取字段状态 */
  getFieldStatus: (name: string) => FieldStatus;
  /** 设置字段状态 */
  setFieldStatus: (name: string, status: FieldStatus) => void;
  /** 获取全部字段状态 */
  getFieldStatusMap: () => Record<string, FieldStatus>;
  /** 批量设置字段状态 */
  setFieldStatusMap: (statusMap: Record<string, FieldStatus>) => void;
  /** 判断是否为草稿模式 */
  isDraft: () => boolean;
  /** 设置草稿模式 */
  setDraft: (draft: boolean) => void;
  /** 判断是否为预览模式 */
  isPreview: () => boolean;
  /** 设置预览模式 */
  setPreview: (preview: boolean) => void;
  /** 聚焦到指定字段 */
  focusField: (name: string) => void;
  /** 聚焦到下一个字段 */
  focusNextField: (currentName?: string) => void;
  /** 聚焦到上一个字段 */
  focusPrevField: (currentName?: string) => void;
  /** 获取当前聚焦的字段名 */
  getFocusedField: () => string | undefined;
  /** 获取指定字段的聚焦状态 */
  getFieldFocused: (name: string) => boolean;
}

/**
 * ProForm 注入给自定义表单控件的 props
 *
 * 自定义表单控件注册到 componentRegistry 后，在编辑态渲染时由 FormField 自动注入以下字段。
 * 开发者可在此基础上通过 componentProps 透传额外的业务 props（泛型扩展）。
 */
export interface ProFormFieldComponentProps<TValue = unknown, TValues = Record<string, unknown>> {
  /** 字段值（经 transform.input 转换后的展示形态） */
  value: TValue;
  /** 值变化回调（内部走 transform.output 转换后写入 store） */
  onChange: (value: TValue, ...rest: unknown[]) => void;
  /** 字段状态 */
  status: FieldStatus;
  /** 整个表单的值 */
  values: TValues;
  /** 已解析的 schema（label/componentProps/rules 等已解析为最终值） */
  schema: ResolvedSchema;
  /** FieldNode 实例（提供 getValue/setValue/validate/setStatus 等能力） */
  field: FieldNodeAPI;
  /** 表单实例（提供 getFieldsValue/setFieldsValue/validate 等能力） */
  form: ProFormInstance<TValues>;
  /** 获焦回调 */
  onFocus: () => void;
  /** 失焦回调 */
  onBlur: () => void;
  /** 允许通过 componentProps 透传额外的业务 props */
  [key: string]: unknown;
}

/**
 * 组件注册表
 */
export interface ComponentRegistry {
  [key: string]: React.ComponentType<ProFormFieldComponentProps>;
}

/**
 * 快速组件配置
 */
export interface QuickComponentConfig {
  prefix?: string;
  suffix?: string;
  baseComponent?: string;
  formatter?: (value: unknown) => unknown;
  parser?: (value: unknown) => unknown;
}

/**
 * 只读渲染器类型
 *
 * @param value    字段展示值
 * @param options  选项列表（用于 Select/Radio/Checkbox 等将 value 映射为 label）
 * @param config   只读渲染配置（format/emptyText/mode 等）
 * @param componentProps  组件原始 props
 * @param meta     字段上下文元信息（status、全表单值等）
 */
export type ReadonlyRenderer = (
  value: unknown,
  options: Array<{ label: string; value: unknown; [key: string]: unknown }> | undefined,
  config: ReadonlyRenderConfig,
  componentProps?: Record<string, unknown>,
  meta?: { status: FieldStatus; values: Record<string, unknown> },
) => React.ReactNode;

/**
 * 只读渲染器注册表
 */
export interface ReadonlyRendererRegistry {
  [key: string]: ReadonlyRenderer;
}

/**
 * 只读渲染器注册表类型别名
 */
export type ReadonlyRegistry = ReadonlyRendererRegistry;

/**
 * FormItem 组件属性
 */
export interface FormItemProps {
  /** 字段名 */
  field?: string;
  /** 标签 */
  label?: React.ReactNode;
  /** 标签列配置 */
  labelCol?: ColProps | number;
  /** 内容列配置 */
  wrapperCol?: ColProps | number;
  /** 验证规则 */
  rules?: ValidationRule[];
  /** 初始值 */
  initialValue?: unknown;
  /** 标签提示 */
  tooltip?: string;
  /** 额外提示信息 */
  extra?: React.ReactNode;
  /** 验证状态 */
  validateStatus?: 'success' | 'warning' | 'error' | 'validating';
  /** 帮助文本 */
  help?: React.ReactNode;
  /** 是否必填 */
  required?: boolean;
  /** 子元素 */
  children?: React.ReactNode;
  /** 是否显示冒号 */
  colon?: boolean;
  /** 标签对齐方式 */
  labelAlign?: 'left' | 'right';
  /** 布局模式 */
  layout?: 'horizontal' | 'vertical' | 'inline';
}

export interface ProFormContextValue<TValues = Record<string, unknown>> {
  instance: ProFormInstance<TValues>;
  bindingProps: ProFormProps<TValues>;
  store: FormStore;
  arcoForm: ArcoFormInstance;
}
export type UsrProFormFn<TValues = Record<string, unknown>> = () => ProFormContextValue<TValues>;

/**
 * useProForm Hook 配置选项
 */
export interface UseProFormOptions<TValues = Record<string, unknown>> extends Omit<ProFormProps<TValues>, 'schemas'> {
  schemas?: ProFormSchema<TValues>[];
  initialValues?: Partial<TValues>;
  onValuesChange?: (changedValues: Partial<TValues>, allValues: TValues) => void;
  onFieldsChange?: (changedFields: unknown, allFields: unknown) => void;
  /** Arco Form 实例引用 */
  formRef?: React.Ref<unknown>;
}

/**
 * useProForm Hook 返回值
 */
export interface UseProFormReturn<TValues = Record<string, unknown>> {
  /** Arco Design Form 桥接实例 */
  arcoForm: ArcoFormInstance;
  /** 表单实例（含 validate/setValues/getValues 等数据方法 + focusField/scrollToField 等 UI 方法） */
  instance: ProFormInstance<TValues>;
  /** 可直接绑定到 ProForm 组件的 UI 配置 props */
  bindingProps: ProFormProps<TValues>;
  /** 表单数据仓库 */
  store: FormStore;
  /** 动态更新表单属性 */
  setProps: (props: Partial<ProFormProps<TValues>>) => void;
  /** 获取表单属性 */
  getProps: () => ProFormProps<TValues>;
}

export type GetComponentRefFn = <R = unknown>(name: string) => R | undefined;
