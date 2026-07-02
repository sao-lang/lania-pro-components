# ProDialog

弹窗组件，支持多种模式和快捷操作。

## API

### 类型定义

#### DialogMode

弹窗模式：`'modal'` | `'drawer'`

#### DialogSize

弹窗尺寸：`'small'` | `'medium'` | `'large'` | `'xlarge'` | `'fullscreen'`

#### DrawerPlacement

抽屉位置：`'top'` | `'right'` | `'bottom'` | `'left'`

#### FooterPosition

按钮位置：`'left'` | `'center'` | `'right'`

### ProDialogProps

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `mode` | `DialogMode` | `'modal'` | 弹窗模式 |
| `size` | `DialogSize` | `'medium'` | 弹窗尺寸 |
| `width` | `number \| string` | - | 自定义宽度 |
| `height` | `number \| string` | - | 自定义高度（Drawer 模式） |
| `visible` | `boolean` | - | 是否可见（受控） |
| `defaultVisible` | `boolean` | `false` | 默认是否可见 |
| `title` | `ReactNode` | - | 弹窗标题 |
| `subTitle` | `ReactNode` | - | 副标题 |
| `titleIcon` | `ReactNode` | - | 标题图标 |
| `closable` | `boolean` | `true` | 是否显示关闭按钮 |
| `closeIcon` | `ReactNode` | - | 自定义关闭图标 |
| `mask` | `boolean` | `true` | 是否显示遮罩 |
| `maskClosable` | `boolean` | `true` | 点击遮罩是否关闭 |
| `maskStyle` | `CSSProperties` | - | 遮罩样式 |
| `style` | `CSSProperties` | - | 弹窗样式 |
| `className` | `string \| string[]` | - | 弹窗类名 |
| `wrapStyle` | `CSSProperties` | - | 外层容器样式 |
| `wrapClassName` | `string \| string[]` | - | 外层容器类名 |
| `bodyStyle` | `CSSProperties` | - | 内容区域样式 |
| `headerStyle` | `CSSProperties` | - | 头部样式 |
| `footerStyle` | `CSSProperties` | - | 底部样式 |
| `showFooter` | `boolean` | `true` | 是否显示底部按钮区 |
| `footer` | `ReactNode \| null` | - | 底部内容 |
| `footerPosition` | `FooterPosition` | `'right'` | 底部按钮位置 |
| `okText` | `ReactNode` | `'确认'` | 确认按钮文本 |
| `cancelText` | `ReactNode` | `'取消'` | 取消按钮文本 |
| `okButtonProps` | `ButtonProps` | - | 确认按钮属性 |
| `cancelButtonProps` | `ButtonProps` | - | 取消按钮属性 |
| `hideCancel` | `boolean` | `false` | 是否隐藏取消按钮 |
| `confirmLoading` | `boolean` | `false` | 确认按钮加载状态 |
| `showOk` | `boolean` | `true` | 是否显示确认按钮 |
| `showCancel` | `boolean` | `true` | 是否显示取消按钮 |
| `extraButtons` | `DialogButtonConfig[]` | - | 自定义按钮列表 |
| `afterOpen` | `() => void` | - | 弹窗打开回调 |
| `afterClose` | `() => void` | - | 弹窗关闭回调 |
| `onVisibleChange` | `(visible: boolean) => void` | - | 可见性变化回调 |
| `onOk` | `((e?) => Promise<unknown>) \| ((e?) => void)` | - | 确认按钮回调 |
| `onCancel` | `() => void` | - | 取消按钮回调 |
| `onClose` | `() => void` | - | 关闭按钮回调 |
| `escToExit` | `boolean` | `true` | 按 ESC 键关闭 |
| `mountOnEnter` | `boolean` | `true` | 是否初次打开才渲染 DOM |
| `unmountOnExit` | `boolean` | `false` | 是否隐藏后销毁 DOM |
| `focusLock` | `boolean` | `true` | 是否开启焦点锁定 |
| `autoFocus` | `boolean` | `true` | 是否自动聚焦第一个元素 |
| `getPopupContainer` | `() => Element` | - | 指定挂载父节点 |
| `getChildrenPopupContainer` | `(node: HTMLElement) => Element` | - | 子弹出框挂载容器 |
| `instance` | `string` | - | 实例名称，用于全局获取 |
| `dialogRender` | `(node: ReactNode) => ReactNode` | - | 自定义渲染弹窗 |
| `children` | `ReactNode` | - | 子元素 |
| `placement` | `DrawerPlacement` | `'right'` | Drawer 位置 |
| `confirmOnClose` | `boolean` | `false` | 关闭时是否确认 |
| `confirmTitle` | `ReactNode` | `'确认关闭'` | 确认关闭标题 |
| `confirmContent` | `ReactNode` | `'确定要关闭弹窗吗？'` | 确认关闭内容 |
| `isEditing` | `boolean \| (() => boolean)` | - | 是否处于编辑状态 |
| `draggable` | `boolean` | `false` | 是否开启拖拽 |
| `resizable` | `boolean` | `false` | 是否可调整大小 |
| `fullscreen` | `boolean` | `false` | 是否全屏 |
| `showFullscreen` | `boolean` | `false` | 是否显示全屏按钮 |
| `zIndex` | `number` | - | 弹窗层级 |
| `simple` | `boolean` | `false` | 是否简洁模式 |
| `alignCenter` | `boolean` | `true` | 是否居中显示 |
| `dialogRef` | `React.Ref<ProDialogInstance>` | - | 弹窗实例引用 |
| `buttons` | `DialogButtonConfig[]` | - | 自定义按钮组 |

