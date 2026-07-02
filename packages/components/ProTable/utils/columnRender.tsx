import React, { ReactNode, useState } from 'react';
import {
  Tag,
  Tooltip,
  Progress,
  Avatar,
  Typography,
  Space,
  Button,
  Image,
  Message,
  Table,
  Empty,
} from '@arco-design/web-react';
import { IconCopy, IconLink, IconEye } from '@arco-design/web-react/icon';
import dayjs from 'dayjs';
import type { TableColumnProps } from '@arco-design/web-react';
import type {
  ProColumnType,
  ProColumnValueType,
  DateFormatType,
  OprToolConfig,
  ProTableProps,
  CustomCellRenderer,
  CustomRendererRegistry,
  ProTableNEventHandlers,
} from '../types';
import { OprActionButtons } from '../features/ActionButtonRenderer';

const { Text } = Typography;

/**
 * 拷贝文本到剪贴板
 */
export const copyToClipboard = (text: string) => {
  if (!text) {
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        Message.success('复制成功');
      })
      .catch(() => {
        fallbackCopyToClipboard(text);
      });
  } else {
    fallbackCopyToClipboard(text);
  }
};

/**
 * 降级复制方案（兼容旧浏览器）
 */
const fallbackCopyToClipboard = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      Message.success('复制成功');
    } else {
      Message.error('复制失败');
    }
  } catch (err) {
    Message.error('复制失败');
  }

  document.body.removeChild(textArea);
};

/**
 * 获取嵌套对象的值
 */
export const getNestedValue = (obj: any, path: string | string[]): any => {
  if (!obj) {
    return undefined;
  }
  const keys = Array.isArray(path) ? path : path.split('.');
  return keys.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

/**
 * 格式化数字为千分位
 */
export const formatNumber = (
  value: number | string,
  options: {
    precision?: number;
    thousandsSeparator?: boolean;
  } = {},
): string => {
  const { precision = 0, thousandsSeparator = true } = options;
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return String(value);
  }

  let result = num.toFixed(precision);

  if (thousandsSeparator) {
    const parts = result.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    result = parts.join('.');
  }

  return result;
};

/**
 * 格式化货币
 */
export const formatMoney = (
  value: number | string,
  symbol = '¥',
  options: {
    precision?: number;
    thousandsSeparator?: boolean;
  } = {},
): string => {
  const formatted = formatNumber(value, {
    precision: 2,
    thousandsSeparator: true,
    ...options,
  });
  return `${symbol}${formatted}`;
};

/**
 * 格式化百分比
 */
export const formatPercent = (
  value: number | string,
  options: {
    precision?: number;
    showSymbol?: boolean;
  } = {},
): string => {
  const { precision = 2, showSymbol = true } = options;
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return String(value);
  }

  const result = num.toFixed(precision);
  return showSymbol ? `${result}%` : result;
};

/**
 * 格式化日期
 */
export const formatDate = (value: string | number | Date, format: DateFormatType = 'YYYY-MM-DD'): string => {
  if (!value) {
    return '-';
  }
  const date = dayjs(value);
  if (!date.isValid()) {
    return String(value);
  }
  return date.format(format);
};

/**
 * 获取空值显示文本
 */
const getEmptyText = (column: ProColumnType): ReactNode => column.emptyText ?? '--';

/**
 * 渲染文本类型
 */
const renderText = (text: any, column: ProColumnType): ReactNode => {
  const { ellipsis, copyable } = column;
  const emptyText = getEmptyText(column);
  let content: ReactNode = text ?? emptyText;

  if (ellipsis) {
    content = (
      <Tooltip content={String(text)}>
        <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
          {content}
        </Text>
      </Tooltip>
    );
  }

  if (copyable && text) {
    content = (
      <Space size={4} style={{ margin: 0, padding: 0 }}>
        {content}
        <IconCopy style={{ cursor: 'pointer', color: '#86909c' }} onClick={() => copyToClipboard(String(text))} />
      </Space>
    );
  }

  return content;
};

/**
 * 渲染数字类型
 */
const renderNumber = (text: any, column: ProColumnType): ReactNode => {
  const { precision = 0, thousandsSeparator = true } = column;
  const emptyText = getEmptyText(column);

  if (text === null || text === undefined || text === '') {
    return emptyText;
  }

  return formatNumber(text, { precision, thousandsSeparator });
};

