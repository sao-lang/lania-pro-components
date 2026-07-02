# 提取公共 utils 包 — 剩余消费者迁移计划

## 概述

将 `packages/components` 中已被抽取到 `@lania-pro-components/utils` 的工具函数的**消费者**迁移到从新包导入，并删除原始源文件。

**前置工作已完成（Task 1-2，本次不重复）：**
- ✅ `packages/utils/` 新包已创建：`package.json` + `src/{index,reactive,performance,defineEnumMap,object,format,dom,fileType}.ts` + `README.md`
- ✅ `rollup.config.js`：`utilsConfig` 块 + `external` 含 `@lania-pro-components/utils`/`@lania-pro-components/theme`/`dayjs`
- ✅ `tsconfig.json`：`paths` + `include` 已加 utils
- ✅ `vitest.config.ts`：`resolve.alias` 已映射 utils 到源码
- ✅ `packages/components/package.json`：`dependencies` 已加 `"@lania-pro-components/utils": "workspace:*"`

**theme 包无可抽函数**（所有导出与 light/dark + Arco 强耦合），已确认只从 components 抽取。

---

## 当前状态分析（探索确认）

### utils 包导出清单（已就绪）
| 模块 | 导出 |
|---|---|
| `reactive.ts` | reactive, effect, computed, watch, batchUpdate, setAsyncBatchConfig, asyncBatchUpdate, flushAsyncBatch, clearAsyncBatch, ref, isObject, toReactive, isReactive, trigger, ComputedRef |
| `performance.ts` | TaskQueue, globalTaskQueue, BatchUpdateManager, debounce, throttle, memoize, LRUCache, PerformanceMonitor, performanceMonitor, scheduleIdleTask, scheduleChunkedTask |
| `defineEnumMap.ts` | defineEnumMap, EnumItem, EnumHelper |
| `object.ts` | deepMerge, getNestedValue |
| `format.ts` | formatNumber, formatMoney, formatPercent, formatDate（依赖 dayjs）|
| `dom.ts` | copyToClipboard（纯逻辑，返回 `Promise<boolean>`，无 Arco Message）|
| `fileType.ts` | isVideo（内部含私有 VIDEO_EXTENSIONS）|

### 待迁移消费者清单（精确行号）

**ProForm（4 个 import + 1 个 re-export 文件）：**
- `core/FormStore.ts:2` — `import { reactive, batchUpdate, watch } from '../utils/reactive';`
- `core/FieldNode.ts:3` — `import { computed, watch, ref, type ComputedRef } from '../utils/reactive';`
- `ProForm.tsx:10` — `import { performanceMonitor } from './utils/performance';`
- `ProForm.tsx:12` — `import { setAsyncBatchConfig, clearAsyncBatch } from './utils/reactive';`
- `components/FormPerformanceMonitor.tsx:2` — `import { performanceMonitor } from '../utils/performance';`
- `index.ts:75-86` — re-export reactive 子集 `from './utils/reactive'`
- `index.ts:109-121` — re-export performance 全部 `from './utils/performance'`

**ProTable（columnRender + barrel + 删 defineEnumMap）：**
- `utils/columnRender.tsx:17` — `import dayjs from 'dayjs';`（删）
- `utils/columnRender.tsx:38-55` — `copyToClipboard` 定义（含 Arco Message，改包装器）
- `utils/columnRender.tsx:60-82` — `fallbackCopyToClipboard` 私有 helper（删）
- `utils/columnRender.tsx` — formatNumber/Money/Percent/Date/getNestedValue 定义（删，改从 utils 导入）
- `utils/index.ts:2-18` — barrel 从 `./columnRender` re-export 迁移函数（改源）
- `utils/index.ts:23-24` — barrel 从 `./defineEnumMap` re-export（改源）
- `utils/defineEnumMap.ts` — 整文件删除
- `index.tsx:719-751` — **无需改动**（从 `./utils` 桶 re-export，桶会转发）
- `components/CardView.tsx:5` — **无需改动**（`import { getNestedValue } from '../utils'`，桶转发）
- `features/TableRenderer.tsx:5` — **无需改动**（只导入非迁移的 `convertColumns`）

