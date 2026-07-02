// ProForm - 新一代表单组件
// 基于 FormEngine + FieldRuntime + RendererSystem 架构

// 类型定义
export type {
  ProFormSchema,
  ProFormProps,
  ProFormInstance,
  FieldNodeAPI,
  FormStoreAPI,
  FieldBehavior,
  FieldReaction,
  FieldLifecycle,
  ReadonlyRenderConfig,
  ReadonlyRenderer,
  QuickComponentConfig,
  ComponentRegistry,
  ReadonlyRegistry,
  LayoutMode,
  ButtonPosition,
  FormStatus,
  FieldStatus,
  ComputedFieldBehavior,
  ButtonConfig,
  ProFormPerformanceConfig,
  LazyLoadConfig,
  BatchUpdateConfig,
  PerformanceMonitorConfig,
} from './types';

// 核心组件
export { ProForm } from './ProForm';
export { FormField } from './FormField';

// Hook
export { useProForm, useFormStore, ProFormContext } from './useProForm';

// Provider
export { ProFormProvider } from './ProFormProvider';

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

// 实例注册表
export { instanceRegistry, getProFormInstance } from './registry/instanceRegistry';

// 响应式系统
export {
  reactive,
  effect,
  computed,
  watch,
  batchUpdate,
  ref,
  toReactive,
  isReactive,
  trigger,
  type ComputedRef,
} from './utils/reactive';

// 性能优化 Hooks
export {
  useVirtualScroll,
  useDynamicVirtualScroll,
  type VirtualScrollConfig,
  type VirtualScrollState,
} from './hooks/useVirtualScroll';

export {
  useLazyField,
  useGroupLazyLoad,
  usePriorityLoad,
  type LazyFieldConfig,
  type LazyFieldState,
  type GroupLazyConfig,
  type PriorityLoadConfig,
} from './hooks/useLazyField';

export { useArcoForm, type ArcoFormInstance } from './hooks/useArcoForm';

// 性能工具
export {
  TaskQueue,
  globalTaskQueue,
  BatchUpdateManager,
  debounce,
  throttle,
  memoize,
  LRUCache,
  PerformanceMonitor,
  performanceMonitor,
  scheduleIdleTask,
  scheduleChunkedTask,
} from './utils/performance';

// Schema 处理工具
// Note: schemaUtils 已移除，功能集成到 ProForm 组件中

// 性能监控组件
export { FormPerformanceMonitor } from './components/FormPerformanceMonitor';

// 只读渲染器（导入以执行注册）
import './core/customRenderers';

// 基础组件注册（导入以执行注册）
import './core/baseComponents';

// 快速组件（导入以执行注册）
import './components/QuickComponents';

// 高级组件
export { ProFormList, ProFormSteps } from './components';
export type { ProFormListProps, ProFormStepsProps, ProFormStepSchema, ProFormStepsInstance } from './components';