/**
 * 渲染货币类型
 */
const renderMoney = (text: any, column: ProColumnType): ReactNode => {
  const { moneySymbol = '¥', precision = 2, thousandsSeparator = true } = column;
  const emptyText = getEmptyText(column);

  if (text === null || text === undefined || text === '') {
    return emptyText;
  }

  return (
    <Text style={{ fontFamily: 'monospace', margin: 0, padding: 0 }}>
      {formatMoney(text, moneySymbol, { precision, thousandsSeparator })}
    </Text>
  );
};

/**
 * 渲染百分比类型
 */
const renderPercent = (text: any, column: ProColumnType): ReactNode => {
  const { precision = 2 } = column;
  const emptyText = getEmptyText(column);

  if (text === null || text === undefined || text === '') {
    return emptyText;
  }

  const num = typeof text === 'string' ? parseFloat(text) : text;
  let color: string | undefined;

  if (num > 0) {
    color = '#00b42a';
  } else if (num < 0) {
    color = '#f53f3f';
  }

  return (
    <Text style={{ color, fontFamily: 'monospace', margin: 0, padding: 0 }}>{formatPercent(text, { precision })}</Text>
  );
};

/**
 * 渲染日期类型
 */
const renderDate = (text: any, column: ProColumnType): ReactNode => {
  const { dateFormat = 'YYYY-MM-DD', ellipsis, copyable } = column;
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  let content: ReactNode = formatDate(text, dateFormat);

  if (ellipsis) {
    content = (
      <Tooltip content={formatDate(text, dateFormat)}>
        <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
          {content}
        </Text>
      </Tooltip>
    );
  }

  if (copyable && text) {
    content = (
      <Space size={4} style={{ margin: 0, padding: 0 }}>
        {content}
        <IconCopy style={{ cursor: 'pointer', color: '#86909c' }} onClick={() => copyToClipboard(String(text))} />
      </Space>
    );
  }

  return content;
};

/**
 * 渲染日期时间类型
 */
const renderDateTime = (text: any, column: ProColumnType): ReactNode => {
  const { dateFormat = 'YYYY-MM-DD HH:mm:ss', ellipsis, copyable } = column;
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  let content: ReactNode = formatDate(text, dateFormat);

  if (ellipsis) {
    content = (
      <Tooltip content={formatDate(text, dateFormat)}>
        <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
          {content}
        </Text>
      </Tooltip>
    );
  }

  if (copyable && text) {
    content = (
      <Space size={4} style={{ margin: 0, padding: 0 }}>
        {content}
        <IconCopy style={{ cursor: 'pointer', color: '#86909c' }} onClick={() => copyToClipboard(String(text))} />
      </Space>
    );
  }

  return content;
};

/**
 * 渲染时间类型
 */
const renderTime = (text: any, column: ProColumnType): ReactNode => {
  const { dateFormat = 'HH:mm:ss', ellipsis, copyable } = column;
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  let content: ReactNode = formatDate(text, dateFormat);

  if (ellipsis) {
    content = (
      <Tooltip content={formatDate(text, dateFormat)}>
        <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
          {content}
        </Text>
      </Tooltip>
    );
  }

  if (copyable && text) {
    content = (
      <Space size={4} style={{ margin: 0, padding: 0 }}>
        {content}
        <IconCopy style={{ cursor: 'pointer', color: '#86909c' }} onClick={() => copyToClipboard(String(text))} />
      </Space>
    );
  }

  return content;
};

/**
 * 渲染日期范围类型
 */
const renderDateRange = (text: any, column: ProColumnType): ReactNode => {
  const { dateFormat = 'YYYY-MM-DD', ellipsis, copyable } = column;
  const emptyText = getEmptyText(column);

  if (!Array.isArray(text) || text.length < 2) {
    return emptyText;
  }

  let content: ReactNode = `${formatDate(text[0], dateFormat)} ~ ${formatDate(text[1], dateFormat)}`;

  if (ellipsis) {
    content = (
      <Tooltip content={content}>
        <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
          {content}
        </Text>
      </Tooltip>
    );
  }

  if (copyable && text) {
    content = (
      <Space size={4} style={{ margin: 0, padding: 0 }}>
        {content}
        <IconCopy style={{ cursor: 'pointer', color: '#86909c' }} onClick={() => copyToClipboard(String(content))} />
      </Space>
    );
  }

  return content;
};

