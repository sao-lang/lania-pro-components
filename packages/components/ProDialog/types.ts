/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-invalid-void-type */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ReactNode, CSSProperties, MouseEvent } from 'react';
import type { ButtonProps } from '@arco-design/web-react';
import type { ProFormProps, ProFormInstance, ProFormSchema } from '../ProFormN/types';
import type { ProTableProps, ProTableActionType, ProColumnType } from '../ProTableN/types';

type Key = string | number;

/**
 * 弹窗模式
 * - modal: 模态框模式
 * - drawer: 抽屉模式
 */
export type DialogMode = 'modal' | 'drawer';

/**
 * 弹窗尺寸
 * - small: 小尺寸 (400px)
 * - medium: 中等尺寸 (600px)
 * - large: 大尺寸 (800px)
 * - xlarge: 超大尺寸 (1000px)
 * - fullscreen: 全屏
 */
export type DialogSize = 'small' | 'medium' | 'large' | 'xlarge' | 'fullscreen';

/**
 * 抽屉位置
 * - top: 顶部
 * - right: 右侧 (默认)
 * - bottom: 底部
 * - left: 左侧
 */
export type DrawerPlacement = 'top' | 'right' | 'bottom' | 'left';

/**
 * 按钮位置
 * - left: 左对齐
 * - center: 居中
 * - right: 右对齐 (默认)
 */
export type FooterPosition = 'left' | 'center' | 'right';

/**
 * 打开弹窗配置
 */
export interface OpenDialogParams<TValues = Record<string, any>> {
  /**
   * 弹窗标题
   */
  title?: ReactNode;

  /**
   * 表单数据（表单模式下）
   */
  data?: Partial<TValues>;

  /**
   * 其他配置覆盖
   */
  [key: string]: any;
}

/**
 * 弹窗实例对象，提供弹窗操作方法
 */
export interface ProDialogInstance<TValues = Record<string, any>, TRow = any, TKey extends Key = Key> {
  /**
   * 打开弹窗
   * @param params 可选配置参数，可传入 title、data（表单数据）等
   */
  open: (params?: any) => void;

  /**
   * 关闭弹窗
   */
  close: () => void;

  /**
   * 切换弹窗显示状态
   */
  toggle: () => void;

  /**
   * 设置弹窗标题
   */
  setTitle: (title: ReactNode) => void;

  /**
   * 设置确认按钮加载状态
   */
  setConfirmLoading: (loading: boolean) => void;

  /**
   * 设置确认按钮禁用状态
   */
  setConfirmDisabled: (disabled: boolean) => void;
  /**
   * 设置内容区域加载状态
   */
  setLoading: (loading: boolean) => void;

  /**
   * 获取表单实例（表单模式下）
   */
  getFormInstance: () => ProFormInstance<TValues> | undefined;

  /**
   * 获取表格操作实例（表格模式下）
   */
  getTableAction: () => ProTableActionType | undefined;

  /**
   * 更新弹窗配置
   */
  update: (config: Partial<ProDialogProps<any, any>>) => void;

  /**
   * 销毁弹窗
   */
  destroy: () => void;

  // ===== 表单快捷操作方法 =====

  /**
   * 设置表单字段值（表单模式下）
   * @param values 字段值对象
   */
  setFormValues: (values: Partial<TValues>) => void;

  /**
   * 获取表单字段值（表单模式下）
   * @param nameList 指定字段名列表，不传则获取所有
   */
  getFormValues: (nameList?: string[]) => TValues;

  /**
   * 设置单个表单字段值（表单模式下）
   * @param name 字段名
   * @param value 字段值
   */
  setFormFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;

  /**
   * 获取单个表单字段值（表单模式下）
   * @param name 字段名
   */
  getFormFieldValue: <K extends keyof TValues>(name: K) => TValues[K] | undefined;

  /**
   * 重置表单（表单模式下）
   * @param nameList 指定字段名列表，不传则重置所有
   */
  resetForm: (nameList?: string[]) => void;

  /**
   * 验证表单（表单模式下）
   * @returns 表单值
   */
  validateForm: () => Promise<TValues>;

  /**
   * 清除表单验证（表单模式下）
   * @param name 字段名或字段名数组
   */
  clearFormValidate: (name?: string | string[]) => void;

