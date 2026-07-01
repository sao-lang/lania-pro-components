/* eslint-disable @typescript-eslint/no-invalid-void-type */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import type { ReactNode } from 'react';
import type { TableProps, TableColumnProps, PaginationProps, ButtonProps } from '@arco-design/web-react';
import type { ProFormSchema, ProFormInstance, ProFormProps } from '../ProFormN/types';

/**
 * 操作按钮配置
 */
export interface OprToolConfig<T = any> {
  /** 按钮唯一标识 */
  key: string;
  /** 按钮文本 */
  text: string;
  /** 按钮类型 */
  type?: ButtonProps['type'];
  /** 按钮状态 */
  status?: ButtonProps['status'];
  /** 是否显示 */
  visible?: boolean | ((record: T) => boolean);
  /** 是否禁用 */
  disabled?: boolean | ((record: T) => boolean);
  /** 点击事件 */
  onClick?: (record: T, index: number, action: ProTableActionType) => void;
  /** 按钮属性 */
  buttonProps?: Omit<ButtonProps, 'onClick'>;
}

/**
 * 值类型 - 用于列渲染和筛选表单
 */
export type ProColumnValueType =
  | 'text'
  | 'number'
  | 'money'
  | 'percent'
  | 'date'
  | 'dateTime'
  | 'time'
  | 'dateRange'
  | 'dateTimeRange'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'tag'
  | 'avatar'
  | 'image'
  | 'link'
  | 'progress'
  | 'code'
  | 'json'
  | 'textarea'
  | 'enum'
  | 'index' // 序号
  | 'indexBorder' // 带边框的序号
  | 'opr'
  | 'proTable'
  | string;

/**
 * 自定义单元格渲染器类型
 */
export type CustomCellRenderer = (
  text: any,
  column: ProColumnType,
  record?: any,
  index?: number,
  action?: any,
) => ReactNode;

/**
 * 自定义渲染器注册类型
 */
export interface CustomRendererRegistry {
  register: (type: string, renderer: CustomCellRenderer) => void;
  unregister: (type: string) => void;
  get: (type: string) => CustomCellRenderer | undefined;
  has: (type: string) => boolean;
}

/**
 * 日期格式化类型
 */
export type DateFormatType =
  | 'YYYY-MM-DD'
  | 'YYYY/MM/DD'
  | 'DD-MM-YYYY'
  | 'YYYY-MM-DD HH:mm:ss'
  | 'YYYY/MM/DD HH:mm:ss'
  | 'HH:mm:ss'
  | 'HH:mm'
  | 'YYYY年MM月DD日'
  | 'MM-DD'
  | 'YYYY-MM'
  | string;

/**
 * 表格密度
 */
export type TableDensity = 'default' | 'middle' | 'compact';

/**
 * 请求参数
 */
export interface ProTableRequestParams {
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 排序字段 */
  sortField?: string;
  /** 排序方式 */
  sortOrder?: 'ascend' | 'descend';
  /** 筛选条件 */
  filters?: Record<string, string[]>;
  /** 查询表单值 */
  params?: Record<string, unknown>;
}

/**
 * 请求响应
 */
export interface ProTableRequestResponse<T = any> {
  /** 数据列表 */
  data: T[];
  /** 总条数 */
  total: number;
  /** 是否成功 */
  success?: boolean;
}

/**
 * 请求函数类型
 */
export type ProTableRequest<T = any> = (
  params: ProTableRequestParams,
  sort?: Record<string, 'ascend' | 'descend'>,
  filter?: Record<string, string[]>,
) => Promise<ProTableRequestResponse<T>>;

/**
 * 列配置 - 扩展 Arco TableColumnProps
 */
export interface ProColumnType<T = any> extends Omit<
  TableColumnProps<T>,
  'render' | 'title' | 'dataIndex' | 'filters' | 'onFilter' | 'sorter'
