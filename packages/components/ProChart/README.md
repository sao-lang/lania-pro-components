# ProChart

图表库无关的数据可视化组件，基于 Adapter 模式，支持 Schema 与 Option 双形态。

## 架构设计

```
ProChart
├── Adapter 模式（图表库无关）
│   ├── ChartAdapter（接口）- init / update / resize / destroy / on / setTheme
│   ├── EChartsAdapter（内置）- 包装 echarts.init / setOption / dispose
│   ├── HighchartsAdapter（可扩展）- 预留
│   └── G2Adapter（可扩展）- 预留
│
├── 入参形态
│   ├── Schema 模式 - type + dataSource + xField/yField 声明式
│   ├── Option 模式 - 直接传图表库原生 option
│   └── 组合模式 - Schema + option 深合并
│
├── Schema Transformer 系统
│   ├── line - 折线图（单系列/多系列/平滑/面积）
│   ├── bar - 柱状图（堆叠/分组）
│   ├── pie - 饼图（环图/玫瑰图）
│   ├── scatter - 散点图（气泡图 / sizeField）
│   ├── area - 面积图（堆叠 / stack）
│   └── radar - 雷达图（多系列）
│
├── 数据流
│   ├── 静态数据 - dataSource prop 直接传入
│   ├── 远程数据 - request + params + polling 自动加载
│   └── 缓存 - 复用 shared useCache（可选）
│
├── 生命周期管理
│   ├── StrictMode 安全 - cancelled flag + 正确销毁
│   ├── ResizeObserver - 自动监听容器尺寸变化
│   ├── option 变化触发 update，adapter 变化触发 re-init
│   └── 远程数据取消 - AbortController（委托 useAsyncRequest）
│
├── 状态管理
│   ├── loading / error / empty 三态
│   ├── ChartStatus - 三态渲染（Spin / Result / Empty）
│   └── 自定义三态渲染（renderLoading / renderError / renderEmpty）
│
└── 注册表
    ├── chartAdapterRegistry - adapter 运行时注册与查找（支持别名）
    └── transformerRegistry - Schema 转换器注册
```

## 快速开始

```tsx
import { ProChart, setEChartsInstance } from '@lania-pro-components/components/ProChart';
// 或
import { ProChart } from '@lania-pro-components/components';
// 引入 ECharts adapter（副作用：自动注册）
import '@lania-pro-components/components/ProChart/adapters/echarts';

// 1. 设置 echarts 实例
import * as echarts from 'echarts';
setEChartsInstance(echarts);

// 2. Option 模式
<ProChart
  adapter="echarts"
  option={{
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
    yAxis: { type: 'value' },
    series: [{ data: [120, 200, 150], type: 'line' }],
  }}
  style={{ height: 320 }}
/>

// 3. Schema 模式
<ProChart
  adapter="echarts"
  type="line"
  dataSource={[
    { date: '2026-07-01', value: 120, group: 'A' },
    { date: '2026-07-02', value: 200, group: 'A' },
  ]}
  xField="date"
  yField="value"
  seriesField="group"
/>

// 4. 远程数据
<ProChart
  adapter="echarts"
  type="bar"
  request={async (params) => {
    const res = await fetchStats(params);
    return { data: res.list };
  }}
  params={{ range: '7d' }}
  xField="date"
  yField="count"
/>
```

## API

### ProChartProps

| 参数          | 说明                        | 类型                                                         | 默认值   |
| ------------- | --------------------------- | ------------------------------------------------------------ | -------- |
| adapter       | 图表库适配器                | `string \| ChartAdapter`                                     | -        |
| option        | 原生图表配置（Option 模式） | `TOption`                                                    | -        |
| type          | 图表类型（Schema 模式）     | `string`                                                     | -        |
| dataSource    | 数据源                      | `Record<string, unknown>[]`                                  | -        |
| xField        | x 轴字段                    | `string`                                                     | -        |
| yField        | y 轴字段                    | `string \| string[]`                                         | -        |
| seriesField   | 系列分组字段                | `string`                                                     | -        |
| request       | 远程数据请求函数            | `(params) => Promise<{ data }>`                              | -        |
| params        | 请求参数                    | `Record<string, unknown>`                                    | -        |
| polling       | 轮询间隔（ms）              | `number`                                                     | -        |
| type          | 图表类型（Schema 模式）     | `'line' \| 'bar' \| 'pie' \| 'scatter' \| 'area' \| 'radar'` | -        |
| dataSource    | 数据源（Schema 模式）       | `Record<string, unknown>[]`                                  | -        |
| xField        | x 轴字段                    | `string`                                                     | -        |
| yField        | y 轴字段                    | `string \| string[]`                                         | -        |
| seriesField   | 系列分组字段                | `string`                                                     | -        |
| sizeField     | 气泡大小字段（散点图）      | `string`                                                     | -        |
| height        | 高度                        | `number \| string`                                           | `320`    |
| width         | 宽度                        | `number \| string`                                           | `100%`   |
| theme         | 主题                        | `'light' \| 'dark' \| 'auto'`                                | `'auto'` |
| loading       | 外部强制 loading            | `boolean`                                                    | -        |
| error         | 外部强制 error              | `Error \| null`                                              | -        |
| empty         | 外部强制 empty              | `boolean`                                                    | -        |
| onChartReady  | 图表就绪回调                | `(instance) => void`                                         | -        |
| onChartEvent  | 图表事件回调                | `(event, payload) => void`                                   | -        |
| renderLoading | 自定义加载渲染              | `() => ReactNode`                                            | -        |
| renderError   | 自定义错误渲染              | `(error, retry) => ReactNode`                                | -        |
| renderEmpty   | 自定义空数据渲染            | `() => ReactNode`                                            | -        |

### ProChartInstance（ref）

| 方法                         | 说明             |
| ---------------------------- | ---------------- |
| `getInstance()`              | 获取原始图表实例 |
| `setOption(option)`          | 手动更新 option  |
| `resize()`                   | 手动触发 resize  |
| `toDataURL(type?)`           | 导出 base64 图片 |
| `download(filename?, type?)` | 下载图片         |
| `reload()`                   | 重新加载远程数据 |

## ECharts Adapter 注册

ProChart 不直接依赖 echarts。使用前需：

```ts
// 方式 1：导入子路径（自动注册）
import '@lania-pro-components/components/ProChart/adapters/echarts';

// 方式 2：手动注册
import { registerChartAdapter, EChartsAdapter } from '@lania-pro-components/components';
import * as echarts from 'echarts';
import { setEChartsInstance } from '@lania-pro-components/components/ProChart';

setEChartsInstance(echarts);
registerChartAdapter('echarts', EChartsAdapter);

// 方式 3：异步注册（按需加载）
import { registerChartAdapter } from '@lania-pro-components/components';
const echarts = await import('echarts');
const { EChartsAdapter, setEChartsInstance } =
  await import('@lania-pro-components/components/ProChart/adapters/echarts');
setEChartsInstance(echarts.default);
```

## 设计原则

- **Adapter 模式**：抽象图表实例的 init/update/resize/destroy 生命周期，业务代码不直接依赖任何图表库
- **Schema 与 Option 双形态**：Schema 覆盖 80% 场景，Option 作为逃生舱
- **按需加载**：不引入任何 adapter 时 ProChart 主包 < 15KB gzipped
- **组合优于配置**：三态 UI、工具栏通过 children/render prop 注入
