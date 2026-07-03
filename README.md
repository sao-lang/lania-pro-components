# Pro-Components

基于 [Arco Design](https://arco.design/) 的 Schema 驱动企业级 React 组件库，致力于通过声明式配置降低中后台页面开发复杂度，提供表单、表格、弹窗、选择器、上传等高频业务组件的开箱即用方案。

## 包结构

本项目采用 **pnpm workspace monorepo** 架构，包含以下三个独立的 npm 包：

| 包名                               | 说明                                                 | 位置                                        |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| `@lania-pro-components/components` | 组件库主包，包含所有业务组件                         | [packages/components/](packages/components) |
| `@lania-pro-components/utils`      | 公共工具函数包，响应式系统、格式化、性能优化等纯函数 | [packages/utils/](packages/utils)           |
| `@lania-pro-components/theme`      | 主题包，提供 light / dark 两种主题及 ThemeProvider   | [packages/theme/](packages/theme)           |

## 核心理念

### 配置化优先

所有功能通过 Schema 配置对象开启，减少命令式编码，降低心智负担。开发者只需描述"是什么"，而非"怎么做"。

- **ProForm**: 通过 `schemas` 数组描述表单字段布局与行为
- **ProTable**: 通过 `columns` 数组描述表格列定义与渲染方式
- **ProDialog**: 通过 `schemas` 或 `columns` 描述弹窗内容类型

### 分层架构

采用 **核心层 → 功能层 → 插件层** 的分层设计，各层职责清晰，支持按需加载和 Tree Shaking。

```
用户代码
    │
    ▼
  组件层（ProForm / ProTable / ProDialog ...）
    │
    ▼
  功能层（查询表单、工具栏、分页、可编辑...）
    │
    ▼
  核心层（FormStore / DataStore / ValidationEngine / reactive）
```

### 类型安全

完整的 TypeScript 类型支持，提供 IDE 智能提示和编译时类型检查。泛型支持贯穿整个组件库，从表单值类型到表格行数据类型均有完善的类型推导。

### 响应式状态管理

内置基于 **Proxy** 的响应式状态管理系统（参考 Vue 响应式原理），字段值变化自动触发联动、校验和 UI 更新，无需手动 setState。

## 组件概览

### ProForm — Schema 驱动表单

[packages/components/ProForm/](packages/components/ProForm)

高性能、高可扩展的声明式表单组件，适用于中后台各类表单场景。

**核心能力：**

- **Schema 驱动**：通过 `schemas` 配置数组描述所有字段，支持嵌套字段、动态增减
- **响应式状态管理**：基于 Proxy 的 FormStore + FieldNode，字段值变化自动触发联动
- **字段联动**：支持 `dependencies` 依赖声明 + `reaction` 响应式回调，实现复杂联动逻辑
- **字段生命周期**：`onInit` / `onValueChange` / `onFocus` / `onBlur` / `onReset` 等完整钩子
- **多种表单状态**：`edit` / `readonly` / `preview` / `disabled` / `draft` 五种模式切换
- **验证引擎**：内置 ValidationEngine，支持同步/异步自定义校验、规则联动
- **性能优化**：虚拟滚动、懒加载（分组/优先级）、批量更新、性能监控面板
- **布局模式**：`horizontal` / `vertical` / `inline` / `compact` 四种布局
- **扩展机制**：组件注册表（componentRegistry）、只读渲染器注册表（readonlyRegistry）
- **高级组件**：ProFormList（动态列表）、ProFormSteps（分步表单）、QuickComponents（快捷组件）

**导出 API：**

- `ProForm` — 表单组件
- `ProFormProvider` — 上下文 Provider
- `FormField` — 单字段组件
- `useProForm` — Hook 形式使用，返回 `Provider` + `formInstance` + 上下文
- `useProFormContext` — 在子组件中访问表单上下文

---

### ProTable — Schema 驱动表格

[packages/components/ProTable/](packages/components/ProTable)

企业级数据表格组件，覆盖查询、列表、分页、编辑等完整 CRUD 场景。

**核心能力：**

- **Schema 驱动列定义**：通过 `columns` 配置表格列，支持 20+ 种 valueType
- **值类型（valueType）**：text / number / money / percent / date / dateTime / dateRange / select / tag / avatar / image / link / progress / code / enum / index / opr 等
- **请求引擎**：内置 RequestEngine，自动管理 loading、分页参数、搜索条件
- **查询表单**：自动根据 columns 生成搜索表单，支持自定义搜索 Schema
- **工具栏**：刷新、密度调整、列设置、全屏、导出等内置工具
- **分页**：自动分页逻辑，支持服务端分页/前端分页
- **行选择**：单选、多选、跨页选择、全选
- **可编辑表格**：行编辑、单元格编辑，支持校验和保存
- **卡片视图**：Table / Card 视图切换
- **拖拽排序**：支持行拖拽排序
- **URL 同步**：搜索条件、分页状态自动同步到 URL query
- **缓存**：列表数据缓存、搜索条件缓存
- **虚拟滚动**：大数据量性能优化
- **单元格合并**：支持复杂的行列合并逻辑
- **枚举映射**：`defineEnumMap` 工具，统一管理枚举值与标签

**导出 API：**

- `ProTable` — 表格组件
- `useProTable` — Hook 形式使用，返回 `Provider` + `action` + 上下文
- `useProTableContext` — 在子组件中访问表格上下文
- `defineEnumMap` — 枚举映射工具函数

---

### ProDialog — 高级弹窗

[packages/components/ProDialog/](packages/components/ProDialog)

统一封装的弹窗组件，支持表单弹窗、表格弹窗、抽屉模式等多种业务场景。

**核心能力：**

- **多种模式**：`modal`（模态框）/ `drawer`（抽屉）两种展示模式
- **多种尺寸**：`small` (400px) / `medium` (600px) / `large` (800px) / `xlarge` (1000px) / `fullscreen`
- **抽屉位置**：`top` / `right` / `bottom` / `left` 四个方向
- **表单弹窗**：传入 `schemas` 自动渲染 ProForm 表单，内置提交逻辑
- **表格弹窗**：传入 `columns` + `request` 自动渲染 ProTable 选择弹窗
- **实例化管理**：通过 `useRef` 获取实例，调用 `open()` / `close()` / `setTitle()` 等方法
- **全局注册表**：`instanceRegistry`，支持通过 ID 远程控制任意弹窗
- **静态方法**：`ProDialog.form()` / `confirm()` / `message()` / `notification()` 快捷调用
- **二次确认**：内置 Popconfirm 风格的确认弹窗
- **事件系统**：支持事件监听（open / close / submit / cancel 等）
- **底部按钮**：支持自定义按钮配置、按钮位置（左/中/右）

**导出 API：**

- `ProDialog` — 弹窗组件
- `useProDialog` — Hook 形式使用
- `getProDialogInstance` — 通过 ID 获取弹窗实例
- `dialogInstanceRegistry` — 弹窗实例注册表

---

### ActionButton — 操作按钮集

[packages/components/ActionButton/](packages/components/ActionButton)

封装中后台常见操作按钮，内置弹窗、确认、加载等交互逻辑，减少重复代码。

**按钮类型：**

| 按钮           | 说明                                 | 核心回调               |
| -------------- | ------------------------------------ | ---------------------- |
| `AddButton`    | 新增按钮，点击打开表单弹窗           | `onSubmit(values)`     |
| `EditButton`   | 编辑按钮，点击打开带初始值的表单弹窗 | `onSubmit(values)`     |
| `DeleteButton` | 删除按钮，点击弹出二次确认           | `onDelete()`           |
| `ViewButton`   | 查看按钮，点击打开详情弹窗           | `renderContent()`      |
| `BatchButton`  | 批量操作按钮，支持选中数量校验       | `onAction(rows, keys)` |
| `ExportButton` | 导出按钮，支持 URL 导出或自定义逻辑  | `onExport()`           |
| `ImportButton` | 导入按钮，点击打开上传弹窗           | `onSuccess(result)`    |
| `JumpButton`   | 跳转按钮，支持新窗口/当前窗口        | `to`                   |

**设计原则：**

- `onClick` 是**附加**语义（用于埋点日志），不覆盖内置行为
- 业务逻辑必须使用语义化回调（`onSubmit` / `onDelete` / `onAction` / `onExport` 等）
- 所有按钮均支持 `loading` 状态自动管理
- 支持 `visible` 条件显示

---

### ProSelect — 增强选择器

[packages/components/ProSelect/](packages/components/ProSelect)

功能增强的 Select 组件，适配中后台远程搜索、分页加载、大数据量等场景。

**核心能力：**

- **远程搜索**：`request` 函数 + 关键词防抖，支持服务端搜索
- **分页加载**：滚动到底部自动加载下一页，`hasMore` 判断是否还有更多
- **虚拟滚动**：大数据量下的性能优化，`virtual` + `virtualHeight` 配置
- **标签模式**：选中项以 Tag 形式展示，支持自定义 Tag 渲染
- **全选功能**：多选模式下的全选 / 取消全选
- **创建条目**：`allowCreate` 允许用户创建新选项，支持校验和格式化
- **字段映射**：`fieldNames` 自定义 label / value / disabled / group 字段名
- **分组展示**：按 `group` 字段对选项分组
- **选项图标**：`optionIconRender` 自定义选项前缀图标
- **空状态/加载态**：自定义 emptyRender、showLoading 配置

**导出 API：**

- `ProSelect` — 选择器组件
- `ProSelectInstance` — 组件实例类型（refresh / loadMore / selectAll 等）

---

### ProUpload — 增强上传

[packages/components/ProUpload/](packages/components/ProUpload)

功能完善的上传组件，支持图片/视频/文件上传、裁剪压缩、预览、拖拽等。

**核心能力：**

- **三种上传类型**：`image`（图片）/ `video`（视频）/ `file`（文件）
- **图片裁剪**：支持固定比例、自由裁剪、圆形裁剪，最小/最大尺寸限制
- **图片压缩**：上传前自动压缩，可配置最大宽高、质量、输出格式
- **视频校验**：支持最大/最小时长限制
- **多种预览方式**：`modal` / `drawer` / `inline` 三种预览模式
- **拖拽上传**：`draggable` 开启拖拽区域
- **列表样式**：`text` / `picture-list` / `picture-card` 三种列表类型
- **文件排序**：`sortable` 开启拖拽排序
- **错误重试**：`retryCount` + `retryInterval` 失败自动重试
- **总进度显示**：多文件上传时显示总进度条
- **文件计数**：显示 `当前/最大` 文件数量
- **自定义上传**：`customUpload` 完全自定义上传逻辑

**导出 API：**

- `ProUpload` — 上传组件
- `ProUploadInstance` — 组件实例类型（upload / clear / retry / getStats 等）

## 组件间关系

```
ProTable ── 内嵌 ──→ ProForm（查询表单）
    │                      │
    ├── 集成 ──→ ProDialog（表格弹窗）
    │                      │
    └── 使用 ──→ ActionButton（操作列 / 工具栏）

ProDialog ── 内嵌 ──→ ProForm（表单弹窗）
    │
    └── 内嵌 ──→ ProTable（表格选择弹窗）

ActionButton ── 调用 ──→ ProDialog（增/删/改/查弹窗）
```

## Utils 工具包

`@lania-pro-components/utils` — 跨组件复用的纯函数工具库，无 Arco / React 耦合，可独立使用。

[packages/utils/src/](packages/utils/src)

| 模块               | 说明          | 主要导出                                                                       |
| ------------------ | ------------- | ------------------------------------------------------------------------------ |
| `reactive.ts`      | 响应式系统    | `reactive` / `ref` / `computed` / `effect` / `watch` / `batch`                 |
| `performance.ts`   | 性能优化工具  | `debounce` / `throttle` / `TaskQueue` / `LRUCache` / `PerformanceMonitor`      |
| `defineEnumMap.ts` | 枚举映射      | `defineEnumMap` — 统一管理枚举值，提供 getOptionList / findLabelByValue 等方法 |
| `object.ts`        | 对象/路径操作 | `deepMerge` / `getNestedValue` / `setNestedValue` / `deleteNestedValue`        |
| `format.ts`        | 格式化工具    | `formatNumber` / `formatMoney` / `formatPercent` / `formatDate`                |
| `dom.ts`           | DOM 工具      | `copyToClipboard` — 纯版本，返回 `Promise<boolean>`                            |
| `fileType.ts`      | 文件类型判断  | `isVideo` / `isImage` / `getFileType`                                          |

## Theme 主题包

`@lania-pro-components/theme` — 主题系统，提供亮/暗两种主题及 React Provider。

[packages/theme/src/](packages/theme/src)

**导出：**

- `ThemeProvider` — 主题 Provider 组件，包裹应用后提供主题上下文
- `useTheme` — Hook，获取当前主题类型和切换方法
- `lightTheme` / `darkTheme` — 主题变量对象
- `ThemeType` — 主题类型（`'light' | 'dark'`）

**CSS 文件：**

- `@lania-pro-components/theme/light.css` — 亮色主题变量
- `@lania-pro-components/theme/dark.css` — 暗色主题变量

## 技术栈

| 类别     | 技术                         | 版本                 |
| -------- | ---------------------------- | -------------------- |
| UI 框架  | Arco Design Web React        | ^2.66.0              |
| 语言     | TypeScript                   | ^6.0.0               |
| React    | React / ReactDOM             | ^18.0.0 \|\| ^19.0.0 |
| 状态管理 | 自研响应式系统（基于 Proxy） | —                    |
| 日期处理 | dayjs                        | ^1.11.0              |
| 构建工具 | Rollup                       | ^4.0.0               |
| 包管理   | pnpm                         | 10.26.1              |
| 测试框架 | Vitest + jsdom               | ^4.0.0               |
| 测试库   | Testing Library React        | ^16.0.0              |
| 文档站   | VitePress                    | ^1.6.0               |
| 代码规范 | ESLint + Prettier            | —                    |

## 设计模式

### Schema 驱动

所有组件通过 Schema（配置对象）定义行为，而非命令式 API 调用。Schema 是可序列化的数据结构，便于存储、传输和动态生成。

### 响应式状态管理

ProForm 和 ProTable 都内置了基于 Proxy 的响应式状态管理系统：

- **ProForm**：`FormStore`（表单全局状态） + `FieldNode`（单字段状态），字段值变化自动触发联动和校验
- **ProTable**：`DataStore`（数据状态管理），数据变化自动更新 UI 和触发请求

### Context 分层

每个组件内部使用多层级 Context 进行数据传递，避免 prop drilling，同时保证类型安全：

- **ProForm**：RootContext → LayoutContext → SchemaContext → FieldContext → FormConfigContext → ExtensionContext
- **ProTable**：RootContext → DataContext → ColumnContext → TableConfigContext

### Hook + Provider 模式

每个核心组件都提供对应的 Hook 版本，返回包含 `Provider` 组件的对象，使跨层级组件可以通过 Context 访问状态：

```tsx
const { Provider, formInstance } = useProForm(schemas, options);

return (
  <Provider>
    <MyCustomContent />
  </Provider>
);

// 在子组件中
const { values, setFieldValue } = useProFormContext();
```

### 注册表模式

通过注册表（Registry）实现组件的可扩展：

- `componentRegistry` — 注册自定义表单组件
- `readonlyRegistry` — 注册自定义只读渲染器
- `instanceRegistry` — 注册组件实例，支持全局访问

## 项目结构

```
lania-pro-components/
├── packages/                         # monorepo 包目录
│   ├── components/                   # 组件库主包
│   │   ├── ProForm/                  # Schema 驱动表单
│   │   │   ├── core/                 # 核心引擎
│   │   │   │   ├── FormStore.ts      # 表单状态管理
│   │   │   │   ├── FieldNode.ts      # 字段节点
│   │   │   │   ├── ValidationEngine.ts # 校验引擎
│   │   │   │   ├── baseComponents.tsx  # 基础组件映射
│   │   │   │   └── customRenderers.tsx # 自定义渲染器
│   │   │   ├── context/              # 上下文（6 层）
│   │   │   ├── hooks/                # Hooks
│   │   │   │   ├── useProForm.tsx
│   │   │   │   ├── useArcoForm.ts
│   │   │   │   ├── useVirtualScroll.ts
│   │   │   │   ├── useLazyField.ts
│   │   │   │   └── useFieldNavigation.ts
│   │   │   ├── registry/             # 注册表
│   │   │   ├── components/           # 子组件
│   │   │   │   ├── ProFormList.tsx   # 动态列表
│   │   │   │   ├── ProFormSteps.tsx  # 分步表单
│   │   │   │   ├── QuickComponents.tsx
│   │   │   │   └── FormPerformanceMonitor.tsx
│   │   │   ├── ProForm.tsx           # 主组件
│   │   │   ├── ProFormProvider.tsx   # Provider
│   │   │   ├── FormField.tsx         # 单字段组件
│   │   │   ├── useProForm.tsx        # Hook
│   │   │   ├── types.ts              # 类型定义
│   │   │   └── index.ts              # 导出
│   │   │
│   │   ├── ProTable/                 # Schema 驱动表格
│   │   │   ├── store/                # DataStore 数据状态
│   │   │   ├── request/              # 请求引擎
│   │   │   ├── context/              # 上下文（4 层）
│   │   │   ├── features/             # 功能模块
│   │   │   │   ├── QueryForm.tsx     # 查询表单
│   │   │   │   ├── TableRenderer.tsx # 表格渲染
│   │   │   │   ├── Toolbar.tsx       # 工具栏
│   │   │   │   ├── Pagination.tsx    # 分页
│   │   │   │   ├── BatchOperation.tsx # 批量操作
│   │   │   │   ├── ActionButtonRenderer.tsx
│   │   │   │   └── TableDialog.tsx   # 表格弹窗
│   │   │   ├── hooks/                # Hooks
│   │   │   │   ├── useProTable.tsx
│   │   │   │   ├── useRequest.ts
│   │   │   │   ├── useUrlSync.ts
│   │   │   │   ├── useCache.ts
│   │   │   │   ├── useDragSort.ts
│   │   │   │   ├── useResponsive.ts
│   │   │   │   ├── useSearchSchema.ts
│   │   │   │   └── useVirtualScroll.ts
│   │   │   ├── editable/             # 可编辑表格
│   │   │   ├── components/           # 子组件
│   │   │   │   ├── CardView.tsx      # 卡片视图
│   │   │   │   ├── SkeletonTable.tsx # 骨架屏
│   │   │   │   ├── DragSortTable.tsx
│   │   │   │   └── SearchSchemaSelector.tsx
│   │   │   ├── utils/                # 工具函数
│   │   │   │   ├── columnRender.tsx  # 列渲染
│   │   │   │   └── cellMerge.ts      # 单元格合并
│   │   │   └── index.tsx
│   │   │
│   │   ├── ProDialog/                # 高级弹窗
│   │   │   ├── dialogHolder.tsx      # 弹窗容器
│   │   │   ├── feedback.tsx          # 静态反馈方法
│   │   │   ├── instanceRegistry.ts   # 实例注册表
│   │   │   ├── useProDialog.tsx      # Hook
│   │   │   ├── utils.ts              # 工具函数
│   │   │   ├── types.ts              # 类型定义
│   │   │   └── index.tsx
│   │   │
│   │   ├── ActionButton/             # 操作按钮集
│   │   │   ├── AddButton.tsx
│   │   │   ├── EditButton.tsx
│   │   │   ├── DeleteButton.tsx
│   │   │   ├── ViewButton.tsx
│   │   │   ├── BatchButton.tsx
│   │   │   ├── ExportButton.tsx
│   │   │   ├── ImportButton.tsx
│   │   │   ├── JumpButton.tsx
│   │   │   ├── types.ts
│   │   │   └── index.tsx
│   │   │
│   │   ├── ProSelect/                # 增强选择器
│   │   ├── ProUpload/                # 增强上传
│   │   ├── __tests__/                # 统一测试目录
│   │   └── index.ts                  # 包入口
│   │
│   ├── utils/                        # 公共工具函数包
│   │   └── src/
│   │       ├── reactive.ts           # 响应式系统
│   │       ├── performance.ts        # 性能优化
│   │       ├── defineEnumMap.ts      # 枚举映射
│   │       ├── object.ts             # 对象操作
│   │       ├── format.ts             # 格式化
│   │       ├── dom.ts                # DOM 工具
│   │       ├── fileType.ts           # 文件类型
│   │       └── index.ts
│   │
│   └── theme/                        # 主题包
│       └── src/
│           ├── ThemeProvider.tsx
│           ├── themes.ts
│           ├── light.css
│           ├── dark.css
│           ├── types.ts
│           └── index.ts
│
├── docs/                             # VitePress 文档站
│   ├── .vitepress/                   # VitePress 配置
│   ├── components/                   # 组件文档
│   ├── examples/                     # 示例代码
│   └── index.md                      # 首页
│
├── rollup.config.js                  # 统一 Rollup 构建配置
├── vitest.config.ts                  # Vitest 测试配置
├── vitest.setup.ts                   # 测试 setup（jsdom polyfills）
├── tsconfig.json                     # TypeScript 配置
├── pnpm-workspace.yaml               # pnpm workspace 配置
└── package.json                      # 根 package.json
```

## 快速上手

### 安装

```bash
# 安装组件库
pnpm add @lania-pro-components/components

# 安装 peer dependencies
pnpm add @arco-design/web-react react react-dom dayjs
```

### 基础表单

```tsx
import { ProForm } from '@lania-pro-components/components';

const MyForm = () => (
  <ProForm
    schemas={[
      { name: 'username', label: '用户名', component: 'Input', required: true },
      { name: 'email', label: '邮箱', component: 'Input', required: true },
      {
        name: 'role',
        label: '角色',
        component: 'Select',
        options: [
          { label: '管理员', value: 'admin' },
          { label: '用户', value: 'user' },
        ],
      },
    ]}
    onFinish={async (values) => {
      console.log(values);
    }}
  />
);
```

### 基础表格

```tsx
import { ProTable } from '@lania-pro-components/components';

const MyTable = () => (
  <ProTable
    columns={[
      { title: 'ID', dataIndex: 'id', valueType: 'index' },
      { title: '用户名', dataIndex: 'username', valueType: 'text' },
      {
        title: '状态',
        dataIndex: 'status',
        valueType: 'enum',
        valueEnum: {
          active: { text: '启用', status: 'success' },
          disabled: { text: '禁用', status: 'error' },
        },
      },
      { title: '创建时间', dataIndex: 'createdAt', valueType: 'date' },
      { title: '金额', dataIndex: 'amount', valueType: 'money' },
    ]}
    request={async (params) => {
      const res = await fetchUsers(params);
      return { data: res.list, total: res.total };
    }}
    search={{ showReset: true }}
    toolbar={{ showRefresh: true, showDensity: true }}
  />
);
```

### 弹窗表单

```tsx
import { useRef } from 'react';
import { ProDialog, type ProDialogInstance } from '@lania-pro-components/components';

const dialogRef = useRef<ProDialogInstance>(null);

<ProDialog
  ref={dialogRef}
  title='新增用户'
  schemas={[
    { name: 'username', label: '用户名', component: 'Input', required: true },
    { name: 'email', label: '邮箱', component: 'Input', required: true },
  ]}
  onSubmit={async (values) => {
    await createUser(values);
    return true; // 返回 true 自动关闭弹窗
  }}
/>;

// 打开弹窗
dialogRef.current?.open({ title: '新增用户' });
```

### 操作按钮

```tsx
import { AddButton, EditButton, DeleteButton } from '@lania-pro-components/components';

// 新增按钮
<AddButton
  type="primary"
  text="新增用户"
  schemas={userSchemas}
  onSubmit={async (values) => {
    await createUser(values);
    return true;
  }}
/>

// 编辑按钮
<EditButton
  text="编辑"
  schemas={userSchemas}
  getInitialValues={() => currentUser}
  onSubmit={async (values) => {
    await updateUser(values);
    return true;
  }}
/>

// 删除按钮
<DeleteButton
  text="删除"
  status="danger"
  confirmTitle="确认删除"
  confirmContent="确定要删除该用户吗？"
  onDelete={async () => {
    await deleteUser(id);
    return true;
  }}
/>
```

## 开发指南

### 安装依赖

```bash
pnpm install
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建指定包
pnpm --filter @lania-pro-components/utils build
```

### 开发模式

```bash
# 组件库 watch 模式
pnpm dev
```

### 类型检查

```bash
pnpm typecheck
```

### 代码检查与格式化

```bash
# ESLint 检查
pnpm lint

# ESLint 自动修复
pnpm lint:fix

# Prettier 格式化
pnpm format
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# watch 模式
pnpm test:watch

# UI 模式
pnpm test:ui

# 覆盖率报告
pnpm test:coverage
```

### 文档站

```bash
# 启动文档开发服务器
pnpm docs:dev

# 构建文档
pnpm docs:build

# 预览构建结果
pnpm docs:preview
```

## Graphify — 知识图谱

本项目的代码库已通过 [graphify](https://github.com/safishamsi/graphify) 构建为可查询的知识图谱，支持快速理解架构、查找组件关系和定位代码。

### 前置条件

- **Python 3.10+** — graphify 是 Python 工具（PyPI 包名 `graphifyy`）
- **pnpm** — 已配置好一键脚本

### 一键安装并构建（新设备）

在新设备上克隆项目后，运行以下命令**一键安装 graphify 并构建知识图谱**：

```bash
pnpm graphify
```

该命令会自动：

1. 通过 `pip install graphifyy` 安装 graphify
2. 执行 AST 提取，生成 `graphify-out/graph.json`、`graph.html`、`GRAPH_REPORT.md`

### 更新图谱

代码变更后，运行以下命令快速更新（无需 API Key，只重新提取变动的文件）：

```bash
pnpm graphify:update
```

### 输出文件

| 文件                           | 说明                                          |
| ------------------------------ | --------------------------------------------- |
| `graphify-out/graph.html`      | 交互式可视化图表，浏览器打开即可浏览          |
| `graphify-out/GRAPH_REPORT.md` | 架构审计报告（God Nodes、社区结构、异常连接） |
| `graphify-out/graph.json`      | 完整图谱数据，支持 query/path/explain 查询    |

### 在 VS Code Copilot Chat 中查询

安装完成后，在 Copilot Chat 中直接用自然语言查询：

- `/graphify query "ProForm 和 ProTable 的关系"`
- `/graphify path "DataStore" "ProTable"`
- `/graphify explain "ActionButton"`

> **注意**：代码提取完全本地进行（tree-sitter AST），无需联网。文档/图片/PDF 的语义提取需要设置 LLM API Key（如 `ANTHROPIC_API_KEY`、`GEMINI_API_KEY`）。

## 许可证

ISC