> {
  /**
   * 列数据在数据项中对应的路径
   */
  dataIndex?: string | string[];

  /**
   * 列标题
   */
  title?: ReactNode;

  /**
   * 值类型 - 用于自动渲染和筛选表单
   */
  valueType?: ProColumnValueType;

  /**
   * 空值显示文本
   */
  emptyText?: ReactNode;

  /**
   * 值枚举 - 用于 select/radio/checkbox/tag 等类型
   */
  valueEnum?: Record<string, { text: string; color?: string; status?: string }>;

  /**
   * 操作按钮组配置 - 用于 opr 类型
   */
  oprTools?: OprToolConfig<T>[];

  /**
   * 子表格配置 - 用于 proTable 类型
   */
  proTableConfig?: {
    /** 子表格列配置 */
    columns: ProColumnType<any>[];
    /** 子表格数据源，可以是数据数组或函数 */
    dataSource?: any[] | ((record: T) => any[]);
    /** 子表格其他配置 - 使用 Arco Table 的原生属性 */
    tableProps?: Omit<TableProps<any>, 'columns' | 'data'>;
    /** 从当前行数据中获取子表格数据的路径 */
    dataPath?: string;
    /** 子表格标题 */
    title?: ReactNode | ((record: T) => ReactNode);
    /** 是否显示边框 */
    bordered?: boolean;
    /** 表格大小 */
    size?: 'default' | 'middle' | 'small' | 'mini';
    /** 是否显示分页 */
    pagination?: boolean;
    /** 空状态显示文本 */
    emptyText?: string;
  };

  /**
   * 日期格式化格式
   */
  dateFormat?: DateFormatType;

  /**
   * 货币符号
   * @default '¥'
   */
  moneySymbol?: string;

  /**
   * 小数位数
   * @default 2
   */
  precision?: number;

  /**
   * 是否千分位展示
   * @default true
   */
  thousandsSeparator?: boolean;

  /**
   * 是否可拷贝
   */
  copyable?: boolean;

  /**
   * 是否可省略
   */
  ellipsis?: boolean;

  /**
   * 组件属性 - 用于 avatar/image/link/progress 等类型
   */
  componentProps?: {
    // 通用
    size?: number;
    width?: number;
    height?: number;
    // 图片/头像
    preview?: boolean;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    borderRadius?: number | string;
    title?: string;
    description?: string;
    downloadName?: string;
    extraActions?: Array<{
      key: string;
      content: ReactNode;
      onClick?: () => void;
    }>;
    // 链接
    href?: string;
    target?: string;
    text?: string;
    // 进度条
    color?: string;
    showText?: boolean;
    formatText?: (percent: number) => ReactNode;
  };

  /**
   * 自定义渲染函数
   */
  render?: (
    dom: ReactNode,
    entity: T,
    index: number,
    action: ProTableActionType,
    schema: ProColumnType<T>,
  ) => ReactNode;

  /**
   * 渲染文本前的格式化
   */
  renderText?: (text: unknown, record: T, index: number) => unknown;

  /**
   * 是否在查询表单中显示
   * @default true
   */
  hideInSearch?: boolean;

  /**
   * 是否在表格中显示
   * @default true
   */
  hideInTable?: boolean;

  /**
   * 是否在设置中禁用
   * @default false
   */
  disableInSetting?: boolean;

  /**
   * 查询表单中的字段配置，设置为 false 时隐藏该字段
   */
  search?:
    | false
    | (Omit<ProFormSchema, 'name'> &
        Record<string, unknown> & {
          /** 查询表单字段排序 */
          order?: number;
          /** 是否将查询值转换 */
          transform?: (value: unknown) => unknown;
        });

  /**
   * 筛选配置
   */
  filters?: { text: ReactNode; value: unknown }[];

  /**
   * 是否支持筛选菜单
   */
  filterDropdown?: boolean;

  /**
   * 受控的筛选菜单可见状态
   */
  filterDropdownVisible?: boolean;

  /**
   * 筛选菜单可见状态变化时调用
   */
  onFilterDropdownVisibleChange?: (visible: boolean) => void;

  /**
   * 自定义筛选菜单
   */
  filterDropdownProps?: Record<string, unknown>;

  /**
   * 本地模式下，确定筛选的运行函数
   */
  onFilter?: (value: unknown, record: T) => boolean;

  /**
   * 排序函数，本地排序使用一个函数，服务端排序使用 true
   */
  sorter?: boolean | ((a: T, b: T) => number) | 'ascend' | 'descend';

  /**
   * 默认排序顺序
   */
  defaultSortOrder?: 'ascend' | 'descend';

  /**
   * 排序优先级，数值越大优先级越高
   */
  sortPriority?: number;

  /**
   * 列标题提示信息
   */
  tooltip?: string;

  /**
   * 单元格 tooltip 配置
   */
  cellTooltip?: boolean | string | ((text: any, record?: any, index?: number) => ReactNode);

  /**
   * 列宽
   */
  width?: number | string;

  /**
   * 最小列宽
   */
  minWidth?: number;

  /**
   * 最大列宽
   */
  maxWidth?: number;

  /**
   * 是否固定列
   */
  fixed?: 'left' | 'right';

  /**
   * 对齐方式
   */
  align?: 'left' | 'center' | 'right';

  /**
   * 列类名
   */
  className?: string;

  /**
   * 自定义单元格类名
   */
  cellClassName?: string | ((record: T, index: number) => string);

  /**
   * 是否可拖拽
   */
  drag?: boolean;

  /**
   * 编辑配置
   */
  editable?:
    | boolean
    | ((record: T) => boolean)
    | {
        /** 编辑组件类型 */
        component?: string;
        /** 编辑组件属性 */
        componentProps?: Record<string, unknown>;
        /** 编辑校验规则 */
        rules?: unknown[];
        /** 是否必填 */
        required?: boolean;
        /** 编辑表单 Schema - 继承自 ProFormSchema */
        formSchema?: Omit<ProFormSchema, 'name'> & { name?: string };
      };

  /**
   * 分组表头子列
   */
  children?: ProColumnType<T>[];

  /**
   * 汇总配置
   */
  summary?:
    | boolean
    | {
        /** 汇总方式 */
        type: 'sum' | 'avg' | 'min' | 'max' | 'count';
        /** 自定义汇总渲染 */
        render?: (value: unknown, records: T[]) => ReactNode;
      };

  /**
   * 操作列按钮配置（新方式）
   * 使用 ActionButton 配置替代 oprTools
   */
  actions?: OprActionButtonConfig<T>[];
}

