/**
 * @lania-pro-components/shared
 *
 * 通用布局配置类型
 *
 * 从 ProForm/types.ts 迁移，供所有组件复用。
 */

/**
 * 布局模式
 */
export type LayoutMode = 'horizontal' | 'vertical' | 'inline' | 'compact';

/**
 * 卡片容器配置
 */
export interface CardContainerConfig {
  /** 是否显示卡片边框 */
  bordered?: boolean;
  /** 卡片标题 */
  title?: string;
  /** 卡片样式 */
  style?: React.CSSProperties;
  /** 卡片类名 */
  className?: string;
}