/**
 * 渲染日期时间范围类型
 */
const renderDateTimeRange = (text: any, column: ProColumnType): ReactNode => {
  const { dateFormat = 'YYYY-MM-DD HH:mm:ss', ellipsis, copyable } = column;
  const emptyText = getEmptyText(column);

  if (!Array.isArray(text) || text.length < 2) {
    return emptyText;
  }

  let content: ReactNode = `${formatDate(text[0], dateFormat)} ~ ${formatDate(text[1], dateFormat)}`;

  if (ellipsis) {
    content = (
      <Tooltip content={content}>
        <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
          {content}
        </Text>
      </Tooltip>
    );
  }

  if (copyable && text) {
    content = (
      <Space size={4} style={{ margin: 0, padding: 0 }}>
        {content}
        <IconCopy style={{ cursor: 'pointer', color: '#86909c' }} onClick={() => copyToClipboard(String(content))} />
      </Space>
    );
  }

  return content;
};

/**
 * 渲染选择类型
 */
const renderSelect = (text: any, column: ProColumnType): ReactNode => {
  const { valueEnum } = column;
  const emptyText = getEmptyText(column);

  if (valueEnum) {
    const config = valueEnum[text];
    if (!config) {
      return text ?? emptyText;
    }
    return <span style={{ color: config.color }}>{config.text}</span>;
  }

  return text ?? emptyText;
};

/**
 * 标签颜色映射表
 */
const tagColorMap: Record<string, string> = {
  success: 'green',
  error: 'red',
  warning: 'orange',
  info: 'blue',
  default: 'gray',
  red: 'red',
  orange: 'orange',
  yellow: 'yellow',
  green: 'green',
  cyan: 'cyan',
  blue: 'blue',
  purple: 'purple',
  pink: 'pink',
  gray: 'gray',
  active: 'green',
  inactive: 'red',
  pending: 'orange',
  enabled: 'green',
  disabled: 'gray',
  online: 'green',
  offline: 'gray',
  running: 'green',
  stopped: 'red',
  completed: 'green',
  failed: 'red',
  processing: 'blue',
};

/**
 * 获取标签颜色
 */
const getTagColor = (colorOrStatus?: string): string | undefined => {
  if (!colorOrStatus) {
    return undefined;
  }

  const validColors = [
    'red',
    'orangered',
    'orange',
    'gold',
    'lime',
    'green',
    'cyan',
    'blue',
    'arcoblue',
    'purple',
    'pinkpurple',
    'magenta',
    'gray',
  ];
  if (validColors.includes(colorOrStatus)) {
    return colorOrStatus;
  }

  return tagColorMap[colorOrStatus.toLowerCase()];
};

/**
 * 渲染标签类型
 */
const renderTag = (text: any, column: ProColumnType): ReactNode => {
  const { valueEnum } = column;
  const emptyText = getEmptyText(column);

  if (valueEnum && text) {
    const config = valueEnum[text];
    if (config) {
      const color = getTagColor(config.color || config.status);
      return <Tag color={color}>{config.text}</Tag>;
    }
  }

  if (!text) {
    return emptyText;
  }

  return <Tag>{text}</Tag>;
};

/**
 * 渲染头像类型
 */
const renderAvatar = (text: any, column: ProColumnType): ReactNode => {
  const { componentProps } = column;
  const [visible, setVisible] = useState(false);
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  const isImageUrl = typeof text === 'string' && (text.startsWith('http') || text.startsWith('data:'));
  const previewEnabled = componentProps?.preview !== false;

  if (isImageUrl) {
    return (
      <>
        <Avatar
          size={componentProps?.size || 32}
          style={{ cursor: previewEnabled ? 'pointer' : 'default' }}
          onClick={() => previewEnabled && setVisible(true)}
        >
          <img src={text} alt='avatar' />
        </Avatar>
        {previewEnabled && <Image.Preview src={text} visible={visible} onVisibleChange={setVisible} />}
      </>
    );
  }

  return <Avatar size={componentProps?.size || 32}>{text}</Avatar>;
};

/**
 * 渲染图片类型
 */