  /**
   * 更新表单配置（表单模式下）
   * @param props 表单属性
   */
  setFormProps: (props: Partial<ProFormProps<TValues>>) => void;

  /**
   * 更新表单字段配置（表单模式下）
   * @param schemas 字段配置数组
   */
  setFormSchemas: (schemas: ProFormSchema<TValues>[]) => void;

  /**
   * 提交表单（表单模式下）
   */
  submitForm: () => Promise<void>;

  // ===== 表格快捷操作方法 =====

  /**
   * 重新加载表格数据（表格模式下）
   * @param resetPageIndex 是否重置页码
   */
  reloadTable: (resetPageIndex?: boolean) => void;

  /**
   * 刷新并清空选中（表格模式下）
   */
  reloadAndRestTable: () => void;

  /**
   * 重置表格查询（表格模式下）
   */
  resetTable: () => void;

  /**
   * 清空表格选中（表格模式下）
   */
  clearTableSelection: () => void;

  /**
   * 设置表格选中行（表格模式下）
   * @param rows 选中行数据
   */
  setTableSelectedRows: (rows: any[]) => void;

  /**
   * 设置表格选中行 keys（表格模式下）
   * @param keys 选中行 keys
   */
  setTableSelectedRowKeys: (keys: TKey[]) => void;

  /**
   * 获取表格选中行（表格模式下）
   */
  getTableSelectedRows: () => any[];

  /**
   * 获取表格选中行 keys（表格模式下）
   */
  getTableSelectedRowKeys: () => TKey[];

  /**
   * 获取表格当前分页（表格模式下）
   */
  getTablePagination: () => {
    current: number;
    pageSize: number;
    total: number;
  };

  /**
   * 设置表格分页（表格模式下）
   * @param pagination 分页信息
   */
  setTablePagination: (pagination: Partial<{ current: number; pageSize: number }>) => void;

  /**
   * 获取表格查询参数（表格模式下）
   */
  getTableParams: () => Record<string, unknown>;

  /**
   * 设置表格查询参数（表格模式下）
   * @param params 查询参数
   */
  setTableParams: (params: Record<string, unknown>) => void;
}

/**
 * 基础弹窗属性（Modal 和 Drawer 通用）
 */
export interface BaseDialogProps {
  /**
   * 弹窗模式
   * @default 'modal'
   */
  mode?: DialogMode;

  /**
   * 弹窗尺寸
   * @default 'medium'
   */
  size?: DialogSize;

  /**
   * 自定义宽度
   */
  width?: number | string;

  /**
   * 自定义高度（Drawer 模式下有效）
   */
  height?: number | string;

  /**
   * 是否可见（受控）
   */
  visible?: boolean;

  /**
   * 默认是否可见（非受控）
   * @default false
   */
  defaultVisible?: boolean;

  /**
   * 弹窗标题
   */
  title?: ReactNode;

  /**
   * 副标题
   */
  subTitle?: ReactNode;

  /**
   * 标题图标
   */
  titleIcon?: ReactNode;

  /**
   * 是否显示关闭按钮
   * @default true
   */
  closable?: boolean;

  /**
   * 自定义关闭图标
   */
  closeIcon?: ReactNode;

  /**
   * 是否显示遮罩
   * @default true
   */
  mask?: boolean;

  /**
   * 点击遮罩是否可关闭
   * @default true
   */
  maskClosable?: boolean;

  /**
   * 遮罩样式
   */
  maskStyle?: CSSProperties;

  /**
   * 弹窗样式
   */
  style?: CSSProperties;

  /**
   * 弹窗类名
   */
  className?: string | string[];

  /**
   * 外层容器样式
   */
  wrapStyle?: CSSProperties;

  /**
   * 外层容器类名
   */
  wrapClassName?: string | string[];

  /**
   * 内容区域样式
   */
  bodyStyle?: CSSProperties;

  /**
   * 头部样式
   */
  headerStyle?: CSSProperties;

  /**
   * 底部样式
   */
  footerStyle?: CSSProperties;

  /**
   * 是否显示底部按钮区
   * @default true
   */
  showFooter?: boolean;

  /**
   * 底部内容，传入 null 则不显示
   */
  footer?: ReactNode | null;

  /**
   * 底部按钮位置
   * @default 'right'
   */
  footerPosition?: FooterPosition;