**ProDialog（删 deepMerge + 2 个 import）：**
- `utils.ts:34` — `deepMerge` 定义（删，保留 getSizeWidth/getFooterJustify）
- `dialogHolder.tsx:1` — `import { deepMerge } from './utils';`
- `useProDialog.tsx:2` — `import { deepMerge, getSizeWidth, getFooterJustify } from './utils';`（拆分）
- `index.tsx:23` — **无需改动**（只导入 getSizeWidth/getFooterJustify，不 re-export deepMerge）

**ProUpload（删 utils.ts + 1 个 import）：**
- `utils.ts` — 整文件删除（isVideo + 私有 VIDEO_EXTENSIONS）
- `index.tsx:14` — `import { isVideo } from './utils';`

**测试（4 个文件）：**
- `__tests__/columnRender.test.ts:2-14` — 拆分：迁移函数从 utils，注册表函数仍从 columnRender
- `__tests__/defineEnumMap.test.ts:2` — `from '../ProTable/utils/defineEnumMap'` → utils
- `__tests__/dialogUtils.test.ts:2` — 拆分：deepMerge 从 utils，getSizeWidth/getFooterJustify 仍从 ProDialog/utils
- `__tests__/uploadUtils.test.ts:2` — `from '../ProUpload/utils'` → utils

---

## 提议的变更

### Task 3：迁移 ProForm 消费者

**步骤 3.1 — 修改 4 个 import 文件**（路径替换 `'...utils/reactive'`/`'...utils/performance'` → `'@lania-pro-components/utils'`）：

1. `packages/components/ProForm/core/FormStore.ts:2`：
   - `from '../utils/reactive'` → `from '@lania-pro-components/utils'`
2. `packages/components/ProForm/core/FieldNode.ts:3`：
   - `from '../utils/reactive'` → `from '@lania-pro-components/utils'`
3. `packages/components/ProForm/ProForm.tsx:10`：
   - `from './utils/performance'` → `from '@lania-pro-components/utils'`
4. `packages/components/ProForm/ProForm.tsx:12`：
   - `from './utils/reactive'` → `from '@lania-pro-components/utils'`
5. `packages/components/ProForm/components/FormPerformanceMonitor.tsx:2`：
   - `from '../utils/performance'` → `from '@lania-pro-components/utils'`

**步骤 3.2 — 修改 `ProForm/index.ts` 两个 re-export 块的 `from` 源：**
- 第 86 行：`} from './utils/reactive';` → `} from '@lania-pro-components/utils';`
- 第 121 行：`} from './utils/performance';` → `} from '@lania-pro-components/utils';`
- （re-export 的符号列表不变，全部都能从 utils 包导出）

**步骤 3.3 — 删除原始文件：**
- 删除 `packages/components/ProForm/utils/reactive.ts`
- 删除 `packages/components/ProForm/utils/performance.ts`
- 若 `packages/components/ProForm/utils/` 目录搬空，删除空目录

---

### Task 4：迁移 ProTable 消费者

**步骤 4.1 — 修改 `utils/columnRender.tsx`：**

(a) **删除 dayjs import**（第 17 行 `import dayjs from 'dayjs';`）

(b) **在文件顶部 imports 区追加**：
```ts
import {
  formatNumber,
  formatMoney,
  formatPercent,
  formatDate,
  getNestedValue,
  copyToClipboard as copyToClipboardPure,
} from '@lania-pro-components/utils';
```

(c) **删除迁移函数的定义**：`getNestedValue`、`formatNumber`、`formatMoney`、`formatPercent`、`formatDate` 的 `export const/function` 块（含其上方的 JSDoc 注释）。

(d) **重写 `copyToClipboard` 为 Arco 感知包装器**（替换第 38-82 行的 copyToClipboard + fallbackCopyToClipboard）：
```ts
/**
 * 拷贝文本到剪贴板（含 Arco Message 反馈）
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (!text) {
    return;
  }
  const success = await copyToClipboardPure(text);
  if (success) {
    Message.success('复制成功');
  } else {
    Message.error('复制失败');
  }
};
```
> 说明：原 `copyToClipboard` 是同步返回 void；新版是 async 返回 `Promise<void>`。所有现存调用点都是 fire-and-forget（`copyToClipboard(text)` 不 await），行为兼容。`Message` 仍从 `@arco-design/web-react` 导入（保留该 import）。

