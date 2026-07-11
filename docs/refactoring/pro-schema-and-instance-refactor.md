# Pro 组件 Schema 函数模式 & Instance 构造重构方案

> 日期：2026-07-11
> 涉及包：`ProForm`、`ProTable`

---

## 一、ProFormSchema 函数模式改造

### 1.1 背景

当前 `ProFormSchema` 中仅有 `required` 字段和 `FieldBehavior`（`visible`/`disabled`/`readonly`）支持函数模式（即 `T | ((values: Record<string, unknown>) => T)`），大量 UI 配置字段仅支持静态值，无法根据表单其他字段的值动态计算，导致用户不得不通过 `reactions` 或 `lifecycle` 手动实现联动逻辑，代码冗余且易出错。

### 1.2 目标

将高频动态场景的字段改造为支持函数模式，使联动逻辑能在 **Schema 声明层** 直接表达，减少对命令式联动的依赖。

### 1.3 已支持函数模式的字段（维持不变）

| 字段                       | 当前类型                           |
| -------------------------- | ---------------------------------- |
| `required`                 | `boolean \| ((values) => boolean)` |
| `behavior.visible`         | `boolean \| ((values) => boolean)` |
| `behavior.disabled`        | `boolean \| ((values) => boolean)` |
| `behavior.readonly`        | `boolean \| ((values) => boolean)` |
| `validate`                 | 本身就是函数                       |
| `transform.input / output` | 本身就是函数                       |
| `reactions`                | 本身就是函数式配置                 |
| `lifecycle.*`              | 本身就是回调                       |
| `onFieldChange`            | 本身就是回调                       |

### 1.4 建议改造字段

#### P0 — 高频场景，强烈建议改造（9 个）

```typescript
export interface ProFormSchema<TValues = Record<string, unknown>> {
  // ... 现有字段

  /** 组件属性（支持函数模式实现动态组件属性） */
  componentProps?: Record<string, unknown> | ((values: TValues) => Record<string, unknown>);

  /** 选项数据（支持函数模式实现级联选择、联动过滤） */
  options?:
    | Array<{ label: string; value: unknown; [key: string]: unknown }>
    | ((values: TValues) => Array<{ label: string; value: unknown; [key: string]: unknown }>);

  /** 字段标签（支持函数模式实现联动标签文案） */
  label?: string | ((values: TValues) => string);

  /** 占位符文本（支持函数模式实现联动占位符） */
  placeholder?: string | string[] | ((values: TValues) => string | string[]);

  /** 组件类型（支持函数模式实现条件切换组件） */
  component?: string | ((values: TValues) => string);

  /** 标签提示信息（支持函数模式实现联动提示） */
  tooltip?: string | ((values: TValues) => string);

  /** 验证规则（支持函数模式实现动态校验规则） */
  rules?: ValidationRule[] | ((values: TValues) => ValidationRule[]);

  /** 必填项错误提示（支持函数模式实现动态文案） */
  requiredMessage?: string | ((values: TValues) => string);

  /** Grid 列数（支持函数模式实现动态布局） */
  col?: number | ((values: TValues) => number);
}
```

#### P1 — 常见场景，建议改造（6 个）

```typescript
export interface ProFormSchema<TValues = Record<string, unknown>> {
  /** 前缀文本 */
  prefix?: string | ((values: TValues) => string);
  /** 后缀文本 */
  suffix?: string | ((values: TValues) => string);
  /** 表单项额外提示信息 */
  extra?: ReactNode | ((values: TValues) => ReactNode);
  /** 只读/预览渲染模式 */
  readonlyMode?: ReadonlyRenderConfig['mode'] | ((values: TValues) => ReadonlyRenderConfig['mode']);
  /** 只读/预览渲染配置 */
  readonlyConfig?: ReadonlyRenderConfig | ((values: TValues) => ReadonlyRenderConfig);
  /** 只读/预览时使用的渲染器名称 */
  readonlyComponent?: string | ((values: TValues) => string);
}
```

#### P2 — 较少见但合理，可考虑改造（5 个）