/**
 * 打开弹窗配置
 * 支持 Modal 组件的所有属性透传
 */
export interface OpenDialogConfig<TValues = Record<string, any>, TRow = any> {
  /**
   * 表格列配置
   */
  columns?: ProColumnType<TRow>[];
  /**
   * 表格数据请求
   */
  request?: ProTableRequest<TRow>;
  /**
   * 表格数据源
   */
  dataSource?: TRow[];
  /**
   * 弹窗标题
   */
  title?: ReactNode;
  /**
   * 弹窗内容
   */
  content?: ReactNode;
  /**
   * 弹窗宽度
   */
  width?: number | string;
  /**
   * 确认回调
   */
  onOk?: (values: TValues, row?: TRow) => void | boolean | Promise<void | boolean>;
  /**
   * 取消回调
   */
  onCancel?: () => void;
  /**
   * 是否显示遮罩
   * @default true
   */
  mask?: boolean;
  /**
   * 点击遮罩是否关闭
   * @default true
   */
  maskClosable?: boolean;
  /**
   * 是否显示关闭按钮
   * @default true
   */
  closable?: boolean;
  /**
   * 是否居中显示
   * @default false
   */
  alignCenter?: boolean;
  /**
   * 是否全屏显示
   * @default false
   */
  fullscreen?: boolean;
  /**
   * 自定义弹窗样式
   */
  modalStyle?: React.CSSProperties;
  /**
   * 自定义弹窗类名
   */
  modalClassName?: string;
  /**
   * 自定义遮罩样式
   */
  maskStyle?: React.CSSProperties;
  /**
   * 是否显示底部按钮
   * @default true
   */
  footer?: boolean | ReactNode;
  /**
   * 确认按钮文字
   * @default '确认'
   */
  okText?: string;
  /**
   * 取消按钮文字
   * @default '取消'
   */
  cancelText?: string;
  /**
   * 确认按钮属性
   */
  okButtonProps?: Record<string, unknown>;
  /**
   * 取消按钮属性
   */
  cancelButtonProps?: Record<string, unknown>;
  /**
   * 是否隐藏确认按钮
   * @default false
   */
  hideOkButton?: boolean;
  /**
   * 是否隐藏取消按钮
   * @default false
   */
  hideCancelButton?: boolean;
  /**
   * 是否隐藏全屏按钮
   * @default false
   */
  hideFullscreenButton?: boolean;
  /**
   * 弹窗打开后的回调
   */
  afterOpen?: () => void;
  /**
   * 弹窗关闭后的回调
   */
  afterClose?: () => void;
  /**
   * 自定义挂载容器
   */
  getPopupContainer?: () => HTMLElement;
  /**
   * 是否在初次打开对话框时才渲染 dom
   * @default true
   */
  mountOnEnter?: boolean;
  /**
   * 是否在隐藏之后销毁DOM结构
   * @default true
   */
  unmountOnExit?: boolean;
  /**
   * 按 `ESC` 键关闭
   * @default true
   */
  escToExit?: boolean;
  /**
   * 是否默认聚焦第一个可聚焦元素
   * @default true
   */
  autoFocus?: boolean;
  /**
   * 是否将焦点锁定在弹出框内
   * @default true
   */
  focusLock?: boolean;
  /**
   * 简洁模式的样式
   * @default false
   */
  simple?: boolean;
  /**
   * 自定义右上角的关闭按钮节点
   */
  closeIcon?: ReactNode;
  /**
   * 自定义渲染对话框
   */
  modalRender?: (modalNode: ReactNode) => ReactNode;
}