(e) **保留**：所有渲染器函数（renderColumnByValueType/createColumnRender/convertColumns）、注册表（customRendererRegistry/registerCellRenderer 等）、其它 Arco 组件 imports 不动。

**步骤 4.2 — 修改 `utils/index.ts` barrel：**

```ts
// 列渲染相关
export {
  renderColumnByValueType,
  createColumnRender,
  convertColumns,
  customRendererRegistry,
  registerCellRenderer,
  unregisterCellRenderer,
  registerCellRenderers,
  getCellRenderer,
  hasCellRenderer,
} from './columnRender';

// copyToClipboard 仍是 Arco 感知包装器，从 columnRender 导出
export { copyToClipboard } from './columnRender';

// 迁移到 utils 包的纯函数
export {
  formatNumber,
  formatMoney,
  formatPercent,
  formatDate,
  getNestedValue,
  defineEnumMap,
} from '@lania-pro-components/utils';

export type { CustomCellRenderer, CustomRendererRegistry } from '../types';
export type { EnumItem, EnumHelper } from '@lania-pro-components/utils';

// 单元格合并
export { createRowMerge, createColMerge, combineMerge, calculateMergeState, getCellMergeProps } from './cellMerge';
export type { CellMergeConfig, MergeState } from './cellMerge';
```
> 关键：barrel 从 utils 包 re-export 迁移函数，使 `ProTable/index.tsx:719-751`（`from './utils'`）和 `CardView.tsx:5`（`from '../utils'`）**无需改动**，公开 API 行为不变。

**步骤 4.3 — 删除 `utils/defineEnumMap.ts`**（整文件）。

---

### Task 5：迁移 ProDialog + ProUpload 消费者

**步骤 5.1 — ProDialog：**

(a) `utils.ts`：删除 `deepMerge` 函数定义（第 34 行起，含 JSDoc）。保留 `getSizeWidth`、`getFooterJustify` 与 `import type { DialogSize, FooterPosition } from './types';`。

(b) `dialogHolder.tsx:1`：
- `import { deepMerge } from './utils';` → `import { deepMerge } from '@lania-pro-components/utils';`

(c) `useProDialog.tsx:2`：拆分为两行
```ts
import { getSizeWidth, getFooterJustify } from './utils';
import { deepMerge } from '@lania-pro-components/utils';
```

(d) `index.tsx`：**无需改动**（第 23 行只导入 getSizeWidth/getFooterJustify）。

**步骤 5.2 — ProUpload：**

(a) `index.tsx:14`：
- `import { isVideo } from './utils';` → `import { isVideo } from '@lania-pro-components/utils';`

(b) 删除 `packages/components/ProUpload/utils.ts`（整文件）。

---

### Task 6：更新测试文件

**步骤 6.1 — `__tests__/columnRender.test.ts`：** 拆分第 2-14 行的合并 import 为两条：
```ts
import {
  getNestedValue,
  formatNumber,
  formatMoney,
  formatPercent,
  formatDate,
} from '@lania-pro-components/utils';
import {
  registerCellRenderer,
  unregisterCellRenderer,
  registerCellRenderers,
  getCellRenderer,
  hasCellRenderer,
  customRendererRegistry,
} from '../ProTable/utils/columnRender';
```

**步骤 6.2 — `__tests__/defineEnumMap.test.ts:2`：**
- `from '../ProTable/utils/defineEnumMap'` → `from '@lania-pro-components/utils'`

**步骤 6.3 — `__tests__/dialogUtils.test.ts:2`：** 拆分为两条：
```ts
import { getSizeWidth, getFooterJustify } from '../ProDialog/utils';
import { deepMerge } from '@lania-pro-components/utils';
```

**步骤 6.4 — `__tests__/uploadUtils.test.ts:2`：**
- `from '../ProUpload/utils'` → `from '@lania-pro-components/utils'`

---

### Task 7：安装、类型检查、测试、构建

**步骤 7.1 — 安装 workspace 依赖：**
```bash
pnpm install
```
（让 pnpm 链接 `@lania-pro-components/utils` workspace 包）

