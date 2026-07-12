/**
 * 快捷组件（QuickComponents）
 *
 * 预封装的高频业务场景组件集合，通过 componentRegistry 注册后，
 * 可在 ProForm 的 Schema 中直接通过组件名使用。
 *
 * 涵盖的快捷组件：
 * - PasswordInput: 密码输入框（支持显示/隐藏切换）
 * - YesNoSelect / MaleFemaleSelect / EnableDisableSelect / StatusSelect / OpenCloseSelect: 常用下拉选择
 * - PhoneInput / EmailInput / IdCardInput: 常用输入框（含基本格式校验）
 * - AmountInput / PercentageInput: 金额/百分比输入
 * - YearPicker / MonthPicker / WeekPicker / QuarterPicker / RangePicker / TimeRangePicker: 日期快捷选择
 * - VerificationCode: 验证码输入（支持发送验证码逻辑）
 * - ImageList: 图片列表
 * - QuickInputWithSuffix: 带后缀的 Input（如 ${Input}元）
 * - QuickInputNumberWithSuffix: 带后缀的 InputNumber（如 ${InputNumber}%）
 */
import React, { FC, useState, useCallback } from 'react';
import { Input, InputNumber, Select, Radio, Button, Image, DatePicker, TimePicker } from '@arco-design/web-react';
import { IconEye, IconEyeInvisible } from '@arco-design/web-react/icon';
import { registerComponent, stripFormControlProps } from '../registry/componentRegistry';
import type { ProFormFieldComponentProps } from '../types';

interface QuickInputWithSuffixProps extends ProFormFieldComponentProps<string> {
  suffix?: string;
  prefix?: string;
}

const QuickInputWithSuffix: FC<QuickInputWithSuffixProps> = ({
  value,
  onChange,
  suffix,
  prefix,
  status,
  values: _values,
  schema: _schema,
  field: _field,
  form: _form,
  style,
  ...restProps
}) => {
  return (
    <Input
      {...restProps}
      value={value}
      onChange={onChange}
      prefix={prefix}
      suffix={suffix}
      disabled={status === 'disabled'}
      style={{ width: '100%', ...(style as Record<string, unknown>) }}
    />
  );
};

interface QuickInputNumberWithSuffixProps extends ProFormFieldComponentProps<number> {
  suffix?: string;
  prefix?: string;
}

const QuickInputNumberWithSuffix: FC<QuickInputNumberWithSuffixProps> = ({
  value,
  onChange,
  suffix,
  prefix,
  status,
  values: _values,
  schema: _schema,
  field: _field,
  form: _form,
  style,
  ...restProps
}) => {
  return (
    <InputNumber
      {...restProps}
      value={value}
      onChange={onChange}
      prefix={prefix}
      suffix={suffix}
      disabled={status === 'disabled'}
      style={{ width: '100%', ...(style as Record<string, unknown>) }}
    />
  );
};

interface PasswordInputProps {
  value?: string;
  onChange?: (value: string) => void;
  [key: string]: unknown;
}

const PasswordInput: FC<PasswordInputProps> = ({ value, onChange, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      suffix={
        <span style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setVisible(!visible)}>
          {visible ? <IconEyeInvisible /> : <IconEye />}
        </span>
      }
    />
  );
};

interface YesNoSelectProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  [key: string]: unknown;
}

const YesNoSelect: FC<YesNoSelectProps> = ({ value, onChange, ...props }) => (
  <Select
    {...props}
    value={value}
    onChange={onChange}
    options={[
      { label: '是', value: 'yes' },
      { label: '否', value: 'no' },
    ]}
  />
);

const MaleFemaleSelect: FC<YesNoSelectProps> = ({ value, onChange, ...props }) => (
  <Radio.Group {...props} value={value} onChange={onChange}>
    <Radio value='male'>男</Radio>
    <Radio value='female'>女</Radio>
  </Radio.Group>
);

const EnableDisableSelect: FC<YesNoSelectProps> = ({ value, onChange, ...props }) => (
  <Select
    {...props}
    value={value}
    onChange={onChange}
    options={[
      { label: '启用', value: 'enable' },
      { label: '禁用', value: 'disable' },
    ]}
  />
);

const StatusSelect: FC<YesNoSelectProps> = ({ value, onChange, ...props }) => (
  <Select
    {...props}
    value={value}
    onChange={onChange}
    options={[
      { label: '草稿', value: 'draft' },
      { label: '待审核', value: 'pending' },
      { label: '已通过', value: 'approved' },
      { label: '已拒绝', value: 'rejected' },
    ]}
  />
);

