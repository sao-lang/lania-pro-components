# ProTableN

Schema 驱动的企业级表格组件，通过声明式列配置实现数据展示、查询、排序、筛选、编辑等全功能。

## 架构设计

### 整体架构

```
ProTable = DataStore + ColumnSchema + QueryForm + TableRenderer
```

```
ProTableN
├── Store 层（数据状态管理）
│   └── DataStore - 基于 Proxy 的响应式数据状态中心
│
├── Request 层（请求引擎）
│   └── RequestEngine - 请求执行、防抖、取消、请求前后钩子
│
├── Context 层（三层上下文）
│   ├── RootContext   - 全局配置层（props、rowKey、getRowKey）
│   ├── DataContext   - 数据状态层（DataStore 状态 + action 方法）
│   └── ColumnContext - 列配置层（columns、density、列设置）
│
├── Features 层（功能模块）
│   ├── QueryForm          - 查询表单（列配置自动生成搜索 Schema）
│   ├── TableRenderer      - 表格渲染器（valueType 渲染 + 行选择）
│   ├── Toolbar            - 工具栏（刷新、密度、列设置、全屏）
│   ├── Pagination         - 分页组件
│   ├── BatchOperation     - 批量操作
│   ├── TableDialog        - 表格弹窗（openDialog / confirm）
│   └── ActionButtonRenderer - 操作按钮渲染器
│
├── Hooks 层（插件能力）
│   ├── useProTable     - 实例管理 Hook
│   ├── useRequest      - 数据请求 Hook（轮询、防抖、缓存、请求前后处理）
│   ├── useUrlSync      - URL 参数同步
│   ├── useSearchSchema - 查询方案保存/切换
│   ├── useVirtualScroll - 虚拟滚动
│   ├── useDragSort     - 拖拽排序
│   ├── useResponsive   - 响应式适配
│   └── useCache        - 数据缓存
│
├── Editable 层（可编辑表格）
│   ├── useEditableTable - 编辑状态管理 Hook
│   ├── EditableCell     - 可编辑单元格
│   └── EditableActions  - 编辑操作按钮
│
├── Components 层（辅助组件）
│   ├── CardView        - 卡片视图
│   ├── SkeletonTable   - 骨架屏加载
│   ├── SearchSchemaSelector - 查询方案选择器
│   ├── ViewModeSwitch  - 视图切换（表格/卡片）
│   └── DragSortTable   - 拖拽排序表格
│
└── Utils 层（工具函数）
    ├── columnRender - 列渲染系统（valueType → 渲染函数映射）
    ├── cellMerge    - 单元格合并
    └── defineEnumMap - 枚举映射定义
```

### 数据流

```
用户操作（搜索/排序/分页/筛选）
    ↓
更新 DataStore（setQuery/setPage/setSorter/setFilters）
    ↓
useRequest 监听 DataStore 变化
    ↓
RequestEngine.execute() 发起请求
    ↓
更新 DataStore（setDataSource/setTotal/setLoading）
    ↓
DataContext 通知订阅者 → UI 重新渲染
```

### Context 三层架构

```
RootContext（全局配置层）
├── props：组件原始属性
├── rowKey：行标识配置
└── getRowKey：获取行 key 的函数

DataContext（数据状态层）
├── 状态：dataSource、loading、error、total、query、pagination、sorter、filters
├── 选中：selectedRowKeys、selectedRows
├── 轮询：isPolling、pollingInterval
├── 方法：setDataSource、setLoading、setQuery、setPage、setSorter 等
├── action：ProTableActionType（reload、reset、startEditable 等）
└── formRef：查询表单引用

ColumnContext（列配置层）
├── columns：列配置数组
├── density：表格密度
├── handleColumnsChange：列配置变更回调
└── handleDensityChange：密度变更回调
```

## API 文档

