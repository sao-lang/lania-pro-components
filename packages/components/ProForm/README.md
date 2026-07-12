# ProForm

Schema 驱动的企业级表单组件，基于 FormStore + FieldNode + Renderer 架构实现高性能表单状态管理。

## 快速开始

```tsx
import { ProForm, useProForm } from '@lania-pro-components/components';

// 方式 A：独立使用（简单场景）
<ProForm
  schemas={[
    { name: 'name', label: '姓名', component: 'Input', required: true },
    { name: 'email', label: '邮箱', component: 'Input', rules: [{ type: 'email' }] },
  ]}
  onFinish={async (values) => await save(values)}
/>;

// 方式 B：配合 useProForm（推荐，避免重复实例）
const form = useProForm({
  schemas: [
    { name: 'name', label: '姓名', component: 'Input', required: true },
    { name: 'email', label: '邮箱', component: 'Input' },
  ],
  initialValues: { name: '张三' },
});
<ProForm form={form} columns={2} />;
form.instance.validate().then((values) => {
  /* form.instance 是唯一的 */
});
```

---

## 一、架构总览

### 1.1 三级架构模型

ProForm 将表单抽象为三个层级，每层职责明确、单向依赖：

```
┌─────────────────────────────────────────────────────────────────────────┐
│  第1层: 字段 Schema 层 — 声明式配置，用户编写                           │
│                                                                         │
│  用户定义：有什么字段、用什么组件、行为规则、联动规则                    │
│                                                                         │
│  ProFormSchema  { name, component, behavior, reactions, ... }            │
│  BehaviorDecl   FieldStatus \| ((values) => FieldStatus) \| undefined    │
│  FieldReaction  { dependencies, run }                                   │
│  ProFormProps   { schemas, transform, lifecycle, validateMessages, ... } │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  第2层: 表单控件 Core 层 — 响应式状态管理，与 UI 框架解耦               │
│                                                                         │
│  FormStore     管理 values/fields/errors/touched/reactions 五个状态     │
│  FieldNode     单字段运行时：值/状态/错误/行为计算/校验                 │
│                                                                         │
│  核心机制：基于 computed() 自动追踪依赖                                 │
│  behavior 声明或函数 → 合并表单级约束 → _effectiveStatus → setStatus    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  第3层: 表单组件 UI 层 — React 渲染                                     │
│                                                                         │
│  ProForm     表单容器：组装 Context + 布局 + 性能优化                   │
│  FormField   字段渲染器：根据 status 切换编辑/只读/隐藏                  │
│  Contexts    RootCtx / SchemaCtx / FieldCtx / LayoutCtx / ExtCtx        │
│  Registry    组件注册表 + 只读渲染器注册表 + 快速组件                  │
│  Hooks       useProForm / useArcoForm / useFieldNavigation / 懒加载    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 behavior → effectiveStatus → 渲染 管道

这是 ProForm 最核心的数据流：

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: Schema 声明行为意图 (声明式)                                   │
│                                                                         │
│  // behavior 直接声明期望的最终状态，可以是静态值或函数                  │
│  { behavior: 'readonly' }                                               │
│  { behavior: (v) => v.status === 'done' ? 'readonly' : 'edit' }        │
│  { behavior: 'hidden' }          ← 绝对隐藏，不受表单级覆盖             │
│                                                                         │
│  // 表单级约束（优先级高于字段级）                                      │
│  <ProForm preview readonly disabled />                                  │
│                                                                         │
│  // 合并规则:                                                           │
│  //   字段声明 hidden → hidden（绝对隐藏）                              │
│  //   表单级 preview  → readonly                                        │
│  //   表单级 readonly → readonly                                        │
│  //   表单级 disabled → disabled                                        │
│  //   字段自身声明    → 字段声明的值                                     │
│  //   兜底            → edit                                            │
└─────────────────────────────────────────────────────────────────────────┘
                            ↓ FieldNode 构造时创建 computed()
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: FieldNode 计算有效状态 _effectiveStatus (响应式)               │
│                                                                         │
│  _effectiveStatus = computed<FieldStatus>(() => {                       │
│    const values = store.getValues();          ← 自动追踪字段值          │
│    const form = store.getFormConstraints();   ← 自动追踪表单级约束      │
│                                                                         │
│    let fieldWanted: FieldStatus | undefined;                            │
│    const behavior = schema.behavior as BehaviorDecl;                    │
│    if (behavior === undefined) fieldWanted = undefined;                 │
│    else if (typeof behavior === 'function') fieldWanted = behavior(v);  │
│    else fieldWanted = behavior;                                         │
│                                                                         │
│    // 合并                                                              │
│    if (fieldWanted === 'hidden') return 'hidden';                       │
│    if (form.preview)  return 'readonly';                                │
│    if (form.readonly) return 'readonly';                                │
│    if (form.disabled) return 'disabled';                                │
│    return fieldWanted ?? 'edit';                                        │
│  });                                                                    │
│                                                                         │
│  // watch(_effectiveStatus) → setStatus() 自动同步                      │
│                                                                         │
│  _computedRequired = computed(() => {                                   │
│    const values = store.getValues();                                    │
│    return typeof schema.required === 'function'                         │
│      ? schema.required(values)                                          │
│      : schema.required ?? false;                                        │
│  });                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                            ↓ watch(_effectiveStatus.value) 自动同步
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: setStatus() — 同步到 _status（响应式）                          │
│                                                                         │
│  _effectiveStatus 变化 → watch 触发 → this.setStatus(newStatus)         │
│    → onStatusChangeCallbacks → FormField 重渲染                         │
│                                                                         │
│  有效状态映射：                                                          │
│  'hidden'   — 不可见，return null                                       │
│  'readonly' — 只读渲染器                                                │
│  'disabled' — 禁用但可见                                                │
│  'edit'     — 正常编辑态                                                │
└─────────────────────────────────────────────────────────────────────────┘
                            ↓ setStatus() 触发 onStatusChangeCallbacks
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: FormField 接收状态 → 切换渲染策略 (React)                       │
│                                                                         │
│  status === 'hidden'   → return null                                    │
│  status === 'readonly' → renderReadonlyContent()   — 只读展示           │
│  status === 'disabled' → renderComponent({ status: 'disabled' })        │
│  status === 'edit'     → renderComponent({ status: 'edit' })            │
│                                                                         │
│  自定义表单控件收到: { value, onChange, status, values, schema,         │
│                        field, form, ...restComponentProps }             │
│  只读渲染器收到:      { value, options, config, componentProps,         │
│                        meta: { status, values } }                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 状态分层图

```
 Schema 声明             运行时计算（FieldNode）         UI 渲染（FormField）
────────────────────  ────────────────────────────  ───────────────────────────
required: boolean|fn  →  _computedRequired         →  Form.Item 红星标 + rules
                       （独立于状态计算）
behavior: 'hidden'    →                            →  status === 'hidden' → null
behavior: 'readonly'  →  _effectiveStatus          →  status === 'readonly' → 只读渲染器
 或 fn 返回 status    →  (合并表单级约束后)        →  status === 'disabled' → 禁用组件
behavior: 'disabled'  →                            →  status === 'edit' → 正常组件
behavior: undefined   →  继承表单级约束
表单级 preview         →  readonly
表单级 readonly        →  readonly
表单级 disabled        →  disabled
```

设计原则：

- **单向数据流**：Schema + 表单级约束 → FieldNode(computed) → Status → UI，没有反向回路
- **声明式意图**：behavior 直接声明想要的最终状态(FieldStatus)，不再拆成三个散装 boolean
- **全局优先**：表单级约束（preview/readonly/disabled）优先级高于字段级，只有 'hidden' 是绝对隐藏
- **响应式自动传播**：computed 自动追踪依赖，值变化自动标记 dirty，无需手动触发
- **required 分离**：必填属于数据校验语义，独立计算

### 1.4 全链路串联图

```
① 初始化阶段：Schemas → 注册 → FieldNode → FormStore → Context → UI

  ProForm 接收 props.schemas[]
    │
    ├── schemaProcessOptions 处理（autoLabel/autoPlaceholder/autoRules 等）
    │   └── processSchema() → 返回增强后的 schema
    │
    ├── 全局配置合并（mergedSchemas）
    │   └── schema 未定义 transform/lifecycle/valueFormat/dateFormat 时，
    │       使用 ProFormProps 对应值作为 fallback
    │
    ├── visibleSchemas 计算（虚拟滚动/懒加载/全部）
    │
    └── renderField(schema) → FormField 组件
          ├── useMemo → 获取或创建 FieldNode
          │   ├── formStore.getField(name) → 已存在则复用
          │   └── createFieldNode(schema, formStore)
          │         ├── _value = ref(schema.initialValue ?? store.getValue(name))
          │         ├── _effectiveStatus = computed(...) → 合并 behavior + 表单级约束
          │         ├── _computedRequired = computed(...)
          │         └── setupStoreValueWatch()
          │               └── watch(store.getValue(name)) → 同步 _value
          │
          ├── formStore.registerField(field)
          │   ├── state.fields[name] = field
          │   ├── 初始化值
          │   ├── 注册 reactions → state.reactions[name]
          │   ├── setupFieldValueWatch()
          │   │   ├── watch(state.values[name]) → runReactions(name)
          │   │   └── watch(state.values[dep]) × N → 依赖变化自动触发 computed 重算
          │   └── lifecycle.onInit(field, form)
          │
          ├── useEffect → subscribeToValueChange / subscribeToStatusChange
          │
          └── Context Provider 包装
              ├── SchemaContext → schema 配置
              ├── LayoutContext → 布局配置
              └── FieldContext → value/status/...
                    ├── status === 'hidden'  → return null
                    ├── status === 'readonly' → 只读渲染器（readonlyRegistry）
                    ├── status === 'disabled' → 禁用组件
                    └── status === 'edit' → 正常组件（componentRegistry）

② 运行时交互：用户输入 → 状态更新 → 联动 → UI

  handleChange(value) → fieldNode.setValue(value)
    ├── transform.output(allValues) ← 输出转换（传入整个表单值）
    ├── _value.value = transformed ← ref 响应式
    └── store.setValue(name, transformed)
          ├── batchUpdate { state.values[name] = value }
          │   └── Proxy.set → Dep.notify()
          │       ├──→ _effectiveStatus 标记 dirty
          │       │     → 重算 → watch → setStatus
          │       │       → onStatusChangeCallbacks → FormField 重渲染
          │       ├──→ watch(values[name]) → runReactions(name)
          │       │     → 遍历所有 fields.reactions
          │       │       → 匹配 dependencies → reaction.run(field, form)
          │       └──→ watch(values[dep])（其他字段依赖）
          │             → 自动触发 _effectiveStatus 重算
          └── 响应式传播全部自动，无需手动触发
    ├── arcoForm.setFieldValue(name, value) ← 同步 Arco Form
    └── rootContext.onValuesChange({ [name]: value }, allValues)

③ 校验流程

  validate() → ValidationEngine.validateField(field)
    → skip hidden/disabled
    → schema.required（函数解析）
    → schema.rules（min/max/pattern/validator）
    → schema.validate（异步）

  FieldNode.validate() 使用 _computedRequired.value（响应式驱动）

④ 生命周期

  schema.lifecycle: onInit/onMount/onValueChange/onStatusChange/onFocus/onBlur/onDestroy
  ProFormProps.lifecycle: schema 未定义 lifecycle 时作为 fallback
```

---

## 二、使用方式

ProForm 提供多种使用方式：

| 使用方式                  | 适用场景         | 复杂度 | 核心特点                           |
| ------------------------- | ---------------- | ------ | ---------------------------------- |
| **纯 Schema 驱动**        | 快速构建表单     | 低     | 一行代码完成表单                   |
| **useProForm 受控模式**   | 需要外部控制状态 | 中     | 通过 `instance` 操作表单           |
| **Provider 跨组件访问**   | 子组件深度访问   | 中     | `Provider` + `useProFormContext()` |
| **ProFormList 动态列表**  | 动态增删列表字段 | 中     | 支持 min/max 限制、卡片样式        |
| **ProFormSteps 分步表单** | 长表单分步填写   | 高     | 步骤验证、水平/垂直布局            |
| **草稿持久化**            | 防丢失表单数据   | 中     | 自动保存到 localStorage            |
| **虚拟滚动**              | 数百字段的表单   | 高     | 只渲染可视区域                     |

---

## 三、类型定义

### 3.1 ProFormSchema

```typescript
interface ProFormSchema<TValues = Record<string, unknown>> {
  name: string | string[];           // 字段名称（必填），支持嵌套路径
  label?: string;                    // 字段标签
  component?: string;                // 组件类型
  componentProps?: Record<string, unknown>; // 组件属性
  required?: boolean | ((values) => boolean); // 是否必填（支持函数形式的条件必填）
  requiredMessage?: string;          // 必填提示
  rules?: ValidationRule[];          // 验证规则
  validate?: (value, values) => string | undefined | Promise<...>;
  initialValue?: unknown;            // 初始值
  col?: number;                      // Grid 列数
  labelCol?: ColProps;               // 标签列配置
  wrapperCol?: ColProps;             // 内容列配置
  tooltip?: string;                  // 标签提示
  extra?: ReactNode;                 // 额外提示
  placeholder?: string;              // 占位符
  options?: Array<{ label; value; [key: string]: unknown }>;
  format?: string;                   // 日期格式化
  valueFormat?: string;              // 日期值格式（提交时的格式）
  prefix?: string;                   // 前缀
  suffix?: string;                   // 后缀
  transform?: {                      // 值转换（接收整个表单值，可跨字段计算）
    input?: (values: Record<string, unknown>) => unknown;
    output?: (values: Record<string, unknown>) => unknown;
  };
  dependencies?: string[];           // 依赖字段
  behavior?: BehaviorDecl;           // 字段行为声明（状态枚举或返回状态的函数）
  reactions?: FieldReaction[];       // 联动规则
  lifecycle?: FieldLifecycle;        // 生命周期
  readonlyMode?: ReadonlyRenderConfig['mode'];
  readonlyConfig?: ReadonlyRenderConfig;
  readonlyComponent?: string;        // 只读渲染器
  children?: ProFormSchema[];        // 子字段
  onFieldChange?: (value, allValues) => void;
}
```

### 3.2 ValidationRule

```typescript
interface ValidationRule {
  required?: boolean;
  min?: number; max?: number;
  minLength?: number; maxLength?: number;
  len?: number;          // 固定长度
  precision?: number;    // 精度（小数位数）
  step?: number;         // 步长
  type?: 'number' | 'integer' | 'float' | 'string' | 'boolean';
  sign?: 'positive' | 'negative' | 'zero';
  whitespace?: boolean;
  pattern?: RegExp | string;
  validator?: (value, values) => string | undefined | Promise<...>;
  message?: string;
}
```

### 3.3 BehaviorDecl

```typescript
/**
 * 字段行为声明
 *
 * 直接声明字段期望的最终状态，而不是拆成三个散装 boolean。
 * 可以是静态值或接收所有表单值返回状态的函数（用于联动）。
 *
 * @example
 * behavior: 'readonly'
 * behavior: (v) => v.status === 'done' ? 'readonly' : 'edit'
 * behavior: 'hidden'  // 绝对隐藏，不受表单级覆盖
 */
