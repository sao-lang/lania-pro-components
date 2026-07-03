/**
 * ActionButton 类型定义
 *
 * ActionButton 是一组预封装的企业级操作按钮组件，涵盖常见的 CRUD 操作场景：
 * - AddButton: 新增按钮（打开表单弹窗）
 * - EditButton: 编辑按钮（打开表单弹窗并回填数据）
 * - DeleteButton: 删除按钮（二次确认弹窗后执行删除）
 * - ViewButton: 查看按钮（打开详情展示弹窗）
 * - BatchButton: 批量操作按钮（选择校验 + 可选二次确认）
 * - ExportButton: 导出按钮（远程下载或自定义导出逻辑）
 * - ImportButton: 导入按钮（文件上传弹窗）
 * - JumpButton: 跳转按钮（页面路由跳转）
 *
 * 每个按钮组件都支持通过 ref 进行命令式调用（open / execute / jump 等）。
 */

import type { ReactNode } from 'react';
import type { ProFormSchema, ProFormProps } from '../ProForm/types';
import type { ProDialogProps } from '../ProDialog/types';
import { ButtonProps } from '@arco-design/web-react';

// ======================== Ref 类型（命令式调用接口） ========================

/** AddButton 的 ref 接口 */
export interface AddButtonRef {
  /** 打开新增弹窗 */
  open: () => void;
}

/** EditButton 的 ref 接口 */
export interface EditButtonRef {
  /** 打开编辑弹窗 */
  open: () => void;
  /** 是否正在加载中 */
  loading: boolean;
}

/** DeleteButton 的 ref 接口 */
export interface DeleteButtonRef {
  /** 打开删除确认弹窗 */
  openConfirm: () => void;
  /** 是否正在执行删除 */
  loading: boolean;
}

/** ViewButton 的 ref 接口 */
export interface ViewButtonRef {
  /** 打开查看弹窗 */
  open: () => void;
}

/** BatchButton 的 ref 接口 */
export interface BatchButtonRef {
  /** 执行批量操作（手动触发） */
  execute: () => void;
  /** 是否正在执行批量操作 */
  loading: boolean;
}

/** ExportButton 的 ref 接口 */
export interface ExportButtonRef {
  /** 执行导出 */
  export: () => void;
  /** 是否正在导出 */
  loading: boolean;
}

/** ImportButton 的 ref 接口 */
export interface ImportButtonRef {
  /** 打开导入弹窗 */
  open: () => void;
  /** 是否正在导入 */
  loading: boolean;
}

/** JumpButton 的 ref 接口 */
export interface JumpButtonRef {
  /** 执行跳转 */
  jump: () => void;
}

// ======================== 基础按钮 Props ========================

/**
 * 所有操作按钮的基础 Props 类型
 *
 * 继承自 Arco Design 的 ButtonProps，并扩展了通用属性。
 * 所有具体按钮组件（Add/Edit/Delete 等）都支持这些属性。
 */
export type ActionButtonProps = ButtonProps & {
  /** 按钮文本（支持 ReactNode 以便插入图标等） */
  text?: ReactNode;
  /** 是否显示按钮，false 时组件返回 null（替代 v-if 效果） */
  visible?: boolean;
};

// ======================== 表单类按钮 ========================

/**
 * 表单按钮的通用 Props（Add / Edit 共用）
 *
 * 打开一个包含 ProForm 的 Dialog/MDrawer，用户填写后提交。
 */
export interface FormButtonProps extends Omit<ActionButtonProps, 'onSubmit'> {
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度（px 或百分比字符串） */
  width?: number | string;
  /** ProForm 的 Schema 配置数组 */
  schemas: ProFormSchema[];
  /** 表单初始值 */
  initialValues?: Record<string, unknown>;
  /** 传递给 ProForm 的额外配置（不包含 schemas 和 onFinish） */
  formProps?: Omit<ProFormProps, 'schemas' | 'onFinish'>;
  /** 传递给 ProDialog 的额外配置 */
  dialogProps?: Omit<ProDialogProps, 'schemas' | 'formProps' | 'initialValues'>;
  /**
   * 表单提交回调
   * @param values - 表单收集的数据
   * @returns true 或 Promise<true> 关闭弹窗，false 或 void 不关闭
   */
  onSubmit: (values: Record<string, unknown>) => Promise<boolean | void> | boolean | void;
  /**
   * 弹窗打开前的钩子
   * @returns false 可阻止弹窗打开，true 或无返回值允许打开
   */
  onBeforeOpen?: () => boolean | void | Promise<boolean | void>;
  /** 弹窗关闭后的回调 */
  onAfterClose?: () => void;
}

/** AddButton 的 Props（与 FormButtonProps 相同） */
export type AddButtonProps = FormButtonProps;

/**
 * EditButton 的 Props
 *
 * 与 AddButton 相比，多了 getInitialValues 方法用于数据回填。
 */
export interface EditButtonProps extends FormButtonProps {
  /**
   * 获取编辑表单的初始值（数据回填）
   * 弹窗打开时调用，支持异步获取（如从 API 加载数据）
   */
  getInitialValues: () => Record<string, unknown> | Promise<Record<string, unknown>>;
}

// ======================== 查看按钮 ========================

/**
 * ViewButton 的 Props
 *
 * 打开一个只读的详情弹窗，内容由 renderContent 自定义渲染。
 * 不包含 ProForm，纯展示用途。
 */
