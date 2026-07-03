import type { SelectOptionProps, SelectProps, TagProps } from '@arco-design/web-react';
import type { ReactNode } from 'react';

export type { SelectProps, TagProps };

/**
 * LabeledValue 类型
 */
export interface LabeledValue {
  label: ReactNode;
  value: string | number;
  [key: string]: unknown;
}

/**
 * 选项数据
 */
export interface ProSelectOption extends SelectOptionProps {
  /**
   * 选项标签
   */
  label: ReactNode;
  /**
   * 选项值
   */
  value: string | number;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 选项分组
   */
  group?: string;
  /**
   * 标签颜色（用于 tag 模式）
   */
  tagColor?: string;
  /**
   * 其他自定义属性
   */
  [key: string]: unknown;
}

/**
 * 远程数据请求参数
 */
export interface ProSelectRequestParams {
  /**
   * 搜索关键词
   */
  keyword?: string;
  /**
   * 当前页码
   */
  page?: number;
  /**
   * 每页条数
   */
  pageSize?: number;
  /**
   * 其他参数
   */
  [key: string]: unknown;
}

/**
 * 远程数据请求结果
 */
export interface ProSelectRequestResult<T = ProSelectOption> {
  /**
   * 选项数据列表
   */
  data: T[];
  /**
   * 总条数
   */
  total?: number;
  /**
   * 是否还有更多数据
   */
  hasMore?: boolean;
}

/**
 * ProSelect 组件属性
 */
export interface ProSelectProps extends Omit<SelectProps, 'options' | 'onSearch'> {
  /**
   * 选项数据
   */
  options?: ProSelectOption[];
  /**
   * 远程数据请求函数
   * @param params 请求参数
   * @returns 选项数据
   */
  request?: (params: ProSelectRequestParams) => Promise<ProSelectRequestResult | ProSelectOption[]>;
  /**
   * 是否开启搜索
   * @default false
   */
  search?: boolean;
  /**
   * 搜索防抖时间（毫秒）
   * @default 300
   */
  debounceTime?: number;
  /**
   * 是否开启分页加载
   * @default false
   */
  pagination?: boolean;
  /**
   * 每页条数
   * @default 20
   */
  pageSize?: number;
  /**
   * 是否显示加载状态
   * @default true
   */
  showLoading?: boolean;
  /**
   * 自定义选项渲染
   * @param option 选项数据
   * @returns 自定义渲染内容
   */
  optionRender?: (option: ProSelectOption) => ReactNode;
  /**
   * 自定义空状态显示
   */
  emptyRender?: ReactNode;
  /**
   * 数据格式化函数
   * @param data 原始数据
   * @returns 格式化后的选项数据
   */
  formatOptions?: (data: unknown[]) => ProSelectOption[];
  /**
   * 字段映射配置
   */
  fieldNames?: {
    /**
     * 标签字段名
     * @default 'label'
     */
    label?: string;
    /**
     * 值字段名
     * @default 'value'
     */
    value?: string;
    /**
     * 禁用字段名
     * @default 'disabled'
     */
    disabled?: string;
    /**
     * 分组字段名
     * @default 'group'
     */
    group?: string;
  };
  /**
   * 是否启用标签模式
   * 开启后选中项将以 Tag 形式展示
   * @default false
   */
  tagMode?: boolean;
  /**
   * Tag 组件属性
   */
  tagProps?: TagProps;
  /**
   * 自定义 Tag 渲染
   * @param option 选项数据
   * @param onClose 关闭回调
   * @returns 自定义 Tag 渲染内容
   */
  tagRender?: (option: ProSelectOption, onClose: () => void) => ReactNode;
  /**
   * 是否显示全选按钮（仅在多选模式下有效）
   * @default false
   */
  showSelectAll?: boolean;
  /**
   * 全选按钮文本
   * @default '全选'
   */
  selectAllText?: string;
  /**
   * 取消全选按钮文本
   * @default '取消全选'
   */
  unselectAllText?: string;
  /**
   * 是否启用虚拟滚动（大数据量时建议开启）
   * @default false
   */
  virtual?: boolean;
  /**
   * 虚拟滚动高度
   * @default 256
   */
  virtualHeight?: number;
  /**
   * 虚拟滚动每项高度
   * @default 32
   */
  virtualItemHeight?: number;
  /**
   * 是否显示选项图标
   * @default false
   */
  showOptionIcon?: boolean;
  /**
   * 选项图标渲染
   * @param option 选项数据
   * @returns 图标元素
   */
  optionIconRender?: (option: ProSelectOption) => ReactNode;
  /**
   * 选中后是否清空搜索关键词
   * @default false
   */
  clearSearchOnSelect?: boolean;
  /**
   * 最大显示标签数（仅在 tag 模式下有效）
   */
  maxTagCount?: number;
  /**
   * 是否启用创建条目（允许用户创建新选项）
   * @default false
   */
  allowCreate?: boolean;
  /**
   * 创建条目校验函数
   * @param inputValue 输入值
   * @returns 是否允许创建
   */
  validateCreate?: (inputValue: string) => boolean | Promise<boolean>;
  /**
   * 创建条目格式化函数
   * @param inputValue 输入值
   * @returns 选项数据
   */
  formatCreateOption?: (inputValue: string) => ProSelectOption;
  createdOptionPrefix: ((newOption: ProSelectOption) => ReactNode) | ReactNode;
  /**
   * 自定义下拉框头部
   */
  dropdownHeader?: ReactNode;
  /**
   * 自定义下拉框底部
   */
  dropdownFooter?: ReactNode;
}

/**
 * ProSelect 实例
 */
export interface ProSelectInstance {
  /**
   * 刷新数据
   */
  refresh: () => void;
  /**
   * 加载更多数据
   */
  loadMore: () => void;
  /**
   * 清空选项
   */
  clearOptions: () => void;
  /**
   * 获取当前选项列表
   */
  getOptions: () => ProSelectOption[];
  /**
   * 设置选项列表
   * @param options 选项数据
   */
  setOptions: (options: ProSelectOption[]) => void;
  /**
   * 全选
   */
  selectAll: () => void;
  /**
   * 取消全选
   */
  unselectAll: () => void;
  /**
   * 获取已选项
   */
  getSelectedOptions: () => ProSelectOption[];
  /**
   * 聚焦
   */
  focus: () => void;
  /**
   * 失焦
   */
  blur: () => void;
  /**
   * 创建新选项
   * @param inputValue 输入值
   */
  create: (inputValue: string) => Promise<void>;
}