type BehaviorDecl = FieldStatus | ((values: Record<string, unknown>) => FieldStatus) | undefined;
```

### 3.4 核心类型

| 类型                       | 说明                                                    |
| -------------------------- | ------------------------------------------------------- |
| `FormStatus`               | `'edit' \| 'preview' \| 'readonly' \| 'disabled'`       |
| `FieldStatus`              | `'edit' \| 'readonly' \| 'disabled' \| 'hidden'`        |
| `BehaviorDecl`             | `FieldStatus \| ((values) => FieldStatus) \| undefined` |
| `LayoutMode`               | `'horizontal' \| 'vertical' \| 'inline' \| 'compact'`   |
| `ProFormInstance`          | 表单实例 API                                            |
| `FieldNodeAPI`             | 字段运行时接口                                          |
| `KeyboardNavigationConfig` | 键盘导航配置                                            |
| `DraftConfig`              | 草稿持久化配置                                          |

---

## 四、Core 层

Core 层与 UI 框架解耦。

### 4.1 FormStore

基于 `@lania-pro-components/utils` 的 `reactive` / `batchUpdate` / `watch`。

管理 `values`、`fields`、`errors`、`touched`、`reactions` 五个状态。

| 方法                                             | 说明          |
| ------------------------------------------------ | ------------- |
| `getValues()` / `getValue(name)`                 | 获取字段值    |
| `setValue(name, value)` / `setValues(values)`    | 设置字段值    |
| `registerField(field)` / `unregisterField(name)` | 注册/注销字段 |
| `runReactions(changedField)`                     | 执行联动      |
| `getField(name)` / `getAllFields()`              | 获取字段实例  |

### 4.2 FieldNode

每个字段对应一个 FieldNode，使用 `ref` / `computed` / `watch`。

**状态优先级**：`visible=false` → `'hidden'` → `readonly=true` → `'readonly'` → `disabled=true` → `'disabled'` → 默认 `'edit'`

### 4.3 ValidationEngine & DraftEngine

| 引擎               | 说明                                             |
| ------------------ | ------------------------------------------------ |
| `ValidationEngine` | 规则校验、异步校验、自定义校验                   |
| `DraftEngine`      | 草稿持久化（localStorage/sessionStorage/自定义） |

---

## 五、使用方式

### 6.1 useProForm

```typescript
const {
  arcoForm,
  instance,
  schemas,
  setSchemas,
  bindingProps,
  formStore,
  Provider,
  fieldNavigation,
  fieldStatusMap,
  isDraftState,
  isPreviewState,
} = useProForm(options);
```

### 6.2 ProFormProps

| 分类     | 属性                                                                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 表单配置 | `schemas`, `layout`, `labelCol`, `wrapperCol`, `colon`, `labelAlign`, `size`                                                                                                                               |
| 表单状态 | `disabled`, `readonly`, `draft`, `preview`, `initialValues`                                                                                                                                                |
| 事件     | `onFinish`, `onFinishFailed`, `onValuesChange`, `onFieldsChange`, `onDraftChange`, `onPreviewChange`, `onReset`                                                                                            |
| 按钮     | `showButton`, `submitText`, `resetText`, `showSubmitButton`, `showResetButton`, `buttonPosition`, `buttons`, `buttonList`                                                                                  |
| 折叠     | `collapsible`, `collapsed`, `collapsedRows`, `expandText`, `collapseText`                                                                                                                                  |
| 布局     | `rows`, `columns`, `gutter`, `rowProps`, `colProps`                                                                                                                                                        |
| 样式     | `className`, `style`, `cardContainer`                                                                                                                                                                      |
| 功能     | `formRef`, `scrollToFirstError`, `validateTrigger`, `transform`, `lifecycle`, `validateMessages`, `valueFormat`, `dateFormat`, `performance`, `schemaProcessOptions`, `keyboardNavigation`, `draftStorage` |

### 6.3 ProFormInstance 方法

`validate()`, `validateField()`, `clearValidate()`, `setFieldsValue()`, `setFieldValue()`, `getFieldValue()`, `getFieldsValue()`, `resetFields()`, `submit()`, `setSchemas()`, `setProps()`, `getRef()`, `getFieldStatus()`, `setFieldStatus()`, `scrollToField()`, `isDraft()`, `setDraft()`, `isPreview()`, `setPreview()`, `focusField()`, `focusNextField()`, `focusPrevField()`, `getFocusedField()`

### 6.4 ProFormList & ProFormSteps

参见 `docs/components/pro-form.md`。

### 6.5 快捷组件

`PasswordInput`, `PhoneInput`, `EmailInput`, `IdCardInput`, `AmountInput`, `PercentageInput`, `YesNoSelect`, `MaleFemaleSelect`, `EnableDisableSelect`, `StatusSelect`, `OpenCloseSelect`, `YearPicker`, `MonthPicker`, `WeekPicker`, `QuarterPicker`, `RangePicker`, `TimeRangePicker`, `VerificationCode`, `ImageList`, `QuickInputWithSuffix`, `QuickInputNumberWithSuffix`

| PerformanceMonitor | 性能监控（来自 shared） |
| `runReactions(changedField)` | 执行依赖该字段的所有联动规则 |
| `getField(name)` | 获取字段实例（数组名取首元素） |
| `getAllFields()` | 获取所有字段实例 Map |
| `validateField(name)` | 验证单个字段（遍历 rules，支持异步 validator） |
| `validateAllFields()` | 验证所有字段 |
| `setFieldError(name, error)` | 设置字段错误 |
| `getFieldError(name)` | 获取字段错误 |
| `setFieldTouched(name, touched)` | 设置字段触摸状态 |
| `reset()` / `resetField(name)` | 重置所有/单个字段到 initialValue |
| `subscribeToValueChange(listener)` | 订阅值变化（返回取消订阅函数） |
| `subscribeToFieldChange(listener)` | 订阅字段注册/注销 |

**字段注册流程**：

```
registerField(field)
    │
    ├── 1. batchUpdate 内：
    │     ├── 存储到 state.fields[fieldName]
    │     ├── 初始化值（如果有 initialValue 且 store 中无值）
    │     └── 注册联动规则到 state.reactions
    │
    ├── 2. 通知 fieldListeners
    │
    ├── 3. setupFieldValueWatch(field, fieldName)
    │     ├── watch(state.values[fieldName]) → 值变化时 runReactions
    │     └── watch(state.values[dep]) × N → 依赖变化自动触发 _effectiveStatus 重算
    │
    └── 4. 触发 lifecycle.onInit(field, form)
```

**字段联动实现**：

```typescript
private setupFieldValueWatch(field: FieldNodeAPI, fieldName: string): void {
  // 监听当前字段值变化 → 执行联动规则
  const cleanup = watch(
    () => this.state.values[fieldName],
    () => this.runReactions(fieldName),
  );

  // 监听依赖字段变化 → 更新当前字段的计算行为
  if (field.schema.dependencies) {
    field.schema.dependencies.forEach((depName) => {
      watch(
        () => this.state.values[depName],
        () => { /* _effectiveStatus 自动重算 */ },
      );
    });
  }
}
```

### 13.2 FieldNode — 字段运行时实例

**文件**：`core/FieldNode.ts`

**职责**：管理单个字段的完整运行时状态（值、错误、状态、焦点）和计算行为

**核心属性**：

```typescript
class FieldNode implements FieldNodeAPI {
  name: string | string[];
  schema: ProFormSchema;

  // 响应式状态（基于 ref）
  private _value = ref<unknown>(undefined); // 字段值
  private _error = ref<string | undefined>(undefined); // 错误信息
  private _status = ref<FieldStatus>('edit'); // 当前状态
  private _focused = ref<boolean>(false); // 焦点状态

  // 计算属性（自动追踪 store 中所有值的变化）
  private _effectiveStatus: ComputedRef<FieldStatus>;

  private store: FormStoreAPI;
  private onChangeCallbacks: Set<(value) => void>;
  private onStatusChangeCallbacks: Set<(status, oldStatus) => void>;
}
```

**状态合并规则**（_effectiveStatus）：

```
// 1. 解析 schema.behavior（FieldStatus | fn | undefined）
// 2. 读 formConstraints（store.getFormConstraints()）
// 3. 合并：全局优先级高于字段级，'hidden' 绝对不受覆盖

_effectiveStatus:
  schema.behavior === 'hidden'         → 'hidden'
  formConstraints.preview === true     → 'readonly'
  formConstraints.readonly === true    → 'readonly'
  formConstraints.disabled === true    → 'disabled'
  schema.behavior 有值                 → 字段自身声明
  兜底                                 → 'edit'

优先级：hidden > preview > readonly > disabled > 字段声明 > edit
```

**计算状态机制**：

FieldNode 在构造时创建两个独立的计算属性：

```typescript
// 有效状态计算（合并 schema.behavior + 表单级约束）
this._effectiveStatus = computed<FieldStatus>(() => {
  const values = store.getValues();
  const formConstraints = store.getFormConstraints();

  let fieldWanted: FieldStatus | undefined;
  const behavior = schema.behavior as BehaviorDecl;
  if (behavior === undefined) {
    fieldWanted = undefined;
  } else if (typeof behavior === 'function') {
    fieldWanted = behavior(values);
  } else {
    fieldWanted = behavior;
  }

  if (fieldWanted === 'hidden') return 'hidden';
  if (formConstraints.preview) return 'readonly';
  if (formConstraints.readonly) return 'readonly';
  if (formConstraints.disabled) return 'disabled';
  return fieldWanted ?? 'edit';
});

// 必填标识独立计算（由 schema.required 解析，支持函数形式的条件必填）
this._computedRequired = computed(() => {
  const values = store.getValues();
  return typeof schema.required === 'function' ? schema.required(values) : (schema.required ?? false);
});

// watch 有效状态变化 → 自动同步到 _status
watch(
  () => this._effectiveStatus.value,
  (newStatus, oldStatus) => {
    if (newStatus !== oldStatus && newStatus !== this._status.value) {
      this.setStatus(newStatus);
    }
  },
  { immediate: true },
);
```

**值转换机制**：

```typescript
setValue(newValue) {
  // 输出转换：将新值合并进表单值后传入，使 transform 可跨字段访问
  let transformedValue = newValue;
  if (this.schema.transform?.output) {
    const allValues = { ...this.store.getValues(), [fieldName]: newValue };
    transformedValue = this.schema.transform.output(allValues);
  }
  this._value.value = transformedValue;
  this.store.setValue(fieldName, transformedValue);
}

getValue() {
  // 输入转换：传入整个表单值（已包含当前字段值），可跨字段计算
  let result = this._value.value;
  if (this.schema.transform?.input) {
    result = this.schema.transform.input(this.store.getValues());
  }
  return result;
}
```

**Store 值同步**：

FieldNode 通过 `watch` 监听 store 中对应字段的值变化，当 store 值改变时（如 `setFieldsValue`），自动同步到自身的 `_value` 并触发回调：

```typescript
private setupStoreValueWatch(): void {
  this.valueWatchCleanup = watch(
    () => this.store.getValue(fieldName),
    (newValue, oldValue) => {
      if (newValue !== this._value.value) {
        this._value.value = newValue;
        this.onChangeCallbacks.forEach((cb) => cb(newValue));
        // 触发 lifecycle.onValueChange
      }
    },
    { immediate: true },
  );
}
```

**验证逻辑**：

```typescript
validate(): Promise<string | undefined> {
  // 1. hidden 状态不验证
  if (this._status.value === 'hidden') return Promise.resolve(undefined);
  // 2. 检查 _computedRequired.value（动态必填，由 schema.required 解析）
  // 3. 遍历 schema.rules 执行规则
  // 4. 返回错误信息或 undefined
}
```

### 13.3 ValidationEngine — 验证引擎

**文件**：`core/ValidationEngine.ts`

**职责**：集中管理表单验证逻辑，支持同步和异步验证

**验证流程**：

```
validateField(field)
    │
    ├── 1. 检查 schema.required（必填校验）
    │     └── isEmpty(value) → 返回 requiredMessage 或默认提示
    │
    ├── 2. 遍历 schema.rules（规则校验）
    │     ├── required      → 空值检查
    │     ├── min / max     → 数值范围（仅 number 类型）
    │     ├── minLength / maxLength → 字符串/数组长度
    │     ├── pattern       → 正则匹配（string/number/boolean）
    │     └── validator     → 自定义验证函数（支持异步 Promise）
    │
    └── 3. 执行 schema.validate（自定义整体验证）
          └── 支持 async，返回错误字符串或 undefined
