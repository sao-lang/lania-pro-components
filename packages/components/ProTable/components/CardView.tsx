import React, { useMemo } from 'react';
import { Card, Grid, Empty } from '@arco-design/web-react';
import { IconList, IconApps } from '@arco-design/web-react/icon';
import type { ProColumnType, ProTableActionType } from '../types';
import { getNestedValue } from '../utils';

const { Row, Col } = Grid;

/**
 * 卡片网格配置
 */
export interface CardGridConfig {
  /** 栅格间隔 */
  gutter?: number;
  /** 默认列数 */
  column?: number;
  /** <576px 响应式栅格 */
  xs?: number;
  /** ≥576px 响应式栅格 */
  sm?: number;
  /** ≥768px 响应式栅格 */
  md?: number;
  /** ≥992px 响应式栅格 */
  lg?: number;
  /** ≥1200px 响应式栅格 */
  xl?: number;
  /** ≥1600px 响应式栅格 */
  xxl?: number;
}

/**
 * 卡片模式配置
 */
export interface CardModeConfig<T = Record<string, unknown>> {
  /** 自定义卡片渲染 */
  cardRender?: (record: T, index: number, columns: ProColumnType<T>[]) => React.ReactNode;
  /** 网格配置 */
  grid?: CardGridConfig;
  /** 卡片标题渲染 */
  titleRender?: (record: T) => React.ReactNode;
  /** 卡片内容渲染 */
  contentRender?: (record: T, columns: ProColumnType<T>[]) => React.ReactNode;
  /** 卡片操作渲染 */
  actionsRender?: (record: T, action: ProTableActionType<T>) => React.ReactNode[];
  /** 卡片是否可点击 */
  clickable?: boolean;
  /** 卡片点击回调 */
  onCardClick?: (record: T) => void;
  /** 卡片类名 */
  cardClassName?: string;
  /** 卡片样式 */
  cardStyle?: React.CSSProperties;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 卡片封面渲染 */
  coverRender?: (record: T) => React.ReactNode;
  /** 卡片头像渲染 */
  avatarRender?: (record: T) => React.ReactNode;
}

/**
 * 卡片视图属性
 */
export interface CardViewProps<T = Record<string, unknown>> {
  /** 数据源 */
  dataSource: T[];
  /** 列配置 */
  columns: ProColumnType<T>[];
  /** 卡片模式配置 */
  cardMode: CardModeConfig<T> | boolean;
  /** 表格操作实例 */
  action?: ProTableActionType<T>;
  /** 加载状态 */
  loading?: boolean;
  /** 空状态渲染 */
  emptyRender?: React.ReactNode | (() => React.ReactNode);
  /** 行 key 获取函数 */
  getRowKey: (record: T) => string | number;
  /** 选中行 keys */
  selectedRowKeys?: (string | number)[];
  /** 选中变化回调 */
  onSelect?: (record: T, selected: boolean) => void;
  /** 是否支持多选 */
  multiple?: boolean;
}

/**
 * 默认卡片渲染
 */
