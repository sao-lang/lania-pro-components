# ProTable

Schema 驱动的企业级表格组件，通过声明式列配置实现数据展示、查询、排序、筛选、编辑等全功能。

***

## 一、项目概述

ProTable 是一个基于 **Schema-Driven** 模式设计的企业级表格组件库，旨在提供：

- **高性能**：基于发布-订阅模式的状态管理，配合虚拟滚动、请求防抖与取消机制
- **高扩展性**：三层 Context 架构、可插拔的 Hook 插件系统、自定义渲染器注册
- **高灵活性**：支持多种视图模式（表格/卡片）、可编辑表格、拖拽排序、URL 同步等
- **良好兼容性**：与 Arco Design Table 深度集成，提供兼容 API

### 核心思想

```
ProTable = DataStore + ColumnSchema + QueryForm + TableRenderer
```

### 设计原则

1. **配置化优先**：所有功能通过配置开启，降低心智负担
2. **分层架构**：核心层 + 功能层 + 插件层 + 组件层
3. **按需加载**：支持 Tree Shaking，未使用的功能不打包
4. **类型安全**：完整的 TypeScript 类型支持

***

## 二、架构分层详解

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ProTable 整体架构                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                       Component 层（辅助组件）                             │   │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────────────┐ ┌───────────────────┐   │   │
│  │  │ CardView │ │SkeletonTable││SearchSchemaSelector││   DragSortTable   │   │   │
│  │  │ 卡片视图 │ │   骨架屏    ││   查询方案选择器   ││   拖拽排序表格    │   │   │
│  │  └──────────┘ └────────────┘ └──────────────────┘ └───────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                        Features 层（功能模块）                             │   │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌────────────┐ ┌───────────┐ │   │
│  │  │QueryForm │ │TableRenderer │ │ Toolbar  │ │ Pagination │ │BatchOp... │ │   │
│  │  │ 查询表单 │ │  表格渲染器  │ │ 工具栏   │ │   分页     │ │ 批量操作  │ │   │
│  │  └────┬─────┘ └──────┬───────┘ └────┬─────┘ └─────┬──────┘ └─────┬─────┘ │   │
│  └───────┼──────────────┼──────────────┼─────────────┼───────────────┼───────┘   │
│          │              │              │             │               │           │
│  ┌───────▼──────────────▼──────────────▼─────────────▼───────────────▼───────┐   │
│  │                        Context 层（上下文传递）                            │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────────────┐       │   │
│  │  │RootContext │ │DataContext │ │ColumnCtx   │ │TableConfigContext │       │   │
│  │  │全局配置    │ │数据状态    │ │列配置      │ │ 表格配置上下文    │       │   │
│  │  └────────────┘ └──────┬─────┘ └────────────┘ └───────────────────┘       │   │
│  │                        │                                                  │   │
│  └────────────────────────┼──────────────────────────────────────────────────┘   │
│                           │                                                     │
│  ┌────────────────────────▼──────────────────────────────────────────────────┐   │
│  │                         Hooks 层（插件能力）                               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐     │   │
│  │  │useProTable  │ │ useRequest  │ │ useUrlSync  │ │useSearchSchema   │     │   │
│  │  │实例管理     │ │ 数据请求    │ │ URL同步     │ │ 查询方案         │     │   │
│  │  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├──────────────────┤     │   │
│  │  │useVirtualScr│ │ useDragSort │ │ useResponsive││    useCache      │     │   │
│  │  │虚拟滚动     │ │ 拖拽排序    │ │ 响应式适配   │ │ 数据缓存         │     │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └──────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                           │                                                     │
│  ┌────────────────────────▼──────────────────────────────────────────────────┐   │
│  │                        Core 层（核心引擎）                                │   │
│  │  ┌────────────┐ ┌─────────────────┐ ┌──────────────────────┐              │   │
│  │  │ DataStore  │ │ RequestEngine   │ │   ColumnRender       │              │   │
│  │  │ 状态管理   │ │ 请求执行引擎    │ │   列渲染系统         │              │   │
│  │  └────────────┘ └─────────────────┘ └──────────────────────┘              │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                        Schema 层（配置定义）                              │   │
│  │           ProColumnType - 列配置描述（类型定义）                          │   │
│  │           ProTableProps - 组件属性（类型定义）                           │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                        Utils 层（工具支撑）                               │   │
│  │  ┌──────────────┐ ┌──────────┐ ┌──────────────────┐                       │   │
│  │  │columnRender  │ │cellMerge │ │defineEnumMap     │                       │   │
│  │  │ 列渲染工具   │ │单元格合并│ │ 枚举映射定义     │                       │   │
│  │  └──────────────┘ └──────────┘ └──────────────────┘                       │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 层级职责总览