const OpenCloseSelect: FC<YesNoSelectProps> = ({ value, onChange, ...props }) => (
  <Select
    {...props}
    value={value}
    onChange={onChange}
    options={[
      { label: '开启', value: 'open' },
      { label: '关闭', value: 'close' },
    ]}
  />
);

interface VerificationCodeProps {
  value?: string;
  onChange?: (value: string) => void;
  onSendCode?: () => Promise<void>;
  countdown?: number;
  [key: string]: unknown;
}

const VerificationCode: FC<VerificationCodeProps> = ({ value, onChange, onSendCode, countdown = 60, ...props }) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSendCode = useCallback(async () => {
    if (!onSendCode) {
      return;
    }
    try {
      setLoading(true);
      await onSendCode();
      setCount(countdown);
      const timer = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setLoading(false);
    }
  }, [onSendCode, countdown]);

  return (
    <Input.Search
      {...props}
      value={value}
      onChange={onChange}
      searchButton={
        <Button disabled={count > 0 || loading} loading={loading} onClick={handleSendCode} type='primary'>
          {count > 0 ? `${count}s` : '获取验证码'}
        </Button>
      }
    />
  );
};

interface ImageListProps {
  value?: Array<string | { url: string }>;
  onChange?: (value: Array<string | { url: string }>) => void;
  [key: string]: unknown;
}

const ImageList: FC<ImageListProps> = ({ value = [], ..._props }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {value.map((item, index) => {
          const url = typeof item === 'string' ? item : item.url;
          return (
            <div
              key={index}
              style={{
                width: 80,
                height: 80,
                borderRadius: 4,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => handlePreview(url)}
            >
              <img src={url} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          );
        })}
      </div>
      {previewVisible && (
        <Image.Preview src={previewUrl} visible={previewVisible} onVisibleChange={setPreviewVisible} />
      )}
    </>
  );
};

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  [key: string]: unknown;
}

const PhoneInput: FC<PhoneInputProps> = ({ value, onChange, ...props }) => (
  <Input {...props} value={value} onChange={onChange} maxLength={11} placeholder='请输入手机号' />
);

interface EmailInputProps {
  value?: string;
  onChange?: (value: string) => void;
  [key: string]: unknown;
}

const EmailInput: FC<EmailInputProps> = ({ value, onChange, ...props }) => (
  <Input {...props} value={value} onChange={onChange} placeholder='请输入邮箱' />
);

interface IdCardInputProps {
  value?: string;
  onChange?: (value: string) => void;
  [key: string]: unknown;
}

const IdCardInput: FC<IdCardInputProps> = ({ value, onChange, ...props }) => (
  <Input {...props} value={value} onChange={onChange} maxLength={18} placeholder='请输入身份证号' />
);

interface AmountInputProps {
  value?: number;
  onChange?: (value: number) => void;
  [key: string]: unknown;
}

const AmountInput: FC<AmountInputProps> = ({ value, onChange, ...props }) => (
  <InputNumber {...props} value={value} onChange={onChange} min={0} precision={2} prefix='¥' placeholder='请输入金额' />
);

interface PercentageInputProps {
  value?: number;
  onChange?: (value: number) => void;
  [key: string]: unknown;
}

const PercentageInput: FC<PercentageInputProps> = ({ value, onChange, ...props }) => (
  <InputNumber
    {...props}
    value={value}
    onChange={onChange}
    min={0}
    max={100}
    precision={2}
    suffix='%'
    placeholder='请输入百分比'
  />
);

interface YearPickerProps {
  value?: Date;
  onChange?: (value: Date) => void;
  [key: string]: unknown;
}

const YearPicker: FC<YearPickerProps> = ({ value, onChange, ...props }) => {
  const handleChange = (_dateString: string, date: unknown) => {
    const dateObj = (date as { toDate?: () => Date })?.toDate?.() || new Date(String(date));
    onChange?.(dateObj);
  };
  return <DatePicker.YearPicker {...props} value={value} onChange={handleChange} />;
};

interface MonthPickerProps {
  value?: Date;
  onChange?: (value: Date) => void;
  [key: string]: unknown;
}

const MonthPicker: FC<MonthPickerProps> = ({ value, onChange, ...props }) => {
  const handleChange = (_dateString: string, date: unknown) => {
    const dateObj = (date as { toDate?: () => Date })?.toDate?.() || new Date(String(date));
    onChange?.(dateObj);
  };
  return <DatePicker.MonthPicker {...props} value={value} onChange={handleChange} />;
};

