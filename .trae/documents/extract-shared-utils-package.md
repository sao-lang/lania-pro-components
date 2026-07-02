# 提取公共 utils 包

## Context

`packages/components` 内的通用工具函数分散在各子组件的 `utils.ts` / `utils/` 目录中，且存在重复实现（`getNestedValue`、`formatDate`/`formatNumber` 各有两份不同行为/签名的版本，`isEmpty` 在 4+ 处内联）。目前没有任何跨包共享的工具包（`packages/utils` 目录为空）。

目标：把 `components` 包里**真正通用**的纯函数/模块抽到一个新的 `@lania-pro-components/utils` 工作区包里，统一来源；`components` 通过包名而非相对路径引用。`theme` 包经核查**没有任何通用函数可抽**（所有导出都与 light/dark + Arco 语义强耦合），因此本次只从 `components` 抽取。

### 已确认的决策（用户选择）
- **抽取范围**：Everything generic —— 含核心通用函数 + `reactive.ts` / `performance.ts` 整模块 + `defineEnumMap` + `isVideo`。
- **重复处理**：Migrate primary consumers only —— 只迁移主 utils 文件及其消费者；`ProForm/registry/readonlyRegistry.tsx` 里签名不同的 `formatDate`/`formatNumber`、`EditableCell.tsx` 私有的 `getNestedValue`/`setNestedValue`、各处内联的 `isEmpty` **保持不动**，避免行为/签名变更。

---

## 新包结构 `packages/utils/`

按主题分文件，统一从 `src/index.ts` 桶导出。消费者一律从包根 `@lania-pro-components/utils` 导入（不做子路径导出，保持构建配置简单）。

```
packages/utils/
├── package.json
├── README.md
└── src/
    ├── index.ts            # 桶：re-export 全部
    ├── reactive.ts         # ← 来自 ProForm/utils/reactive.ts（整文件搬移）
    ├── performance.ts      # ← 来自 ProForm/utils/performance.ts（整文件搬移）
    ├── defineEnumMap.ts    # ← 来自 ProTable/utils/defineEnumMap.ts（整文件搬移）
    ├── object.ts           # ← deepMerge(ProDialog/utils) + getNestedValue(columnRender)
    ├── format.ts           # ← formatNumber/Money/Percent/Date(columnRender)，依赖 dayjs
    ├── dom.ts              # ← 纯 copyToClipboard（从 columnRender 剥离 Arco Message）
    └── fileType.ts         # ← isVideo + VIDEO_EXTENSIONS(ProUpload/utils)
```

### `package.json`（以 theme 包为模板）
- `name`: `@lania-pro-components/utils`，`version`: `1.0.0`，`type`: `module`
- `main`/`module`/`types`/`exports` 指向 `./dist/index.{cjs,mjs,d.ts}`（同 theme，无 css 子路径）
- `scripts`: `build`/`dev`/`typecheck`（同 theme：`rollup -c ../../rollup.config.js`）
- `dependencies`: `{ "dayjs": "<根目录现有版本>" }` —— `formatDate` 依赖 dayjs，构建时 external 化，由消费者提供
- 无 `peerDependencies`（纯 TS 工具，不依赖 React）；`devDependencies`: `@types/node`、`@types/react`(可选)、`typescript`

### 迁移时的小幅清理
- `performance.ts`：`NodeJS.Timeout` → `ReturnType<typeof setTimeout>`（2 处，去掉公共类型对 Node 类型的泄漏）
- `reactive.ts`：内部私有 `isObject` 改为 `export`（已随模块搬移，无需新建 `is.ts`）
- `format.ts`：`formatDate` 的 `format` 参数由 `DateFormatType` 改为 `string`（脱离 ProTable 类型依赖；dayjs 接受任意字符串，ProTable 的 `DateFormatType` 仍可作子集传入，向后兼容）

### `copyToClipboard` 拆分（唯一的行为保持型重构）
- `utils/dom.ts` 导出**纯** `copyToClipboard(text: string): Promise<boolean>`（成功返回 true，空文本返回 false，含 execCommand 降级，**不**调 Arco Message）
- `columnRender.tsx` 保留**同名 Arco 感知包装器** `copyToClipboard`：调用纯版本，按布尔结果 `Message.success('复制成功')`/`Message.error('复制失败')`。内部 `wrapWithCopy`/`renderDateTimeRange` 继续调包装器
- 这样 ProTable 公开导出的 `copyToClipboard` 行为与签名**完全不变**