/**
 * 确认对话框配置
 * 支持 Modal 组件的所有属性透传
 */
export interface ConfirmDialogConfig {
  /**
   * 标题
   */
  title?: ReactNode;
  /**
   * 内容
   */
  content?: ReactNode;
  /**
   * 确认回调
   */
  onConfirm?: () => void | boolean | Promise<void | boolean>;
  /**
   * 取消回调
   */
  onCancel?: () => void;
  /**
   * 弹窗宽度
   * @default 400
   */
  width?: number | string;
  /**
   * 是否显示遮罩
   * @default true
   */
  mask?: boolean;
  /**
   * 点击遮罩是否关闭
   * @default false
   */
  maskClosable?: boolean;
  /**
   * 是否显示关闭按钮
   * @default true
   */
  closable?: boolean;
  /**
   * 是否居中显示
   * @default true
   */
  alignCenter?: boolean;
  /**
   * 自定义弹窗样式
   */
  modalStyle?: React.CSSProperties;
  /**
   * 自定义弹窗类名
   */
  modalClassName?: string;
  /**
   * 自定义遮罩样式
   */
  maskStyle?: React.CSSProperties;
  /**
   * 确认按钮文字
   * @default '确认'
   */
  confirmText?: string;
  /**
   * 取消按钮文字
   * @default '取消'
   */
  cancelText?: string;
  /**
   * 确认按钮类型
   * @default 'primary'
   */
  confirmButtonType?: 'primary' | 'secondary' | 'outline' | 'text';
  /**
   * 确认按钮状态
   */
  confirmButtonStatus?: 'default' | 'success' | 'warning' | 'danger';
  /**
   * 确认按钮属性
   */
  confirmButtonProps?: Record<string, unknown>;
  /**
   * 取消按钮属性
   */
  cancelButtonProps?: Record<string, unknown>;
  /**
   * 是否隐藏确认按钮
   * @default false
   */
  hideConfirmButton?: boolean;
  /**
   * 是否隐藏取消按钮
   * @default false
   */
  hideCancelButton?: boolean;
  /**
   * 弹窗打开后的回调
   */
  afterOpen?: () => void;
  /**
   * 弹窗关闭后的回调
   */
  afterClose?: () => void;
  /**
   * 自定义挂载容器
   */
  getPopupContainer?: () => HTMLElement;
  /**
   * 是否在初次打开对话框时才渲染 dom
   * @default true
   */
  mountOnEnter?: boolean;
  /**
   * 是否在隐藏之后销毁DOM结构
   * @default true
   */
  unmountOnExit?: boolean;
  /**
   * 按 `ESC` 键关闭
   * @default true
   */
  escToExit?: boolean;
  /**
   * 是否默认聚焦第一个可聚焦元素
   * @default true
   */
  autoFocus?: boolean;
  /**
   * 是否将焦点锁定在弹出框内
   * @default true
   */
  focusLock?: boolean;
  /**
   * 简洁模式的样式
   * @default false
   */
  simple?: boolean;
  /**
   * 自定义右上角的关闭按钮节点
   */
  closeIcon?: ReactNode;
  /**
   * 自定义渲染对话框
   */
  modalRender?: (modalNode: ReactNode) => ReactNode;
}

/**
 * 弹窗返回对象
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
 * 表格操作类型
 */