  /**
   * 确认按钮文本
   * @default '确认'
   */
  okText?: ReactNode;

  /**
   * 取消按钮文本
   * @default '取消'
   */
  cancelText?: ReactNode;

  /**
   * 确认按钮属性
   */
  okButtonProps?: ButtonProps;

  /**
   * 取消按钮属性
   */
  cancelButtonProps?: ButtonProps;

  /**
   * 是否隐藏取消按钮
   * @default false
   */
  hideCancel?: boolean;

  /**
   * 确认按钮加载状态
   * @default false
   */
  confirmLoading?: boolean;

  /**
   * 是否显示确认按钮
   * @default true
   */
  showOk?: boolean;

  /**
   * 是否显示取消按钮
   * @default true
   */
  showCancel?: boolean;

  /**
   * 自定义按钮列表
   */
  extraButtons?: DialogButtonConfig[];

  /**
   * 弹窗打开回调
   */
  afterOpen?: () => void;

  /**
   * 弹窗关闭回调
   */
  afterClose?: () => void;

  /**
   * 弹窗可见性变化回调
   */
  onVisibleChange?: (visible: boolean) => void;

  /**
   * 点击确认按钮回调
   */
  onOk?: ((e?: MouseEvent) => Promise<any>) | ((e?: MouseEvent) => void);

  /**
   * 点击取消按钮回调
   */
  onCancel?: () => void;

  /**
   * 点击关闭按钮回调
   */
  onClose?: () => void;

  /**
   * 按 ESC 键关闭
   * @default true
   */
  escToExit?: boolean;

  /**
   * 是否在初次打开时才渲染 DOM
   * @default true
   */
  mountOnEnter?: boolean;

  /**
   * 是否在隐藏后销毁 DOM
   * @default false
   */
  unmountOnExit?: boolean;

  /**
   * 是否开启焦点锁定
   * @default true
   */
  focusLock?: boolean;

  /**
   * 是否自动聚焦第一个可聚焦元素
   * @default true
   */
  autoFocus?: boolean;

  /**
   * 指定挂载的父节点
   */
  getPopupContainer?: () => Element;

  /**
   * 弹窗内弹出框挂载容器
   */
  getChildrenPopupContainer?: (node: HTMLElement) => Element;

  /**
   * 实例名称，用于全局获取
   */
  instance?: string;

  /**
   * 自定义渲染弹窗
   */
  dialogRender?: (node: ReactNode) => ReactNode;

  /**
   * 子元素
   */
  children?: ReactNode;
}

/**
 * 弹窗按钮上下文
 * 提供给按钮点击回调使用
 */
export interface DialogButtonContext<TValues = Record<string, any>, TRow = any, TKey extends Key = Key> {
  /**
   * 弹窗实例
   */
  dialog: ProDialogInstance<TValues, TRow, TKey>;

  /**
   * 表单实例（表单模式下）
   */
  form?: ProFormInstance<TValues>;

  /**
   * 表格操作实例（表格模式下）
   */
  table?: ProTableActionType;

  /**
   * 打开弹窗
   */
  open: (params?: OpenDialogParams<TValues>) => void;

  /**
   * 关闭弹窗
   */
  close: () => void;

  /**
   * 设置弹窗标题
   */
  setTitle: (title: ReactNode) => void;

  /**
   * 设置确认按钮加载状态
   */
  setConfirmLoading: (loading: boolean) => void;

  /**
   * 设置确认按钮禁用状态
   */
  setConfirmDisabled: (disabled: boolean) => void;
  /**
   * 设置内容区域加载状态
   */
  setLoading: (loading: boolean) => void;

  /**
   * 二次确认
   */
  confirm: (config: Omit<ConfirmDialogConfig, 'type'>) => Promise<boolean>;

  /**
   * 信息提示
   */
  info: (config: Omit<ConfirmDialogConfig, 'type'>) => void;

  /**
   * 成功提示
   */
  success: (config: Omit<ConfirmDialogConfig, 'type'>) => void;

  /**
   * 警告提示
   */
  warning: (config: Omit<ConfirmDialogConfig, 'type'>) => void;

  /**
   * 错误提示
   */
  error: (config: Omit<ConfirmDialogConfig, 'type'>) => void;
}

/**
 * 按钮配置
 */