interface WeekPickerProps {
  value?: Date;
  onChange?: (value: Date) => void;
  [key: string]: unknown;
}

const WeekPicker: FC<WeekPickerProps> = ({ value, onChange, ...props }) => {
  const handleChange = (_dateString: string, date: unknown) => {
    const dateObj = (date as { toDate?: () => Date })?.toDate?.() || new Date(String(date));
    onChange?.(dateObj);
  };
  return <DatePicker.WeekPicker {...props} value={value} onChange={handleChange} />;
};

interface QuarterPickerProps {
  value?: Date;
  onChange?: (value: Date) => void;
  [key: string]: unknown;
}

const QuarterPicker: FC<QuarterPickerProps> = ({ value, onChange, ...props }) => {
  const handleChange = (_dateString: string, date: unknown) => {
    const dateObj = (date as { toDate?: () => Date })?.toDate?.() || new Date(String(date));
    onChange?.(dateObj);
  };
  return <DatePicker.QuarterPicker {...props} value={value} onChange={handleChange} />;
};

interface RangePickerProps {
  value?: [Date, Date];
  onChange?: (value: [Date, Date]) => void;
  [key: string]: unknown;
}

const RangePicker: FC<RangePickerProps> = ({ value, onChange, style, ...restProps }) => {
  const handleChange = (_dateString: string[], date: unknown[]) => {
    const dateObj1 = (date[0] as { toDate?: () => Date })?.toDate?.() || new Date(String(date[0]));
    const dateObj2 = (date[1] as { toDate?: () => Date })?.toDate?.() || new Date(String(date[1]));
    onChange?.([dateObj1, dateObj2]);
  };
  return (
    <DatePicker.RangePicker
      {...restProps}
      value={value}
      onChange={handleChange}
      style={{ width: '100%', ...(style as Record<string, unknown>) }}
    />
  );
};

interface TimeRangePickerProps {
  value?: [Date, Date];
  onChange?: (value: [Date, Date]) => void;
  [key: string]: unknown;
}

const TimeRangePicker: FC<TimeRangePickerProps> = ({ value, onChange, ...props }) => {
  const handleChange = (_dateString: string[], date: unknown[]) => {
    const dateObj1 = (date[0] as { toDate?: () => Date })?.toDate?.() || new Date(String(date[0]));
    const dateObj2 = (date[1] as { toDate?: () => Date })?.toDate?.() || new Date(String(date[1]));
    onChange?.([dateObj1, dateObj2]);
  };
  return <TimePicker.RangePicker {...props} value={value} onChange={handleChange} />;
};

// 注册所有快速组件
registerComponent('Password', stripFormControlProps(PasswordInput));
registerComponent('YesNo', stripFormControlProps(YesNoSelect));
registerComponent('MaleFemale', stripFormControlProps(MaleFemaleSelect));
registerComponent('EnableDisable', stripFormControlProps(EnableDisableSelect));
registerComponent('Status', stripFormControlProps(StatusSelect));
registerComponent('OpenClose', stripFormControlProps(OpenCloseSelect));
registerComponent('VerificationCode', stripFormControlProps(VerificationCode));
registerComponent('ImageList', stripFormControlProps(ImageList));
registerComponent('Phone', stripFormControlProps(PhoneInput));
registerComponent('Email', stripFormControlProps(EmailInput));
registerComponent('IdCard', stripFormControlProps(IdCardInput));
registerComponent('Amount', stripFormControlProps(AmountInput));
registerComponent('Percentage', stripFormControlProps(PercentageInput));
registerComponent('YearPicker', stripFormControlProps(YearPicker));
registerComponent('MonthPicker', stripFormControlProps(MonthPicker));
registerComponent('WeekPicker', stripFormControlProps(WeekPicker));
registerComponent('QuarterPicker', stripFormControlProps(QuarterPicker));
registerComponent('RangePicker', stripFormControlProps(RangePicker));
registerComponent('TimeRangePicker', stripFormControlProps(TimeRangePicker));
// QuickInputWithSuffix / QuickInputNumberWithSuffix 消费 status 字段，不做剥离
registerComponent('QuickInputWithSuffix', QuickInputWithSuffix);
registerComponent('QuickInputNumberWithSuffix', QuickInputNumberWithSuffix);

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
};
