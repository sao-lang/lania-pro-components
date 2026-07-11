# ProTable

Schema 驱动的企业级表格组件，基于 DataStore + TableRenderer + QueryForm 三层 Context 架构实现数据展示、查询、排序、筛选、编辑等全功能。

## 快速开始

```tsx
import { ProTable, useProTable } from '@lania-pro-components/components';

// 方式 A：独立使用（简单场景）
<ProTable
  columns={[
    { title: '姓名', dataIndex: 'name', valueType: 'text' },
    { title: '年龄', dataIndex: 'age', valueType: 'number' },
    { title: '状态', dataIndex: 'status', valueType: 'enum', valueEnum: { 1: { text: '启用' }, 0: { text: '禁用' } } },
    { title: '创建时间', dataIndex: 'createTime', valueType: 'dateTime' },
  ]}
  request={async (params) => {
    const res = await fetchList(params);
    return { data: res.list, total: res.total };
  }}
/>;

// 方式 B：配合 useProTable（推荐，避免重复实例）
const table = useProTable({
  columns: [
    { title: '姓名', dataIndex: 'name', valueType: 'text' },
    { title: '操作', valueType: 'opr', oprTools: [{ key: 'edit', text: '编辑', onClick: (record) => {} }] },
  ],
  request: async (params) => {
    const res = await fetchList(params);
    return { data: res.list, total: res.total };
  },
});
<ProTable table={table} />;
table.instance.reload();
table.instance.clearSelection();
```

---

## 一、架构分层

### 1.1 整体架构

```
┌────────────────────────────────────────────────────────────────────┐
│                    ProTable 整体架构                               │
├────────────────────────────────────────────────────────────────────┤
│  Component 层（渲染组件，原 features/ + components/ 已合并）       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │TableRendr│ │QueryForm │ │ Toolbar  │ │Pagination│ │BatchOp │  │
│  │表格渲染器 │ │ 查询表单 │ │ 工具栏   │ │  分页    │ │批量操作│  │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├────────┤  │
│  │CardView  │ │Skeleton  │ │DragSort  │ │SearchSch │ │TableDlg│  │
│  │卡片视图  │ │  骨架屏  │ │拖拽排序  │ │查询方案  │ │弹窗    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘  │
├────────────────────────────────────────────────────────────────────┤
│  Context 层（三层上下文）                                          │
│  ┌──────────────┐ ┌────────────────┐ ┌────────────────────┐       │
│  │  RootContext  │ │  DataContext    │ │  ColumnContext     │       │
│  │ （全局配置）   │ │ （数据状态+操作）│ │ （列配置+显隐+密度）│       │
│  ├──────────────┤ ├────────────────┤ ├────────────────────┤       │
│  │ TableConfigContext — 合并后的完整配置                          │       │
│  └──────────────┘ └────────────────┘ └────────────────────┘       │
├────────────────────────────────────────────────────────────────────┤
│  Hooks 层（逻辑复用）                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │useProTabl│ │useRequest│ │useUrlSync│ │useSearch │ │useDrag │ │
│  │ 实例管理  │ │ 数据请求  │ │ URL同步  │ │  方案    │ │ 拖拽   │ │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├────────┤ │
│  │useVirtualScroll│ │useCache  │ (均来自 @lania-pro-components/shared)│
│  └──────────┘ └──────────┘ └────────────────────────────────────── ┘│
├────────────────────────────────────────────────────────────────────┤
│  Editable 层（可编辑表格）                                         │
│  ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐          │
│  │useEditableTabl│ │ EditableCell │ │ EditableActions  │          │
│  └───────────────┘ └──────────────┘ └──────────────────┘          │
├────────────────────────────────────────────────────────────────────┤
│  Core 层（核心引擎）                                               │
│  ┌────────────┐ ┌──────────────────┐ ┌──────────────────────┐     │
│  │ DataStore  │ │ RequestEngine    │ │   columnRender       │     │
│  │ (createStor│ │ (@deprecated,    │ │   + cellMerge        │     │
│  │  e 实现)    │ │  内部用asyncReq)│ │   + defineEnumMap    │     │
│  └────────────┘ └──────────────────┘ └──────────────────────┘     │
├────────────────────────────────────────────────────────────────────┤
│  Schema 层 — ProColumnType / ProTableProps / ProTableActionType    │
│  Utils 层 — columnRender / cellMerge / defineEnumMap              │
└────────────────────────────────────────────────────────────────────┘
```

### 1.2 层级职责

| 层级             | 文件路径                             | 核心职责                                        | 关键组件/类                                                                                                                                                  |
| ---------------- | ------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Schema 层**    | `types.ts`, `types-action-button.ts` | 列配置和组件属性类型                            | `ProColumnType`, `ProTableProps`, `ProTableActionType`                                                                                                       |
| **Core 层**      | `store/`, `request/`, `utils/`       | 状态管理和请求引擎                              | `DataStore`, `RequestEngine`, `columnRender`, `cellMerge`                                                                                                    |
| **Context 层**   | `context/`                           | 三层上下文传递                                  | `RootContext`, `DataContext`, `ColumnContext`, `TableConfigContext`                                                                                          |
| **Hooks 层**     | `hooks/`                             | 逻辑复用                                        | `useProTable`, `useRequest`, `useUrlSync`, `useSearchSchema`, `useDragSort`                                                                                  |
| **Editable 层**  | `editable/`                          | 可编辑表格                                      | `useEditableTable`, `EditableCell`, `EditableActions`                                                                                                        |
| **Component 层** | `components/`                        | 所有渲染组件（原 features/ + components/ 合并） | `TableRenderer`, `QueryForm`, `Toolbar`, `Pagination`, `BatchOperation`, `CardView`, `SkeletonTable`, `DragSortTable`, `SearchSchemaSelector`, `TableDialog` |
| **Utils 层**     | `utils/`                             | 列渲染/合并/枚举工具                            | `columnRender`, `cellMerge`, `defineEnumMap`                                                                                                                 |

### 1.3 核心设计原则

- **单向数据流**：Schema → DataStore → RequestEngine → UI
- **三层 Context**：Root（全局配置）+ Data（数据状态+操作）+ Column（列配置）
- **事件驱动**：通过 `createStore` 的 subscribe 实现状态变更通知
- **可插拔扩展**：Hooks 层实现功能动态扩展

---

## 二、使用方式

| 方式                 | 说明                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| **纯 ProTable 组件** | 直接传入 props，自动处理数据请求                                         |
| **`actionRef`**      | `const ref = useRef<ProTableActionType>(); <ProTable actionRef={ref} />` |
| **`useProTable`**    | 返回 `{ instance, bindingProps, dataSource, loading, Provider }`         |
| **Provider 模式**    | `useProTable()` 返回 `Provider`，子组件用 `useProTableContext()` 访问    |

```tsx
// 方式一：纯组件
<ProTable columns={columns} request={fetchData} />;

// 方式二：actionRef
const ref = useRef<ProTableActionType>(null);
<ProTable actionRef={ref} columns={columns} request={fetchData} />;
ref.current?.reload();

// 方式三：useProTable（推荐）
const { instance, bindingProps } = useProTable({ columns, request: fetchData });
<ProTable {...bindingProps} />;
instance.reload();

// 方式四：Provider 跨组件
const { Provider, bindingProps } = useProTable({ columns, request: fetchData });
<Provider>
  <ProTable {...bindingProps} />
  <ChildComponent />
</Provider>;
```

---

## 三、类型定义

### 3.1 ProColumnType