export interface DialogButtonConfig<TValues = Record<string, any>, TRow = any, TKey extends Key = Key> {
  /**
   * 按钮唯一标识
   */
  key: string;

  /**
   * 按钮文本
   */
  text: ReactNode;

  /**
   * 按钮类型
   */
  type?: ButtonProps['type'];

  /**
   * 按钮状态
   */
  status?: ButtonProps['status'];

  /**
   * 是否加载中（受控）
   */
  loading?: boolean;

  /**
   * 是否禁用
   */
  disabled?: boolean | ((context: DialogButtonContext<TValues, TRow, TKey>) => boolean);

  /**
   * 是否显示
   */
  visible?: boolean | ((context: DialogButtonContext<TValues, TRow, TKey>) => boolean);

  /**
   * 点击事件，支持异步，自动处理 loading 状态
   * 返回 true 时自动关闭弹窗
   */
  onClick?: (context: DialogButtonContext<TValues, TRow, TKey>) => any;

  /**
   * 其他按钮属性
   */
  props?: Omit<ButtonProps, 'type' | 'status' | 'loading' | 'disabled' | 'onClick'>;

  /**
   * 按钮位置
   * - before: 在默认按钮之前
   * - after: 在默认按钮之后（默认）
   * - replace: 替换默认按钮
   */
  position?: 'before' | 'after' | 'replace';
}

/**
 * 表单弹窗属性
 */
export interface FormDialogProps<TValues = Record<string, unknown>> {
  /**
   * 表单配置
   */
  formProps?: Omit<ProFormProps<TValues>, 'onFinish'>;

  /**
   * 表单字段配置
   */
  schemas?: ProFormSchema<TValues>[];

  /**
   * 表单初始值
   */
  initialValues?: Partial<TValues>;

  /**
   * 表单提交回调
   */
  onFinish?: ((values: TValues) => Promise<void>) | ((values: TValues) => void);

  /**
   * 表单提交成功回调（返回 true 时自动关闭弹窗）
   */
  onSubmit?: (values: TValues) => any;

  /**
   * 表单提交前校验
   */
  beforeSubmit?: (values: TValues) => Promise<boolean> | boolean;

  /**
   * 表单值变化回调
   */
  onValuesChange?: (changedValues: Partial<TValues>, allValues: TValues) => void;
}

/**
 * 表格弹窗属性
 */
export interface TableDialogProps<TRow = any, TKey extends Key = Key> {
  /**
   * 表格配置
   */
  tableProps?: Omit<ProTableProps<TRow>, 'rowSelection'>;

  /**
   * 表格列配置
   */
  columns?: ProColumnType<TRow>[];

  /**
   * 数据请求函数
   */
  request?: ProTableProps<TRow>['request'];

  /**
   * 数据源
   */
  dataSource?: TRow[];

  /**
   * 选择类型
   * @default 'checkbox'
   */
  selectionType?: 'checkbox' | 'radio' | 'none';

  /**
   * 默认选中项
   */
  defaultSelectedKeys?: TKey[];

  /**
   * 默认选中行
   */
  defaultSelectedRows?: TRow[];

  /**
   * 选中项变化回调
   */
  onSelectionChange?: (selectedKeys: TKey[], selectedRows: TRow[]) => void;

  /**
   * 确认选择回调（返回 true 时自动关闭弹窗）
   */
  onSelect?: (selectedKeys: TKey[], selectedRows: TRow[]) => any;

  /**
   * 表格行 key
   */
  rowKey?: string | ((record: TRow) => TKey);
}

/**
 * ProDialog 完整属性
 */