| 层级              | 文件路径                                           | 核心职责           | 关键组件/类                                                                  |
| --------------- | ---------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| **Schema 层**    | `types.ts`, `types-action-button.ts`           | 定义列配置结构和组件属性类型 | `ProColumnType`, `ProTableProps`, `ProTableActionType`                  |
| **Core 层**      | `store/`, `request/`, `utils/columnRender.tsx` | 表格状态管理和请求引擎核心  | `DataStore`, `RequestEngine`, `columnRender`                            |
| **Context 层**   | `context/`                                     | React 上下文传递机制  | `RootContext`, `DataContext`, `ColumnContext`, `TableConfigContext`     |
| **Hooks 层**     | `hooks/`                                       | 可复用逻辑封装（插件能力）  | `useProTable`, `useRequest`, `useUrlSync`, `useVirtualScroll`           |
| **Features 层**  | `features/`                                    | 表格核心功能模块       | `QueryForm`, `TableRenderer`, `Toolbar`, `Pagination`, `BatchOperation` |
| **Editable 层**  | `editable/`                                    | 可编辑表格功能        | `useEditableTable`, `EditableCell`, `EditableActions`                   |
| **Component 层** | `components/`                                  | 辅助组件           | `CardView`, `SkeletonTable`, `DragSortTable`, `SearchSchemaSelector`    |
| **Utils 层**     | `utils/`                                       | 工具函数支撑         | `columnRender`, `cellMerge`, `defineEnumMap`                            |

### 2.3 层级依赖关系

```
Schema 层（types.ts）
    ▲
    │ 被引用（类型约束）
    │
所有层都依赖 Schema 层的类型定义

Core 层 ────驱动───→ Context 层 ────传递───→ Features 层
(DataStore)         (三层上下文)         (QueryForm/TableRenderer/Toolbar)
(RequestEngine)                                │
(columnRender)                                 ▼
                                          Component 层
                                          (CardView/SkeletonTable)
                                              │
Hooks 层 ────扩展───┘
(useUrlSync/useCache/useVirtualScroll)

Utils 层 ────支撑───→ 所有层
(columnRender/cellMerge/defineEnumMap)
```

**核心设计原则**：

- **单向数据流**：Schema → DataStore → RequestEngine → 更新 DataStore → UI 重新渲染
- **关注点分离**：状态管理（Core）与视图渲染（Features）完全解耦
- **事件驱动**：通过发布-订阅模式实现状态变更通知
- **可插拔扩展**：通过 Hooks 层实现功能的动态扩展

***

## 三、使用方式总览

ProTable 提供多种使用方式，从简单到复杂，满足不同场景需求：

| 使用方式 | 适用场景 | 复杂度 | 核心特点 |
|----------|----------|--------|----------|
| **纯 ProTable 组件** | 快速构建表格，自动处理数据请求和状态 | 低 | 一行代码完成表格，自带搜索、分页、工具栏 |
| **ref 操作表格** | 需要在外部触发表格操作（刷新、重置等） | 中 | 通过 ref 调用 reload/reset/getSelectedRows 等方法 |
| **useProTable 简化模式** | 需要访问表格状态和实例，无需自定义 store | 中 | 无需 createDataStore，直接获取 instance、dataSource、loading |
| **useProTable 完整模式** | 需要自定义 store、初始数据等高级配置 | 高 | 手动创建 DataStore，精细控制表格行为 |
| **Provider 跨组件访问** | 父组件创建实例，子组件深度访问表格状态 | 中 | 通过 Context 下发实例，子组件用 useProTableContext 访问 |
| **DataContext 表格内部** | 在表格列渲染器中访问表格状态 | 中 | ProTable 内部自动包裹 Provider，列渲染器直接用 useDataContext |

**快速上手示例**：

