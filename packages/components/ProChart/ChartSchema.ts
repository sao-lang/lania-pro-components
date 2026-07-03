/**
 * ChartSchema — Schema 模式类型定义
 *
 * 低门槛声明图表，支持 line/bar/pie/scatter/area/radar 等常见图表
 */

export interface ChartSchema {
  /** 图表类型 */
  type: string;
  /** 数据源 */
  dataSource: Record<string, unknown>[];
  /** x 轴字段 */
  xField?: string;
  /** y 轴字段（多 y 轴时为数组） */
  yField?: string | string[];
  /** 系列分组字段（多系列） */
  seriesField?: string;
  /** 颜色字段（按值着色） */
  colorField?: string;
  /** 大小字段（散点图气泡） */
  sizeField?: string;
  /** x 轴配置 */
  xAxis?: {
    label?: string;
    formatter?: (value: unknown) => string;
    type?: 'category' | 'time' | 'value' | 'log';
  };
  /** y 轴配置 */
  yAxis?: {
    label?: string;
    formatter?: (value: unknown) => string;
    type?: 'value' | 'log';
  };
  /** 图例 */
  legend?: {
    show?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
  };
  /** tooltip */
  tooltip?: {
    formatter?: (params: unknown) => string;
    show?: boolean;
  };
  /** 通用系列配置 */
  series?: {
    smooth?: boolean;
    stack?: boolean | string;
    area?: boolean;
    horizontal?: boolean;
  };
  /** 颜色映射 */
  color?: string[] | Record<string, string>;
}
