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
 */
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

// 注册基础 Arco 组件
registerComponents({
  // 输入类
  Input,
  InputNumber,
  TextArea: Input.TextArea,
  Select,
  AutoComplete,
  Mentions,

  // 选择类
  Switch,
  Checkbox,
  'Checkbox.Group': Checkbox.Group,
  Radio,
  'Radio.Group': Radio.Group,
  Cascader,
  TreeSelect,

  // 日期时间类
  DatePicker,
  'DatePicker.YearPicker': DatePicker.YearPicker,
  'DatePicker.MonthPicker': DatePicker.MonthPicker,
  'DatePicker.WeekPicker': DatePicker.WeekPicker,
  'DatePicker.QuarterPicker': DatePicker.QuarterPicker,
  'DatePicker.RangePicker': DatePicker.RangePicker,
  TimePicker,
  'TimePicker.RangePicker': TimePicker.RangePicker,

  // 其他
  Transfer,
  Upload,
  Rate,
  Slider,
  ColorPicker,
});

export {};