export interface ProTableActionType {
  /** 重新加载数据 */
  reload: (resetPageIndex?: boolean) => void;
  /** 刷新并清空选中 */
  reloadAndRest: () => void;
  /** 重置查询表单 */
  reset: () => void;
  /** 清空选中 */
  clearSelected: () => void;
  /** 设置选中行 */
  setSelectedRows: (rows: any[]) => void;
  /** 设置选中行 keys */
  setSelectedRowKeys: (keys: (string | number)[]) => void;
  /** 获取选中行 */
  getSelectedRows: () => any[];
  /** 获取选中行 keys */
  getSelectedRowKeys: () => (string | number)[];
  /** 开始编辑行 */
  startEditable: (rowKey: string | number) => boolean;
  /** 取消编辑行 */
  cancelEditable: (rowKey: string | number) => Promise<boolean>;
  /** 保存编辑行 */
  saveEditable: (rowKey: string | number) => Promise<boolean>;
  /** 删除编辑行 */
  deleteEditable?: (rowKey: string | number) => Promise<boolean>;
  /** 获取当前分页 */
  getPagination: () => { current: number; pageSize: number; total: number };
  /** 设置分页 */
  setPagination: (pagination: Partial<{ current: number; pageSize: number }>) => void;
  /** 获取查询参数 */
  getParams: () => Record<string, unknown>;
  /** 设置查询参数 */
  setParams: (params: Record<string, unknown>) => void;
  /** 获取表单实例 */
  getFormInstance: () => ProFormInstance | undefined;
  /** 开始轮询 */
  startPolling: () => void;
  /** 停止轮询 */
  stopPolling: () => void;
  /** 获取轮询状态 */
  getPollingStatus: () => { isPolling: boolean; interval?: number };
  /**
   * 防抖请求数据
   * @param params 请求参数
   */
  debouncedFetchData: (params?: Record<string, unknown>) => void;
  /**
   * 打开弹窗
   * @param config 弹窗配置
   * @returns 弹窗控制对象
   */
  openDialog: <TValues = Record<string, any>, TRow = any>(config: OpenDialogConfig<TValues, TRow>) => DialogReturnProps;
  /**
   * 打开确认对话框
   * @param config 确认对话框配置
   * @returns 弹窗控制对象
   */
  confirm: (config: ConfirmDialogConfig) => DialogReturnProps;

  // ==================== 第三批功能 ====================

  /**
   * 虚拟滚动：滚动到指定索引
   * @param index 目标索引
   * @param behavior 滚动行为
   */
  scrollToIndex?: (index: number, behavior?: ScrollBehavior) => void;

  /**
   * 虚拟滚动：滚动到顶部
   * @param behavior 滚动行为
   */
  scrollToTop?: (behavior?: ScrollBehavior) => void;

  /**
   * 虚拟滚动：滚动到底部
   * @param behavior 滚动行为
   */
  scrollToBottom?: (behavior?: ScrollBehavior) => void;

  /**
   * 拖拽排序：重置排序
   */
  resetDragSort?: () => void;

  /**
   * 缓存：清空缓存
   */
  clearCache?: () => void;
}

/**
 * 工具栏配置
 */
export interface ProTableToolbarConfig {
  /** 标题 */
  title?: ReactNode;
  /** 副标题 */
  subTitle?: ReactNode;
  /** 描述 */
  description?: ReactNode;
  /** 自定义工具栏左侧 */
  leftRender?: ReactNode;
  /** 自定义工具栏右侧 */
  rightRender?: ReactNode;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 是否显示密度按钮 */
  showDensity?: boolean;
  /** 是否显示列设置 */
  showColumnSetting?: boolean;
  /** 是否显示全屏按钮 */
  showFullscreen?: boolean;
  /** 自定义工具栏 */
  toolbarRender?: (
    actions: ProTableActionType,
    rows: { selectedRows: unknown[]; selectedRowKeys: (string | number)[] },
  ) => ReactNode;
}

/**
 * 批量操作配置
 */
export interface ProTableBatchOperationConfig {
  /** 是否显示 */
  show?: boolean;
  /** 自定义渲染 */
  render?: (selectedRows: unknown[], selectedRowKeys: (string | number)[], actions: ProTableActionType) => ReactNode;
  /** 批量操作按钮 */
  actions?: Array<{
    key: string;
    text: string;
    onClick?: (selectedRows: unknown[], selectedRowKeys: (string | number)[]) => void;
    disabled?: boolean | ((selectedRows: unknown[]) => boolean);
    danger?: boolean;
  }>;
}

/**
 * 行选择配置
 */