### 表单弹窗属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `formProps` | `Omit<ProFormProps, 'onFinish'>` | - | ProForm 属性 |
| `schemas` | `ProFormSchema[]` | - | 表单字段配置 |
| `initialValues` | `Partial<TValues>` | - | 表单初始值 |
| `onFinish` | `(values: TValues) => Promise<void> \| void` | - | 表单完成回调 |
| `onSubmit` | `(values: TValues) => boolean \| void \| Promise<boolean \| void>` | - | 表单提交回调，返回 `true` 自动关闭 |
| `beforeSubmit` | `(values: TValues) => Promise<boolean> \| boolean` | - | 提交前校验，返回 `false` 阻止提交 |
| `onValuesChange` | `(changedValues, allValues) => void` | - | 字段值变化回调 |

### 表格弹窗属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tableProps` | `Omit<ProTableProps, 'rowSelection'>` | - | ProTable 属性 |
| `columns` | `ProColumnType[]` | - | 表格列配置 |
| `request` | `ProTableRequest` | - | 数据请求函数 |
| `dataSource` | `TRow[]` | - | 数据源 |
| `selectionType` | `'checkbox' \| 'radio' \| 'none'` | `'checkbox'` | 选择类型 |
| `defaultSelectedKeys` | `TKey[]` | - | 默认选中项 |
| `defaultSelectedRows` | `TRow[]` | - | 默认选中行 |
| `onSelectionChange` | `(keys, rows) => void` | - | 选中变化回调 |
| `onSelect` | `(keys, rows) => boolean \| void \| Promise<boolean \| void>` | - | 确认选择回调，返回 `true` 自动关闭 |
| `rowKey` | `string \| ((record) => TKey)` | `'id'` | 行 key |

### ProDialogInstance

弹窗实例对象，提供弹窗操作方法。

| 方法 | 说明 |
| --- | --- |
| `open(params?)` | 打开弹窗 |
| `close()` | 关闭弹窗 |
| `toggle()` | 切换弹窗显示状态 |
| `setTitle(title)` | 设置弹窗标题 |
| `setConfirmLoading(loading)` | 设置确认按钮加载状态 |
| `setConfirmDisabled(disabled)` | 设置确认按钮禁用状态 |
| `setLoading(loading)` | 设置内容区域加载状态 |
| `getFormInstance()` | 获取表单实例（表单模式） |
| `getTableAction()` | 获取表格操作实例（表格模式） |
| `update(config)` | 更新弹窗配置 |
| `destroy()` | 销毁弹窗 |

