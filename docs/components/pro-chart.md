# ProChart

图表库无关的数据可视化组件，基于 Adapter 模式，支持 Schema 与 Option 双形态。

## API

### 导出

| 导出                       | 类型   | 说明                         |
| -------------------------- | ------ | ---------------------------- |
| `ProChart`                 | 组件   | 主组件                       |
| `EChartsAdapter`           | 适配器 | 内置 ECharts 适配器          |
| `ChartStatus`              | 组件   | loading/error/empty 三态渲染 |
| `registerChartAdapter`     | 函数   | 注册自定义 adapter           |
| `registerChartTransformer` | 函数   | 注册 Schema 转换器           |

### ProChartProps

| 属性           | 类型                            | 默认值   | 说明                        |
| -------------- | ------------------------------- | -------- | --------------------------- |
| `adapter`      | `string \| ChartAdapter`        | -        | 图表库适配器                |
| `option`       | `TOption`                       | -        | 原生图表配置（Option 模式） |
| `type`         | `string`                        | -        | 图表类型（Schema 模式）     |
| `dataSource`   | `Record<string, unknown>[]`     | -        | 数据源                      |
| `xField`       | `string`                        | -        | x 轴字段                    |
| `yField`       | `string \| string[]`            | -        | y 轴字段                    |
| `seriesField`  | `string`                        | -        | 系列分组字段                |
| `sizeField`    | `string`                        | -        | 气泡大小字段（散点图）      |
| `request`      | `(params) => Promise<{ data }>` | -        | 远程数据请求函数            |
| `params`       | `Record<string, unknown>`       | -        | 请求参数                    |
| `polling`      | `number`                        | -        | 轮询间隔（ms）              |
| `height`       | `number \| string`              | `320`    | 高度                        |
| `width`        | `number \| string`              | `100%`   | 宽度                        |
| `theme`        | `'light' \| 'dark' \| 'auto'`   | `'auto'` | 主题                        |
| `loading`      | `boolean`                       | -        | 外部强制 loading            |
| `error`        | `Error \| null`                 | -        | 外部强制 error              |
| `empty`        | `boolean`                       | -        | 外部强制 empty              |
| `onChartReady` | `(instance) => void`            | -        | 图表就绪回调                |

### 支持图表类型

| 类型      | 说明          | Schema 字段                                       |
| --------- | ------------- | ------------------------------------------------- |
| `line`    | 折线图        | xField, yField, seriesField(多系列), smooth, area |
| `bar`     | 柱状图        | xField, yField, seriesField(多系列), stack        |
| `pie`     | 饼图/环图     | xField, yField, area(环图)                        |
| `scatter` | 散点图/气泡图 | xField, yField, seriesField, sizeField            |
| `area`    | 面积图        | xField, yField, seriesField, stack, smooth        |
| `radar`   | 雷达图        | xField, yField, seriesField(多系列)               |

## 示例

```tsx
import { ProChart, setEChartsInstance } from '@lania-pro-components/components/ProChart';
import '@lania-pro-components/components/ProChart/adapters/echarts';
import * as echarts from 'echarts';

setEChartsInstance(echarts);

// Option 模式
<ProChart
  adapter="echarts"
  option={{ xAxis: { type: 'category', data: ['Mon', 'Tue'] }, series: [{ data: [120, 200], type: 'line' }] }}
/>

// Schema 模式
<ProChart
  adapter="echarts"
  type="line"
  dataSource={[{ date: '2026-07-01', value: 120 }]}
  xField="date"
  yField="value"
/>

// 远程数据
<ProChart adapter="echarts" type="bar" request={fetchStats} params={{ range: '7d' }} />
```
