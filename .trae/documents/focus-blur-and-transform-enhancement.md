# 实现计划：useFieldNavigation 自定义 focus/blur 配置 + transform 签名修正

## Context

用户提出两个需求：

1. **自定义 focus/blur 行为**：当前 `useFieldNavigation`（shared）只接受全局 `onFocus`/`onBlur` 回调，`ProFormSchema` 没有字段级导航配置。用户希望：
   - `useFieldNavigation` 支持按字段自定义 focus/blur 行为
   - `ProFormSchema` 和 `ProFormProps` 都能配置导航参数与 focus/blur 回调
   - Schema 层配置优先级高于 Props 层

2. **transform 签名修正**：当前 `transform.input/output` 接收单个字段值 `(value: unknown)`，但实际使用场景需要访问整个表单值（如跨字段计算）。用户要求将参数改为 `values`（整个表单值），并同步修改调用方。

## 现状分析

### Focus/Blur 链路
```
useFieldNavigation (shared)
  → onFocus(id) / onBlur(id)         [全局回调]
    → ProForm 适配器 (hooks/useFieldNavigation.ts)
      → onFocusField(name) / onBlurField(name)
        → useProForm.tsx 硬编码:
            field.setFocus()  → FieldNode.setFocus() → lifecycle.onFocus
            field.removeFocus() → FieldNode.removeFocus() → lifecycle.onBlur
```

- `FieldLifecycle` 已有 `onFocus`/`onBlur`（接收 `(field, form)`），但那是**字段层**生命周期
- `useFieldNavigation`（shared）的 `onFocus`/`onBlur` 是**导航层**回调，目前只支持全局
- `ProFormSchema` 没有 `keyboardNavigation` 配置
- `ProFormProps` 有 `keyboardNavigation?: KeyboardNavigationConfig`，但没有 `onFieldFocus`/`onFieldBlur` 回调

### Transform 链路
```
FieldNode.setValue(newValue)
  → transform.output(newValue)        [传入单个字段值]
FieldNode.getValue()
  → transform.input(result)           [传入单个字段值]
```

- `ProFormSchema.transform`（types.ts:290-293）和 `ProFormProps.transform`（types.ts:485-488）签名均为 `(value: unknown) => unknown`
- `ProForm.tsx:178-179` 将全局 transform 合并到 schema（schema 层可覆盖）
- `FieldNode` 有 `this.store.getValues()` 可获取全部表单值（已在 computed behavior 中使用）

---

## 实现方案

### 第一部分：Transform 签名修正

#### 1. 修改类型定义 — `packages/components/ProForm/types.ts`

**ProFormSchema（~L290）**:
```ts
// Before
transform?: {
  input?: (value: unknown) => unknown;
  output?: (value: unknown) => unknown;
};
// After
transform?: {
  input?: (values: Record<string, unknown>) => unknown;
  output?: (values: Record<string, unknown>) => unknown;
};
```

**ProFormProps（~L485）**: 同上修改。

#### 2. 修改 FieldNode 调用 — `packages/components/ProForm/core/FieldNode.ts`

**setValue（~L185-186）**:
```ts
// Before
if (this.schema.transform?.output) {
  transformedValue = this.schema.transform.output(newValue);
}
// After — 将新值合并进表单值，使 transform 可跨字段访问
if (this.schema.transform?.output) {
  const allValues = { ...this.store.getValues(), [fieldName]: newValue };
  transformedValue = this.schema.transform.output(allValues);
}
```

**getValue（~L206-207）**:
```ts
// Before
if (this.schema.transform?.input) {
  result = this.schema.transform.input(result);
}
// After — 传入整个表单值（已包含当前字段值）
if (this.schema.transform?.input) {
  result = this.schema.transform.input(this.store.getValues());
}
```

#### 3. 更新文档 — `packages/components/ProForm/README.md`

更新 L278、L549-550、L559-560 处的 transform 说明与代码示例。

---

### 第二部分：自定义 Focus/Blur 配置

#### 1. 扩展 shared `useFieldNavigation` — `packages/shared/src/hooks/useFieldNavigation.ts`

**扩展 `FocusableItem`**:
```ts
export interface FocusableItem {
  id: string | string[];
  /** 字段级 focus 回调（优先于全局 onFocus） */
  onFocus?: (id: string) => void;
  /** 字段级 blur 回调（优先于全局 onBlur） */
  onBlur?: (id: string) => void;
}
```

**修改 `registerFieldFocus`/`registerFieldBlur`**:
- 查找当前 id 对应的 FocusableItem
- 若 item 有自己的 `onFocus`/`onBlur`，调用它；否则调用全局 `onFocus`/`onBlur`

