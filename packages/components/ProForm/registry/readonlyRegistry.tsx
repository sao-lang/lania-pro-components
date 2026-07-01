import React, { ReactNode, useState } from 'react';
import { Image, Tag, Space } from '@arco-design/web-react';
import { IconEye, IconFile, IconLink, IconPlayCircle } from '@arco-design/web-react/icon';
function formatDate(date: Date, formatStr: string): string {
  const pad = (num: number): string => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return formatStr
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}
import type { ReadonlyRenderer, ReadonlyRendererRegistry, ReadonlyRenderConfig } from '../types';

/**
 * 默认空值文本
 */
const DEFAULT_EMPTY_TEXT = '--';

/**
 * 格式化空值
 */
function formatEmpty(value: unknown, emptyText: string = DEFAULT_EMPTY_TEXT): string | null {
  if (value === null || value === undefined || value === '') {
    return emptyText;
  }
  return null;
}

/**
 * 应用前缀后缀
 */
function withAffix(content: ReactNode, config: ReadonlyRenderConfig): ReactNode {
  const { prefix, suffix } = config;
  if (!prefix && !suffix) {
    return content;
  }
  return (
    <span>
      {prefix && <span style={{ marginRight: 4 }}>{prefix}</span>}
      {content}
      {suffix && <span style={{ marginLeft: 4 }}>{suffix}</span>}
    </span>
  );
}

/**
 * 格式化数字（千分位）
 */
function formatNumber(num: number, thousands = false, precision?: number): string {
  let formatted = precision !== undefined ? num.toFixed(precision) : String(num);
  if (thousands) {
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatted = parts.join('.');
  }
  return formatted;
}

// ========== 基础渲染器 ==========

/**
 * 文本渲染器
 */
export const textRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  let text = String(value);
  if (config.maxLength && text.length > config.maxLength) {
    text = text.slice(0, config.maxLength) + (config.ellipsis || '...');
  }
  return <span>{withAffix(text, config)}</span>;
};

/**
 * 多行文本渲染器
 */
export const textareaRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const text = String(value);
  const lines = text.split('\n');
  return (
    <span>
      {withAffix(
        lines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        )),
        config,
      )}
    </span>
  );
};

/**
 * 选项渲染器
 */
export const optionRenderer: ReadonlyRenderer = (value, options = [], config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const separator = config.separator || ', ';

  if (Array.isArray(value)) {
    const labels = value.map((v) => {
      const opt = options.find((o) => o.value === v);
      return opt?.label || v;
    });

    if (config.mode === 'tag') {
      return (
        <Space wrap>
          {labels.map((label, i) => (
            <Tag key={i} color={config.tagColors?.[value[i]]}>
              {label}
            </Tag>
          ))}
        </Space>
      );
    }

    return <span>{withAffix(labels.join(separator), config)}</span>;
  }

  const option = options.find((o) => o.value === value);
  const label = option?.label || value;

  if (config.mode === 'tag') {
    return <Tag color={config.tagColors?.[String(value)]}>{label}</Tag>;
  }

  return <span>{withAffix(String(label), config)}</span>;
};

/**
 * 多选框渲染器
 */
export const checkboxRenderer: ReadonlyRenderer = (value, options = [], config = {}) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const empty = formatEmpty(values.length > 0 ? values : null, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const selected = options.filter((opt) => values.includes(opt.value));

  return (
    <Space wrap>
      {selected.map((opt, i) => (
        <Tag key={i} color={config.tagColors?.[String(opt.value)]}>
          {opt.label}
        </Tag>
      ))}
    </Space>
  );
};

/**
 * Switch 渲染器
 */
export const switchRenderer: ReadonlyRenderer = (value, _options, config = {}, componentProps = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const { checkedText, uncheckedText, trueText, falseText } = componentProps;
  const trueLabel = checkedText || trueText || '是';
  const falseLabel = uncheckedText || falseText || '否';

  const isChecked = value === true || value === 'true' || value === 1 || value === '1';

  return <Tag color={isChecked ? 'green' : 'gray'}>{isChecked ? trueLabel : falseLabel}</Tag>;
};

/**
 * 日期渲染器
 */
