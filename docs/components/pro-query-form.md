# ProQueryForm

独立查询表单组件，脱离 ProTable 使用，支持双形态入参（columns / schemas）和双模式（轻量 / 重量）。

## API

### 导出

| 导出                           | 类型 | 说明                              |
| ------------------------------ | ---- | --------------------------------- |
| `ProQueryForm`                 | 组件 | 主组件                            |
| `QueryFormRenderer`            | 组件 | 独立表单渲染器                    |
| `SearchSchemaBar`              | 组件 | 查询方案管理条                    |
| `valueTypeToComponent`         | 常量 | valueType → Arco 组件名映射       |
| `getComponentPropsByValueType` | 函数 | 按 valueType 生成组件 props       |
| `convertColumnsToSearchSchema` | 函数 | ProColumnType[] → ProFormSchema[] |
| `transformSearchParams`        | 函数 | 查询参数转换                      |

### ProQueryFormProps

| 属性               | 类型                                     | 默认值     | 说明                           |
| ------------------ | ---------------------------------------- | ---------- | ------------------------------ |
| `columns`          | `ProColumnType[]`                        | -          | 列驱动入参（与 ProTable 互通） |
| `schemas`          | `ProFormSchema[]`                        | -          | Schema 驱动入参                |
| `onSearch`         | `(params) => void`                       | -          | 查询回调                       |
| `onReset`          | `() => void`                             | -          | 重置回调                       |
| `beforeSearch`     | `(params) => Record<string, unknown>`    | -          | 查询前参数转换                 |
| `store`            | `DataStoreImpl`                          | -          | DataStore 实例（启用重量模式） |
| `urlSync`          | `boolean \| UrlSyncConfig`               | -          | URL 同步配置                   |
| `searchSchema`     | `SearchSchemaConfig`                     | -          | 查询方案配置                   |
| `layout`           | `'horizontal' \| 'vertical' \| 'inline'` | `'inline'` | 表单布局                       |
| `column`           | `number`                                 | `3`        | Grid 列数                      |
| `collapsible`      | `boolean`                                | `true`     | 是否可折叠                     |
| `defaultCollapsed` | `boolean`                                | `true`     | 默认折叠                       |
| `collapsedRows`    | `number`                                 | `1`        | 折叠时显示行数                 |
| `showSearch`       | `boolean`                                | `true`     | 显示查询按钮                   |
| `showReset`        | `boolean`                                | `true`     | 显示重置按钮                   |
| `searchButtonText` | `string`                                 | `'查询'`   | 查询按钮文本                   |
| `resetButtonText`  | `string`                                 | `'重置'`   | 重置按钮文本                   |
| `formProps`        | `Omit<ProFormProps, ...>`                | -          | 透传 ProForm 配置              |
| `formRef`          | `Ref<ProFormInstance>`                   | -          | 暴露 ProFormInstance           |

### UrlSyncConfig

| 属性      | 类型       | 说明           |
| --------- | ---------- | -------------- |
| `prefix`  | `string`   | URL 参数前缀   |
| `include` | `string[]` | 包含的字段列表 |
| `exclude` | `string[]` | 排除的字段列表 |

### SearchSchemaConfig

| 属性             | 类型      | 说明                  |
| ---------------- | --------- | --------------------- |
| `enabled`        | `boolean` | 是否启用              |
| `persistenceKey` | `string`  | localStorage 存储 key |
| `defaultSchema`  | `string`  | 默认方案 key          |
| `maxCount`       | `number`  | 最大保存数量          |

## 示例

```tsx
// 列驱动（与 ProTable 互通）
<ProQueryForm columns={tableColumns} onSearch={fetchData} />

// Schema 驱动（独立查询）
<ProQueryForm
  schemas={[
    { name: 'keyword', label: '关键词', component: 'Input' },
    { name: 'status', label: '状态', component: 'Select', options: statusOptions },
  ]}
  onSearch={(params) => fetchChartData(params)}
/>

// 重量模式：与 ProTable DataStore 集成
<ProQueryForm columns={columns} store={store} urlSync searchSchema={{ enabled: true }} />
<ProTable store={store} columns={columns} request={request} />
```
