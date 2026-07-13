/**
 * 列渲染工具模块
 *
 * 提供 ProTable 列渲染的完整解决方案：
 * - renderColumnByValueType: 根据值类型自动生成列渲染器
 * - createColumnRender: 创建自定义列渲染器
 * - convertColumns: ProColumnType → Arco TableColumnProps 转换
 * - customRendererRegistry: 自定义单元格渲染器注册系统
 *     注册：registerCellRenderer(componentType, renderer)
 *     获取：getCellRenderer(componentType)
 *
 * 内置值类型渲染器：
 * text/number/money/percent/date/dateTime/time/select/radio/checkbox/
 * switch/tag/avatar/image/link/progress/rate/color/badge
 */
/**
 * 列渲染工具模块
 *
 * 提供 ProTable 的列渲染解决方案，包含三个核心功能：
 *
 * 1. renderColumnByValueType:
 *    根据 ProColumnValueType 自动生成对应的单元格渲染器
 *    支持的渲染类型：text/number/money/percent/date/dateTime/time/select/radio/
 *    checkbox/switch/tag/avatar/image/link/progress/rate/color/badge 等
 *
 * 2. convertColumns:
 *    将 ProColumnType[] 转换为 Arco TableColumnProps[]
 *    自动注入 render 函数（基于 valueType）、search 配置等
 *
 * 3. customRendererRegistry:
 *    自定义单元格渲染器注册系统
 *    registerCellRenderer(type, renderer): 注册
 *    getCellRenderer(type): 获取
 *    用于扩展自定义渲染类型
 */
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
import type { TableProps } from '@arco-design/web-react';
import { IconCopy, IconLink, IconEye } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import type {
  ProColumnType,
  ProColumnValueType,
  CellRendererValueType,
  OprToolConfig,
  CustomCellRenderer,
  CustomRendererRegistry,
  ProTableNEventHandlers,
  ProTableActionType,
  ProTableProps,
} from '../types';
import { OprActionButtons } from '../components/ActionButtonRenderer';
import type { OprActionButtonConfig } from '../types-action-button';
import { EditableCell } from '../editable/EditableCell';
import { EditableActions } from '../editable/EditableActions';
import type { EditableTableInstance, EditableConfig } from '../editable/types';
import {
  formatNumber,
  formatMoney,
  formatPercent,
  formatDate,
  getNestedValue,
  copyToClipboard as copyToClipboardPure,
  getTagColor,
} from '@lania-pro-components/utils';
// 渲染函数已回退到组件内直接实现

const { Text } = Typography;

/**
 * 拷贝文本到剪贴板（含 Arco Message 反馈）
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (!text) {
    return;
  }
  const success = await copyToClipboardPure(text);
  if (success) {
    Message.success('复制成功');
  } else {
    Message.error('复制失败');
  }
};

/**
 * 获取空值显示文本
 */
const getEmptyText = <T = Record<string, unknown>,>(column: ProColumnType<T>): ReactNode => column.emptyText ?? '--';

/**
 * 用复制图标包裹内容
 */
const wrapWithCopy = <T = Record<string, unknown>,>(
  content: ReactNode,
  text: unknown,
  column: ProColumnType<T>,
  record?: T,
): ReactNode => {
  const { copyable, copyText } = column;
  if (!copyable || !text) {
    return content;
  }

  const handleCopy = () => {
    const copyContent = copyText && record ? copyText(text, record) : String(text);
    copyToClipboard(copyContent);
  };

  return (
    <Space size={4} style={{ margin: 0, padding: 0 }}>
      {content}
      <IconCopy style={{ cursor: 'pointer', color: '#86909c' }} onClick={handleCopy} />
    </Space>
  );
};

/**
 * 渲染文本类型
 */
const renderText = (text: unknown, column: ProColumnType): ReactNode => {
  const { ellipsis } = column;
  const emptyText = getEmptyText(column);
  let content: ReactNode = text !== null && text !== undefined ? (text as ReactNode) : emptyText;

  if (ellipsis) {
    content = (
      <Tooltip content={String(text)}>
        <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
          {content}
        </Text>
      </Tooltip>
    );
  }

  return content;
};

/**
 * 渲染数字类型
 */