```

**验证策略**：

- 空值跳过除 `required` 外的其他规则
- `validateAll()` 自动跳过 `visible=false` 或 `disabled=true` 的字段
- `validateFields(names)` 验证指定字段，同样跳过不可见/禁用字段

**验证结果类型**：

```typescript
interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
```

### 13.4 baseComponents — 基础组件注册

**文件**：`core/baseComponents.tsx`

在模块加载时通过 `registerComponents()` 注册所有 Arco Design 组件：

| 分类     | 组件                                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 输入类   | `Input`, `InputNumber`, `TextArea`(Input.TextArea), `Select`, `AutoComplete`, `Mentions`                                                     |
| 选择类   | `Switch`, `Checkbox`, `Checkbox.Group`, `Radio`, `Radio.Group`, `Cascader`, `TreeSelect`                                                     |
| 日期时间 | `DatePicker`, `DatePicker.YearPicker/MonthPicker/WeekPicker/QuarterPicker`, `DatePicker.RangePicker`, `TimePicker`, `TimePicker.RangePicker` |
| 其他     | `Transfer`, `Upload`, `Rate`, `Slider`, `ColorPicker`                                                                                        |

### 13.5 customRenderers — 自定义渲染器

**文件**：`core/customRenderers.tsx`

注册自定义只读渲染器（如 `proUploadRenderer`），用于处理复杂业务场景的只读展示。通过 `registerReadonlyRenderer()` 注册到 `readonlyRegistry`。

---

## 六、Context 层

**文件**：`context/`

Context 层负责在 React 组件树中传递状态，避免 prop drilling。共有 6 个 Context，分为表单级（全局）和字段级（局部）两个作用域。

### 13.1 上下文体系总览

| Context               | 文件                    | 职责                                         | 作用域              |
| --------------------- | ----------------------- | -------------------------------------------- | ------------------- |
| **RootContext**       | `RootContext.tsx`       | 全局状态（表单状态、实例、布局、尺寸、回调） | 整个表单            |
| **LayoutContext**     | `LayoutContext.tsx`     | 布局配置（列数、间距、标签对齐、折叠状态）   | 整个表单 / 单个字段 |
| **SchemaContext**     | `SchemaContext.tsx`     | 字段静态配置（来自 ProFormSchema）           | 单个字段            |
| **FieldContext**      | `FieldContext.tsx`      | 字段运行时状态（值、状态、方法）             | 单个字段            |
| **ExtensionContext**  | `ExtensionContext.tsx`  | 扩展机制（权限、审计、国际化）               | 整个表单            |
| **FormConfigContext** | `FormConfigContext.tsx` | 表单全局配置                                 | 整个表单            |

### 13.2 RootContext — 全局状态上下文

```typescript
interface RootContextValue {
  formState: FormState; // 表单状态（readonly/disabled/preview/submitting/status）
  instance: ProFormInstance; // 表单实例
  arcoForm: ArcoFormInstance; // Arco Form 实例
  layout: 'horizontal' | 'vertical' | 'inline';
  size: 'small' | 'default' | 'large';
  onValuesChange?: (changedValues, allValues) => void;
  onFieldsChange?: (changedFields, allFields) => void;
  onFinish?: (values) => void | Promise<void>;
  onFinishFailed?: (errorInfo) => void;
}
```

**FormState 计算逻辑**（`createFormState`）：

```typescript
function createFormState(preview, readonly, disabled, submitting): FormState {
  let status: FormStatus = 'edit';
  if (preview) status = 'preview';
  else if (readonly) status = 'readonly';
  else if (disabled) status = 'disabled';
  return { readonly, disabled, preview, submitting, status };
}
```

优先级：`preview > readonly > disabled > edit`

注意：`draft` 已从状态中移除，仅作为草稿持久化配置（`DraftConfig`）存在，只在 `status === 'edit'` 时生效。

### 13.3 LayoutContext — 布局配置上下文

```typescript
interface LayoutContextValue {
  columns: number; // Grid 布局列数（1-4）
  gutter: number | [number, number]; // 列间距
  labelCol: ColProps | undefined; // 标签列配置
  wrapperCol: ColProps | undefined; // 内容列配置
  rowProps: Record<string, unknown>; // Row 组件属性
  colProps: Record<string, unknown>; // Col 组件属性
  colon: boolean; // 是否显示冒号
  labelAlign: 'left' | 'right';
  collapsed: boolean; // 是否折叠
  collapsedRows: number; // 折叠时展示的行数
}
```

LayoutContext 支持层级覆盖：FormField 可以通过 `LayoutContextProvider` 覆盖父级的布局配置（如 `schema.labelCol` 覆盖全局 `labelCol`）。

### 13.4 SchemaContext — 字段静态配置上下文

```typescript
interface SchemaContextValue {
  name: string | string[];
  label?: string;
  component: string;
  componentProps?: Record<string, unknown>;
  rules?: ValidationRule[];
  dependencies?: string[];
  behavior?: FieldBehavior;
  reactions?: FieldReaction[];
  lifecycle?: FieldLifecycle;
  initialValue?: unknown;
  tooltip?: string;
  extra?: ReactNode;
  placeholder?: string;
  options?: Array<{ label; value }>;
  format?: string;
  valueFormat?: string; // 日期值格式（提交时的格式）
  prefix?: string;
  suffix?: string;
  required?: boolean;
  readonlyMode?: string;
  readonlyConfig?: ReadonlyRenderConfig;
  readonlyComponent?: string;
  rawSchema: ProFormSchema; // 原始完整 Schema
}
```

### 13.5 FieldContext — 字段运行时上下文

```typescript
interface FieldContextValue {
  // 身份标识
  name: string;
  label?: string;

  // 数据
  value: unknown;
  values: Record<string, unknown>; // 全表单值

  // 状态
  status: FieldStatus;
  focused?: boolean;
  /** 计算后的必填标识（由 schema.required 解析，支持函数形式） */
  required: boolean;
  formState: FormState;
  error?: string;

  // 方法
  setValue: (value) => void;
  getFieldValue: (name) => unknown;
  getFieldsValue: () => Record<string, unknown>;
  validate: () => Promise<void>;
  setError: (error?) => void;
  clearError: () => void;

  // 字段节点实例
  fieldNode: FieldNodeAPI;
}
```

### 13.6 ExtensionContext — 扩展机制

**设计目的**：提供可插拔的扩展能力，通过 `useRef` + `useCallback` 管理扩展注册表

```typescript
interface ExtensionContextValue {
  extensions: ExtensionRegistry; // { [name]: value }
  registerExtension: (name: string, value: unknown) => void;
  unregisterExtension: (name: string) => void;
  getExtension: (name: string) => unknown;
}
```

**内置扩展类型定义**：

```typescript
// 权限扩展
interface PermissionExtension {
  checkVisible: (fieldName: string) => boolean;
  checkEditable: (fieldName: string) => boolean;
  checkReadable: (fieldName: string) => boolean;
  permissions: Record<string, string>;
}

// 审计扩展
interface AuditExtension {
  log: (action: string, data: Record<string, unknown>) => void;
  logFieldChange: (fieldName: string, oldValue: unknown, newValue: unknown) => void;
}

// 国际化扩展
interface I18nExtension {
  t: (key: string, params?: Record<string, unknown>) => string;
  locale: string;
}
```

使用方式：`const permission = useExtension<PermissionExtension>('permission');`

---

## 七、Hooks 层

**文件**：`hooks/`

### 13.1 useProForm — 核心 Hook

**文件**：`useProForm.tsx`

**职责**：创建和管理表单实例，是整个表单的入口。组合 FormStore、ArcoForm、键盘导航等能力。

**返回值结构**：

```typescript
interface UseProFormReturn<TValues> {
  arcoForm: ArcoFormInstance; // Arco Form 实例
  instance: ProFormInstance<TValues>; // ProForm 实例
  schemas: ProFormSchema[]; // 字段配置
  setSchemas: (schemas) => void; // 动态更新配置
  formProps: Partial<ProFormProps>; // 表单属性
  setComponentRef: (name, ref) => void; // 设置组件引用
  fieldStatusMap: Record<string, FieldStatus>;
  setFieldStatusMap: (statusMap) => void;
  isDraftState: boolean;
  setIsDraftState: (draft) => void;
  isPreviewState: boolean;
  setIsPreviewState: (preview) => void;
  formStore: FormStore; // FormStore 实例
  Provider: React.FC<{ children }>; // 上下文提供者
  fieldNavigation: UseFieldNavigationReturn; // 键盘导航
}
```

**instance 方法详解**：

| 方法                                  | 说明                 | 实现                                    |
| ------------------------------------- | -------------------- | --------------------------------------- |
| `getFieldsValue(nameList?)`           | 获取所有/指定字段值  | 调用 arcoForm.getFieldsValue            |
| `setFieldsValue(values)`              | 批量设置字段值       | arcoForm.setFieldsValue                 |
| `getFieldValue(name)`                 | 获取单个字段值       | arcoForm.getFieldValue                  |
| `setFieldValue(name, value)`          | 设置单个字段值       | arcoForm.setFieldValue                  |
| `resetFields(nameList?)`              | 重置字段             | arcoForm.resetFields                    |
| `validate()`                          | 验证所有字段         | arcoForm.validate                       |
| `validateField(name)`                 | 验证指定字段         | arcoForm.validate([name])               |
| `clearValidate(name?)`                | 清除验证信息         | arcoForm.setFieldError(name, undefined) |
| `getFieldStatus(name)`                | 获取字段状态         | 从 fieldStatusMap 获取                  |
| `setFieldStatus(name, status)`        | 设置字段状态         | 更新 fieldStatusMap                     |
| `isDraft()` / `setDraft(draft)`       | 草稿模式             | isDraftState 状态                       |
| `isPreview()` / `setPreview(preview)` | 预览模式             | isPreviewState 状态                     |
| `focusField(name)`                    | 聚焦指定字段         | fieldNavigation.focusField              |
| `focusNextField(currentName?)`        | 聚焦下一个字段       | fieldNavigation.focusNextField          |
| `focusPrevField(currentName?)`        | 聚焦上一个字段       | fieldNavigation.focusPrevField          |
| `getFocusedField()`                   | 获取当前聚焦字段名   | fieldNavigation.focusedField            |
| `getFieldFocused(name)`               | 获取指定字段聚焦状态 | formStore.getField(name).focused        |
| `getRef(name)`                        | 获取组件实例引用     | componentRefs.current[name]             |
| `setSchemas(schemas)`                 | 动态更新表单配置     | setSchemasState                         |
| `setProps(props)`                     | 动态更新表单属性     | setFormPropsState                       |
| `scrollToField(name)`                 | 滚动到指定字段       | arcoForm.scrollToField                  |
| `submit()`                            | 提交表单             | 调用 validate()                         |

**初始化流程**：

```
useProForm(options)
    │
    ├── 1. useMemo(() => createFormStore())  → 创建 FormStore（仅一次）
    ├── 2. useArcoForm(formStore)            → 创建 Arco Form 兼容实例
    ├── 3. useFieldNavigation(...)           → 初始化键盘导航
    ├── 4. useCallback 封装所有 instance 方法
    ├── 5. useMemo 构建 instance 对象
    ├── 6. useMemo 构建 bindingProps（合并所有 props）
    └── 7. useMemo 创建 Provider 组件（包裹 ProFormContext）
```

### 13.2 useArcoForm — Arco Form 兼容层

**文件**：`hooks/useArcoForm.ts`

**职责**：创建与 Arco Design Form 兼容的 form 实例，确保 ProForm 无缝使用 Arco 的 `Form.Item` 组件

```typescript
export function useArcoForm(_formStore: FormStore): ArcoFormInstance {
  const [arcoForm] = Form.useForm?.() || [null];
  if (!arcoForm) {
    throw new Error('Arco Form useForm hook is not available');
  }
  return arcoForm;
}
```

**ArcoFormInstance 接口**：

```typescript
interface ArcoFormInstance {
  getFieldValue: (name: string) => unknown;
  getFieldsValue: () => Record<string, unknown>;
  setFieldValue: (name: string, value: unknown) => void;
  setFieldsValue: (values: Record<string, unknown>) => void;
  resetFields: (names?: string[]) => void;
  validate: (names?: string[]) => Promise<Record<string, unknown>>;
  submit: () => Promise<Record<string, unknown>>;
  getFieldsError: () => Record<string, string>;
  getFieldError: (name: string) => string | undefined;
  clearFields: () => void;
  scrollToField: (name: string) => void;
  setFieldError: (name: string, error: string | undefined) => void;
  setFields: (fields: Record<string, { value?; error? }>) => void;
  getFields: () => Record<string, { value?; error? }>;
}
```

### 13.3 useFieldNavigation — 键盘导航

**文件**：`hooks/useFieldNavigation.ts`

**职责**：提供字段间的键盘导航能力

**配置选项**：

```typescript
interface KeyboardNavigationConfig {
  enabled?: boolean; // 是否启用（默认 true）
  autoFocusFirstField?: boolean; // 自动聚焦第一个字段（默认 true）
  tabBehavior?: 'next' | 'default'; // Tab 键行为（默认 'default'）
  arrowKeyNavigation?: boolean; // 上下键导航（默认 true）
}
```

**导航逻辑**：

| 按键        | 行为                                               |
| ----------- | -------------------------------------------------- |
| `Tab`       | 下一个字段（仅当 `tabBehavior === 'next'` 时拦截） |
| `Shift+Tab` | 上一个字段                                         |
| `ArrowDown` | 下一个字段                                         |
| `ArrowUp`   | 上一个字段                                         |

**实现机制**：

1. `getVisibleFieldNames()` — 从 schemas 提取所有字段名
2. `getFieldElement(name)` — 优先从 ref 获取，回退到 `document.querySelector([data-field-name=name])`
3. `element.focus()` — 聚焦目标元素
4. 自动聚焦：`useEffect` 中 `setTimeout(() => focusField(fieldNames[0]), 0)`

### 13.4 useVirtualScroll — 虚拟滚动

**文件**：`hooks/useVirtualScroll.ts`

**职责**：优化大数据量表单的渲染性能，只渲染可视区域内的字段

**配置**：

```typescript
interface VirtualScrollConfig {
  itemHeight: number; // 列表项高度（默认 60px）
  overscan?: number; // 可视区域外额外渲染的项数（默认 5）
  containerHeight?: number; // 容器高度（不设置则自动计算）
}
```

**工作原理**：

```
┌─────────────────────────────────┐
│      虚拟滚动容器（固定高度）      │
│  ┌───────────────────────────┐  │
│  │   占位层（totalHeight）    │  │  ← items.length * itemHeight
│  │   ┌─────────────────────┐ │  │
│  │   │   偏移层（offsetY）  │ │  │  ← startIndex * itemHeight
│  │   │   ┌───────────────┐ │ │  │
│  │   │   │ 可视区域内的    │ │ │  │  ← only visibleItems
│  │   │   │ 字段（仅渲染）  │ │ │  │
│  │   │   └───────────────┘ │ │  │
│  │   └─────────────────────┘ │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**核心算法**：

