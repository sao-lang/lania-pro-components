/**
 * @lania-pro-components/shared
 *
 * VirtualScroll 组件类型定义
 */

import type { VirtualScrollState } from '../../hooks/useVirtualScroll';
import type { CSSProperties, ReactNode } from 'react';

/**
 * VirtualScroll 组件属性
 */
export interface VirtualScrollProps<T = unknown> {
  // ==================== 数据源 ====================

  /** 列表数据 */
  items: T[];

  // ==================== 固定高度模式 ====================

  /**
   * 列表项高度（像素），固定高度模式下必填。
   * 仅在该值有效（大于 0）时使用固定高度模式（useVirtualScroll），
   * 否则使用动态高度模式（useDynamicVirtualScroll）。
   */
  itemHeight?: number;

  // ==================== 动态高度模式 ====================

  /**
   * 预估高度（像素），动态高度模式下用于初始计算和未测量项。
   * 仅在未设置 itemHeight 时生效。
   */
  estimateHeight?: number;

  /**
   * 获取项的实际高度，动态高度模式下自定义每项测量高度。
   * 不设置时默认使用 estimateHeight。
   */
  getItemHeight?: (item: T, index: number) => number;

  // ==================== 虚拟滚动配置 ====================

  /** 可视区域外额外渲染的项数（默认 5） */
  overscan?: number;

  /** 容器高度（像素），不设置则自动计算 */
  containerHeight?: number;

  /** 是否启用虚拟滚动，不设置时 items > 100 自动启用 */
  enabled?: boolean;

  // ==================== 状态回调 ====================

  /**
   * 虚拟滚动状态变更回调
   * 包装模式下父组件可通过此回调获取当前 visibleItems / startIndex / endIndex 等信息，
   * 用于自行控制渲染内容。
   */
  onVisibleStateChange?: (state: VirtualScrollState<T>) => void;

  // ==================== 触底回调 ====================

  /** 滚动到底部时的回调 */
  onScrollToBottom?: () => void;

  /**
   * 触发触底的阈值（像素），距离底部小于该值时触发回调。
   * 默认 50px。
   */
  scrollToBottomThreshold?: number;

  // ==================== 加载与空态 ====================

  /** 是否正在加载更多（底部显示加载指示器） */
  loading?: boolean;

  /** 自定义加载指示器 */
  loadingComponent?: ReactNode;

  /** 数据为空时渲染的内容 */
  emptyComponent?: ReactNode;

  // ==================== 渲染模式 ====================

  /**
   * children 支持两种模式：
   *
   * 1. 函数模式（列表模式）：(item, index, state) => ReactNode
   *    - 用于逐项渲染的场景，VirtualScroll 内部遍历 visibleItems 并逐项调用
   *    - 需要搭配 `items` 数据源使用
   *    - **推荐用于简单列表渲染**
   *
   * 2. ReactNode 模式（包装模式）：
   *    - 直接渲染传入的内容，VirtualScroll 仅提供滚动容器 + 占位高度
   *    - 适用于父级已自行计算 visibleItems 并完成布局的复杂场景（如 ProForm 的 Grid 布局）
   *    - 此时 `items` 仍用于计算 totalHeight，children 由父级控制渲染内容
   *    - **推荐用于复杂布局包装**
   */
  children: ((item: T, index: number, state: VirtualScrollState<T>) => ReactNode) | ReactNode;

  /** 列表项 key 提取函数（默认使用 index），仅函数模式生效 */
  rowKey?: (item: T, index: number) => string | number;

  // ==================== 样式与类名 ====================

  /** 容器 class */
  className?: string;

  /** 容器 style */
  style?: CSSProperties;

  /** 内部滚动容器 class */
  containerClassName?: string;

  /** 内部滚动容器 style */
  containerStyle?: CSSProperties;

  /** 列表项容器 class */
  itemClassName?: string;

  /** 列表项容器 style */
  itemStyle?: CSSProperties;
}

/**
 * VirtualScroll 组件暴露的方法（通过 ref 获取）
 */
export interface VirtualScrollHandle {
  /** 滚动到指定索引 */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  /** 滚动到顶部 */
  scrollToTop: (behavior?: ScrollBehavior) => void;
  /** 滚动到底部 */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}