export const dateRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const format = config.format || 'YYYY-MM-DD';

  if (Array.isArray(value)) {
    const start = value[0] ? formatDate(new Date(value[0]), format) : '';
    const end = value[1] ? formatDate(new Date(value[1]), format) : '';
    return <span>{withAffix(`${start} ~ ${end}`, config)}</span>;
  }

  const dateValue = value instanceof Date ? value : new Date(value as string | number);
  return <span>{withAffix(formatDate(dateValue, format), config)}</span>;
};

/**
 * 时间渲染器
 */
export const timeRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const format = config.format || 'HH:mm:ss';

  if (Array.isArray(value)) {
    const start = value[0] ? formatDate(new Date(value[0]), format) : '';
    const end = value[1] ? formatDate(new Date(value[1]), format) : '';
    return <span>{withAffix(`${start} ~ ${end}`, config)}</span>;
  }

  const timeValue = value instanceof Date ? value : new Date(value as string | number);
  return <span>{withAffix(formatDate(timeValue, format), config)}</span>;
};

/**
 * 日期时间渲染器
 */
export const dateTimeRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const format = config.format || 'YYYY-MM-DD HH:mm:ss';

  if (Array.isArray(value)) {
    const start = value[0] ? formatDate(new Date(value[0]), format) : '';
    const end = value[1] ? formatDate(new Date(value[1]), format) : '';
    return <span>{withAffix(`${start} ~ ${end}`, config)}</span>;
  }

  const dateTimeValue = value instanceof Date ? value : new Date(value as string | number);
  return <span>{withAffix(formatDate(dateTimeValue, format), config)}</span>;
};

/**
 * 数字渲染器
 */
export const numberRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const num = Number(value);
  if (isNaN(num)) {
    return <span>{withAffix(String(value), config)}</span>;
  }

  const formatted = formatNumber(num, config.thousands, config.precision);
  return <span>{withAffix(formatted, config)}</span>;
};

/**
 * 百分比渲染器
 */
export const percentageRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const num = Number(value);
  if (isNaN(num)) {
    return <span>{withAffix(String(value), config)}</span>;
  }

  const precision = config.precision ?? 2;
  const formatted = formatNumber(num, config.thousands, precision);
  return <span>{withAffix(`${formatted}%`, config)}</span>;
};

/**
 * 货币渲染器
 */
export const currencyRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const num = Number(value);
  if (isNaN(num)) {
    return <span>{withAffix(String(value), config)}</span>;
  }

  const symbol = config.currencySymbol || '¥';
  const precision = config.precision ?? 2;
  const formatted = formatNumber(num, config.thousands ?? true, precision);
  return <span>{withAffix(`${symbol}${formatted}`, config)}</span>;
};

/**
 * JSON 渲染器
 */
export const jsonRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  let jsonStr: string;
  try {
    jsonStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  } catch {
    jsonStr = String(value);
  }

  return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{withAffix(jsonStr, config)}</pre>;
};

/**
 * 图片渲染器
 */