export interface ProTableRowSelectionConfig {
  /** 是否显示选择列 */
  show?: boolean;
  /** 选择类型 */
  type?: 'checkbox' | 'radio';
  /** 受控的选中行 keys */
  selectedRowKeys?: (string | number)[];
  /** 受控的选中行 */
  selectedRows?: any[];
  /** 选中变化回调 */
  onChange?: (selectedRowKeys: (string | number)[], selectedRows: any[]) => void;
  /** 是否跨页选择 - 切换分页时保留已选项 */
  preserveSelectedRowKeys?: boolean;
  /** 多选模式下是否跨分页选择（只在非受控模式下生效） */
  checkCrossPage?: boolean;
  /** 自定义选择列宽度 */
  columnWidth?: number;
  /** 自定义选择列标题 */
  columnTitle?: ReactNode;
  /** 选择框是否固定 */
  fixed?: boolean | 'left' | 'right';
  /** 获取行数据的 key */
  getCheckboxProps?: (record: any) => {
    disabled?: boolean;
    indeterminate?: boolean;
  };
  /** 是否显示全选 */
  showSelectAll?: boolean;
  /** 自定义选择渲染 */
  selections?: Array<{
    key: string;
    text: ReactNode;
    onSelect?: (changeableRowKeys: (string | number)[]) => void;
  }>;
}

/**
 * 表格实例
 */
export interface ProTableInstance<T = any> {
  /** 表格操作 */
  action: ProTableActionType;
  /** 表单实例 */
  form: ProFormInstance | undefined;
  /** 当前数据 */
  dataSource: T[];
  /** 加载状态 */
  loading: boolean;
  /** 选中行 */
  selectedRows: T[];
  /** 选中行 keys */
  selectedRowKeys: (string | number)[];
  /** 分页信息 */
  pagination: { current: number; pageSize: number; total: number };
  /** 查询参数 */
  params: Record<string, unknown>;
}

/**
 * ProTable 组件属性
 */
export interface ProTableProps<T = any> extends Omit<TableProps, 'columns' | 'pagination' | 'rowSelection'> {
  /** 表格列配置 */
  columns: ProColumnType<T>[];
  /** 操作实例引用（示例用） */
  actionRef?: React.Ref<ProTableActionType>;

  /** 数据源（受控模式） */
  dataSource?: T[];

  /** 数据请求函数 */
  request?: ProTableRequest<T>;

  /** 表格实例名称，用于 useProTable */
  instance?: string;

  /** 获取数据的 key，用于缓存 */
  params?: Record<string, unknown>;

  /** 数据变化回调 */
  onDataSourceChange?: (dataSource: T[]) => void;

  /** 加载状态（受控模式） */
  loading?: boolean;

  /** 表格标题 */
  headerTitle?: ReactNode;

  /** 工具栏配置 */
  toolbar?: ProTableToolbarConfig;

  /** 是否显示搜索表单 */
  search?:
    | boolean
    | {
        /** 表单布局 */
        layout?: 'horizontal' | 'vertical' | 'inline';
        /** 列数 */
        columns?: number;
        /** 是否可折叠 */
        collapsible?: boolean;
        /** 默认折叠 */
        defaultCollapsed?: boolean;
        /** 折叠行数 */
        collapsedRows?: number;
        /** 表单属性，透传给 ProForm */
        formProps?: Omit<ProFormProps, 'schemas' | 'onFinish' | 'onReset'>;
        /** 自定义搜索按钮 */
        searchButtonRender?: ReactNode;
        /** 自定义重置按钮 */
        resetButtonRender?: ReactNode;
        /** 是否显示搜索按钮 */
        showSearch?: boolean;
        /** 是否显示重置按钮 */
        showReset?: boolean;
        /** 搜索前转换参数 */
        beforeSearch?: (params: Record<string, unknown>) => Record<string, unknown>;
      };

  /** 行选择配置 */
  rowSelection?: ProTableRowSelectionConfig | boolean;

  /** 批量操作配置 */
  batchOperation?: ProTableBatchOperationConfig;

  /** 分页配置 */
  pagination?: PaginationProps | false;

  /** 默认分页大小 */
  defaultPageSize?: number;

  /** 分页大小选项 */
  pageSizeOptions?: number[];

  /** 是否默认展开所有行 */
  defaultExpandAllRows?: boolean;

  /** 默认展开的行 */
  defaultExpandedRowKeys?: (string | number)[];

  /** 展开的行（受控） */
  expandedRowKeys?: (string | number)[];

  /** 展开行渲染函数 */
  expandedRowRender?: (record: T, index: number) => ReactNode;

  /** 展开图标属性 */
  expandProps?: {
    icon?: (props: { expanded: boolean; record: Record<string, any> }) => ReactNode;
    width?: number;
    columnTitle?: ReactNode;
    rowExpandable?: (record: T) => boolean;
    expandRowByClick?: boolean;
  };

  /** 表格密度 */
  density?: TableDensity;

  /** 表格密度变化回调 */
  onDensityChange?: (density: TableDensity) => void;

