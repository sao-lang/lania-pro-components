# ProSelect

高级选择器组件，基于 Arco Design Select 封装，支持远程搜索、分页加载、虚拟滚动、标签模式、全选等高级功能。

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

## API

### 导出组件

| 组件        | 说明           |
| ----------- | -------------- |
| `ProSelect` | 高级选择器组件 |

### ProSelectProps

继承自 `Omit<SelectProps, 'options' | 'onSearch'>`。

| 属性                  | 类型                                                               | 默认值                                                                 | 说明                                   |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------- |
| `options`             | `ProSelectOption[]`                                                | `[]`                                                                   | 选项数据（静态模式）                   |
| `request`             | `(params) => Promise<ProSelectRequestResult \| ProSelectOption[]>` | -                                                                      | 远程数据请求函数                       |
| `search`              | `boolean`                                                          | `false`                                                                | 是否开启搜索                           |
| `debounceTime`        | `number`                                                           | `300`                                                                  | 搜索防抖时间（毫秒）                   |
| `pagination`          | `boolean`                                                          | `false`                                                                | 是否开启分页加载                       |
| `pageSize`            | `number`                                                           | `20`                                                                   | 每页条数                               |
| `showLoading`         | `boolean`                                                          | `true`                                                                 | 是否显示加载状态                       |
| `optionRender`        | `(option) => ReactNode`                                            | -                                                                      | 自定义选项渲染                         |
| `emptyRender`         | `ReactNode`                                                        | -                                                                      | 自定义空状态显示                       |
| `formatOptions`       | `(data) => ProSelectOption[]`                                      | -                                                                      | 数据格式化函数                         |
| `fieldNames`          | `{ label?, value?, disabled?, group? }`                            | `{ label:'label', value:'value', disabled:'disabled', group:'group' }` | 字段映射配置                           |
| `tagMode`             | `boolean`                                                          | `false`                                                                | 是否启用标签模式                       |
| `tagProps`            | `TagProps`                                                         | -                                                                      | Tag 组件属性                           |
| `tagRender`           | `(option, onClose) => ReactNode`                                   | -                                                                      | 自定义 Tag 渲染                        |
| `showSelectAll`       | `boolean`                                                          | `false`                                                                | 是否显示全选按钮（仅在多选模式下有效） |
| `selectAllText`       | `string`                                                           | `'全选'`                                                               | 全选按钮文本                           |
| `unselectAllText`     | `string`                                                           | `'取消全选'`                                                           | 取消全选按钮文本                       |
| `virtual`             | `boolean`                                                          | `false`                                                                | 是否启用虚拟滚动（大数据量时建议开启） |
| `virtualHeight`       | `number`                                                           | `256`                                                                  | 虚拟滚动高度                           |
| `virtualItemHeight`   | `number`                                                           | `32`                                                                   | 虚拟滚动每项高度                       |
| `showOptionIcon`      | `boolean`                                                          | `false`                                                                | 是否显示选项图标                       |
| `optionIconRender`    | `(option) => ReactNode`                                            | -                                                                      | 选项图标渲染                           |
| `clearSearchOnSelect` | `boolean`                                                          | `false`                                                                | 选中后是否清空搜索关键词               |
| `maxTagCount`         | `number`                                                           | -                                                                      | 最大显示标签数（仅在 tag 模式下有效）  |
| `allowCreate`         | `boolean`                                                          | `false`                                                                | 是否启用创建条目（允许用户创建新选项） |
| `validateCreate`      | `(inputValue) => boolean \| Promise<boolean>`                      | -                                                                      | 创建条目校验函数                       |
| `formatCreateOption`  | `(inputValue) => ProSelectOption`                                  | -                                                                      | 创建条目格式化函数                     |
| `dropdownHeader`      | `ReactNode`                                                        | -                                                                      | 自定义下拉框头部                       |
| `dropdownFooter`      | `ReactNode`                                                        | -                                                                      | 自定义下拉框底部                       |

### ProSelectOption

| 属性       | 类型               | 说明                 |
| ---------- | ------------------ | -------------------- |
| `label`    | `ReactNode`        | 选项标签             |
| `value`    | `string \| number` | 选项值               |
| `disabled` | `boolean`          | 是否禁用             |
| `group`    | `string`           | 选项分组             |
| `tagColor` | `string`           | 标签颜色（tag 模式） |

### ProSelectRequestParams

| 属性       | 类型     | 说明       |
| ---------- | -------- | ---------- |
| `keyword`  | `string` | 搜索关键词 |
| `page`     | `number` | 当前页码   |
| `pageSize` | `number` | 每页条数   |

### ProSelectRequestResult

| 属性      | 类型      | 说明             |
| --------- | --------- | ---------------- |
| `data`    | `T[]`     | 选项数据列表     |
| `total`   | `number`  | 总条数           |
| `hasMore` | `boolean` | 是否还有更多数据 |

### ProSelectInstance

| 方法                   | 说明             |
| ---------------------- | ---------------- |
| `refresh()`            | 刷新数据         |
| `loadMore()`           | 加载更多数据     |
| `clearOptions()`       | 清空选项         |
| `getOptions()`         | 获取当前选项列表 |
| `setOptions(options)`  | 设置选项列表     |
| `selectAll()`          | 全选             |
| `unselectAll()`        | 取消全选         |
| `getSelectedOptions()` | 获取已选项       |
| `focus()`              | 聚焦             |
| `blur()`               | 失焦             |
| `create(inputValue)`   | 创建新选项       |

## 基本用法

<ReactWrapper :component="Demo1" />