```tsx
// 方式一：纯 ProTable 组件（最简单）
<ProTable columns={columns} request={fetchData} />

// 方式二：ref 操作表格
const tableRef = useRef<ProTableActionType>(null);
<ProTable ref={tableRef} columns={columns} request={fetchData} />
tableRef.current?.reload();

// 方式三：useProTable 简化模式（推荐）
const { instance, bindingProps, dataSource, loading } = useProTable({
  columns,
  request: fetchData,
});
<ProTable {...bindingProps} />

// 方式四：useProTable 完整模式（自定义 store）
const store = createDataStore({ initialQuery: {...} });
const { instance, bindingProps } = useProTable({ store, columns, request: fetchData });
<ProTable {...bindingProps} />

// 方式五：Provider 跨组件访问
const { Provider, bindingProps } = useProTable({ columns, request: fetchData });
<Provider>
  <ProTable {...bindingProps} />
  <ChildComponent />  {/* 子组件可通过 useProTableContext() 访问实例 */}
</Provider>

// 方式六：DataContext 在表格内部使用
const { action, store } = useDataContext();
action.reload();
```

***

## 四、Schema 层

### 3.1 ProColumnType（列配置）

列配置是 ProTable 的核心，定义于 `types.ts`：

```typescript
interface ProColumnType<T = Record<string, unknown>> {
  dataIndex?: string | string[];              // 数据字段路径，支持嵌套
  title?: ReactNode;                          // 列标题
  valueType?: ProColumnValueType;             // 值类型，决定渲染方式
  valueEnum?: Record<string, { text: string; color?: string; status?: string }>;
  emptyText?: ReactNode;                      // 空值显示文本（默认 '--'）
  hideInSearch?: boolean;                     // 是否在查询表单中隐藏
  hideInTable?: boolean;                      // 是否在表格中隐藏
  disableInSetting?: boolean;                 // 是否在列设置中禁用
  search?: false | ProFormSchema;             // 查询表单配置，设为 false 隐藏
  ellipsis?: boolean;                         // 是否省略显示
  copyable?: boolean;                         // 是否可拷贝
  copyText?: (text: unknown, record: T) => string; // 自定义复制内容
  width?: number | string;                    // 列宽
  fixed?: 'left' | 'right';                   // 固定列
  align?: 'left' | 'center' | 'right';        // 对齐方式
  tooltip?: string;                           // 列标题提示
  cellTooltip?: boolean | string | ((text: unknown, record: T) => string);
  dateFormat?: DateFormatType;                // 日期格式化（默认 'YYYY-MM-DD'）
  moneySymbol?: string;                       // 货币符号（默认 '¥'）
  precision?: number;                         // 小数位数（默认 2）
  thousandsSeparator?: boolean;               // 是否千分位（默认 true）
  render?: (dom: ReactNode, record: T, index: number, action: ProTableActionType, schema: ProColumnType<T>) => ReactNode;
  renderText?: (text: unknown, record: T, index: number) => unknown;
  oprTools?: OprToolConfig<T>[];              // 操作按钮组配置（用于 opr 类型）
  proTableConfig?: ProTableConfig;            // 子表格配置（用于 proTable 类型）
  editable?: boolean | ((record: T, index: number) => boolean) | EditableConfig;
  children?: ProColumnType<T>[];              // 分组表头子列
  summary?: boolean | { type: string; render: (data: T[]) => ReactNode };
  filters?: { text: string; value: string }[]; // 筛选配置
  sorter?: boolean | ((a: T, b: T) => number); // 排序配置
  defaultSortOrder?: 'ascend' | 'descend';    // 默认排序顺序
}
```

### 3.2 ProColumnValueType（值类型）

| 类型              | 说明     | 渲染结果                |
| --------------- | ------ | ------------------- |
| `text`          | 文本     | 纯文本显示，支持省略和拷贝       |
| `number`        | 数字     | 千分位格式化              |
| `money`         | 金额     | 货币符号 + 千分位 + 小数     |
| `percent`       | 百分比    | 百分比格式化              |
| `date`          | 日期     | YYYY-MM-DD          |
| `dateTime`      | 日期时间   | YYYY-MM-DD HH:mm:ss |
| `time`          | 时间     | HH:mm:ss            |
| `dateRange`     | 日期范围   | 开始 \~ 结束            |
| `dateTimeRange` | 日期时间范围 | 开始 \~ 结束            |
| `select`        | 下拉选择   | 根据 valueEnum 显示文本   |
| `radio`         | 单选     | 根据 valueEnum 显示文本   |
| `checkbox`      | 多选     | 根据 valueEnum 显示标签   |
| `switch`        | 开关     | 开关状态显示              |
| `tag`           | 标签     | 彩色标签                |
| `avatar`        | 头像     | 圆形头像                |
| `image`         | 图片     | 缩略图 + 预览            |
| `link`          | 链接     | 可点击链接               |
| `progress`      | 进度条    | 进度条组件               |
| `code`          | 代码     | 等宽字体显示              |
| `json`          | JSON   | 格式化 JSON            |
| `textarea`      | 文本域    | 多行文本                |
| `enum`          | 枚举     | 根据 valueEnum 显示标签   |
| `index`         | 序号     | 自动序号                |
| `indexBorder`   | 带边框序号  | 带边框的序号              |
| `opr`           | 操作列    | 操作按钮组               |
| `proTable`      | 子表格    | 嵌套表格                |

