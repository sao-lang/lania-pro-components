# 修复 _effectiveStatus 的依赖更新逻辑

## Context

在 `9d76745`（behavior → status pipeline 重构）之前，`FormStore.setupFieldValueWatch` 中的依赖 watch 回调会调用 `field.updateComputedBehavior()` 手动触发状态更新。重构后删除了 `updateComputedBehavior` / `updateStatusFromBehavior`，改为 `_effectiveStatus` computed + watch 同步到 `_status`，但 watch 回调被清空了（只留了注释"computed 会自动追踪并重算"），**实际上 computed 并不能可靠地自动追踪依赖**。

### 根本原因

`reactive.ts` 的缓存逻辑有 bug：`targetMap.has(target) ? target : new Proxy(target)`。`targetMap` 在 `getDep()` 中被设置（属性被访问时），所以 `targetMap.has(valuesObj)` 为 true 不代表 valuesObj 是 Proxy，只代表它被访问过。第二次访问 `this.state.values` 时返回的是**原始对象**，展开后不触发依赖收集。

导致 `getValues()` 返回的 `{ ...this.state.values }` 在 computed 第二次执行后就**丢失了对 values 属性的依赖追踪**。所以 `_effectiveStatus` computed 在第一次依赖变化后就失效了。

### 期望逻辑（用户明确）

- 有 `dependencies`：依赖字段值变化 → 更新 `_effectiveStatus`
- 无 `dependencies`：自身值变化 → 更新 `_effectiveStatus`

## 修改方案

核心思路：不依赖 computed 的自动追踪（因 reactive bug 不可靠），改为通过 FormStore 中的 watch **手动触发**重算。

### 1. `FieldNode.ts` — 提取计算逻辑 + 添加手动刷新方法

**a. 提取 `computeEffectiveStatus()` 私有方法**

把 `_effectiveStatus` computed 的内联 getter 逻辑（行 71-93）提取为独立方法，使外部可手动调用。

**b. computed 内部改为调用 `this.computeEffectiveStatus()`**

保留 computed 用于 `formConstraints` 变化时的自动追踪（formConstraints 不经过浅拷贝，依赖追踪正常）。

**c. 添加 `refreshEffectiveStatus()` 公开方法**

直接调用 `computeEffectiveStatus()` 并 `setStatus()`，**不读 computed 缓存**（避免 reactive bug 导致拿到旧值）。

### 2. `types.ts` — 扩展 `FieldNodeAPI` 接口

添加 `refreshEffectiveStatus: () => void`。

### 3. `FormStore.ts` — 修复 `setupFieldValueWatch` 回调

修改 [FormStore.ts#L215-L251](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/core/FormStore.ts#L215-L251)：

- **自身值变化的 watch**：保留 `runReactions(fieldName)`；无 `dependencies` 时额外调用 `field.refreshEffectiveStatus()`
- **依赖字段变化的 watch**：回调从空改为调用 `field.refreshEffectiveStatus()`

## 关键文件

- [FieldNode.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/core/FieldNode.ts) — 提取方法 + 添加 refreshEffectiveStatus
- [FormStore.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/core/FormStore.ts) — 修复 watch 回调
- [types.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/types.ts) — 扩展接口

## 不修改的部分

- **`reactive.ts`**：根本修复需要加 `reactiveMap: WeakMap<object, Proxy>` 缓存。但这是底层修改，影响面大，建议作为后续独立优化。当前方案通过手动刷新绕过 bug，更安全。
- **`_resolvedSchema` / `_computedRequired`**：同样调用 `store.getValues()`，存在相同问题。但 `_resolvedSchema` 已有 watch 同步机制，`_computedRequired` 只在 `validate()` 中即时访问。可后续用相同模式修复（添加 `refreshResolvedSchema` 等），当前不扩展。

## 验证方式

1. 配置一个字段 `behavior: (values) => values.other ? 'readonly' : 'edit'`，声明 `dependencies: ['other']`
2. 多次（>2 次）切换 `other` 字段的值，验证目标字段的 `status` 能否正确在 `readonly` / `edit` 间切换
3. 配置一个无 `dependencies` 的字段 `behavior: (values) => values.self > 10 ? 'disabled' : 'edit'`，多次修改自身值，验证 `status` 能否正确更新
4. 验证 `formConstraints`（preview/readonly/disabled）变化时，字段状态仍能正常更新（走 computed 的自动追踪）
