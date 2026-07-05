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

// 5. Schema + 样式配置（自定义图例、tooltip、颜色）
<ProChart
  adapter="echarts"
  type="bar"
  dataSource={salesData}
  xField="month"
  yField="revenue"
  seriesField="region"
  legend={{ position: 'bottom' }}
  tooltip={{ formatter: (p) => `${p.seriesName}: ¥${p.value}` }}
  color={['#5470C6', '#91CC75', '#EE6666']}
/>

// 6. Schema + 轴配置 + 系列配置（平滑曲线/面积）
<ProChart
  adapter="echarts"
  type="line"
  dataSource={trendData}
  xField="date"
  yField="count"
  series={{ smooth: true, area: true }}
  xAxis={{ label: '日期', type: 'time' }}
  yAxis={{ label: '数量' }}
/>

// 7. 横向柱状图
<ProChart
  adapter="echarts"
  type="bar"
  dataSource={rankData}
  xField="name"
  yField="score"
  series={{ horizontal: true }}
/>
```

## API

### ProChartProps

| 参数          | 说明                                 | 类型                                                 | 默认值   |
| ------------- | ------------------------------------ | ---------------------------------------------------- | -------- |
| adapter       | 图表库适配器                         | `string \| ChartAdapter`                             | -        |
| option        | 原生图表配置（Option 模式）          | `TOption`                                            | -        |
| type          | 图表类型（Schema 模式）              | `string`                                             | -        |
| dataSource    | 数据源                               | `Record<string, unknown>[]`                          | -        |
| xField        | x 轴字段（所有图表类型必需）         | `string`                                             | -        |
| yField        | y 轴字段（单值/多值数组）            | `string \| string[]`                                 | -        |
| seriesField   | 系列分组字段（多系列时显示图例）     | `string`                                             | -        |
| sizeField     | 气泡大小字段（仅 scatter）           | `string`                                             | -        |
| request       | 远程数据请求函数                     | `(params) => Promise<{ data }>`                      | -        |
| params        | 请求参数                             | `Record<string, unknown>`                            | -        |
| polling       | 轮询间隔（ms）                       | `number`                                             | -        |
| height        | 高度                                 | `number \| string`                                   | `320`    |
| width         | 宽度                                 | `number \| string`                                   | `100%`   |
| theme         | 主题                                 | `'light' \| 'dark' \| 'auto'`                        | `'auto'` |
| loading       | 外部强制 loading                     | `boolean`                                            | -        |
| error         | 外部强制 error                       | `Error \| null`                                      | -        |
| empty         | 外部强制 empty                       | `boolean`                                            | -        |
| xAxis         | x 轴配置（label/formatter/type）     | `{ label?, formatter?, type? }`                      | -        |
| yAxis         | y 轴配置（label/formatter/type）     | `{ label?, formatter?, type? }`                      | -        |
| legend        | 图例配置（show/position）            | `{ show?, position? }`                               | -        |
| tooltip       | tooltip 配置（show/formatter）       | `{ show?, formatter? }`                              | -        |
| series        | 通用系列行为（smooth/stack/area 等） | `{ smooth?, stack?, area?, horizontal?, roseType? }` | -        |
| color         | 颜色映射                             | `string[] \| Record<string, string>`                 | -        |
| onChartReady  | 图表就绪回调                         | `(instance) => void`                                 | -        |
| onChartEvent  | 图表事件回调                         | `(event, payload) => void`                           | -        |
| renderLoading | 自定义加载渲染                       | `() => ReactNode`                                    | -        |
| renderError   | 自定义错误渲染                       | `(error, retry) => ReactNode`                        | -        |
| renderEmpty   | 自定义空数据渲染                     | `() => ReactNode`                                    | -        |

### Schema 样式配置

Schema 模式下额外支持的样式配置 prop，同 `ChartSchema` 同名字段。

| 参数    | 说明             | 类型                                                 | 生效图表                    |
| ------- | ---------------- | ---------------------------------------------------- | --------------------------- |
| xAxis   | x 轴配置         | `{ label?, formatter?, type? }`                      | line / bar / area / scatter |
| yAxis   | y 轴配置         | `{ label?, formatter?, type? }`                      | line / bar / area / scatter |
| legend  | 图例配置         | `{ show?, position? }`                               | 全部                        |
| tooltip | tooltip 配置     | `{ show?, formatter? }`                              | 全部                        |
| series  | 通用系列行为配置 | `{ smooth?, stack?, area?, horizontal?, roseType? }` | 见下方                      |
| color   | 颜色映射         | `string[] \| Record<string, string>`                 | 全部                        |

**series 配置项对各图表类型的效果：**

| 字段       | 效果            | 图表类型    |
| ---------- | --------------- | ----------- |
| smooth     | 平滑曲线        | line / area |
| stack      | 堆叠系列        | bar / area  |
| area       | 面积模式 / 环图 | line / pie  |
| horizontal | 横向柱状图      | bar         |
| roseType   | 玫瑰图          | pie         |

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