export interface ProDialogProps<TValues = Record<string, any>, TRow = any>
  extends BaseDialogProps, FormDialogProps<TValues>, TableDialogProps<TRow> {
  /**
   * Drawer 模式下的位置
   * @default 'right'
   */
  placement?: DrawerPlacement;

  /**
   * 关闭时是否确认
   * @default false
   */
  confirmOnClose?: boolean;

  /**
   * 确认关闭标题
   * @default '确认关闭'
   */
  confirmTitle?: ReactNode;

  /**
   * 确认关闭内容
   * @default '确定要关闭弹窗吗？未保存的数据将丢失。'
   */
  confirmContent?: ReactNode;

  /**
   * 是否处于编辑状态（用于 confirmOnClose 判断）
   */
  isEditing?: boolean | (() => boolean);

  /**
   * 是否开启拖拽
   * @default false
   */
  draggable?: boolean;

  /**
   * 是否可调整大小
   * @default false
   */
  resizable?: boolean;

  /**
   * 是否全屏
   * @default false
   */
  fullscreen?: boolean;

  /**
   * 是否显示全屏按钮
   * @default false
   */
  showFullscreen?: boolean;

  /**
   * 弹窗层级
   */
  zIndex?: number;

  /**
   * 是否简洁模式
   * @default false
   */
  simple?: boolean;

  /**
   * 是否居中显示（Modal 模式下有效）
   * @default true
   */
  alignCenter?: boolean;

  /**
   * 弹窗实例引用
   */
  dialogRef?: React.Ref<ProDialogInstance<TValues, TRow>>;

  /**
   * 内部关闭回调
   */
  _onClose?: () => void;

  /**
   * 内部拖拽配置
   * @default false
   */
  _draggable?: boolean;

  /**
   * 内部 resize 配置
   * @default false
   */
  _resizable?: boolean;

  /**
   * 自定义按钮组（与 useProDialog 一致）
   */
  buttons?: DialogButtonConfig<TValues, TRow>[];
}

/**
 * 命令式打开弹窗配置
 */
export interface OpenDialogConfig<TValues = Record<string, any>, TRow = any> extends Omit<
  ProDialogProps<TValues, TRow>,
  'visible' | 'defaultVisible' | 'dialogRef'
> {
  /**
   * 弹窗内容
   */
  content?: ReactNode | ((instance: ProDialogInstance<TValues, TRow>) => ReactNode);
}

/**
 * 确认对话框配置
 */
export interface ConfirmDialogConfig extends Omit<BaseDialogProps, 'mode' | 'size' | 'children'> {
  /**
   * 确认类型
   */
  type?: 'confirm' | 'info' | 'success' | 'warning' | 'error';

  /**
   * 提示内容
   */
  content?: ReactNode;

  /**
   * 提示图标
   */
  icon?: ReactNode;

  /**
   * 是否自动关闭（确认后）
   * @default true
   */
  autoClose?: boolean;

  /**
   * 确认回调
   */
  onConfirm?: (() => Promise<void>) | (() => void);
}

/**
 * Popconfirm 气泡确认框配置
 */
export interface PopconfirmConfig {
  /**
   * 标题
   */
  title?: ReactNode;

  /**
   * 内容
   */
  content?: ReactNode;

  /**
   * 确认按钮文字
   * @default '确认'
   */
  okText?: ReactNode;

  /**
   * 取消按钮文字
   * @default '取消'
   */
  cancelText?: ReactNode;

  /**
   * 确认按钮属性
   */
  okButtonProps?: ButtonProps;

  /**
   * 取消按钮属性
   */
  cancelButtonProps?: ButtonProps;

  /**
   * 确认回调，返回 true 时自动关闭
   */
  onConfirm?: (e?: any) => void | Promise<any>;

  /**
   * 取消回调
   */
  onCancel?: () => void;

  /**
   * 气泡框位置
   * @default 'top'
   */
  position?: 'top' | 'tl' | 'tr' | 'bottom' | 'bl' | 'br' | 'left' | 'lt' | 'lb' | 'right' | 'rt' | 'rb';

  /**
   * 触发方式
   * @default 'click'
   */
  trigger?: 'click' | 'hover' | 'focus' | 'contextMenu';

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;

  /**
   * 自定义图标
   */
  icon?: ReactNode;

  /**
   * 气泡框样式
   */
  style?: CSSProperties;

  /**
   * 气泡框类名
   */
  className?: string;

  /**
   * 子元素
   */
  children?: ReactNode;
}

/**
 * Message 消息配置
 */
export interface MessageConfig {
  /**
   * 消息内容
   */
  content: ReactNode;

  /**
   * 消息类型
   * @default 'info'
   */
  type?: 'info' | 'success' | 'warning' | 'error' | 'loading';

  /**
   * 显示时长（毫秒），0 表示不自动关闭
   * @default 3000
   */
  duration?: number;

  /**
   * 是否显示关闭按钮
   * @default false
   */
  closable?: boolean;

  /**
   * 关闭回调
   */
  onClose?: () => void;

