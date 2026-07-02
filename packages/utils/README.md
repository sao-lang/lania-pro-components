# @lania-pro-components/utils

公共工具函数包，供 `@lania-pro-components/components` 等工作区包共享。

## 模块

| 模块 | 文件 | 主要导出 |
| --- | --- | --- |
| 响应式系统 | `src/reactive.ts` | `reactive` / `effect` / `computed` / `watch` / `batchUpdate` / `ref` / `toReactive` / `isReactive` / `trigger` / `setAsyncBatchConfig` / `asyncBatchUpdate` / `flushAsyncBatch` / `clearAsyncBatch` / `isObject` / `ComputedRef` |
| 性能优化 | `src/performance.ts` | `TaskQueue` / `globalTaskQueue` / `BatchUpdateManager` / `debounce` / `throttle` / `memoize` / `LRUCache` / `PerformanceMonitor` / `performanceMonitor` / `scheduleIdleTask` / `scheduleChunkedTask` |
| 枚举映射 | `src/defineEnumMap.ts` | `defineEnumMap` / `EnumItem` / `EnumHelper` |
| 对象 / 路径 | `src/object.ts` | `deepMerge` / `getNestedValue` |
| 格式化 | `src/format.ts` | `formatNumber` / `formatMoney` / `formatPercent` / `formatDate`（依赖 `dayjs`） |
| DOM | `src/dom.ts` | `copyToClipboard`（纯函数，不含 UI 反馈） |
| 文件类型 | `src/fileType.ts` | `isVideo` |

## 用法

```ts
import { reactive, debounce, formatNumber, deepMerge, getNestedValue } from '@lania-pro-components/utils';
```

## 构建

```bash
pnpm --filter @lania-pro-components/utils build
```

产出 `dist/index.{cjs,mjs,d.ts}`。