### 3.3 ProTableProps（组件属性）

```typescript
interface ProTableProps<T = Record<string, unknown>> {
  columns: ProColumnType<T>[];                // 列配置（必填）
  request?: ProTableRequest<T>;               // 数据请求函数
  dataSource?: T[];                           // 静态数据源（与 request 二选一）
  params?: Record<string, unknown>;           // 额外查询参数
  defaultPageSize?: number;                   // 默认每页条数（默认 20）
  pageSizeOptions?: number[];                 // 分页大小选项（默认 [10,20,50,100]）
  rowKey?: string | ((record: T) => string);  // 行标识（默认 'id'）
  
  // 查询表单
  search?: boolean | SearchConfig;
  
  // 工具栏
  toolbar?: ToolbarConfig | false;
  
  // 行选择
  rowSelection?: RowSelectionConfig | boolean;
  
  // 批量操作
  batchOperation?: BatchOperationConfig;
  
  // 分页
  pagination?: PaginationConfig | false;
  
  // 可编辑表格
  editable?: EditableConfig<T>;
  
  // 请求控制
  manual?: boolean;                           // 是否手动触发请求
  debounceTime?: number;                      // 请求防抖时间（毫秒，默认 300）
  polling?: number | PollingConfig;           // 轮询间隔（毫秒）
  beforeRequest?: (params: Record<string, unknown>) => Record<string, unknown>;
  afterRequest?: (data: T[], total: number) => { data: T[]; total: number };
  onRequestError?: (error: Error) => void;
  postData?: (data: T[]) => T[];
  
  // 高级功能
  urlSync?: boolean | UrlSyncConfig;          // URL 同步配置
  searchSchema?: SearchSchemaConfig;          // 查询方案配置
  virtualScroll?: boolean;                    // 是否启用虚拟滚动
  dragSort?: boolean | DragSortConfig;        // 是否启用拖拽排序
  cardMode?: boolean;                         // 是否支持卡片视图切换
  viewMode?: 'table' | 'card';                // 视图模式（默认 'table'）
  cache?: boolean | CacheConfig;              // 是否启用数据缓存
  cacheKey?: string;                          // 缓存 key
  
  // 事件处理器
  onCreate?: (config: ActionButtonConfig<T>) => void;
  onEdit?: (config: ActionButtonConfig<T>) => void;
  onView?: (config: ActionButtonConfig<T>) => void;
  onDelete?: (config: ActionButtonConfig<T>) => void;
  onExport?: (config: ActionButtonConfig<T>) => void;
  onImport?: (config: ActionButtonConfig<T>) => void;
}
```

### 3.4 ProTableActionType（表格实例方法）

| 方法                                     | 说明               |
| -------------------------------------- | ---------------- |
| `reload(resetPageIndex?)`              | 重新加载数据，可选择是否重置页码 |
| `reloadAndRest()`                      | 重置并重新加载          |
| `reset()`                              | 重置查询条件和分页        |
| `clearSelected()`                      | 清空选中行            |
| `setSelectedRows(rows)`                | 设置选中行            |
| `setSelectedRowKeys(keys)`             | 设置选中行 keys       |
| `getSelectedRows()`                    | 获取选中行数据          |
| `getSelectedRowKeys()`                 | 获取选中行 keys       |
| `startEditable(rowKey)`                | 开始编辑指定行          |
| `cancelEditable(rowKey)`               | 取消编辑             |
| `saveEditable(rowKey)`                 | 保存编辑             |
| `deleteEditable(rowKey)`               | 删除行              |
| `getPagination()`                      | 获取分页信息           |
| `setPagination({ current, pageSize })` | 设置分页             |
| `getParams()`                          | 获取查询参数           |
| `setParams(params)`                    | 设置查询参数           |
| `getFormInstance()`                    | 获取查询表单实例         |
| `startPolling()`                       | 开始轮询             |
| `stopPolling()`                        | 停止轮询             |
| `openDialog(config)`                   | 打开弹窗             |
| `confirm(config)`                      | 确认对话框            |
| `scrollToIndex(index)`                 | 滚动到指定行（虚拟滚动）     |
| `scrollToTop()`                        | 滚动到顶部（虚拟滚动）      |
| `scrollToBottom()`                     | 滚动到底部（虚拟滚动）      |
| `resetDragSort()`                      | 重置拖拽排序           |
| `clearCache()`                         | 清除缓存             |

