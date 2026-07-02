import React, { FC, useState, useCallback } from 'react';
import { Input, InputNumber, Select, Radio, Button, Image, DatePicker, TimePicker } from '@arco-design/web-react';
import { IconEye, IconEyeInvisible } from '@arco-design/web-react/icon';
import { registerComponent } from '../registry/componentRegistry';

interface QuickInputWithSuffixProps {
  value?: string;
  onChange?: (value: string) => void;
  suffix?: string;
  prefix?: string;
  [key: string]: unknown;
}

const QuickInputWithSuffix: FC<QuickInputWithSuffixProps> = ({
  value,
  onChange,
  suffix,
  prefix,
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
      style={{ width: '100%', ...(style as Record<string, unknown>) }}
    />
  );
};

interface QuickInputNumberWithSuffixProps {
  value?: number;
  onChange?: (value: number) => void;
  suffix?: string;
  prefix?: string;
  [key: string]: unknown;
}

const QuickInputNumberWithSuffix: FC<QuickInputNumberWithSuffixProps> = ({
  value,
  onChange,
  suffix,
  prefix,
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
registerComponent('Password', PasswordInput);
registerComponent('YesNo', YesNoSelect);
registerComponent('MaleFemale', MaleFemaleSelect);
registerComponent('EnableDisable', EnableDisableSelect);
registerComponent('Status', StatusSelect);
registerComponent('OpenClose', OpenCloseSelect);
registerComponent('VerificationCode', VerificationCode);
registerComponent('ImageList', ImageList);
registerComponent('Phone', PhoneInput);
registerComponent('Email', EmailInput);
registerComponent('IdCard', IdCardInput);
registerComponent('Amount', AmountInput);
registerComponent('Percentage', PercentageInput);
registerComponent('YearPicker', YearPicker);
registerComponent('MonthPicker', MonthPicker);
registerComponent('WeekPicker', WeekPicker);
registerComponent('QuarterPicker', QuarterPicker);
registerComponent('RangePicker', RangePicker);
registerComponent('TimeRangePicker', TimeRangePicker);
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