#### 2. 扩展 ProFormSchema — `packages/components/ProForm/types.ts`

```ts
export interface ProFormSchema {
  // ... 现有字段
  /** 字段级键盘导航配置（覆盖全局 keyboardNavigation） */
  keyboardNavigation?: KeyboardNavigationConfig & {
    /** 字段级 focus 回调（覆盖全局 onFieldFocus） */
    onFocus?: (name: string) => void;
    /** 字段级 blur 回调（覆盖全局 onFieldBlur） */
    onBlur?: (name: string) => void;
  };
}
```

#### 3. 扩展 ProFormProps — `packages/components/ProForm/types.ts`

```ts
export interface ProFormProps {
  // ... 现有字段
  /** 全局字段聚焦回调 */
  onFieldFocus?: (name: string) => void;
  /** 全局字段失焦回调 */
  onFieldBlur?: (name: string) => void;
}
```

#### 4. 修改 ProForm 适配器 — `packages/components/ProForm/hooks/useFieldNavigation.ts`

将 schema 中的 `keyboardNavigation.onFocus`/`onBlur` 透传为 FocusableItem 的 per-item 回调：

```ts
interface FieldNavigationOptions {
  schemas: Array<{ name: string | string[]; keyboardNavigation?: { onFocus?: ...; onBlur?: ... } }>;
  getRef: (name: string) => unknown;
  keyboardNavigation?: KeyboardNavigationConfig;  // 全局
  onFocusField?: (name: string) => void;  // 全局 fallback
  onBlurField?: (name: string) => void;   // 全局 fallback
}

// 透传 per-item 回调
items: schemas.map((schema) => ({
  id: schema.name,
  onFocus: schema.keyboardNavigation?.onFocus,
  onBlur: schema.keyboardNavigation?.onBlur,
})),
```

#### 5. 修改 useProForm — `packages/components/ProForm/useProForm.tsx`

- 从 options 解构 `onFieldFocus`/`onFieldBlur`
- 将它们作为全局 fallback 传入适配器的 `onFocusField`/`onBlurField`
- 全局 fallback 内部仍调用 `field.setFocus()`/`field.removeFocus()`（保持字段内部状态同步）
- 将 `onFieldFocus`/`onFieldBlur` 加入 `bindingProps` 依赖列表

**优先级逻辑**（自定义回调择一调用 + 默认行为始终执行）：
1. **自定义回调择一**：Schema `keyboardNavigation.onFocus` > Props `onFieldFocus`（只有优先级最高的自定义回调被调用）
2. **默认行为始终执行**：`field.setFocus()` / `field.removeFocus()` 始终调用，保证字段内部 `_focused` 状态与 `lifecycle.onFocus/onBlur` 正常触发

即：`field.setFocus()` 总是执行 → 然后执行优先级最高的自定义回调（schema 层 > props 层）

#### 6. 修改 ProForm.tsx — 合并 schema 级与 props 级 keyboardNavigation

在 `mergedSchemas` 的 useMemo 中（~L168-193），增加 schema 级 keyboardNavigation 与 props 级的合并逻辑：
- Schema 有自己的 `keyboardNavigation` 时，与全局 `keyboardNavigation` 浅合并（schema 字段优先）

---

## 涉及文件清单

| 文件 | 改动 |
|------|------|
| `packages/shared/src/hooks/useFieldNavigation.ts` | 扩展 FocusableItem，修改 register 回调逻辑 |
| `packages/components/ProForm/types.ts` | transform 签名、ProFormSchema.keyboardNavigation、ProFormProps.onFieldFocus/onFieldBlur |
| `packages/components/ProForm/core/FieldNode.ts` | transform.input/output 调用改为传 values |
| `packages/components/ProForm/hooks/useFieldNavigation.ts` | 透传 per-item onFocus/onBlur |
| `packages/components/ProForm/useProForm.tsx` | 解构 onFieldFocus/onFieldBlur，传入适配器 |
| `packages/components/ProForm/ProForm.tsx` | 合并 schema 级 keyboardNavigation |
| `packages/components/ProForm/README.md` | 更新 transform 文档 |

## 验证方式

1. `npx tsc --noEmit -p tsconfig.json` — 确认无类型错误（shared + components）
2. transform 验证：在 schema 中配置 `transform.input = (values) => values.price * values.rate`，确认 getValue 返回计算值
3. focus/blur 验证：在 schema 中配置 `keyboardNavigation.onFocus`，确认该字段聚焦时触发自定义回调而非全局回调