  /** 列状态变化回调 */
  onColumnsStateChange?: (columns: ProColumnType<T>[]) => void;

  /** 弹窗默认配置 */
  dialogConfig?: {
    /** 普通弹窗默认配置 */
    open?: Partial<OpenDialogConfig>;
    /** 确认弹窗默认配置 */
    confirm?: Partial<ConfirmDialogConfig>;
  };

  /** 列设置持久化 key */
  columnsStatePersistenceKey?: string;

  /** 表格滚动配置 */
  scroll?: { x?: number | string; y?: number | string };

  /** 是否显示边框 */
  bordered?: boolean;

  /** 表格行 key - 默认 'id' */
  rowKey?: string | ((record: T) => string | number);

  /** 表格类名 */
  className?: string;

  /** 表格样式 */
  style?: React.CSSProperties;

  /** 表格容器类名 */
  containerClassName?: string;

  /** 表格容器样式 */
  containerStyle?: React.CSSProperties;

  /** 空状态渲染 */
  emptyRender?: ReactNode | (() => ReactNode);

  /** 错误状态渲染 */
  errorRender?: (error: Error, reload: () => void) => ReactNode;

  /** 请求前钩子 */
  beforeRequest?: (params: ProTableRequestParams) => ProTableRequestParams | Promise<ProTableRequestParams>;

  /** 请求后钩子 */
  afterRequest?: (data: T[], total: number) => { data: T[]; total: number } | Promise<{ data: T[]; total: number }>;

  /** 请求错误回调 */
  onRequestError?: (error: Error) => void;

  /** 数据格式化 */
  postData?: (data: T[]) => T[];

  /** 是否手动触发请求 */
  manual?: boolean;

  /** 防抖时间（毫秒） */
  debounceTime?: number;

  /** 轮询间隔（毫秒） */
  polling?: number | ((data: T[]) => number);

  /** 是否缓存数据 */
  cache?:
    | boolean
    | {
        maxAge?: number;
        maxSize?: number;
      };

  /** 缓存 key */
  cacheKey?: string;

  /** 是否显示骨架屏 */
  showSkeleton?: boolean;

  /** 是否响应式 */
  responsive?: boolean;