---

## 源文件改动清单

### 新建（见上方结构）
10 个文件。

### 删除（整文件搬走后）
- `packages/components/ProForm/utils/reactive.ts`
- `packages/components/ProForm/utils/performance.ts`
- `packages/components/ProTable/utils/defineEnumMap.ts`
- `packages/components/ProUpload/utils.ts`
- `ProForm/utils/` 目录搬空后删除

### 修改 —— ProForm
- [core/FormStore.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProForm/core/FormStore.ts) — `from '../utils/reactive'` → `from '@lania-pro-components/utils'`
- [core/FieldNode.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProForm/core/FieldNode.ts) — 同上
- [ProForm.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProForm/ProForm.tsx) — `./utils/performance` 与 `./utils/reactive` → utils 包
- [components/FormPerformanceMonitor.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProForm/components/FormPerformanceMonitor.tsx) — `../utils/performance` → utils
- [index.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProForm/index.ts) — 第 75-86、109-121 行两块 `export { ... } from './utils/reactive|performance'` → `from '@lania-pro-components/utils'`（公开 API 名字不变）

### 修改 —— ProTable
- [utils/columnRender.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProTable/utils/columnRender.tsx) — 删除 `formatNumber`/`formatMoney`/`formatPercent`/`formatDate`/`getNestedValue` 定义与 `dayjs` import 与 `copyToClipboard` 纯逻辑；改为 `import { formatNumber, formatMoney, formatPercent, formatDate, getNestedValue, copyToClipboard as copyToClipboardPure } from '@lania-pro-components/utils'`；保留 Arco 感知 `copyToClipboard` 包装器与全部渲染器/注册表函数
- [utils/index.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProTable/utils/index.ts)（桶）— `defineEnumMap` + `EnumItem`/`EnumHelper` 改 `from '@lania-pro-components/utils'`；`formatNumber`/`formatMoney`/`formatPercent`/`formatDate`/`getNestedValue` 改 `from '@lania-pro-components/utils'`；`copyToClipboard` 仍 `from './columnRender'`；`cellMerge` 与 `renderColumnByValueType` 等不变
- [index.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProTable/index.tsx) — 预期仍从 `./utils` 桶导入，**无需改动**（实现时确认；若直接从 `./utils/columnRender` 导入 format 函数则改为 utils 包）

### 修改 —— ProDialog
- [utils.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProDialog/utils.ts) — 删除 `deepMerge`，保留 `getSizeWidth`/`getFooterJustify`
- [dialogHolder.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProDialog/dialogHolder.tsx) — `deepMerge` 从 `./utils` → utils 包
- [useProDialog.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProDialog/useProDialog.tsx) — 同上
- [index.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProDialog/index.tsx) — 若公开 re-export `deepMerge`，改为 `from '@lania-pro-components/utils'`（实现时确认）

### 修改 —— ProUpload
- [index.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/ProUpload/index.tsx) — `isVideo` 从 `./utils` → utils 包

### 修改 —— 测试（`packages/components/__tests__/`）
- [columnRender.test.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/__tests__/columnRender.test.ts) — `getNestedValue`/`formatNumber`/`formatMoney`/`formatPercent`/`formatDate` 改 `from '@lania-pro-components/utils'`；注册表函数仍 `from '../ProTable/utils/columnRender'`
- [defineEnumMap.test.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/__tests__/defineEnumMap.test.ts) — `defineEnumMap` 改 `from '@lania-pro-components/utils'`
- [uploadUtils.test.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/__tests__/uploadUtils.test.ts) — `isVideo` 改 `from '@lania-pro-components/utils'`
- [dialogUtils.test.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/__tests__/dialogUtils.test.ts) — `deepMerge` 改 `from '@lania-pro-components/utils'`；`getSizeWidth`/`getFooterJustify` 仍 `from '../ProDialog/utils'`

---

## 配置改动

