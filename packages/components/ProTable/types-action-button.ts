import type { ReactNode } from 'react';
import type { ButtonProps } from '@arco-design/web-react';
import type { ProFormSchema } from '../ProFormN/types';
import type { ProDialogProps } from '../ProDialog/types';
import type { ProTableActionType } from './types';

/**
 * ActionButton 类型 - 用于操作列和工具栏
 */
export type ActionButtonType = 'add' | 'edit' | 'view' | 'delete' | 'export' | 'import' | 'jump' | 'custom' | 'more';

/**
 * 基础 ActionButton 配置
 */
export interface ActionButtonBaseConfig {
  /** 按钮类型 */
  type?: ActionButtonType;
  /** 按钮唯一标识 */
  key: string;
  /** 按钮文本，不传使用默认文本 */
  text?: string;
  /** 按钮图标 */
  icon?: ReactNode;
  /** 按钮样式类型 */
  buttonType?: ButtonProps['type'];
  /** 按钮状态 */
  status?: ButtonProps['status'];
  /** 是否显示 */
  visible?: boolean | ((record?: any) => boolean);
  /** 是否禁用 */
  disabled?: boolean | ((record?: any) => boolean);
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 新增按钮配置
 */
export interface AddButtonConfig extends ActionButtonBaseConfig {
  type: 'add';
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: number | string;
  /** 表单字段配置 */
  schemas: ProFormSchema[];
  /** 表单属性 */
  formProps?: Record<string, unknown>;
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'schemas' | 'formProps'>;
}

/**
 * 编辑按钮配置
 */
export interface EditButtonConfig extends ActionButtonBaseConfig {
  type: 'edit';
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: number | string;
  /** 表单字段配置 */
  schemas: ProFormSchema[];
  /** 表单属性 */
  formProps?: Record<string, unknown>;
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'schemas' | 'formProps'>;
  /** 获取表单数据的字段映射，不传则使用整行数据 */
  dataMap?: Record<string, string>;
}

/**
 * 查看按钮配置
 */
export interface ViewButtonConfig extends ActionButtonBaseConfig {
  type: 'view';
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: number | string;
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'children'>;
  /** 自定义内容渲染函数 */
  renderContent?: (record: any) => ReactNode;
  /** 表单字段配置（readonly 模式） */
  schemas?: ProFormSchema[];
  /** 表单属性 */
  formProps?: Record<string, unknown>;
  /** 获取表单数据的字段映射，不传则使用整行数据 */
  dataMap?: Record<string, string>;
}

/**
 * 删除按钮配置
 */
export interface DeleteButtonConfig extends ActionButtonBaseConfig {
  type: 'delete';
  /** 确认弹窗标题 */
  confirmTitle?: string;
  /** 确认弹窗内容，可以是字符串或函数 */
  confirmContent?: string | ((record: any) => string);
  /** 确认按钮文本 */
  okText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'onOk' | 'onCancel'>;
  /** 获取删除ID的字段名，默认 'id' */
  idField?: string;
}

/**
 * 导出按钮配置
 */
export interface ExportButtonConfig extends ActionButtonBaseConfig {
  type: 'export';
  /** 导出接口地址 */
  exportUrl?: string;
  /** 导出参数 */
  params?: Record<string, unknown>;
  /** 文件名 */
  fileName?: string;
}

/**
 * 导入按钮配置
 */
export interface ImportButtonConfig extends ActionButtonBaseConfig {
  type: 'import';
  /** 上传接口地址 */
  uploadUrl?: string;
  /** 上传参数 */
  uploadParams?: Record<string, unknown>;
  /** 接受的文件类型 */
  accept?: string;
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: number | string;
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'onOk'>;
}

/**
 * 跳转按钮配置
 */
export interface JumpButtonConfig extends ActionButtonBaseConfig {
  type: 'jump';
  /** 跳转路径，支持模板字符串如 /users/{id} */
  to: string;
  /** 是否在新窗口打开 */
  target?: '_blank' | '_self';
  /** 路径参数映射 */
  paramsMap?: Record<string, string>;
}

/**
 * 自定义按钮配置
 */
export interface CustomButtonConfig extends ActionButtonBaseConfig {
  type: 'custom';
  /** 自定义渲染 */
  render: (record: any, index: number, action: ProTableActionType) => ReactNode;
}

/**
 * 更多按钮配置 - 用于操作列和工具栏
 */
export interface MoreButtonConfig extends ActionButtonBaseConfig {
  type: 'more';
  /** 下拉菜单中的按钮列表 */
  actions: OprActionButtonConfig[];
  /** 更多按钮文本 */
  text?: string;
  /** 下拉菜单触发方式 */
  trigger?: 'click' | 'hover';
  /** 下拉菜单位置: tl=左上, tr=右上, bl=左下, br=右下, top=上, bottom=下 */
  position?: 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom';
}

/**
 * 操作列按钮配置联合类型
 */
export type OprActionButtonConfig<T = any> =
  | (EditButtonConfig & {
      onClick?: (record: T, index: number, action: ProTableActionType) => void;
    })
  | (ViewButtonConfig & {
      onClick?: (record: T, index: number, action: ProTableActionType) => void;
    })
  | (DeleteButtonConfig & {
      onClick?: (record: T, index: number, action: ProTableActionType) => void;
    })
  | (JumpButtonConfig & {
      onClick?: (record: T, index: number, action: ProTableActionType) => void;
    })
  | (CustomButtonConfig & {
      onClick?: (record: T, index: number, action: ProTableActionType) => void;
    })
  | (MoreButtonConfig & {
      onClick?: (record: T, index: number, action: ProTableActionType) => void;
    });

/**
 * 工具栏按钮配置联合类型
 */
export type ToolbarActionButtonConfig =
  AddButtonConfig | ExportButtonConfig | ImportButtonConfig | JumpButtonConfig | CustomButtonConfig | MoreButtonConfig;

/**
 * ProTable 事件回调配置
 */
export interface ProTableNEventHandlers {
  /** 新增事件 */
  onCreate?: (values: Record<string, unknown>) => Promise<boolean | void> | boolean | void;
  /** 编辑事件 */
  onEdit?: (id: string | number, values: Record<string, unknown>) => Promise<boolean | void> | boolean | void;
  /** 查看事件 */
  onView?: (record: any) => void;
  /** 删除事件 */
  onDelete?: (id: string | number) => Promise<boolean | void> | boolean | void;
  /** 导出事件 */
  onExport?: () => Promise<void> | void;
  /** 导入事件 */
  onImport?: (file: File) => Promise<unknown>;
}

/**
 * 扩展的操作列配置
 */
export interface OprColumnConfig<T = any> {
  /** 操作按钮列表 */
  actions: OprActionButtonConfig<T>[];
  /** 最多显示多少个按钮，超出显示更多 */
  maxCount?: number;
  /** 更多按钮文本 */
  moreText?: string;
}

/**
 * 扩展的工具栏配置
 */
export interface ToolbarActionConfig {
  /** 左侧按钮 */
  leftActions?: ToolbarActionButtonConfig[];
  /** 右侧按钮 */
  rightActions?: ToolbarActionButtonConfig[];
}