```typescript
const virtualState = useMemo(() => {
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;
  return { startIndex, endIndex, visibleItems, totalHeight, offsetY, isScrolling };
}, [items, scrollTop, itemHeight, containerHeight, overscan, isScrolling]);
```

**动态高度版本** `useDynamicVirtualScroll`：支持高度不固定的列表项，通过 `getItemHeight` 回调 + `measureItem` 实测高度 + 二分查找定位。

**滚动状态**：滚动时 `isScrolling=true`，停止滚动 150ms 后置为 `false`，可用于优化滚动期间的渲染。

### 13.5 useLazyField — 懒加载

**文件**：`hooks/useLazyField.ts`

**职责**：延迟加载非关键字段，提升首屏性能

**三种加载策略**：

| 策略           | Hook               | 适用场景             | 配置参数                                                                    |
| -------------- | ------------------ | -------------------- | --------------------------------------------------------------------------- |
| **优先级加载** | `usePriorityLoad`  | 部分字段需要优先渲染 | `highPriority`, `mediumPriority`, `mediumPriorityDelay`, `lowPriorityDelay` |
| **分组加载**   | `useGroupLazyLoad` | 大量字段均匀分布     | `groupSize`, `groupDelay`, `enabled`                                        |
| **视口加载**   | `useLazyField`     | 单个字段懒加载       | `delay`, `inViewport`, `rootMargin`, `threshold`                            |

**优先级加载流程**：

```
首屏 → 高优先级字段立即渲染（highPriority）
    ↓ mediumPriorityDelay（默认 200ms）
中优先级字段渲染（mediumPriority）
    ↓ lowPriorityDelay（默认 500ms）
低优先级字段渲染（剩余所有字段）
```

**分组加载流程**：

```
首屏 → 第 1 组（groupSize=10）字段渲染
    ↓ groupDelay（默认 100ms）
第 2 组字段渲染
    ↓ groupDelay
第 3 组字段渲染
    ↓ ...
所有字段渲染完成（isComplete=true）
```

**视口加载流程**：

```
字段进入视口 → IntersectionObserver 触发 → requestAnimationFrame → 字段渲染
配置：rootMargin='50px', threshold=0
```

---

## 八、Registry 层

**文件**：`registry/`

Registry 层提供可插拔的注册机制，支持组件、渲染器和实例的动态注册。

### 13.1 componentRegistry — 组件注册表

**文件**：`registry/componentRegistry.ts`

**职责**：管理可用于 Schema 的组件，支持动态注册和快速组件语法解析

**核心方法**：

| 方法                                   | 说明                 |
| -------------------------------------- | -------------------- |
| `registerComponent(name, component)`   | 注册单个组件         |
| `registerComponents(components)`       | 批量注册组件         |
| `getComponent(name)`                   | 获取组件             |
| `hasComponent(name)`                   | 检查组件是否已注册   |
| `getRegisteredComponentNames()`        | 获取所有已注册组件名 |
| `registerQuickComponent(name, config)` | 注册快速组件配置     |
| `parseQuickComponent(name)`            | 解析快速组件语法     |
| `clearComponentRegistry()`             | 清空注册表           |

**快速组件语法**：

| 语法               | 类型   | 示例         | 解析结果                          |
| ------------------ | ------ | ------------ | --------------------------------- |
| `${Component}后缀` | unit   | `${Input}元` | baseComponent=Input, suffix=元    |
| `前缀${Component}` | prefix | `￥${Input}` | baseComponent=Input, prefix=￥    |
| `QuickName`        | quick  | `Password`   | 从 quickComponentConfigs 获取配置 |
| `ComponentName`    | normal | `Select`     | 直接查找 componentRegistry        |

**解析逻辑**：

```typescript
function parseQuickComponent(componentName) {
  // 1. 检查 quickComponentConfigs
  if (quickComponentConfigs[componentName]) return { type: 'quick', config, name };

  // 2. 匹配 ${InputNumber|Input}后缀
  const unitMatch = componentName.match(/^\$\{(InputNumber|Input)\}(.+)$/);
  if (unitMatch) return { type: 'unit', baseComponent, suffix, name };

  // 3. 匹配 前缀${InputNumber|Input}
  const prefixMatch = componentName.match(/^(.+)\$\{(InputNumber|Input)\}$/);
  if (prefixMatch) return { type: 'prefix', baseComponent, prefix, name };

  // 4. 普通组件
  return { type: 'normal', name: componentName };
}
```

### 13.2 readonlyRegistry — 只读渲染器注册表

**文件**：`registry/readonlyRegistry.tsx`

**职责**：管理字段在只读/预览模式下的渲染方式

**渲染器接口**：

```typescript
type ReadonlyRenderer = (
  value: unknown,
  options: Array<{ label; value }> | undefined,
  config: ReadonlyRenderConfig,
  componentProps?: Record<string, unknown>,
  meta?: { status: FieldStatus; values: Record<string, unknown> },
) => React.ReactNode;
```

第5个参数 `meta` 携带字段上下文信息：

- `meta.status` — 当前字段的有效状态（edit / readonly / disabled / hidden）
- `meta.values` — 全表单的当前值，可用于跨字段联动显示

渲染器可以根据 `meta.status` 展示不同的样式（如 disabled 态用灰色文字）。

**内置渲染器**：

| 渲染器                  | 适用组件       | 说明                                 |
| ----------------------- | -------------- | ------------------------------------ |
| `textRenderer`          | Input          | 文本渲染（支持 maxLength、ellipsis） |
| `textareaRenderer`      | TextArea       | 多行文本渲染（支持换行）             |
| `numberRenderer`        | InputNumber    | 数字渲染（支持千分位、精度）         |
| `optionRenderer`        | Select/Radio   | 选项渲染（支持 tag 模式）            |
| `checkboxRenderer`      | Checkbox       | 多选渲染（tag 模式）                 |
| `switchRenderer`        | Switch         | 开关渲染（是/否标签）                |
| `dateRenderer`          | DatePicker     | 日期渲染（支持范围）                 |
| `timeRenderer`          | TimePicker     | 时间渲染（支持范围）                 |
| `dateTimeRenderer`      | DateTimePicker | 日期时间渲染                         |
| `currencyRenderer`      | Amount         | 货币渲染（千分位、精度）             |
| `percentageRenderer`    | Percentage     | 百分比渲染                           |
| `jsonRenderer`          | -              | JSON 格式化渲染                      |
| `imageRenderer`         | ImageList      | 图片渲染（支持预览）                 |
| `videoRenderer`         | -              | 视频渲染（支持预览）                 |
| `fileRenderer`          | Upload         | 文件渲染（下载链接）                 |
| `linkRenderer`          | -              | 链接渲染                             |
| `phoneRenderer`         | Phone          | 电话脱敏（138****1234）              |
| `emailRenderer`         | Email          | 邮箱脱敏（a***@example.com）         |
| `idCardRenderer`        | IdCard         | 身份证脱敏（110101********1234）     |
| `yesNoRenderer`         | YesNo          | 是/否（Tag 颜色）                    |
| `maleFemaleRenderer`    | MaleFemale     | 男/女（Tag 颜色）                    |
| `enableDisableRenderer` | EnableDisable  | 启用/禁用                            |
| `openCloseRenderer`     | OpenClose      | 开启/关闭                            |
| `statusRenderer`        | Status         | 状态（草稿/待审核/已通过/已拒绝）    |

**核心方法**：

| 方法                                                | 说明                                    |
| --------------------------------------------------- | --------------------------------------- |
| `registerReadonlyRenderer(componentType, renderer)` | 注册渲染器                              |
| `registerReadonlyRenderers(renderers)`              | 批量注册                                |
| `getReadonlyRenderer(componentType)`                | 获取渲染器（不存在则返回 textRenderer） |
| `getRendererByMode(mode)`                           | 按 mode 获取渲染器                      |
| `hasReadonlyRenderer(componentType)`                | 检查是否存在                            |
| `resetReadonlyRenderers()`                          | 重置为默认                              |

**渲染器选择逻辑**（在 FormField 中）：

```typescript
const renderer =
  readonlyConfig.mode && readonlyConfig.mode !== 'custom'
    ? getRendererByMode(readonlyConfig.mode) // 优先按 mode 查找
    : getReadonlyRenderer(readonlyComponentName || 'Input'); // 按 component 查找
```

## 九、Component 层

### 13.1 ProForm — 主组件

**文件**：`ProForm.tsx`

**职责**：组装所有子模块，提供完整的表单功能

**渲染流程**：

```
ProForm 渲染流程
    │
    ├── 1. useProForm(options) → 获取 arcoForm, instance, formStore, fieldNavigation
    │
    ├── 2. 构建 formState（createFormState）
    │
    ├── 3. 构建 RootContextValue 和 LayoutContextValue
    │
    ├── 4. 性能优化处理
    │     ├── 虚拟滚动（字段数 > 20 && virtualScroll.enabled）
    │     │     └── useVirtualScroll → virtualState.visibleItems
    │     ├── 懒加载（字段数 > 10 && lazyLoad.enabled）
    │     │     ├── usePriorityLoad（配置了 highPriorityFields 时）
    │     │     └── useGroupLazyLoad（否则）
    │     └── 全局配置合并：schema 未定义时使用 ProFormProps 的全局配置
    │
    ├── 5. 计算 visibleSchemas
    │     ├── 虚拟滚动 → virtualState.visibleItems
    │     ├── 优先级懒加载 → filter(priorityVisibleFields)
    │     ├── 分组懒加载 → slice(0, groupLoadedCount)
    │     └── 默认 → 全部 schemas
    │
    ├── 6. renderFields()
    │     ├── Grid 布局（columns > 1）
    │     │     ├── 过滤 hidden 字段
    │     │     ├── 折叠状态：前 columns-1 个字段 + 按钮组
    │     │     └── 非折叠：字段 + 自动换行 + 按钮组
    │     └── 非 Grid 布局：字段垂直排列 + 按钮组
    │
    ├── 7. 虚拟滚动容器包装（如果启用）
    │
    ├── 8. Arco Form 包装
    │     └── <Form form={arcoForm} layout onKeyDown={fieldNavigation.handleKeyDown}>
    │
    ├── 9. Context Provider 包裹
    │     ├── RootContextProvider（含 validateMessages）
    │     └── LayoutContextProvider
    │
    └── 10. Card 容器包装（如果 cardContainer 启用）
          └──
```

**布局模式**：

| 模式         | 说明             | Arco layout      |
| ------------ | ---------------- | ---------------- |
| `vertical`   | 垂直布局（默认） | `vertical`       |
| `horizontal` | 水平布局         | `horizontal`     |
| `inline`     | 行内布局         | `inline`         |
| `compact`    | 紧凑布局         | `inline` + gap:8 |

**Grid 布局**：

- `columns`：列数（1-4），`baseSpan = Math.floor(24 / columns)`
- `gutter`：列间距
- `schema.col`：单个字段占用的列数（覆盖 baseSpan）
- `collapsible` + `collapsedRows`：折叠时只展示 `columns * collapsedRows - 1` 个字段（最后一列放按钮组）

**按钮组**：

- `showButton`：是否显示
- `buttonList`：自定义按钮列表（ButtonConfig[]）
- `buttons`：完全自定义按钮 ReactNode
- `buttonPosition`：left / center / right
- 预览模式自动隐藏按钮组

### 13.2 FormField — 字段渲染器

**文件**：`FormField.tsx`

**职责**：根据 Schema 渲染单个字段，处理字段的完整生命周期

**组件结构**：

```
FormField（外层）
    │
    ├── useMemo → 创建/获取 FieldNode
    │     ├── formStore.getField(schema.name) → 已存在则复用
    │     └── createFieldNode(schema, formStore) → 不存在则创建并注册
    │
    ├── useEffect → 组件卸载时 unregisterField
    │
    ├── SchemaContextProvider → 提供字段静态配置
    └── LayoutContextProvider → 提供字段级布局配置
          │
          └── FormFieldInner（内层）
                │
                ├── useState → value, status, error, focused
                │
                ├── useEffect → 订阅 fieldNode 值/状态变化
                │     ├── subscribeToValueChange → setValueState + arcoForm.setFieldValue
                │     └── subscribeToStatusChange → setStatusState
                │
                ├── handleChange(newValue)
                │     ├── 调用 componentProps.onChange（原始回调）
                │     ├── fieldNode.setValue(newValue)（含 transform.output）
                │     ├── arcoForm.setFieldValue
                │     ├── onFieldChange 回调
                │     └── rootContext.onValuesChange 回调
                │
                ├── 状态判断
                │     ├── status === 'hidden' → return null
                │     ├── status === 'preview' | 'readonly' → renderReadonlyContent
                │     └── status === 'edit' | 'disabled' → renderComponent
                │
                ├── parseQuickComponent → 解析组件类型
                │
                ├── renderComponent()
                │     ├── unit/prefix → QuickInputWithSuffix / QuickInputNumberWithSuffix
                │     ├── quick → getComponent(name)
                │     └── normal → getComponent(component)
                │
                ├── FieldContextProvider → 提供字段运行时上下文
                │
                └── Arco Form.Item → 包裹字段组件
```

**只读渲染逻辑**：

```typescript
const renderReadonlyContent = useMemo(() => {
  // 确定渲染器
  const renderer =
    readonlyConfig.mode && readonlyConfig.mode !== 'custom'
      ? getRendererByMode(readonlyConfig.mode)
      : getReadonlyRenderer(readonlyComponentName || 'Input');

  // 调用渲染器
  return renderer(displayValue, schema.options, readonlyConfig, schema.componentProps);
}, [fieldNode.schema, parsedQuickComponent, displayValue]);
```

**RangePicker 特殊处理**：

当字段为数组类型（如日期范围），通过 `_rangePickerNames` 存储起止字段名，值以数组形式 `[startValue, endValue]` 传递。

