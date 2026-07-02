# ProForm

Schema 驱动的表单组件，通过 JSON 配置快速构建复杂表单。

## API

### 类型定义

#### LayoutMode

表单布局模式：`'horizontal'` | `'vertical'` | `'inline'` | `'compact'`

#### ButtonPosition

按钮组位置：`'left'` | `'center'` | `'right'`

#### FormStatus

表单状态：`'draft'` | `'readonly'` | `'preview'` | `'disabled'` | `'edit'`

#### FieldStatus

字段状态：`'edit'` | `'readonly'` | `'disabled'` | `'hidden'` | `'preview'`

### ProFormProps

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `schemas` | `ProFormSchema<TValues>[]` | - | 表单字段配置数组 |
| `layout` | `LayoutMode` | - | 表单布局模式 |
| `labelCol` | `ColProps` | - | 标签列配置 |
| `wrapperCol` | `ColProps` | - | 内容列配置 |
| `colon` | `boolean` | - | 是否显示冒号 |
| `labelAlign` | `'left' \| 'right'` | - | 标签对齐方式 |
| `size` | `'small' \| 'default' \| 'large'` | - | 表单尺寸 |
| `disabled` | `boolean` | - | 是否禁用所有字段 |
| `readonly` | `boolean` | - | 是否只读所有字段 |
| `draft` | `boolean` | - | 是否为草稿模式 |
| `preview` | `boolean` | - | 是否为预览模式 |
| `initialValues` | `Partial<TValues>` | - | 表单初始值 |
| `onFinish` | `(values: TValues) => void \| Promise<void>` | - | 表单提交成功回调 |
| `onFinishFailed` | `(errorInfo: unknown) => void` | - | 表单提交失败回调 |
| `onValuesChange` | `(changedValues, allValues) => void` | - | 字段值变化回调 |
| `onFieldsChange` | `(changedFields, allFields) => void` | - | 字段变化回调 |
| `onDraftChange` | `(draft: boolean) => void` | - | 草稿模式变化回调 |
| `onPreviewChange` | `(preview: boolean) => void` | - | 预览模式变化回调 |
| `showButton` | `boolean` | - | 是否显示按钮组 |
| `submitText` | `string` | - | 提交按钮文本 |
| `resetText` | `string` | - | 重置按钮文本 |
| `submitLoading` | `boolean` | - | 提交按钮加载状态 |
| `resetLoading` | `boolean` | - | 重置按钮加载状态 |
| `showSubmitButton` | `boolean` | - | 是否显示提交按钮 |
| `showResetButton` | `boolean` | - | 是否显示重置按钮 |
| `onReset` | `() => void` | - | 重置按钮点击事件 |
| `buttonPosition` | `ButtonPosition` | - | 按钮组位置 |
| `collapsible` | `boolean` | - | 是否启用展开/收起 |
| `collapsed` | `boolean` | - | 折叠状态（受控） |
| `defaultCollapsed` | `boolean` | - | 默认折叠状态（非受控） |
| `collapsedRows` | `number` | - | 折叠时展示的行数 |
| `expandText` | `string` | - | 展开按钮文案 |
| `collapseText` | `string` | - | 收起按钮文案 |
| `onCollapseChange` | `(collapsed: boolean) => void` | - | 折叠状态变更回调 |
| `rows` | `number` | - | Grid 布局行数 |
| `buttons` | `ReactNode` | - | 自定义按钮组 |
| `buttonList` | `ButtonConfig<TValues>[]` | - | 自定义按钮列表 |
| `okButtonProps` | `Record<string, unknown>` | - | 确认按钮属性 |
| `cancelButtonProps` | `Record<string, unknown>` | - | 取消按钮属性 |
| `rowProps` | `Record<string, unknown>` | - | Row 组件属性 |
| `colProps` | `Record<string, unknown>` | - | Col 组件属性 |
| `columns` | `number` | - | Grid 布局列数 |
| `gutter` | `number \| [number, number]` | - | Grid 布局间距 |
| `className` | `string` | - | 自定义类名 |
| `style` | `CSSProperties` | - | 自定义样式 |
| `formRef` | `React.Ref<ProFormInstance<TValues>>` | - | 表单实例引用 |
| `scrollToFirstError` | `boolean` | - | 验证失败时是否自动滚动到第一个错误字段 |
| `validateTrigger` | `'onBlur' \| 'onChange' \| 'onFocus'` | - | 验证触发时机 |
| `labelColProps` | `ColProps` | - | 全局标签列配置（别名） |
| `wrapperColProps` | `ColProps` | - | 全局内容列配置（别名） |
| `cardContainer` | `boolean \| { title?, extra?, bordered?, style?, className?, bodyStyle? }` | - | 卡片容器模式 |
| `performance` | `ProFormPerformanceConfig` | - | 性能优化配置 |
| `schemaProcessOptions` | `SchemaProcessOptions` | - | Schema 处理配置选项 |
| `keyboardNavigation` | `KeyboardNavigationConfig` | - | 键盘导航配置 |

