# ProTable

企业级表格组件，支持数据请求、筛选、分页、编辑等功能。

## API

### 类型定义

#### ProColumnValueType

列值类型：

`'text' | 'number' | 'money' | 'percent' | 'date' | 'dateTime' | 'time' | 'dateRange' | 'dateTimeRange' | 'select' | 'radio' | 'checkbox' | 'switch' | 'tag' | 'avatar' | 'image' | 'link' | 'progress' | 'code' | 'json' | 'textarea' | 'enum' | 'index' | 'indexBorder' | 'opr' | 'proTable'`

#### TableDensity

表格密度：`'default' | 'middle' | 'compact'`

#### ProTableRequestParams

请求参数。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `current` | `number` | - | 当前页码 |
| `pageSize` | `number` | - | 每页条数 |
| `sortField` | `string` | - | 排序字段 |
| `sortOrder` | `'ascend' \| 'descend'` | - | 排序方式 |
| `filters` | `Record<string, string[]>` | - | 筛选条件 |
| `params` | `Record<string, unknown>` | - | 查询表单值 |

#### ProTableRequestResponse

请求响应。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data` | `T[]` | - | 数据列表 |
| `total` | `number` | - | 总条数 |
| `success` | `boolean` | - | 是否成功 |

#### ProTableRequest

请求函数类型：

```tsx
type ProTableRequest<T = Record<string, unknown>> = (
  params: ProTableRequestParams,
  sort?: Record<string, 'ascend' | 'descend'>,
  filter?: Record<string, string[]>,
) => Promise<ProTableRequestResponse<T>>;
```

### ProColumnType

列配置，继承自 `Omit<TableColumnProps<T>, 'render' | 'title' | 'dataIndex' | 'filters' | 'onFilter' | 'sorter'>`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `dataIndex` | `string \| string[]` | - | 列数据在数据项中对应的路径 |
| `title` | `ReactNode` | - | 列标题 |
| `valueType` | `ProColumnValueType` | - | 值类型 - 用于自动渲染和筛选表单 |
| `emptyText` | `ReactNode` | - | 空值显示文本 |
| `valueEnum` | `Record<string, { text: string; color?: string; status?: string }>` | - | 值枚举 - 用于 select/radio/checkbox/tag 等类型 |
| `oprTools` | `OprToolConfig<T>[]` | - | 操作按钮组配置 - 用于 opr 类型 |
| `proTableConfig` | `{ columns, dataSource?, tableProps?, dataPath?, title?, bordered?, size?, pagination?, emptyText? }` | - | 子表格配置 - 用于 proTable 类型 |
| `dateFormat` | `DateFormatType` | - | 日期格式化格式 |
| `moneySymbol` | `string` | `'¥'` | 货币符号 |
| `precision` | `number` | `2` | 小数位数 |
| `thousandsSeparator` | `boolean` | `true` | 是否千分位展示 |
| `copyable` | `boolean` | - | 是否可拷贝 |
| `copyText` | `(text, record) => string` | - | 自定义复制内容的回调函数 |
| `ellipsis` | `boolean` | - | 是否可省略 |
| `componentProps` | `{ size?, width?, height?, preview?, objectFit?, borderRadius?, title?, description?, downloadName?, extraActions?, href?, target?, text?, color?, showText?, formatText? }` | - | 组件属性 - 用于 avatar/image/link/progress 等类型 |
| `render` | `(dom, entity, index, action, schema) => ReactNode` | - | 自定义渲染函数 |
| `renderText` | `(text, record, index) => unknown` | - | 渲染文本前的格式化 |
| `hideInSearch` | `boolean` | `true` | 是否在查询表单中显示 |
| `hideInTable` | `boolean` | `true` | 是否在表格中显示 |
| `disableInSetting` | `boolean` | `false` | 是否在设置中禁用 |
| `search` | `false \| (Omit<ProFormSchema, 'name'> & { order?, transform? })` | - | 查询表单中的字段配置 |
| `filters` | `{ text: ReactNode; value: unknown }[]` | - | 筛选配置 |
| `filterDropdown` | `boolean` | - | 是否支持筛选菜单 |
| `filterDropdownVisible` | `boolean` | - | 受控的筛选菜单可见状态 |
| `onFilterDropdownVisibleChange` | `(visible) => void` | - | 筛选菜单可见状态变化时调用 |
| `filterDropdownProps` | `Record<string, unknown>` | - | 自定义筛选菜单 |
| `onFilter` | `(value, record) => boolean` | - | 本地模式下，确定筛选的运行函数 |
| `sorter` | `boolean \| ((a, b) => number) \| 'ascend' \| 'descend'` | - | 排序函数 |
| `defaultSortOrder` | `'ascend' \| 'descend'` | - | 默认排序顺序 |
| `sortPriority` | `number` | - | 排序优先级 |
| `tooltip` | `string` | - | 列标题提示信息 |
| `cellTooltip` | `boolean \| string \| ((text, record, index) => ReactNode)` | - | 单元格 tooltip 配置 |
| `width` | `number \| string` | - | 列宽 |
| `minWidth` | `number` | - | 最小列宽 |
| `maxWidth` | `number` | - | 最大列宽 |
| `fixed` | `'left' \| 'right'` | - | 是否固定列 |
| `align` | `'left' \| 'center' \| 'right'` | - | 对齐方式 |
| `className` | `string` | - | 列类名 |
| `cellClassName` | `string \| ((record, index) => string)` | - | 自定义单元格类名 |
| `drag` | `boolean` | - | 是否可拖拽 |
| `editable` | `boolean \| ((record) => boolean) \| { component?, componentProps?, rules?, required?, formSchema? }` | - | 编辑配置 |
| `children` | `ProColumnType<T>[]` | - | 分组表头子列 |
| `summary` | `boolean \| { type: 'sum' \| 'avg' \| 'min' \| 'max' \| 'count'; render? }` | - | 汇总配置 |
| `actions` | `OprActionButtonConfig<T>[]` | - | 操作列按钮配置（新方式） |

### ProTableProps

继承自 `Omit<TableProps<T>, 'columns' | 'pagination' | 'rowSelection'>`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `columns` | `ProColumnType<T>[]` | - | 表格列配置 |
| `actionRef` | `React.Ref<ProTableActionType>` | - | 操作实例引用 |
| `dataSource` | `T[]` | - | 数据源（受控模式） |
| `request` | `ProTableRequest<T>` | - | 数据请求函数 |
| `instance` | `string` | - | 表格实例名称 |
| `params` | `Record<string, unknown>` | - | 获取数据的 key，用于缓存 |
| `onDataSourceChange` | `(dataSource) => void` | - | 数据变化回调 |
| `loading` | `boolean` | - | 加载状态（受控模式） |
| `headerTitle` | `ReactNode` | - | 表格标题 |
| `toolbar` | `ProTableToolbarConfig` | - | 工具栏配置 |
| `search` | `boolean \| { layout?, columns?, collapsible?, defaultCollapsed?, collapsedRows?, formProps?, searchButtonRender?, resetButtonRender?, showSearch?, showReset?, beforeSearch? }` | - | 是否显示搜索表单 |
| `rowSelection` | `ProTableRowSelectionConfig<T> \| boolean` | - | 行选择配置 |
| `batchOperation` | `ProTableBatchOperationConfig` | - | 批量操作配置 |
| `pagination` | `PaginationProps \| false` | - | 分页配置 |
| `defaultPageSize` | `number` | - | 默认分页大小 |
| `pageSizeOptions` | `number[]` | - | 分页大小选项 |
| `defaultExpandAllRows` | `boolean` | - | 是否默认展开所有行 |
| `defaultExpandedRowKeys` | `(string \| number)[]` | - | 默认展开的行 |
| `expandedRowKeys` | `(string \| number)[]` | - | 展开的行（受控） |
| `expandedRowRender` | `(record, index) => ReactNode` | - | 展开行渲染函数 |
| `expandProps` | `{ icon?, width?, columnTitle?, rowExpandable?, expandRowByClick? }` | - | 展开图标属性 |
| `density` | `TableDensity` | - | 表格密度 |
| `onDensityChange` | `(density) => void` | - | 表格密度变化回调 |
| `onColumnsStateChange` | `(columns) => void` | - | 列状态变化回调 |
| `dialogConfig` | `{ open?, confirm? }` | - | 弹窗默认配置 |
| `columnsStatePersistenceKey` | `string` | - | 列设置持久化 key |
| `scroll` | `{ x?: number \| string; y?: number \| string }` | - | 表格滚动配置 |
| `bordered` | `boolean` | - | 是否显示边框 |
| `rowKey` | `string \| ((record) => string \| number)` | `'id'` | 表格行 key |
| `className` | `string` | - | 表格类名 |
| `style` | `CSSProperties` | - | 表格样式 |
| `containerClassName` | `string` | - | 表格容器类名 |
| `containerStyle` | `CSSProperties` | - | 表格容器样式 |
| `emptyRender` | `ReactNode \| (() => ReactNode)` | - | 空状态渲染 |
| `errorRender` | `(error, reload) => ReactNode` | - | 错误状态渲染 |
| `beforeRequest` | `(params) => ProTableRequestParams \| Promise<...>` | - | 请求前钩子 |
| `afterRequest` | `(data, total) => { data; total } \| Promise<...>` | - | 请求后钩子 |
| `onRequestError` | `(error) => void` | - | 请求错误回调 |
| `postData` | `(data) => T[]` | - | 数据格式化 |
| `manual` | `boolean` | - | 是否手动触发请求 |
| `debounceTime` | `number` | - | 防抖时间（毫秒） |
| `polling` | `number \| ((data) => number)` | - | 轮询间隔（毫秒） |
| `cache` | `boolean \| { maxAge?, maxSize? }` | - | 是否缓存数据 |
| `cacheKey` | `string` | - | 缓存 key |
| `showSkeleton` | `boolean` | - | 是否显示骨架屏 |
| `responsive` | `boolean` | - | 是否响应式 |
| `breakpoints` | `{ xs?, sm?, md?, lg?, xl?, xxl? }` | - | 断点配置 |
| `tableSummary` | `{ show?, render? }` | - | 汇总行配置 |
| `stickyHeader` | `boolean \| { offsetHeader?, offsetSummary?, getContainer? }` | - | 粘性头部 |
| `virtualScroll` | `boolean` | - | 虚拟滚动 |
| `virtualScrollConfig` | `{ itemHeight?, overscan? }` | - | 虚拟滚动配置 |
| `editable` | `{ type?, editableKeys?, onChange?, onSave?, onDelete?, onCancel?, actionRender?, deleteText?, saveText?, cancelText? }` | - | 编辑行配置 |
| `dragSort` | `boolean \| { type?, handleRender?, onDragSortEnd? }` | - | 拖拽排序配置 |
| `cardMode` | `boolean \| { cardRender?, grid? }` | - | 卡片模式 |
| `cardContainer` | `boolean \| { title?, extra?, bordered?, style?, className?, bodyStyle? }` | - | 卡片容器模式 |
| `viewMode` | `'table' \| 'card'` | - | 视图切换 |
| `onViewModeChange` | `(mode) => void` | - | 视图切换回调 |
| `urlSync` | `boolean \| { enabled?, prefix?, include?, exclude?, serialize?, deserialize? }` | - | URL 同步配置 |
| `searchSchema` | `{ enabled?, persistenceKey?, defaultSchema?, schemas? }` | - | 查询方案配置 |
| `groupColumns` | `{ title, key, children }[]` | - | 多级表头配置 |
| `onCreate` | `(values) => Promise<boolean \| void> \| boolean \| void` | - | 新增事件 |
| `onEdit` | `(id, values) => Promise<boolean \| void> \| boolean \| void` | - | 编辑事件 |
| `onView` | `(record) => void` | - | 查看事件 |
| `onDelete` | `(id) => Promise<boolean \| void> \| boolean \| void` | - | 删除事件 |
| `onExport` | `() => Promise<void> \| void` | - | 导出事件 |
| `onImport` | `(file) => Promise<unknown>` | - | 导入事件 |
| `cellMerge` | `{ rowSpan?, colSpan? }` | - | 合并单元格配置 |

### ProTableActionType

表格操作类型。

| 方法 | 说明 |
| --- | --- |
| `reload(resetPageIndex?)` | 重新加载数据 |
| `reloadAndRest()` | 刷新并清空选中 |
| `reset()` | 重置查询表单 |
| `clearSelected()` | 清空选中 |
| `setSelectedRows(rows)` | 设置选中行 |
| `setSelectedRowKeys(keys)` | 设置选中行 keys |
| `getSelectedRows()` | 获取选中行 |
| `getSelectedRowKeys()` | 获取选中行 keys |
| `startEditable(rowKey)` | 开始编辑行 |
| `cancelEditable(rowKey)` | 取消编辑行 |
| `saveEditable(rowKey)` | 保存编辑行 |
| `deleteEditable(rowKey)` | 删除编辑行 |
| `getPagination()` | 获取当前分页 |
| `setPagination(pagination)` | 设置分页 |
| `getParams()` | 获取查询参数 |
| `setParams(params)` | 设置查询参数 |
| `getFormInstance()` | 获取表单实例 |
| `startPolling()` | 开始轮询 |
| `stopPolling()` | 停止轮询 |
| `getPollingStatus()` | 获取轮询状态 |
| `debouncedFetchData(params?)` | 防抖请求数据 |
| `openDialog(config)` | 打开弹窗 |
| `confirm(config)` | 打开确认对话框 |
| `scrollToIndex(index, behavior?)` | 虚拟滚动：滚动到指定索引 |
| `scrollToTop(behavior?)` | 虚拟滚动：滚动到顶部 |
| `scrollToBottom(behavior?)` | 虚拟滚动：滚动到底部 |
| `resetDragSort()` | 拖拽排序：重置排序 |
| `clearCache()` | 缓存：清空缓存 |

### ProTableInstance

表格实例。

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `action` | `ProTableActionType` | 表格操作 |
| `form` | `ProFormInstance \| undefined` | 表单实例 |
| `dataSource` | `T[]` | 当前数据 |
| `loading` | `boolean` | 加载状态 |
| `selectedRows` | `T[]` | 选中行 |
| `selectedRowKeys` | `(string \| number)[]` | 选中行 keys |
| `pagination` | `{ current, pageSize, total }` | 分页信息 |
| `params` | `Record<string, unknown>` | 查询参数 |

### useProTable Hook

```tsx
const {
  tableRef,
  instance,
  bindingProps,
  dataSource,
  loading,
  pagination,
  selectedRowKeys,
  selectedRows,
  query,
  Provider,
} = useProTable(options);
```

#### UseProTableOptions

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `store` | `DataStoreImpl<T>` | - | 表格 store |
| `editableInstance` | `EditableTableInstance<T>` | - | 可编辑表格实例 |
| `expandedRowKeys` | `(string \| number)[]` | - | 展开控制 |
| `setExpandedRowKeys` | `(keys) => void` | - | 设置展开 keys |
| `getRowKey` | `(record) => string \| number` | - | 获取行 key |
| `dataSource` | `T[]` | - | 数据源 |
| `columns` | `ProColumnType<T>[]` | - | 列配置 |
| `request` | `ProTableRequest<T>` | - | 请求函数 |
| `toolbar` | `ProTableToolbarConfig` | - | 工具栏配置 |
| `search` | `ProTableProps<T>['search']` | - | 搜索表单配置 |
| `rowSelection` | `ProTableProps<T>['rowSelection']` | - | 行选择配置 |
| `batchOperation` | `ProTableProps<T>['batchOperation']` | - | 批量操作配置 |
| `pagination` | `ProTableProps<T>['pagination']` | - | 分页配置 |
| `cardContainer` | `ProTableProps<T>['cardContainer']` | - | 卡片容器配置 |
| `urlSync` | `ProTableProps<T>['urlSync']` | - | URL 同步配置 |
| `searchSchema` | `ProTableProps<T>['searchSchema']` | - | 查询方案配置 |
| `editable` | `ProTableProps<T>['editable']` | - | 编辑配置 |
| `defaultPageSize` | `number` | - | 默认页码 |
| `pageSizeOptions` | `number[]` | - | 页码选项 |
| `rowKey` | `string \| ((record) => string \| number)` | - | 行 key |
| `loading` | `boolean` | - | 加载状态 |
| `emptyRender` | `ProTableProps<T>['emptyRender']` | - | 空状态渲染 |
| `errorRender` | `ProTableProps<T>['errorRender']` | - | 错误状态渲染 |
| `beforeRequest` | `ProTableProps<T>['beforeRequest']` | - | 请求前钩子 |
| `afterRequest` | `ProTableProps<T>['afterRequest']` | - | 请求后钩子 |
| `onRequestError` | `ProTableProps<T>['onRequestError']` | - | 请求错误回调 |
| `postData` | `ProTableProps<T>['postData']` | - | 数据格式化 |
| `debounceTime` | `number` | - | 防抖时间 |
| `polling` | `ProTableProps<T>['polling']` | - | 轮询间隔 |
| `manual` | `boolean` | - | 是否手动触发请求 |

#### UseProTableReturn

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `tableRef` | `React.RefObject<ProTableInstance \| null>` | 表格实例 ref |
| `instance` | `ProTableInstance` | 表格实例方法 |
| `bindingProps` | `ProTableProps<T>` | 可直接绑定到 ProTable 组件的 props |
| `dataSource` | `T[]` | 当前数据 |
| `loading` | `boolean` | 加载状态 |
| `pagination` | `{ current, pageSize }` | 分页信息 |
| `selectedRowKeys` | `(string \| number)[]` | 选中行 keys |
| `selectedRows` | `T[]` | 选中行数据 |
| `query` | `Record<string, unknown>` | 查询参数 |
| `Provider` | `React.FC<{ children }>` | 上下文 Provider |

#### ProTableInstance（useProTable 返回的实例）

| 方法 | 说明 |
| --- | --- |
| `reload()` | 重新加载数据 |
| `refresh()` | 刷新数据（保持当前分页和查询条件） |
| `reset()` | 重置查询条件并重新加载 |
| `getPagination()` | 获取当前分页信息 |
| `setPagination(pagination)` | 设置分页 |
| `getQueryParams()` | 获取当前查询参数 |
| `setQueryParams(params)` | 设置查询参数 |
| `getSorter()` | 获取当前排序信息 |
| `clearSorter()` | 清除排序 |
| `getSelectedRows()` | 获取选中的行数据 |
| `getSelectedRowKeys()` | 获取选中的行 keys |
| `setSelectedRows(keys, rows)` | 设置选中的行 |
| `clearSelection()` | 清除选中 |
| `getDataSource()` | 获取表格数据 |
| `setDataSource(data)` | 设置表格数据 |
| `getLoading()` | 获取表格 loading 状态 |
| `expandAll()` | 展开所有行 |
| `collapseAll()` | 收起所有行 |
| `expandRow(rowKey)` | 展开指定行 |
| `collapseRow(rowKey)` | 收起指定行 |

### useProTableContext Hook

```tsx
const { instance, store, dataSource, loading, pagination, selectedRowKeys, selectedRows, query } = useProTableContext<T>();
```

用于在子组件中获取表格上下文。

#### ProTableContextValue

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `instance` | `ProTableInstance` | 表格实例 |
| `store` | `DataStoreImpl<T>` | 数据存储实例 |
| `dataSource` | `T[]` | 当前数据 |
| `loading` | `boolean` | 加载状态 |
| `pagination` | `{ current, pageSize }` | 分页信息 |
| `selectedRowKeys` | `(string \| number)[]` | 选中行 keys |
| `selectedRows` | `T[]` | 选中行数据 |
| `query` | `Record<string, unknown>` | 查询参数 |

## 基本用法

<ReactWrapper :component="ProTableDemo1" />

```tsx
import { ProTable } from '@lania-pro-components/components';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
  },
  {
    title: '年龄',
    dataIndex: 'age',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
  },
];