  /**
   * 自定义图标
   */
  icon?: ReactNode;

  /**
   * 是否显示遮罩层（loading 类型有效）
   * @default false
   */
  showOverlay?: boolean;
}

/**
 * Notification 通知配置
 */
export interface NotificationConfig {
  /**
   * 通知标题
   */
  title?: ReactNode;

  /**
   * 通知内容
   */
  content: ReactNode;

  /**
   * 通知类型
   * @default 'info'
   */
  type?: 'info' | 'success' | 'warning' | 'error';

  /**
   * 显示位置
   * @default 'topRight'
   */
  position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

  /**
   * 显示时长（毫秒），0 表示不自动关闭
   * @default 4500
   */
  duration?: number;

  /**
   * 是否显示关闭按钮
   * @default true
   */
  closable?: boolean;

  /**
   * 关闭回调
   */
  onClose?: () => void;

  /**
   * 自定义图标
   */
  icon?: ReactNode;

  /**
   * 自定义按钮
   */
  btn?: ReactNode;

  /**
   * 是否显示遮罩层
   * @default false
   */
  showOverlay?: boolean;

  /**
   * 通知样式
   */
  style?: CSSProperties;

  /**
   * 通知类名
   */
  className?: string;
}

/**
 * Message 返回对象
 */
export interface MessageReturn {
  /**
   * 关闭当前消息
   */
  close: () => void;
}

/**
 * Notification 返回对象
 */
export interface NotificationReturn {
  /**
   * 关闭当前通知
   */
  close: () => void;
}

/**
 * 命令式弹窗返回对象
 */
export interface DialogReturnProps {
  /**
   * 更新弹窗配置
   */
  update: (config: Partial<OpenDialogConfig>) => void;

  /**
   * 关闭弹窗
   */
  close: () => void;

  /**
   * 销毁弹窗
   */
  destroy: () => void;
}

/**
 * Message 静态方法类型
 */
export interface ProMessageStatic {
  open: (config: MessageConfig) => MessageReturn;
  info: (content: ReactNode, duration?: number) => MessageReturn;
  success: (content: ReactNode, duration?: number) => MessageReturn;
  warning: (content: ReactNode, duration?: number) => MessageReturn;
  error: (content: ReactNode, duration?: number) => MessageReturn;
  loading: (content?: ReactNode, showOverlay?: boolean) => MessageReturn;
  clear: () => void;
  config: (options: Partial<MessageConfig>) => void;
}

/**
 * Notification 静态方法类型
 */
export interface ProNotificationStatic {
  open: (config: NotificationConfig) => NotificationReturn;
  info: (config: Omit<NotificationConfig, 'type'>) => NotificationReturn;
  success: (config: Omit<NotificationConfig, 'type'>) => NotificationReturn;
  warning: (config: Omit<NotificationConfig, 'type'>) => NotificationReturn;
  error: (config: Omit<NotificationConfig, 'type'>) => NotificationReturn;
  clear: () => void;
  config: (options: Partial<NotificationConfig>) => void;
}

/**
 * Notify 快捷方法类型
 */
export interface ProNotifyStatic {
  info: (title: ReactNode, content: ReactNode) => NotificationReturn;
  success: (title: ReactNode, content: ReactNode) => NotificationReturn;
  warning: (title: ReactNode, content: ReactNode) => NotificationReturn;
  error: (title: ReactNode, content: ReactNode) => NotificationReturn;
  clear: () => void;
}

/**
 * ProDialog 组件类型
 */
