/**
 * 基础组件注册
 *
 * 自动注册 Arco Design 的基础表单控件组件到 componentRegistry 中。
 * 通过 import 此文件即完成注册（side-effect import）。
 *
 * 涵盖的组件类型：
 * - 输入类: Input / InputNumber / TextArea / Select / AutoComplete / Mentions
 * - 选择类: Switch / Checkbox / Radio / Cascader / TreeSelect
 * - 日期时间类: DatePicker / TimePicker 及其子组件
 * - 其他: Transfer / Upload / Rate / Slider / ColorPicker
 *
 * 注意：所有组件被包装了一层以剥离 FormField 注入的自定义 props
 * （status / values / schema / field / form），避免未知属性污染 DOM。
 */
import React from 'react';
import {
  Input,
  InputNumber,
  Select,
  Switch,
  Checkbox,
  Radio,
  DatePicker,
  TimePicker,
  Cascader,
  Transfer,
  Upload,
  TreeSelect,
  AutoComplete,
  Mentions,
  Rate,
  Slider,
  ColorPicker,
} from '@arco-design/web-react';
import { registerComponents } from '../registry/componentRegistry';

/**
 * 高阶函数：包装组件以剥离 FormField 注入的自定义 props
 * 这些 props 仅供自定义表单控件消费，原生 Arco 组件不需要它们。
 */
function stripFormControlProps<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> {
  const Wrapped: React.FC<P> = (props) => {
    const { status: _s, values: _v, schema: _sc, field: _f, form: _fm, ...rest } = props as P & {
      status?: unknown;
      values?: unknown;
      schema?: unknown;
      field?: unknown;
      form?: unknown;
    };
    return <Component {...(rest as unknown as P)} />;
  };
  Wrapped.displayName = `FormFieldWrapped(${Component.displayName || Component.name || 'Unknown'})`;
  return Wrapped;
}

// 注册基础 Arco 组件（带包装）
registerComponents({
  // 输入类
  Input: stripFormControlProps(Input),
  InputNumber: stripFormControlProps(InputNumber),
  TextArea: stripFormControlProps(Input.TextArea),
  Select: stripFormControlProps(Select),
  AutoComplete: stripFormControlProps(AutoComplete),
  Mentions: stripFormControlProps(Mentions),

  // 选择类
  Switch: stripFormControlProps(Switch),
  Checkbox: stripFormControlProps(Checkbox),
  'Checkbox.Group': stripFormControlProps(Checkbox.Group),
  Radio: stripFormControlProps(Radio),
  'Radio.Group': stripFormControlProps(Radio.Group),
  Cascader: stripFormControlProps(Cascader),
  TreeSelect: stripFormControlProps(TreeSelect),

  // 日期时间类
  DatePicker: stripFormControlProps(DatePicker),
  'DatePicker.YearPicker': stripFormControlProps(DatePicker.YearPicker),
  'DatePicker.MonthPicker': stripFormControlProps(DatePicker.MonthPicker),
  'DatePicker.WeekPicker': stripFormControlProps(DatePicker.WeekPicker),
  'DatePicker.QuarterPicker': stripFormControlProps(DatePicker.QuarterPicker),
  'DatePicker.RangePicker': stripFormControlProps(DatePicker.RangePicker as React.ComponentType<Record<string, unknown>>),
  TimePicker: stripFormControlProps(TimePicker),
  'TimePicker.RangePicker': stripFormControlProps(TimePicker.RangePicker as React.ComponentType<Record<string, unknown>>),

  // 其他
  Transfer: stripFormControlProps(Transfer),
  Upload: stripFormControlProps(Upload),
  Rate: stripFormControlProps(Rate),
  Slider: stripFormControlProps(Slider),
  ColorPicker: stripFormControlProps(ColorPicker),
});

export {};