### ProFormSchema

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | `string \| string[]` | - | 字段名称 |
| `label` | `string` | - | 字段标签 |
| `component` | `string` | - | 组件类型 |
| `componentProps` | `Record<string, unknown>` | - | 组件属性 |
| `required` | `boolean` | - | 是否必填 |
| `requiredMessage` | `string` | - | 必填项错误提示 |
| `rules` | `ValidationRule[]` | - | 验证规则 |
| `validate` | `(value, values) => string \| undefined \| Promise<...>` | - | 自定义验证函数 |
| `initialValue` | `unknown` | - | 初始值 |
| `col` | `number` | - | 在 Grid 布局中占用的列数 |
| `labelCol` | `ColProps` | - | 标签列配置 |
| `wrapperCol` | `ColProps` | - | 内容列配置 |
| `tooltip` | `string` | - | 标签提示信息 |
| `extra` | `ReactNode` | - | 表单项额外提示信息 |
| `placeholder` | `string` | - | 占位符文本 |
| `options` | `Array<{ label: string; value: unknown; ... }>` | - | 选项数据 |
| `format` | `string` | - | 日期/时间格式化字符串 |
| `prefix` | `string` | - | 前缀文本 |
| `suffix` | `string` | - | 后缀文本 |
| `transform` | `{ input?: (value) => unknown; output?: (value) => unknown }` | - | 值转换函数 |
| `dependencies` | `string[]` | - | 依赖的字段名列表 |
| `behavior` | `FieldBehavior` | - | 字段行为配置 |
| `reactions` | `FieldReaction[]` | - | 字段联动规则 |
| `lifecycle` | `FieldLifecycle` | - | 字段生命周期 |
| `readonlyMode` | `ReadonlyRenderConfig['mode']` | - | 只读/预览渲染模式 |
| `readonlyConfig` | `ReadonlyRenderConfig` | - | 只读/预览渲染配置 |
| `readonlyComponent` | `string` | - | 只读/预览时使用的渲染器名称 |
| `children` | `ProFormSchema<TValues>[]` | - | 子字段配置 |
| `onFieldChange` | `(value, allValues) => void` | - | 字段值变化回调 |

### ValidationRule

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `required` | `boolean` | - | 是否必填 |
| `min` | `number` | - | 最小值 |
| `max` | `number` | - | 最大值 |
| `minLength` | `number` | - | 最小长度 |
| `maxLength` | `number` | - | 最大长度 |
| `len` | `number` | - | 固定长度 |
| `precision` | `number` | - | 精度 |
| `step` | `number` | - | 步长 |
| `type` | `'number' \| 'integer' \| 'float' \| 'string' \| 'boolean'` | - | 类型 |
| `sign` | `'positive' \| 'negative' \| 'zero'` | - | 符号 |
| `whitespace` | `boolean` | - | 是否允许空白 |
| `pattern` | `RegExp \| string` | - | 正则表达式 |
| `validator` | `(value, values) => string \| undefined \| Promise<...>` | - | 自定义验证函数 |
| `message` | `string` | - | 错误提示信息 |

### ProFormInstance

表单实例对象，提供表单操作方法。

| 方法 | 说明 |
| --- | --- |
| `validate()` | 验证所有字段，返回表单值 |
| `validateField(name)` | 验证指定字段 |
| `clearValidate(name?)` | 清除验证信息 |
| `setFieldsValue(values)` | 批量设置字段值 |
| `setFieldValue(name, value)` | 设置单个字段值 |
| `getFieldValue(name)` | 获取单个字段值 |
| `getFieldsValue(nameList?)` | 获取所有字段值 |
| `getRef(name)` | 获取组件实例引用 |
| `setSchemas(schemas)` | 动态更新表单配置 |
| `setProps(props)` | 动态更新表单属性 |
| `resetFields(nameList?)` | 重置字段值 |
| `scrollToField(name)` | 滚动到指定字段 |
| `submit()` | 提交表单 |
| `getFieldStatus(name)` | 获取字段状态 |
| `setFieldStatus(name, status)` | 设置字段状态 |
| `isDraft()` | 判断是否为草稿模式 |
| `setDraft(draft)` | 设置草稿模式 |
| `isPreview()` | 判断是否为预览模式 |
| `setPreview(preview)` | 设置预览模式 |
| `focusField(name)` | 聚焦到指定字段 |
| `focusNextField(currentName?)` | 聚焦到下一个字段 |
| `focusPrevField(currentName?)` | 聚焦到上一个字段 |
| `getFocusedField()` | 获取当前聚焦的字段名 |
| `getFieldFocused(name)` | 获取指定字段的聚焦状态 |

### useProForm Hook