export const imageRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const images = Array.isArray(value) ? value : [value];
  const urls = images.map((item) => (typeof item === 'string' ? item : item?.url)).filter(Boolean);

  if (urls.length === 0) {
    return <span>{withAffix(DEFAULT_EMPTY_TEXT, config)}</span>;
  }

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const handlePreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const width = config.preview?.width || 80;
  const height = config.preview?.height || 80;

  return (
    <>
      <Space wrap>
        {urls.map((url, index) => (
          <div
            key={index}
            style={{
              width,
              height,
              borderRadius: 4,
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={() => handlePreview(index)}
          >
            <img src={url} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
              className='readonly-image-overlay'
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              <IconEye style={{ color: '#fff', fontSize: 20 }} />
            </div>
          </div>
        ))}
      </Space>
      {previewVisible && (
        <Image.Preview src={urls[previewIndex]} visible={previewVisible} onVisibleChange={setPreviewVisible} />
      )}
    </>
  );
};

/**
 * 视频渲染器
 */
export const videoRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const videos = Array.isArray(value) ? value : [value];
  const urls = videos.map((item) => (typeof item === 'string' ? item : item?.url)).filter(Boolean);

  if (urls.length === 0) {
    return <span>{withAffix(DEFAULT_EMPTY_TEXT, config)}</span>;
  }

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  };

  const width = config.preview?.width || 120;
  const height = config.preview?.height || 80;

  return (
    <>
      <Space wrap>
        {urls.map((url, index) => (
          <div
            key={index}
            style={{
              width,
              height,
              borderRadius: 4,
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => handlePreview(url)}
          >
            <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <IconPlayCircle style={{ color: '#fff', fontSize: 32, opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </Space>
      {previewVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setPreviewVisible(false)}
        >
          <video
            src={previewUrl}
            controls
            autoPlay
            style={{ maxWidth: '90%', maxHeight: '90%' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

/**
 * 文件渲染器
 */
export const fileRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const files = Array.isArray(value) ? value : [value];
  const fileList = files
    .map((item) => (typeof item === 'string' ? { name: item.split('/').pop() || item, url: item } : item))
    .filter(Boolean);

  if (fileList.length === 0) {
    return <span>{withAffix(DEFAULT_EMPTY_TEXT, config)}</span>;
  }

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      {fileList.map((file, index) => (
        <a
          key={index}
          href={file.url}
          target={config.link?.target || '_blank'}
          rel={config.link?.rel || 'noopener noreferrer'}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <IconFile />
          <span>{file.name || file.url}</span>
        </a>
      ))}
    </Space>
  );
};

/**
 * 链接渲染器
 */
export const linkRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const url = String(value);
  return (
    <a
      href={url}
      target={config.link?.target || '_blank'}
      rel={config.link?.rel || 'noopener noreferrer'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <IconLink />
      {url}
    </a>
  );
};

/**
 * 电话脱敏渲染器
 */
export const phoneRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const phone = String(value);
  if (phone.length !== 11) {
    return <span>{withAffix(phone, config)}</span>;
  }

  return <span>{withAffix(`${phone.slice(0, 3)}****${phone.slice(-4)}`, config)}</span>;
};

/**
 * 邮箱脱敏渲染器
 */
export const emailRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const email = String(value);
  const atIndex = email.indexOf('@');
  if (atIndex <= 1) {
    return <span>{withAffix(email, config)}</span>;
  }

  const prefix = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const maskedPrefix = `${prefix.slice(0, 1)}***`;

  return <span>{withAffix(`${maskedPrefix}${domain}`, config)}</span>;
};

/**
 * 身份证脱敏渲染器
 */
export const idCardRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const idCard = String(value);
  if (idCard.length !== 18) {
    return <span>{withAffix(idCard, config)}</span>;
  }

  return <span>{withAffix(`${idCard.slice(0, 6)}********${idCard.slice(-4)}`, config)}</span>;
};

// ========== 快捷组件专用渲染器 ==========

/**
 * 是/否渲染器
 */
export const yesNoRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const map: Record<string, string> = {
    yes: '是',
    no: '否',
    true: '是',
    false: '否',
    '1': '是',
    '0': '否',
  };

  const label = map[String(value)] || value;
  const isYes = ['yes', 'true', '1'].includes(String(value).toLowerCase());

  return <Tag color={isYes ? 'green' : 'red'}>{label}</Tag>;
};

/**
 * 男/女渲染器
 */
export const maleFemaleRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const map: Record<string, string> = {
    male: '男',
    female: '女',
    m: '男',
    f: '女',
    '1': '男',
    '0': '女',
  };

  const label = map[String(value).toLowerCase()] || value;
  const isMale = ['male', 'm', '1'].includes(String(value).toLowerCase());

  return <Tag color={isMale ? 'blue' : 'pink'}>{label}</Tag>;
};

/**
 * 启用/禁用渲染器
 */
export const enableDisableRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const map: Record<string, string> = {
    enable: '启用',
    disable: '禁用',
    enabled: '启用',
    disabled: '禁用',
    true: '启用',
    false: '禁用',
    '1': '启用',
    '0': '禁用',
  };

  const label = map[String(value).toLowerCase()] || value;
  const isEnable = ['enable', 'enabled', 'true', '1'].includes(String(value).toLowerCase());

  return <Tag color={isEnable ? 'green' : 'red'}>{label}</Tag>;
};

/**
 * 开启/关闭渲染器
 */
export const openCloseRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const map: Record<string, string> = {
    open: '开启',
    close: '关闭',
    opened: '开启',
    closed: '关闭',
    true: '开启',
    false: '关闭',
    '1': '开启',
    '0': '关闭',
  };

  const label = map[String(value).toLowerCase()] || value;
  const isOpen = ['open', 'opened', 'true', '1'].includes(String(value).toLowerCase());

  return <Tag color={isOpen ? 'green' : 'gray'}>{label}</Tag>;
};

/**
 * 状态渲染器
 */
