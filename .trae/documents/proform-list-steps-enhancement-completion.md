# ProFormList / ProFormSteps 增强收尾计划

## Summary

对 `ProFormList`（动态列表）与 `ProFormSteps`（分步表单）两个高级组件进行 props 扩展、命令式方法导出与不受控重构的**收尾工作**。核心代码（types 定义、ProFormList 不受控重构、ProFormSteps 方法扩展）已在前期完成并写入磁盘，本次只需完成**导出补齐、README 同步、import 清理与类型校验**。

用户最关键的要求：**ProFormList 不能受控**——行数组由内部 state 主导，单向同步到 store，不接受 `value` 受控 prop。该行为已在 `ProFormList.tsx` 中实现，本计划不再改动其运行时逻辑。

## Current State Analysis（基于 Phase 1 实际读取）

### 已完成（无需改动）
| 文件 | 状态 | 说明 |
| --- | --- | --- |
| `components/types.ts` | ✅ 完成 | 已定义 `ProFormListActions`、`ProFormListInstance`、`ProFormStepsInstance`（含 `validateStep/reset/submit/getStep/getSteps`）；`ProFormListProps` 扩展 16 字段；`ProFormStepsProps` 扩展 6 字段 |
| `components/ProFormList.tsx` | ✅ 完成 | `forwardRef` + 内部 `useState` 主导行数组；`applyChange` 单向同步 store；实现 `add/remove/copy/move/moveUp/moveDown/clear`；`useImperativeHandle` 暴露 `ProFormListInstance`；index 作 key（FormField 按 name 复用 FieldNode，位置语义正确） |
| `components/ProFormSteps.tsx` | ✅ 完成（待清理 import） | `forwardRef` 直接导出；`innerFormRef` 访问内嵌 ProForm 实例；`validateStep/submit/reset` 使用内嵌 store；`handleNext` 最后一步调 `submit`；`renderButtons` 增加 `showResetButton` |

### 待完成（本计划范围）
| 位置 | 问题 |
| --- | --- |
| `components/ProFormSteps.tsx:32` | `FC` 被 import 但未使用（ProFormList 已移除，保持一致） |
| `components/index.ts:23` | 仅导出 `ProFormListProps, ProFormStepsProps, ProFormStepSchema, ProFormStepsInstance`，缺 `ProFormListInstance, ProFormListActions` |
| `ProForm/index.ts:112` | 同上，缺 `ProFormListInstance, ProFormListActions` |
| `README.md` 13.3 / 13.4 | Props 表为旧版（缺 copy/move/clear/creatorRecord/itemRender/emptyText 等新字段；ProFormSteps 缺 onFinish/showResetButton/resetText/onReset/className/style）；ProFormList 缺不受控说明；实例接口表过时 |
| `README.md` 15.8 / 15.9 | 同 13.3/13.4，内容重复但同样过时；15.8 示例可补 ref 命令式调用 |
| 类型校验 | 尚未运行 `pnpm typecheck` 验证整体类型一致 |

### 已验证的复用点（无需再查）
- `ProFormInstance`（`types.ts:703-764`）含 `store` / `getFieldsValue` / `clearValidate` —— ProFormSteps 的 `innerFormRef.current?.store`、`getFieldsValue()`、`clearValidate()` 调用合法
- `FormStore` 含 `getField` —— ProFormSteps `validateStep` 中 `store.getField(fName)` 合法
- `FormStore` 含 `getValue` / `setValue` —— ProFormList 的 `readRowValues` / `writeRowValues` 合法

## Proposed Changes

### Step 1：清理 ProFormSteps 未使用 import
**文件**：`packages/components/ProForm/components/ProFormSteps.tsx`
**位置**：第 32 行
**改法**：从 import 中移除 `FC`（ProFormList.tsx:41 已是同样写法，保持一致）

```diff
- import React, { FC, useState, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
+ import React, { useState, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
```

**原因**：`FC` 在重写后已无使用；eslint 会告警未使用 import；与 ProFormList 保持一致。

### Step 2：补齐 components/index.ts 导出
**文件**：`packages/components/ProForm/components/index.ts`
**位置**：第 23 行
**改法**：在 type 导出行追加 `ProFormListInstance, ProFormListActions`

```diff
- export type { ProFormListProps, ProFormStepsProps, ProFormStepSchema, ProFormStepsInstance } from './types';
+ export type { ProFormListProps, ProFormListInstance, ProFormListActions, ProFormStepsProps, ProFormStepSchema, ProFormStepsInstance } from './types';
```

### Step 3：补齐 ProForm/index.ts 导出
**文件**：`packages/components/ProForm/index.ts`
**位置**：第 112 行
**改法**：与 Step 2 同步，追加两个类型

