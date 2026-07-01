# ProSelect

基于 Arco Design Select 的增强版选择器，支持远程搜索、分页加载、虚拟滚动、标签模式、全选等高级功能。

## 架构设计

```
ProSelect
├── 数据层
│   ├── 静态数据 - 通过 options 传入
│   └── 远程数据 - 通过 request 函数加载
│       ├── 搜索防抖（debounceTime）
│       ├── 分页加载（pagination + pageSize）
│       └── 字段映射（fieldNames）
│
├── 交互增强
│   ├── 标签模式（tagMode）- 多选模式下彩色标签展示
│   ├── 全选功能（showSelectAll）- 一键全选/取消全选
│   ├── 搜索防抖（debounceTime）- 远程搜索优化
│   └── 创建条目（allowCreate）- 允许创建不存在的选项
│
├── 性能优化
│   ├── 虚拟滚动（virtual）- 大数据量选项渲染优化
│   └── 分页加载（pagination）- 减少单次请求数据量
│
└── 自定义渲染
    ├── optionRender - 自定义选项渲染
    ├── tagRender - 自定义标签渲染
    ├── optionIconRender - 自定义选项图标
    ├── dropdownHeader/dropdownFooter - 下拉头部/底部
    └── emptyRender - 自定义空状态
```

## API 文档

### ProSelectProps（组件属性）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| options | `ProSelectOption[]` | `[]` | 选项数据（静态模式） |
| request | `(params) => Promise<{ data, total?, hasMore? }>` | - | 远程数据请求函数 |
| search | `boolean` | `false` | 是否启用搜索 |
| debounceTime | `number` | `300` | 搜索防抖时间（毫秒） |
| pagination | `boolean` | `false` | 是否启用分页加载 |
| pageSize | `number` | `20` | 分页条数 |
| showLoading | `boolean` | `true` | 是否显示加载状态 |
| optionRender | `(option) => ReactNode` | - | 自定义选项渲染 |
| emptyRender | `ReactNode` | - | 自定义空状态 |
| formatOptions | `(options) => ProSelectOption[]` | - | 选项数据格式化 |
| fieldNames | `{ label, value, disabled, group }` | `{ label:'label', value:'value', disabled:'disabled', group:'group' }` | 字段映射 |
| tagMode | `boolean` | `false` | 标签模式（多选时彩色标签） |
| tagProps | `TagProps` | - | 标签属性 |
| tagRender | `(props) => ReactNode` | - | 自定义标签渲染 |
| showSelectAll | `boolean` | `false` | 显示全选功能 |
| selectAllText | `string` | `'全选'` | 全选文本 |
| unselectAllText | `string` | `'取消全选'` | 取消全选文本 |
| virtual | `boolean` | `false` | 是否启用虚拟滚动 |
| virtualHeight | `number` | `256` | 虚拟滚动容器高度 |
| virtualItemHeight | `number` | `32` | 虚拟滚动项高度 |
| showOptionIcon | `boolean` | `false` | 显示选项图标 |
| optionIconRender | `(option) => ReactNode` | - | 自定义选项图标渲染 |
| clearSearchOnSelect | `boolean` | `false` | 选中后清除搜索 |
| maxTagCount | `number` | - | 最多显示标签数 |
| allowCreate | `boolean` | `false` | 允许创建新条目 |
| validateCreate | `(input) => boolean` | - | 创建条目验证 |
| formatCreateOption | `(input) => ProSelectOption` | - | 格式化创建条目 |
| dropdownHeader | `ReactNode` | - | 下拉面板头部 |
| dropdownFooter | `ReactNode` | - | 下拉面板底部 |

同时继承 Arco Design `SelectProps` 的所有属性（mode、value、onChange、placeholder 等）。

### ProSelectOption（选项数据）

| 属性 | 类型 | 说明 |
|------|------|------|
| label | `ReactNode` | 选项标签 |
| value | `string \| number` | 选项值 |
| disabled | `boolean` | 是否禁用 |
| group | `string` | 选项分组 |
| tagColor | `string` | 标签颜色（tag 模式） |
| `[key: string]` | `unknown` | 其他自定义属性 |

### ProSelectRequestParams（请求参数）

| 属性 | 类型 | 说明 |
|------|------|------|
| keyword | `string` | 搜索关键词 |
| page | `number` | 当前页码 |
| pageSize | `number` | 每页条数 |
| `[key: string]` | `unknown` | 其他参数 |

### ProSelectRequestResult（请求结果）

| 属性 | 类型 | 说明 |
|------|------|------|
| data | `T[]` | 选项数据列表 |
| total | `number` | 总条数 |
| hasMore | `boolean` | 是否还有更多数据 |

## 使用示例

### 基础用法

```tsx
import { ProSelect } from '@/pro-components/ProSelect';

<ProSelect
  options={[
    { label: '选项1', value: 1 },
    { label: '选项2', value: 2 },
    { label: '选项3', value: 3 },
  ]}
  placeholder="请选择"
/>
```

### 远程搜索

```tsx
<ProSelect
  search
  debounceTime={500}
  request={async ({ keyword, page, pageSize }) => {
    const res = await api.searchUsers({ keyword, page, pageSize });
    return {
      data: res.list.map(u => ({ label: u.name, value: u.id })),
      total: res.total,
    };
  }}
  placeholder="搜索用户"
/>
```

### 分页加载

```tsx
<ProSelect
  pagination
  pageSize={20}
  request={async ({ page, pageSize }) => {
    const res = await api.getUsers({ page, pageSize });
    return {
      data: res.list.map(u => ({ label: u.name, value: u.id })),
      total: res.total,
    };
  }}
/>
```

### 标签模式 + 全选

```tsx
<ProSelect
  mode="multiple"
  tagMode
  showSelectAll
  options={[
    { label: '前端', value: 'frontend', tagColor: 'blue' },
    { label: '后端', value: 'backend', tagColor: 'green' },
    { label: '测试', value: 'test', tagColor: 'orange' },
  ]}
/>
```

### 虚拟滚动（大数据量）

```tsx
<ProSelect
  virtual
  virtualHeight={300}
  options={generateLargeOptions(10000)}
/>
```

### 允许创建条目

```tsx
<ProSelect
  mode="multiple"
  allowCreate
  validateCreate={(input) => input.length > 0}
  formatCreateOption={(input) => ({
    label: `新建: ${input}`,
    value: `new_${input}`,
  })}
  options={[...]}
/>
```

### 字段映射

```tsx
<ProSelect
  fieldNames={{
    label: 'name',
    value: 'id',
    disabled: 'locked',
    group: 'category',
  }}
  options={[
    { name: '选项1', id: 1, category: '分组A' },
    { name: '选项2', id: 2, category: '分组A' },
  ]}
/>
```

### 自定义选项渲染

```tsx
<ProSelect
  options={users}
  optionRender={(option) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar size={24}>{option.label[0]}</Avatar>
      <div>
        <div>{option.label}</div>
        <div style={{ fontSize: 12, color: '#999' }}>{option.email}</div>
      </div>
    </div>
  )}
/>
```

### 下拉头部/底部

```tsx
<ProSelect
  options={[...]}
  dropdownHeader={
    <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
      <Checkbox>仅显示已激活</Checkbox>
    </div>
  }
  dropdownFooter={
    <div style={{ padding: '8px 12px', borderTop: '1px solid #eee', textAlign: 'center' }}>
      <Button type="text">管理选项</Button>
    </div>
  }
/>
```