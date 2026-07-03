/**
 * ActionButton 模块统一入口
 *
 * ActionButton 是一组预封装的企业级操作按钮组件，
 * 封装了常见的 CRUD 操作 UI 交互逻辑（弹窗、表单、确认等），
 * 开发者只需传入配置即可快速构建功能完善的操作按钮。
 *
 * 包含的按钮组件：
 * - AddButton:       新增按钮 → 表单弹窗 → 提交
 * - EditButton:      编辑按钮 → 表单弹窗（数据回填） → 提交
 * - DeleteButton:    删除按钮 → 二次确认弹窗 → 执行删除
 * - ViewButton:      查看按钮 → 详情弹窗（自定义内容）
 * - BatchButton:     批量操作按钮 → 选择校验 → 可选确认 → 执行
 * - ExportButton:    导出按钮 → 远程下载 / 自定义导出
 * - ImportButton:    导入按钮 → 文件上传弹窗 → 提交上传
 * - JumpButton:      跳转按钮 → 页面路由跳转
 *
 * 每个按钮组件都支持：
 * - ref 命令式调用（open / execute / jump 等）
 * - visible 属性控制显隐
 * - 继承 Arco Design Button 的所有属性
 */

// 导出按钮组件
export { AddButton } from './AddButton';
export { EditButton } from './EditButton';
export { ViewButton } from './ViewButton';
export { DeleteButton } from './DeleteButton';
export { ExportButton } from './ExportButton';
export { ImportButton } from './ImportButton';
export { JumpButton } from './JumpButton';
export { BatchButton } from './BatchButton';

// 导出类型
export type {
  FormButtonProps,
  AddButtonProps,
  EditButtonProps,
  ViewButtonProps,
  DeleteButtonProps,
  ExportButtonProps,
  ImportButtonProps,
  JumpButtonProps,
  BatchButtonProps,
  AddButtonRef,
  EditButtonRef,
  DeleteButtonRef,
  ViewButtonRef,
  BatchButtonRef,
  ExportButtonRef,
  ImportButtonRef,
  JumpButtonRef,
} from './types';

// 默认导出（默认导出 AddButton）
export { default } from './AddButton';
