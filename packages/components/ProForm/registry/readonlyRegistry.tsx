/**
 * 只读/预览渲染器注册表
 *
 * 为 ProForm 的只读/预览模式提供字段值渲染。
 * 内置 20+ 种默认渲染器，涵盖常见的只读展示场景：
 *
 * 基础渲染器：
 * - textRenderer: 纯文本
 * - textareaRenderer: 多行文本（保留换行）
 * - optionRenderer: 选项值→标签映射（支持 tag 模式）
 * - checkboxRenderer: 多选值→Tag 展示
 * - switchRenderer: 开关值→是/否 Tag
 *
 * 格式化渲染器：
 * - numberRenderer: 数字千分位
 * - percentageRenderer: 百分比
 * - currencyRenderer: 货币
 * - dateRenderer / timeRenderer / dateTimeRenderer: 日期/时间格式化
 *
 * 富媒体渲染器：
 * - imageRenderer: 图片缩略图+预览
 * - videoRenderer: 视频缩略图+预览播放
 * - fileRenderer: 文件链接列表
 * - linkRenderer: 链接
 *
 * 脱敏渲染器：
 * - phoneRenderer: 手机号脱敏（138****1234）
 * - emailRenderer: 邮箱脱敏（u***@example.com）
 * - idCardRenderer: 身份证脱敏
 *
 * 快捷组件渲染器：
 * - yesNoRenderer / maleFemaleRenderer / enableDisableRenderer 等
 * - statusRenderer: 状态标签
 */
import React, { ReactNode, useState } from 'react';
import { Image, Tag, Space } from '@arco-design/web-react';
import { IconEye, IconFile, IconLink, IconPlayCircle } from '@arco-design/web-react/icon';
import { formatNumber, formatMoney, formatPercent, formatDate } from '@lania-pro-components/utils';
import type { ReadonlyRenderer, ReadonlyRendererRegistry, ReadonlyRenderConfig } from '../types';

/** 选项类型 */
interface OptionItem {
  label: string;
  value: string | number;
  [key: string]: unknown;
}

/** 媒体资源（图片/视频） */
interface MediaItem {
  url: string;
  [key: string]: unknown;
}

/** 文件列表项 */
interface FileItem {
  name: string;
  url: string;
  [key: string]: unknown;
}

// const { Text } = Typography;

// ==================== 内联格式器（原 shared formatters） ====================

/** 默认空值文本 */
const INLINE_EMPTY = '--';

/**
 * 内联文本渲染
 */
function inlineRenderText(
  value: unknown,
  options: {
    emptyText?: string;
    maxLength?: number;
    ellipsis?: string;
    preserveNewlines?: boolean;
    prefix?: ReactNode;
    suffix?: ReactNode;
  } = {},
): ReactNode {
  const { emptyText = INLINE_EMPTY, maxLength, ellipsis = '...', preserveNewlines = false, prefix, suffix } = options;
  if (value === null || value === undefined || value === '') {
    return wrapAffixInline(emptyText, prefix, suffix);
  }
  let text = String(value);
  if (maxLength && text.length > maxLength) {
    text = text.slice(0, maxLength) + ellipsis;
  }
  if (preserveNewlines) {
    const lines = text.split('\n');
    return wrapAffixInline(
      lines.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      )),
      prefix,
      suffix,
    );
  }
  return wrapAffixInline(text, prefix, suffix);
}

function wrapAffixInline(content: ReactNode, prefix?: ReactNode, suffix?: ReactNode): ReactNode {
  if (!prefix && !suffix) return content;
  return (
    <span>
      {prefix && <span style={{ marginRight: 4 }}>{prefix}</span>}
      {content}
      {suffix && <span style={{ marginLeft: 4 }}>{suffix}</span>}
    </span>
  );
}

/**
 * 内联数字渲染
 */
function inlineRenderNumber(
  value: unknown,
  options: { precision?: number; thousandsSeparator?: boolean; emptyText?: string } = {},
): ReactNode {
  const { precision = 0, thousandsSeparator = true, emptyText = INLINE_EMPTY } = options;
  if (value === null || value === undefined || value === '') return <>{emptyText}</>;
  return <>{formatNumber(value as string | number, { precision, thousandsSeparator })}</>;
}

/**
 * 内联货币渲染
 */
