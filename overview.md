## 修改记录

---

### 2026-07-13

#### 1. 新增通用 AI coding 规则 skill

- **时间：** 2026-07-13 00:00:00
- **发起人：** user
- **修改文件：** `.github/skills/ai-coding-rules/SKILL.md`
- **修改内容：** 创建一份通用、与项目语言和 IDE 无关的 skill，用于指导 AI 在各类代码仓库中进行分析、实现、测试、调试和文档更新。
- **复盘结果：** skill 内容覆盖需求理解、上下文检查、规划、实现、验证、文档记录与调试测试原则，适合作为通用开发规则入口。
- **潜在风险：** 若后续需要更强的仓库特定约束，可继续在 `.github/instructions` 或更细粒度的 skill 中补充。

### 2026-07-12

#### 1. 修复 ProTable.tsx 类型错误 + 合并 ProTableRendererProps 字段

- **时间：** 2026-07-12 23:20:35
- **发起人：** user
- **修改文件：** `packages/components/ProTable/ProTable.tsx`
- **修改内容：**
  - `ProTableRendererProps` 接口：删除 `props`、`bindingProps` 字段，仅保留 `mergedProps`
  - 修复 `ProTableStandalone` 和 `ProTableControlled` 中 `Provider` 组件因泛型 `T` 与 `Record<string, unknown>` 不兼容导致的 3 个 TypeScript 编译错误
  - `props.rowSelection` → `mergedProps.rowSelection`（CardView 2处）
  - `contextValue` 中 `bindingProps` 改为使用 `mergedProps`
  - `RootProvider props={props}` → `props={mergedProps}`
  - `ProTableStandalone`/`ProTableControlled` 调用 `ProTableRenderer` 时删除 `props`、`bindingProps` 传参
- **复盘结果：** 格式通过 Prettier 自动修复，TypeScript 类型检查 ProTable.tsx 无错误。docs/examples 目录下 ProChart、ProDescriptions 导出引用报错为预存问题，与本修改无关。
- **潜在风险：** `contextValue.bindingProps` 现接收 `mergedProps`（用户 props + bindingProps 合并），项目内无组件从 context 消费 `bindingProps`，无实际影响。

#### 2. ProForm / ProTable 组件和 Hook 物理移动

- **时间：** 2026-07-12
- **发起人：** Copilot
- **修改文件：**
  - `packages/components/ProForm/components/ProForm.tsx`（新增，从 `ProForm/ProForm.tsx` 移入）
  - `packages/components/ProTable/components/ProTable.tsx`（新增，从 `ProTable/ProTable.tsx` 移入）
  - `packages/components/ProForm/hooks/useProForm.tsx`（新增，从 `ProForm/useProForm.tsx` 移入）
  - `packages/components/ProTable/hooks/useProTable.tsx`（新增，从 `ProTable/hooks/useProTable.tsx` 移回）
  - `packages/components/ProForm/ProForm.tsx`（删除）
  - `packages/components/ProForm/useProForm.tsx`（删除）
  - `packages/components/ProTable/ProTable.tsx`（删除）
  - `packages/components/ProTable/hooks/useProTable.tsx`（删除重建）
  - `packages/components/ProForm/index.ts`（更新导出路径）
  - `packages/components/ProTable/index.tsx`（更新导入路径）
  - `packages/components/ProTable/hooks/index.ts`（更新导出路径）
  - `packages/components/index.ts`（更新主入口导出路径）
  - `packages/components/ProForm/components/ProFormList.tsx`（更新引用路径）
- **修改内容：**
  - `ProForm.tsx` 从 `ProForm/` 根目录移动到 `ProForm/components/` 子目录，内部相对导入路径加上 `../` 前缀指向父级目录
  - `ProTable.tsx` 从 `ProTable/` 根目录移动到 `ProTable/components/` 子目录，内部相对导入路径相应调整
  - `useProForm.tsx` 从 `ProForm/` 根目录移动到 `ProForm/hooks/` 子目录，内部相对导入路径调整为 `../` 指向父级或 `./` 指向同级
  - `useProTable.tsx` 恢复到 `ProTable/hooks/` 目录，内部相对导入路径更新
  - 同步更新所有入口文件的导出/导入路径