**步骤 7.2 — 类型检查：**
```bash
pnpm typecheck
```
（根 `tsc --noEmit`，验证所有 import 路径正确；`docs/examples/*` 的历史类型错误与本次无关，可忽略）

**步骤 7.3 — 运行测试：**
```bash
pnpm test
```
（vitest 通过 resolve.alias 映射到 utils 源码，无需先 build utils）

**步骤 7.4 — 全量构建：**
```bash
pnpm --filter @lania-pro-components/utils build
pnpm --filter @lania-pro-components/components build
```
（先构建 utils 产出 dist，再构建 components；验证 rollup external 正确，无类型泄漏）

**步骤 7.5 — 若构建/测试失败：** 检查残留的 `from '...utils/reactive'` 等旧路径引用，用 grep 兜底：
```
grep -rn "utils/reactive\|utils/performance\|ProUpload/utils\|ProTable/utils/defineEnumMap" packages/components
```

---

## 假设与决策

1. **theme 包不抽取** — 经探索确认其所有导出与 light/dark + Arco 语义强耦合，无可复用纯函数。
2. **copyToClipboard 拆分策略** — 纯逻辑（navigator.clipboard + execCommand 降级）进 `utils/dom.ts`（返回 `Promise<boolean>`）；Arco `Message` 反馈包装器留 `columnRender.tsx`。ProTable 公开 API 的 `copyToClipboard` 仍是 Arco 感知版（显示 toast），行为不变。
3. **ProTable barrel 转发策略** — `ProTable/utils/index.ts` 从 utils 包 re-export 迁移函数，使 `ProTable/index.tsx` 和 `CardView.tsx` 等内部消费者**零改动**，降低风险。
4. **ProForm/index.ts re-export 保持符号列表** — 只改 `from` 源，re-export 的符号子集（reactive 10 个 + performance 11 个）全部能从 utils 包导出，公开 API 不变。
5. **VIDEO_EXTENSIONS 随 isVideo 一起迁移** — 原 ProUpload/utils.ts 中 VIDEO_EXTENSIONS 是私有未导出常量，迁移后作为 fileType.ts 内部私有常量，对外只导出 isVideo。测试只导入 isVideo，无影响。
6. **copyToClipboard 同步→异步** — 原 `copyToClipboard(text: string): void` 改为 `async (text: string): Promise<void>`。所有现存调用点 fire-and-forget 不 await，行为兼容（toast 仍会显示）。
7. **不迁移的文件**（保持不动）：`readonlyRegistry.tsx`、`EditableCell.tsx`、各处内联 `isEmpty` 等重复但非主消费者的代码。
8. **docs/examples/* 历史类型错误** — 与本次迁移无关（找不到 `@lania-pro-components/components` 模块、隐式 any），typecheck 时忽略。

---

## 验证步骤

| 验证项 | 命令 | 预期 |
|---|---|---|
| workspace 链接 | `pnpm install` | 无错误，utils 包被识别 |
| 类型检查 | `pnpm typecheck` | 0 error（除已知 docs/examples 历史错误）|
| 单元测试 | `pnpm test` | 全部通过（8 个测试文件）|
| utils 构建 | `pnpm --filter @lania-pro-components/utils build` | 产出 `packages/utils/dist/index.{cjs,mjs,d.ts}` |
| components 构建 | `pnpm --filter @lania-pro-components/components build` | 产出各子包 dist，无类型泄漏到兄弟包 |
| 残留引用兜底 | grep `utils/reactive\|utils/performance\|ProUpload/utils\|ProTable/utils/defineEnumMap` | 仅在已删除文件的引用中无匹配（应全部清零）|

---

## 风险与回滚

- **风险**：barrel re-export 链路（utils 包 → ProTable/utils barrel → ProTable/index.tsx）若某一环符号遗漏，会导致 ProTable 公开 API 缺失。
  **缓解**：步骤 7.2 typecheck 会立即捕获；步骤 7.3 测试覆盖 defineEnumMap/columnRender。
- **回滚**：所有改动都在 components 包内（utils 包是新增不影响），git revert 即可恢复原始本地 import。