const renderImage = (text: any, column: ProColumnType): ReactNode => {
  const { componentProps } = column;
  const [visible, setVisible] = useState(false);
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  const src = typeof text === 'string' ? text : text?.url || text?.src;

  if (!src) {
    return emptyText;
  }

  const width = componentProps?.width || 60;
  const height = componentProps?.height || 60;
  const previewEnabled = componentProps?.preview !== false;

  return (
    <>
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          width,
          height,
          cursor: previewEnabled ? 'pointer' : 'default',
        }}
        onClick={() => previewEnabled && setVisible(true)}
      >
        <img
          src={src}
          alt='preview'
          style={{
            width: '100%',
            height: '100%',
            objectFit: componentProps?.objectFit || 'cover',
            borderRadius: componentProps?.borderRadius || 4,
          }}
        />
        {previewEnabled && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              opacity: 0,
              transition: 'opacity 0.2s',
              borderRadius: componentProps?.borderRadius || 4,
            }}
            className='image-preview-overlay'
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0';
            }}
          >
            <IconEye style={{ color: '#fff', fontSize: 20 }} />
          </div>
        )}
      </div>
      {previewEnabled && <Image.Preview src={src} visible={visible} onVisibleChange={setVisible} />}
    </>
  );
};

/**
 * 渲染链接类型
 */
const renderLink = (text: any, column: ProColumnType): ReactNode => {
  const { componentProps } = column;
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  const href = typeof text === 'string' ? text : componentProps?.href;

  return (
    <a
      href={href}
      target={componentProps?.target || '_blank'}
      rel='noopener noreferrer'
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      {componentProps?.text || text}
      <IconLink />
    </a>
  );
};

/**
 * 渲染进度条类型
 */
const renderProgress = (text: any, column: ProColumnType): ReactNode => {
  const { componentProps } = column;
  const emptyText = getEmptyText(column);

  if (text === null || text === undefined) {
    return emptyText;
  }

  const percent = typeof text === 'number' ? text : parseFloat(text);

  if (isNaN(percent)) {
    return emptyText;
  }

  const { size: _size, ...restComponentProps } = componentProps || {};

  return <Progress percent={Math.min(100, Math.max(0, percent))} size='small' {...restComponentProps} />;
};

/**
 * 渲染代码类型
 */
const renderCode = (text: any, column: ProColumnType): ReactNode => {
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: '4px 8px',
        background: '#f2f3f5',
        borderRadius: 4,
        fontSize: 12,
        fontFamily: 'monospace',
        maxWidth: 300,
        overflow: 'auto',
      }}
    >
      <code>{typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text)}</code>
    </pre>
  );
};

/**
 * 渲染 JSON 类型
 */
const renderJson = (text: any, column: ProColumnType): ReactNode => {
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  const jsonStr = typeof text === 'object' ? JSON.stringify(text, null, 2) : text;

  return (
    <Tooltip content={jsonStr}>
      <Text
        ellipsis
        style={{
          maxWidth: column.width || 200,
          fontFamily: 'monospace',
          margin: 0,
          padding: 0,
        }}
      >
        {jsonStr}
      </Text>
    </Tooltip>
  );
};

/**
 * 渲染文本域类型
 */