const renderNumber = (text: unknown, column: ProColumnType): ReactNode => {
  const { precision = 0, thousandsSeparator = true } = column;
  if (text === null || text === undefined || text === '') return <>{getEmptyText(column)}</>;
  return <>{formatNumber(text as string | number, { precision, thousandsSeparator })}</>;
};

/**
 * 渲染货币类型
 */
const renderMoney = (text: unknown, column: ProColumnType): ReactNode => {
  const { moneySymbol = '¥', precision = 2, thousandsSeparator = true } = column;
  if (text === null || text === undefined || text === '') return <>{getEmptyText(column)}</>;
  return (
    <span style={{ fontFamily: 'monospace' }}>
      {formatMoney(text as string | number, moneySymbol, { precision, thousandsSeparator })}
    </span>
  );
};

/**
 * 渲染百分比类型
 */
const renderPercent = (text: unknown, column: ProColumnType): ReactNode => {
  const { precision = 2 } = column;
  if (text === null || text === undefined || text === '') return <>{getEmptyText(column)}</>;
  return <>{formatPercent(text as string | number, { precision })}</>;
};

/**
 * 渲染日期类型
 */
const renderDate = (text: unknown, column: ProColumnType): ReactNode => {
  const { dateFormat = 'YYYY-MM-DD', ellipsis } = column;
  const emptyText = getEmptyText(column);
  const formatted = !text ? emptyText : <>{formatDate(text as string | number | Date, dateFormat)}</>;
  return ellipsis && formatted ? (
    <Tooltip content={String(text)}>
      <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
        {formatted}
      </Text>
    </Tooltip>
  ) : (
    formatted
  );
};

/**
 * 渲染日期时间类型
 */
const renderDateTime = (text: unknown, column: ProColumnType): ReactNode => {
  const { dateFormat = 'YYYY-MM-DD HH:mm:ss', ellipsis } = column;
  const emptyText = getEmptyText(column);
  const formatted = !text ? emptyText : <>{formatDate(text as string | number | Date, dateFormat)}</>;
  return ellipsis && formatted ? (
    <Tooltip content={String(text)}>
      <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
        {formatted}
      </Text>
    </Tooltip>
  ) : (
    formatted
  );
};

/**
 * 渲染时间类型
 */
const renderTime = (text: unknown, column: ProColumnType): ReactNode => {
  const { dateFormat = 'HH:mm:ss', ellipsis } = column;
  const emptyText = getEmptyText(column);
  const formatted = !text ? emptyText : <>{formatDate(text as string | number | Date, dateFormat)}</>;
  return ellipsis && formatted ? (
    <Tooltip content={String(text)}>
      <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
        {formatted}
      </Text>
    </Tooltip>
  ) : (
    formatted
  );
};

/**
 * 渲染日期范围类型
 */
const renderDateRange = (text: unknown, column: ProColumnType): ReactNode => {
  const { dateFormat = 'YYYY-MM-DD', ellipsis } = column;
  const emptyText = getEmptyText(column);

  if (!Array.isArray(text) || text.length < 2) {
    return emptyText;
  }

  let content: ReactNode = `${formatDate(text[0] as string | number | Date, dateFormat)} ~ ${formatDate(text[1] as string | number | Date, dateFormat)}`;

  if (ellipsis) {
    content = (
      <Tooltip content={content}>
        <Text ellipsis style={{ maxWidth: column.width || 200, margin: 0, padding: 0 }}>
          {content}
        </Text>
      </Tooltip>
    );
  }

  return content;
};

/**
 * 渲染日期时间范围类型
 */
