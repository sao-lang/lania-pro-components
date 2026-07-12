/**
 * ProForm 高级组件模块
 *
 * 提供表单的高级布局组件和快捷组件：
 *
 * 高级布局：
 * - ProFormList: 动态列表表单（增删行、排序、卡片布局）
 * - ProFormSteps: 分步表单（多步骤表单流程）
 *
 * 快捷组件：
 * - PasswordInput / PhoneInput / EmailInput / IdCardInput: 常用输入框
 * - YesNoSelect / MaleFemaleSelect / EnableDisableSelect / StatusSelect 等: 快捷下拉选择
 * - AmountInput / PercentageInput: 金额/百分比输入
 * - YearPicker / MonthPicker / WeekPicker / QuarterPicker / RangePicker: 日期快捷选择
 * - VerificationCode: 验证码输入
 * - ImageList: 图片列
 * - QuickInputWithSuffix / QuickInputNumberWithSuffix: 带后缀/前缀的输入框
 */

export { ProFormList } from './ProFormList';
export { ProFormSteps } from './ProFormSteps';

export type {
  ProFormListProps,
  ProFormListInstance,
  ProFormListActions,
  ProFormStepsProps,
  ProFormStepSchema,
  ProFormStepsInstance,
} from './types';

// 快速组件导出
export {
  PasswordInput,
  YesNoSelect,
  MaleFemaleSelect,
  EnableDisableSelect,
  StatusSelect,
  OpenCloseSelect,
  VerificationCode,
  ImageList,
  PhoneInput,
  EmailInput,
  IdCardInput,
  AmountInput,
  PercentageInput,
  YearPicker,
  MonthPicker,
  WeekPicker,
  QuarterPicker,
  RangePicker,
  TimeRangePicker,
  QuickInputWithSuffix,
  QuickInputNumberWithSuffix,
} from './QuickComponents';