const renderTextarea = (text: any, column: ProColumnType): ReactNode => {
  const { ellipsis } = column;
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  if (ellipsis) {
    return (
      <Tooltip content={String(text)}>
        <Text ellipsis style={{ maxWidth: column.width || 300, margin: 0, padding: 0 }}>
          {text}
        </Text>
      </Tooltip>
    );
  }

  return (
    <div
      style={{
        maxHeight: 100,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {text}
    </div>
  );
};

/**
 * 渲染操作按钮组类型
 */
const renderOpr = (
  text: any,
  column: ProColumnType,
  record?: any,
  index?: number,
  action?: any,
  handlers?: ProTableNEventHandlers,
  refreshTable?: () => void,
): ReactNode => {
  const { oprTools, actions } = column;

  // 优先使用新的 actions 配置
  if (actions?.length) {
    return (
      <OprActionButtons
        actions={actions}
        record={record}
        index={index ?? 0}
        action={action}
        handlers={handlers || {}}
        refreshTable={refreshTable || (() => action?.reload())}
      />
    );
  }

  // 兼容旧的 oprTools 配置
  if (!oprTools?.length) {
    return null;
  }

  return (
    <Space size={8} style={{ margin: 0, padding: 0 }}>
      {oprTools.map((tool: OprToolConfig) => {
        const visible = typeof tool.visible === 'function' ? tool.visible(record) : tool.visible !== false;

        if (!visible) {
          return null;
        }

        const disabled = typeof tool.disabled === 'function' ? tool.disabled(record) : tool.disabled === true;

        return (
          <Button
            key={tool.key}
            {...tool.buttonProps}
            type={tool.type || 'text'}
            status={tool.status}
            disabled={disabled}
            onClick={() => tool.onClick?.(record, index ?? 0, action)}
          >
            {tool.text}
          </Button>
        );
      })}
    </Space>
  );
};

/**
 * 渲染子表格类型
 */
const renderProTable = (text: any, column: ProColumnType, record?: any): ReactNode => {
  const { proTableConfig } = column;
  const emptyText = getEmptyText(column);

  if (!proTableConfig) {
    return emptyText;
  }

  const {
    columns,
    dataSource,
    dataPath,
    tableProps = {},
    title,
    bordered = true,
    size = 'small',
    pagination = false,
    emptyText: tableEmptyText = '暂无数据',
  } = proTableConfig;

  let subTableData: any[] = [];
  if (dataPath) {
    subTableData = getNestedValue(record, dataPath) || [];
  } else if (typeof dataSource === 'function') {
    subTableData = dataSource(record) || [];
  } else if (Array.isArray(dataSource)) {
    subTableData = dataSource;
  } else if (Array.isArray(text)) {
    subTableData = text;
  }

  const tableColumns: TableColumnProps<any>[] = columns.map((col) => ({
    title: col.title,
    dataIndex: Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex,
    key: col.key || (Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex),
    width: col.width,
    align: col.align,
    fixed: col.fixed,
    ellipsis: col.ellipsis,
    render: (value: any, row: any, idx: number) => {
      if (col.render) {
        return col.render(value, row, idx, {} as any, col);
      }
      return value ?? col.emptyText ?? '-';
    },
  }));

  const renderTitle = () => {
    if (!title) {
      return null;
    }
    if (typeof title === 'function') {
      return title(record);
    }
    return title;
  };

  return (
    <div style={{ width: '100%' }}>
      {title && <div style={{ marginBottom: 8, fontWeight: 500 }}>{renderTitle()}</div>}
      <Table
        columns={tableColumns}
        data={subTableData}
        border={bordered}
        size={size}
        pagination={pagination}
        noDataElement={<Empty description={tableEmptyText} />}
        {...tableProps}
      />
    </div>
  );
};

/**
 * 渲染序号类型
 */
const renderIndex = (text: any, column: ProColumnType, record?: any, index?: number): ReactNode => {
  const { valueType } = column;
  const currentIndex = (index ?? 0) + 1;

  if (valueType === 'indexBorder') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: 4,
          border: '1px solid #e5e6eb',
          fontSize: 12,
          fontWeight: 500,
          color: '#1d2129',
        }}
      >
        {currentIndex}
      </span>
    );
  }

  // 普通序号
  return (
    <span
      style={{
        fontSize: 14,
        color: '#4e5969',
      }}
    >
      {currentIndex}
    </span>
  );
};

/**
 * 值类型渲染器映射
 */
const valueTypeRenderers: Record<
  Exclude<ProColumnValueType, 'opr' | 'proTable'>,
  (text: any, column: ProColumnType) => ReactNode
> = {
  text: renderText,
  number: renderNumber,
  money: renderMoney,
  percent: renderPercent,
  date: renderDate,
  dateTime: renderDateTime,
  time: renderTime,
  dateRange: renderDateRange,
  dateTimeRange: renderDateTimeRange,
  select: renderSelect,
  radio: renderSelect,
  checkbox: renderSelect,
  switch: renderTag,
  tag: renderTag,
  avatar: renderAvatar,
  image: renderImage,
  link: renderLink,
  progress: renderProgress,
  code: renderCode,
  json: renderJson,
  textarea: renderTextarea,
  enum: renderText,
  index: renderIndex,
  indexBorder: renderIndex,
};

/**
 * 自定义单元格渲染器注册表
 */
class CustomCellRendererRegistry implements CustomRendererRegistry {
  private renderers: Map<string, CustomCellRenderer> = new Map();

  register(type: string, renderer: CustomCellRenderer): void {
    if (this.renderers.has(type)) {
      console.warn(`Custom cell renderer with type "${type}" already exists, it will be overwritten.`);
    }
    this.renderers.set(type, renderer);
  }

