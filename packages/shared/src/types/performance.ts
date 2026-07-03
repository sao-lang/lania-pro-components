/**
 * @lania-pro-components/shared
 *
 * 通用性能配置类型定义
 *
 * 从 ProForm/types.ts 迁移，供所有组件复用。
 * 包含虚拟滚动、懒加载、批量更新三种通用性能配置。
 *
 * 设计原则：
 * - 所有类型均为纯 interface，无运行时依赖
 * - 不包含监控 UI 配置（监控 UI 已解耦为组合方式，见 PerformanceMonitor 组件）
 */

/**
 * 虚拟滚动配置
 */
export interface VirtualScrollConfig {
  /** 是否启用虚拟滚动 */
  enabled?: boolean;
  /** 列表项高度（像素） */
  itemHeight?: number;
  /** 可视区域外额外渲染的项数 */
  overscan?: number;
  /** 容器高度（像素） */
  containerHeight?: number;
}

/**
 * 懒加载配置
 */
export interface LazyLoadConfig {
  /** 是否启用懒加载 */
  enabled?: boolean;
  /** 延迟加载时间（毫秒） */
  delay?: number;
  /** 是否在视口内才加载 */
  inViewport?: boolean;
  /** 分组大小（用于分组懒加载） */
  groupSize?: number;
  /** 组间延迟（毫秒） */
  groupDelay?: number;
  /** 高优先级字段列表 */
  highPriorityFields?: string[];
  /** 中优先级字段列表 */
  mediumPriorityFields?: string[];
}

/**
 * 批量更新配置
 */
export interface BatchUpdateConfig {
  /** 是否启用批量更新 */
  enabled?: boolean;
  /** 延迟时间（毫秒） */
  delay?: number;
  /** 最大批量大小 */
  maxBatchSize?: number;
}

/**
 * 性能配置聚合
 *
 * 聚合虚拟滚动、懒加载、批量更新三种配置。
 * 注意：不包含 monitor 字段，监控 UI 已解耦为组合方式（见 PerformanceMonitor 组件）。
 */
export interface PerformanceConfig {
  /** 虚拟滚动配置 */
  virtualScroll?: VirtualScrollConfig;
  /** 懒加载配置 */
  lazyLoad?: LazyLoadConfig;
  /** 批量更新配置 */
  batchUpdate?: BatchUpdateConfig;
}