function defaultCardRender<T>(
  record: T,
  index: number,
  columns: ProColumnType<T>[],
  config: CardModeConfig<T>,
  action?: ProTableActionType<T>,
): React.ReactNode {
  const {
    titleRender,
    contentRender,
    actionsRender,
    onCardClick,
    clickable = false,
    cardClassName,
    cardStyle,
    bordered = true,
    coverRender,
    avatarRender,
  } = config;

  // 过滤掉操作列
  const dataColumns = columns.filter((col) => col.valueType !== 'opr');

  // 标题
  const title = titleRender ? titleRender(record) : null;

  // 内容
  const content = contentRender ? (
    contentRender(record, dataColumns)
  ) : (
    <div className='pro-table-card-content'>
      {dataColumns.slice(0, 4).map((col, idx) => {
        const value = col.dataIndex ? getNestedValue(record as Record<string, unknown>, col.dataIndex) : null;
        return (
          <div key={idx} className='pro-table-card-item'>
            <span className='pro-table-card-label'>{col.title}:</span>
            <span className='pro-table-card-value'>{value !== undefined && value !== null ? String(value) : '-'}</span>
          </div>
        );
      })}
    </div>
  );

  // 操作
  const actions = actionsRender && action ? actionsRender(record, action) : null;

  // 封面
  const cover = coverRender ? coverRender(record) : null;

  // 头像
  const avatar = avatarRender ? avatarRender(record) : null;

  const cardProps: React.ComponentProps<typeof Card> = {
    className: `pro-table-card ${cardClassName || ''}`,
    style: {
      cursor: clickable ? 'pointer' : 'default',
      ...cardStyle,
    },
    bordered,
    onClick: clickable && onCardClick ? () => onCardClick(record) : undefined,
  };

  if (cover) {
    cardProps.cover = cover;
  }

  return (
    <Card {...cardProps}>
      {avatar && <div className='pro-table-card-avatar'>{avatar}</div>}
      {title && <div className='pro-table-card-title'>{title}</div>}
      {content}
      {actions && actions.length > 0 && (
        <div className='pro-table-card-actions'>
          {actions.map((actionNode, idx) => (
            <span key={idx} className='pro-table-card-action'>
              {actionNode}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * 卡片视图组件
 *
 * 将表格数据以卡片形式展示
 *
 * @example
 * ```tsx
 * <CardView
 *   dataSource={data}
 *   columns={columns}
 *   cardMode={{
 *     grid: { gutter: 16, column: 4 },
 *     cardRender: (record) => <CustomCard data={record} />,
 *   }}
 * />
 * ```
 */
export function CardView<T extends Record<string, unknown> = Record<string, unknown>>(
  props: CardViewProps<T>,
): React.ReactElement {
  const {
    dataSource,
    columns,
    cardMode,
    action,
    loading,
    emptyRender,
    getRowKey,
    selectedRowKeys = [],
    onSelect,
    multiple = false,
  } = props;

  // 解析卡片模式配置
  const config = useMemo<CardModeConfig<T>>(() => {
    if (typeof cardMode === 'boolean') {
      return {};
    }
    return cardMode;
  }, [cardMode]);

  // 网格配置
  const gridConfig = useMemo(() => {
    const { gutter = 16, column = 4, xs = 1, sm = 2, md = 3, lg = 4, xl = 4, xxl = 6 } = config.grid || {};

    return {
      gutter,
      column,
      xs,
      sm,
      md,
      lg,
      xl,
      xxl,
    };
  }, [config.grid]);

  // 渲染卡片
  const renderCard = (record: T, index: number): React.ReactNode => {
    const key = getRowKey(record);
    const isSelected = selectedRowKeys.includes(key);

    const cardContent = config.cardRender
      ? config.cardRender(record, index, columns)
      : defaultCardRender(record, index, columns, config, action);

    // 如果选择模式，包装选择框
    if (onSelect) {
      return (
        <div
          key={key}
          className={`pro-table-card-wrapper ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(record, !isSelected)}
        >
          <div className='pro-table-card-select'>
            {multiple ? (
              <input
                type='checkbox'
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelect(record, e.target.checked);
                }}
              />
            ) : (
              <input
                type='radio'
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelect(record, true);
                }}
              />
            )}
          </div>
          {cardContent}
        </div>
      );
    }

    return <div key={key}>{cardContent}</div>;
  };

  // 空状态
  if (!loading && dataSource.length === 0) {
    if (emptyRender) {
      return (
        <div className='pro-table-card-empty'>{typeof emptyRender === 'function' ? emptyRender() : emptyRender}</div>
      );
    }
    return (
      <div className='pro-table-card-empty'>
        <Empty description='暂无数据' />
      </div>
    );
  }

  return (
    <div className='pro-table-card-view'>
      <Row gutter={gridConfig.gutter}>
        {dataSource.map((record, index) => {
          const key = getRowKey(record);
          return (
            <Col
              key={key}
              xs={gridConfig.xs}
              sm={gridConfig.sm}
              md={gridConfig.md}
              lg={gridConfig.lg}
              xl={gridConfig.xl}
              xxl={gridConfig.xxl}
            >
              {renderCard(record, index)}
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

/**
 * 视图切换组件属性
 */
export interface ViewModeSwitchProps {
  /** 当前视图模式 */
  viewMode: 'table' | 'card';
  /** 视图切换回调 */
  onChange: (mode: 'table' | 'card') => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 视图切换组件
 *
 * 用于在表格视图和卡片视图之间切换
 *
 * @example
 * ```tsx
 * <ViewModeSwitch
 *   viewMode={viewMode}
 *   onChange={setViewMode}
 * />
 * ```
 */
export function ViewModeSwitch(props: ViewModeSwitchProps): React.ReactElement {
  const { viewMode, onChange, disabled, className, style } = props;

  return (
    <div
      className={`pro-table-view-mode-switch ${className || ''}`}
      style={{
        display: 'inline-flex',
        border: '1px solid var(--color-border-2)',
        borderRadius: 4,
        overflow: 'hidden',
        ...style,
      }}
    >
      <button
        type='button'
        disabled={disabled}
        onClick={() => onChange('table')}
        style={{
          padding: '4px 12px',
          border: 'none',
          background: viewMode === 'table' ? 'var(--color-fill-2)' : 'transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <IconList />
        列表
      </button>
      <button
        type='button'
        disabled={disabled}
        onClick={() => onChange('card')}
        style={{
          padding: '4px 12px',
          border: 'none',
          borderLeft: '1px solid var(--color-border-2)',
          background: viewMode === 'card' ? 'var(--color-fill-2)' : 'transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <IconApps />
        卡片
      </button>
    </div>
  );
}

export default CardView;