```typescript
interface ProColumnType<T = Record<string, unknown>> {
  dataIndex?: string | string[];      // 数据字段路径
  title?: ReactNode;                   // 列标题
  valueType?: ProColumnValueType;      // 值类型
  valueEnum?: Record<string, { text: string; color?: string; status?: string }>;
  emptyText?: ReactNode;               // 空值显示文本
  hideInSearch?: boolean;              // 查询表单中隐藏
  hideInTable?: boolean;               // 表格中隐藏
  disableInSetting?: boolean;          // 列设置中禁用
  search?: false | (Omit<ProFormSchema, 'name'> & { order?; transform? });
  ellipsis?: boolean;
  copyable?: boolean;
  copyText?: (text, record) => string;
  width?: number | string;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  tooltip?: string;
  cellTooltip?: boolean | string | ((text, record?, index?) => ReactNode);
  dateFormat?: DateFormatType;
  moneySymbol?: string;                // 默认 '¥'
  precision?: number;                  // 默认 2
  thousandsSeparator?: boolean;        // 默认 true
  render?: (dom, entity, index, action, schema) => ReactNode;
  renderText?: (text, record, index) => unknown;
  oprTools?: OprToolConfig<T>[];       // 操作按钮（opr 类型）
  proTableConfig?: { columns; dataSource?; tableProps?; dataPath?; title?; bordered?; size?; pagination? };
  editable?: boolean | ((record) => boolean) | { component?; componentProps?; rules?; required?; formSchema? };
  children?: ProColumnType<T>[];        // 分组表头
  summary?: boolean | { type: 'sum'|'avg'|'min'|'max'|'count'; render? };
  actions?: OprActionButtonConfig<T>[]; // 操作按钮（新方式，替代 oprTools）
  // 筛选/排序
  filters?: { text: ReactNode; value: unknown }[];
  filterDropdown?: boolean;
  onFilter?: (value, record) => boolean;
  sorter?: boolean | ((a, b) => number) | 'ascend' | 'descend';
  defaultSortOrder?: 'ascend' | 'descend';
  sortPriority?: number;
  // 渲染属性
  componentProps?: { size?; width?; height?; preview?; objectFit?; borderRadius?; ... };
  drag?: boolean;
  cellClassName?: string | ((record, index) => string);
  minWidth?: number;
  maxWidth?: number;
}
```

### 3.2 ProColumnValueType

| 类型                            | 说明             | 渲染结果        |
| ------------------------------- | ---------------- | --------------- |
| `text`                          | 文本             | 纯文本          |
| `number`                        | 数字             | 千分位格式化    |
| `money`                         | 金额             | 货币符号+千分位 |
| `percent`                       | 百分比           | 百分比格式化    |
| `date` / `dateTime` / `time`    | 日期/时间        | 格式化日期      |
| `dateRange` / `dateTimeRange`   | 日期范围         | 开始~结束       |
| `select` / `radio` / `checkbox` | 选择             | valueEnum 映射  |
| `switch` / `tag`                | 开关/标签        | 状态显示        |
| `avatar` / `image`              | 图片             | 缩略图+预览     |
| `link`                          | 链接             | 可点击链接      |
| `progress`                      | 进度条           | 进度条组件      |
| `code` / `json` / `textarea`    | 代码/JSON/文本域 | 格式化显示      |
| `enum`                          | 枚举             | valueEnum 标签  |
| `index` / `indexBorder`         | 序号             | 自动/带边框序号 |
| `opr`                           | 操作列           | 操作按钮组      |
| `proTable`                      | 子表格           | 嵌套表格        |

### 3.3 ProTableProps

| 分类          | 属性                                                                                                    | 说明              |
| ------------- | ------------------------------------------------------------------------------------------------------- | ----------------- |
| **核心**      | `columns`, `request`, `dataSource`, `params`, `rowKey`                                                  | 列配置和数据      |
| **分页**      | `pagination`, `defaultPageSize`, `pageSizeOptions`                                                      | 分页设置          |
| **搜索**      | `search`, `beforeRequest`, `afterRequest`, `postData`                                                   | 查询表单          |
| **工具栏**    | `toolbar`, `headerTitle`, `onDensityChange`, `onColumnsStateChange`                                     | 工具栏            |
| **行选择**    | `rowSelection`, `batchOperation`                                                                        | 选择和批量操作    |
| **请求**      | `manual`, `debounceTime`, `polling`, `onRequestError`                                                   | 请求控制          |
| **高级**      | `urlSync`, `searchSchema`, `virtualScroll`, `dragSort`, `cardMode`, `viewMode`, `cache`, `cacheKey`     | 高级功能          |
| **编辑**      | `editable`                                                                                              | 可编辑表格        |
| **样式**      | `className`, `style`, `containerClassName`, `containerStyle`, `cardContainer`, `bordered`               | 外观              |
| **展开**      | `defaultExpandAllRows`, `defaultExpandedRowKeys`, `expandedRowKeys`, `expandedRowRender`, `expandProps` | 展开行            |
| **汇总/粘性** | `tableSummary`, `stickyHeader`, `cellMerge`, `groupColumns`                                             | 表格功能          |
| **事件**      | `onCreate`, `onEdit`, `onView`, `onDelete`, `onExport`, `onImport`                                      | ActionButton 事件 |
| **弹窗**      | `dialogConfig`, `columnsStatePersistenceKey`                                                            | 弹窗/持久化       |

### 3.4 ProTableActionType

| 方法                                                                                                            | 说明             |
| --------------------------------------------------------------------------------------------------------------- | ---------------- |
| `reload(resetPageIndex?)`                                                                                       | 重新加载数据     |
| `reloadAndRest()`                                                                                               | 刷新并清空选中   |
| `reset()`                                                                                                       | 重置查询条件     |
| `clearSelected()` / `setSelectedRows()` / `setSelectedRowKeys()` / `getSelectedRows()` / `getSelectedRowKeys()` | 行选择           |
| `startEditable()` / `cancelEditable()` / `saveEditable()` / `deleteEditable()`                                  | 可编辑行         |
| `getPagination()` / `setPagination()`                                                                           | 分页控制         |
| `getParams()` / `setParams()`                                                                                   | 查询参数         |
| `getFormInstance()`                                                                                             | 获取查询表单实例 |
| `startPolling()` / `stopPolling()` / `getPollingStatus()`                                                       | 轮询             |
| `debouncedFetchData(params?)`                                                                                   | 防抖请求         |
| `openDialog(config)` / `confirm(config)`                                                                        | 弹窗             |
| `scrollToIndex()` / `scrollToTop()` / `scrollToBottom()`                                                        | 虚拟滚动         |
| `resetDragSort()`                                                                                               | 拖拽排序         |
| `clearCache()`                                                                                                  | 清空缓存         |

### 3.5 ProTableToolbarConfig

```typescript
interface ProTableToolbarConfig {
  title?: ReactNode;
  subTitle?: ReactNode;
  description?: ReactNode;
  showRefresh?: boolean;
  showDensity?: boolean;
  showColumnSetting?: boolean;
  showFullscreen?: boolean;
  leftRender?: ReactNode;
  rightRender?: ReactNode;
  toolbarRender?: (actions: ProTableActionType, rows: { selectedRows; selectedRowKeys }) => ReactNode;
  actions?: ToolbarActionConfig;
}
```

---

## 四、Core 层

### 4.1 DataStore

基于 `@lania-pro-components/utils` 的 `createStore` 实现。

**状态**：`dataSource`, `loading`, `error`, `total`, `query`, `pagination`, `sorter`, `filters`, `selectedRowKeys`, `selectedRows`, `isPolling`, `pollingInterval`

**副作用链**：

| 操作                      | 连锁变更               |
| ------------------------- | ---------------------- |
| `setQuery(query)`         | 页码→第1页 + 清空选中  |
| `setPageSize(size)`       | 页码→第1页 + 清空选中  |
| `setPage(page)`           | 仅更新页码（保留选中） |
| `setSorter(field, order)` | 页码→第1页             |
| `setFilters(filters)`     | 页码→第1页             |

**架构债务修复**：`reload()` 使用实例级回调注册表替代 `window.dispatchEvent` 全局广播。

### 4.2 RequestEngine

`@deprecated` — 通用请求管理已迁移到 `@lania-pro-components/shared` 的 `useAsyncRequest`。

ProTable 专用请求逻辑（DataStore 集成、分页自动调整、缓存）在 `hooks/useRequest.ts`。

### 4.3 columnRender / cellMerge / defineEnumMap

位于 `utils/` 目录，提供列渲染、单元格合并、枚举映射等工具函数。

