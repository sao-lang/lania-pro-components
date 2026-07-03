# ProDescriptions

详情描述组件，Schema 驱动，与 ProTable 列定义互通，支持三种布局模式。

## 架构设计

```
ProDescriptions
├── 布局模式
│   ├── table（默认） - 多列描述列表（Arco Descriptions 风格）
│   ├── grid - CSS Grid 网格卡片，label 上 value 下
│   └── inline - 行内紧凑展示，label: value 横向排列
│
├── 核心复用
│   ├── renderColumnByValueType - ProTable 渲染器（零拷贝复用 21+ valueType）
│   ├── readonlyRegistry - ProForm 脱敏渲染器（phone/email/idCard）
│   ├── format/money/percent/date - utils 格式化函数
│   ├── copyToClipboard - ProTable 复制工具（Arco Message 包装版）
│   └── getTagColor - utils 颜色映射
│
├── 列适配
│   ├── columnAdapter - ProColumnType[] → ProDescriptionColumn[]
│   ├── 自动过滤 opr 操作列
│   └── Omit 表格专有字段（fixed/width/align/sorter/filter 等）
│
├── 子组件
│   ├── DescriptionCell - 单项渲染器（render > masking > renderColumnByValueType）
│   ├── CopyButton - 复制按钮
│   └── EmptyValue - 空值占位
│
└── 上下文
    ├── RootContext - 全局配置层（布局/列数/边框/尺寸/空值）
    └── ColumnContext - 列定义层（columns + dataSource）
```

## 快速开始

```tsx
import { ProDescriptions } from '@lania-pro-components/components/ProDescriptions';
// 或
import { ProDescriptions } from '@lania-pro-components/components';

// 基础用法
<ProDescriptions
  columns={[
    { title: '订单号', dataIndex: 'orderNo', valueType: 'text', copyable: true },
    { title: '金额', dataIndex: 'amount', valueType: 'money' },
    { title: '状态', dataIndex: 'status', valueType: 'enum', valueEnum: statusEnum },
    { title: '创建时间', dataIndex: 'createTime', valueType: 'dateTime' },
  ]}
  dataSource={{ orderNo: 'ORD20260704001', amount: 1234.5, status: 1, createTime: '2026-07-04 10:00:00' }}
/>

// 复用 ProTable 列定义
const tableColumns: ProColumnType<Order>[] = [/* ... */];
<ProDescriptions columns={tableColumns} dataSource={order} />

// grid 布局 + 卡片容器
<ProDescriptions
  layout="grid"
  column={3}
  cardContainer={{ title: '订单信息', bordered: true }}
  columns={columns}
  dataSource={order}
/>

// inline 布局（表格行展开）
<ProDescriptions layout="inline" columns={columns} dataSource={record} />

// 脱敏 + 复制
<ProDescriptions
  columns={[
    { title: '手机号', dataIndex: 'phone', valueType: 'phone', masking: true, copyable: true },
    { title: '邮箱', dataIndex: 'email', valueType: 'email', masking: true },
  ]}
  dataSource={user}
/>
```

## API

### ProDescriptionsProps

| 参数              | 说明                               | 类型                                        | 默认值         |
| ----------------- | ---------------------------------- | ------------------------------------------- | -------------- |
| columns           | 列定义（支持 ProColumnType 互通）  | `ProDescriptionColumn[] \| ProColumnType[]` | -              |
| dataSource        | 数据源（单条记录）                 | `T`                                         | -              |
| layout            | 布局模式                           | `'table' \| 'grid' \| 'inline'`             | `'table'`      |
| column            | 列数                               | `number`                                    | `3`            |
| responsiveColumns | 响应式列数（grid 布局）            | `{ mobile?, tablet?, desktop? }`            | -              |
| bordered          | 是否带边框                         | `boolean`                                   | `false`        |
| size              | 尺寸                               | `'mini' \| 'small' \| 'default' \| 'large'` | `'default'`    |
| direction         | label/value 排列方向（table 布局） | `'horizontal' \| 'vertical'`                | `'horizontal'` |
| emptyText         | 空值占位符                         | `ReactNode`                                 | `-`            |
| cardContainer     | 卡片容器配置（grid 布局）          | `CardContainerConfig`                       | -              |
| title             | 标题                               | `ReactNode`                                 | -              |
| extra             | 额外内容                           | `ReactNode`                                 | -              |
| className         | 自定义类名                         | `string`                                    | -              |
| style             | 自定义样式                         | `CSSProperties`                             | -              |

### ProDescriptionColumn

`ProDescriptionColumn` 由 `ProColumnType` 派生（Omit 表格专有字段），额外支持：

| 字段               | 说明           | 类型      | 默认值  |
| ------------------ | -------------- | --------- | ------- |
| span               | 跨列数         | `number`  | -       |
| copyable           | 启用复制按钮   | `boolean` | `false` |
| masking            | 启用脱敏渲染   | `boolean` | `false` |
| hideInDescriptions | 在详情视图隐藏 | `boolean` | `false` |

### 子组件

| 组件              | 说明                                                     | Props                                         |
| ----------------- | -------------------------------------------------------- | --------------------------------------------- |
| `DescriptionCell` | 单项渲染器（render > masking > renderColumnByValueType） | `{ column, value, record, index, emptyText }` |
| `CopyButton`      | 复制按钮                                                 | `{ text, tooltip? }`                          |
| `EmptyValue`      | 空值占位                                                 | `{ text? }`                                   |

### 工具函数

| 函数           | 说明                                                                          |
| -------------- | ----------------------------------------------------------------------------- |
| `adaptColumns` | `ProColumnType[]` → `ProDescriptionColumn[]`，自动过滤 opr/hideInDescriptions |

## 设计原则

- **列定义互通**：同一份 columns 同时驱动 ProTable 和 ProDescriptions
- **渲染器零拷贝复用**：直接 import ProTable 的 renderColumnByValueType
- **脱敏复用**：直接 import ProForm 的 readonlyRegistry
- **三种布局**：覆盖查看页、卡片内嵌、行内紧凑三种密度场景