### 13.3 ProFormList — 动态表单列表

**文件**：`components/ProFormList.tsx`

**职责**：支持动态添加/删除/复制/移动/清空列表项的表单组件。

**受控/非受控模式**（核心设计）：

- **受控模式**：提供 `value` prop，行数组由父组件控制，所有变更通过 `onChange` 回调通知父组件，由父组件更新 `value` 实现同步。此时组件内部不维护状态。
- **非受控模式**：不提供 `value` prop，行数组由组件内部 state 主导，挂载时从 store 读取初始值（兼容 ProForm `initialValues` 注入），此后所有变更单向同步回 store。
- 行内字段以扁平字段名 `name[index].field` 形式注册到 store，与数组值 `name` 相互独立。
- 结构变更（move/remove）时主动通过 `readRowValues` / `writeRowValues` 重排扁平字段值，保证显示与数据一致。

**Props**：

| 属性                                              | 类型                                                                | 说明                                  |
| ------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| `name`                                            | string                                                              | 列表字段名（数组值的存储键）          |
| `label`                                           | string                                                              | 列表标签                              |
| `itemTitle`                                       | string \| ((index) => string)                                       | 行标题                                |
| `schemas`                                         | ProFormSchema[]                                                     | 行内字段配置                          |
| `min` / `max`                                     | number                                                              | 最小/最大行数（默认 0 / Infinity）    |
| `addText` / `removeText`                          | string                                                              | 添加/删除按钮文本                     |
| `showAddButton` / `showRemoveButton`              | boolean                                                             | 是否显示按钮                          |
| `copyText` / `showCopyButton`                     | string / boolean                                                    | 复制按钮文本 / 是否显示               |
| `moveUpText` / `moveDownText`                     | string                                                              | 上移/下移按钮文本                     |
| `showMoveButtons`                                 | boolean                                                             | 是否显示上移/下移按钮                 |
| `clearText` / `showClearButton`                   | string / boolean                                                    | 清空按钮文本 / 是否显示               |
| `creatorRecord`                                   | Record<string, unknown>                                             | 新增行默认记录（替代空对象 `{}`）     |
| `onAdd(index)` / `onRemove(index)`                | function                                                            | 添加/删除回调                         |
| `onCopy(index)` / `onMove(from, to)` / `onClear`  | function                                                            | 复制/移动/清空回调                    |
| `value`                                           | unknown[]                                                           | 行数组（受控），提供此 prop 时进入受控模式 |
| `onChange(value)`                                 | function                                                            | 行数组变更回调，受控模式下必须提供以实现值同步 |
| `onValuesChange`                                  | 由 RootContext 注入                                                 | 表单值变化回调（非受控模式）          |
| `initialValue`                                    | unknown[]                                                           | 初始行数组（非受控模式，默认 `[]`）   |
| `disabled` / `readonly`                           | boolean                                                             | 禁用/只读                             |
| `card` / `cardProps`                              | boolean / object                                                    | 是否用 Card 包裹 / Card 属性          |
| `itemRender(item, index, actions)`                | function                                                            | 自定义单项渲染                        |
| `emptyText`                                       | ReactNode                                                           | 空列表占位内容（默认"暂无数据"）      |
| `className` / `style`                             | string / CSSProperties                                              | 自定义类名/样式                       |

**字段名生成逻辑**：

```typescript
// 列表项字段名格式：{name}[{index}].{fieldKey}
// fieldKey = Array.isArray(schema.name) ? schema.name.join('.') : schema.name
const itemSchemas = schemas.map((schema) => ({
  ...schema,
  name: `${name}[${index}].${getFieldKey(schema.name)}`,
}));
```

**核心操作**（通过 ref 实例方法调用）：

- `add(record?)`：预置扁平字段值后追加一行，受 `max` 限制
- `remove(index)`：读取所有行扁平值 → 删除目标行 → 重排，受 `min` 限制
- `copy(index)`：复制指定行扁平值并追加到末尾，受 `max` 限制
- `move(from, to)`：读取所有行扁平值 → 重排 → 按新顺序重写扁平字段值
- `moveUp(index)` / `moveDown(index)`：`move` 的便捷封装
- `clear()`：清空所有行，受 `min` 约束保留 `min` 条
- 边界控制：`items.length <= min` 禁用删除/清空，`items.length >= max` 禁用添加/复制

**实例接口**：

```typescript
interface ProFormListActions {
  add: (record?: Record<string, unknown>) => void;
  remove: (index: number) => void;
  copy: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  move: (from: number, to: number) => void;
  clear: () => void;
}

interface ProFormListInstance extends ProFormListActions {
  getList: () => unknown[]; // 获取当前行数组（浅拷贝）
  getLength: () => number; // 获取当前行数
}
```

### 13.4 ProFormSteps — 分步表单

**文件**：`components/ProFormSteps.tsx`

**职责**：支持多步骤表单，每步独立验证。

**受控/非受控模式**（步骤索引）：

- **受控模式**：提供 `current` prop，步骤索引由父组件控制，所有变更通过 `onChange` 回调通知父组件，由父组件更新 `current` 实现同步。
- **非受控模式**：不提供 `current` prop，步骤索引由组件内部 state 主导，使用 `defaultCurrent` 作为初始值。

**实现说明**：每步通过内嵌一个 `<ProForm>` 渲染该步字段，并通过 `innerFormRef` 获取内嵌实例，使 `validateStep` / `submit` / `reset` 能精确作用于当前步的字段（父级 store 无法访问内嵌字段）。

**Props**：

| 属性                                   | 类型                       | 说明                                           |
| -------------------------------------- | -------------------------- | ---------------------------------------------- |
| `steps`                                | ProFormStepSchema[]        | 步骤配置（每步含 title, description, schemas） |
| `current`                              | number                     | 当前步骤（受控），提供此 prop 时进入受控模式    |
| `defaultCurrent`                       | number                     | 默认步骤（非受控模式，默认 0）                  |
| `onChange(current)`                    | function                   | 步骤变化回调，受控模式下必须提供以实现值同步    |
| `onStepChange(from, to)`               | function                   | 步骤切换回调                                   |
| `prevText` / `nextText` / `submitText` | string                     | 按钮文本                                       |
| `validateOnNext`                       | boolean                    | 切换时是否验证（默认 true）                    |
| `showSteps`                            | boolean                    | 是否显示步骤条                                 |
| `direction`                            | 'horizontal' \| 'vertical' | 步骤条方向                                     |
| `stepsProps`                           | object                     | Steps 组件透传属性                             |
| `showButton`                           | boolean                    | 是否显示按钮                                   |
| `onFinish(values)`                     | function                   | 最后一步提交回调（由 submit 按钮或 `submit()` 触发） |
| `showResetButton`                      | boolean                    | 是否显示重置按钮（默认 false）                 |
| `resetText`                            | string                     | 重置按钮文本                                   |
| `onReset`                              | function                   | 重置回调                                       |
| `className` / `style`                  | string / CSSProperties     | 自定义类名/样式                                |

**实例接口**：

```typescript
interface ProFormStepsInstance {
  prev: () => void;
  next: () => Promise<void>; // 最后一步时触发提交
  goTo: (index: number) => void;
  getCurrent: () => number;
  getStep: (index: number) => ProFormStepSchema | undefined;
  getSteps: () => ProFormStepSchema[];
  validateStep: (index?: number) => Promise<boolean>; // 校验指定步骤（默认当前步）
  reset: () => void; // 重置到第一步并清除校验状态
  submit: () => Promise<void>; // 触发 onFinish
}
```

**步骤验证逻辑**（基于内嵌实例的 store）：

```typescript
const handleNext = async () => {
  // 最后一步：触发提交
  if (current >= steps.length - 1) {
    await submit();
    return;
  }
  if (validateOnNext) {
    const ok = await validateStep(current); // 通过 innerFormRef.current.store 校验
    if (!ok) return; // 验证失败，阻止切换
  }
  setCurrent(Math.min(steps.length - 1, current + 1));
};

// validateStep 内部通过 innerFormRef.current.store.getField(name) 访问 FieldNode
const store = innerFormRef.current?.store;
for (const s of step.schemas) {
  const field = store.getField(Array.isArray(s.name) ? s.name[0] : s.name);
  if (field) {
    const error = await field.validate();
    if (error) hasError = true;
  }
}
```

### 13.5 QuickComponents — 快捷组件

**文件**：`components/QuickComponents.tsx`

提供常用业务场景的快捷组件，在模块加载时自动注册：

| 组件                         | 基础组件                 | 说明                                  |
| ---------------------------- | ------------------------ | ------------------------------------- |
| `Password`                   | Input                    | 密码输入框（带显示/隐藏切换）         |
| `YesNo`                      | Select                   | 是/否选择                             |
| `MaleFemale`                 | Radio.Group              | 性别选择                              |
| `EnableDisable`              | Select                   | 启用/禁用选择                         |
| `Status`                     | Select                   | 状态选择（草稿/待审核/已通过/已拒绝） |
| `OpenClose`                  | Select                   | 开启/关闭选择                         |
| `VerificationCode`           | Input.Search             | 验证码输入框（带倒计时）              |
| `ImageList`                  | -                        | 图片列表展示（支持预览）              |
| `Phone`                      | Input                    | 手机号输入（限制 11 位）              |
| `Email`                      | Input                    | 邮箱输入                              |
| `IdCard`                     | Input                    | 身份证输入（限制 18 位）              |
| `Amount`                     | InputNumber              | 金额输入（带 ¥ 前缀，精度 2）         |
| `Percentage`                 | InputNumber              | 百分比输入（带 % 后缀，范围 0-100）   |
| `YearPicker`                 | DatePicker.YearPicker    | 年份选择                              |
| `MonthPicker`                | DatePicker.MonthPicker   | 月份选择                              |
| `WeekPicker`                 | DatePicker.WeekPicker    | 周选择                                |
| `QuarterPicker`              | DatePicker.QuarterPicker | 季度选择                              |
| `RangePicker`                | DatePicker.RangePicker   | 日期范围选择                          |
| `TimeRangePicker`            | TimePicker.RangePicker   | 时间范围选择                          |
| `QuickInputWithSuffix`       | Input                    | 带前后缀的输入框                      |
| `QuickInputNumberWithSuffix` | InputNumber              | 带前后缀的数字输入框                  |

### 13.6 FormPerformanceMonitor — 性能监控（已废弃）

**已迁移至 `@lania-pro-components/shared` 的 `PerformanceMonitor`**。

旧版 `FormPerformanceMonitor` 已移除。如需性能监控，请使用组合方式接入：

```tsx
import { PerformanceMonitor } from '@lania-pro-components/shared';

<ProForm schemas={schemas} />
<PerformanceMonitor measures={['form-render']} title='ProForm' />
```

ProForm 不再内置打点逻辑。

---

## 十、Utils 层

### 13.1 响应式系统（utils/reactive.ts）

ProForm 自研了一套类 Vue 3 的响应式系统，基于 Proxy 实现自动依赖收集。

**核心架构**：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    响应式系统核心架构                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐     ┌──────────────────────┐                 │
│  │   Proxy 拦截器   │────→│   targetMap (WeakMap) │                 │
│  │  get/set/delete  │     │  obj → Map<key→Dep>   │                 │
│  └──────────────────┘     └──────────┬───────────┘                 │
│                                      │                             │
│                                      ▼                             │
│                              ┌──────────────┐                      │
│                              │     Dep      │                      │
│                              │ subscribers  │                      │
│                              │   Set<fn>    │                      │
│                              └──────┬───────┘                      │
│                                     │                              │
│                    ┌────────────────┼────────────────┐             │
│                    ▼                ▼                ▼             │
│              ┌─────────┐    ┌─────────┐    ┌─────────┐            │
│              │ depend()│    │notify() │    │remove() │            │
│              └─────────┘    └─────────┘    └─────────┘            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     全局变量                                │    │
│  │  activeEffect: 当前执行的 effect                            │    │
│  │  effectStack: effect 调用栈（处理嵌套）                      │    │
│  │  batchQueue: 批量更新队列（Set）                             │    │
│  │  isBatching: 是否批量模式                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

**核心 API**：

| API                       | 说明                   | 实现原理                                            |
| ------------------------- | ---------------------- | --------------------------------------------------- |
| `reactive(obj)`           | 创建响应式对象         | Proxy 拦截 get/set/deleteProperty，递归处理嵌套对象 |
| `ref(value)`              | 创建响应式引用         | `reactive({ value })` 的语法糖                      |
| `computed(getter)`        | 创建计算属性           | 惰性求值 + 缓存 + dirty 标记                        |
| `watch(source, callback)` | 监听响应式值变化       | effect + 手动对比新旧值                             |
| `effect(fn)`              | 创建副作用函数         | 设置 activeEffect → 执行 fn → 收集依赖              |
| `batchUpdate(fn)`         | 批量更新               | 开启 isBatching → 执行 fn → 统一通知                |
| `trigger(target, key)`    | 手动触发更新           | 直接调用 dep.notify()                               |
| `isReactive(target)`      | 检查是否响应式         | 查 targetMap                                        |
| `toReactive(target)`      | 转为响应式（如还不是） | 查 targetMap，不存在则 reactive()                   |

**依赖收集流程（Track）**：

```typescript
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const dep = getDep(target, key); // ① 获取/创建 Dep
      dep.depend(); // ② 收集依赖（activeEffect 加入 subscribers）
      const result = Reflect.get(target, key, receiver);
      if (isObject(result)) {
        return reactive(result); // ③ 递归处理嵌套对象
      }
      return result;
    },
  });
}

class Dep {
  depend() {
    if (activeEffect && !this.subscribers.has(activeEffect)) {
      this.subscribers.add(activeEffect);
    }
  }
}
```

**触发更新流程（Trigger）**：

```typescript
set(target, key, value, receiver) {
  const oldValue = Reflect.get(target, key, receiver);
  const result = Reflect.set(target, key, value, receiver);
  if (oldValue !== value) {           // 值真的变了才通知
    const dep = getDep(target, key);
    dep.notify();                     // 通知所有订阅者
  }
  return result;
}

class Dep {
  notify() {
    this.subscribers.forEach((effect) => {
      if (isBatching) {
        batchQueue.add(effect);       // 批量模式：先收集
      } else {
        effect();                     // 正常模式：直接执行
      }
    });
  }
}
```