---

## 五、useProTable Hook

```typescript
const {
  tableRef, // 表格实例 ref
  instance, // ProTableInstance（完整 API）
  bindingProps, // 可直接绑定到 <ProTable>
  dataSource, // 数据源
  loading, // 加载状态
  pagination, // 分页信息
  selectedRowKeys, // 选中行 keys
  selectedRows, // 选中行数据
  query, // 查询参数
  Provider, // Context Provider（跨组件）
} = useProTable(options);
```

### ProTableInstance

```typescript
interface ProTableInstance {
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  getPagination: () => { current; pageSize; total };
  setPagination: (p) => void;
  getQueryParams: () => Record<string, unknown>;
  setQueryParams: (params) => void;
  getSorter: () => { field?; direction? } | null;
  clearSorter: () => void;
  getSelectedRows: () => Record<string, unknown>[];
  getSelectedRowKeys: () => (string | number)[];
  setSelectedRows: (keys, rows) => void;
  clearSelection: () => void;
  getDataSource: () => Record<string, unknown>[];
  setDataSource: (data) => void;
  getLoading: () => boolean;
  expandAll: () => void;
  collapseAll: () => void;
  expandRow: (rowKey) => void;
  collapseRow: (rowKey) => void;
}
```

---

## 六、功能模块

| 模块           | 组件/Hook                                                      | 说明                                  |
| -------------- | -------------------------------------------------------------- | ------------------------------------- |
| **查询表单**   | `QueryForm`                                                    | 与 ProForm 联动，支持折叠、多列布局   |
| **表格渲染**   | `TableRenderer`                                                | 基于 Arco Table，支持列显隐/密度/排序 |
| **工具栏**     | `Toolbar`                                                      | 标题、刷新、密度、列设置、全屏        |
| **分页**       | `Pagination`                                                   | 支持页大小切换、总数显示              |
| **批量操作**   | `BatchOperation`                                               | 选中后出现操作栏                      |
| **行操作**     | `OprColumn` + `ActionButtonRenderer`                           | 操作列按钮组                          |
| **可编辑表格** | `useEditableTable` + `EditableCell`                            | 行内编辑                              |
| **虚拟滚动**   | `useVirtualScroll`（from shared）                              | 大数据量优化                          |
| **拖拽排序**   | `useDragSort` + `DragSortTable`                                | 行拖拽排序                            |
| **URL 同步**   | `useUrlSync`                                                   | 查询参数同步到 URL                    |
| **查询方案**   | `useSearchSchema` + `SearchSchemaSelector`                     | 保存/切换查询方案                     |
| **卡片视图**   | `CardView` + `ViewModeSwitch`                                  | 表格/卡片切换                         |
| **骨架屏**     | `SkeletonTable`                                                | 加载中占位                            |
| **弹窗**       | `TableDialog`（openDialog/confirm/info/success/warning/error） | 命令式弹窗                            |

---

## 七、Context 层

| Context              | 说明                               |
| -------------------- | ---------------------------------- |
| `RootContext`        | 全局配置（props、rowKey、回调）    |
| `DataContext`        | 数据状态（DataStore）+ action 方法 |
| `ColumnContext`      | 列配置、列显隐、密度               |
| `TableConfigContext` | 合并后的完整配置                   |

---

## 八、可编辑表格

通过 `editable` prop 启用，支持 `single`/`multiple` 编辑模式：

```tsx
<ProTable
  editable={{
    type: 'single',
    onSave: async (rowKey, data, row) => {
      /* 保存 */
    },
    onDelete: async (rowKey, row) => {
      /* 删除 */
    },
  }}
  columns={[
    { title: '姓名', dataIndex: 'name', editable: true },
    { title: '年龄', dataIndex: 'age', editable: { component: 'InputNumber' } },
  ]}
/>
```

    return new Promise((resolve, reject) => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(async () => {
        try {
          const result = await this.execute(params);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });

}
}

```

**请求取消 vs 请求防抖**：

| 策略                 | 解决的问题               | 实现方式        |
| -------------------- | ------------------------ | --------------- |
| 请求取消（cancel）   | 旧请求响应覆盖新请求     | AbortController |
| 请求防抖（debounce） | 快速连续操作触发多次请求 | setTimeout      |

### 11.3 ColumnRender — 列渲染系统

**文件**：`utils/columnRender.tsx`

**职责**：基于 `valueType` 的声明式列渲染，支持 20+ 内置值类型

**渲染流程**：

```

valueType → 查找渲染器 → 执行渲染 → 返回 ReactNode
│
├── text → textRenderer
├── number → numberRenderer（千分位）
├── money → moneyRenderer（货币符号 + 千分位）
├── date → dateRenderer（日期格式化）
├── tag → tagRenderer（根据 valueEnum）
├── opr → oprRenderer（操作按钮组）
├── proTable → proTableRenderer（嵌套表格）
└── ... 其他类型

````

**通用处理**：

- 自动处理空值（`emptyText`）
- 自动处理省略（`ellipsis`）
- 自动处理拷贝（`copyable`）
- 自动处理 tooltip（`cellTooltip`）

---

## 六、Context 层

**文件**：`context/`

Context 层负责在 React 组件树中传递状态，避免 prop drilling。共有 4 个 Context，分为三层架构。

### 11.1 上下文体系总览

| Context                | 文件                     | 职责                                       | 作用域   |
| ---------------------- | ------------------------ | ------------------------------------------ | -------- |
| **RootContext**        | `RootContext.tsx`        | 全局配置层（props、rowKey、getRowKey）     | 整个表格 |
| **DataContext**        | `DataContext.tsx`        | 数据状态层（DataStore 状态 + action 方法） | 整个表格 |
| **ColumnContext**      | `ColumnContext.tsx`      | 列配置层（columns、density、列设置）       | 整个表格 |
| **TableConfigContext** | `TableConfigContext.tsx` | 表格配置上下文                             | 整个表格 |

### 11.2 RootContext — 全局配置层

```typescript
interface RootContextValue<T = Record<string, unknown>> {
  props: ProTableProps<T>; // 组件原始属性
  rowKey: string | ((record: T) => string); // 行标识配置
  getRowKey: (record: T) => string; // 获取行 key 的函数
}
````

### 11.3 DataContext — 数据状态层

```typescript
interface DataContextValue<T = Record<string, unknown>> {
  // 状态
  dataSource: T[];
  loading: boolean;
  error: Error | null;
  total: number;
  query: Record<string, unknown>;
  pagination: { current: number; pageSize: number };
  sorter: { field?: string; order?: 'ascend' | 'descend' };
  filters: Record<string, unknown>;

  // 选中
  selectedRowKeys: (string | number)[];
  selectedRows: T[];

  // 轮询
  isPolling: boolean;
  pollingInterval: number;

  // 方法
  setDataSource: (data: T[]) => void;
  setLoading: (loading: boolean) => void;
  setQuery: (query: Record<string, unknown>) => void;
  setPage: (current: number) => void;
  setSorter: (field?: string, order?: 'ascend' | 'descend') => void;
  setFilters: (filters: Record<string, unknown>) => void;
  reset: () => void;

  // action
  action: ProTableActionType;

