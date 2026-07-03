# ProLayout

页面级布局容器组件，封装 PageHeader + Content + Footer + Sider 四个区域，支持三种布局模式，响应式内置，主题联动。

## API

### 导出

| 导出                | 类型 | 说明         |
| ------------------- | ---- | ------------ |
| `ProLayout`         | 组件 | 主布局容器   |
| `PageHeader`        | 组件 | 页头         |
| `Content`           | 组件 | 内容区       |
| `Footer`            | 组件 | 底部按钮区   |
| `Sider`             | 组件 | 侧边栏       |
| `useSiderCollapsed` | Hook | 折叠状态管理 |

### ProLayoutProps

| 属性         | 类型                                   | 默认值  | 说明                           |
| ------------ | -------------------------------------- | ------- | ------------------------------ |
| `layout`     | `'top' \| 'side' \| 'mix'`             | `'top'` | 布局模式                       |
| `header`     | `PageHeaderConfig`                     | -       | 页头配置                       |
| `sider`      | `SiderConfig`                          | -       | 侧边栏配置（仅 side/mix 生效） |
| `content`    | `ContentConfig`                        | -       | 内容区配置                     |
| `footer`     | `FooterConfig`                         | -       | 底部配置                       |
| `responsive` | `{ mobile?: number; tablet?: number }` | -       | 响应式断点覆盖                 |

### PageHeaderConfig

| 属性          | 类型               | 默认值 | 说明                 |
| ------------- | ------------------ | ------ | -------------------- |
| `title`       | `ReactNode`        | -      | 主标题               |
| `subTitle`    | `ReactNode`        | -      | 副标题               |
| `description` | `ReactNode`        | -      | 描述文本             |
| `breadcrumb`  | `BreadcrumbItem[]` | -      | 面包屑导航           |
| `extra`       | `ReactNode`        | -      | 操作按钮区（右对齐） |
| `visible`     | `boolean`          | `true` | 是否显示             |

### SiderConfig

| 属性                | 类型                   | 默认值 | 说明                    |
| ------------------- | ---------------------- | ------ | ----------------------- |
| `collapsed`         | `boolean`              | -      | 是否折叠（受控）        |
| `onCollapsedChange` | `(c: boolean) => void` | -      | 折叠回调                |
| `storageKey`        | `string`               | -      | localStorage 持久化 key |
| `width`             | `number`               | `200`  | 展开宽度                |
| `collapsedWidth`    | `number`               | `64`   | 折叠宽度                |
| `children`          | `ReactNode`            | -      | 菜单内容                |

### ContentConfig

| 属性            | 类型                                                           | 说明           |
| --------------- | -------------------------------------------------------------- | -------------- |
| `cardContainer` | `CardContainerConfig \| { title, extra, bordered, bodyStyle }` | 卡片容器配置   |
| `layout`        | `'horizontal' \| 'vertical' \| 'inline'`                       | 内容区布局方向 |

### FooterConfig

| 属性       | 类型                            | 默认值    | 说明                 |
| ---------- | ------------------------------- | --------- | -------------------- |
| `position` | `'left' \| 'center' \| 'right'` | `'right'` | 按钮位置             |
| `children` | `ReactNode`                     | -         | 按钮组               |
| `visible`  | `boolean`                       | `true`    | 是否显示             |
| `fixed`    | `boolean`                       | `true`    | 是否 sticky 固定底部 |

### useSiderCollapsed

```ts
const [collapsed, setCollapsed] = useSiderCollapsed(options?: {
  collapsed?: boolean;          // 受控值
  onCollapsedChange?: (c: boolean) => void;
  storageKey?: string;          // localStorage key
});
```

## 主题联动

ProLayout 全部使用 CSS 变量（`var(--color-bg-*)`、`var(--color-border-*)`），自动跟随 Arco light/dark 主题切换。需配合 `ThemeProvider` 使用：

```tsx
import { ThemeProvider } from '@lania-pro-components/theme';
import '@lania-pro-components/theme/light.css';
import '@lania-pro-components/theme/dark.css';

<ThemeProvider>
  <ProLayout header={{ title: '页面标题' }}>
    <Content />
  </ProLayout>
</ThemeProvider>;
```