### ProColumnType（列配置）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dataIndex | `string \| string[]` | - | 数据字段路径，支持嵌套 |
| title | `ReactNode` | - | 列标题 |
| valueType | `ProColumnValueType` | `'text'` | 值类型，决定渲染方式 |
| valueEnum | `Record<string, { text, color?, status? }>` | - | 值枚举（用于 select/radio/checkbox/tag/enum） |
| emptyText | `ReactNode` | `'--'` | 空值显示文本 |
| hideInSearch | `boolean` | `false` | 是否在查询表单中隐藏 |
| hideInTable | `boolean` | `false` | 是否在表格中隐藏 |
| disableInSetting | `boolean` | `false` | 是否在列设置中禁用 |
| search | `false \| ProFormSchema` | - | 查询表单配置，设为 false 隐藏 |
| ellipsis | `boolean` | `false` | 是否省略显示 |
| copyable | `boolean` | `false` | 是否可拷贝 |
| width | `number \| string` | - | 列宽 |
| fixed | `'left' \| 'right'` | - | 固定列 |
| align | `'left' \| 'center' \| 'right'` | - | 对齐方式 |
| tooltip | `string` | - | 列标题提示 |
| cellTooltip | `boolean \| string \| function` | - | 单元格 tooltip |
| dateFormat | `DateFormatType` | `'YYYY-MM-DD'` | 日期格式化 |
| moneySymbol | `string` | `'¥'` | 货币符号 |
| precision | `number` | `2` | 小数位数 |
| thousandsSeparator | `boolean` | `true` | 是否千分位 |
| render | `(dom, entity, index, action, schema) => ReactNode` | - | 自定义渲染函数 |
| renderText | `(text, record, index) => unknown` | - | 渲染前文本格式化 |
| oprTools | `OprToolConfig[]` | - | 操作按钮组配置（用于 opr 类型） |
| proTableConfig | `object` | - | 子表格配置（用于 proTable 类型） |
| editable | `boolean \| function \| EditableConfig` | - | 编辑配置 |
| children | `ProColumnType[]` | - | 分组表头子列 |
| summary | `boolean \| { type, render }` | - | 汇总配置 |
| filters | `{ text, value }[]` | - | 筛选配置 |
| sorter | `boolean \| function` | - | 排序配置 |
| defaultSortOrder | `'ascend' \| 'descend'` | - | 默认排序顺序 |

### ProColumnValueType（值类型）

| 类型 | 说明 | 渲染结果 |
|------|------|----------|
| `text` | 文本 | 纯文本显示，支持省略和拷贝 |
| `number` | 数字 | 千分位格式化 |
| `money` | 金额 | 货币符号 + 千分位 + 小数 |
| `percent` | 百分比 | 百分比格式化 |
| `date` | 日期 | YYYY-MM-DD |
| `dateTime` | 日期时间 | YYYY-MM-DD HH:mm:ss |
| `time` | 时间 | HH:mm:ss |
| `dateRange` | 日期范围 | 开始 ~ 结束 |
| `dateTimeRange` | 日期时间范围 | 开始 ~ 结束 |
| `select` | 下拉选择 | 根据 valueEnum 显示文本 |
| `radio` | 单选 | 根据 valueEnum 显示文本 |
| `checkbox` | 多选 | 根据 valueEnum 显示标签 |
| `switch` | 开关 | 开关状态显示 |
| `tag` | 标签 | 彩色标签 |
| `avatar` | 头像 | 圆形头像 |
| `image` | 图片 | 缩略图 + 预览 |
| `link` | 链接 | 可点击链接 |
| `progress` | 进度条 | 进度条组件 |
| `code` | 代码 | 等宽字体显示 |
| `json` | JSON | 格式化 JSON |
| `textarea` | 文本域 | 多行文本 |
| `enum` | 枚举 | 根据 valueEnum 显示标签 |
| `index` | 序号 | 自动序号 |
| `indexBorder` | 带边框序号 | 带边框的序号 |
| `opr` | 操作列 | 操作按钮组 |
| `proTable` | 子表格 | 嵌套表格 |

