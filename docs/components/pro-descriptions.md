# ProDescriptions

详情描述组件，Schema 驱动，与 ProTable 列定义互通，支持三种布局模式。

## API

### 导出

| 导出              | 类型 | 说明                                     |
| ----------------- | ---- | ---------------------------------------- |
| `ProDescriptions` | 组件 | 主组件                                   |
| `DescriptionCell` | 组件 | 单项渲染器                               |
| `CopyButton`      | 组件 | 复制按钮                                 |
| `EmptyValue`      | 组件 | 空值占位                                 |
| `adaptColumns`    | 函数 | ProColumnType[] → ProDescriptionColumn[] |

### ProDescriptionsProps

| 属性                | 类型                                        | 默认值         | 说明                              |
| ------------------- | ------------------------------------------- | -------------- | --------------------------------- |
| `columns`           | `ProDescriptionColumn[] \| ProColumnType[]` | -              | 列定义（支持 ProColumnType 互通） |
| `dataSource`        | `T`                                         | -              | 数据源（单条记录）                |
| `layout`            | `'table' \| 'grid' \| 'inline'`             | `'table'`      | 布局模式                          |
| `column`            | `number`                                    | `3`            | 列数                              |
| `responsiveColumns` | `{ mobile?, tablet?, desktop? }`            | -              | 响应式列数（grid 布局）           |
| `bordered`          | `boolean`                                   | `false`        | 是否带边框                        |
| `size`              | `'mini' \| 'small' \| 'default' \| 'large'` | `'default'`    | 尺寸                              |
| `direction`         | `'horizontal' \| 'vertical'`                | `'horizontal'` | label/value 排列方向              |
| `emptyText`         | `ReactNode`                                 | `-`            | 空值占位符                        |
| `cardContainer`     | `CardContainerConfig`                       | -              | 卡片容器配置（grid 布局）         |
| `title`             | `ReactNode`                                 | -              | 标题                              |
| `extra`             | `ReactNode`                                 | -              | 额外内容                          |

### ProDescriptionColumn

由 `ProColumnType` 派生（Omit 表格专有字段），额外支持：

| 属性                 | 类型      | 默认值  | 说明           |
| -------------------- | --------- | ------- | -------------- |
| `span`               | `number`  | -       | 跨列数         |
| `copyable`           | `boolean` | `false` | 启用复制按钮   |
| `masking`            | `boolean` | `false` | 启用脱敏渲染   |
| `hideInDescriptions` | `boolean` | `false` | 在详情视图隐藏 |

## 示例

```tsx
// 基础用法
<ProDescriptions
  columns={[
    { title: '订单号', dataIndex: 'orderNo', valueType: 'text', copyable: true },
    { title: '金额', dataIndex: 'amount', valueType: 'money' },
  ]}
  dataSource={{ orderNo: 'ORD001', amount: 1234.5 }}
/>

// 复用 ProTable 列定义
<ProDescriptions columns={tableColumns} dataSource={order} />

// 脱敏 + 复制
<ProDescriptions
  columns={[
    { title: '手机号', dataIndex: 'phone', valueType: 'phone', masking: true, copyable: true },
    { title: '邮箱', dataIndex: 'email', valueType: 'email', masking: true },
  ]}
  dataSource={user}
/>
```
