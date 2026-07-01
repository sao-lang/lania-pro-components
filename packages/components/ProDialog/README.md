# ProDialog

基于 Arco Design 的高级弹窗组件，支持表单弹窗、表格选择弹窗、抽屉模式，内置实例化管理。

## 架构设计

```
ProDialog
├── 模式切换
│   ├── Modal（模态框） - 居中弹出，适合表单/详情
│   └── Drawer（抽屉） - 侧边滑出，适合大表单/表格选择
│
├── 内容类型
│   ├── 自定义内容 - 通过 children 传入任意 ReactNode
│   ├── 表单模式 - 传入 schemas 自动渲染 ProFormN
│   └── 表格模式 - 传入 columns + request 自动渲染 ProTableN
│
├── 实例管理
│   ├── instanceRegistry - 全局实例注册表
│   ├── open/close/toggle - 标准弹窗操作
│   ├── 表单快捷操作 - setFormValues/getFormValues/resetForm/validateForm
│   └── 表格快捷操作 - 通过 getTableAction 获取表格实例
│
├── 高级功能
│   ├── 全屏切换 - showFullscreen
│   ├── 二次确认关闭 - confirmOnClose
│   ├── 简单模式 - simple（无头尾的简洁弹窗）
│   └── 自定义渲染 - dialogRender
│
└── 反馈组件
    ├── ProPopconfirm - 气泡确认框
    ├── ProMessage - 消息提示
    ├── ProNotification - 通知提示
    └── ProNotify - 统一通知方法
```

## API 文档

### ProDialogProps（组件属性）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| mode | `'modal' \| 'drawer'` | `'modal'` | 弹窗模式 |
| size | `'small' \| 'medium' \| 'large' \| 'xlarge' \| 'fullscreen'` | `'medium'` | 弹窗尺寸 |
| width | `number \| string` | - | 自定义宽度 |
| height | `number \| string` | - | 自定义高度 |
| visible | `boolean` | - | 受控显示状态 |
| defaultVisible | `boolean` | `false` | 默认显示状态 |
| title | `ReactNode` | - | 弹窗标题 |
| subTitle | `ReactNode` | - | 副标题 |
| closable | `boolean` | `true` | 是否显示关闭按钮 |
| mask | `boolean` | `true` | 是否显示遮罩 |
| maskClosable | `boolean` | `true` | 点击遮罩是否关闭 |
| showFooter | `boolean` | `true` | 是否显示底部 |
| footerPosition | `'left' \| 'center' \| 'right'` | `'right'` | 底部按钮位置 |
| okText | `string` | `'确认'` | 确认按钮文本 |
| cancelText | `string` | `'取消'` | 取消按钮文本 |
| hideCancel | `boolean` | `false` | 隐藏取消按钮 |
| showOk | `boolean` | `true` | 显示确认按钮 |
| showCancel | `boolean` | `true` | 显示取消按钮 |
| confirmLoading | `boolean` | `false` | 确认按钮加载状态 |
| extraButtons | `ButtonConfig[]` | - | 额外按钮 |
| onOk | `() => void \| Promise` | - | 确认回调 |
| onCancel | `() => void` | - | 取消回调 |
| onVisibleChange | `(visible: boolean) => void` | - | 显示状态变化回调 |
| afterOpen | `() => void` | - | 打开后回调 |
| afterClose | `() => void` | - | 关闭后回调 |
| escToExit | `boolean` | `true` | ESC 键关闭 |
| placement | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` | 抽屉位置（Drawer 模式） |
| confirmOnClose | `boolean` | `false` | 关闭时二次确认 |
| confirmTitle | `string` | `'确认关闭'` | 二次确认标题 |
| confirmContent | `string` | - | 二次确认内容 |
| fullscreen | `boolean` | `false` | 是否全屏 |
| showFullscreen | `boolean` | `false` | 显示全屏按钮 |
| simple | `boolean` | `false` | 简单模式（无头尾） |
| zIndex | `number` | - | 层级 |
| // 表单模式 | | | |
| schemas | `ProFormSchema[]` | - | 表单字段配置 |
| formProps | `ProFormProps` | - | 表单属性 |
| initialValues | `Record<string, any>` | - | 表单初始值 |
| onSubmit | `(values) => boolean \| void \| Promise` | - | 表单提交回调，返回 true 关闭 |
| onValuesChange | `(changed, all) => void` | - | 表单值变化回调 |
| // 表格模式 | | | |
| columns | `ProColumnType[]` | - | 表格列配置 |
| request | `ProTableRequest` | - | 表格数据请求 |
| dataSource | `T[]` | - | 表格数据源 |
| selectionType | `'checkbox' \| 'radio'` | `'checkbox'` | 选择类型 |
| defaultSelectedKeys | `(string \| number)[]` | - | 默认选中行 keys |
| onSelect | `(keys, rows) => boolean \| void` | - | 选择确认回调，返回 true 关闭 |

### ProDialogInstance（实例方法）

| 方法 | 说明 |
|------|------|
| `open(params?)` | 打开弹窗，可传入 title、data 等配置 |
| `close()` | 关闭弹窗 |
| `toggle()` | 切换显示状态 |
| `setTitle(title)` | 动态设置标题 |
| `setConfirmLoading(loading)` | 设置确认按钮加载状态 |
| `setConfirmDisabled(disabled)` | 设置确认按钮禁用状态 |
| `setLoading(loading)` | 设置内容区域加载状态 |
| `getFormInstance()` | 获取表单实例（表单模式） |
| `getTableAction()` | 获取表格操作实例（表格模式） |
| `update(config)` | 更新弹窗配置 |
| `destroy()` | 销毁弹窗 |
| `setFormValues(values)` | 设置表单值 |
| `getFormValues(nameList?)` | 获取表单值 |
| `setFormFieldValue(name, value)` | 设置单个表单字段值 |
| `getFormFieldValue(name)` | 获取单个表单字段值 |
| `resetForm(nameList?)` | 重置表单 |
| `validateForm()` | 验证表单 |
| `clearFormValidate(name?)` | 清除表单验证 |
| `setFormProps(props)` | 更新表单属性 |
| `setFormSchemas(schemas)` | 更新表单字段配置 |

## 使用示例

### 基础弹窗

```tsx
import { ProDialog } from '@/pro-components/ProDialog';