  // formRef
  formRef: React.RefObject<ProFormInstance> | null;
}
```

### 11.4 ColumnContext — 列配置层

```typescript
interface ColumnContextValue<T = Record<string, unknown>> {
  columns: ProColumnType<T>[]; // 列配置数组
  density: 'default' | 'middle' | 'compact'; // 表格密度
  handleColumnsChange: (columns: ProColumnType<T>[]) => void;
  handleDensityChange: (density: 'default' | 'middle' | 'compact') => void;
}
```

---

## 七、Features 层

**文件**：`features/`

Features 层包含表格的核心功能模块。

### 11.1 QueryForm — 查询表单

**文件**：`features/QueryForm.tsx`

**职责**：从列配置自动生成查询表单 Schema

**核心逻辑**：

- 根据 `valueType` 自动映射表单组件（text→Input, date→DatePicker, select→Select 等）
- 根据 `valueEnum` 自动生成选项
- 支持 `hideInSearch` 隐藏列
- 支持 `search` 自定义查询表单配置
- 搜索参数自动转换（如日期范围字段名后缀处理）

**生成流程**：

```
columns → filter(hideInSearch=false) → map(toSearchSchema) → ProFormSchema[]
```

### 11.2 TableRenderer — 表格渲染器

**文件**：`features/TableRenderer.tsx`

**职责**：根据列配置和数据源渲染表格，处理行选择、展开行、虚拟滚动等

**渲染流程**：

```
columns + dataSource → 遍历列配置 → 根据 valueType 选择渲染器 → 返回 Table 组件
    │
    ├── rowSelection → 处理行选择（checkbox/radio）
    ├── expandable → 处理展开行（子表格）
    ├── virtualScroll → 处理虚拟滚动
    └── editable → 处理可编辑单元格