const renderDateTimeRange = (text: unknown, column: ProColumnType): ReactNode => {
  const { dateFormat = 'YYYY-MM-DD HH:mm:ss', ellipsis, copyable } = column;
  const emptyText = getEmptyText(column);

  if (!Array.isArray(text) || text.length < 2) {
    return emptyText;
  }

  let content: ReactNode = `${formatDate(text[0] as string | number | Date, dateFormat)} ~ ${formatDate(text[1] as string | number | Date, dateFormat)}`;

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
const renderSelect = (text: unknown, column: ProColumnType): ReactNode => {
  const { valueEnum } = column;
  const emptyText = getEmptyText(column);

  if (valueEnum) {
    const config = valueEnum[text as string | number];
    if (!config) {
      return text !== null && text !== undefined ? (text as ReactNode) : emptyText;
    }
    return <span style={{ color: config.color }}>{config.text}</span>;
  }

  return text !== null && text !== undefined ? (text as ReactNode) : emptyText;
};

/**
 * 渲染标签类型
 */
const renderTag = (text: unknown, column: ProColumnType): ReactNode => {
  const { valueEnum } = column;
  const emptyText = getEmptyText(column);

  if (valueEnum && text) {
    const config = valueEnum[text as string | number];
    if (config) {
      const color = getTagColor(config.color || config.status);
      return <Tag color={color}>{config.text}</Tag>;
    }
  }

  if (!text) {
    return emptyText;
  }

  return <Tag>{text as ReactNode}</Tag>;
};

/**
 * 渲染头像类型
 */
const renderAvatar = (text: unknown, column: ProColumnType): ReactNode => {
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

  return <Avatar size={componentProps?.size || 32}>{text as ReactNode}</Avatar>;
};

/**
 * 渲染图片类型
 */
const renderImage = (text: unknown, column: ProColumnType): ReactNode => {
  const { componentProps } = column;
  const [visible, setVisible] = useState(false);
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  const src =
    typeof text === 'string'
      ? text
      : (text as { url?: string; src?: string })?.url || (text as { url?: string; src?: string })?.src;

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
const renderLink = (text: unknown, column: ProColumnType): ReactNode => {
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
      {componentProps?.text || (text as ReactNode)}
      <IconLink />
    </a>
  );
};

/**
 * 渲染进度条类型
 */
const renderProgress = (text: unknown, column: ProColumnType): ReactNode => {
  const { componentProps } = column;
  const emptyText = getEmptyText(column);

  if (text === null || text === undefined) {
    return emptyText;
  }

  const percent = typeof text === 'number' ? text : parseFloat(text as string);

  if (isNaN(percent)) {
    return emptyText;
  }

  const { size, ...restComponentProps } = componentProps || {};
  const progressSize = typeof size === 'string' ? size : 'small';

  return <Progress percent={Math.min(100, Math.max(0, percent))} size={progressSize} {...restComponentProps} />;
};

/**
 * 渲染代码类型
 */
const renderCode = (text: unknown, column: ProColumnType): ReactNode => {
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
const renderJson = (text: unknown, column: ProColumnType): ReactNode => {
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  const jsonStr = typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);

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
const renderTextarea = (text: unknown, column: ProColumnType): ReactNode => {
  const { ellipsis } = column;
  const emptyText = getEmptyText(column);

  if (!text) {
    return emptyText;
  }

  if (ellipsis) {
    return (
      <Tooltip content={String(text)}>
        <Text ellipsis style={{ maxWidth: column.width || 300, margin: 0, padding: 0 }}>
          {text as ReactNode}
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
      {text as ReactNode}
    </div>
  );
};

/**
 * 渲染操作按钮组类型
 */
const renderOpr = <T = Record<string, unknown>,>(
  text: unknown,
  column: ProColumnType<T>,
  record?: T,
  index?: number,
  action?: ProTableActionType<T>,
  handlers?: ProTableNEventHandlers<T>,
  refreshTable?: () => void,
): ReactNode => {
  const { oprTools, actions } = column;

  if (actions?.length) {
    return (
      <OprActionButtons
        actions={actions as OprActionButtonConfig[]}
        record={record as Record<string, unknown>}
        index={index ?? 0}
        action={action as ProTableActionType<Record<string, unknown>>}
        handlers={(handlers as ProTableNEventHandlers<Record<string, unknown>>) || {}}
        refreshTable={refreshTable || (() => action?.reload())}
      />
    );
  }

  if (!oprTools?.length) {
    return null;
  }

  return (
    <Space size={8} style={{ margin: 0, padding: 0 }}>
      {oprTools.map((tool: OprToolConfig<T>) => {
        const visible = typeof tool.visible === 'function' && record ? tool.visible(record) : tool.visible !== false;

        if (!visible) {
          return null;
        }

        const disabled = typeof tool.disabled === 'function' && record ? tool.disabled(record) : tool.disabled === true;

        return (
          <Button
            key={tool.key}
            {...tool.buttonProps}
            type={tool.type || 'text'}
            status={tool.status}
            disabled={disabled}
            onClick={() =>
              record && tool.onClick?.(record, index ?? 0, action as ProTableActionType<Record<string, unknown>>)
            }
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
const renderProTable = <T = Record<string, unknown>,>(
  text: unknown,
  column: ProColumnType<T>,
  record?: T,
): ReactNode => {
  const { proTableConfig } = column;
  const emptyText = getEmptyText(column);

  if (!proTableConfig) {
    return emptyText;
  }

  const {
    columns,
    dataSource,
    dataPath,
    tableProps,
    title,
    bordered = true,
    size = 'small',
    pagination = false,
    emptyText: tableEmptyText = '暂无数据',
  } = proTableConfig;

  let subTableData: unknown[] = [];
  if (dataPath) {
    const nestedValue = getNestedValue(record as Record<string, unknown>, dataPath);
    subTableData = Array.isArray(nestedValue) ? nestedValue : [];
  } else if (typeof dataSource === 'function') {
    const result = record !== undefined ? dataSource(record) : undefined;
    subTableData = Array.isArray(result) ? result : [];
  } else if (Array.isArray(dataSource)) {
    subTableData = dataSource;
  } else if (Array.isArray(text)) {
    subTableData = text;
  }

  const tableColumns: TableColumnProps<unknown>[] = columns.map((col, colIdx) => {
    const dataIndexStr = Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex;
    const colKey = typeof col.key === 'string' ? col.key : undefined;
    return {
      title: col.title,
      dataIndex: dataIndexStr,
      key: colKey || dataIndexStr || `col-${colIdx}`,
      width: col.width,
      align: col.align,
      fixed: col.fixed,
      ellipsis: col.ellipsis,
      render: (value: unknown, row: unknown, idx: number) => {
        if (col.render) {
          return col.render(
            value !== null && value !== undefined ? (value as ReactNode) : '-',
            row as Record<string, unknown>,
            idx,
            {} as ProTableActionType<Record<string, unknown>>,
            col,
          );
        }
        return value !== null && value !== undefined ? (value as ReactNode) : (col.emptyText ?? '-');
      },
    };
  });

  const renderTitle = (): ReactNode => {
    if (!title) {
      return null;
    }
    if (typeof title === 'function' && record) {
      return title(record);
    }
    return title as ReactNode;
  };

  const resolvedTitle = renderTitle();

  return (
    <div style={{ width: '100%' }}>
      {resolvedTitle && <div style={{ marginBottom: 8, fontWeight: 500 }}>{resolvedTitle}</div>}
      <Table
        columns={tableColumns}
        data={subTableData}
        border={bordered}
        size={size}
        pagination={pagination}
        noDataElement={<Empty description={tableEmptyText} />}
        {...(tableProps as TableProps<unknown>)}
      />
    </div>
  );
};

/**
 * 渲染序号类型
 */
const renderIndex = <T = Record<string, unknown>,>(
  text: unknown,
  column: ProColumnType<T>,
  record?: T,
  index?: number,
): ReactNode => {
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
 * 将 ProColumnValueType 转换为单元格渲染器类型
 * radio/checkbox 映射到 select，switch 映射到 tag
 */
const toCellRendererType = (valueType: ProColumnValueType): CellRendererValueType => {
  switch (valueType) {
    case 'radio':
    case 'checkbox':
      return 'select';
    case 'switch':
      return 'tag';
    default:
      return valueType as CellRendererValueType;
  }
};

/**
 * 值类型渲染器映射 - 使用 CellRendererValueType 去除渲染层面重复的类型
 */
const valueTypeRenderers: Record<CellRendererValueType, (text: unknown, column: ProColumnType) => ReactNode> = {
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
const getTooltipContentByValueType = (text: unknown, column: ProColumnType): ReactNode => {
  const { valueType = 'text', valueEnum } = column;

  if (text === null || text === undefined || text === '') {
    return '-';
  }

  switch (valueType) {
    case 'number': {
      const { precision = 0, thousandsSeparator = true } = column;
      return formatNumber(text as string | number, { precision, thousandsSeparator });
    }
    case 'money': {
      const { moneySymbol = '¥', precision = 2, thousandsSeparator = true } = column;
      return formatMoney(text as string | number, moneySymbol, { precision, thousandsSeparator });
    }
    case 'percent': {
      const { precision = 2 } = column;
      return formatPercent(text as string | number, { precision });
    }
    case 'date': {
      const { dateFormat = 'YYYY-MM-DD' } = column;
      return formatDate(text as string | number | Date, dateFormat);
    }
    case 'dateTime': {
      const { dateFormat = 'YYYY-MM-DD HH:mm:ss' } = column;
      return formatDate(text as string | number | Date, dateFormat);
    }
    case 'time': {
      const { dateFormat = 'HH:mm:ss' } = column;
      return formatDate(text as string | number | Date, dateFormat);
    }
    case 'dateRange': {
      const { dateFormat = 'YYYY-MM-DD' } = column;
      if (Array.isArray(text) && text.length >= 2) {
        return `${formatDate(text[0] as string | number | Date, dateFormat)} ~ ${formatDate(text[1] as string | number | Date, dateFormat)}`;
      }
      break;
    }
    case 'dateTimeRange': {
      const { dateFormat = 'YYYY-MM-DD HH:mm:ss' } = column;
      if (Array.isArray(text) && text.length >= 2) {
        return `${formatDate(text[0] as string | number | Date, dateFormat)} ~ ${formatDate(text[1] as string | number | Date, dateFormat)}`;
      }
      break;
    }
    case 'select':
    case 'radio':
    case 'checkbox':
    case 'tag':
    case 'switch': {
      if (valueEnum?.[text as string | number]) {
        return valueEnum[text as string | number].text;
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
const wrapWithTooltip = <T = Record<string, unknown>,>(
  content: ReactNode,
  text: unknown,
  column: ProColumnType<T>,
  record?: T,
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
    tooltipContent = getTooltipContentByValueType(text, column as ProColumnType);
  }

  return <Tooltip content={tooltipContent}>{content}</Tooltip>;
};

/**
 * 根据值类型渲染单元格内容
 */
export const renderColumnByValueType = <T = Record<string, unknown>,>(
  text: unknown,
  column: ProColumnType<T>,
  record?: T,
  index?: number,
  action?: ProTableActionType<T>,
  handlers?: ProTableNEventHandlers<T>,
  refreshTable?: () => void,
): ReactNode => {
  const { valueType = 'text' } = column;

  if (customRendererRegistry.has(valueType)) {
    const customRenderer = customRendererRegistry.get(valueType);
    if (customRenderer) {
      const content = customRenderer(
        text,
        column as ProColumnType,
        record as Record<string, unknown>,
        index,
        action as ProTableActionType,
      );
      return wrapWithTooltip(content, text, column as ProColumnType, record as Record<string, unknown>, index);
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

  const renderer = valueTypeRenderers[toCellRendererType(valueType)];

  if (renderer) {
    const content = renderer(text, column as ProColumnType);
    return wrapWithTooltip(content, text, column as ProColumnType, record as Record<string, unknown>, index);
  }

  const content = text !== null && text !== undefined ? (text as ReactNode) : '-';
  return wrapWithTooltip(content, text, column as ProColumnType, record as Record<string, unknown>, index);
};

/**
 * 生成列的渲染函数
 */
// eslint-disable-next-line react/display-name
export const createColumnRender =
  <T extends Record<string, unknown>>(
    column: ProColumnType<T>,
    action: ProTableActionType<T>,
    handlers?: ProTableNEventHandlers<T>,
    refreshTable?: () => void,
    editableOptions?: {
      editableKeys: (string | number)[];
      editableInstance: EditableTableInstance<T>;
      editableConfig?: ProTableProps<T>['editable'];
      getRowKey: (record: T) => string | number;
    },
  ): ((value: unknown, record: T, index: number) => ReactNode) =>
  // eslint-disable-next-line react/display-name
  (value: unknown, record: T, index: number) => {
    let text: unknown = value;
    if ((text === undefined || text === null) && column.dataIndex) {
      text = getNestedValue(record as Record<string, unknown>, column.dataIndex);
    }

    if (column.renderText) {
      text = column.renderText(text, record, index);
    }

    const content = renderColumnByValueType(text, column, record, index, action, handlers, refreshTable);
    const dom = wrapWithCopy(content, text, column, record);

    let rendered = dom;
    if (column.render) {
      rendered = column.render(dom, record, index, action as ProTableActionType<Record<string, unknown>>, column);
    }

    // === 可编辑集成：列级 editable 配置 → 包裹 EditableCell ===
    if (editableOptions && column.editable && column.dataIndex) {
      const isEditing = editableOptions.editableKeys.includes(editableOptions.getRowKey(record));
      const colEditable = column.editable;
      // 转换列级 editable 配置到 EditableCellConfig
      const componentToValueType: Record<string, string> = {
        Input: 'text',
        InputPassword: 'password',
        TextArea: 'textarea',
        InputNumber: 'number',
        Select: 'select',
        DatePicker: 'date',
        DatePickerRange: 'dateRange',
        TimePicker: 'time',
        Switch: 'switch',
        Rate: 'rate',
        Slider: 'slider',
        TreeSelect: 'treeSelect',
        Cascader: 'cascader',
        Radio: 'radio',
        RadioGroup: 'radio',
        Checkbox: 'checkbox',
        CheckboxGroup: 'checkbox',
      };
      const cellConfig = (() => {
        if (typeof colEditable === 'boolean') {
          return { dataIndex: column.dataIndex, editable: colEditable };
        }
        if (typeof colEditable === 'function') {
          return { dataIndex: column.dataIndex, editable: (_v: unknown, row: T, _i: number) => colEditable(row) };
        }
        const { component, componentProps, rules, required } = colEditable;
        return {
          dataIndex: column.dataIndex,
          valueType: componentToValueType[component || ''] || column.valueType || 'text',
          fieldProps: componentProps || {},
          rules: rules || [],
          required: required || false,
          editable: true,
        };
      })();
      return (
        <EditableCell
          dataIndex={column.dataIndex}
          rowKey={editableOptions.getRowKey(record)}
          record={record}
          value={value}
          isEditing={isEditing}
          cellConfig={cellConfig}
          instance={editableOptions.editableInstance}
        >
          {rendered}
        </EditableCell>
      );
    }

    return rendered;
  };

/**
 * 转换列为 Arco Table 的 columns 格式
 */
export const convertColumns = <T extends Record<string, unknown>>(
  columns: ProColumnType<T>[],
  action: ProTableActionType<T>,
  handlers?: ProTableNEventHandlers<T>,
  refreshTable?: () => void,
  editableOptions?: {
    editableKeys: (string | number)[];
    editableInstance: EditableTableInstance<T>;
    editableConfig?: ProTableProps<T>['editable'];
    getRowKey: (record: T) => string | number;
  },
): TableColumnProps<T>[] =>
  columns
    .filter((col) => !col.hideInTable)
    .map((column) => {
      const { children, valueType, dataIndex, ...rest } = column;

      const converted: TableColumnProps<T> = {
        ...rest,
        title: valueType === 'opr' && !rest.title ? '操作' : rest.title,
        dataIndex: Array.isArray(dataIndex) ? dataIndex.join('.') : dataIndex,
        render: createColumnRender(column, action, handlers, refreshTable, editableOptions),
      } as TableColumnProps<T>;

      // === 可编辑集成：操作列合并 EditableActions + 常规按钮 ===
      if (editableOptions && valueType === 'opr') {
        const baseRender = converted.render!;
        converted.render = (_: unknown, record: T, _index: number) => {
          const rowKey = editableOptions.getRowKey(record);
          const isEditing = editableOptions.editableKeys.includes(rowKey);
          const editableActions = (
            <EditableActions
              rowKey={rowKey}
              record={record}
              isEditing={isEditing}
              config={editableOptions.editableConfig as EditableConfig<T>}
              instance={editableOptions.editableInstance}
            />
          );
          // 编辑态只显示保存/取消，非编辑态合并常规按钮 + 编辑/删除
          if (isEditing) {
            return editableActions;
          }
          const oprDom = baseRender(_, record, _index);
          return (
            <Space size={8}>
              {oprDom}
              {editableActions}
            </Space>
          );
        };
      }

      if (children && children.length > 0) {
        converted.children = convertColumns(children, action, handlers, refreshTable, editableOptions);
      }

      return converted;
    });