  /** 断点配置 */
  breakpoints?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };

  /** 汇总行配置 */
  tableSummary?: {
    show?: boolean;
    render?: (records: T[]) => ReactNode;
  };

  /** 粘性头部 */
  stickyHeader?:
    | boolean
    | {
        offsetHeader?: number;
        offsetSummary?: number;
        getContainer?: () => HTMLElement;
      };

  /** 虚拟滚动 */
  virtualScroll?: boolean;

  /** 虚拟滚动配置 */
  virtualScrollConfig?: {
    itemHeight?: number;
    overscan?: number;
  };

  /** 编辑行配置 */
  editable?: {
    type?: 'single' | 'multiple';
    editableKeys?: (string | number)[];
    onChange?: (editableKeys: (string | number)[], editableRows: T[]) => void;
    onSave?: (rowKey: string | number, data: T, row: T) => Promise<boolean | void>;
    onDelete?: (rowKey: string | number, row: T) => Promise<boolean | void>;
    onCancel?: (rowKey: string | number, row: T, newRow?: T) => Promise<boolean | void>;
    actionRender?: (
      row: T,
      config: {
        save: () => void;
        cancel: () => void;
        edit: () => void;
        delete: () => void;
      },
      defaultDom: {
        save: ReactNode;
        cancel: ReactNode;
        edit: ReactNode;
        delete: ReactNode;
      },
    ) => ReactNode[];
    deleteText?: ReactNode;
    saveText?: ReactNode;
    cancelText?: ReactNode;
  };

  /** 拖拽排序配置 */
  dragSort?:
    | boolean
    | {
        type?: 'handle' | 'row';
        handleRender?: () => ReactNode;
        onDragSortEnd?: (newDataSource: T[], oldDataSource: T[]) => void;
      };

  /** 卡片模式 - 数据项显示为卡片 */
  cardMode?:
    | boolean
    | {
        cardRender?: (record: T, index: number) => ReactNode;
        grid?: {
          gutter?: number;
          column?: number;
          xs?: number;
          sm?: number;
          md?: number;
          lg?: number;
          xl?: number;
          xxl?: number;
        };
      };

  /** 卡片容器模式 - 整个表格包裹在卡片容器中 */
  cardContainer?:
    | boolean
    | {
        /** 卡片标题 */
        title?: ReactNode;
        /** 卡片额外内容 */
        extra?: ReactNode;
        /** 是否显示边框 */
        bordered?: boolean;
        /** 卡片样式 */
        style?: React.CSSProperties;
        /** 卡片类名 */
        className?: string;
        /** 卡片内容区域样式 */
        bodyStyle?: React.CSSProperties;
      };

  /** 视图切换 */
  viewMode?: 'table' | 'card';

  /** 视图切换回调 */
  onViewModeChange?: (mode: 'table' | 'card') => void;

  /** URL 同步配置 */
  urlSync?:
    | boolean
    | {
        /** 是否同步到 URL */
        enabled?: boolean;
        /** 参数前缀 */
        prefix?: string;
        /** 需要同步的参数名 */
        include?: string[];
        /** 排除的参数名 */
        exclude?: string[];
        /** 自定义序列化 */
        serialize?: (params: Record<string, any>) => string;
        /** 自定义反序列化 */
        deserialize?: (search: string) => Record<string, any>;
      };

  /** 查询方案配置 */
  searchSchema?: {
    /** 是否启用 */
    enabled?: boolean;
    /** 持久化 key */
    persistenceKey?: string;
    /** 默认方案 */
    defaultSchema?: string;
    /** 方案列表 */
    schemas?: Array<{
      key: string;
      name: string;
      params: Record<string, any>;
    }>;
  };

  /** 多级表头配置 */
  groupColumns?: Array<{
    title: ReactNode;
    key: string;
    children: ProColumnType<T>[];
  }>;

  // ==================== ActionButton 事件处理器 ====================

  /** 新增事件 */
  onCreate?: (values: Record<string, unknown>) => Promise<boolean | void> | boolean | void;
  /** 编辑事件 */
  onEdit?: (id: string | number, values: Record<string, unknown>) => Promise<boolean | void> | boolean | void;
  /** 查看事件 */
  onView?: (record: T) => void;
  /** 删除事件 */
  onDelete?: (id: string | number) => Promise<boolean | void> | boolean | void;
  /** 导出事件 */
  onExport?: () => Promise<void> | void;
  /** 导入事件 */
  onImport?: (file: File) => Promise<unknown>;

  /** 合并单元格配置 */
  cellMerge?: {
    /** 行合并 */
    rowSpan?: (record: T, index: number, column: ProColumnType<T>) => number | { rowSpan: number; content?: ReactNode };
    /** 列合并 */
    colSpan?: (record: T, index: number, column: ProColumnType<T>) => number | { colSpan: number; content?: ReactNode };
  };
}

/**
 * 表格状态
 */
export interface ProTableState<T = Record<string, unknown>> {
  /** 数据列表 */
  dataSource: T[];
  /** 加载状态 */
  loading: boolean;
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 选中行 keys */
  selectedRowKeys: (string | number)[];
  /** 选中行 */
  selectedRows: T[];
  /** 查询参数 */
  params: Record<string, unknown>;
  /** 排序字段 */
  sortField?: string;
  /** 排序方式 */
  sortOrder?: 'ascend' | 'descend';
  /** 筛选条件 */
  filters: Record<string, string[]>;
  /** 表格密度 */
  density: TableDensity;
  /** 列配置 */
  columns: ProColumnType<T>[];
  /** 错误信息 */
  error?: Error;
  /** 编辑行 keys */
  editableKeys: (string | number)[];
}

/**
 * 表格事件类型
 */
export type ProTableEventType =
  | 'reload'
  | 'reset'
  | 'search'
  | 'pageChange'
  | 'sortChange'
  | 'filterChange'
  | 'selectionChange'
  | 'densityChange'
  | 'columnChange'
  | 'error';

/**
 * 表格事件监听
 */
export type ProTableEventListener = (type: ProTableEventType, payload?: unknown) => void;

// ==================== ActionButton 扩展类型 ====================

import type {
  OprActionButtonConfig,
  ToolbarActionButtonConfig,
  ProTableNEventHandlers,
  OprColumnConfig,
  ToolbarActionConfig,
} from './types-action-button';

export type {
  OprActionButtonConfig,
  ToolbarActionButtonConfig,
  ProTableNEventHandlers,
  OprColumnConfig,
  ToolbarActionConfig,
};

/**
 * 扩展的工具栏配置
 */
export interface ProTableToolbarConfig {
  /**
   * 工具栏按钮配置（新方式）
   */
  actions?: ToolbarActionConfig;
}
