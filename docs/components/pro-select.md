# ProSelect

高级选择组件，支持远程搜索、多选、分组等功能。

## API

### 类型定义

#### ProSelectOption

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | `ReactNode` | - | 选项标签 |
| `value` | `string \| number` | - | 选项值 |
| `disabled` | `boolean` | - | 是否禁用 |
| `group` | `string` | - | 选项分组 |
| `tagColor` | `string` | - | 标签颜色（用于 tag 模式） |

#### ProSelectRequestParams

远程数据请求参数。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `keyword` | `string` | - | 搜索关键词 |
| `page` | `number` | - | 当前页码 |
| `pageSize` | `number` | - | 每页条数 |

#### ProSelectRequestResult

远程数据请求结果。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data` | `ProSelectOption[]` | - | 选项数据列表 |
| `total` | `number` | - | 总条数 |
| `hasMore` | `boolean` | - | 是否还有更多数据 |

### ProSelectProps

继承自 `Omit<SelectProps, 'options' \| 'onSearch'>`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `options` | `ProSelectOption[]` | - | 选项数据 |
| `request` | `(params) => Promise<ProSelectRequestResult \| ProSelectOption[]>` | - | 远程数据请求函数 |
| `search` | `boolean` | `false` | 是否开启搜索 |
| `debounceTime` | `number` | `300` | 搜索防抖时间（毫秒） |
| `pagination` | `boolean` | `false` | 是否开启分页加载 |
| `pageSize` | `number` | `20` | 每页条数 |
| `showLoading` | `boolean` | `true` | 是否显示加载状态 |
| `optionRender` | `(option) => ReactNode` | - | 自定义选项渲染 |
| `emptyRender` | `ReactNode` | - | 自定义空状态显示 |
| `formatOptions` | `(data) => ProSelectOption[]` | - | 数据格式化函数 |
| `fieldNames` | `{ label?, value?, disabled?, group? }` | - | 字段映射配置 |
| `tagMode` | `boolean` | `false` | 是否启用标签模式 |
| `tagProps` | `TagProps` | - | Tag 组件属性 |
| `tagRender` | `(option, onClose) => ReactNode` | - | 自定义 Tag 渲染 |
| `showSelectAll` | `boolean` | `false` | 是否显示全选按钮（仅在多选模式下有效） |
| `selectAllText` | `string` | `'全选'` | 全选按钮文本 |
| `unselectAllText` | `string` | `'取消全选'` | 取消全选按钮文本 |
| `virtual` | `boolean` | `false` | 是否启用虚拟滚动（大数据量时建议开启） |
| `virtualHeight` | `number` | `256` | 虚拟滚动高度 |
| `virtualItemHeight` | `number` | `32` | 虚拟滚动每项高度 |
| `showOptionIcon` | `boolean` | `false` | 是否显示选项图标 |
| `optionIconRender` | `(option) => ReactNode` | - | 选项图标渲染 |
| `clearSearchOnSelect` | `boolean` | `false` | 选中后是否清空搜索关键词 |
| `maxTagCount` | `number` | - | 最大显示标签数（仅在 tag 模式下有效） |
| `allowCreate` | `boolean` | `false` | 是否启用创建条目（允许用户创建新选项） |
| `validateCreate` | `(inputValue) => boolean \| Promise<boolean>` | - | 创建条目校验函数 |
| `formatCreateOption` | `(inputValue) => ProSelectOption` | - | 创建条目格式化函数 |
| `dropdownHeader` | `ReactNode` | - | 自定义下拉框头部 |
| `dropdownFooter` | `ReactNode` | - | 自定义下拉框底部 |

### ProSelectInstance

选择器实例对象，提供选择器操作方法。

| 方法 | 说明 |
| --- | --- |
| `refresh()` | 刷新数据 |
| `loadMore()` | 加载更多数据 |
| `clearOptions()` | 清空选项 |
| `getOptions()` | 获取当前选项列表 |
| `setOptions(options)` | 设置选项列表 |
| `selectAll()` | 全选 |
| `unselectAll()` | 取消全选 |
| `getSelectedOptions()` | 获取已选项 |
| `focus()` | 聚焦 |
| `blur()` | 失焦 |
| `create(inputValue)` | 创建新选项 |

## 基本用法

<ReactWrapper :component="ProSelectDemo1" />

```tsx
import { ProSelect } from '@lania-pro-components/components';

const options = [
  { value: 'option1', label: '选项一' },
  { value: 'option2', label: '选项二' },
  { value: 'option3', label: '选项三' },
];

const Demo = () => (
  <ProSelect
    options={options}
    placeholder="请选择"
    onChange={(value) => console.log('选中:', value)}
  />
);
```

## 远程搜索

<ReactWrapper :component="ProSelectDemo2" />

```tsx
import { ProSelect } from '@lania-pro-components/components';

const Demo = () => (
  <ProSelect
    remote
    placeholder="输入关键词搜索"
    onSearch={(keyword) =>
      Promise.resolve([
        { value: '1', label: `搜索结果: ${keyword}` },
      ])
    }
  />
);
```

## 多选模式

<ReactWrapper :component="ProSelectDemo3" />

```tsx
import { ProSelect } from '@lania-pro-components/components';

const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
  { value: 'c', label: '选项 C' },
];

const Demo = () => (
  <ProSelect
    options={options}
    multiple
    placeholder="请选择多个选项"
  />
);
```

<script setup lang="ts">
import ReactWrapper from '../.vitepress/theme/ReactWrapper.vue';
import ProSelectDemo1 from '../examples/pro-select/demo1';
import ProSelectDemo2 from '../examples/pro-select/demo2';
import ProSelectDemo3 from '../examples/pro-select/demo3';
</script>