#### 表单快捷方法

| 方法 | 说明 |
| --- | --- |
| `setFormValues(values)` | 设置表单字段值 |
| `getFormValues(nameList?)` | 获取表单字段值 |
| `setFormFieldValue(name, value)` | 设置单个表单字段值 |
| `getFormFieldValue(name)` | 获取单个表单字段值 |
| `resetForm(nameList?)` | 重置表单 |
| `validateForm()` | 验证表单 |
| `clearFormValidate(name?)` | 清除表单验证 |
| `setFormProps(props)` | 更新表单配置 |
| `setFormSchemas(schemas)` | 更新表单字段配置 |
| `submitForm()` | 提交表单 |

#### 表格快捷方法

| 方法 | 说明 |
| --- | --- |
| `reloadTable(resetPageIndex?)` | 重新加载表格数据 |
| `reloadAndRestTable()` | 刷新并清空选中 |
| `resetTable()` | 重置表格查询 |
| `clearTableSelection()` | 清空表格选中 |
| `setTableSelectedRows(rows)` | 设置表格选中行 |
| `setTableSelectedRowKeys(keys)` | 设置表格选中行 keys |
| `getTableSelectedRows()` | 获取表格选中行 |
| `getTableSelectedRowKeys()` | 获取表格选中行 keys |
| `getTablePagination()` | 获取表格当前分页 |
| `setTablePagination(pagination)` | 设置表格分页 |
| `getTableParams()` | 获取表格查询参数 |
| `setTableParams(params)` | 设置表格查询参数 |

### 命令式方法

#### ProDialog.open

```tsx
ProDialog.open(config: OpenDialogConfig) => DialogReturnProps
```

#### ProDialog.confirm

```tsx
ProDialog.confirm(config: ConfirmDialogConfig) => DialogReturnProps
```

#### ProDialog.info

```tsx
ProDialog.info(config: Omit<ConfirmDialogConfig, 'type'>) => DialogReturnProps
```

#### ProDialog.success

```tsx
ProDialog.success(config: Omit<ConfirmDialogConfig, 'type'>) => DialogReturnProps
```

#### ProDialog.warning

```tsx
ProDialog.warning(config: Omit<ConfirmDialogConfig, 'type'>) => DialogReturnProps
```

#### ProDialog.error

```tsx
ProDialog.error(config: Omit<ConfirmDialogConfig, 'type'>) => DialogReturnProps
```

#### ProDialog.form

```tsx
ProDialog.form(config: FormDialogConfig & { title: ReactNode }) => DialogReturnProps
```

#### ProDialog.table

```tsx
ProDialog.table(config: TableDialogConfig & { title: ReactNode }) => DialogReturnProps
```

### 反馈类组件

#### ProDialog.Popconfirm

气泡确认框组件。

#### ProDialog.message

全局消息提示。

| 方法 | 说明 |
| --- | --- |
| `open(config)` | 打开消息 |
| `info(content, duration?)` | 信息提示 |
| `success(content, duration?)` | 成功提示 |
| `warning(content, duration?)` | 警告提示 |
| `error(content, duration?)` | 错误提示 |
| `loading(content?, showOverlay?)` | 加载提示 |
| `clear()` | 清除所有消息 |
| `config(options)` | 全局配置 |

#### ProDialog.notification

通知提醒。

| 方法 | 说明 |
| --- | --- |
| `open(config)` | 打开通知 |
| `info(config)` | 信息通知 |
| `success(config)` | 成功通知 |
| `warning(config)` | 警告通知 |
| `error(config)` | 错误通知 |
| `clear()` | 清除所有通知 |
| `config(options)` | 全局配置 |

#### ProDialog.notify

