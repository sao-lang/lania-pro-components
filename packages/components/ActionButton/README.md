# ActionButton

操作按钮组件集，封装常用业务操作按钮（新增、编辑、查看、删除、导出、导入、跳转、批量操作），每个按钮自带弹窗/确认逻辑，减少重复编码。

## 架构设计

```
ActionButton
├── 表单类按钮（内嵌 ProDialog + ProFormN）
│   ├── AddButton     - 新增按钮（表单弹窗 + 提交）
│   ├── EditButton    - 编辑按钮（表单弹窗 + 回填数据 + 提交）
│   └── ViewButton    - 查看按钮（弹窗 + 只读展示）
│
├── 操作类按钮
│   ├── DeleteButton  - 删除按钮（二次确认 + 执行删除）
│   ├── ExportButton  - 导出按钮（文件下载 / 自定义导出）
│   └── ImportButton  - 导入按钮（文件上传 + 导入）
│
├── 导航类按钮
│   └── JumpButton    - 跳转按钮（路由跳转 / 新窗口打开）
│
└── 批量操作按钮
    └── BatchButton   - 批量操作按钮（选中校验 + 二次确认 + 执行）
```

## API 文档

### AddButton / EditButton（表单类按钮）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | `string` | `'新增'`/`'编辑'` | 按钮文本 |
| title | `string` | - | 弹窗标题 |
| width | `number \| string` | - | 弹窗宽度 |
| schemas | `ProFormSchema[]` | - | 表单字段配置（必填） |
| initialValues | `Record<string, any>` | - | 表单初始值 |
| formProps | `ProFormProps` | - | 表单属性 |
| dialogProps | `ProDialogProps` | - | 弹窗属性 |
| onSubmit | `(values) => boolean \| void \| Promise` | - | 提交回调（必填），返回 true 关闭弹窗 |
| onBeforeOpen | `() => boolean \| void` | - | 打开前回调，返回 false 阻止打开 |
| onAfterClose | `() => void` | - | 关闭后回调 |

**EditButton 额外属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| getInitialValues | `() => Record \| Promise` | 获取表单初始数据（必填） |

### ViewButton（查看按钮）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | `string` | `'查看'` | 按钮文本 |
| title | `string` | - | 弹窗标题 |
| width | `number \| string` | - | 弹窗宽度 |
| dialogProps | `ProDialogProps` | - | 弹窗属性 |
| renderContent | `() => ReactNode` | - | 自定义内容渲染（必填） |
| record | `unknown` | - | 查看的数据 |

### DeleteButton（删除按钮）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | `string` | `'删除'` | 按钮文本 |
| confirmTitle | `string` | - | 确认弹窗标题 |
| confirmContent | `ReactNode \| function` | - | 确认弹窗内容 |
| okText | `string` | - | 确认按钮文本 |
| cancelText | `string` | - | 取消按钮文本 |
| okButtonProps | `ButtonProps` | - | 确认按钮属性 |
| dialogProps | `ProDialogProps` | - | 弹窗属性 |
| onDelete | `() => boolean \| void \| Promise` | - | 删除回调（必填），返回 true 关闭弹窗 |

### ExportButton（导出按钮）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | `string` | `'导出'` | 按钮文本 |
| exportUrl | `string` | - | 导出接口地址 |
| params | `Record<string, any>` | - | 导出参数 |
| fileName | `string` | - | 文件名 |
| timeout | `number` | `60000` | 超时时间（毫秒） |
| onExport | `() => Promise \| void` | - | 自定义导出方法 |
| onBeforeExport | `() => boolean \| Promise` | - | 导出前回调 |

### ImportButton（导入按钮）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | `string` | `'导入'` | 按钮文本 |
| uploadUrl | `string` | - | 上传接口地址 |
| uploadParams | `Record<string, any>` | - | 上传参数 |
| accept | `string` | - | 接受的文件类型 |
| multiple | `boolean` | `false` | 是否多选文件 |
| title | `string` | - | 弹窗标题 |
| width | `number \| string` | - | 弹窗宽度 |
| renderUpload | `() => ReactNode` | - | 自定义上传内容 |
| onSuccess | `(result) => void` | - | 上传成功回调 |
| onImportError | `(error) => void` | - | 上传失败回调 |

### JumpButton（跳转按钮）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | `string` | - | 按钮文本 |
| to | `string` | - | 跳转路径（必填） |
| target | `'_blank' \| '_self'` | `'_self'` | 打开方式 |
| onBeforeJump | `() => boolean \| Promise` | - | 跳转前回调，返回 false 阻止跳转 |

