/**
 * ProForm 模块统一入口
 *
 * ProForm 是 Lania Pro Components 的核心表单组件，采用 FormStore + FieldNode + Renderer 的架构设计。
 *
 * 核心架构分层：
 * ┌─────────────────────────────────────────────┐
 * │  ProForm (组件层) — Schema 驱动的表单容器     │
 * ├─────────────────────────────────────────────┤
 * │  FormStore (数据层) — 响应式表单状态管理       │
 * ├─────────────────────────────────────────────┤
 * │  FieldNode (字段运行时) — 字段级别的状态/行为   │
 * ├─────────────────────────────────────────────┤
 * │  FormField (渲染层) — 字段到 Arco Form.Item    │
 * ├─────────────────────────────────────────────┤
 * │  componentRegistry (组件注册) — 插件化组件扩展  │
 * └─────────────────────────────────────────────┘
 *
 * 主要导出：
 * - ProForm: Schema 驱动的表单容器组件
 * - FormField: 单个字段的渲染组件
 * - useProForm: 编程式表单控制 Hook
 * - FormStore / FieldNode / ValidationEngine: 核心数据层
 * - componentRegistry / readonlyRegistry: 组件注册系统
 * - 上下文 Provider: RootContext / SchemaContext / FieldContext / LayoutContext
 * - 高级组件: ProFormList（动态列表）/ ProFormSteps（分步表单）
 * - 性能优化: useVirtualScroll / useLazyField
 */
// ProForm - 新一代表单组件
// 基于 FormEngine + FieldRuntime + RendererSystem 架构

// 类型定义
export type {
  ProFormSchema,
  ProFormProps,
  ProFormInstance,
  FieldNodeAPI,
  FormStoreAPI,
  BehaviorDecl,
  FieldReaction,
  FieldLifecycle,
  ReadonlyRenderConfig,
  ReadonlyRenderer,
  QuickComponentConfig,
  ComponentRegistry,
  ProFormFieldComponentProps,
  ReadonlyRegistry,
  LayoutMode,
  ButtonPosition,
  FormStatus,
  FieldStatus,
  ResolvedSchema,
  ButtonConfig,
  ProFormPerformanceConfig,
} from './types';

// 工具函数
export { resolveSchemaValue, resolveSchemaFields } from './utils/resolveSchemaValue';

// 核心组件
export { ProForm } from './components/ProForm';
export { FormField } from './components/FormField';

// Hook
export { useProForm, useProFormContext, ProFormContext } from './hooks/useProForm';

// 上下文
export {
  RootContext,
  useRootContext,
  SchemaContext,
  useSchemaContext,
  FieldContext,
  useFieldContext,
  LayoutContext,
  useLayoutContext,
} from './context';

// 注册表
export {
  componentRegistry,
  registerComponent,
  registerQuickComponent,
  parseQuickComponent,
  stripFormControlProps,
  readonlyRegistry,
  registerReadonlyRenderer,
  getReadonlyRenderer,
} from './registry';

// Core - 核心逻辑层
export {
  FormStore,
  createFormStore,
  FieldNode,
  createFieldNode,
  ValidationEngine,
  createValidationEngine,
} from './core';

// 只读渲染器（导入以执行注册）
import './core/customRenderers';

// 基础组件注册（导入以执行注册）
import './core/baseComponents';

// 快速组件（导入以执行注册）
import './components/QuickComponents';

// 高级组件
export { ProFormList, ProFormSteps } from './components';
export type {
  ProFormListProps,
  ProFormListInstance,
  ProFormListActions,
  ProFormStepsProps,
  ProFormStepSchema,
  ProFormStepsInstance,
} from './components';
