# ProLayout

页面级布局容器组件，封装 PageHeader + Content + Footer + Sider 四个区域，支持三种布局模式。

## 架构设计

```
ProLayout
├── 布局模式
│   ├── top（默认） - PageHeader + Content + Footer 垂直排列
│   ├── side - Sider + (PageHeader + Content + Footer) 水平排列
│   └── mix - top 布局 + Sider 在 Content 区域内
│
├── 子组件
│   ├── PageHeader - 页头（title/subTitle/description/breadcrumb/extra）
│   ├── Content - 内容区（支持 CardContainerConfig 卡片包裹）
│   ├── Footer - 底部按钮区（支持 FooterPosition + getFooterJustify）
│   └── Sider - 侧边栏（折叠状态持久化）
│
├── 上下文
│   ├── RootContext - 全局配置层（布局模式/响应式/Sider 折叠状态）
│   ├── HeaderContext - 页头配置层
│   ├── ContentContext - 内容配置层
│   └── FooterContext - 底部配置层
│
└── 通用能力
    ├── 响应式 - mobile 自动转 top 布局 + Sider Drawer 模式
    ├── 主题联动 - 全部使用 CSS 变量（var(--color-*)），自动跟随 light/dark
    └── 折叠持久化 - Sider 折叠状态 localStorage 持久化
```

## 快速开始

```tsx
import { ProLayout } from '@lania-pro-components/components/ProLayout';
// 或
import { ProLayout } from '@lania-pro-components/components';

// 基础 top 布局
<ProLayout
  header={{
    title: '订单管理',
    subTitle: '管理所有订单信息',
    extra: <AddButton />,
  }}
  footer={{
    position: 'right',
    children: <Button type="primary">提交</Button>,
  }}
>
  <ProTable columns={columns} request={request} />
</ProLayout>

// side 布局
<ProLayout
  layout="side"
  header={{ title: '管理后台' }}
  sider={{ children: <Menu items={menuItems} /> }}
>
  <ProTable columns={columns} request={request} />
</ProLayout>

// 简化用法（仅 Content）
<ProLayout>
  <ProTable columns={columns} request={request} />
</ProLayout>
```

## API

### ProLayoutProps

| 参数       | 说明                           | 类型                       | 默认值  |
| ---------- | ------------------------------ | -------------------------- | ------- |
| layout     | 布局模式                       | `'top' \| 'side' \| 'mix'` | `'top'` |
| header     | 页头配置                       | `PageHeaderConfig`         | -       |
| sider      | 侧边栏配置（仅 side/mix 生效） | `SiderConfig`              | -       |
| content    | 内容区配置                     | `ContentConfig`            | -       |
| footer     | 底部配置                       | `FooterConfig`             | -       |
| responsive | 响应式断点覆盖                 | `{ mobile?, tablet? }`     | -       |
| className  | 自定义类名                     | `string`                   | -       |
| style      | 自定义样式                     | `CSSProperties`            | -       |

### PageHeaderConfig

| 参数        | 说明                 | 类型               | 默认值 |
| ----------- | -------------------- | ------------------ | ------ |
| title       | 主标题               | `ReactNode`        | -      |
| subTitle    | 副标题               | `ReactNode`        | -      |
| description | 描述文本             | `ReactNode`        | -      |
| breadcrumb  | 面包屑导航           | `BreadcrumbItem[]` | -      |
| extra       | 操作按钮区（右对齐） | `ReactNode`        | -      |
| visible     | 是否显示             | `boolean`          | `true` |

### SiderConfig

| 参数              | 说明             | 类型                   | 默认值 |
| ----------------- | ---------------- | ---------------------- | ------ |
| collapsed         | 是否折叠（受控） | `boolean`              | -      |
| onCollapsedChange | 折叠回调         | `(c: boolean) => void` | -      |
| storageKey        | localStorage key | `string`               | -      |
| width             | 展开宽度         | `number`               | `200`  |
| collapsedWidth    | 折叠宽度         | `number`               | `64`   |
| children          | 菜单内容         | `ReactNode`            | -      |

### ContentConfig

| 参数          | 说明         | 类型                                                           |
| ------------- | ------------ | -------------------------------------------------------------- |
| cardContainer | 卡片容器配置 | `CardContainerConfig \| { title, extra, bordered, bodyStyle }` |
| layout        | 布局方向     | `'horizontal' \| 'vertical' \| 'inline'`                       |

### FooterConfig

| 参数     | 说明                 | 类型                            | 默认值    |
| -------- | -------------------- | ------------------------------- | --------- |
| position | 按钮位置             | `'left' \| 'center' \| 'right'` | `'right'` |
| children | 按钮组               | `ReactNode`                     | -         |
| fixed    | 是否 sticky 固定底部 | `boolean`                       | `true`    |

### ProLayoutProps

| 参数       | 说明                           | 类型                                   | 默认值  |
| ---------- | ------------------------------ | -------------------------------------- | ------- |
| layout     | 布局模式                       | `'top' \| 'side' \| 'mix'`             | `'top'` |
| header     | 页头配置                       | `PageHeaderConfig`                     | -       |
| sider      | 侧边栏配置（仅 side/mix 生效） | `SiderConfig`                          | -       |
| content    | 内容区配置                     | `ContentConfig`                        | -       |
| footer     | 底部配置                       | `FooterConfig`                         | -       |
| responsive | 响应式断点覆盖                 | `{ mobile?: number; tablet?: number }` | -       |

### 子组件独立使用

```tsx
import { PageHeader, Content, Footer, Sider } from '@lania-pro-components/components/ProLayout';
import { useSiderCollapsed } from '@lania-pro-components/components/ProLayout';

// 独立使用 PageHeader
<PageHeader config={{ title: '页面标题', breadcrumb: crumbs }} />

// 独立使用 Footer
<Footer config={{ position: 'center', children: <Button>确认</Button> }} />

// 独立使用 Sider + useSiderCollapsed
const [collapsed, setCollapsed] = useSiderCollapsed({ storageKey: 'my-sider' });
<Sider config={{ children: <Menu /> }} collapsed={collapsed} />
```

## 设计原则

- **组合既有抽象为核心**：消费 ProTable Toolbar 三件套、ProForm CardContainerConfig、ProDialog FooterPosition
- **复用优于重新实现**：直接 import useResponsive、useTheme、getFooterJustify
- **不内置菜单/路由/权限**：仅提供容器，业务能力通过 children 注入
