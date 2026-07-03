/**
 * ProDescriptions 类型定义
 *
 * 详情视图列定义，Omit ProColumnType 表格专有字段
 * 支持 mask/copyable/span 等详情场景特有配置
 */

import type { ReactNode, CSSProperties } from 'react';
import type { ProColumnType } from '../ProTable/types';
import type { CardContainerConfig } from '@lania-pro-components/shared';

/**
 * 描述项列定义（Omit ProColumnType 表格专有字段）
 */
export type ProDescriptionColumn<T = Record<string, unknown>> = Omit<
  ProColumnType<T>,
  | 'oprTools'
  | 'actions'
  | 'proTableConfig'
  | 'search'
  | 'hideInSearch'
  | 'order'
  | 'fixed'
  | 'width'
  | 'align'
  | 'ellipsis'
  | 'colSpan'
  | 'rowSpan'
  | 'onCell'
  | 'onHeaderCell'
  | 'filterDropdown'
  | 'filterDropdownVisible'
  | 'onFilterDropdownVisibleChange'
  | 'filterDropdownProps'
  | 'onFilter'
  | 'sorter'
  | 'defaultSortOrder'
  | 'sortPriority'
  | 'disableInSetting'
  | 'hideInTable'
> & {
  /** 跨列数（仅 table/grid 布局生效） */
  span?: number;
  /** 是否启用复制按钮 */
  copyable?: boolean;
  /** 是否启用脱敏渲染（消费 ProForm readonlyRegistry） */
  masking?: boolean;
  /** 是否在详情视图隐藏 */
  hideInDescriptions?: boolean;
};

/**
 * ProDescriptions 主组件 Props
 */
export interface ProDescriptionsProps<T = Record<string, unknown>> {
  /** 列定义（可直接传 ProColumnType[]，内部自动 adapt） */
  columns: ProDescriptionColumn<T>[] | ProColumnType<T>[];
  /** 数据源（单条记录） */
  dataSource: T;
  /** 布局模式 */
  layout?: 'table' | 'grid' | 'inline';
  /** 列数（table/grid 布局生效） */
  column?: number;
  /** 响应式列数（grid 布局生效，覆盖 column） */
  responsiveColumns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  /** 是否带边框（table 布局） */
  bordered?: boolean;
  /** 尺寸 */
  size?: 'mini' | 'small' | 'default' | 'large';
  /** label 与 value 的排列方向（table 布局） */
  direction?: 'horizontal' | 'vertical';
  /** 空值占位符（默认 '-'） */
  emptyText?: ReactNode;
  /** 卡片容器配置（grid 布局，消费 CardContainerConfig） */
  cardContainer?: CardContainerConfig;
  /** className */
  className?: string;
  /** style */
  style?: CSSProperties;
  /** 标题（可选，渲染在顶部） */
  title?: ReactNode;
  /** 额外内容（可选，渲染在标题右侧） */
  extra?: ReactNode;
}

/**
 * 单项渲染 Props
 */
export interface DescriptionCellProps<T = Record<string, unknown>> {
  column: ProDescriptionColumn<T>;
  value: unknown;
  record: T;
  index: number;
  emptyText?: ReactNode;
}