export interface ViewButtonProps extends ActionButtonProps {
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: number | string;
  /** 传递给 ProDialog 的额外配置 */
  dialogProps?: Omit<ProDialogProps, 'children'>;
  /** 详情内容渲染函数 */
  renderContent: () => ReactNode;
  /** 当前行数据（可选，传递给 renderContent 使用） */
  record?: unknown;
}

// ======================== 删除按钮 ========================

/**
 * DeleteButton 的 Props
 *
 * 点击后弹出 Popconfirm 确认弹窗，确认后执行 onDelete。
 */
export interface DeleteButtonProps extends ActionButtonProps {
  /** 确认弹窗标题 */
  confirmTitle?: string;
  /** 确认弹窗内容（字符串 / 函数返回 ReactNode） */
  confirmContent?: ReactNode | (() => ReactNode);
  /** 确认按钮文本 */
  okText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮的额外属性 */
  okButtonProps?: ActionButtonProps;
  /** 传递给 ProDialog 的额外配置 */
  dialogProps?: Omit<ProDialogProps, 'onOk' | 'onCancel'>;
  /**
   * 执行删除的回调
   * @returns true / Promise<true> 表示删除成功，false 表示失败（弹窗不关闭）
   */
  onDelete: () => Promise<boolean | void> | boolean | void;
}

// ======================== 导出按钮 ========================

/**
 * ExportButton 的 Props
 *
 * 支持两种导出模式：
 * 1. 通过 exportUrl 远程下载文件（默认实现，支持超时和自定义 headers）
 * 2. 通过 onExport 自定义导出逻辑
 */
export interface ExportButtonProps extends ActionButtonProps {
  /** 导出接口地址（GET 请求，参数通过 params 附加到 URL） */
  exportUrl?: string;
  /** 导出请求参数 */
  params?: Record<string, unknown>;
  /** 下载时的文件名 */
  fileName?: string;
  /** 自定义导出回调（优先级高于 exportUrl） */
  onExport?: () => Promise<void> | void;
  /** 导出前的检查钩子，返回 false 可阻止导出 */
  onBeforeExport?: () => boolean | Promise<boolean>;
  /** 请求超时时间（毫秒），默认 60000 */
  timeout?: number;
  /** 自定义请求头 */
  headers?: Record<string, string>;
}

// ======================== 导入按钮 ========================

/**
 * ImportButton 的 Props
 *
 * 打开一个包含文件上传组件的弹窗，支持拖拽/点击上传。
 */
export interface ImportButtonProps extends ActionButtonProps {
  /** 上传接口地址 */
  uploadUrl?: string;
  /** 上传附加参数（会追加到 FormData 中） */
  uploadParams?: Record<string, unknown>;
  /** 允许上传的文件类型，如 '.xlsx,.xls'，默认为 '.xlsx,.xls,.csv' */
  accept?: string;
  /** 是否支持多文件上传，默认 false */
  multiple?: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: number | string;
  /** 传递给 ProDialog 的额外配置 */
  dialogProps?: Omit<ProDialogProps, 'onOk'>;
  /** 自定义渲染上传区域（替换默认的 Upload 拖拽组件） */
  renderUpload?: () => ReactNode;
  /** 导入成功后的回调 */
  onSuccess?: (result: unknown) => void;
  /** 导入失败后的回调 */
  onImportError?: (error: Error) => void;
}

// ======================== 跳转按钮 ========================

/**
 * JumpButton 的 Props
 *
 * 点击后跳转到指定 URL 地址，支持新窗口打开。
 */
export interface JumpButtonProps extends ActionButtonProps {
  /** 跳转目标地址（相对路径或完整 URL） */
  to: string;
  /** 打开方式：'_self' 当前窗口，'_blank' 新窗口，默认 '_self' */
  target?: '_blank' | '_self';
  /** 跳转前的检查钩子，返回 false 可阻止跳转 */
  onBeforeJump?: () => boolean | Promise<boolean>;
}

// ======================== 批量操作按钮 ========================

/**
 * BatchButton 的 Props
 *
 * 用于表格批量操作场景，支持选中数量校验和二次确认。
 */
export interface BatchButtonProps extends ActionButtonProps {
  /** 当前选中的数据行数组 */
  selectedRows: unknown[];
  /** 当前选中的数据行 key 数组 */
  selectedKeys: (string | number)[];
  /** 是否需要校验选择状态，默认 true */
  needSelection?: boolean;
  /** 最少选择数量，默认 1，不足时弹出警告提示 */
  minSelection?: number;
  /** 最多选择数量，超出时弹出警告提示 */
  maxSelection?: number;
  /** 选择不足时的警告文案 */
  selectionWarning?: string;
  /** 是否需要二次确认，默认 false */
  needConfirm?: boolean;
  /** 确认弹窗标题 */
  confirmTitle?: string;
  /** 确认弹窗内容（字符串 / 接收选中行的函数） */
  confirmContent?: ReactNode | ((rows: unknown[]) => ReactNode);
  /** 传递给 ProDialog 的额外配置 */
  dialogProps?: Omit<ProDialogProps, 'onOk'>;
  /**
   * 批量操作的执行回调
   * @param rows - 选中的数据行
   * @param keys - 选中的 key 数组
   * @returns true 表示成功，false 表示失败（确认弹窗不关闭）
   */
  onAction: (rows: unknown[], keys: (string | number)[]) => Promise<boolean | void> | boolean | void;
}