```typescript
export interface ProFormSchema<TValues = Record<string, unknown>> {
  /** 标签列配置 */
  labelCol?: ColProps | ((values: TValues) => ColProps);
  /** 内容列配置 */
  wrapperCol?: ColProps | ((values: TValues) => ColProps);
  /** 日期/时间格式化字符串 */
  format?: string | ((values: TValues) => string);
  /** 日期值格式 */
  valueFormat?: string | ((values: TValues) => string);
  /** 字段级键盘导航配置 */
  keyboardNavigation?:
    | (KeyboardNavigationConfig & { onFocus?: ...; onBlur?: ... })
    | ((values: TValues) => KeyboardNavigationConfig & { ... });
}
```

### 1.5 不适用函数模式的字段

| 字段            | 原因                                           |
| --------------- | ---------------------------------------------- |
| `name`          | 字段标识必须静态，动态会破坏注册/寻址机制      |
| `initialValue`  | 只在挂载时使用一次，动态无意义                 |
| `dependencies`  | 声明式依赖列表，给框架消费，函数化无增益       |
| `children`      | 子 schema 结构，动态生成应通过整个 schema 重组 |
| `reactions`     | 本身已是函数式 DSL                             |
| `lifecycle.*`   | 本身已是回调                                   |
| `onFieldChange` | 本身已是回调                                   |

### 1.6 函数解析器设计

需要新增一个统一的工具函数，在 Schema 消费侧解析函数模式字段：

```typescript
// packages/components/ProForm/utils/resolveSchemaValue.ts

/**
 * 解析 Schema 中可能为函数的值
 *
 * @param value   静态值或函数
 * @param values  当前表单所有字段的值
 * @param fallback 解析失败时的回退值
 *
 * @example
 * // 静态值
 * resolveSchemaValue('用户名', values)        // => '用户名'
 * // 函数值
 * resolveSchemaValue(v => `${v.name}的备注`, { name: '张三' })  // => '张三的备注'
 * // undefined
 * resolveSchemaValue(undefined, values, '--') // => '--'
 */
export function resolveSchemaValue<T>(
  value: T | ((values: Record<string, unknown>) => T) | undefined,
  values: Record<string, unknown>,
  fallback?: T,
): T | undefined {
  if (typeof value === 'function') {
    return (value as (values: Record<string, unknown>) => T)(values);
  }
  return value ?? fallback;
}
```

在 `SchemaContext` 或 `FieldNode` 中，获取表单当前值并传入解析函数，即可实现动态计算。

---

## 二、useProTable Instance 构造重构

### 2.1 问题清单

| #   | 问题                                          | 严重度 | 说明                                                                                                                                                                                                                 |
| --- | --------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `action` 对象缺失 10+ 个方法                  | 🔴     | `clearSelected`、`setSelectedRowKeys`、`getSelectedRows`、`getSelectedRowKeys`、`getPagination`、`getParams`/`setParams`、`getFormInstance`、`getPollingStatus`、`debouncedFetchData`、`openDialog`/`confirm` 均缺失 |
| 2   | 方法签名不一致                                | 🔴     | `reload` 缺 `resetPageIndex` 参数；`reloadAndRest` 实际返回 `Promise<void>` 但类型要求 `void`                                                                                                                        |
| 3   | 命名不统一                                    | 🟡     | `clearSelection` vs `clearSelected`，`setQueryParams` vs `setParams`                                                                                                                                                 |
| 4   | `instance` 顶层不符合 `ProTableInstance` 类型 | 🔴     | 缺失 `form`、`params`；多出大量不应在顶层的方法和状态                                                                                                                                                                |
| 5   | 未用 `useMemo` 包裹                           | 🔴     | 每次 render 创建新对象，下游 context 消费者不必要重渲染                                                                                                                                                              |
| 6   | `pagination` 为快照值                         | 🟡     | `{ current, pageSize, total }` 嵌入对象字面量，每次 render 生成新引用，且不是响应式 getter                                                                                                                           |
| 7   | 顶层方法与 `action` 重复                      | 🟡     | `reload`、`reset`、`setPagination` 等方法同时出现在顶层和 `action` 中                                                                                                                                                |

### 2.2 目标状态