```

### 11.3 Toolbar — 工具栏

**文件**：`features/Toolbar.tsx`

**职责**：提供表格工具栏功能

**内置功能**：

- 刷新按钮（`showRefresh`）
- 密度切换（`showDensity`）
- 列设置（`showColumnSetting`）
- 全屏按钮（`showFullscreen`）
- 自定义渲染（`leftRender`、`rightRender`、`toolbarRender`）
- 操作按钮（`actions`）

### 11.4 Pagination — 分页组件

**文件**：`features/Pagination.tsx`

**职责**：处理分页逻辑，同步分页状态到 DataStore

**配置**：

- `defaultPageSize`：默认每页条数
- `pageSizeOptions`：分页大小选项
- `showTotal`：显示总条数

### 11.5 BatchOperation — 批量操作

**文件**：`features/BatchOperation.tsx`

**职责**：处理批量选择后的操作

**配置**：

```typescript
interface BatchOperationConfig {
  title?: string; // 批量操作标题
  description?: string; // 描述
  operations?: BatchOperationItem[]; // 操作列表
  showClearSelected?: boolean; // 显示清空选中按钮
}
```

### 11.6 TableDialog — 表格弹窗

**文件**：`features/TableDialog.tsx`

**职责**：提供表格弹窗能力（openDialog / confirm）

**集成方式**：与 ProDialog 组件深度集成

---

## 八、Hooks 层

**文件**：`hooks/`

Hooks 层提供可插拔的插件能力。

### 11.1 useProTable — 实例管理 Hook

**文件**：`hooks/useProTable.tsx`

**职责**：创建和管理表格实例，支持跨组件访问

### 11.2 useRequest — 数据请求 Hook

**文件**：`hooks/useRequest.ts`

**职责**：监听 DataStore 变化，自动发起请求，管理请求生命周期

**功能**：

- 轮询支持（`polling`）
- 防抖支持（`debounceTime`）
- 请求前后处理（`beforeRequest`、`afterRequest`）
- 数据格式化（`postData`）
- 错误处理（`onRequestError`）

### 11.3 useUrlSync — URL 参数同步

**文件**：`hooks/useUrlSync.ts`

**职责**：同步查询参数、分页参数到 URL

**配置**：

```typescript
interface UrlSyncConfig {
  prefix?: string; // 参数前缀
  include?: string[]; // 包含的参数
  exclude?: string[]; // 排除的参数
}
```

### 11.4 useSearchSchema — 查询方案保存/切换

**文件**：`hooks/useSearchSchema.ts`

**职责**：支持保存和切换查询方案

**配置**：

```typescript
interface SearchSchemaConfig {
  enabled?: boolean; // 是否启用
  persistenceKey?: string; // 持久化 key
  schemas?: Array<{ key: string; name: string; params: Record<string, unknown> }>;
}
```

### 11.5 useVirtualScroll — 虚拟滚动

**文件**：`hooks/useVirtualScroll.ts`

**职责**：优化大数据量表的渲染性能，只渲染可视区域内的行

**配置**：

```typescript
interface VirtualScrollConfig {
  itemHeight?: number; // 行高度
  overscan?: number; // 可视区域外额外渲染的行数
  containerHeight?: number; // 容器高度
}
```

### 11.6 useDragSort — 拖拽排序

**文件**：`hooks/useDragSort.ts`

**职责**：实现拖拽排序功能

**配置**：

```typescript
interface DragSortConfig {
  type?: 'handle' | 'row'; // 拖拽模式
  handleRender?: () => ReactNode; // 自定义拖拽句柄
  onDragSortEnd?: (newDataSource: unknown[], oldDataSource: unknown[]) => void;
}
```

### 11.7 useResponsive — 响应式适配

**文件**：`hooks/useResponsive.ts`

**职责**：实现响应式布局适配

### 11.8 useCache — 数据缓存

**文件**：`hooks/useCache.ts`

**职责**：实现数据缓存功能

**配置**：

```typescript
interface CacheConfig {
  maxAge?: number; // 缓存过期时间（毫秒）
  maxSize?: number; // 最大缓存条数
}
```

---

## 九、Editable 层

**文件**：`editable/`

### 11.1 useEditableTable — 编辑状态管理 Hook

**文件**：`editable/useEditableTable.ts`

**职责**：管理可编辑表格的编辑状态

**核心功能**：

- 单行编辑 / 多行编辑模式
- 编辑数据暂存
- 编辑状态切换
- 编辑数据回滚（取消时恢复原始数据）

### 11.2 EditableCell — 可编辑单元格

**文件**：`editable/EditableCell.tsx`

**职责**：自动切换编辑/展示模式的单元格组件

### 11.3 EditableActions — 编辑操作按钮

**文件**：`editable/EditableActions.tsx`

**职责**：提供编辑行的操作按钮（保存/取消/删除）

### 11.4 EditableConfig（可编辑配置）

```typescript
interface EditableConfig<T = Record<string, unknown>> {
  type?: 'single' | 'multiple'; // 编辑模式（默认 'single'）
  editableKeys?: (string | number)[]; // 当前编辑行 keys
  onChange?: (editableKeys: (string | number)[], editableRows: T[]) => void;
  onSave?: (rowKey: string | number, data: T, row: T) => Promise<boolean | void>;
  onDelete?: (rowKey: string | number, row: T) => Promise<boolean | void>;
  onCancel?: (rowKey: string | number, row: T, newRow?: T) => Promise<boolean | void>;
  actionRender?: (row: T, config: EditableConfig<T>, defaultDom: ReactNode[]) => ReactNode[];
}
```

---

## 十、Component 层

**文件**：`components/`

### 11.1 CardView — 卡片视图

**文件**：`components/CardView.tsx`

**职责**：以卡片形式展示数据，支持网格布局

**配置**：

```typescript
interface CardModeConfig {
  cardRender?: (record: unknown, index: number) => ReactNode;
  grid?: {
    gutter?: number;
    column?: number;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
}
```

### 11.2 SkeletonTable — 骨架屏加载

**文件**：`components/SkeletonTable.tsx`

**职责**：表格加载时显示骨架屏

### 11.3 SearchSchemaSelector — 查询方案选择器

**文件**：`components/SearchSchemaSelector.tsx`

**职责**：提供查询方案的选择和管理 UI

### 11.4 DragSortTable — 拖拽排序表格

**文件**：`components/DragSortTable.tsx`

**职责**：支持拖拽排序的表格组件

---

## 十一、Utils 层

**文件**：`utils/`

### 11.1 columnRender — 列渲染工具

**文件**：`utils/columnRender.tsx`

**职责**：列渲染系统的核心工具函数

### 11.2 cellMerge — 单元格合并

**文件**：`utils/cellMerge.ts`

**职责**：提供单元格合并的工具函数

### 11.3 defineEnumMap — 枚举映射定义

**文件**：`utils/defineEnumMap.ts`

**职责**：定义枚举映射的辅助函数

---

## 十二、完整数据流

```
用户操作（搜索/排序/分页/筛选）
    ↓
更新 DataStore（setQuery/setPage/setSorter/setFilters）
    │
    ├── 主变更：更新对应状态
    └── 连锁变更：根据操作类型自动更新相关状态
          ↓
useRequest Hook 监听到 DataStore 变化
          ↓
构造请求参数
{
  page: 1,
  pageSize: 20,
  keyword: 'test',
  status: 'active',
  sorter: {},
  filters: {},
  ...params (额外参数)
}
          ↓
beforeRequest(params) → 用户自定义参数转换
          ↓
RequestEngine.execute(params)
    ├── debounceTime 防抖处理
    ├── AbortController 取消上一次请求
    │     └── 前一次请求被 abort → 忽略其结果
    └── 发起新请求
          ↓
request(params) → 用户提供的请求函数
          ↓
{ data: [...], total: 100 }
          ↓
afterRequest(data, total) → 用户自定义数据转换
          ↓
postData(data) → 数据格式化
          ↓
store.setDataSource(data)
store.setTotal(total)
store.setLoading(false)
          ↓
DataContext 通知订阅者 → React 重新渲染
          ↓
TableRenderer 渲染新数据
    ├── 根据 columns 的 valueType 选择渲染器
    ├── 处理 rowSelection（选中态）
    └── 处理 expandable（展开行）
```

---

## 十三、目录结构

```
packages/components/protable/
├── index.tsx                    # 主入口
├── types.ts                     # 类型定义（列配置、组件属性等）
├── types-action-button.ts       # 操作按钮类型定义
│
├── store/                       # 状态管理
│   ├── DataStore.ts             # 数据状态管理中心（发布-订阅模式）
│   └── types.ts                 # store 类型定义
│
├── request/                     # 请求管理
│   ├── RequestEngine.ts         # 请求执行引擎（防抖、取消）
│   └── useRequest.ts            # 数据请求 Hook
│
├── context/                     # 上下文
│   ├── RootContext.tsx          # 全局配置层
│   ├── DataContext.tsx          # 数据状态层
│   ├── ColumnContext.tsx        # 列配置层
│   ├── TableConfigContext.tsx   # 表格配置上下文
│   └── index.ts
│
├── features/                    # 功能组件
│   ├── QueryForm.tsx            # 查询表单（列配置自动生成搜索 Schema）
│   ├── TableRenderer.tsx        # 表格渲染器（valueType 渲染 + 行选择）
│   ├── Toolbar.tsx              # 工具栏（刷新、密度、列设置、全屏）
│   ├── Pagination.tsx           # 分页组件
│   ├── BatchOperation.tsx       # 批量操作
│   ├── TableDialog.tsx          # 表格弹窗（openDialog / confirm）
│   ├── ActionButtonRenderer.tsx # 操作按钮渲染器
│   └── index.ts
│
├── hooks/                       # Hooks（插件能力）
│   ├── useProTable.ts           # 实例管理 Hook
│   ├── useRequest.ts            # 数据请求 Hook（轮询、防抖、缓存）
│   ├── useUrlSync.ts            # URL 参数同步
│   ├── useSearchSchema.ts       # 查询方案保存/切换
│   ├── useVirtualScroll.ts      # 虚拟滚动
│   ├── useDragSort.ts           # 拖拽排序
│   ├── useResponsive.ts         # 响应式适配
│   ├── useCache.ts              # 数据缓存
│   └── index.ts
│
├── editable/                    # 可编辑表格
│   ├── useEditableTable.ts      # 编辑状态管理 Hook
│   ├── EditableCell.tsx         # 可编辑单元格
│   ├── EditableActions.tsx      # 编辑操作按钮
│   ├── types.ts                 # 类型定义
│   └── index.ts
│
├── components/                  # 辅助组件
│   ├── CardView.tsx             # 卡片视图
│   ├── SkeletonTable.tsx        # 骨架屏加载
│   ├── SearchSchemaSelector.tsx # 查询方案选择器
│   ├── DragSortTable.tsx        # 拖拽排序表格
│   └── index.ts
│
└── utils/                       # 工具函数
    ├── columnRender.tsx         # 列渲染系统（valueType → 渲染函数映射）
    ├── cellMerge.ts             # 单元格合并
    ├── defineEnumMap.ts         # 枚举映射定义
    └── index.ts
```

---

## 十四、原理深入

### 14.1 DataStore：发布-订阅模式的状态管理

DataStore 是 ProTable 的数据中枢，管理表格的所有运行时状态。它采用**经典的发布-订阅模式**，但与 ProForm 的 Proxy 响应式不同，DataStore 使用的是**显式的订阅-通知机制**。

**核心架构**：

```
┌──────────────────────────────────────────────────────┐
│                    DataStore                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │              _state（内部状态）               │    │
│  │  ├── dataSource: T[]         数据源          │    │
│  │  ├── loading: boolean        加载状态        │    │
│  │  ├── error: Error            错误信息        │    │
│  │  ├── total: number           总条数          │    │
│  │  ├── query: Record           查询条件        │    │
│  │  ├── pagination: {current, pageSize}  分页   │    │
│  │  ├── sorter: {field, order}  排序状态        │    │
│  │  ├── filters: Record         筛选状态        │    │
│  │  ├── selectedRowKeys: (string|number)[]      │    │
│  │  ├── selectedRows: T[]       选中行数据      │    │
│  │  ├── isPolling: boolean      轮询状态        │    │
│  │  └── pollingInterval: number 轮询间隔        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │          _listeners: Set<StateChangeListener>│    │
│  │          [fn1, fn2, fn3, ...]               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  subscribe(listener) → unsubscribe()                 │
│  _notify(key, prevValue) → 遍历 _listeners           │
└──────────────────────────────────────────────────────┘
```

**与 ProForm 响应式系统的区别**：

| 维度     | ProForm 响应式              | ProTable DataStore              |
| -------- | --------------------------- | ------------------------------- |
| 机制     | Proxy 自动拦截 get/set      | 手动调用 setXxx 方法            |
| 粒度     | 属性级（每个 key 一个 Dep） | 状态级（每个 setXxx 手动通知）  |
| 依赖收集 | 自动（effect 执行时收集）   | 手动（subscribe 订阅）          |
| 使用方式 | `state.values.name = 'x'`   | `store.setQuery({ name: 'x' })` |
| 适用场景 | 字段级细粒度更新            | 表格级整体状态同步              |

**为什么 DataStore 不用 Proxy 响应式？** 表格的状态变化特点是"一次操作触发多个状态变更"——比如搜索时，需要同时更新 `query`（新查询条件）、`pagination`（回到第 1 页）、`selectedRowKeys`（清空选中）。如果用 Proxy 响应式，每次赋值都会触发一次通知，产生三次渲染；而 DataStore 的 `setQuery` 方法内部一次性更新三个状态，只通知一次。

**订阅-通知机制**：

```typescript
// 订阅
const unsubscribe = store.subscribe((state, prevState) => {
  setDataSource(state.dataSource);
  setLoading(state.loading);
});

// 取消订阅
unsubscribe();
```

**通知策略**：`_notify` 方法接收两个参数——变更的 key 和变更前的值。它会构造一个 `prevState`（把变更前的值替换进去），然后把完整的 `state` 和 `prevState` 一起传给所有监听器。这样监听器可以对比前后状态，决定是否需要更新 UI。

```typescript
private _notify(key, prevValue) {
  const prevState = { ...this._state, [key]: prevValue };
  this._listeners.forEach(listener => listener(this._state, prevState));
}
```

### 14.2 RequestEngine：请求防抖与取消机制

这是 ProTable 请求层的核心实现，解决了两个高频问题：**快速连续操作时的请求风暴**和**旧请求覆盖新请求**。

**核心实现**：

```typescript
class RequestEngineImpl {
  private abortController: AbortController | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async execute(params) {
    this.cancel();
    this.abortController = new AbortController();
    const response = await request(finalParams);
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  debouncedExecute(params, wait) {
    return new Promise((resolve, reject) => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(async () => {
        try {
          const result = await this.execute(params);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  }
}
```

**请求取消 vs 请求防抖**：

| 策略                 | 解决的问题               | 实现方式        |
| -------------------- | ------------------------ | --------------- |
| 请求取消（cancel）   | 旧请求响应覆盖新请求     | AbortController |
| 请求防抖（debounce） | 快速连续操作触发多次请求 | setTimeout      |

两者配合使用：用户快速点击分页时，防抖确保只发一次请求；如果上一次请求还没返回就发起新请求，取消机制确保旧请求的响应被丢弃。

### 14.3 跨页选择：preserveSelectedRowKeys

```typescript
// 跨页选择的核心逻辑
setPage(current) {
  this._state.pagination = { ...prev, current };
  this._notify('pagination', prev);
  // 注意：这里没有清空 selectedRowKeys！
}

setQuery(query) {
  this._state.selectedRowKeys = [];
  this._state.selectedRows = [];
}
```

**为什么 setPage 不清空选中？** 因为跨页选择的场景：用户在第 1 页选中了 3 条，翻到第 2 页选了 2 条，此时 `selectedRowKeys` 应该是 5 条。只有当用户改变查询条件（`setQuery`）或改变每页条数（`setPageSize`）时，才意味着数据源变了，需要清空选中。

---

## 十五、模块导出总览

ProTable 通过 `index.tsx` 统一导出所有能力：

| 分类         | 导出内容                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **类型**     | `ProTableProps`, `ProTableActionType`, `ProColumnType`, `ProColumnValueType`, `ProTableRequest`, `ProTableRequestParams`, `ProTableRequestResponse`, `ProTableToolbarConfig`, `ProTableBatchOperationConfig`, `ProTableRowSelectionConfig`, `TableDensity`, `OpenDialogConfig`, `ConfirmDialogConfig`, `DialogReturnProps`, `ProTableNEventHandlers`, `OprActionButtonConfig`, `ToolbarActionButtonConfig`, `OprColumnConfig`, `ToolbarActionConfig` |
| **组件**     | `ProTable`, `QueryForm`, `TableRenderer`, `Toolbar`, `Pagination`, `BatchOperation`, `CardView`, `ViewModeSwitch`, `SkeletonTable`, `SkeletonCard`, `SearchSchemaSelector`, `DragSortTable`, `EditableActions`, `EditableCell`, `openDialog`, `confirm`                                                                                                                                                                                              |
| **Hooks**    | `useProTable`, `useRequest`, `useUrlSync`, `useSearchSchema`, `useVirtualScroll`, `useDragSort`, `useCache`, `getGlobalCache`, `removeGlobalCache`, `clearAllGlobalCaches`, `useResponsive`, `useResponsiveColumns`, `useEditableTable`                                                                                                                                                                                                              |
| **Context**  | `RootProvider`, `DataProvider`, `ColumnProvider`, `TableConfigProvider`, `useRootContext`, `useDataContext`, `useColumnContext`, `useTableConfig`, `useMergedConfig`                                                                                                                                                                                                                                                                                 |
| **Core**     | `createDataStore`, `createRequestEngine`                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Registry** | `customRendererRegistry`, `registerCellRenderer`, `unregisterCellRenderer`, `registerCellRenderers`, `getCellRenderer`, `hasCellRenderer`                                                                                                                                                                                                                                                                                                            |
| **工具函数** | `renderColumnByValueType`, `createColumnRender`, `convertColumns`, `formatNumber`, `formatMoney`, `formatPercent`, `formatDate`, `getNestedValue`, `copyToClipboard`, `defineEnumMap`, `createRowMerge`, `createColMerge`, `combineMerge`, `calculateMergeState`, `getCellMergeProps`                                                                                                                                                                |

**自动注册的模块**（import 副作用）：

- `utils/columnRender` — 列渲染系统和自定义渲染器注册表
- `features/ActionButtonRenderer` — 操作按钮渲染器

---

## 十六、使用示例

### 16.1 基础表格

```tsx
import { ProTable } from '@/pro-components/ProTable';

<ProTable
  columns={[
    { title: 'ID', dataIndex: 'id', valueType: 'index' },
    { title: '用户名', dataIndex: 'username', valueType: 'text', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'enum',
      valueEnum: {
        active: { text: '启用', status: 'success' },
        disabled: { text: '禁用', status: 'error' },
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime' },
    { title: '金额', dataIndex: 'amount', valueType: 'money' },
  ]}
  request={async (params) => {
    const res = await api.getUsers(params);
    return { data: res.list, total: res.total };
  }}
/>;
```

### 16.2 带搜索和工具栏

```tsx
<ProTable
  columns={columns}
  request={fetchUsers}
  search={{
    labelWidth: 80,
    showReset: true,
    searchText: '查询',
    resetText: '重置',
  }}
  toolbar={{
    title: '用户管理',
    showRefresh: true,
    showDensity: true,
    showColumnSetting: true,
    actions: [
      { type: 'add', key: 'add', text: '新增用户', schemas: [...], dialogsOptions: {...} },
    ],
  }}
  rowSelection={{
    type: 'checkbox',
    preserveSelectedRowKeys: true,
  }}
/>
```

### 16.3 操作列

```tsx
<ProTable
  columns={[
    ...otherColumns,
    {
      title: '操作',
      valueType: 'opr',
      oprTools: [
        {
          key: 'edit',
          text: '编辑',
          onClick: (record, index, action) => {
            // 编辑逻辑
          },
        },
        {
          key: 'delete',
          text: '删除',
          status: 'danger',
          onClick: async (record, index, action) => {
            await api.deleteUser(record.id);
            action.reload();
          },
        },
      ],
    },
  ]}
/>
```

### 16.4 子表格（嵌套表格）

```tsx
<ProTable
  columns={[
    { title: '用户', dataIndex: 'username' },
    {
      title: '订单',
      dataIndex: 'orders',
      valueType: 'proTable',
      proTableConfig: {
        columns: [
          { title: '订单号', dataIndex: 'orderNo' },
          { title: '金额', dataIndex: 'amount', valueType: 'money' },
        ],
        dataPath: 'orders',
      },
    },
  ]}
/>
```

### 16.5 可编辑表格

```tsx
<ProTable
  columns={[
    { title: '名称', dataIndex: 'name', editable: true },
    {
      title: '状态',
      dataIndex: 'status',
      editable: {
        component: 'Select',
        componentProps: {
          options: [
            { label: '启用', value: 'active' },
            { label: '禁用', value: 'disabled' },
          ],
        },
      },
    },
  ]}
  request={fetchData}
  editable={{
    type: 'single',
    onSave: async (rowKey, newData, oldData) => {
      await api.update(rowKey, newData);
      return true;
    },
  }}
/>
```

### 16.6 URL 同步

```tsx
<ProTable
  urlSync={{
    prefix: 'user_',
    include: ['page', 'pageSize', 'keyword'],
  }}
  // URL 自动同步: ?user_page=1&user_pageSize=20&user_keyword=xxx
/>
```

### 16.7 查询方案

```tsx
<ProTable
  searchSchema={{
    enabled: true,
    persistenceKey: 'user_search_schemas',
    schemas: [
      { key: 'default', name: '默认方案', params: { pageSize: 20 } },
      { key: 'vip', name: 'VIP用户', params: { pageSize: 20, vipLevel: 'vip' } },
    ],
  }}
/>
```

### 16.8 虚拟滚动（大数据量）

```tsx
<ProTable
  virtualScroll={true}
  virtualScrollConfig={{
    itemHeight: 48,
    containerHeight: 600,
  }}
/>
```

### 16.9 通过 ref 操作表格

```tsx
const tableRef = useRef<ProTableActionType>(null);

<ProTable ref={tableRef} ... />

// 外部操作
tableRef.current?.reload();
tableRef.current?.getSelectedRows();
tableRef.current?.setParams({ status: 'active' });
```

### 16.10 自定义渲染器注册

通过 `registerCellRenderer` 注册自定义单元格渲染器，在列配置中使用 `valueType` 引用。

```tsx
import { ProTable, registerCellRenderer } from '@/pro-components/ProTable';
import { Rate, Tag } from '@arco-design/web-react';

// 注册评分渲染器
registerCellRenderer('rate', (text, column, record, index) => {
  return <Rate value={text as number} disabled />;
});

// 注册进度条渲染器
registerCellRenderer('customProgress', (text, column, record) => {
  const percent = Number(text);
  return (
    <div style={{ width: 120 }}>
      <div
        style={{
          height: 6,
          background: '#f0f1f5',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, percent)}%`,
            background: percent >= 80 ? '#00b42a' : percent >= 50 ? '#ff7d00' : '#f53f3f',
            borderRadius: 3,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <span style={{ fontSize: 12, marginLeft: 8, color: '#86909c' }}>{percent}%</span>
    </div>
  );
});

// 注册标签组渲染器（支持数组）
registerCellRenderer('tagGroup', (text, column) => {
  const tags = Array.isArray(text) ? text : [];
  const valueEnum = column.valueEnum;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {tags.map((tag, idx) => {
        const config = valueEnum?.[tag];
        return (
          <Tag key={idx} color={config?.color}>
            {config?.text || tag}
          </Tag>
        );
      })}
    </div>
  );
});

// 在列配置中使用自定义渲染器
const columns = [
  { title: '评分', dataIndex: 'rating', valueType: 'rate' },
  { title: '完成度', dataIndex: 'completion', valueType: 'customProgress' },
  {
    title: '标签',
    dataIndex: 'tags',
    valueType: 'tagGroup',
    valueEnum: {
      hot: { text: '热门', color: 'red' },
      new: { text: '新品', color: 'blue' },
      recommended: { text: '推荐', color: 'green' },
    },
  },
];

<ProTable columns={columns} request={fetchData} />;
```

### 16.11 useProTable Hook 管理表格实例

使用 `useProTable` Hook 管理表格实例，支持跨组件访问和受控模式。**store、getRowKey、dataSource、columns 均为可选参数**，无需手动创建 DataStore。

**简化用法（推荐）**：

```tsx
import { ProTable, useProTable } from '@/pro-components/ProTable';

function UserTable() {
  const { instance, bindingProps, dataSource, loading } = useProTable<User>({
    columns,
    request: async (params) => {
      const res = await api.getUsers(params);
      return { data: res.list, total: res.total };
    },
    search: true,
    toolbar: { showRefresh: true },
  });

  const handleRefresh = () => {
    instance.reload();
  };

  const handleExport = () => {
    const selectedRows = instance.getSelectedRows();
    exportData(selectedRows);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={handleRefresh}>刷新</button>
        <button onClick={handleExport}>导出选中</button>
        <button onClick={() => instance.reset()}>重置</button>
      </div>
      <div>
        当前数据：{dataSource.length} 条，加载状态：{loading ? '加载中' : '已完成'}
      </div>
      <ProTable {...bindingProps} />
    </div>
  );
}
```

**完整用法（自定义 store）**：

```tsx
import { ProTable, useProTable, createDataStore } from '@/pro-components/ProTable';

function UserTable() {
  const store = useMemo(
    () =>
      createDataStore<User>({
        initialQuery: { status: 'active' },
        initialPagination: { current: 1, pageSize: 20 },
      }),
    [],
  );

  const { instance, bindingProps, tableRef } = useProTable<User>({
    store,
    columns,
    getRowKey: (record) => record.id,
    request: async (params) => {
      const res = await api.getUsers(params);
      return { data: res.list, total: res.total };
    },
    search: true,
    toolbar: { showRefresh: true },
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={handleRefresh}>刷新</button>
        <button onClick={handleExport}>导出选中</button>
        <button onClick={() => instance.reset()}>重置</button>
      </div>
      <ProTable ref={tableRef} {...bindingProps} />
    </div>
  );
}
```

### 16.12 Provider 跨组件访问表格实例

`useProTable` 返回的 `Provider` 组件会将表格实例、store、数据等通过 `ProTableContext` 下发给所有子组件，子组件无需逐层接收 prop 即可通过 `useProTableContext` 访问表格状态和方法。适用于「在父组件创建实例、在任意深度的子组件里操作表格」的场景。

```tsx
import { ProTable, useProTable, useProTableContext } from '@/pro-components/ProTable';

// 子组件：操作按钮（在表格外部使用）
function TableActions() {
  const context = useProTableContext<User>();
  if (!context) return null;

  const { instance, store } = context;

  const handleBatchDelete = async () => {
    const selectedKeys = store.selectedRowKeys;
    if (selectedKeys.length === 0) {
      alert('请选择要删除的行');
      return;
    }
    await api.batchDelete(selectedKeys);
    instance.reload();
  };

  const handleRefresh = () => {
    instance.reload();
  };

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <button onClick={handleRefresh}>刷新数据</button>
      <button onClick={handleBatchDelete} style={{ color: '#f53f3f' }}>
        批量删除 ({store.selectedRowKeys.length})
      </button>
    </div>
  );
}

// 子组件：统计信息（在表格外部使用）
function TableStats() {
  const context = useProTableContext<User>();
  if (!context) return null;

  const { store } = context;
  return (
    <div style={{ marginBottom: 16, color: '#86909c' }}>
      共 {store.total} 条数据，当前显示 {store.dataSource.length} 条
    </div>
  );
}

// 父组件：创建实例，用 Provider 下发
function ProviderDemo() {
  const { instance, Provider, bindingProps } = useProTable<User>({
    columns,
    request: async (params) => {
      const res = await api.getUsers(params);
      return { data: res.list, total: res.total };
    },
    search: true,
    toolbar: { showRefresh: true },
    rowSelection: { type: 'checkbox' },
  });

  return (
    <Provider>
      {/* 在表格外部使用 Context */}
      <TableStats />
      <TableActions />
      {/* ProTable 组件 */}
      <ProTable {...bindingProps} />
    </Provider>
  );
}
```

**关键点**：

| API                       | 返回                              | 适用场景                                 |
| ------------------------- | --------------------------------- | ---------------------------------------- |
| `useProTableContext<T>()` | `ProTableContextValue<T> \| null` | 在子组件中访问表格实例和状态             |
| `Provider`                | 包裹子组件                        | 父组件创建实例后下发，子组件任意深度消费 |

> 注意：`Provider` 必须包裹所有需要访问实例的子组件；脱离 `Provider` 树的组件调用 `useProTableContext()` 会得到 `null`。

### 16.13 DataContext 跨组件访问（表格内部）

通过 ProTable 内部的 DataContext 实现跨组件访问表格实例，无需传递 ref。ProTable 内部已经自动包裹了 Context Provider，子组件可以直接使用 `useDataContext` 在表格内部或外部访问表格状态和方法。

```tsx
import { ProTable, useDataContext } from '@/pro-components/ProTable';

// 子组件：操作按钮（在表格内部使用）
function TableActions() {
  const { action, store } = useDataContext();

  const handleBatchDelete = async () => {
    const selectedKeys = store.selectedRowKeys;
    if (selectedKeys.length === 0) {
      alert('请选择要删除的行');
      return;
    }
    await api.batchDelete(selectedKeys);
    action.reload();
  };

  const handleRefresh = () => {
    action.reload();
  };

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <button onClick={handleRefresh}>刷新数据</button>
      <button onClick={handleBatchDelete} style={{ color: '#f53f3f' }}>
        批量删除 ({store.selectedRowKeys.length})
      </button>
    </div>
  );
}

// 子组件：统计信息（在表格内部使用）
function TableStats() {
  const { store } = useDataContext();
  return (
    <div style={{ marginBottom: 16, color: '#86909c' }}>
      共 {store.total} 条数据，当前显示 {store.dataSource.length} 条
    </div>
  );
}

// 使用 toolbar 的 extraRender 在表格上方添加自定义组件
<ProTable
  columns={columns}
  request={fetchData}
  toolbar={{
    showRefresh: true,
    extraRender: () => (
      <div style={{ display: 'flex', gap: 8 }}>
        <TableStats />
        <TableActions />
      </div>
    ),
  }}
  rowSelection={{
    type: 'checkbox',
    preserveSelectedRowKeys: true,
  }}
/>

// 使用 ProTable 的 children 插槽在表格下方添加组件
<ProTable
  columns={columns}
  request={fetchData}
>
  <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
    <TableStats />
    <TableActions />
  </div>
</ProTable>
```

**在表格外部访问（使用 Context Provider 包裹）**：

```tsx
import {
  ProTable,
  DataProvider,
  useDataContext,
  createDataStore,
  RootProvider,
  ColumnProvider,
} from '@/pro-components/ProTable';

// 外部子组件
function ExternalActions() {
  const { action, store } = useDataContext();
  return (
    <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
      <button onClick={() => action.reload()}>外部刷新</button>
      <span>选中 {store.selectedRowKeys.length} 条</span>
    </div>
  );
}

function ExternalTable() {
  const store = useMemo(() => createDataStore<User>({}), []);

  const action = useMemo(
    () => ({
      reload: () => store.reload(),
      clearSelected: () => store.clearSelected(),
      getSelectedRows: () => store.selectedRows,
      getSelectedRowKeys: () => store.selectedRowKeys,
      setSelectedRowKeys: (keys) => {
        const rows = store.dataSource.filter((row) => keys.includes(row.id));
        store.setSelectedRows(keys, rows);
      },
      setParams: (params) => store.setQuery(params),
      getParams: () => store.query,
      getPagination: () => ({
        current: store.pagination.current,
        pageSize: store.pagination.pageSize,
        total: store.total,
      }),
      setPagination: ({ current, pageSize }) => {
        if (current !== undefined) store.setPage(current);
        if (pageSize !== undefined) store.setPageSize(pageSize);
      },
    }),
    [store],
  );

  return (
    <RootProvider props={{ columns, request: fetchData }}>
      <DataProvider store={store} action={action} formRef={null}>
        <ColumnProvider initialColumns={columns}>
          <ExternalActions />
          <ProTable columns={columns} request={fetchData} />
        </ColumnProvider>
      </DataProvider>
    </RootProvider>
  );
}
```

### 16.14 行展开（子表格）

```tsx
<ProTable
  columns={columns}
  request={fetchData}
  defaultExpandAllRows={false}
  defaultExpandedRowKeys={['1', '3']}
  rowKey='id'
>
  {/* 展开内容 */}
  {(record) => (
    <div style={{ padding: 16, background: '#fafafa' }}>
      <h4>订单详情</h4>
      <div style={{ marginTop: 8 }}>
        <div>订单号: {record.orderNo}</div>
        <div>金额: {record.amount}</div>
        <div>状态: {record.orderStatus}</div>
      </div>
    </div>
  )}
</ProTable>
```

### 16.15 批量操作

```tsx
<ProTable
  columns={columns}
  request={fetchData}
  rowSelection={{
    type: 'checkbox',
    preserveSelectedRowKeys: true,
    onChange: (selectedRowKeys, selectedRows) => {
      console.log('选中:', selectedRowKeys, selectedRows);
    },
  }}
  batchOperation={{
    title: '批量操作',
    description: '已选择 {selectedCount} 条记录',
    operations: [
      {
        key: 'batchEnable',
        text: '批量启用',
        onClick: async (selectedRows) => {
          await api.batchUpdate(
            selectedRows.map((r) => r.id),
            { status: 'enabled' },
          );
        },
      },
      {
        key: 'batchDisable',
        text: '批量禁用',
        status: 'warning',
        onClick: async (selectedRows) => {
          await api.batchUpdate(
            selectedRows.map((r) => r.id),
            { status: 'disabled' },
          );
        },
      },
      {
        key: 'batchDelete',
        text: '批量删除',
        status: 'danger',
        onClick: async (selectedRows) => {
          await api.batchDelete(selectedRows.map((r) => r.id));
        },
      },
    ],
    showClearSelected: true,
  }}
/>
```

### 16.16 轮询功能

```tsx
<ProTable
  columns={columns}
  request={fetchData}
  polling={{
    interval: 5000, // 5 秒轮询一次
    enabled: true, // 是否启用
    onError: (error) => {
      console.error('轮询出错:', error);
    },
  }}
  // 通过 ref 控制轮询
  ref={(instance) => {
    if (instance) {
      // 手动控制轮询
      // instance.startPolling();
      // instance.stopPolling();
    }
  }}
/>
```

### 16.17 数据缓存

```tsx
<ProTable
  columns={columns}
  request={fetchData}
  cache={{
    maxAge: 60000, // 缓存有效期 60 秒
    maxSize: 10, // 最大缓存条目数
  }}
  cacheKey='user_list_cache' // 缓存 key
  ref={(instance) => {
    // 手动清除缓存
    // instance?.clearCache();
  }}
/>
```

### 16.18 拖拽排序

```tsx
<ProTable
  columns={[
    {
      title: '拖拽',
      valueType: 'opr',
      width: 60,
      render: (_, record) => <span style={{ cursor: 'move', fontSize: 16 }}>⋮⋮</span>,
    },
    { title: '名称', dataIndex: 'name' },
    { title: '排序', dataIndex: 'sortOrder' },
  ]}
  request={fetchData}
  dragSort={{
    type: 'handle', // 'handle' 或 'row'
    handleRender: () => <span style={{ cursor: 'move', color: '#86909c' }}>⋮⋮</span>,
    onDragSortEnd: async (newDataSource, oldDataSource) => {
      // 保存排序结果到后端
      const sortedIds = newDataSource.map((item) => item.id);
      await api.updateSortOrder(sortedIds);
    },
  }}
/>
```

### 16.19 卡片视图

```tsx
<ProTable
  columns={columns}
  request={fetchData}
  cardMode={{
    cardRender: (record) => (
      <div style={{ padding: 16, border: '1px solid #e5e6eb', borderRadius: 8 }}>
        <h4 style={{ margin: 0, marginBottom: 8 }}>{record.title}</h4>
        <p style={{ margin: 4, color: '#86909c' }}>{record.description}</p>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#00b42a' }}>{record.status}</span>
          <span style={{ fontSize: 12, color: '#4e5969' }}>{record.createTime}</span>
        </div>
      </div>
    ),
    grid: {
      gutter: 16,
      column: 3, // 默认 3 列
      xs: 1, // 超小屏 1 列
      sm: 2, // 小屏 2 列
      lg: 3, // 大屏 3 列
    },
  }}
  viewMode='card' // 默认卡片视图
/>
```

### 16.20 单元格合并

```tsx
import { createRowMerge } from '@/pro-components/ProTable';

const columns = [
  {
    title: '部门',
    dataIndex: 'department',
    width: 120,
    // 按 department 字段合并行
    mergeCell: createRowMerge('department'),
  },
  { title: '姓名', dataIndex: 'name' },
  { title: '职位', dataIndex: 'position' },
];

<ProTable columns={columns} dataSource={dataSource} />;
```

### 16.21 导出工具函数使用

```tsx
import {
  formatNumber,
  formatMoney,
  formatPercent,
  formatDate,
  getNestedValue,
  copyToClipboard,
  defineEnumMap,
} from '@/pro-components/ProTable';

// 格式化数字
formatNumber(1234567, { precision: 2, thousandsSeparator: true }); // "1,234,567.00"

// 格式化金额
formatMoney(1234.56, '¥'); // "¥1,234.56"

// 格式化百分比
formatPercent(0.456, { precision: 1 }); // "45.6%"

// 格式化日期
formatDate('2024-01-15', 'YYYY年MM月DD日'); // "2024年01月15日"

// 获取嵌套对象值
getNestedValue({ a: { b: { c: 1 } } }, 'a.b.c'); // 1

// 枚举映射定义
const statusEnum = defineEnumMap({
  active: { text: '启用', color: '#00b42a' },
  disabled: { text: '禁用', color: '#f53f3f' },
});

statusEnum.getLabel('active'); // "启用"
statusEnum.getColor('active'); // "#00b42a"
statusEnum.get('active'); // { text: "启用", color: "#00b42a" }
statusEnum.has('pending'); // false
```
