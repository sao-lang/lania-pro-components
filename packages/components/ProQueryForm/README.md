# ProQueryForm

独立查询表单组件，脱离 ProTable 使用，支持双形态入参和双模式。

## 架构设计

```
ProQueryForm
├── 入参形态
│   ├── 形态 A：columns - 列驱动（与 ProTable 互通，内部转 schema）
│   └── 形态 B：schemas - Schema 驱动（直接使用 ProFormSchema[]）
│
├── 运行模式
│   ├── 轻量模式（默认） - 仅管理表单状态，通过 onSearch/onReset 回调通知消费方
│   └── 重量模式 - 传 store prop（DataStoreImpl），内部调用 store.setQuery
│
├── 核心复用
│   ├── ProForm 引擎 - 直接 import ProForm 渲染表单
│   ├── useResponsive - 响应式布局（从 shared 消费）
│   ├── useUrlSync - URL 双向同步（从 shared 消费）
│   └── useSearchSchema - 查询方案 CRUD + localStorage（从 shared 消费）
│
├── 迁移工具（从 ProTable 迁移）
│   ├── valueTypeToComponent - valueType → Arco 组件名映射
│   ├── getComponentPropsByValueType - 按 valueType 生成组件 props
│   ├── convertColumnsToSearchSchema - 列驱动模式的 schema 转换
│   └── transformSearchParams - 查询参数转换（删空值 + transform）
│
└── 上下文
    ├── RootContext - 全局配置层（布局/列数/折叠）
    ├── SchemaContext - 字段定义层（schemas + formRef）
    └── ActionContext - 行为层（onSearch/onReset）
```

## 快速开始

```tsx
import { ProQueryForm } from '@lania-pro-components/components/ProQueryForm';
// 或
import { ProQueryForm } from '@lania-pro-components/components';

// 形态 A：columns 列驱动（与 ProTable 互通）
<ProQueryForm
  columns={tableColumns}
  onSearch={(params) => fetchData(params)}
  onReset={() => fetchData({})}
  layout="inline"
  collapsible
/>

// 形态 B：schemas Schema 驱动（独立查询）
<ProQueryForm
  schemas={[
    { name: 'keyword', label: '关键词', component: 'Input' },
    { name: 'status', label: '状态', component: 'Select', options: statusOptions },
  ]}
  onSearch={(params) => fetchChartData(params)}
  layout="inline"
/>

// 重量模式：与 ProTable DataStore 集成
<ProQueryForm columns={columns} store={store} urlSync searchSchema={{ enabled: true }} />
<ProTable store={store} columns={columns} request={request} />
```

## API

### ProQueryFormProps

| 参数         | 说明                           | 类型                                     | 默认值     |
| ------------ | ------------------------------ | ---------------------------------------- | ---------- |
| columns      | 列驱动入参                     | `ProColumnType[]`                        | -          |
| schemas      | Schema 驱动入参                | `ProFormSchema[]`                        | -          |
| onSearch     | 查询回调                       | `(params) => void`                       | -          |
| onReset      | 重置回调                       | `() => void`                             | -          |
| beforeSearch | 查询前参数转换                 | `(params) => Record<string, unknown>`    | -          |
| store        | DataStore 实例（启用重量模式） | `DataStoreImpl`                          | -          |
| urlSync      | URL 同步配置                   | `boolean \| UrlSyncConfig`               | -          |
| searchSchema | 查询方案配置                   | `SearchSchemaConfig`                     | -          |
| layout       | 表单布局                       | `'horizontal' \| 'vertical' \| 'inline'` | `'inline'` |
| column       | Grid 列数                      | `number`                                 | `3`        |
| collapsible  | 是否可折叠                     | `boolean`                                | `true`     |
| formProps    | 透传 ProForm 配置              | `Omit<ProFormProps, ...>`                | -          |

## API

### ProQueryFormProps

| 参数                 | 说明                           | 类型                                     | 默认值     |
| -------------------- | ------------------------------ | ---------------------------------------- | ---------- |
| columns              | 列驱动入参（形态 A）           | `ProColumnType[]`                        | -          |
| schemas              | Schema 驱动入参（形态 B）      | `ProFormSchema[]`                        | -          |
| onSearch             | 查询回调                       | `(params) => void`                       | -          |
| onReset              | 重置回调                       | `() => void`                             | -          |
| beforeSearch         | 查询前参数转换                 | `(params) => Record<string, unknown>`    | -          |
| store                | DataStore 实例（启用重量模式） | `DataStoreImpl`                          | -          |
| urlSync              | URL 同步配置                   | `boolean \| UrlSyncConfig`               | -          |
| searchSchema         | 查询方案配置                   | `SearchSchemaConfig`                     | -          |
| layout               | 表单布局                       | `'horizontal' \| 'vertical' \| 'inline'` | `'inline'` |
| column               | Grid 列数                      | `number`                                 | `3`        |
| collapsible          | 是否可折叠                     | `boolean`                                | `true`     |
| defaultCollapsed     | 默认折叠                       | `boolean`                                | `true`     |
| collapsedRows        | 折叠时显示行数                 | `number`                                 | `1`        |
| showSearch           | 显示查询按钮                   | `boolean`                                | `true`     |
| showReset            | 显示重置按钮                   | `boolean`                                | `true`     |
| searchButtonText     | 查询按钮文本                   | `string`                                 | `'查询'`   |
| resetButtonText      | 重置按钮文本                   | `string`                                 | `'重置'`   |
| formProps            | 透传 ProForm 配置              | `Omit<ProFormProps, ...>`                | -          |
| formRef              | 暴露 ProFormInstance           | `Ref<ProFormInstance>`                   | -          |
| schemaProcessOptions | Schema 自动补全配置            | `SchemaProcessOptions`                   | -          |

### 工具函数

| 函数                           | 说明                                      |
| ------------------------------ | ----------------------------------------- |
| `valueTypeToComponent`         | valueType → Arco 组件名映射               |
| `getComponentPropsByValueType` | 按 valueType 生成组件 props               |
| `convertColumnsToSearchSchema` | ProColumnType[] → ProFormSchema[]         |
| `transformSearchParams`        | 查询参数转换（删空值 + search.transform） |

## 设计原则

- **双形态入参**：columns（列驱动）覆盖 ProTable 互通，schemas（Schema 驱动）覆盖独立查询
- **双模式**：轻量覆盖 80% 独立场景，重量覆盖与 ProTable 集成的 20% 场景
- **复用 ProForm 引擎**：直接 import ProForm，不重写表单渲染
- **修复 React Hooks 顺序 bug**：所有 hooks 提到早返回之前（与 ProTable 内嵌版本对比）
