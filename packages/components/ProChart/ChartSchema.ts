/**
 * ChartSchema — Schema 模式类型定义
 *
 * 低门槛声明图表，支持 line/bar/pie/scatter/area/radar 等常见图表。
 *
 * 所有复杂配置通过 xAxis/yAxis/legend/tooltip/series/color 传入，
 * 各 transformer 会将这些配置透传到底层图表库 option。
 *
 * @example
 * ```tsx
 * // 自定义图例位置、tooltip 格式化、颜色映射
 * <ProChart
 *   adapter="echarts"
 *   type="bar"
 *   dataSource={data}
 *   xField="date"
 *   yField="value"
 *   seriesField="group"
 *   legend={{ position: 'bottom' }}
 *   tooltip={{ formatter: (params) => `${params.seriesName}: ${params.value}` }}
 *   color={['#5470C6', '#91CC75', '#EE6666']}
 * />
 * ```
 */

export interface ChartSchema {
  /** 图表类型，如 line / bar / pie / scatter / area / radar */
  type: string;
  /** 数据源：数组对象，每个元素代表一行数据 */
  dataSource: Record<string, unknown>[];
  /** x 轴字段名（所有图表类型必需） */
  xField?: string;
  /**
   * y 轴字段名。
   * - 单 y 轴：字符串
   * - 多 y 轴：字符串数组，此时每个字段生成一个独立系列
   */
  yField?: string | string[];
  /**
   * 系列分组字段。
   * - 有值时按此字段分组生成多系列（显示图例）
   * - 无值时视为单系列
   */
  seriesField?: string;
  /**
   * 颜色字段（按值着色）。
   * 预留，当前 transformer 未消费
   */
  colorField?: string;
  /**
   * 大小字段（散点图气泡）。
   * 仅 scatter transformer 消费
   */
  sizeField?: string;
  /**
   * x 轴配置
   * - type: 'category'(默认) | 'time' | 'value' | 'log'（仅 line/bar/area/scatter 生效）
   * - label: 轴名称
   * - formatter: 轴标签格式化函数
   */
  xAxis?: {
    label?: string;
    formatter?: (value: unknown) => string;
    type?: 'category' | 'time' | 'value' | 'log';
  };
  /**
   * y 轴配置
   * - type: 'value'(默认) | 'log'（仅 line/bar/area/scatter 生效）
   * - label: 轴名称
   * - formatter: 轴标签格式化函数
   */
  yAxis?: {
    label?: string;
    formatter?: (value: unknown) => string;
    type?: 'value' | 'log';
  };
  /**
   * 图例配置
   * - show: 是否显示（多系列默认显示）
   * - position: 位置 'top' | 'bottom' | 'left' | 'right'
   */
  legend?: {
    show?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
  };
  /**
   * tooltip 配置
   * - show: 是否显示
   * - formatter: tooltip 内容格式化函数
   */
  tooltip?: {
    formatter?: (params: unknown) => string;
    show?: boolean;
  };
  /**
   * 通用系列配置（各图表共享的行为调整）
   *
   * - smooth: 平滑曲线（line/area）
   * - stack: 堆叠（bar/area）；true 使用 'total' 堆叠名，或自定义字符串
   * - area: 面积模式（line 的 areaStyle / pie 的环图）
   * - horizontal: 横向柱状图（bar）
   * - roseType: 玫瑰图（pie）
   */
  series?: {
    smooth?: boolean;
    stack?: boolean | string;
    area?: boolean;
    horizontal?: boolean;
    roseType?: boolean;
  };
  /**
   * 颜色映射
   * - string[]: 按系列顺序取色
   * - Record<string, string>: 按系列名称取色（预留）
   */
  color?: string[] | Record<string, string>;
}