**computed 实现原理**（惰性求值 + 缓存）：

```typescript
function computed(getter) {
  let cachedValue;
  let dirty = true; // 脏标记

  const effectFn = effect(
    () => {
      cachedValue = getter(); // 执行 getter → 收集依赖
      dirty = false; // 标记为干净
    },
    { immediate: false },
  ); // 不立即执行

  return {
    get value() {
      if (dirty) {
        // 脏了才重新计算
        effectFn();
      }
      return cachedValue; // 返回缓存值
    },
  };
}
```

**batchUpdate 实现原理**：

```typescript
function batchUpdate(fn) {
  isBatching = true; // ① 开启批量模式
  try {
    fn(); // ② 执行所有变更（effect 进入 batchQueue）
  } finally {
    isBatching = false; // ③ 关闭批量模式
    batchQueue.forEach((fn) => fn()); // ④ 统一执行所有 effect
    batchQueue.clear(); // ⑤ 清空队列
  }
}
```

**effect 嵌套处理**：

```typescript
function effect(fn) {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      effectStack.push(effectFn); // 压栈
      fn(); // 执行（触发依赖收集）
    } finally {
      effectStack.pop(); // 出栈
      activeEffect = effectStack[effectStack.length - 1] || null; // 恢复外层
    }
  };
  effectFn();
  return effectFn; // 返回用于清理
}
```

### 13.2 性能优化工具（utils/performance.ts）

**TaskQueue** — 任务队列：

```typescript
class TaskQueue {
  private queue: Array<() => void>;
  private isRunning = false;
  private frameId: number | null;

  add(task): void; // 添加任务
  addBatch(tasks): void; // 批量添加
  private schedule(): void; // requestAnimationFrame 调度
  private flush(): void; // 分批执行（每批 10 个，setTimeout 让出主线程）
  clear(): void;
}
```

**BatchUpdateManager** — 批量更新管理器：

```typescript
class BatchUpdateManager {
  private updates: Map<string, unknown>;
  private delay: number;  // 默认 16ms

  add(name, value): void;     // 添加更新（自动调度）
  addBatch(updates): void;    // 批量添加
  flush(): void;              // 立即执行
  get pendingCount: number;   // 待更新数量
}
```

**PerformanceMonitor** — 性能监控器：

```typescript
class PerformanceMonitor {
  mark(name): void; // 开始标记
  measure(name, startMark?): number; // 结束标记并测量
  getStats(name): { avg; min; max; count }; // 获取统计
  printStats(): void; // 打印所有统计
  clear(): void;
  setEnabled(enabled): void;
}

// 全局实例（开发环境启用）
export const performanceMonitor = new PerformanceMonitor(process.env.NODE_ENV === 'development');
```

**其他工具函数**：

| 函数/类                                                     | 说明                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| `debounce(fn, delay, immediate?)`                           | 防抖                                                    |
| `throttle(fn, limit)`                                       | 节流                                                    |
| `memoize(fn, keyGenerator?)`                                | 记忆化（基于 Map 缓存）                                 |
| `LRUCache<K,V>(maxSize)`                                    | LRU 缓存（基于 Map 有序性）                             |
| `scheduleIdleTask(task, timeout?)`                          | requestIdleCallback 执行低优先级任务（降级 setTimeout） |
| `scheduleChunkedTask(items, task, chunkSize?, onComplete?)` | 分片执行任务（scheduleIdleTask + chunk）                |
| `globalTaskQueue`                                           | 全局 TaskQueue 单例                                     |

---

## 十一、性能优化策略

### 13.1 三重优化体系

| 策略         | 配置                        | 触发条件               | 优化效果                              |
| ------------ | --------------------------- | ---------------------- | ------------------------------------- |
| **虚拟滚动** | `performance.virtualScroll` | 字段数 > 20 且 enabled | 只渲染可视区域，DOM 节点数恒定        |
| **懒加载**   | `performance.lazyLoad`      | 字段数 > 10 且 enabled | 分批渲染，首屏只加载高优先级字段      |
| **批量更新** | `performance.batchUpdate`   | 启用时                 | 合并多次状态变更，减少 React 渲染次数 |

### 13.2 虚拟滚动 vs 懒加载对比

| 维度           | 虚拟滚动                    | 懒加载                     |
| -------------- | --------------------------- | -------------------------- |
| **适用场景**   | 字段数 > 50，需要快速滚动   | 字段数 10-50，需要渐进加载 |
| **DOM 节点数** | 恒定（可视区域 + overscan） | 递增（分批加载）           |
| **内存占用**   | 低（只缓存可视字段）        | 中等（缓存已加载字段）     |
| **滚动体验**   | 流畅（无闪烁）              | 可能有闪烁（新字段加载时） |
| **实现复杂度** | 较高                        | 较低                       |

### 13.3 响应式层面的性能优化

| 机制               | 说明                                                      |
| ------------------ | --------------------------------------------------------- |
| **细粒度依赖收集** | 每个 key 独立 Dep，只有真正读取的属性才建立依赖           |
| **computed 缓存**  | dirty 标记 + 惰性求值，依赖未变化时直接返回缓存           |
| **batchUpdate**    | 多次值变更合并为一次通知，减少 effect 执行次数            |
| **值比较**         | set 时 `oldValue !== value` 才触发 notify，避免无意义更新 |

### 13.4 性能配置示例

```typescript
<ProForm
  schemas={largeSchemas}  // 100+ 字段
  performance={{
    virtualScroll: {
      enabled: true,
      itemHeight: 60,
      overscan: 5,
      containerHeight: 400,
    },
    lazyLoad: {
      enabled: true,
      highPriorityFields: ['name', 'email', 'phone'],
      mediumPriorityFields: ['address', 'company'],
      groupDelay: 200,
    },
    batchUpdate: {
      enabled: true,
      delay: 16,
    },
  }}
/>
```

---

## 十二、完整数据流

### 13.1 用户输入到状态更新

```
用户输入 "a"
    │
    ├── FormField.handleChange("a")
    │     │
    │     ├── 1. 调用 componentProps.onChange（原始回调）
    │     │
    │     ├── 2. fieldNode.setValue("a")
    │     │     │
    │     │     ├── transform.output（如果有）→ 转换值
    │     │     ├── _value.value = "a"           （ref.set → Proxy.set → Dep.notify()）
    │     │     └── store.setValue(fieldName, "a")
    │     │           │
    │     │           └── batchUpdate 内：
    │     │                 ├── state.values[name] = "a"    （Proxy.set → Dep.notify()）
    │     │                 └── state.touched[name] = true  （Proxy.set → Dep.notify()）
    │     │
    │     ├── 3. arcoForm.setFieldValue(fieldName, "a")    （同步到 Arco Form）
    │     │
    │     ├── 4. onFieldChange("a", allValues) 回调
    │     │
    │     └── 5. rootContext.onValuesChange({ [name]: "a" }, allValues)
    │
    │
    │  ===== 响应式系统自动传播 =====
    │
    ├── 6. watch(state.values[name]) 触发 → runReactions(name)
    │     └── 遍历 reactions，执行依赖 name 的联动规则
    │           └── reaction.run(field, form) → 可修改其他字段
    │
    ├── 7. watch(state.values[dep]) 触发（如果有依赖）
    │     └── _effectiveStatus 自动重算
    │           └── _effectiveStatus 重算 → watch 触发
    │                 └── setStatus()
    │                       └── onStatusChangeCallbacks → FormField setStatusState
    │                       └── lifecycle.onStatusChange
    │
    ├── 8. fieldNode.subscribeToValueChange 回调
    │     └── FormField: setValueState("a") + arcoForm.setFieldValue
    │
    ├── 9. store.valueListeners 触发
    │     └── notifyValueChange(name, "a") → 所有订阅者
    │
    └── 10. lifecycle.onValueChange("a", oldValue, field, form)
```

### 13.2 表单提交流程

```
用户点击提交按钮
    │
    ├── 1. Form.onSubmit → handleFinish(values)
    │
    ├── 2. instance.validate()
    │     └── arcoForm.validate()
    │           ├── 遍历所有字段
    │           ├── ValidationEngine.validateField(field)
    │           │     ├── required 检查
    │           │     ├── rules 遍历（pattern/min/max/...）
    │           │     └── schema.validate（自定义）
    │           └── 返回 errors 或 values
    │
    ├── 3. 验证通过 → onFinish(values)
    │     └── 业务处理
    │
    └── 4. 验证失败 → onFinishFailed(errorInfo)
          └── scrollToFirstError（如果启用）→ arcoForm.scrollToField
```

### 13.3 字段联动流程

```
字段 A 值变化
    │
    ├── store.setValue("A", newValue)
    │     └── state.values["A"] = newValue → Dep.notify()
    │
    ├── watch(state.values["A"]) 触发
    │     └── runReactions("A")
    │           └── 遍历 state.reactions
    │                 └── 如果 reaction.dependencies.includes("A")
    │                       └── reaction.run(fieldB, form)
    │                             └── fieldB.setValue(...) / fieldB.setStatus(...)
    │
    └── watch(state.values["A"]) 触发（依赖 A 的字段）
          └── _effectiveStatus 自动重算
                └── _effectiveStatus 重算
                      └── 如果 behavior 是函数，以新 values 重新执行
                      └── watch(_effectiveStatus) 触发
                            └── setStatus()
                                  └── fieldB.setStatus(newStatus)
```

---

## 十三、扩展机制

### 13.1 自定义组件注册

```typescript
import { registerComponent } from '@/pro-components/ProForm';

// 注册自定义组件
registerComponent('MyCustomInput', MyCustomInputComponent);

// 在 Schema 中使用
const schema = {
  name: 'customField',
  component: 'MyCustomInput',
  componentProps: {/* 透传给组件的 props */},
};
```

### 13.2 自定义只读渲染器

```typescript
import { registerReadonlyRenderer } from '@/pro-components/ProForm';

registerReadonlyRenderer('MyCustomInput', (value, options, config, componentProps) => {
  return <span>{value}</span>;
});
```

### 13.3 快捷组件注册

```typescript
import { registerQuickComponent } from '@/pro-components/ProForm';

registerQuickComponent('Money', {
  baseComponent: 'InputNumber',
  prefix: '¥',
  formatter: (value) => Number(value).toFixed(2),
});

// 在 Schema 中使用
const schema = {
  name: 'amount',
  component: 'Money',
};
```

### 13.4 扩展上下文使用

```typescript
import { ExtensionContextProvider, useExtension } from '@/pro-components/ProForm';

// 注入扩展
<ExtensionContextProvider initialExtensions={{
  permission: {
    checkVisible: (fieldName) => hasPermission(fieldName),
    checkEditable: (fieldName) => canEdit(fieldName),
    permissions: { /* ... */ },
  },
  audit: {
    log: (action, data) => auditLog(action, data),
    logFieldChange: (fieldName, oldVal, newVal) => auditLog('fieldChange', { name, oldVal, newVal }),
  },
}}>
  <ProForm schemas={schemas} />
</ExtensionContextProvider>

// 在自定义组件中使用
const permission = useExtension<PermissionExtension>('permission');
const isVisible = permission?.checkVisible('fieldName');
```

---

## 十四、模块导出总览

ProForm 通过 `index.ts` 统一导出所有能力：

| 分类           | 导出内容                                                                                                                                                                                                                                                                                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **类型**       | `ProFormSchema`, `ProFormProps`, `ProFormInstance`, `FieldNodeAPI`, `FormStoreAPI`, `BehaviorDecl`, `FieldReaction`, `FieldLifecycle`, `ReadonlyRenderConfig`, `ReadonlyRenderer`, `QuickComponentConfig`, `ComponentRegistry`, `ReadonlyRegistry`, `LayoutMode`, `FormStatus`, `FieldStatus`, `ButtonConfig`, `ProFormPerformanceConfig`, `LazyLoadConfig`, `BatchUpdateConfig` |
| **组件**       | `ProForm`, `FormField`, `ProFormList`, `ProFormSteps`                                                                                                                                                                                                                                                                                                                            |
| **Hooks**      | `useProForm`, `useProFormContext`, `useArcoForm`, `useVirtualScroll`, `useDynamicVirtualScroll`, `useLazyField`, `useGroupLazyLoad`, `usePriorityLoad`                                                                                                                                                                                                                           |
| **Context**    | `RootContext`, `useRootContext`, `SchemaContext`, `useSchemaContext`, `FieldContext`, `useFieldContext`, `LayoutContext`, `useLayoutContext`, `ProFormContext`, `ProFormProvider`                                                                                                                                                                                                |
| **Core**       | `FormStore`, `createFormStore`, `FieldNode`, `createFieldNode`, `ValidationEngine`, `createValidationEngine`                                                                                                                                                                                                                                                                     |
| **Registry**   | `componentRegistry`, `registerComponent`, `registerQuickComponent`, `parseQuickComponent`, `readonlyRegistry`, `registerReadonlyRenderer`, `getReadonlyRenderer`                                                                                                                                                                                                                 |
| **响应式系统** | `reactive`, `effect`, `computed`, `watch`, `batchUpdate`, `ref`, `toReactive`, `isReactive`, `trigger`                                                                                                                                                                                                                                                                           |
| **性能工具**   | `TaskQueue`, `globalTaskQueue`, `BatchUpdateManager`, `debounce`, `throttle`, `memoize`, `LRUCache`, `PerformanceMonitor`, `performanceMonitor`, `scheduleIdleTask`, `scheduleChunkedTask`                                                                                                                                                                                       |

**自动注册的模块**（import 副作用）：

- `core/customRenderers` — 自定义只读渲染器
- `core/baseComponents` — 基础 Arco 组件
- `components/QuickComponents` — 快捷组件

---

## 十五、使用示例

### 15.1 基础表单