快捷通知。

| 方法 | 说明 |
| --- | --- |
| `info(title, content)` | 信息通知 |
| `success(title, content)` | 成功通知 |
| `warning(title, content)` | 警告通知 |
| `error(title, content)` | 错误通知 |
| `clear()` | 清除所有通知 |

### useProDialog Hook

```tsx
const {
  visible,
  state,
  open,
  close,
  toggle,
  setTitle,
  setConfirmLoading,
  setConfirmDisabled,
  setFullscreen,
  dialog,
  dialogInstance,
  form,
  table,
  Provider,
} = useProDialog(options);
```

#### UseProDialogOptions

继承自 `ProDialogProps`，额外属性：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | - | 弹窗实例名称 |
| `content` | `ReactNode \| ((instance) => ReactNode)` | - | 弹窗内容 |
| `buttons` | `DialogButtonConfig[]` | - | 自定义按钮组 |
| `destroyOnClose` | `boolean` | `true` | 关闭时是否销毁 |

#### UseProDialogReturn

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `visible` | `boolean` | 弹窗可见性 |
| `state` | `DialogState` | 弹窗状态 |
| `open` | `(params?) => void` | 打开弹窗 |
| `close` | `() => void` | 关闭弹窗 |
| `toggle` | `() => void` | 切换弹窗 |
| `setTitle` | `(title) => void` | 设置标题 |
| `setConfirmLoading` | `(loading) => void` | 设置确认加载状态 |
| `setConfirmDisabled` | `(disabled) => void` | 设置确认禁用状态 |
| `setFullscreen` | `(fullscreen) => void` | 设置全屏状态 |
| `dialog` | `ProDialogInstance` | 弹窗实例 |
| `dialogInstance` | `ProDialogInstance` | 弹窗实例 |
| `form` | `ProFormInstance \| undefined` | 表单实例 |
| `table` | `ProTableActionType \| undefined` | 表格操作实例 |
| `Provider` | `React.FC` | 上下文 Provider |

## 基本用法

<ReactWrapper :component="ProDialogDemo1" />

```tsx
import { ProDialog } from '@lania-pro-components/components';
import { Button } from '@arco-design/web-react';
import { useState } from 'react';

const Demo = () => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Button onClick={() => setVisible(true)}>打开弹窗</Button>
      <ProDialog
        visible={visible}
        title="示例弹窗"
        onCancel={() => setVisible(false)}
        onOk={() => {
          setVisible(false);
          console.log('确认');
        }}
      >
        <p>这是弹窗内容</p>
      </ProDialog>
    </div>
  );
};
```

## 使用 useProDialog

<ReactWrapper :component="ProDialogDemo2" />

```tsx
import { useProDialog } from '@lania-pro-components/components';
import { Button } from '@arco-design/web-react';

const Demo = () => {
  const { openDialog } = useProDialog();

  const handleOpen = () => {
    openDialog({
      title: '快捷弹窗',
      content: <p>使用 useProDialog 打开的弹窗</p>,
      onOk: () => {
        console.log('弹窗确认');
      },
    });
  };

  return <Button onClick={handleOpen}>打开快捷弹窗</Button>;
};
```

## 确认对话框

<ReactWrapper :component="ProDialogDemo3" />

```tsx
import { useProDialog } from '@lania-pro-components/components';
import { Button } from '@arco-design/web-react';

const Demo = () => {
  const { confirm } = useProDialog();

  const handleConfirm = () => {
    confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: () => {
        console.log('删除成功');
      },
    });
  };

  return <Button type="danger" onClick={handleConfirm}>删除</Button>;
};
```

<script setup lang="ts">
import ReactWrapper from '../.vitepress/theme/ReactWrapper.vue';
import ProDialogDemo1 from '../examples/pro-dialog/demo1';
import ProDialogDemo2 from '../examples/pro-dialog/demo2';
import ProDialogDemo3 from '../examples/pro-dialog/demo3';
</script>

