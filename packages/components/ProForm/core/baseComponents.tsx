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