const Demo = () => (
  <ProTable
    columns={columns}
    request={() =>
      Promise.resolve({
        list: [
          { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com' },
          { id: 2, name: '李四', age: 30, email: 'lisi@example.com' },
        ],
        total: 2,
      })
    }
  />
);
```

## 使用 useProTable

<ReactWrapper :component="ProTableDemo2" />

```tsx
import { useProTable, ProTable } from '@lania-pro-components/components';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
  },
  {
    title: '部门',
    dataIndex: 'department',
  },
];

const Demo = () => {
  const { tableProps, Provider } = useProTable({
    columns,
    request: async ({ page, search }) => {
      console.log('请求参数:', { page, search });
      return {
        list: [
          { id: 1, name: '王五', department: '研发部' },
          { id: 2, name: '赵六', department: '产品部' },
        ],
        total: 2,
      };
    },
  });

  return (
    <Provider>
      <ProTable {...tableProps} />
    </Provider>
  );
};
```

## 带搜索表单

<ReactWrapper :component="ProTableDemo3" />

```tsx
import { ProTable } from '@lania-pro-components/components';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
  },
  {
    title: '状态',
    dataIndex: 'status',
  },
];

const searchSchema = [
  {
    type: 'input',
    field: 'name',
    label: '姓名',
  },
  {
    type: 'select',
    field: 'status',
    label: '状态',
    options: [
      { value: 'active', label: '活跃' },
      { value: 'inactive', label: '不活跃' },
    ],
  },
];

const Demo = () => (
  <ProTable
    columns={columns}
    searchSchema={searchSchema}
    request={(params) =>
      Promise.resolve({
        list: [],
        total: 0,
      })
    }
  />
);
```

<script setup lang="ts">
import ReactWrapper from '../.vitepress/theme/ReactWrapper.vue';
import ProTableDemo1 from '../examples/pro-table/demo1';
import ProTableDemo2 from '../examples/pro-table/demo2';
import ProTableDemo3 from '../examples/pro-table/demo3';
</script>