### ProTableProps（组件属性）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| columns | `ProColumnType[]` | - | 列配置（必填） |
| request | `(params) => Promise<{ data, total }>` | - | 数据请求函数 |
| dataSource | `T[]` | - | 静态数据源（与 request 二选一） |
| params | `Record<string, unknown>` | - | 额外查询参数 |
| defaultPageSize | `number` | `20` | 默认每页条数 |
| pageSizeOptions | `number[]` | `[10,20,50,100]` | 分页大小选项 |
| rowKey | `string \| (record) => string` | `'id'` | 行标识 |
| search | `object \| false` | - | 搜索表单配置，设为 false 隐藏 |
| toolbar | `ToolbarConfig \| false` | - | 工具栏配置，设为 false 隐藏 |
| batchOperation | `BatchOperationConfig` | - | 批量操作配置 |
| pagination | `PaginationConfig \| false` | - | 分页配置，设为 false 隐藏 |
| rowSelection | `RowSelectionConfig` | - | 行选择配置 |
| editable | `EditableConfig` | - | 可编辑表格配置 |
| manual | `boolean` | `false` | 是否手动触发请求 |
| debounceTime | `number` | `300` | 请求防抖时间（毫秒） |
| polling | `number \| PollingConfig` | - | 轮询间隔（毫秒） |
| beforeRequest | `(params) => params` | - | 请求前钩子 |
| afterRequest | `(data, total) => { data, total }` | - | 请求后钩子 |
| onRequestError | `(error) => void` | - | 请求错误回调 |
| postData | `(data) => data` | - | 数据格式化 |
| urlSync | `boolean \| UrlSyncConfig` | - | URL 同步配置 |
| searchSchema | `SearchSchemaConfig` | - | 查询方案配置 |
| virtualScroll | `boolean` | - | 是否启用虚拟滚动 |
| dragSort | `boolean \| DragSortConfig` | - | 是否启用拖拽排序 |
| cardMode | `boolean` | - | 是否支持卡片视图切换 |
| viewMode | `'table' \| 'card'` | `'table'` | 视图模式 |
| cache | `boolean \| CacheConfig` | - | 是否启用数据缓存 |
| cacheKey | `string` | - | 缓存 key |
| onCreate / onEdit / onView / onDelete | `function` | - | ActionButton 事件处理器 |
| onExport / onImport | `function` | - | 导入/导出事件处理器 |

### ProTableActionType（表格实例方法）

| 方法 | 说明 |
|------|------|
| `reload(resetPageIndex?)` | 重新加载数据，可选择是否重置页码 |
| `reloadAndRest()` | 重置并重新加载 |
| `reset()` | 重置查询条件和分页 |
| `clearSelected()` | 清空选中行 |
| `setSelectedRows(rows)` | 设置选中行 |
| `setSelectedRowKeys(keys)` | 设置选中行 keys |
| `getSelectedRows()` | 获取选中行数据 |
| `getSelectedRowKeys()` | 获取选中行 keys |
| `startEditable(rowKey)` | 开始编辑指定行 |
| `cancelEditable(rowKey)` | 取消编辑 |
| `saveEditable(rowKey)` | 保存编辑 |
| `deleteEditable(rowKey)` | 删除行 |
| `getPagination()` | 获取分页信息 |
| `setPagination({ current, pageSize })` | 设置分页 |
| `getParams()` | 获取查询参数 |
| `setParams(params)` | 设置查询参数 |
| `getFormInstance()` | 获取查询表单实例 |
| `startPolling()` | 开始轮询 |
| `stopPolling()` | 停止轮询 |
| `openDialog(config)` | 打开弹窗 |
| `confirm(config)` | 确认对话框 |
| `scrollToIndex(index)` | 滚动到指定行（虚拟滚动） |
| `scrollToTop()` | 滚动到顶部（虚拟滚动） |
| `scrollToBottom()` | 滚动到底部（虚拟滚动） |
| `resetDragSort()` | 重置拖拽排序 |
| `clearCache()` | 清除缓存 |

### ToolbarConfig（工具栏配置）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | `ReactNode` | - | 工具栏标题 |
| subTitle | `ReactNode` | - | 副标题 |
| description | `ReactNode` | - | 描述 |
| showRefresh | `boolean` | `false` | 显示刷新按钮 |
| showDensity | `boolean` | `false` | 显示密度切换 |
| showColumnSetting | `boolean` | `false` | 显示列设置 |
| showFullscreen | `boolean` | `false` | 显示全屏按钮 |
| leftRender | `ReactNode` | - | 左侧自定义渲染 |
| rightRender | `ReactNode` | - | 右侧自定义渲染 |
| toolbarRender | `ReactNode \| function` | - | 自定义工具栏渲染 |
| actions | `ActionButtonConfig[]` | - | 操作按钮配置 |

## 核心设计

### DataStore（数据状态管理）

基于发布-订阅模式的状态管理中心，管理所有表格数据状态：

- 管理数据源（`dataSource`）、加载状态（`loading`）、错误（`error`）、总数（`total`）
- 管理查询条件（`query`）、分页（`pagination`）、排序（`sorter`）、筛选（`filters`）
- 管理选中行（`selectedRowKeys`、`selectedRows`）
- 支持跨页选择：`preserveSelectedRowKeys` 保留跨页选中
- 自动处理删除最后一页数据后的分页调整
- 状态变更时通知所有订阅者

### RequestEngine（请求引擎）

请求执行与生命周期管理：

- 封装请求执行、取消、防抖
- 支持 `beforeRequest` 请求前参数转换
- 支持 `afterRequest` 响应后数据转换
- 支持 `postData` 数据格式化
- 支持 `onRequestError` 错误处理
- 支持 `AbortController` 请求取消

