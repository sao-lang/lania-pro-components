/**
 * ProTable 子组件统一入口
 *
 * 包含所有表格子组件，按用途分为两类：
 *
 * 核心渲染组件（原 features/）：
 * - TableContent: 表格内容渲染器
 * - QueryForm: 查询表单
 * - Toolbar: 工具栏
 * - Pagination: 分页
 * - BatchOperation: 批量操作栏
 * - ActionButtonRenderer: 操作列按钮渲染器（内部使用）
 *
 * 扩展视图组件（原 components/）：
 * - CardView: 卡片视图
 * - SkeletonTable: 骨架屏
 * - SearchSchemaSelector: 搜索方案选择器
 * - DragSortTable: 拖拽排序表格
 *
 * 弹窗工具（复用 ProDialog）：
 * - openDialog, confirm, info, success, warning, error
 */
export * from './CardView';
export * from './SkeletonTable';
export * from './SearchSchemaSelector';
export * from './DragSortTable';
export { QueryForm, type QueryFormProps } from './QueryForm';
export { TableContent, type TableContentProps } from './TableContent';
export { Pagination, type PaginationProps } from './Pagination';
export { Toolbar, type ToolbarProps } from './Toolbar';
export { BatchOperation } from './BatchOperation';
import { ProDialog } from '../../ProDialog';

export const openDialog = ProDialog.open;
export const confirm = ProDialog.confirm;
export const info = ProDialog.info;
export const success = ProDialog.success;
export const warning = ProDialog.warning;
export const error = ProDialog.error;