```tsx
import { ProForm } from '@/pro-components/ProForm';

const schemas = [
  { name: 'username', label: '用户名', component: 'Input', required: true, placeholder: '请输入用户名' },
  { name: 'age', label: '年龄', component: 'InputNumber', min: 0, max: 150 },
  {
    name: 'gender',
    label: '性别',
    component: 'Radio.Group',
    options: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
    ],
  },
  { name: 'birthday', label: '生日', component: 'DatePicker' },
  { name: 'remark', label: '备注', component: 'TextArea' },
];

function BasicForm() {
  return (
    <ProForm
      schemas={schemas}
      layout='vertical'
      showButton
      onFinish={async (values) => {
        console.log('提交：', values);
      }}
    />
  );
}
```

### 15.2 Grid 布局 + 折叠

```tsx
<ProForm
  schemas={schemas}
  layout='horizontal'
  columns={3} // 3 列布局
  gutter={16} // 列间距 16px
  collapsible // 允许折叠
  collapsedRows={2} // 折叠时展示 2 行（最后一列放展开按钮）
  showButton
/>
```

### 15.3 通过 instance 控制（受控）

```tsx
import { ProForm, useProForm } from '@/pro-components/ProForm';

function ControlledForm() {
  const { instance } = useProForm({ initialValues: { username: 'admin' } });

  const handleFill = () => {
    instance.setFieldsValue({ username: '张三', age: 25, gender: 'male' });
  };

  const handleRead = () => {
    console.log('当前值：', instance.getFieldsValue());
  };

  const handleReset = () => {
    instance.resetFields();
  };

  return (
    <div>
      <button onClick={handleFill}>填充</button>
      <button onClick={handleRead}>读取</button>
      <button onClick={handleReset}>重置</button>
      <ProForm form={instance} schemas={schemas} />
    </div>
  );
}
```

### 15.4 验证规则

```tsx
const schemas = [
  {
    name: 'username',
    label: '用户名',
    component: 'Input',
    required: true,
    requiredMessage: '请输入用户名',
    rules: [
      { minLength: 3, maxLength: 20, message: '长度需在 3-20 之间' },
      { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字、下划线' },
    ],
  },
  {
    name: 'email',
    label: '邮箱',
    component: 'Input',
    rules: [
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' },
      {
        validator: async (value) => {
          // 异步校验唯一性
          const exists = await checkEmailExists(value);
          return exists ? '该邮箱已被注册' : undefined;
        },
      },
    ],
  },
  {
    name: 'age',
    label: '年龄',
    component: 'InputNumber',
    rules: [{ min: 18, max: 60, message: '年龄需在 18-60 之间' }],
  },
];
```

### 15.5 字段联动（reactions + behavior）

```tsx
const schemas = [
  {
    name: 'type',
    label: '类型',
    component: 'Select',
    options: [
      { label: '个人', value: 'personal' },
      { label: '企业', value: 'company' },
    ],
  },

  // behavior 动态控制可见性
  {
    name: 'companyName',
    label: '公司名称',
    component: 'Input',
    required: true,
    behavior: { visible: (values) => values.type === 'company' },
  },

  // schema.required 动态控制必填（支持函数形式的条件必填）
  {
    name: 'idCard',
    label: '身份证号',
    component: 'IdCard',
    required: (values) => values.type === 'personal',
  },

  // reactions 联动：选省后联动市的选项
  {
    name: 'province',
    label: '省',
    component: 'Select',
    options: provinceOptions,
  },
  {
    name: 'city',
    label: '市',
    component: 'Select',
    dependencies: ['province'],
    reactions: [
      {
        dependencies: ['province'],
        run: (field, form) => {
          const province = form.getValue('province');
          field.setValue(undefined);
          field.schema.options = cityOptionsByProvince[province] || [];
        },
      },
    ],
  },
];
```

### 15.6 只读 / 预览 / 草稿模式

```tsx
// 全表单只读
<ProForm schemas={schemas} readonly />

// 全表单预览
<ProForm schemas={schemas} preview />

// 草稿模式（值不参与验证，常用于暂存）
<ProForm schemas={schemas} draft />

// 单字段配置只读渲染器
const schemas = [
  { name: 'name', label: '姓名', component: 'Input', readonlyMode: 'text' },
  { name: 'amount', label: '金额', component: 'Amount',
    readonlyConfig: { mode: 'currency', currencySymbol: '￥', precision: 2 } },
  { name: 'avatar', label: '头像', component: 'ImageList',
    readonlyConfig: { mode: 'image', preview: { width: 80, height: 80 } } },
  { name: 'phone', label: '手机号', component: 'Phone', readonlyMode: 'phone' },
];
```

### 15.7 字段生命周期

```tsx
const schemas = [
  {
    name: 'username',
    label: '用户名',
    component: 'Input',
    lifecycle: {
      onInit: (field, form) => console.log('字段初始化', field.name),
      onMount: (field, form) => console.log('字段挂载'),
      onValueChange: (value, oldValue, field, form) => console.log(`值变化: ${oldValue} → ${value}`),
      onStatusChange: (status, oldStatus, field, form) => console.log(`状态变化: ${oldStatus} → ${status}`),
      onFocus: (field, form) => console.log('获得焦点'),
      onBlur: (field, form) => console.log('失去焦点'),
      onDestroy: (field, form) => console.log('字段销毁'),
    },
  },
];
```

### 15.8 动态列表 ProFormList

ProFormList 支持**受控/非受控双模式**。非受控模式下通过 ref 获取实例可命令式操作行。

**非受控模式**（推荐，行数组由内部 state 主导）：

```tsx
import { useRef } from 'react';
import { ProForm, ProFormList } from '@/pro-components/ProForm';
import type { ProFormListInstance } from '@/pro-components/ProForm';

const contactSchemas = [
  { name: 'name', label: '联系人', component: 'Input', required: true },
  { name: 'phone', label: '电话', component: 'Phone', required: true },
  {
    name: 'relation',
    label: '关系',
    component: 'Select',
    options: [
      { label: '家人', value: 'family' },
      { label: '朋友', value: 'friend' },
    ],
  },
];

function ListForm() {
  const listRef = useRef<ProFormListInstance>(null);

  const handleAddContact = () => {
    // 命令式新增一行（预填默认值）
    listRef.current?.add({ name: '', phone: '', relation: 'family' });
  };

  return (
    <ProForm>
      <ProFormList
        ref={listRef}
        name='contacts'
        label='紧急联系人'
        schemas={contactSchemas}
        min={1}
        max={5}
        addText='添加联系人'
        removeText='删除'
        showCopyButton
        showMoveButtons
        showClearButton
        creatorRecord={{ name: '', phone: '', relation: 'family' }}
        card
        onAdd={(index) => console.log('新增第', index, '项')}
        onRemove={(index) => console.log('删除第', index, '项')}
        onChange={(rows) => console.log('当前行数', rows.length)}
      />
      <button type='button' onClick={handleAddContact}>
        外部按钮新增
      </button>
    </ProForm>
  );
}
```

**受控模式**（行数组由父组件控制）：

```tsx
import { useState } from 'react';
import { ProForm, ProFormList } from '@/pro-components/ProForm';

function ControlledListForm() {
  const [contacts, setContacts] = useState([
    { name: '张三', phone: '13800138001', relation: 'family' },
  ]);

  return (
    <ProForm>
      <ProFormList
        name='contacts'
        label='紧急联系人'
        schemas={contactSchemas}
        min={1}
        max={5}
        value={contacts}
        onChange={setContacts}
      />
    </ProForm>
  );
}
```

