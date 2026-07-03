/**
 * ProTable 功能特性模块
 *
 * 由多个独立的功能子模块组成，通过 ProTable 组件协调工作：
 *
 * - QueryForm: 查询表单（与表格数据联动）
 * - TableRenderer: 表格渲染器（数据驱动）
 * - Pagination: 分页组件
 * - Toolbar: 工具栏（左侧/右侧按钮组）
 * - BatchOperation: 批量操作工具栏
 * - TableDialog: 表格内弹窗工具（命令式调用）
 * - ActionButtonRenderer: 操作列按钮渲染器
 */
export { QueryForm, type QueryFormProps } from './QueryForm';
export { TableRenderer, type TableRendererProps } from './TableRenderer';
export { Pagination, type PaginationProps } from './Pagination';
export { Toolbar, type ToolbarProps } from './Toolbar';
export { BatchOperation } from './BatchOperation';
export { openDialog, confirm, info, success, warning, error, DialogUtils } from './TableDialog';