### QueryForm（查询表单）

从列配置自动生成查询表单 Schema：

- 根据 `valueType` 自动映射表单组件（text→Input, date→DatePicker, select→Select 等）
- 根据 `valueEnum` 自动生成选项
- 支持 `hideInSearch` 隐藏列
- 支持 `search` 自定义查询表单配置
- 搜索参数自动转换（如日期范围字段名后缀处理）

### ColumnRender（列渲染系统）

基于 `valueType` 的声明式列渲染：

- 20+ 内置值类型，覆盖常见业务场景
- 支持自定义渲染器注册（`CustomRendererRegistry`）
- 自动处理空值、省略、拷贝、tooltip 等通用功能
- 支持子表格（`proTable` 类型）和操作列（`opr` 类型）

### 可编辑表格

通过 `editable` 配置启用行内编辑：

- 单行编辑 / 多行编辑模式
- 编辑状态管理（`useEditableTable` Hook）
- 编辑单元格（`EditableCell`）自动切换编辑/展示模式
- 保存/取消/删除操作
- 编辑数据回滚（取消时恢复原始数据）

## 原理深入

### DataStore：发布-订阅模式的状态管理

DataStore 是 ProTableN 的数据中枢，管理表格的所有运行时状态。它采用**经典的发布-订阅模式**，但与 ProFormN 的 Proxy 响应式不同，DataStore 使用的是**显式的订阅-通知机制**。

#### 1. 核心架构

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

#### 2. 与 ProFormN 响应式系统的区别

| 维度 | ProFormN 响应式 | ProTableN DataStore |
|------|----------------|---------------------|
| 机制 | Proxy 自动拦截 get/set | 手动调用 setXxx 方法 |
| 粒度 | 属性级（每个 key 一个 Dep） | 状态级（每个 setXxx 手动通知） |
| 依赖收集 | 自动（effect 执行时收集） | 手动（subscribe 订阅） |
| 使用方式 | `state.values.name = 'x'` | `store.setQuery({ name: 'x' })` |
| 适用场景 | 字段级细粒度更新 | 表格级整体状态同步 |

**为什么 DataStore 不用 Proxy 响应式？** 表格的状态变化特点是"一次操作触发多个状态变更"——比如搜索时，需要同时更新 `query`（新查询条件）、`pagination`（回到第 1 页）、`selectedRowKeys`（清空选中）。如果用 Proxy 响应式，每次赋值都会触发一次通知，产生三次渲染；而 DataStore 的 `setQuery` 方法内部一次性更新三个状态，只通知一次。

#### 3. 订阅-通知机制

```typescript
// 订阅
const unsubscribe = store.subscribe((state, prevState) => {
  // state: 当前完整状态
  // prevState: 变更前的完整状态
  setDataSource(state.dataSource);
  setLoading(state.loading);
  // ...
});

// 取消订阅
unsubscribe();
```

**通知策略：** `_notify` 方法接收两个参数——变更的 key 和变更前的值。它会构造一个 `prevState`（把变更前的值替换进去），然后把完整的 `state` 和 `prevState` 一起传给所有监听器。这样监听器可以对比前后状态，决定是否需要更新 UI。

```typescript
// 源码简化版
private _notify(key, prevValue) {
  const prevState = { ...this._state, [key]: prevValue };
  this._listeners.forEach(listener => listener(this._state, prevState));
}
```

#### 4. 状态变更的"副作用链"

DataStore 的一个关键设计是：**某些状态变更会自动触发其他状态的连锁变更**。这保证了状态的一致性：

| 操作方法 | 主变更 | 连锁变更 |
|----------|--------|----------|
| `setQuery(query)` | 更新查询条件 | ① pagination 回到第 1 页 ② 清空 selectedRowKeys ③ 清空 selectedRows |
| `setPageSize(size)` | 更新每页条数 | ① pagination 回到第 1 页 ② 清空 selectedRowKeys ③ 清空 selectedRows |
| `setPage(page)` | 更新页码 | 仅更新页码（保留选中状态，支持跨页选择） |
| `setSorter(field, order)` | 更新排序 | ① pagination 回到第 1 页 |
| `setFilters(filters)` | 更新筛选 | ① pagination 回到第 1 页 |
| `reset()` | 恢复初始状态 | 同时更新 query、pagination、sorter、filters、selectedRowKeys、selectedRows、error |

**关键设计：** `setPage` 不会清空选中状态，这意味着用户可以跨页选择。而 `setQuery`、`setPageSize`、`setSorter`、`setFilters` 都会清空选中，因为数据源变了，之前的选中不再有意义。

