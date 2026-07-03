/**
 * @lania-pro-components/shared
 *
 * PerformanceMonitor 类型定义
 */

/**
 * PerformanceMonitor 组件属性
 */
export interface PerformanceMonitorProps {
  /** 是否启用（默认开发环境） */
  enabled?: boolean;
  /** 浮窗位置（默认 bottom-right） */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** 数据刷新间隔（毫秒，默认 1000） */
  refreshInterval?: number;
  /** 要展示的 measure 名称列表（默认空，表示全量） */
  measures?: string[];
  /** 宿主自定义指标注入 */
  extraStats?: () => Record<string, string | number>;
  /** 浮窗标题（默认 'Performance'） */
  title?: string;
}