### 3.5 ToolbarConfig（工具栏配置）

```typescript
interface ToolbarConfig {
  title?: ReactNode;                          // 工具栏标题
  subTitle?: ReactNode;                       // 副标题
  description?: ReactNode;                    // 描述
  showRefresh?: boolean;                      // 显示刷新按钮（默认 false）
  showDensity?: boolean;                      // 显示密度切换（默认 false）
  showColumnSetting?: boolean;                // 显示列设置（默认 false）
  showFullscreen?: boolean;                   // 显示全屏按钮（默认 false）
  leftRender?: ReactNode;                     // 左侧自定义渲染
  rightRender?: ReactNode;                    // 右侧自定义渲染
  toolbarRender?: ReactNode | ((toolbar: ReactNode) => ReactNode);
  actions?: ActionButtonConfig[];             // 操作按钮配置
}
```

***

## 五、Core 层

Core 层是整个表格的状态管理引擎，位于 `store/` 和 `request/` 目录，不依赖 React，可独立运行。

### 11.1 DataStore — 数据状态管理中心

**文件**：`store/DataStore.ts`

**职责**：管理所有表格数据状态，采用发布-订阅模式实现状态变更通知

**核心数据结构**：

```typescript
interface DataStoreState<T = Record<string, unknown>> {
  dataSource: T[];                            // 数据源
  loading: boolean;                           // 加载状态
  error: Error | null;                        // 错误信息
  total: number;                              // 总条数
  query: Record<string, unknown>;             // 查询条件
  pagination: { current: number; pageSize: number };
  sorter: { field?: string; order?: 'ascend' | 'descend' };
  filters: Record<string, unknown>;           // 筛选状态
  selectedRowKeys: (string | number)[];       // 选中行 keys
  selectedRows: T[];                          // 选中行数据
  isPolling: boolean;                         // 轮询状态
  pollingInterval: number;                    // 轮询间隔
}

class DataStore<T = Record<string, unknown>> {
  private _state: DataStoreState<T>;
  private _listeners: Set<StateChangeListener<T>>;
}
```

**关键方法**：

| 方法                          | 说明                     |
| --------------------------- | ---------------------- |
| `getState()`                | 获取当前完整状态               |
| `setDataSource(dataSource)` | 设置数据源                  |
| `setLoading(loading)`       | 设置加载状态                 |
| `setTotal(total)`           | 设置总条数                  |
| `setQuery(query)`           | 设置查询条件（连锁变更：重置页码、清空选中） |
| `setPage(current)`          | 设置页码（保留选中状态，支持跨页选择）    |
| `setPageSize(pageSize)`     | 设置每页条数（连锁变更：重置页码、清空选中） |
| `setSorter(field, order)`   | 设置排序（连锁变更：重置页码）        |
| `setFilters(filters)`       | 设置筛选（连锁变更：重置页码）        |
| `reset()`                   | 重置所有状态到初始值             |
| `subscribe(listener)`       | 订阅状态变化（返回取消订阅函数）       |
| `_notify(key, prevValue)`   | 通知所有订阅者                |

**状态变更的"副作用链"**：

