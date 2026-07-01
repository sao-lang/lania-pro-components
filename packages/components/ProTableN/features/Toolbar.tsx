import React, { useState, useRef, useCallback } from 'react';
import { Space, Button, Tooltip, Trigger, Checkbox, Radio, Divider, Typography } from '@arco-design/web-react';
import {
  IconRefresh,
  IconSettings,
  IconFullscreen,
  IconFullscreenExit,
  IconList,
  IconDragDotVertical,
} from '@arco-design/web-react/icon';
import { useDataContext, useColumnContext, useRootContext } from '../context';
import type { ProColumnType, TableDensity, ProTableNEventHandlers } from '../types';
import { ToolbarActionButtons } from './ActionButtonRenderer';

const RadioGroup = Radio.Group;

/**
 * Toolbar 属性
 */
export interface ToolbarProps {
  /** 额外渲染内容（如视图切换） */
  extraRender?: React.ReactNode;
  /** 事件处理器 */
  handlers?: ProTableNEventHandlers;
  /** 刷新表格函数 */
  refreshTable?: () => void;
}

/**
 * Toolbar - 工具栏组件
 * 支持密度切换、列设置、全屏功能
 */
export const Toolbar: React.FC<ToolbarProps> = ({ extraRender, handlers, refreshTable }) => {
  const { action, loading, selectedRowKeys, selectedRows } = useDataContext();
  const { columns, density, handleDensityChange, handleColumnsChange } = useColumnContext();
  const { props } = useRootContext();

  const { toolbar } = props;
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!toolbar) {
    return null;
  }

  const {
    title,
    subTitle,
    description,
    leftRender,
    rightRender,
    showRefresh = false,
    showDensity = false,
    showColumnSetting = false,
    showFullscreen = false,
    toolbarRender,
    actions,
  } = toolbar;

  // 刷新
  const handleRefresh = () => {
    action.reload();
  };

  // 切换密度
  const handleDensityToggle = () => {
    const densities: TableDensity[] = ['default', 'middle', 'compact'];
    const currentIndex = densities.indexOf(density);
    const nextDensity = densities[(currentIndex + 1) % densities.length];
    handleDensityChange(nextDensity);
  };

  // 设置密度
  const handleSetDensity = (newDensity: TableDensity) => {
    handleDensityChange(newDensity);
  };

  // 获取密度显示文本
  const getDensityText = (d: TableDensity) => {
    const map: Record<TableDensity, string> = {
      default: '默认',
      middle: '中等',
      compact: '紧凑',
    };
    return map[d];
  };

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    if (!tableContainerRef.current) {
      return;
    }

    if (!document.fullscreenElement) {
      tableContainerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch(() => {
          // 降级方案：使用 CSS 固定定位模拟全屏
          const container = tableContainerRef.current;
          if (container) {
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100vw';
            container.style.height = '100vh';
            container.style.zIndex = '9999';
            container.style.background = '#fff';
            setIsFullscreen(true);
          }
        });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      } else {
        // 降级方案：恢复样式
        const container = tableContainerRef.current;
        if (container) {
          container.style.position = '';
          container.style.top = '';
          container.style.left = '';
          container.style.width = '';
          container.style.height = '';
          container.style.zIndex = '';
          container.style.background = '';
          setIsFullscreen(false);
        }
      }
    }
  }, []);

  // 监听全屏变化
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 处理列显示/隐藏
  const handleColumnVisibleChange = (dataIndex: string, checked: boolean) => {
    const newColumns = columns.map((col) => {
      if (col.dataIndex === dataIndex) {
        return { ...col, hideInTable: !checked };
      }
      return col;
    });
    handleColumnsChange(newColumns);
  };

  // 处理列固定
  const handleColumnFixedChange = (dataIndex: string, fixed: 'left' | 'right' | undefined) => {
    const newColumns = columns.map((col) => {
      if (col.dataIndex === dataIndex) {
        return { ...col, fixed };
      }
      return col;
    });
    handleColumnsChange(newColumns);
  };

  // 列设置弹窗内容
  const columnSettingContent = (
    <div
      style={{
        width: 220,
        padding: '8px 0',
        background: '#fff',
        border: '1px solid var(--color-border-2)',
        borderRadius: 8,
        boxShadow: '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px 0 rgba(0,0,0,0.05), 0 1px 3px 0 rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          padding: '0 12px 8px',
          borderBottom: '1px solid var(--color-border-2)',
        }}
      >
        <Checkbox
          checked={columns.every((col) => !col.hideInTable)}
          indeterminate={columns.some((col) => !col.hideInTable) && columns.some((col) => col.hideInTable)}
          onChange={(checked) => {
            const newColumns = columns.map((col) => ({
              ...col,
              hideInTable: !checked,
            }));
            handleColumnsChange(newColumns);
          }}
        >
          全选
        </Checkbox>
      </div>
      <div style={{ maxHeight: 300, overflow: 'auto', padding: '8px 0' }}>
        {columns
          .filter((col) => !col.disableInSetting)
          .map((col) => (
            <div
              key={String(col.dataIndex)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                gap: 8,
              }}
            >
              <IconDragDotVertical style={{ cursor: 'move', color: '#86909c' }} />
              <Checkbox
                checked={!col.hideInTable}
                onChange={(checked) => handleColumnVisibleChange(String(col.dataIndex), checked)}
              >
                {col.title}
              </Checkbox>
              <Space size={4} style={{ marginLeft: 'auto' }}>
                <Tooltip content='固定在左侧'>
                  <Button
                    type='text'
                    size='mini'
                    icon={<IconList />}
                    style={{
                      color: col.fixed === 'left' ? 'rgb(var(--primary-6))' : '#86909c',
                    }}
                    onClick={() =>
                      handleColumnFixedChange(String(col.dataIndex), col.fixed === 'left' ? undefined : 'left')
                    }
                  />
                </Tooltip>
                <Tooltip content='固定在右侧'>
                  <Button
                    type='text'
                    size='mini'
                    icon={<IconList style={{ transform: 'rotate(180deg)' }} />}
                    style={{
                      color: col.fixed === 'right' ? 'rgb(var(--primary-6))' : '#86909c',
                    }}
                    onClick={() =>
                      handleColumnFixedChange(String(col.dataIndex), col.fixed === 'right' ? undefined : 'right')
                    }
                  />
                </Tooltip>
              </Space>
            </div>
          ))}
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <div
        style={{
          padding: '0 12px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button
          type='text'
          size='small'
          onClick={() => {
            const newColumns = columns.map((col) => ({
              ...col,
              hideInTable: false,
              fixed: undefined,
            }));
            handleColumnsChange(newColumns);
          }}
        >
          重置
        </Button>
      </div>
    </div>
  );

  // 密度选择弹窗内容
  const densityContent = (
    <div style={{ padding: '8px' }}>
      <RadioGroup
        type='button'
        value={density}
        onChange={(val) => handleSetDensity(val as TableDensity)}
        options={[
          { label: '默认', value: 'default' },
          { label: '中等', value: 'middle' },
          { label: '紧凑', value: 'compact' },
        ]}
      />
    </div>
  );

  // 自定义渲染
  if (toolbarRender) {
    return (
      <div className='pro-table-toolbar' style={{ marginBottom: 16 }}>
        {toolbarRender(action, { selectedRows, selectedRowKeys })}
      </div>
    );
  }

  return (
    <div
      ref={tableContainerRef}
      className='pro-table-toolbar-container'
      style={{
        background: isFullscreen ? '#fff' : undefined,
        padding: isFullscreen ? 16 : undefined,
        height: isFullscreen ? '100vh' : undefined,
        display: isFullscreen ? 'flex' : undefined,
        flexDirection: isFullscreen ? 'column' : undefined,
      }}
    >
      <div
        className='pro-table-toolbar'
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* 左侧 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {leftRender}
          {/* 新的 actions 配置 - 左侧按钮 */}
          {actions?.leftActions && actions.leftActions.length > 0 && (
            <ToolbarActionButtons
              leftActions={actions.leftActions}
              handlers={handlers || {}}
              action={action}
              refreshTable={refreshTable || (() => action?.reload())}
            />
          )}
          {title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
              {subTitle && <span style={{ fontSize: 14, color: '#86909c' }}>{subTitle}</span>}
            </div>
          )}
          {description && <span style={{ fontSize: 12, color: '#86909c' }}>{description}</span>}
        </div>

        {/* 右侧 */}
        <Space>
          {/* 新的 actions 配置 - 右侧按钮 */}
          {actions?.rightActions && actions.rightActions.length > 0 && (
            <ToolbarActionButtons
              rightActions={actions.rightActions}
              handlers={handlers || {}}
              action={action}
              refreshTable={refreshTable || (() => action?.reload())}
            />
          )}
          {rightRender}
          {extraRender}
          {showRefresh && (
            <Tooltip content='刷新'>
              <Button icon={<IconRefresh />} onClick={handleRefresh} loading={loading} type='secondary' />
            </Tooltip>
          )}
          {showDensity && (
            <Trigger popup={() => densityContent} position='bottom' trigger='click'>
              <Tooltip content={`密度: ${getDensityText(density)}`}>
                <Button type='secondary'>{getDensityText(density)}</Button>
              </Tooltip>
            </Trigger>
          )}
          {showColumnSetting && (
            <Trigger popup={() => columnSettingContent} position='bottom' trigger='click'>
              <Tooltip content='列设置'>
                <Button icon={<IconSettings />} type='secondary' />
              </Tooltip>
            </Trigger>
          )}
          {showFullscreen && (
            <Tooltip content={isFullscreen ? '退出全屏' : '全屏'}>
              <Button
                icon={isFullscreen ? <IconFullscreenExit /> : <IconFullscreen />}
                type='secondary'
                onClick={toggleFullscreen}
              />
            </Tooltip>
          )}
        </Space>
      </div>
    </div>
  );
};