const dialogRef = useRef<ProDialogInstance>(null);

<ProDialog
  ref={dialogRef}
  title="用户信息"
  onOk={async () => {
    // 处理确认
    dialogRef.current?.close();
  }}
>
  <div>弹窗内容</div>
</ProDialog>

// 打开弹窗
dialogRef.current?.open();
```

### 表单弹窗

```tsx
<ProDialog
  ref={dialogRef}
  title="新增用户"
  mode="modal"
  size="medium"
  schemas={[
    { name: 'username', label: '用户名', component: 'Input', required: true },
    { name: 'email', label: '邮箱', component: 'Input', required: true },
    { name: 'role', label: '角色', component: 'Select', options: [
      { label: '管理员', value: 'admin' },
      { label: '用户', value: 'user' },
    ]},
  ]}
  onSubmit={async (values) => {
    await api.createUser(values);
    return true; // 返回 true 自动关闭弹窗
  }}
/>

// 打开弹窗时传入初始数据（编辑场景）
dialogRef.current?.open({
  title: '编辑用户',
  data: { username: '张三', email: 'zhangsan@example.com', role: 'admin' },
});
```

### 表格选择弹窗

```tsx
<ProDialog
  ref={dialogRef}
  title="选择用户"
  mode="drawer"
  size="large"
  columns={[
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
  ]}
  request={fetchUsers}
  selectionType="checkbox"
  onSelect={(keys, rows) => {
    console.log('选中:', keys, rows);
    return true; // 返回 true 关闭弹窗
  }}
/>
```

### 抽屉模式

```tsx
<ProDialog
  mode="drawer"
  placement="right"
  size="large"
  title="详细信息"
  schemas={[...]}
  onSubmit={handleSubmit}
/>
```

### 二次确认关闭

```tsx
<ProDialog
  confirmOnClose
  confirmTitle="确认关闭"
  confirmContent="确定要关闭弹窗吗？未保存的数据将丢失。"
  schemas={[...]}
/>
```

### 使用 feedback 组件

```tsx
import { showPopconfirm, ProMessage, ProNotification } from '@/pro-components/ProDialog';

// 气泡确认
showPopconfirm({
  title: '确定删除吗？',
  content: '删除后不可恢复',
  onOk: async () => {
    await api.delete(id);
  },
});

// 消息提示
ProMessage.success('操作成功');
ProMessage.error('操作失败');

// 通知
ProNotification.info({
  title: '系统通知',
  content: '您有新的消息',
});
```