| 操作方法                      | 主变更    | 连锁变更                                                                    |
| ------------------------- | ------ | ----------------------------------------------------------------------- |
| `setQuery(query)`         | 更新查询条件 | ① pagination 回到第 1 页 ② 清空 selectedRowKeys ③ 清空 selectedRows             |
| `setPageSize(size)`       | 更新每页条数 | ① pagination 回到第 1 页 ② 清空 selectedRowKeys ③ 清空 selectedRows             |
| `setPage(page)`           | 更新页码   | 仅更新页码（保留选中状态，支持跨页选择）                                                    |
| `setSorter(field, order)` | 更新排序   | ① pagination 回到第 1 页                                                    |
| `setFilters(filters)`     | 更新筛选   | ① pagination 回到第 1 页                                                    |
| `reset()`                 | 恢复初始状态 | 同时更新 query、pagination、sorter、filters、selectedRowKeys、selectedRows、error |

### 11.2 RequestEngine — 请求执行引擎

**文件**：`request/RequestEngine.ts`

**职责**：封装请求执行、取消、防抖，管理请求生命周期

**核心实现**：

```typescript
class RequestEngineImpl {
  private abortController: AbortController | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async execute(params) {
    this.cancel();                            // ① 取消上一次请求
    this.abortController = new AbortController();
    const response = await request(finalParams);
    // ... 处理响应
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();           // ② 使用 AbortController 取消请求
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

| 策略             | 解决的问题        | 实现方式            |
| -------------- | ------------ | --------------- |
| 请求取消（cancel）   | 旧请求响应覆盖新请求   | AbortController |
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
```

**通用处理**：

- 自动处理空值（`emptyText`）
- 自动处理省略（`ellipsis`）
- 自动处理拷贝（`copyable`）
- 自动处理 tooltip（`cellTooltip`）

***

## 六、Context 层

**文件**：`context/`

Context 层负责在 React 组件树中传递状态，避免 prop drilling。共有 4 个 Context，分为三层架构。

### 11.1 上下文体系总览

| Context                | 文件                       | 职责                              | 作用域  |
| ---------------------- | ------------------------ | ------------------------------- | ---- |
| **RootContext**        | `RootContext.tsx`        | 全局配置层（props、rowKey、getRowKey）   | 整个表格 |
| **DataContext**        | `DataContext.tsx`        | 数据状态层（DataStore 状态 + action 方法） | 整个表格 |
| **ColumnContext**      | `ColumnContext.tsx`      | 列配置层（columns、density、列设置）       | 整个表格 |
| **TableConfigContext** | `TableConfigContext.tsx` | 表格配置上下文                         | 整个表格 |

### 11.2 RootContext — 全局配置层

```typescript
interface RootContextValue<T = Record<string, unknown>> {
  props: ProTableProps<T>;                    // 组件原始属性
  rowKey: string | ((record: T) => string);   // 行标识配置
  getRowKey: (record: T) => string;           // 获取行 key 的函数
}
```

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
  columns: ProColumnType<T>[];                // 列配置数组
  density: 'default' | 'middle' | 'compact'; // 表格密度
  handleColumnsChange: (columns: ProColumnType<T>[]) => void;
  handleDensityChange: (density: 'default' | 'middle' | 'compact') => void;
}
```

***

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
  title?: string;                             // 批量操作标题
  description?: string;                       // 描述
  operations?: BatchOperationItem[];          // 操作列表
  showClearSelected?: boolean;                // 显示清空选中按钮
}
```

### 11.6 TableDialog — 表格弹窗

**文件**：`features/TableDialog.tsx`

**职责**：提供表格弹窗能力（openDialog / confirm）

**集成方式**：与 ProDialog 组件深度集成

***

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
  prefix?: string;                            // 参数前缀
  include?: string[];                         // 包含的参数
  exclude?: string[];                         // 排除的参数
}
```

### 11.4 useSearchSchema — 查询方案保存/切换

**文件**：`hooks/useSearchSchema.ts`

**职责**：支持保存和切换查询方案

**配置**：

```typescript
interface SearchSchemaConfig {
  enabled?: boolean;                          // 是否启用
  persistenceKey?: string;                    // 持久化 key
  schemas?: Array<{ key: string; name: string; params: Record<string, unknown> }>;
}
```

### 11.5 useVirtualScroll — 虚拟滚动

**文件**：`hooks/useVirtualScroll.ts`

**职责**：优化大数据量表的渲染性能，只渲染可视区域内的行

**配置**：

```typescript
interface VirtualScrollConfig {
  itemHeight?: number;                        // 行高度
  overscan?: number;                          // 可视区域外额外渲染的行数
  containerHeight?: number;                   // 容器高度
}
```

### 11.6 useDragSort — 拖拽排序

**文件**：`hooks/useDragSort.ts`

**职责**：实现拖拽排序功能

**配置**：

```typescript
interface DragSortConfig {
  type?: 'handle' | 'row';                    // 拖拽模式
  handleRender?: () => ReactNode;             // 自定义拖拽句柄
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
  maxAge?: number;                            // 缓存过期时间（毫秒）
  maxSize?: number;                           // 最大缓存条数
}
```

***

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
  type?: 'single' | 'multiple';               // 编辑模式（默认 'single'）
  editableKeys?: (string | number)[];         // 当前编辑行 keys
  onChange?: (editableKeys: (string | number)[], editableRows: T[]) => void;
  onSave?: (rowKey: string | number, data: T, row: T) => Promise<boolean | void>;
  onDelete?: (rowKey: string | number, row: T) => Promise<boolean | void>;
  onCancel?: (rowKey: string | number, row: T, newRow?: T) => Promise<boolean | void>;
  actionRender?: (row: T, config: EditableConfig<T>, defaultDom: ReactNode[]) => ReactNode[];
}
```

