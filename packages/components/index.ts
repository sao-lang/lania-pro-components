/**
 * @lania-pro-components/components
 *
 * Lania Pro Components 组件库统一入口
 *
 * 基于 Arco Design + Schema 驱动的企业级组件集合，包含：
 * - ActionButton: 预封装 CRUD 操作按钮组（新增/编辑/删除/查看/导出/导入/跳转/批量操作）
 * - ProDialog: 高级弹窗组件（支持 Modal/Drawer、表单/表格/普通内容）
 * - ProForm: Schema 驱动的表单引擎（支持动态列表、分步表单、只读预览）
 * - ProTable: 高级表格组件（支持查询/分页/排序/筛选/编辑/虚拟滚动/拖拽）
 * - ProSelect: 增强版选择器（支持远程搜索、分页加载、虚拟滚动、动态创建）
 * - ProUpload: 增强版上传组件（支持图片/视频/文件、压缩、校验、重试）
 *
 * 每个组件模块都独立导出，支持按需引入。
 *
 * @example
 * ```tsx
 * // 按需引入
 * import { ProTable, useProTable } from '@lania-pro-components/components';
 * // 或直接引入子路径
 * import { ProForm } from '@lania-pro-components/components/ProForm';
 * ```
 */

export {
  AddButton,
  EditButton,
  DeleteButton,
  ViewButton,
  BatchButton,
  ExportButton,
  ImportButton,
  JumpButton,
} from './ActionButton';
export type {
  ActionButtonProps,
  AddButtonRef,
  EditButtonRef,
  DeleteButtonRef,
  ViewButtonRef,
  BatchButtonRef,
  ExportButtonRef,
  ImportButtonRef,
  JumpButtonRef,
} from './ActionButton/types';

export { ProDialog } from './ProDialog';
export type {
  ProDialogProps,
  ProDialogInstance,
  DialogMode,
  DialogSize,
  DrawerPlacement,
  FooterPosition,
  DialogButtonConfig,
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
  FormDialogProps,
  TableDialogProps,
  DialogState,
  DialogEventType,
  DialogEventListener,
  PopconfirmConfig,
  MessageConfig,
  NotificationConfig,
  MessageReturn,
  NotificationReturn,
  ProMessageStatic,
  ProNotificationStatic,
  ProNotifyStatic,
} from './ProDialog/types';
export { useProDialog } from './ProDialog/useProDialog';
export { getProDialogInstance, instanceRegistry as dialogInstanceRegistry } from './ProDialog/instanceRegistry';

export { ProForm } from './ProForm';
export type { ProFormInstance } from './ProForm/types';
export { ProFormProvider } from './ProForm/ProFormProvider';
export { FormField } from './ProForm/components/FormField';
export { useProForm } from './ProForm/useProForm';
export type { ProFormProps, ProFormSchema, FormItemProps, LayoutMode, ValidationRule } from './ProForm/types';
export type {
  ProFormListProps,
  ProFormListInstance,
  ProFormListActions,
  ProFormStepsProps,
  ProFormStepsInstance,
  ProFormStepSchema,
} from './ProForm/components/types';

export { ProTable } from './ProTable';
export { useProTable } from './ProTable/hooks/useProTable';
export type { ProTableActionType } from './ProTable/types';
export type { ProTableProps, ProColumnType, ProTableState } from './ProTable/types';

export { ProSelect } from './ProSelect';
export type { ProSelectProps } from './ProSelect/types';

export { ProUpload } from './ProUpload';
export type { ProUploadProps } from './ProUpload/types';

export { ProLayout, PageHeader, Content, Footer, Sider } from './ProLayout';
export type {
  ProLayoutProps,
  ProLayoutMode,
  PageHeaderConfig,
  SiderConfig,
  ContentConfig,
  FooterConfig,
  BreadcrumbItem,
  ContentLayoutMode,
} from './ProLayout/types';
export { useSiderCollapsed } from './ProLayout/hooks/useSiderCollapsed';
export type { UseSiderCollapsedOptions, UseSiderCollapsedReturn } from './ProLayout/hooks/useSiderCollapsed';

export { ProQueryForm, QueryFormRenderer, SearchSchemaBar } from './ProQueryForm';
export type {
  ProQueryFormProps,
  ProQueryFormInstance,
  UrlSyncConfig,
  SearchSchemaConfig,
  QueryFormRendererProps,
  SearchSchemaBarProps,
} from './ProQueryForm';
export {
  valueTypeToComponent,
  getComponentPropsByValueType,
  convertColumnsToSearchSchema,
  transformSearchParams,
} from './ProQueryForm/utils';

export { ProDescriptions, DescriptionCell, CopyButton, EmptyValue } from './ProDescriptions';
export type {
  ProDescriptionsProps,
  ProDescriptionColumn,
  DescriptionCellProps,
  CopyButtonProps,
  EmptyValueProps,
} from './ProDescriptions';
export { adaptColumns } from './ProDescriptions/columnAdapter';

export { ProChart, ChartStatus, EChartsAdapter, setEChartsInstance } from './ProChart';
export type {
  ProChartProps,
  ProChartInstance,
  ChartSchema,
  ChartAdapter,
  ChartInstance,
  ChartStatusProps,
} from './ProChart';
export {
  registerChartAdapter,
  hasChartAdapter,
  resolveChartAdapter,
  unregisterChartAdapter,
} from './ProChart/chartAdapterRegistry';
export { registerChartTransformer, getChartTransformer } from './ProChart/transformers';
