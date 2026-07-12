/**
 * ProForm 上下文模块
 *
 * 通过 React Context 实现跨层级的表单配置传递，
 * 避免 props drilling，使深层嵌套的子组件也能访问表单上下文。
 *
 * 包含 5 个 Context：
 * - RootContext: 表单根上下文（formRef, instance, formState, onValuesChange）
 * - SchemaContext: 当前字段的 Schema 配置
 * - FieldContext: 当前字段的运行时状态（value/status/error/focused）
 * - LayoutContext: 布局配置（columns/labelCol/wrapperCol）
 * - FormConfigContext: 表单全局配置（formName）
 * - ExtensionContext: 扩展上下文（权限/审计/国际化）
 */
export {
  RootContext,
  RootContextProvider,
  useRootContext,
  createFormState,
  type RootContextValue,
  type FormState,
} from './RootContext';

// SchemaContext
export { SchemaContext, SchemaContextProvider, useSchemaContext, type SchemaContextValue } from './SchemaContext';

// FieldContext
export {
  FieldContext,
  FieldContextProvider,
  useFieldContext,
  useFieldContextOptional,
  type FieldContextValue,
} from './FieldContext';

// LayoutContext
export {
  LayoutContext,
  LayoutContextProvider,
  useLayoutContext,
  useLayoutContextOptional,
  type LayoutContextValue,
} from './LayoutContext';

// ExtensionContext
export {
  ExtensionContext,
  ExtensionContextProvider,
  useExtensionContext,
  useExtension,
  type ExtensionContextValue,
  type ExtensionContextProviderProps,
  type ExtensionRegistry,
  type PermissionExtension,
  type AuditExtension,
  type I18nExtension,
} from './ExtensionContext';