```tsx
const {
  arcoForm,
  instance,
  schemas,
  setSchemas,
  formProps,
  setComponentRef,
  fieldStatusMap,
  setFieldStatusMap,
  isDraftState,
  setIsDraftState,
  isPreviewState,
  setIsPreviewState,
  options,
  bindingProps,
  formStore,
  Provider,
  fieldNavigation,
} = useProForm(options);
```

#### UseProFormOptions

继承自 `ProFormProps`，额外属性：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `schemas` | `ProFormSchema<TValues>[]` | - | 表单字段配置数组 |
| `initialValues` | `Partial<TValues>` | - | 表单初始值 |
| `onValuesChange` | `(changedValues, allValues) => void` | - | 字段值变化回调 |
| `onFieldsChange` | `(changedFields, allFields) => void` | - | 字段变化回调 |

#### UseProFormReturn

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `arcoForm` | `ArcoFormInstance` | Arco Form 兼容实例 |
| `instance` | `ProFormInstance<TValues>` | ProForm 实例 |
| `schemas` | `ProFormSchema<TValues>[]` | 当前表单字段配置 |
| `setSchemas` | `(schemas) => void` | 更新表单字段配置 |
| `formProps` | `Partial<ProFormProps<TValues>>` | 表单属性 |
| `setComponentRef` | `(name, ref) => void` | 设置组件引用 |
| `fieldStatusMap` | `Record<string, FieldStatus>` | 字段状态映射 |
| `setFieldStatusMap` | `(statusMap) => void` | 更新字段状态映射 |
| `isDraftState` | `boolean` | 草稿模式状态 |
| `setIsDraftState` | `(draft) => void` | 设置草稿模式状态 |
| `isPreviewState` | `boolean` | 预览模式状态 |
| `setIsPreviewState` | `(preview) => void` | 设置预览模式状态 |
| `options` | `UseProFormOptions<TValues>` | Hook 配置选项 |
| `bindingProps` | `ProFormProps<TValues>` | 绑定到 ProForm 的属性 |
| `formStore` | `FormStore` | 表单存储实例 |
| `Provider` | `React.FC<{ children }>` | 上下文 Provider |
| `fieldNavigation` | `UseFieldNavigationReturn` | 键盘导航功能 |

### useProFormContext Hook

```tsx
const { formStore, instance, arcoForm } = useProFormContext<TValues>();
```

用于在子组件中获取表单上下文。

#### ProFormContextValue

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `formStore` | `FormStore \| null` | 表单存储实例 |
| `instance` | `ProFormInstance<TValues> \| null` | ProForm 实例 |
| `arcoForm` | `ArcoFormInstance \| null` | Arco Form 兼容实例 |

## 基本用法

<ReactWrapper :component="ProFormDemo1" />

```tsx
import { ProForm } from '@lania-pro-components/components';

const schema = [
  {
    type: 'input',
    field: 'name',
    label: '姓名',
    required: true,
    placeholder: '请输入姓名',
  },
  {
    type: 'input',
    field: 'email',
    label: '邮箱',
    required: true,
    placeholder: '请输入邮箱',
  },
  {
    type: 'select',
    field: 'gender',
    label: '性别',
    required: true,
    options: [
      { value: 'male', label: '男' },
      { value: 'female', label: '女' },
    ],
  },
];

const Demo = () => (
  <ProForm
    schema={schema}
    onSubmit={(values) => {
      console.log('表单值:', values);
    }}
  />
);
```

## 使用 useProForm

<ReactWrapper :component="ProFormDemo2" />

```tsx
import { useProForm, ProForm } from '@lania-pro-components/components';

const schema = [
  {
    type: 'input',
    field: 'username',
    label: '用户名',
    required: true,
  },
  {
    type: 'password',
    field: 'password',
    label: '密码',
    required: true,
  },
];

const Demo = () => {
  const { formInstance, Provider } = useProForm({
    schema,
    onSubmit: (values) => {
      console.log('登录信息:', values);
    },
  });

  return (
    <Provider>
      <div>
        <ProForm />
        <button onClick={() => formInstance?.validate()}>验证表单</button>
      </div>
    </Provider>
  );
};
```

## 自定义渲染

<ReactWrapper :component="ProFormDemo3" />

```tsx
import { ProForm } from '@lania-pro-components/components';
import { Input } from '@arco-design/web-react';

const schema = [
  {
    type: 'input',
    field: 'custom',
    label: '自定义输入',
    render: ({ field }) => (
      <Input
        {...field}
        prefix="¥"
        placeholder="请输入金额"
      />
    ),
  },
];

const Demo = () => <ProForm schema={schema} />;
```

<script setup lang="ts">
import ReactWrapper from '../.vitepress/theme/ReactWrapper.vue';
import ProFormDemo1 from '../examples/pro-form/demo1';
import ProFormDemo2 from '../examples/pro-form/demo2';
import ProFormDemo3 from '../examples/pro-form/demo3';
</script>