export const statusRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const empty = formatEmpty(value, config.emptyText);
  if (empty !== null) {
    return <span>{withAffix(empty, config)}</span>;
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'gray' },
    pending: { label: '待审核', color: 'orange' },
    approved: { label: '已通过', color: 'green' },
    rejected: { label: '已拒绝', color: 'red' },
    active: { label: '生效中', color: 'green' },
    inactive: { label: '已失效', color: 'gray' },
  };

  const status = statusMap[String(value).toLowerCase()] || {
    label: value,
    color: 'gray',
  };

  return <Tag color={status.color}>{status.label}</Tag>;
};

/**
 * 默认渲染器注册表
 */
const defaultRenderers: ReadonlyRendererRegistry = {
  // 基础组件
  Input: textRenderer,
  InputNumber: numberRenderer,
  Textarea: textareaRenderer,
  Select: optionRenderer,
  Switch: switchRenderer,
  CheckBox: checkboxRenderer,
  Radio: optionRenderer,
  DatePicker: dateRenderer,
  TimePicker: timeRenderer,
  DateTimePicker: dateTimeRenderer,
  Cascader: optionRenderer,
  Transfer: optionRenderer,
  Upload: fileRenderer,

  // 快捷组件
  Password: textRenderer,
  YesNo: yesNoRenderer,
  MaleFemale: maleFemaleRenderer,
  EnableDisable: enableDisableRenderer,
  Status: statusRenderer,
  OpenClose: openCloseRenderer,
  VerificationCode: textRenderer,
  ImageList: imageRenderer,
  Phone: phoneRenderer,
  Email: emailRenderer,
  IdCard: idCardRenderer,
  Amount: currencyRenderer,
  Percentage: percentageRenderer,
  YearPicker: dateRenderer,
  MonthPicker: dateRenderer,
  WeekPicker: dateRenderer,
  QuarterPicker: dateRenderer,
  RangePicker: dateRenderer,
  TimeRangePicker: timeRenderer,
  QuickInputWithSuffix: textRenderer,
  QuickInputNumberWithSuffix: numberRenderer,
};

/**
 * 渲染器注册表
 */
let rendererRegistry: ReadonlyRendererRegistry = { ...defaultRenderers };

/**
 * 注册自定义渲染器
 * @param componentType 组件类型
 * @param renderer 渲染器函数
 */
export function registerReadonlyRenderer(componentType: string, renderer: ReadonlyRenderer): void {
  rendererRegistry[componentType] = renderer;
}

/**
 * 批量注册渲染器
 * @param renderers 渲染器映射
 */
export function registerReadonlyRenderers(renderers: ReadonlyRendererRegistry): void {
  Object.assign(rendererRegistry, renderers);
}

/**
 * 获取渲染器
 * @param componentType 组件类型
 * @returns 渲染器函数
 */
export function getReadonlyRenderer(componentType: string): ReadonlyRenderer {
  return rendererRegistry[componentType] || textRenderer;
}

/**
 * 检查是否有注册的渲染器
 * @param componentType 组件类型
 * @returns 是否存在
 */
export function hasReadonlyRenderer(componentType: string): boolean {
  return componentType in rendererRegistry;
}

/**
 * 根据模式获取渲染器
 * @param mode 渲染模式
 * @returns 渲染器函数
 */
export function getRendererByMode(mode: string): ReadonlyRenderer {
  const modeRenderers: Record<string, ReadonlyRenderer> = {
    text: textRenderer,
    json: jsonRenderer,
    percentage: percentageRenderer,
    decimal: numberRenderer,
    currency: currencyRenderer,
    date: dateRenderer,
    datetime: dateTimeRenderer,
    time: timeRenderer,
    image: imageRenderer,
    video: videoRenderer,
    file: fileRenderer,
    link: linkRenderer,
    phone: phoneRenderer,
    email: emailRenderer,
    idCard: idCardRenderer,
  };

  return modeRenderers[mode] || textRenderer;
}

/**
 * 重置为默认渲染器
 */
export function resetReadonlyRenderers(): void {
  rendererRegistry = { ...defaultRenderers };
}

/**
 * 获取所有已注册的渲染器类型
 * @returns 组件类型列表
 */
export function getRegisteredRendererTypes(): string[] {
  return Object.keys(rendererRegistry);
}

export { defaultRenderers, rendererRegistry };

// 别名导出
export { rendererRegistry as readonlyRegistry };
