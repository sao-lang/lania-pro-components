# ProFormList / ProFormSteps 增强：不受控重构 + 命令式 API 扩展

## Context

`ProFormList` 和 `ProFormSteps` 是 ProForm 的高级布局组件。当前存在两个核心问题：

1. **ProFormList 受控失效（最关键）**：[ProFormList.tsx:61-64](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/components/ProFormList.tsx#L61-L64) 通过 `store?.getValue(name)` 读取行列表，`useMemo` 依赖 `[store, name, initialValue]` 均为稳定引用，**永远不重新计算**——增删行后无法可靠触发重渲染，行为脆弱。用户明确要求"ProFormList 不能受控"：行数组应由组件内部 state 主导，store 只做单向同步（双向同步不可行，缺少 value/onChange 机制）。
2. **API 不足**：两个组件都缺少复制/移动/清空等常用操作、命令式 ref 方法、自定义渲染能力。ProFormSteps 缺少 `reset`/`validateStep`/`submit` 等方法。

预期结果：ProFormList 改为内部 state 主导 + 单向同步 store（保留 ProForm 集成，`getFieldsValue`/`onValuesChange` 仍工作）；两个组件补齐完整命令式 ref 套件与常用 props；README 同步更新。

## 设计决策

### ProFormList 不受控语义（已与用户确认）
- **内部 `useState<unknown[]>` 是行数组的唯一真相源**
- 挂载时一次性从 `store.getValue(name)` 读取初始值（兼容 ProForm `initialValues` 注入），否则用 `initialValue` prop
- 此后**永不**从 store 读行列表；所有变更（add/remove/copy/move/clear）更新内部 state 并单向 `store.setValue(name, newArr)` + 触发 `onValuesChange` + `onChange` 通知
- **不引入 `value` 受控 prop**（与"不能受控"一致）；`onChange` 仅作通知回调
- 仍依赖 ProForm 上下文（用户未选"完全独立"方案），但所有 `store`/`arcoForm` 访问保持可选守卫

### 行 key 稳定化
当前行以数组 `index` 为 React key，增删/移动会导致不必要的 FieldNode 重挂载与值丢失。改为内部维护稳定自增 `id` 作为 key（FieldNode 的 `schema.name` 仍按 `name[index].field` 标准数组命名，不变），使 React 在 reorder 时复用组件实例而非重挂载。

## 实施步骤

### 1. 扩展类型定义 — [components/types.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/components/types.ts)

**ProFormListProps 新增字段：**
- `copyText?: string` / `showCopyButton?: boolean` — 复制按钮
- `moveUpText?: string` / `moveDownText?: string` / `showMoveButtons?: boolean` — 上移/下移
- `clearText?: string` / `showClearButton?: boolean` — 清空
- `creatorRecord?: Record<string, unknown>` — 新增行默认记录（替代空 `{}`）
- `onCopy?: (index: number) => void` / `onMove?: (from: number, to: number) => void` / `onClear?: () => void`
- `onChange?: (value: unknown[]) => void` — 行变更通知（非受控）
- `itemRender?: (item: React.ReactNode, index: number, actions: ProFormListActions) => React.ReactNode`
- `emptyText?: React.ReactNode` / `className?: string` / `style?: React.CSSProperties`

**新增接口：**
```typescript
export interface ProFormListActions {
  add: (record?: Record<string, unknown>) => void;
  remove: (index: number) => void;
  copy: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  move: (from: number, to: number) => void;
  clear: () => void;
}
export interface ProFormListInstance extends ProFormListActions {
  getList: () => unknown[];
  getLength: () => number;
}
```

**ProFormStepsProps 新增：** `onFinish?` / `showResetButton?` / `resetText?` / `onReset?` / `className?` / `style?`

**ProFormStepsInstance 新增：** `getStep` / `getSteps` / `validateStep` / `reset` / `submit`（`next` 返回类型改为 `Promise<void>`）

### 2. 重构 ProFormList — [components/ProFormList.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/components/ProFormList.tsx)

- 改为 `forwardRef<ProFormListInstance, ProFormListProps>`
- 用 `useState<unknown[]>` 替换从 store 读取的 `listValue`；初始化函数一次性读取 `store?.getValue(name)`
- 用 `useRef<number>` 维护稳定 row id 自增器；行数据结构改为 `{ id: number, data: unknown }` 内部包装，渲染时用 `item.id` 作 key、`index` 作数组命名
- 抽出统一的 `syncToList(newArr)` 工具：`setList` + `store?.setValue(name, newArr)` + `onValuesChange` + `onChange`
- 实现 `add/remove/copy/move/moveUp/moveDown/clear`，均走 `syncToList`，并触发对应回调（`onAdd/onRemove/onCopy/onMove/onClear`）
- 边界：`add`/`copy` 受 `max` 限制、`remove`/`clear` 受 `min` 限制、`moveUp(0)`/`moveDown(last)` 为 no-op
- `useImperativeHandle` 暴露 `ProFormListInstance`
- 渲染：保留 `card` 模式与默认边框模式；新增 `emptyText` 空列表占位；`itemRender` 可覆盖单项渲染（传入 `actions` 供自定义按钮）；复制/移动/清空按钮在非 `readonly` 时按开关显示
- 字段名生成逻辑保持不变：`${name}[${index}].${schema.name}`

### 3. 扩展 ProFormSteps — [components/ProFormSteps.tsx](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/components/ProFormSteps.tsx)

- `useImperativeHandle` 补齐：`getStep(i)` / `getSteps()` / `validateStep(i?)`（返回 `Promise<boolean>`，复用现有 `store.getField().validate()` 逻辑）/ `reset()`（回到 0 并清当前步校验）/ `submit()`（触发 `onFinish`）
- `next` 在最后一步时调用 `submit`（而非仅靠 submit 按钮）
- `renderButtons` 增加 `showResetButton` 分支（调 `reset` + `onReset`）
- 透传 `className`/`style` 到根 div

### 4. 更新导出 — [components/index.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/components/index.ts) 与 [ProForm/index.ts](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/index.ts)

- `components/index.ts`：`export type { ProFormListInstance, ProFormListActions }`
- `ProForm/index.ts`：在高级组件导出块补上这两个类型

### 5. 更新 README — [ProForm/README.md](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/README.md)

- 13.3 / 15.8 ProFormList：Props 表补全新字段；新增"不受控行为说明"（内部 state 主导，单向同步 store）与 `ProFormListInstance` 接口表
- 13.4 / 15.9 ProFormSteps：Props 表补全新字段；`ProFormStepsInstance` 接口补齐新方法

## 关键复用点

- `useProFormContext()` / `useRootContext()` — 获取 `store`、`arcoForm`、`onValuesChange`（[useProForm.tsx:13](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/useProForm.tsx#L13)、[RootContext.tsx:95](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/context/RootContext.tsx#L95)）
- `FormField` — 行内字段渲染（[FormField.tsx:495](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/components/FormField.tsx#L495)），保持现有 schema 透传方式
- `store.setValue` / `store.getValues` — [FormStore.ts:165](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/core/FormStore.ts#L165)
- ProFormSteps 现有 `forwardRef` + 工厂模式（[ProFormSteps.tsx:36](file:///e:/vsc-workspace/lania-zip/lania-pro-components/packages/components/ProForm/components/ProFormSteps.tsx#L36)）— ProFormList 沿用相同模式保持一致

## 验证

1. **类型检查**：`pnpm --filter @lania-pro-components/pro-components build` 或 `tsc --noEmit`，确认无类型错误
2. **ProFormList 不受控行为**：编写临时 demo，验证
   - 增删行后 UI 立即更新（旧实现会卡）
   - `form.getFieldsValue()` 仍能拿到 `name` 数组
   - `onValuesChange` 在增删时触发
   - `min`/`max` 边界按钮禁用正确
   - ref 调用 `add/remove/copy/move/moveUp/moveDown/clear/getList/getLength` 全部生效
3. **ProFormSteps**：验证 `validateStep` 阻断下一步、`reset` 回首步、`submit` 触发 `onFinish`、`getSteps/getStep` 返回正确
4. **README**：检查表格与接口定义与代码一致