### [rollup.config.js](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/rollup.config.js)
1. `baseConfig.external` 追加 `'@lania-pro-components/utils'`、`'@lania-pro-components/theme'`（顺带修掉 dts 插件把兄弟包源码打进彼此 dist 的类型泄漏 bug）与 `'dayjs'`
2. 新增 `utilsConfig` 块（仿 `themeConfig`，无 css copy）：input `packages/utils/src/index.ts`，输出 `dist/index.{cjs,mjs,d.ts}`
3. `defineConfig([...])` 末尾追加 `...utilsConfig`

### [tsconfig.json](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/tsconfig.json)
- `paths` 加 `"@lania-pro-components/utils": ["packages/utils/src"]` 与 `"@lania-pro-components/utils/*": ["packages/utils/src/*"]`（让 `tsc --noEmit` 直接解析源码，无需先 build）
- `include` 加 `"packages/utils/**/*"`

### [vitest.config.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/vitest.config.ts)
- 加 `resolve.alias`：`'@lania-pro-components/utils'` → `path.resolve(__dirname, 'packages/utils/src/index.ts')`（测试跑源码，无需先 build）

### [packages/components/package.json](file:///e:/vsc-workspace/lania-zip/lania-pro-components-1/packages/components/package.json)
- 新增 `"dependencies": { "@lania-pro-components/utils": "workspace:*" }`（该包首个 dependencies 字段）

### 安装
- 改完跑 `pnpm install` 建立工作区软链

---

## 公开 API 保持不变（验证要点）
- `@lania-pro-components/components/ProForm` 仍导出 `reactive`/`effect`/`computed`/`watch`/`batchUpdate`/`ref`/`toReactive`/`isReactive`/`trigger`/`ComputedRef` 与 `TaskQueue`/`globalTaskQueue`/`BatchUpdateManager`/`debounce`/`throttle`/`memoize`/`LRUCache`/`PerformanceMonitor`/`performanceMonitor`/`scheduleIdleTask`/`scheduleChunkedTask`
- `@lania-pro-components/components/ProTable` 仍导出 `formatNumber`/`formatMoney`/`formatPercent`/`formatDate`/`getNestedValue`/`copyToClipboard`/`defineEnumMap`/`EnumItem`/`EnumHelper`
- `copyToClipboard`（Arco 感知版）行为不变

## 不在本次范围（保持不动）
- `ProForm/registry/readonlyRegistry.tsx` 的 `formatDate`/`formatNumber`/`formatEmpty`（签名不同，迁移有行为风险）
- `ProTable/editable/EditableCell.tsx` 私有 `getNestedValue`/`setNestedValue`
- `FormStore`/`FieldNode`/`ValidationEngine` 内联 `isEmpty` 各处
- `getSizeWidth`/`getFooterJustify`/cellMerge 系列/`columnRender` 渲染器与注册表 —— ProTable 专属，留原处
- `theme` 包（无通用函数）

---

## 验证步骤
1. `pnpm install`（建软链，无报错）
2. `pnpm --filter @lania-pro-components/utils build` → 产出 `packages/utils/dist/index.{cjs,mjs,d.ts}`
3. `pnpm --filter @lania-pro-components/components typecheck`（`tsc --noEmit`）→ 0 error（忽略 `docs/examples/*` 历史类型错误）
4. `pnpm test` → 现有 8 个测试文件全绿（重点：`columnRender`/`defineEnumMap`/`dialogUtils`/`uploadUtils` 四个迁移过的）
5. `pnpm --filter @lania-pro-components/components build` → 全量 rollup 构建成功，且 `packages/components/dist/` 下不再混入 `packages/utils/src/...` 或 `packages/theme/src/...` 的类型泄漏产物
6. （可选）docs dev server 若对 components 用源码 alias，需在 docs vite 配置补 utils alias；若 docs 用构建产物则无需改动 —— 实现时验证

## 风险与注意
- **构建顺序**：components 的 rollup build 把 utils 作 external，要求 utils 已 build（dist 存在）才能正确解析类型；typecheck 与 test 走源码 alias，不依赖 dist
- **dayjs 版本**：实现时读根 `package.json` / lockfile 确认 dayjs 版本写入 utils `dependencies`
- **`process.env.NODE_ENV`**：`performance.ts` 仍含该表达式，沿用现有 rollup 管线（消费者 bundler 替换），行为不变