***

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

***

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

***

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

***

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

***

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

| 维度   | ProForm 响应式               | ProTable DataStore              |
| ---- | ------------------------- | ------------------------------- |
| 机制   | Proxy 自动拦截 get/set        | 手动调用 setXxx 方法                  |
| 粒度   | 属性级（每个 key 一个 Dep）        | 状态级（每个 setXxx 手动通知）             |
| 依赖收集 | 自动（effect 执行时收集）          | 手动（subscribe 订阅）                |
| 使用方式 | `state.values.name = 'x'` | `store.setQuery({ name: 'x' })` |
| 适用场景 | 字段级细粒度更新                  | 表格级整体状态同步                       |

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

| 策略             | 解决的问题        | 实现方式            |
| -------------- | ------------ | --------------- |
| 请求取消（cancel）   | 旧请求响应覆盖新请求   | AbortController |
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

| 分类 | 导出内容 |
|------|----------|
| **类型** | `ProTableProps`, `ProTableActionType`, `ProColumnType`, `ProColumnValueType`, `ProTableRequest`, `ProTableRequestParams`, `ProTableRequestResponse`, `ProTableToolbarConfig`, `ProTableBatchOperationConfig`, `ProTableRowSelectionConfig`, `TableDensity`, `OpenDialogConfig`, `ConfirmDialogConfig`, `DialogReturnProps`, `ProTableNEventHandlers`, `OprActionButtonConfig`, `ToolbarActionButtonConfig`, `OprColumnConfig`, `ToolbarActionConfig` |
| **组件** | `ProTable`, `QueryForm`, `TableRenderer`, `Toolbar`, `Pagination`, `BatchOperation`, `CardView`, `ViewModeSwitch`, `SkeletonTable`, `SkeletonCard`, `SearchSchemaSelector`, `DragSortTable`, `EditableActions`, `EditableCell`, `openDialog`, `confirm` |
| **Hooks** | `useProTable`, `useRequest`, `useUrlSync`, `useSearchSchema`, `useVirtualScroll`, `useDragSort`, `useCache`, `getGlobalCache`, `removeGlobalCache`, `clearAllGlobalCaches`, `useResponsive`, `useResponsiveColumns`, `useEditableTable` |
| **Context** | `RootProvider`, `DataProvider`, `ColumnProvider`, `TableConfigProvider`, `useRootContext`, `useDataContext`, `useColumnContext`, `useTableConfig`, `useMergedConfig` |
| **Core** | `createDataStore`, `createRequestEngine` |
| **Registry** | `customRendererRegistry`, `registerCellRenderer`, `unregisterCellRenderer`, `registerCellRenderers`, `getCellRenderer`, `hasCellRenderer` |
| **工具函数** | `renderColumnByValueType`, `createColumnRender`, `convertColumns`, `formatNumber`, `formatMoney`, `formatPercent`, `formatDate`, `getNestedValue`, `copyToClipboard`, `defineEnumMap`, `createRowMerge`, `createColMerge`, `combineMerge`, `calculateMergeState`, `getCellMergeProps` |

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
    { title: '状态', dataIndex: 'status', valueType: 'enum', valueEnum: {
      active: { text: '启用', status: 'success' },
      disabled: { text: '禁用', status: 'error' },
    }},
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime' },
    { title: '金额', dataIndex: 'amount', valueType: 'money' },
  ]}
  request={async (params) => {
    const res = await api.getUsers(params);
    return { data: res.list, total: res.total };
  }}