```typescript
// useProTable 最终返回的 instance 严格对齐 ProTableInstance 类型
interface ProTableInstance<T> {
  action: ProTableActionType<T>; // 所有操作方法归一到 action 下
  form: ProFormInstance | undefined;
  dataSource: T[];
  loading: boolean;
  selectedRows: T[];
  selectedRowKeys: (string | number)[];
  pagination: { current: number; pageSize: number; total: number };
  params: Record<string, unknown>;
}
```

### 2.3 改造方案

#### 2.3.1 补全 `action` 对象

```typescript
const action = useMemo<ProTableActionType<T>>(
  () => ({
    // === 已有方法，对齐签名 ===
    reload: (resetPageIndex?: boolean) => {
      if (resetPageIndex) store.setPage(1);
      store.reload();
    },
    reloadAndRest: () => {
      store.reset();
      store.clearSelected();
      store.reload();
    },
    reset: () => {
      store.reset();
      store.reload();
    },

    // === 命名对齐 ===
    clearSelected: () => store.clearSelected(),
    setSelectedRowKeys: (keys) => store.setSelectedRowKeys(keys),

    // === 补全缺失方法 ===
    getSelectedRows: () => store.selectedRows,
    getSelectedRowKeys: () => store.selectedRowKeys,
    getPagination: () => ({
      current: store.pagination.current,
      pageSize: store.pagination.pageSize,
      total: store.total,
    }),
    setPagination: (p) => {
      if (p.current !== undefined) store.setPage(p.current);
      if (p.pageSize !== undefined) store.setPageSize(p.pageSize);
    },
    getParams: () => store.query,
    setParams: (params) => store.setQuery(params),
    getFormInstance: () => formInstanceRef.current, // 从 ref 读取
    getPollingStatus: () => ({
      isPolling: store.isPolling,
      interval: store.pollingInterval,
    }),
    debouncedFetchData: debounce((params) => {
      if (params) store.setQuery(params);
      store.reload();
    }, 300),

    // === 保持已有 ===
    setSelectedRows: (keys, rows) => store.setSelectedRows(keys, rows),
    startEditable,
    cancelEditable,
    saveEditable,
    deleteEditable,
    startPolling,
    stopPolling,

    // === Dialog 相关（需与 ProDialog 集成）===
    openDialog: (config) => dialogService.open(config),
    confirm: (config) => dialogService.confirm(config),

    // === 可选方法（需与虚拟滚动/拖拽/缓存模块集成）===
    scrollToIndex: undefined,
    scrollToTop: undefined,
    scrollToBottom: undefined,
    resetDragSort: undefined,
    clearCache: undefined,
  }),
  [/* deps */],
);
```

#### 2.3.2 `instance` 顶层精简并 `useMemo` 包裹

```typescript
const instance = useMemo<ProTableInstance<T>>(
  () => ({
    action,
    form: formInstanceRef.current,
    dataSource,
    loading,
    selectedRows: store.selectedRows,
    selectedRowKeys: store.selectedRowKeys,
    pagination: {
      current: store.pagination.current,
      pageSize: store.pagination.pageSize,
      total: store.total,
    },
    params: store.query,
  }),
  [
    action,
    formInstanceRef.current,
    dataSource,
    loading,
    store.selectedRows,
    store.selectedRowKeys,
    store.pagination.current,
    store.pagination.pageSize,
    store.total,
    store.query,
  ],
);
```

#### 2.3.3 移除顶层多余方法

以下属性全部从 `instance` 移除，仅保留在 `action` 中：

- `reload` / `refresh` / `reset`
- `setPagination` / `setQueryParams` / `getSorter` / `clearSorter`
- `setSelectedRows` / `clearSelection` / `setDataSource`
- `fetchData` / `startPolling` / `stopPolling`
- `startEditable` / `cancelEditable` / `saveEditable` / `deleteEditable`
- `expandAll` / `collapseAll` / `expandRow` / `collapseRow`
- `error` / `isPolling` / `pollingInterval` / `query`

### 2.4 兼容性处理

由于存在外部代码通过 `instance.reload()` 等顶层方法调用的可能，需在过渡期增加 deprecation warning：