实例方法（`ProFormListInstance`）：`add` / `remove` / `copy` / `move` / `moveUp` / `moveDown` / `clear` / `getList` / `getLength`。完整 Props 与实例接口见 [13.3](#133-proformlist--动态表单列表)。

### 15.9 分步表单 ProFormSteps

ProFormSteps 支持**受控/非受控双模式**（步骤索引）。每步内嵌一个 `<ProForm>` 渲染该步字段，通过 `innerFormRef` 访问内嵌实例，使 `validateStep` / `submit` / `reset` 精确作用于当前步字段。

**非受控模式**（推荐，步骤索引由内部 state 主导）：

```tsx
import { useRef } from 'react';
import { ProForm, ProFormSteps } from '@/pro-components/ProForm';
import type { ProFormStepsInstance } from '@/pro-components/ProForm';

const basicSchemas = [
  { name: 'name', label: '姓名', component: 'Input', required: true },
];
const contactSchemas = [
  { name: 'phone', label: '电话', component: 'Phone', required: true },
];

function StepsForm() {
  const stepsRef = useRef<ProFormStepsInstance>(null);

  return (
    <ProForm>
      <ProFormSteps
        ref={stepsRef}
        steps={[
          { title: '基本信息', schemas: basicSchemas },
          { title: '联系方式', schemas: contactSchemas },
        ]}
        showResetButton
        onFinish={(values) => console.log('提交', values)}
        onStepChange={(from, to) => console.log(`从第 ${from} 步切换到 ${to} 步`)}
      />
    </ProForm>
  );
}
```

**受控模式**（步骤索引由父组件控制）：

```tsx
import { useState } from 'react';
import { ProForm, ProFormSteps } from '@/pro-components/ProForm';

function ControlledStepsForm() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <ProForm>
      <ProFormSteps
        steps={[
          { title: '基本信息', schemas: basicSchemas },
          { title: '联系方式', schemas: contactSchemas },
        ]}
        current={currentStep}
        onChange={setCurrentStep}
        showResetButton
        onFinish={(values) => console.log('提交', values)}
      />
    </ProForm>
  );
}
```

实例方法（`ProFormStepsInstance`）：`prev` / `next`（最后一步触发提交） / `goTo` / `getCurrent` / `getStep` / `getSteps` / `validateStep` / `reset` / `submit`。完整 Props 与实例接口见 [13.4](#134-proformsteps--分步表单)。

### 15.10 大表单性能优化

```tsx
const largeSchemas = Array.from({ length: 100 }, (_, i) => ({
  name: `field_${i}`,
  label: `字段 ${i}`,
  component: 'Input',
}));

<ProForm
  schemas={largeSchemas}
  performance={{
    // 字段 > 20 启用虚拟滚动，DOM 节点恒定
    virtualScroll: { enabled: true, itemHeight: 60, overscan: 5, containerHeight: 500 },
    // 字段 > 10 启用懒加载，首屏优先渲染关键字段
    lazyLoad: {
      enabled: true,
      highPriorityFields: ['field_0', 'field_1', 'field_2'],
      mediumPriorityFields: ['field_3', 'field_4', 'field_5', 'field_6'],
      mediumPriorityDelay: 200,
      lowPriorityDelay: 500,
    },
    // 合并多次状态变更
    batchUpdate: { enabled: true, delay: 16 },
  }}
/>;
```

### 15.11 键盘导航

```tsx
<ProForm
  schemas={schemas}
  keyboardNavigation={{
    enabled: true,
    autoFocusFirstField: true, // 自动聚焦第一个字段
    tabBehavior: 'next', // Tab 键跳到下一个字段
    arrowKeyNavigation: true, // 上下方向键导航
  }}
/>;

// 通过 instance 编程式聚焦
form.focusField('email');
form.focusNextField('username'); // 从 username 跳到下一个
form.focusPrevField('email'); // 从 email 跳到上一个
```

### 15.12 值转换 transform

```tsx
const schemas = [
  {
    name: 'amount',
    label: '金额（分）',
    component: 'InputNumber',
    // 显示时：分 → 元；存储时：元 → 分
    transform: {
      input: (value) => (value ? value / 100 : 0), // 存储值 1000 → 显示 10
      output: (value) => (value ? value * 100 : 0), // 输入 10 → 存储 1000
    },
  },
];
```

### 15.13 快捷组件语法

```tsx
const schemas = [
  { name: 'pwd', label: '密码', component: 'Password' }, // 快捷组件
  { name: 'gender', label: '性别', component: 'MaleFemale' }, // 快捷组件
  { name: 'status', label: '状态', component: 'Status' }, // 快捷组件
  { name: 'price', label: '单价', component: '${InputNumber}元' }, // 数字输入 + "元" 后缀
  { name: 'money', label: '金额', component: '￥${InputNumber}' }, // "￥" 前缀 + 数字输入
];
```

### 15.14 自定义组件 + 只读渲染器

```tsx
import { registerComponent, registerReadonlyRenderer } from '@/pro-components/ProForm';

// 1. 注册编辑态组件
function MyRichText(props) {
  return <textarea {...props} />;
}
registerComponent('RichText', MyRichText);

// 2. 注册只读渲染器
registerReadonlyRenderer('RichText', (value) => <div dangerouslySetInnerHTML={{ __html: value }} />);

// 3. 在 Schema 中使用
const schemas = [{ name: 'content', label: '内容', component: 'RichText' }];
```

### 15.15 扩展上下文（权限 / 审计）

```tsx
import { ProForm, ExtensionContextProvider, useExtension } from '@/pro-components/ProForm';

function App() {
  return (
    <ExtensionContextProvider
      initialExtensions={{
        permission: {
          checkVisible: (fieldName) => userPermissions.has(`form.${fieldName}.view`),
          checkEditable: (fieldName) => userPermissions.has(`form.${fieldName}.edit`),
          permissions: permissionMap,
        },
        audit: {
          log: (action, data) => auditApi.report({ action, ...data }),
          logFieldChange: (name, oldVal, newVal) =>
            auditApi.report({ action: 'fieldChange', field: name, from: oldVal, to: newVal }),
        },
      }}
    >
      <ProForm schemas={schemas} />
    </ExtensionContextProvider>
  );
}

// 在自定义组件内消费扩展
function MyCustomInput() {
  const permission = useExtension<PermissionExtension>('permission');
  const audit = useExtension<AuditExtension>('audit');
  const editable = permission?.checkEditable('fieldName') ?? true;
  // ...
}
```

### 15.16 Provider 绑定组件实例（跨组件访问 instance）

`useProForm()` 返回的 `Provider` 会将 `formStore` / `instance` / `arcoForm` 通过 `ProFormContext` 下发给所有子组件，子组件无需逐层接收 prop 即可通过 `useProFormContext()` 拿到表单实例。适用于「在父组件创建实例、在任意深度的子组件里操作表单」的场景。

```tsx
import { ProForm, useProForm, useProFormContext } from '@/pro-components/ProForm';

// 子组件 A：通过 useProFormContext 拿到 formStore
function SubmitButton() {
  const { formStore } = useProFormContext();
  const handleSubmit = async () => {
    if (!formStore) return;
    const result = await formStore.validateAllFields();
    if (result.valid) {
      console.log('提交：', formStore.getValues());
    }
  };
  return <button onClick={handleSubmit}>提交</button>;
}

// 子组件 B：通过 useProFormContext 拿到完整 context（推荐，与 ProTable 一致）
function ResetButton() {
  const { instance, arcoForm } = useProFormContext();
  const handleReset = () => {
    instance?.resetFields();
    arcoForm?.clearFields();
  };
  return <button onClick={handleReset}>重置</button>;
}

// 子组件 C：跨层级直接读取/修改某字段值
function SyncButton() {
  const { instance } = useProFormContext();
  const handleSync = () => {
    const username = instance?.getFieldValue('username');
    instance?.setFieldValue('nickname', username);
  };
  return <button onClick={handleSync}>同步用户名到昵称</button>;
}

// 父组件：创建实例，用 Provider 下发
function ProviderDemo() {
  const { instance, Provider, bindingProps } = useProForm({
    initialValues: { username: 'admin' },
    onValuesChange: (changed, all) => console.log('变化：', changed, all),
  });

  return (
    <Provider>
      {/* ProForm 自身也接收 form 实例 */}
      <ProForm form={instance} schemas={schemas} showButton={false} />
      {/* 按钮组放在表单外，仍可访问同一实例 */}
      <div style={{ marginTop: 16 }}>
        <SubmitButton />
        <ResetButton />
        <SyncButton />
      </div>
    </Provider>
  );
}
```

**关键点**：

| API                   | 返回                                | 适用场景                                                         |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `useProFormContext()` | `{ formStore, instance, arcoForm }` | 需要完整 context（推荐，与 ProTable 的 useProTableContext 一致） |
| `Provider`            | 包裹子组件                          | 父组件创建实例后下发，子组件任意深度消费                         |

> 注意：`Provider` 必须包裹所有需要访问实例的子组件；脱离 `Provider` 树的组件调用 `useProFormContext()` 会得到 `null`。

**对比受控写法**：14.3 的 `<ProForm form={form} />` 是把实例通过 prop 传给 `ProForm` 内部；而 `Provider` 的价值在于让 `ProForm` **之外**的兄弟/子组件也能共享同一实例，无需手动把 `form` 逐层传下去。

### 15.17 动态字段添加/删除

```tsx
import { useState } from 'react';
import { ProForm } from '@/pro-components/ProForm';

function DynamicFieldsForm() {
  const [fieldCount, setFieldCount] = useState(2);

  const schemas = [
    { name: 'mainField', label: '主字段', component: 'Input', required: true },
    ...Array.from({ length: fieldCount }, (_, i) => ({
      name: `dynamic_${i}`,
      label: `动态字段 ${i + 1}`,
      component: 'Input',
      placeholder: `请输入动态字段 ${i + 1}`,
    })),
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => setFieldCount((prev) => Math.max(1, prev - 1))}>减少字段</button>
        <button onClick={() => setFieldCount((prev) => Math.min(5, prev + 1))}>添加字段</button>
      </div>
      <ProForm schemas={schemas} showButton onFinish={(values) => console.log('提交:', values)} />
    </div>
  );
}
```

### 15.18 表单联动进阶（级联选择）

```tsx
const schemas = [
  {
    name: 'country',
    label: '国家',
    component: 'Select',
    required: true,
    options: countryOptions,
    reactions: [
      {
        dependencies: ['country'],
        run: (field, form) => {
          const country = form.getValue('country');
          form.setValue('province', undefined);
          form.setValue('city', undefined);
          form.setValue('district', undefined);
          field.schema.options = country ? provinceOptions[country] || [] : [];
        },
      },
    ],
  },
  {
    name: 'province',
    label: '省份',
    component: 'Select',
    dependencies: ['country'],
    reactions: [
      {
        dependencies: ['province'],
        run: (field, form) => {
          const country = form.getValue('country');
          const province = form.getValue('province');
          form.setValue('city', undefined);
          form.setValue('district', undefined);
          field.schema.options = country && province ? cityOptions[country][province] || [] : [];
        },
      },
    ],
  },
  {
    name: 'city',
    label: '城市',
    component: 'Select',
    dependencies: ['province'],
    reactions: [
      {
        dependencies: ['city'],
        run: (field, form) => {
          const country = form.getValue('country');
          const province = form.getValue('province');
          const city = form.getValue('city');
          form.setValue('district', undefined);
          field.schema.options = country && province && city ? districtOptions[country][province][city] || [] : [];
        },
      },
    ],
  },
  {
    name: 'district',
    label: '区县',
    component: 'Select',
    dependencies: ['city'],
  },
];
```

### 15.19 自定义验证规则（正则 + 异步）

```tsx
const schemas = [
  {
    name: 'username',
    label: '用户名',
    component: 'Input',
    required: true,
    rules: [
      { minLength: 3, maxLength: 20, message: '用户名长度需在 3-20 之间' },
      {
        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: '用户名必须以字母开头，只能包含字母、数字和下划线',
      },
      {
        validator: async (value) => {
          if (!value) return;
          const exists = await api.checkUsernameExists(value);
          return exists ? '该用户名已被注册' : undefined;
        },
      },
    ],
  },
  {
    name: 'phone',
    label: '手机号',
    component: 'Phone',
    rules: [
      {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入有效的手机号',
      },
    ],
  },
  {
    name: 'password',
    label: '密码',
    component: 'Password',
    required: true,
    rules: [
      { minLength: 6, message: '密码长度至少 6 位' },
      {
        validator: (value) => {
          if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
            return '密码必须包含字母和数字';
          }
          return undefined;
        },
      },
    ],
  },
  {
    name: 'confirmPassword',
    label: '确认密码',
    component: 'Password',
    required: true,
    dependencies: ['password'],
    rules: [
      {
        validator: (value, form) => {
          const password = form.getValue('password');
          return value !== password ? '两次输入的密码不一致' : undefined;
        },
      },
    ],
  },
];
```

### 15.20 响应式布局

```tsx
<ProForm
  schemas={schemas}
  layout='horizontal'
  columns={3}
  gutter={16}
  responsive={{
    xs: 1, // 超小屏（< 576px）：1 列
    sm: 2, // 小屏（≥ 576px）：2 列
    md: 2, // 中屏（≥ 768px）：2 列
    lg: 3, // 大屏（≥ 992px）：3 列
    xl: 4, // 超大屏（≥ 1200px）：4 列
  }}
/>
```

### 15.21 表单数据转换（transform）

```tsx
const schemas = [
  {
    name: 'amount',
    label: '金额（元）',
    component: 'InputNumber',
    transform: {
      input: (value) => (value ? value / 100 : 0), // 存储值（分）→ 显示值（元）
      output: (value) => (value ? value * 100 : 0), // 输入值（元）→ 存储值（分）
    },
  },
  {
    name: 'dateRange',
    label: '日期范围',
    component: 'DatePicker.RangePicker',
    transform: {
      input: (value) => {
        if (Array.isArray(value)) {
          return value.map((v) => dayjs(v).format('YYYY-MM-DD'));
        }
        return value;
      },
      output: (value) => {
        if (Array.isArray(value)) {
          return value.map((v) => dayjs(v).toISOString());
        }
        return value;
      },
    },
  },
];
```

### 15.22 表单性能优化进阶

```tsx
const largeSchemas = Array.from({ length: 100 }, (_, i) => ({
  name: `field_${i}`,
  label: `字段 ${i}`,
  component: 'Input',
}));

<ProForm
  schemas={largeSchemas}
  performance={{
    virtualScroll: {
      enabled: true,
      itemHeight: 60,
      overscan: 5,
      containerHeight: 500,
    },
    lazyLoad: {
      enabled: true,
      highPriorityFields: ['field_0', 'field_1', 'field_2'],
      mediumPriorityFields: ['field_3', 'field_4', 'field_5', 'field_6'],
      mediumPriorityDelay: 200,
      lowPriorityDelay: 500,
    },
    batchUpdate: {
      enabled: true,
      delay: 16,
    },
  }}
/>;
```

### 15.23 自定义组件深度集成

```tsx
import { registerComponent, registerReadonlyRenderer } from '@/pro-components/ProForm';

// 自定义组件
interface ColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {colors.map((color) => (
        <button
          key={color}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: color,
            border: value === color ? '2px solid #1d2129' : '2px solid transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
          onClick={() => !disabled && onChange?.(color)}
          disabled={disabled}
        />
      ))}
      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: value }} />
          <span style={{ fontSize: 12, color: '#86909c' }}>{value}</span>
        </div>
      )}
    </div>
  );
}

// 注册编辑态组件
registerComponent('ColorPicker', ColorPicker);

// 注册只读渲染器
registerReadonlyRenderer('ColorPicker', (value) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: value || '#ccc',
        border: '1px solid #e5e6eb',
      }}
    />
    <span style={{ fontSize: 12, color: '#4e5969' }}>{value}</span>
  </div>
));

// 在 Schema 中使用
const schemas = [
  { name: 'primaryColor', label: '主色调', component: 'ColorPicker' },
  { name: 'secondaryColor', label: '辅助色', component: 'ColorPicker' },
];
```

### 15.24 表单校验状态自定义

```tsx
const schemas = [
  {
    name: 'email',
    label: '邮箱',
    component: 'Input',
    rules: [{ type: 'email', message: '请输入有效的邮箱地址' }],
    // 自定义校验状态样式
    statusConfig: {
      error: {
        borderColor: '#f53f3f',
        backgroundColor: '#fff2f0',
      },
      warning: {
        borderColor: '#ff7d00',
        backgroundColor: '#fffbe6',
      },
      success: {
        borderColor: '#00b42a',
        backgroundColor: '#f6ffed',
      },
    },
  },
];
```

### 15.25 表单数据持久化

```tsx
import { useEffect, useState } from 'react';
import { ProForm, useProForm } from '@/pro-components/ProForm';

function PersistentForm() {
  const { instance } = useProForm();
  const STORAGE_KEY = 'my_form_data';

  // 加载保存的数据
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        instance.setFieldsValue(data);
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
  }, [instance]);

  // 监听数据变化并保存
  useEffect(() => {
    const subscription = instance.subscribe((values) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [instance]);

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    instance.resetFields();
  };

  return (
    <div>
      <button onClick={handleClear} style={{ marginBottom: 16, color: '#86909c' }}>
        清除保存的表单数据
      </button>
      <ProForm form={instance} schemas={schemas} showButton />
    </div>
  );
}
```

### 15.26 表单状态监听与订阅

```tsx
import { ProForm, useProForm } from '@/pro-components/ProForm';

function FormWithSubscription() {
  const { instance } = useProForm({ initialValues: { name: '' } });

  // 订阅表单值变化
  useEffect(() => {
    const unsubscribe = instance.subscribe((values) => {
      console.log('表单值变化:', values);
    });
    return unsubscribe;
  }, [instance]);

  // 订阅特定字段变化
  useEffect(() => {
    const unsubscribe = instance.subscribeField('name', (value, oldValue) => {
      console.log('name 变化:', oldValue, '→', value);
    });
    return unsubscribe;
  }, [instance]);

  return <ProForm form={instance} schemas={schemas} />;
}
```

### 15.27 条件表单（根据外部状态动态切换）

```tsx
import { useState } from 'react';
import { ProForm } from '@/pro-components/ProForm';

function ConditionalForm() {
  const [formType, setFormType] = useState<'basic' | 'advanced'>('basic');

  const basicSchemas = [
    { name: 'name', label: '姓名', component: 'Input', required: true },
    { name: 'email', label: '邮箱', component: 'Email' },
  ];

  const advancedSchemas = [
    ...basicSchemas,
    { name: 'address', label: '地址', component: 'TextArea' },
    { name: 'phone', label: '电话', component: 'Phone' },
    { name: 'company', label: '公司', component: 'Input' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setFormType('basic')}>基本信息</button>
        <button onClick={() => setFormType('advanced')}>高级信息</button>
      </div>
      <ProForm schemas={formType === 'basic' ? basicSchemas : advancedSchemas} showButton />
    </div>
  );
}
```

### 15.28 表单重置策略

```tsx
import { ProForm, useProForm } from '@/pro-components/ProForm';

function ResetStrategyForm() {
  const { instance } = useProForm({
    initialValues: {
      name: '默认姓名',
      email: '',
      age: 18,
    },
  });

  const handleResetAll = () => {
    instance.resetFields();
  };

  const handleResetPartial = () => {
    instance.resetFields(['email', 'age']);
  };

  const handleResetToCustom = () => {
    instance.setFieldsValue({
      name: '重置后的姓名',
      email: '',
      age: 20,
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={handleResetAll}>重置全部</button>
        <button onClick={handleResetPartial}>重置部分字段</button>
        <button onClick={handleResetToCustom}>重置为自定义值</button>
      </div>
      <ProForm form={instance} schemas={schemas} showButton />
    </div>
  );
}
```

### 15.29 表单验证触发时机

```tsx
<ProForm
  schemas={schemas}
  showButton
  validateTrigger={{
    onChange: true, // 值变化时验证
    onBlur: true, // 失去焦点时验证
    onFocus: false, // 获得焦点时不验证
  }}
  onFinish={(values) => console.log('提交:', values)}
  onFinishFailed={(errorInfo) => console.log('验证失败:', errorInfo)}
/>
```

### 15.30 表单数据格式化与转换

```tsx
const schemas = [
  {
    name: 'date',
    label: '日期',
    component: 'DatePicker',
    format: 'YYYY-MM-DD',
  },
  {
    name: 'datetime',
    label: '日期时间',
    component: 'DatePicker',
    showTime: true,
    format: 'YYYY-MM-DD HH:mm:ss',
  },
  {
    name: 'number',
    label: '数字',
    component: 'InputNumber',
    formatter: (value) => `¥ ${value}`,
    parser: (value) => value.replace(/¥\s?/, ''),
  },
  {
    name: 'percent',
    label: '百分比',
    component: 'InputNumber',
    formatter: (value) => `${value}%`,
    parser: (value) => value.replace('%', ''),
  },
];
```
