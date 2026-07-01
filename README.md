# Pro-Components

基于 Arco Design 的 Schema 驱动企业级组件库，致力于通过声明式配置降低中后台页面开发复杂度。

## 核心理念

**配置化优先**：所有功能通过 Schema 配置开启，减少命令式编码，降低心智负担。

**分层架构**：核心层 → 功能层 → 插件层，各层职责清晰，支持按需加载和 Tree Shaking。

**类型安全**：完整的 TypeScript 类型支持，提供 IDE 智能提示和编译时类型检查。

## 组件概览

| 组件 | 说明 | 核心能力 |
|------|------|----------|
| ProForm | Schema 驱动表单 | 响应式状态管理、字段联动、虚拟滚动、草稿/预览模式 |
| ProTableN | Schema 驱动表格 | 数据状态管理、查询表单、列渲染、行选择、可编辑、缓存 |
| ProDialog | 高级弹窗 | 表单弹窗/表格弹窗/抽屉模式、实例化管理、二次确认 |
| ActionButton | 操作按钮集 | 增删改查导出导入跳转等常用操作按钮 |
| ProSelect | 增强选择器 | 远程搜索、分页加载、虚拟滚动、标签模式、全选 |
| ProUpload | 增强上传 | 图片/视频/文件上传、压缩裁剪、预览、拖拽 |

## 组件间关系

```
ProTableN ── 内嵌 ──→ ProForm（查询表单）
    │                      │
    ├── 集成 ──→ ProDialog（表格弹窗）
    │                      │
    └── 使用 ──→ ActionButton（操作列/工具栏）

ProDialog ── 内嵌 ──→ ProForm（表单弹窗）
    │
    └── 内嵌 ──→ ProTableN（表格选择弹窗）
```

## 快速上手

### 安装

```bash
npm install @arco-design/web-react
```

### 基础表单

```tsx
import { ProForm } from '@/pro-components/ProForm';

const MyForm = () => (
  <ProForm
    schemas={[
      { name: 'username', label: '用户名', component: 'Input', required: true },
      { name: 'email', label: '邮箱', component: 'Input', required: true },
      { name: 'role', label: '角色', component: 'Select', options: [
        { label: '管理员', value: 'admin' },
        { label: '用户', value: 'user' },
      ]},
    ]}
    onFinish={async (values) => {
      console.log(values);
    }}
  />
);
```

### 基础表格

```tsx
import { ProTableN } from '@/pro-components/ProTableN';

const MyTable = () => (
  <ProTableN
    columns={[
      { title: 'ID', dataIndex: 'id', valueType: 'index' },
      { title: '用户名', dataIndex: 'username', valueType: 'text' },
      { title: '状态', dataIndex: 'status', valueType: 'enum', valueEnum: {
        active: { text: '启用', status: 'success' },
        disabled: { text: '禁用', status: 'error' },
      }},
      { title: '创建时间', dataIndex: 'createdAt', valueType: 'date' },
      { title: '金额', dataIndex: 'amount', valueType: 'money' },
    ]}
    request={async (params) => {
      const res = await fetchUsers(params);
      return { data: res.list, total: res.total };
    }}
    search={{ showReset: true }}
    toolbar={{ showRefresh: true, showDensity: true }}
  />
);
```

### 弹窗表单

```tsx
import { ProDialog } from '@/pro-components/ProDialog';

const dialogRef = useRef<ProDialogInstance>(null);

<ProDialog
  ref={dialogRef}
  title="新增用户"
  schemas={[
    { name: 'username', label: '用户名', component: 'Input', required: true },
    { name: 'email', label: '邮箱', component: 'Input', required: true },
  ]}
  onSubmit={async (values) => {
    await createUser(values);
    return true; // 返回 true 自动关闭弹窗
  }}
/>

// 打开弹窗
dialogRef.current?.open({ title: '新增用户' });
```

## 技术栈

- **UI 框架**: Arco Design (Web React)
- **语言**: TypeScript
- **状态管理**: 自研响应式系统（基于 Proxy）
- **日期处理**: dayjs

## 设计模式

### Schema 驱动

所有组件通过 Schema（配置对象）定义行为，而非命令式 API 调用。例如：

- ProForm 通过 `schemas` 数组描述表单字段
- ProTableN 通过 `columns` 数组描述表格列
- ProDialog 通过 `schemas` 或 `columns` 描述弹窗内容

### 响应式状态管理

ProForm 和 ProTableN 都内置了基于 Proxy 的响应式状态管理系统：

- **ProForm**: `FormStore` + `FieldNode`，字段值变化自动触发联动和校验
- **ProTableN**: `DataStore`，数据变化自动更新 UI 和触发请求

### Context 分层

每个组件内部使用多层级 Context 进行数据传递：

- **ProForm**: RootContext（全局状态）→ LayoutContext（布局配置）→ SchemaContext（字段配置）→ FieldContext（字段运行时）
- **ProTableN**: RootContext（全局配置）→ DataContext（数据状态）→ ColumnContext（列配置）

## 项目结构

```
pro-components/
├── ProForm/          # Schema 驱动表单
│   ├── core/          # 核心引擎（FormStore、FieldNode、ValidationEngine）
│   ├── context/       # 上下文（Root、Layout、Schema、Field、FormConfig、Extension）
│   ├── hooks/         # Hooks（useProForm、useArcoForm、useVirtualScroll、useLazyField）
│   ├── registry/      # 注册表（组件、只读渲染器、实例）
│   ├── components/    # 子组件（FormPerformanceMonitor、ProFormList、ProFormSteps）
│   └── utils/         # 工具（reactive 响应式系统、performance）
│
├── ProTableN/         # Schema 驱动表格
│   ├── store/         # 数据状态管理（DataStore）
│   ├── request/       # 请求引擎（RequestEngine）
│   ├── context/       # 上下文（Root、Data、Column、TableConfig）
│   ├── features/      # 功能模块（QueryForm、TableRenderer、Toolbar、Pagination 等）
│   ├── hooks/         # Hooks（useProTable、useRequest、useUrlSync、useVirtualScroll 等）
│   ├── editable/      # 可编辑表格
│   ├── components/    # 子组件（CardView、SkeletonTable、SearchSchemaSelector 等）
│   └── utils/         # 工具（columnRender、cellMerge、defineEnumMap）
│
├── ProDialog/         # 高级弹窗
├── ActionButton/      # 操作按钮集
├── ProSelect/         # 增强选择器
└── ProUpload/         # 增强上传
```