function inlineRenderMoney(
  value: unknown,
  options: { symbol?: string; precision?: number; thousandsSeparator?: boolean; emptyText?: string } = {},
): ReactNode {
  const { symbol = '¥', precision = 2, thousandsSeparator = true, emptyText = INLINE_EMPTY } = options;
  if (value === null || value === undefined || value === '') return <>{emptyText}</>;
  return (
    <span style={{ fontFamily: 'monospace' }}>
      {formatMoney(value as string | number, symbol, { precision, thousandsSeparator })}
    </span>
  );
}

/**
 * 内联百分比渲染
 */
function inlineRenderPercent(value: unknown, options: { precision?: number; emptyText?: string } = {}): ReactNode {
  const { precision = 2, emptyText = INLINE_EMPTY } = options;
  if (value === null || value === undefined || value === '') return <>{emptyText}</>;
  return <>{formatPercent(value as string | number, { precision })}</>;
}

/**
 * 内联日期渲染
 */
function inlineRenderDate(value: unknown, options: { format?: string; emptyText?: string } = {}): ReactNode {
  const { format = 'YYYY-MM-DD', emptyText = INLINE_EMPTY } = options;
  if (!value) return <>{emptyText}</>;
  return <>{formatDate(value as string | number | Date, format)}</>;
}

/**
 * 内联选项渲染
 */
function inlineRenderOption(
  value: unknown,
  options: Array<{ value: string | number; label: ReactNode }> = [],
  renderOptions: { emptyText?: string; separator?: string; tagMode?: boolean; tagColors?: Record<string, string> } = {},
): ReactNode {
  const { emptyText = INLINE_EMPTY, separator = ', ', tagMode, tagColors } = renderOptions;
  if (value === null || value === undefined || value === '') return <>{emptyText}</>;
  const getLabel = (v: unknown): ReactNode => {
    const opt = options.find((o) => o.value === v);
    return opt?.label ?? String(v);
  };
  if (Array.isArray(value)) {
    if (value.length === 0) return <>{emptyText}</>;
    const labels = value.map((v) => getLabel(v));
    if (tagMode) {
      return (
        <Space wrap>
          {labels.map((label, i) => (
            <Tag key={i} color={tagColors?.[String(value[i])]}>
              {label}
            </Tag>
          ))}
        </Space>
      );
    }
    return <>{labels.join(separator)}</>;
  }
  const label = getLabel(value);
  if (tagMode) return <Tag color={tagColors?.[String(value)]}>{label}</Tag>;
  return <>{String(label)}</>;
}

/**
 * 内联 Switch 渲染
 */
function inlineRenderSwitch(value: unknown, options: { trueText?: string; falseText?: string } = {}): ReactNode {
  const { trueText = '是', falseText = '否' } = options;
  if (value === null || value === undefined || value === '') return <>{INLINE_EMPTY}</>;
  const isChecked = value === true || value === 'true' || value === 1 || value === '1';
  return <Tag color={isChecked ? 'green' : 'gray'}>{isChecked ? trueText : falseText}</Tag>;
}

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
  if (!prefix && !suffix) return content;
  return (
    <span>
      {prefix && <span style={{ marginRight: 4 }}>{prefix}</span>}
      {content}
      {suffix && <span style={{ marginLeft: 4 }}>{suffix}</span>}
    </span>
  );
}

// ========== 基础渲染器 ==========

/**
 * 文本渲染器
 */
export const textRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const rendered = inlineRenderText(value, {
    emptyText: config.emptyText || DEFAULT_EMPTY_TEXT,
    maxLength: config.maxLength,
    ellipsis: config.ellipsis,
    prefix: config.prefix,
    suffix: config.suffix,
  });
  return <span>{rendered}</span>;
};

/**
 * 多行文本渲染器
 */
export const textareaRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const rendered = inlineRenderText(value, {
    emptyText: config.emptyText || DEFAULT_EMPTY_TEXT,
    preserveNewlines: true,
    prefix: config.prefix,
    suffix: config.suffix,
  });
  return <span>{rendered}</span>;
};

/**
 * 选项渲染器
 */
export const optionRenderer: ReadonlyRenderer = (value, options, config = {}) => {
  const rendered = inlineRenderOption(value, (options ?? []) as OptionItem[], {
    emptyText: config.emptyText || DEFAULT_EMPTY_TEXT,
    separator: config.separator,
    tagMode: config.mode === 'tag',
    tagColors: config.tagColors,
  });
  return <span>{rendered}</span>;
};