export type ProDialogComponent = (<TValues = Record<string, any>, TRow = any>(
  props: ProDialogProps<TValues, TRow> & React.RefAttributes<ProDialogInstance<TValues, TRow>>,
) => React.ReactElement) & {
  /**
   * 命令式打开弹窗
   */
  open: <TValues = Record<string, any>, TRow = any>(config: OpenDialogConfig<TValues, TRow>) => DialogReturnProps;

  /**
   * 确认对话框
   */
  confirm: (config: ConfirmDialogConfig) => DialogReturnProps;

  /**
   * 信息提示
   */
  info: (config: Omit<ConfirmDialogConfig, 'type'>) => DialogReturnProps;

  /**
   * 成功提示
   */
  success: (config: Omit<ConfirmDialogConfig, 'type'>) => DialogReturnProps;

  /**
   * 警告提示
   */
  warning: (config: Omit<ConfirmDialogConfig, 'type'>) => DialogReturnProps;

  /**
   * 错误提示
   */
  error: (config: Omit<ConfirmDialogConfig, 'type'>) => DialogReturnProps;

  /**
   * 表单弹窗
   */
  form: <TValues = Record<string, any>>(
    config: Omit<OpenDialogConfig<TValues, any>, 'schemas' | 'formProps'> &
      FormDialogProps<TValues> & { title: ReactNode },
  ) => DialogReturnProps;

  /**
   * 表格选择弹窗
   */
  table: <TRow = any>(
    config: Omit<OpenDialogConfig<any, TRow>, 'columns' | 'tableProps'> & TableDialogProps<TRow> & { title: ReactNode },
  ) => DialogReturnProps;

  /**
   * Popconfirm 气泡确认框组件
   */
  Popconfirm: React.FC<PopconfirmConfig>;

  /**
   * 命令式 Popconfirm
   */
  popconfirm: (config: PopconfirmConfig) => void;

  /**
   * Message 全局消息
   */
  message: ProMessageStatic;

  /**
   * Notification 通知提醒
   */
  notification: ProNotificationStatic;

  /**
   * Notify 快捷通知
   */
  notify: ProNotifyStatic;
};

/**
 * 弹窗状态
 */
export interface DialogState {
  visible: boolean;
  confirmLoading: boolean;
  confirmDisabled: boolean;
  title: ReactNode;
  fullscreen: boolean;
  /**
   * 内容区加载
   */
  contentLoading: boolean;
}

/**
 * 弹窗事件类型
 */
export type DialogEventType = 'open' | 'close' | 'ok' | 'cancel' | 'confirm' | 'fullscreen' | 'error';

/**
 * 弹窗事件监听
 */
export type DialogEventListener = (type: DialogEventType, payload?: unknown) => void;

/**
 * ProDialog Hook 配置选项
 */
export interface UseProDialogOptions<TValues = Record<string, any>, TRow = any> extends Omit<
  ProDialogProps<TValues, TRow>,
  'visible' | 'defaultVisible' | 'dialogRef'
> {
  /**
   * 弹窗实例名称，用于全局获取
   */
  name?: string;

  /**
   * 弹窗内容（优先级高于 children）
   */
  content?: ReactNode | ((instance: ProDialogInstance<TValues, TRow>) => ReactNode);

  /**
   * 自定义按钮组
   */
  buttons?: DialogButtonConfig<TValues, TRow>[];

  /**
   * 关闭时是否销毁并重置状态
   * @default true
   */
  destroyOnClose?: boolean;
}

/**
 * ProDialog Hook 返回值
 */
export interface UseProDialogReturn<TValues = Record<string, any>, TRow = any> {
  /**
   * 弹窗可见性
   */
  visible: boolean;

  /**
   * 弹窗状态
   */
  state: DialogState;

  /**
   * 打开弹窗
   */
  open: (params?: OpenDialogParams<TValues>) => void;

  /**
   * 关闭弹窗
   */
  close: () => void;

  /**
   * 切换弹窗
   */
  toggle: () => void;

  /**
   * 设置弹窗标题
   */
  setTitle: (title: ReactNode) => void;

  /**
   * 设置确认加载状态
   */
  setConfirmLoading: (loading: boolean) => void;

  /**
   * 设置确认禁用状态
   */
  setConfirmDisabled: (disabled: boolean) => void;

  /**
   * 设置全屏状态
   */
  setFullscreen: (fullscreen: boolean) => void;

  /**
   * 弹窗实例（同 dialogInstance）
   */
  dialog: ProDialogInstance<TValues, TRow>;

  /**
   * 弹窗实例
   */
  dialogInstance: ProDialogInstance<TValues, TRow>;

  /**
   * 表单实例（表单模式下）
   */
  form?: ProFormInstance<TValues>;

  /**
   * 表格操作实例（表格模式下）
   */
  table?: ProTableActionType;

  /**
   * 弹窗属性（用于传递给 ProDialog 组件）
   * @deprecated 新用法不需要手动渲染 ProDialog
   */
  dialogProps: ProDialogProps<TValues, TRow> & {
    visible: boolean;
    onVisibleChange: (visible: boolean) => void;
  };
}