/>
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
    { title: '状态', dataIndex: 'status', editable: {
      component: 'Select',
      componentProps: {
        options: [
          { label: '启用', value: 'active' },
          { label: '禁用', value: 'disabled' },
        ],
      },
    }},
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
      <span style={{ fontSize: 12, marginLeft: 8, color: '#86909c' }}>
        {percent}%
      </span>
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
          <Tag key={idx} color={config?.color}>{config?.text || tag}</Tag>
        );
      })}
    </div>
  );
});

// 在列配置中使用自定义渲染器
const columns = [
  { title: '评分', dataIndex: 'rating', valueType: 'rate' },
  { title: '完成度', dataIndex: 'completion', valueType: 'customProgress' },
  { title: '标签', dataIndex: 'tags', valueType: 'tagGroup',
    valueEnum: {
      hot: { text: '热门', color: 'red' },
      new: { text: '新品', color: 'blue' },
      recommended: { text: '推荐', color: 'green' },
    },
  },
];

<ProTable columns={columns} request={fetchData} />
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
      <div>当前数据：{dataSource.length} 条，加载状态：{loading ? '加载中' : '已完成'}</div>
      <ProTable {...bindingProps} />
    </div>
  );
}
```

**完整用法（自定义 store）**：

```tsx
import { ProTable, useProTable, createDataStore } from '@/pro-components/ProTable';

function UserTable() {
  const store = useMemo(() => createDataStore<User>({
    initialQuery: { status: 'active' },
    initialPagination: { current: 1, pageSize: 20 },
  }), []);

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

| API | 返回 | 适用场景 |
|------|------|----------|
| `useProTableContext<T>()` | `ProTableContextValue<T> \| null` | 在子组件中访问表格实例和状态 |
| `Provider` | 包裹子组件 | 父组件创建实例后下发，子组件任意深度消费 |

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
import { ProTable, DataProvider, useDataContext, createDataStore, RootProvider, ColumnProvider } from '@/pro-components/ProTable';

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
  
  const action = useMemo(() => ({
    reload: () => store.reload(),
    clearSelected: () => store.clearSelected(),
    getSelectedRows: () => store.selectedRows,
    getSelectedRowKeys: () => store.selectedRowKeys,
    setSelectedRowKeys: (keys) => {
      const rows = store.dataSource.filter(row => keys.includes(row.id));
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
  }), [store]);

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
  rowKey="id"
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
          await api.batchUpdate(selectedRows.map(r => r.id), { status: 'enabled' });
        },
      },
      {
        key: 'batchDisable',
        text: '批量禁用',
        status: 'warning',
        onClick: async (selectedRows) => {
          await api.batchUpdate(selectedRows.map(r => r.id), { status: 'disabled' });
        },
      },
      {
        key: 'batchDelete',
        text: '批量删除',
        status: 'danger',
        onClick: async (selectedRows) => {
          await api.batchDelete(selectedRows.map(r => r.id));
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
    interval: 5000,                    // 5 秒轮询一次
    enabled: true,                      // 是否启用
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
    maxAge: 60000,                      // 缓存有效期 60 秒
    maxSize: 10,                        // 最大缓存条目数
  }}
  cacheKey="user_list_cache"            // 缓存 key
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
      render: (_, record) => (
        <span style={{ cursor: 'move', fontSize: 16 }}>⋮⋮</span>
      ),
    },
    { title: '名称', dataIndex: 'name' },
    { title: '排序', dataIndex: 'sortOrder' },
  ]}
  request={fetchData}
  dragSort={{
    type: 'handle',                     // 'handle' 或 'row'
    handleRender: () => (
      <span style={{ cursor: 'move', color: '#86909c' }}>⋮⋮</span>
    ),
    onDragSortEnd: async (newDataSource, oldDataSource) => {
      // 保存排序结果到后端
      const sortedIds = newDataSource.map(item => item.id);
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
      column: 3,                         // 默认 3 列
      xs: 1,                             // 超小屏 1 列
      sm: 2,                             // 小屏 2 列
      lg: 3,                             // 大屏 3 列
    },
  }}
  viewMode="card"                        // 默认卡片视图
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

<ProTable columns={columns} dataSource={dataSource} />
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