  unregister(type: string): void {
    this.renderers.delete(type);
  }

  get(type: string): CustomCellRenderer | undefined {
    return this.renderers.get(type);
  }

  has(type: string): boolean {
    return this.renderers.has(type);
  }

  clear(): void {
    this.renderers.clear();
  }
}

export const customRendererRegistry = new CustomCellRendererRegistry();

/**
 * 注册自定义单元格渲染器
 * @param type 渲染器类型标识
 * @param renderer 渲染器函数
 * @example
 * ```tsx
 * import { registerCellRenderer } from '@/components/ProTable';
 *
 * // 注册一个自定义的评分渲染器
 * registerCellRenderer('rate', (text, column, record, index) => {
 *   return <Rate value={text} disabled />;
 * });
 *
 * // 在列配置中使用
 * const columns = [
 *   {
 *     title: '评分',
 *     dataIndex: 'rating',
 *     valueType: 'rate', // 使用自定义渲染器
 *   },
 * ];
 * ```
 */
export const registerCellRenderer = (type: string, renderer: CustomCellRenderer): void => {
  customRendererRegistry.register(type, renderer);
};

/**
 * 注销自定义单元格渲染器
 * @param type 渲染器类型标识
 */
export const unregisterCellRenderer = (type: string): void => {
  customRendererRegistry.unregister(type);
};

/**
 * 批量注册自定义单元格渲染器
 * @param renderers 渲染器映射对象
 * @example
 * ```tsx
 * import { registerCellRenderers } from '@/components/ProTable';
 *
 * registerCellRenderers({
 *   rate: (text, column, record, index) => <Rate value={text} disabled />,
 *   color: (text, column, record, index) => (
 *     <ColorPicker value={text} disabled />
 *   ),
 * });
 * ```
 */
export const registerCellRenderers = (renderers: Record<string, CustomCellRenderer>): void => {
  Object.entries(renderers).forEach(([type, renderer]) => {
    customRendererRegistry.register(type, renderer);
  });
};

/**
 * 获取已注册的单元格渲染器
 * @param type 渲染器类型标识
 * @returns 渲染器函数或 undefined
 */
export const getCellRenderer = (type: string): CustomCellRenderer | undefined => customRendererRegistry.get(type);

/**
 * 检查是否已注册指定类型的渲染器
 * @param type 渲染器类型标识
 * @returns 是否已注册
 */
export const hasCellRenderer = (type: string): boolean => customRendererRegistry.has(type);

/**
 * 根据 valueType 格式化 tooltip 内容
 */
const getTooltipContentByValueType = (text: any, column: ProColumnType): ReactNode => {
  const { valueType = 'text', valueEnum } = column;

  if (text === null || text === undefined || text === '') {
    return '-';
  }

  switch (valueType) {
    case 'number': {
      const { precision = 0, thousandsSeparator = true } = column;
      return formatNumber(text, { precision, thousandsSeparator });
    }
    case 'money': {
      const { moneySymbol = '¥', precision = 2, thousandsSeparator = true } = column;
      return formatMoney(text, moneySymbol, { precision, thousandsSeparator });
    }
    case 'percent': {
      const { precision = 2 } = column;
      return formatPercent(text, { precision });
    }
    case 'date': {
      const { dateFormat = 'YYYY-MM-DD' } = column;
      return formatDate(text, dateFormat);
    }
    case 'dateTime': {
      const { dateFormat = 'YYYY-MM-DD HH:mm:ss' } = column;
      return formatDate(text, dateFormat);
    }
    case 'time': {
      const { dateFormat = 'HH:mm:ss' } = column;
      return formatDate(text, dateFormat);
    }
    case 'dateRange': {
      const { dateFormat = 'YYYY-MM-DD' } = column;
      if (Array.isArray(text) && text.length >= 2) {
        return `${formatDate(text[0], dateFormat)} ~ ${formatDate(text[1], dateFormat)}`;
      }
      break;
    }
    case 'dateTimeRange': {
      const { dateFormat = 'YYYY-MM-DD HH:mm:ss' } = column;
      if (Array.isArray(text) && text.length >= 2) {
        return `${formatDate(text[0], dateFormat)} ~ ${formatDate(text[1], dateFormat)}`;
      }
      break;
    }
    case 'select':
    case 'radio':
    case 'checkbox':
    case 'tag':
    case 'switch': {
      if (valueEnum?.[text]) {
        return valueEnum[text].text;
      }
      break;
    }
    case 'json': {
      return typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);
    }
    case 'code': {
      return typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);
    }
    default:
      break;
  }

  return String(text);
};