```diff
- export type { ProFormListProps, ProFormStepsProps, ProFormStepSchema, ProFormStepsInstance } from './components';
+ export type { ProFormListProps, ProFormListInstance, ProFormListActions, ProFormStepsProps, ProFormStepSchema, ProFormStepsInstance } from './components';
```

### Step 4：同步更新 README 13.3 ProFormList
**文件**：`packages/components/ProForm/README.md`
**位置**：1402-1438 行（13.3 节）
**改法**：
1. 在"职责"后增加**不受控行为说明**段落（行数组由内部 state 主导，挂载时一次性从 store 读初始值，之后单向同步回 store；不接受 value 受控 prop；onChange 仅作变更通知）
2. 扩充 Props 表，补齐新字段：`copyText`/`showCopyButton`/`moveUpText`/`moveDownText`/`showMoveButtons`/`clearText`/`showClearButton`/`creatorRecord`/`onCopy`/`onMove`/`onClear`/`onChange`/`itemRender`/`emptyText`/`className`/`style`
3. 更新"核心操作"描述：从旧的 `handleAdd/handleRemove` 改为命令式 `add/remove/copy/move/moveUp/moveDown/clear`，说明结构变更时通过 `readRowValues`/`writeRowValues` 重排扁平字段值
4. 新增**实例接口**代码块（`ProFormListInstance extends ProFormListActions` + `getList`/`getLength`，并列出 `ProFormListActions` 全部方法签名）

### Step 5：同步更新 README 13.4 ProFormSteps
**文件**：`packages/components/ProForm/README.md`
**位置**：1440-1490 行（13.4 节）
**改法**：
1. Props 表补齐：`onFinish`/`showResetButton`/`resetText`/`onReset`/`className`/`style`
2. 更新"实例接口"代码块：补 `getStep`/`getSteps`/`validateStep`/`reset`/`submit`，`next` 改为 `() => Promise<void>`
3. 更新"步骤验证逻辑"代码块：改为基于 `innerFormRef.current?.store` 的实现（与实际代码一致），说明最后一步 `handleNext` 触发 `submit`

### Step 6：同步更新 README 15.8 / 15.9
**文件**：`packages/components/ProForm/README.md`
**位置**：2243-2332 行
**改法**：
- 15.8（ProFormList）：Props 表与 13.3 保持一致；示例补 `ref={listRef}` 与 `listRef.current?.add()` 命令式调用演示；补实例接口
- 15.9（ProFormSteps）：Props 表与 13.4 保持一致；更新实例接口与步骤验证逻辑代码块（与 13.4 同步）

> 说明：13.x 是"组件目录"（结构化参考），15.x 是"使用示例"（带代码）。两处都更新以避免文档自相矛盾。

### Step 7：类型校验
**命令**：`pnpm typecheck`（根目录，等价 `pnpm --filter @lania-pro-components/components typecheck`）
**预期**：无类型错误。重点关注：
- ProFormList `forwardRef<ProFormListInstance, ProFormListProps>` 类型签名
- ProFormSteps `forwardRef<ProFormStepsInstance, ProFormStepsProps>` 类型签名
- `useImperativeHandle` 返回值与接口匹配
- 导出类型在新 export 行中解析正常

若发现类型错误，定位到具体文件行修复（不扩大改动范围）。

## Assumptions & Decisions

1. **不改动 ProFormList 运行时逻辑**：不受控重构已完成且符合用户要求，本计划仅做导出/文档/清理。
2. **不改动 ProFormSteps 运行时逻辑**：除移除未使用 `FC` import 外，不动其他代码。
3. **index 作 React key 保持不变**：FormField 按 `schema.name` 复用 FieldNode，位置语义正确；结构变更时主动重排扁平字段值已实现。
4. **已知遗留问题不在本计划范围**（预存在，前期已分析）：
   - `FormStore.unregisterField` 不删除 values，移除行后扁平值残留（re-add 时被覆盖，不影响功能）
   - ProFormList 的 `initialValue` 不会同步到扁平字段值（FormField 走 `schema.initialValue`）
5. **README 双处更新**：13.x（结构化参考）与 15.x（使用示例）均更新，避免文档自相矛盾。
6. **导出顺序**：按 `ProFormListProps, ProFormListInstance, ProFormListActions, ProFormStepsProps, ProFormStepSchema, ProFormStepsInstance` 顺序排列（List 相关在前，与现有组件顺序一致）。

## Verification

1. **导出完整性**：在 ProForm 模块入口确认 `ProFormListInstance` / `ProFormListActions` 可被 `import type { ... } from '@lania-pro-components/components'` 解析
2. **类型检查**：`pnpm typecheck` 通过，无 TS 错误
3. **import 清理**：`ProFormSteps.tsx` 不再 import `FC`，eslint 无 unused import 告警
4. **文档一致性**：README 13.3/13.4 与 15.8/15.9 的 Props 表、实例接口、代码示例相互一致，且与 `types.ts` 定义一致
