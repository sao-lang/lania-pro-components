/**
 * valueTypeToComponent — valueType → Arco 组件名映射
 *
 * 从 ProTable/features/QueryForm.tsx 迁移
 * 映射规则：
 * text → Input | money/number/percent → InputNumber
 * select/tag/enum → Select | date/dateTime → DatePicker
 * switch → Switch 等
 */

import type { ProColumnValueType } from '../../ProTable/types';

/** valueType → Arco 组件名映射 */
export const valueTypeToComponent: Record<Exclude<ProColumnValueType, 'opr' | 'proTable'>, string> = {
  text: 'Input',
  number: 'InputNumber',
  money: 'InputNumber',
  percent: 'InputNumber',
  date: 'DatePicker',
  dateTime: 'DatePicker',
  time: 'TimePicker',
  dateRange: 'DatePicker.RangePicker',
  dateTimeRange: 'DatePicker.RangePicker',
  select: 'Select',
  radio: 'Radio.Group',
  checkbox: 'Checkbox.Group',
  switch: 'Switch',
  tag: 'Select',
  avatar: 'Input',
  image: 'Input',
  link: 'Input',
  progress: 'InputNumber',
  code: 'Input',
  json: 'Input',
  textarea: 'Input.TextArea',
  enum: 'Select',
};