/**
 * 为内容添加 tooltip 包装
 */
const wrapWithTooltip = (
  content: ReactNode,
  text: any,
  column: ProColumnType,
  record?: any,
  index?: number,
): ReactNode => {
  const { cellTooltip } = column;

  if (cellTooltip === false) {
    return content;
  }

  let tooltipContent: ReactNode;

  if (typeof cellTooltip === 'function') {
    tooltipContent = cellTooltip(text, record, index);
  } else if (typeof cellTooltip === 'string') {
    tooltipContent = cellTooltip;
  } else {
    tooltipContent = getTooltipContentByValueType(text, column);
  }

  return <Tooltip content={tooltipContent}>{content}</Tooltip>;
};

/**
 * 根据值类型渲染单元格内容
 */
export const renderColumnByValueType = (
  text: any,
  column: ProColumnType,
  record?: any,
  index?: number,
  action?: any,
  handlers?: ProTableNEventHandlers,
  refreshTable?: () => void,
): ReactNode => {
  const { valueType = 'text' } = column;

  if (customRendererRegistry.has(valueType)) {
    const customRenderer = customRendererRegistry.get(valueType);
    if (customRenderer) {
      const content = customRenderer(text, column, record, index, action);
      return wrapWithTooltip(content, text, column, record, index);
    }
  }

  if (valueType === 'opr') {
    return renderOpr(text, column, record, index, action, handlers, refreshTable);
  }

  if (valueType === 'proTable') {
    return renderProTable(text, column, record);
  }

  // 处理序号类型（需要 index 参数）
  if (valueType === 'index' || valueType === 'indexBorder') {
    const content = renderIndex(text, column, record, index);
    return wrapWithTooltip(content, text, column, record, index);
  }

  const renderer = valueTypeRenderers[valueType];

  if (renderer) {
    const content = renderer(text, column);
    return wrapWithTooltip(content, text, column, record, index);
  }

  const content = text ?? '-';
  return wrapWithTooltip(content, text, column, record, index);
};

/**
 * 生成列的渲染函数
 */
export const createColumnRender =
  <T extends Record<string, any>>(
    column: ProColumnType<T>,
    action: any,
    handlers?: ProTableNEventHandlers,
    refreshTable?: () => void,
  ): ((value: any, record: T, index: number) => ReactNode) =>
  (value: any, record: T, index: number) => {
    let text = value;
    if ((text === undefined || text === null) && column.dataIndex) {
      text = getNestedValue(record, column.dataIndex);
    }

    if (column.renderText) {
      text = column.renderText(text, record, index);
    }

    const dom = renderColumnByValueType(text, column as ProColumnType, record, index, action, handlers, refreshTable);

    if (column.render) {
      return column.render(dom, record, index, action, column);
    }

    return dom;
  };

/**
 * 转换列为 Arco Table 的 columns 格式
 */
export const convertColumns = <T extends Record<string, any>>(
  columns: ProColumnType<T>[],
  action: any,
  handlers?: ProTableNEventHandlers,
  refreshTable?: () => void,
): TableColumnProps<T>[] =>
  columns
    .filter((col) => !col.hideInTable)
    .map((column) => {
      const {
        children,
        renderText,
        valueType,
        valueEnum,
        dateFormat,
        moneySymbol,
        precision,
        thousandsSeparator,
        copyable,
        ellipsis,
        hideInSearch,
        hideInTable,
        disableInSetting,
        search,
        onFilter,
        dataIndex,
        ...rest
      } = column;

      const converted: TableColumnProps<T> = {
        ...rest,
        title: valueType === 'opr' && !rest.title ? '操作' : rest.title,
        dataIndex: Array.isArray(dataIndex) ? dataIndex.join('.') : dataIndex,
        render: createColumnRender(column, action, handlers, refreshTable),
      } as TableColumnProps<T>;

      if (children && children.length > 0) {
        converted.children = convertColumns(children, action, handlers, refreshTable);
      }

      return converted;
    });