/**
 * 多选框渲染器
 */
export const checkboxRenderer: ReadonlyRenderer = (value, options, config = {}) => {
  return optionRenderer(value, options, { ...config, mode: 'tag' });
};

/**
 * Switch 渲染器
 */
export const switchRenderer: ReadonlyRenderer = (
  value,
  _options,
  _config = {},
  componentProps?: Record<string, unknown>,
) => {
  const { checkedText, uncheckedText, trueText, falseText } = (componentProps ?? {}) as Record<
    string,
    string | undefined
  >;
  const rendered = inlineRenderSwitch(value, {
    trueText: checkedText || trueText || '是',
    falseText: uncheckedText || falseText || '否',
  });
  return <span>{rendered}</span>;
};

/**
 * 日期渲染器
 */
export const dateRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const rendered = inlineRenderDate(value, {
    format: config.format || 'YYYY-MM-DD',
    emptyText: config.emptyText || DEFAULT_EMPTY_TEXT,
  });
  return <span>{rendered}</span>;
};

/**
 * 时间渲染器
 */
export const timeRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const formatted = inlineRenderDate(value, {
    format: config.format || 'HH:mm:ss',
    emptyText: config.emptyText || DEFAULT_EMPTY_TEXT,
  });
  return <span>{formatted}</span>;
};

/**
 * 日期时间渲染器
 */
export const dateTimeRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const formatted = inlineRenderDate(value, {
    format: config.format || 'YYYY-MM-DD HH:mm:ss',
    emptyText: config.emptyText || DEFAULT_EMPTY_TEXT,
  });
  return <span>{formatted}</span>;
};

/**
 * 数字渲染器
 */
export const numberRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const rendered = inlineRenderNumber(value, {
    precision: config.precision ?? 2,
    thousandsSeparator: config.thousands !== false,
    emptyText: config.emptyText || DEFAULT_EMPTY_TEXT,
  });
  return <span>{rendered}</span>;
};

/**
 * 百分比渲染器
 */
export const percentageRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const num = Number(value);
  if (isNaN(num)) return <span>{String(value)}</span>;
  const rendered = inlineRenderPercent(value, {
    precision: config.precision ?? 2,
    emptyText: config.emptyText || DEFAULT_EMPTY_TEXT,
  });
  return <span>{rendered}</span>;
};

/**
 * 货币渲染器
 */
export const currencyRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const num = Number(value);
  if (isNaN(num)) return <span>{String(value)}</span>;
  const rendered = inlineRenderMoney(value, {
    symbol: config.currencySymbol || '¥',
    precision: config.precision ?? 2,
    thousandsSeparator: config.thousands ?? true,
    emptyText: config.emptyText || DEFAULT_EMPTY_TEXT,
  });
  return <span>{rendered}</span>;
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

  const images: unknown[] = Array.isArray(value) ? value : [value];
  const urls: string[] = images
    .map((item: unknown): string | undefined => (typeof item === 'string' ? item : (item as MediaItem | null)?.url))
    .filter((url): url is string => !!url);

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

  const videos: unknown[] = Array.isArray(value) ? value : [value];
  const urls: string[] = videos
    .map((item: unknown): string | undefined => (typeof item === 'string' ? item : (item as MediaItem | null)?.url))
    .filter((url): url is string => !!url);

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

  const files: unknown[] = Array.isArray(value) ? value : [value];
  const fileList: FileItem[] = files
    .map((item: unknown): FileItem | null => {
      if (typeof item === 'string') {
        return { name: item.split('/').pop() || item, url: item };
      }
      const maybeFile = item as FileItem | null;
      if (maybeFile && typeof maybeFile.url === 'string') {
        return { name: maybeFile.name || maybeFile.url, url: maybeFile.url };
      }
      return null;
    })
    .filter((f): f is FileItem => f !== null);

  if (fileList.length === 0) {
    return <span>{withAffix(DEFAULT_EMPTY_TEXT, config)}</span>;
  }

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      {fileList.map((file: FileItem, index: number) => (
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

  const label = map[String(value)] ?? String(value);
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

  const label = map[String(value).toLowerCase()] ?? String(value);
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

  const label = map[String(value).toLowerCase()] ?? String(value);
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

  const label = map[String(value).toLowerCase()] ?? String(value);
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

  const status = statusMap[String(value).toLowerCase()] ?? {
    label: String(value),
    color: 'gray' as const,
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