```typescript
// 可选：在 action 顶层方法上加 proxy 拦截
if (process.env.NODE_ENV === 'development') {
  console.warn('[Deprecated] instance.reload() 已弃用，请使用 instance.action.reload()');
}
```

或者保留顶层别名但标记 `@deprecated`：

```typescript
/** @deprecated 请使用 action.reload() */
get reload() { return action.reload; }
```

---

## 三、实施优先级

| 阶段        | 内容                                                                | 影响范围              |
| ----------- | ------------------------------------------------------------------- | --------------------- |
| **Phase 1** | `useProTable` instance 重构：补全 action、useMemo、对齐类型         | `ProTable` 内部模块   |
| **Phase 2** | 更新外部消费方（ProLayout、ProDialog 等）迁移到 `action.xxx()` 调用 | 跨包调用方            |
| **Phase 3** | ProFormSchema P0 字段函数模式改造 + 解析器实现                      | `ProForm` 类型 + core |
| **Phase 4** | ProFormSchema P1 字段函数模式改造                                   | `ProForm` 类型        |
| **Phase 5** | ProFormSchema P2 字段函数模式改造（可选）                           | `ProForm` 类型        |

---

## 四、附录：关键类型定义参考

### ProTableActionType（完整接口）

```typescript
export interface ProTableActionType<T = Record<string, unknown>> {
  reload: (resetPageIndex?: boolean) => void;
  reloadAndRest: () => void;
  reset: () => void;
  clearSelected: () => void;
  setSelectedRows: (keys: (string | number)[], rows: T[]) => void;
  setSelectedRowKeys: (keys: (string | number)[]) => void;
  getSelectedRows: () => T[];
  getSelectedRowKeys: () => (string | number)[];
  startEditable: (rowKey: string | number) => boolean;
  cancelEditable: (rowKey: string | number) => Promise<boolean>;
  saveEditable: (rowKey: string | number) => Promise<boolean>;
  deleteEditable?: (rowKey: string | number) => Promise<boolean>;
  getPagination: () => { current: number; pageSize: number; total: number };
  setPagination: (pagination: Partial<{ current: number; pageSize: number }>) => void;
  getParams: () => Record<string, unknown>;
  setParams: (params: Record<string, unknown>) => void;
  getFormInstance: () => ProFormInstance | undefined;
  startPolling: () => void;
  stopPolling: () => void;
  getPollingStatus: () => { isPolling: boolean; interval?: number };
  debouncedFetchData: (params?: Record<string, unknown>) => void;
  openDialog: <TValues, TRow>(config: OpenDialogConfig<TValues, TRow>) => DialogReturnProps<TValues, TRow>;
  confirm: (config: ConfirmDialogConfig) => DialogReturnProps;
  scrollToIndex?: (index: number, behavior?: ScrollBehavior) => void;
  scrollToTop?: (behavior?: ScrollBehavior) => void;
  scrollToBottom?: (behavior?: ScrollBehavior) => void;
  resetDragSort?: () => void;
  clearCache?: () => void;
}
```

### ProTableInstance（完整接口）

```typescript
export interface ProTableInstance<T = Record<string, unknown>> {
  action: ProTableActionType<T>;
  form: ProFormInstance | undefined;
  dataSource: T[];
  loading: boolean;
  selectedRows: T[];
  selectedRowKeys: (string | number)[];
  pagination: { current: number; pageSize: number; total: number };
  params: Record<string, unknown>;
}
```

### 受影响的文件

| 文件                                                      | 变更类型                      |
| --------------------------------------------------------- | ----------------------------- |
| `packages/components/ProForm/types.ts`                    | 类型扩展（函数模式联合类型）  |
| `packages/components/ProForm/utils/resolveSchemaValue.ts` | **新增** 函数解析器           |
| `packages/components/ProForm/context/SchemaContext.tsx`   | 运行时调用 resolveSchemaValue |
| `packages/components/ProForm/core/FieldNode.ts`           | 运行时调用 resolveSchemaValue |
| `packages/components/ProTable/hooks/useProTable.tsx`      | 完全重写 instance 构造        |
| `packages/components/ProTable/types.ts`                   | 无需变更（类型已正确定义）    |