### 完整数据流：从搜索按钮点击到表格渲染

```
用户点击"搜索"按钮
    ↓
QueryForm 收集表单值 → 触发 onSearch(values)
    ↓
store.setQuery({ keyword: 'test', status: 'active' })
    │
    ├── ① 更新 _state.query
    ├── ② 更新 _state.pagination = { current: 1, pageSize: 20 }
    ├── ③ 更新 _state.selectedRowKeys = []
    ├── ④ 更新 _state.selectedRows = []
    │
    └── _notify('query', prevQuery)    ← 通知所有监听器
          _notify('pagination', prevPagination)
          _notify('selectedRowKeys', prevKeys)
          _notify('selectedRows', prevRows)
          ↓
    useRequest Hook 监听到 DataStore 变化
          ↓
    ┌─────────────────────────────────────┐
    │ 构造请求参数                          │
    │ {                                    │
    │   page: 1,                           │
    │   pageSize: 20,                      │
    │   keyword: 'test',                   │
    │   status: 'active',                  │
    │   sorter: {},                        │
    │   filters: {},                       │
    │   ...params (额外参数)               │
    │ }                                    │
    └─────────────────────────────────────┘
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

### RequestEngine：请求防抖与取消机制

这是 ProTableN 请求层的核心实现，解决了两个高频问题：**快速连续操作时的请求风暴**和**旧请求覆盖新请求**。

```typescript
class RequestEngineImpl {
  private abortController: AbortController | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async execute(params) {
    this.cancel();  // ① 取消上一次请求（如果有）

    this.abortController = new AbortController();

    const response = await request(finalParams);
    // ... 处理响应
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();  // ② 使用 AbortController 取消请求
      this.abortController = null;
    }
  }

  debouncedExecute(params, wait) {
    return new Promise((resolve, reject) => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);  // ③ 清除旧定时器

      this.debounceTimer = setTimeout(async () => {  // ④ 设置新定时器
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

**请求取消 vs 请求防抖：**

| 策略 | 解决的问题 | 实现方式 |
|------|-----------|----------|
| 请求取消（cancel） | 旧请求响应覆盖新请求 | AbortController |
| 请求防抖（debounce） | 快速连续操作触发多次请求 | setTimeout |

两者配合使用：用户快速点击分页时，防抖确保只发一次请求；如果上一次请求还没返回就发起新请求，取消机制确保旧请求的响应被丢弃。

### 跨页选择：preserveSelectedRowKeys

```typescript
// 跨页选择的核心逻辑
setPage(current) {
  // 只更新页码，不清空选中状态
  this._state.pagination = { ...prev, current };
  this._notify('pagination', prev);
  // 注意：这里没有清空 selectedRowKeys！
}

setQuery(query) {
  // 查询条件变了，清空选中
  this._state.selectedRowKeys = [];
  this._state.selectedRows = [];
  // ...
}
```

**为什么 setPage 不清空选中？** 因为跨页选择的场景：用户在第 1 页选中了 3 条，翻到第 2 页选了 2 条，此时 `selectedRowKeys` 应该是 5 条。只有当用户改变查询条件（`setQuery`）或改变每页条数（`setPageSize`）时，才意味着数据源变了，需要清空选中。

## 使用示例

### 基础表格

```tsx
import { ProTableN } from '@/pro-components/ProTableN';

<ProTableN
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

### 带搜索和工具栏

```tsx
<ProTableN
  columns={[...]}
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

### 操作列

```tsx
<ProTableN
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

### 子表格（嵌套表格）

```tsx
<ProTableN
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

### 可编辑表格

```tsx
<ProTableN
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

### URL 同步

```tsx
<ProTableN
  urlSync={{
    prefix: 'user_',
    include: ['page', 'pageSize', 'keyword'],
  }}
  // URL 自动同步: ?user_page=1&user_pageSize=20&user_keyword=xxx
/>
```

### 查询方案

```tsx
<ProTableN
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

### 虚拟滚动（大数据量）

```tsx
<ProTableN
  virtualScroll={true}
  virtualScrollConfig={{
    itemHeight: 48,
    containerHeight: 600,
  }}
/>
```

### 通过 ref 操作表格

```tsx
const tableRef = useRef<ProTableActionType>(null);

<ProTableN ref={tableRef} ... />

// 外部操作
tableRef.current?.reload();
tableRef.current?.getSelectedRows();
tableRef.current?.setParams({ status: 'active' });
```