```tsx
import { ProSelect } from '@lania-pro-components/components';

const options = [
  { value: 'option1', label: '选项一' },
  { value: 'option2', label: '选项二' },
  { value: 'option3', label: '选项三' },
];

const Demo = () => (
  <ProSelect options={options} placeholder='请选择' onChange={(value) => console.log('选中:', value)} />
);
```

## 远程搜索

<ReactWrapper :component="Demo2" />

```tsx
import { ProSelect } from '@lania-pro-components/components';
const data = [
  { label: '123', value: '1' },
  { label: '62345', value: '2' },
  { label: 'gsdfg', value: '3' },
  { label: '65453', value: '4' },
  { label: '4353245', value: '5' },
];
const api = (
  keyword?: string,
  pageSize: number = 10,
  pageNumber: number = 1,
): Promise<{ data: typeof data; total: number }> => {
  return new Promise((resolve) => {
    const filtered = !keyword ? data : data.filter((item) => item.label.includes(keyword));
    setTimeout(() => {
      resolve({
        data: filtered.slice(pageSize * pageNumber, pageSize),
        total: filtered.length,
      });
    }, 300);
  });
};
const Demo = () => (
  <ProSelect
    search
    debounceTime={500}
    placeholder='输入关键词搜索'
    request={async ({ keyword, page, pageSize }) => {
      const res = await api(keyword, pageSize, page);
      return res;
    }}
  />
);

export default Demo;

```

## 多选 + 标签模式 + 全选

<ReactWrapper :component="Demo4" />

```tsx
import { ProSelect } from '@lania-pro-components/components';

const options = [
  { label: '前端', value: 'frontend', tagColor: 'blue' },
  { label: '后端', value: 'backend', tagColor: 'green' },
  { label: '测试', value: 'test', tagColor: 'orange' },
];

const Demo = () => <ProSelect mode='multiple' tagMode showSelectAll options={options} placeholder='请选择多个选项' />;
```

## 虚拟滚动

<ReactWrapper :component="Demo5" />

```tsx
import { ProSelect } from '@lania-pro-components/components';
import { useState } from 'react';

const Demo = () => {
  const [, setValue] = useState<string | number | undefined>();

  return (
    <ProSelect
      options={new Array(500).map((_, index: number) => ({ label: `虚拟滚动${index + 1}`, value: index }))}
      virtual
      virtualHeight={200}
      placeholder='虚拟滚动示例'
      onChange={setValue}
    />
  );
};

export default Demo;

```

## 允许创建条目

<ReactWrapper :component="Demo6" />

```tsx
import { ProSelect } from '@lania-pro-components/components';
import { useState } from 'react';

const Demo = () => {
  const [value, setValue] = useState([]);

  return (
    <ProSelect
      mode='multiple'
      allowCreate
      options={[
        { label: '选项 A', value: 'a' },
        { label: '选项 B', value: 'b' },
      ]}
      placeholder='输入并创建新选项'
      onChange={setValue}
    />
  );
};
```

## 字段映射

<ReactWrapper :component="Demo7" />

```tsx
import { ProSelect } from '@lania-pro-components/components';

const Demo = () => (
  <ProSelect
    fieldNames={{ label: 'name', value: 'id', group: 'category' }}
    options={[
      { name: '选项1', id: 1, category: '分组A' },
      { name: '选项2', id: 2, category: '分组A' },
    ]}
    placeholder='自定义字段映射'
  />
);
```

## 自定义选项渲染

<ReactWrapper :component="Demo8" />

```tsx
import { ProSelect } from '@lania-pro-components/components';
import { Avatar } from '@arco-design/web-react';

const users = [
  { label: '张三', value: 1, email: 'zhangsan@example.com' },
  { label: '李四', value: 2, email: 'lisi@example.com' },
  { label: '王五', value: 3, email: 'wangwu@example.com' },
];

const Demo = () => (
  <ProSelect
    options={users}
    placeholder='选择用户'
    optionRender={(option) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar size={24}>{String(option.label)[0]}</Avatar>
        <div>
          <div>{String(option.label)}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{option.email}</div>
        </div>
      </div>
    )}
  />
);
```

## 分页加载

<ReactWrapper :component="Demo9" />

```tsx
import { ProSelect } from '@lania-pro-components/components';
import { useState } from 'react';

const simulateApi = ({ keyword, page, pageSize }) => {
  const total = 45;
  const allData = Array.from({ length: total }, (_, i) => ({
    label: `选项 ${i + 1}`,
    value: i + 1,
  }));
  const filtered = allData.filter((item) => item.label.includes(keyword));
  const start = (page - 1) * pageSize;
  return Promise.resolve({
    data: filtered.slice(start, start + pageSize),
    total: filtered.length,
  });
};

const Demo = () => {
  const [value, setValue] = useState();

  return (
    <ProSelect
      pagination
      pageSize={10}
      placeholder='滚动加载更多'
      request={({ keyword, page, pageSize }) => simulateApi({ keyword, page, pageSize })}
      onChange={setValue}
    />
  );
};
```

<script setup lang="ts">
import ReactWrapper from '../.vitepress/theme/ReactWrapper.vue';
import Demo1 from '../examples/pro-select/demo1';
import Demo2 from '../examples/pro-select/demo2';
import Demo4 from '../examples/pro-select/demo4';
import Demo5 from '../examples/pro-select/demo5';
import Demo6 from '../examples/pro-select/demo6';
import Demo7 from '../examples/pro-select/demo7';
import Demo8 from '../examples/pro-select/demo8';
import Demo9 from '../examples/pro-select/demo9';
</script>