### BatchButton（批量操作按钮）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | `string` | - | 按钮文本 |
| selectedRows | `unknown[]` | - | 选中的数据 |
| selectedKeys | `(string \| number)[]` | - | 选中的 keys |
| needSelection | `boolean` | `true` | 是否需要选中才能操作 |
| minSelection | `number` | - | 最少选中数量 |
| maxSelection | `number` | - | 最多选中数量 |
| selectionWarning | `string` | - | 未选中的提示文本 |
| needConfirm | `boolean` | `false` | 是否需要二次确认 |
| confirmTitle | `string` | - | 确认弹窗标题 |
| confirmContent | `ReactNode \| function` | - | 确认弹窗内容 |
| onAction | `(rows, keys) => boolean \| void \| Promise` | - | 操作回调（必填），返回 true 表示成功 |

### 通用属性（ActionButtonBaseProps）

所有按钮组件都继承以下属性：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | `boolean` | `true` | 是否显示按钮 |
| style | `CSSProperties` | - | 自定义样式 |
| className | `string` | - | 自定义类名 |
| type | `ButtonProps['type']` | - | 按钮样式类型 |
| status | `ButtonProps['status']` | - | 按钮状态 |
| disabled | `boolean` | `false` | 是否禁用 |
| icon | `ReactNode` | - | 按钮图标 |
| size | `ButtonProps['size']` | - | 按钮尺寸 |

## 使用示例

### 新增按钮

```tsx
import { AddButton } from '@/pro-components/ActionButton';

<AddButton
  text="新增用户"
  title="新增用户"
  schemas={[
    { name: 'username', label: '用户名', component: 'Input', required: true },
    { name: 'email', label: '邮箱', component: 'Input', required: true },
  ]}
  onSubmit={async (values) => {
    await api.createUser(values);
    Message.success('新增成功');
    return true;
  }}
/>
```

### 编辑按钮

```tsx
<EditButton
  text="编辑"
  schemas={[
    { name: 'username', label: '用户名', component: 'Input', required: true },
    { name: 'email', label: '邮箱', component: 'Input', required: true },
  ]}
  getInitialValues={async () => {
    const user = await api.getUser(id);
    return { username: user.name, email: user.email };
  }}
  onSubmit={async (values) => {
    await api.updateUser(id, values);
    return true;
  }}
/>
```

### 查看按钮

```tsx
<ViewButton
  text="查看"
  title="用户详情"
  record={userData}
  renderContent={() => (
    <div>
      <p>用户名: {userData.name}</p>
      <p>邮箱: {userData.email}</p>
    </div>
  )}
/>
```

### 删除按钮

```tsx
<DeleteButton
  text="删除"
  confirmTitle="确认删除"
  confirmContent="确定要删除该用户吗？删除后不可恢复。"
  onDelete={async () => {
    await api.deleteUser(id);
    Message.success('删除成功');
    return true;
  }}
/>
```

### 导出按钮

```tsx
<ExportButton
  text="导出"
  exportUrl="/api/users/export"
  params={{ status: 'active' }}
  fileName="用户列表"
  onBeforeExport={async () => {
    // 导出前校验
    return true;
  }}
/>
```

### 导入按钮

```tsx
<ImportButton
  text="导入"
  uploadUrl="/api/users/import"
  accept=".xlsx,.xls"
  onSuccess={(result) => {
    Message.success(`成功导入 ${result.count} 条数据`);
  }}
/>
```

### 跳转按钮

```tsx
<JumpButton
  text="查看详情"
  to={`/user/detail/${id}`}
  target="_blank"
/>
```

### 批量操作按钮

```tsx
<BatchButton
  text="批量删除"
  selectedRows={selectedRows}
  selectedKeys={selectedKeys}
  needSelection={true}
  minSelection={1}
  needConfirm={true}
  confirmTitle="批量删除"
  confirmContent={(rows) => `确定要删除选中的 ${rows.length} 条数据吗？`}
  onAction={async (rows, keys) => {
    await api.batchDelete(keys);
    return true;
  }}
/>
```

### 在 ProTableN 中使用

ProTableN 内置了 ActionButton 的事件处理器，可直接在配置中使用：

```tsx
<ProTableN
  columns={[...]}
  request={fetchUsers}
  toolbar={{
    actions: [
      {
        type: 'add',
        key: 'add',
        text: '新增用户',
        schemas: [
          { name: 'username', label: '用户名', component: 'Input', required: true },
        ],
      },
      {
        type: 'export',
        key: 'export',
        text: '导出',
      },
    ],
  }}
  onCreate={async (values) => { /* 新增逻辑 */ }}
  onExport={async () => { /* 导出逻辑 */ }}
/>
```