import React, { useCallback } from 'react';
import { Space, Button, Dropdown, Menu } from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconEye,
  IconDelete,
  IconDownload,
  IconUpload,
  IconArrowRight,
  IconMore,
} from '@arco-design/web-react/icon';
import { ProDialog } from '../../ProDialog';
import type { ProTableActionType } from '../types';
import type { OprActionButtonConfig, ToolbarActionButtonConfig, ProTableNEventHandlers } from '../types-action-button';
import type { ProFormSchema } from '../../ProFormN/types';

const { Item: MenuItem } = Menu;

/**
 * 获取默认图标
 */
const getDefaultIcon = (type: string) => {
  switch (type) {
    case 'add':
      return <IconPlus />;
    case 'edit':
      return <IconEdit />;
    case 'view':
      return <IconEye />;
    case 'delete':
      return <IconDelete />;
    case 'export':
      return <IconDownload />;
    case 'import':
      return <IconUpload />;
    case 'jump':
      return <IconArrowRight />;
    default:
      return null;
  }
};

/**
 * 获取默认文本
 */
const getDefaultText = (type: string) => {
  switch (type) {
    case 'add':
      return '新增';
    case 'edit':
      return '编辑';
    case 'view':
      return '查看';
    case 'delete':
      return '删除';
    case 'export':
      return '导出';
    case 'import':
      return '导入';
    case 'jump':
      return '跳转';
    default:
      return '按钮';
  }
};

/**
 * 渲染新增按钮
 */
const renderAddButton = (
  config: Extract<ToolbarActionButtonConfig, { type: 'add' }>,
  handlers: ProTableNEventHandlers,
  action: ProTableActionType,
  refreshTable: () => void,
) => {
  const handleClick = () => {
    ProDialog.form({
      title: config.title || '新增',
      width: config.width || 600,
      schemas: config.schemas,
      formProps: {
        layout: 'vertical',
        ...config.formProps,
      },
      onSubmit: async (values) => {
        if (handlers.onCreate) {
          const result = await handlers.onCreate(values);
          if (result !== false) {
            refreshTable();
            return true;
          }
        }
        return false;
      },
      ...config.dialogProps,
    });
  };

  return (
    <Button
      key={config.key}
      type={config.buttonType || 'primary'}
      icon={config.icon || getDefaultIcon('add')}
      onClick={handleClick}
      className={config.className}
      style={config.style}
    >
      {config.text || getDefaultText('add')}
    </Button>
  );
};

/**
 * 渲染编辑按钮
 */
const renderEditButton = (
  config: Extract<OprActionButtonConfig, { type: 'edit' }>,
  record: any,
  handlers: ProTableNEventHandlers,
  action: ProTableActionType,
  refreshTable: () => void,
) => {
  const handleClick = () => {
    // 处理数据映射
    let initialValues = record;
    if (config.dataMap) {
      initialValues = {};
      Object.entries(config.dataMap).forEach(([formField, dataField]) => {
        initialValues[formField] = record[dataField];
      });
    }

    const id = record.id || record.key;

    ProDialog.form({
      title: config.title || '编辑',
      width: config.width || 600,
      schemas: config.schemas,
      initialValues,
      formProps: {
        layout: 'vertical',
        ...config.formProps,
      },
      onSubmit: async (values) => {
        if (handlers.onEdit) {
          const result = await handlers.onEdit(id, values);
          if (result !== false) {
            refreshTable();
            return true;
          }
        }
        return false;
      },
      ...config.dialogProps,
    });
  };

  return (
    <Button
      key={config.key}
      type={config.buttonType || 'text'}
      status={config.status}
      icon={config.icon || getDefaultIcon('edit')}
      onClick={handleClick}
      className={config.className}
      style={config.style}
    >
      {config.text || getDefaultText('edit')}
    </Button>
  );
};

/**
 * 渲染查看按钮
 */
const renderViewButton = (
  config: Extract<OprActionButtonConfig, { type: 'view' }> & {
    schemas?: any[];
    dataMap?: Record<string, string>;
    formProps?: Record<string, unknown>;
  },
  record: any,
  handlers: ProTableNEventHandlers,
) => {
  const handleClick = () => {
    if (handlers.onView) {
      handlers.onView(record);
    }

    // 处理数据映射
    let initialValues = record;
    if (config.dataMap) {
      initialValues = {};
      Object.entries(config.dataMap).forEach(([formField, dataField]) => {
        initialValues[formField] = record[dataField];
      });
    }

    // 如果有 schemas，使用表单模式展示
    if (config.schemas) {
      ProDialog.form({
        title: config.title || '查看详情',
        width: config.width || 600,
        schemas: config.schemas,
        initialValues,
        formProps: {
          layout: 'vertical',
          ...config.formProps,
        },
        showOk: false,
        cancelText: '关闭',
        ...config.dialogProps,
      });
    } else {
      // 否则使用自定义内容
      ProDialog.open({
        title: config.title || '查看详情',
        width: config.width || 600,
        content: config.renderContent ? config.renderContent(record) : null,
        showOk: false,
        cancelText: '关闭',
        ...config.dialogProps,
      });
    }
  };

  return (
    <Button
      key={config.key}
      type={config.buttonType || 'text'}
      status={config.status}
      icon={config.icon || getDefaultIcon('view')}
      onClick={handleClick}
      className={config.className}
      style={config.style}
    >
      {config.text || getDefaultText('view')}
    </Button>
  );
};

/**
 * 渲染删除按钮
 */
const renderDeleteButton = (
  config: Extract<OprActionButtonConfig, { type: 'delete' }>,
  record: any,
  handlers: ProTableNEventHandlers,
  refreshTable: () => void,
) => {
  const handleClick = () => {
    const idField = config.idField || 'id';
    const id = record[idField];
    const content =
      typeof config.confirmContent === 'function'
        ? config.confirmContent(record)
        : config.confirmContent || '确定要删除这条数据吗？删除后无法恢复。';

    ProDialog.confirm({
      title: config.confirmTitle || '确认删除',
      content,
      okText: config.okText || '确认删除',
      cancelText: config.cancelText || '取消',
      okButtonProps: { status: 'danger' },
      onConfirm: async () => {
        if (handlers.onDelete) {
          const result = await handlers.onDelete(id);
          if (result !== false) {
            refreshTable();
            return true;
          }
        }
        return false;
      },
      ...config.dialogProps,
    });
  };

  return (
    <Button
      key={config.key}
      type={config.buttonType || 'text'}
      status={config.status || 'danger'}
      icon={config.icon || getDefaultIcon('delete')}
      onClick={handleClick}
      className={config.className}
      style={config.style}
    >
      {config.text || getDefaultText('delete')}
    </Button>
  );
};

/**
 * 渲染导出按钮
 */
const renderExportButton = (
  config: Extract<ToolbarActionButtonConfig, { type: 'export' }>,
  handlers: ProTableNEventHandlers,
) => {
  const handleClick = async () => {
    if (handlers.onExport) {
      await handlers.onExport();
    } else if (config.exportUrl) {
      // 默认导出逻辑
      const params = config.params ? `?${new URLSearchParams(config.params as Record<string, string>).toString()}` : '';
      window.open(config.exportUrl + params, '_blank');
    }
  };

  return (
    <Button
      key={config.key}
      type={config.buttonType || 'secondary'}
      status={config.status}
      icon={config.icon || getDefaultIcon('export')}
      onClick={handleClick}
      className={config.className}
      style={config.style}
    >
      {config.text || getDefaultText('export')}
    </Button>
  );
};

/**
 * 渲染导入按钮
 */
const renderImportButton = (
  config: Extract<ToolbarActionButtonConfig, { type: 'import' }>,
  handlers: ProTableNEventHandlers,
  refreshTable: () => void,
) => {
  const handleClick = () => {
    ProDialog.open({
      title: config.title || '导入数据',
      width: config.width || 500,
      content: (
        <div style={{ padding: '20px 0' }}>
          <input
            type='file'
            accept={config.accept || '.xlsx,.xls,.csv'}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file && handlers.onImport) {
                await handlers.onImport(file);
                refreshTable();
              }
            }}
          />
        </div>
      ),
      ...config.dialogProps,
    });
  };

  return (
    <Button
      key={config.key}
      type={config.buttonType || 'secondary'}
      status={config.status}
      icon={config.icon || getDefaultIcon('import')}
      onClick={handleClick}
      className={config.className}
      style={config.style}
    >
      {config.text || getDefaultText('import')}
    </Button>
  );
};

/**
 * 渲染跳转按钮
 */
const renderJumpButton = (
  config: Extract<OprActionButtonConfig | ToolbarActionButtonConfig, { type: 'jump' }>,
  record?: any,
) => {
  const handleClick = () => {
    let url = config.to;

    // 处理路径参数
    if (config.paramsMap && record) {
      Object.entries(config.paramsMap).forEach(([param, field]) => {
        url = url.replace(`{${param}}`, record[field] || '');
      });
    } else if (record) {
      // 自动替换 {id} 等常见参数
      url = url.replace(/{(\w+)}/g, (match, key) => record[key] || match);
    }

    if (config.target === '_blank') {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  return (
    <Button
      key={config.key}
      type={config.buttonType || 'text'}
      status={config.status}
      icon={config.icon || getDefaultIcon('jump')}
      onClick={handleClick}
      className={config.className}
      style={config.style}
    >
      {config.text || getDefaultText('jump')}
    </Button>
  );
};

/**
 * 渲染自定义按钮
 */
const renderCustomButton = (
  config: Extract<OprActionButtonConfig | ToolbarActionButtonConfig, { type: 'custom' }>,
  record: any,
  index: number,
  action: ProTableActionType,
) => <React.Fragment key={config.key}>{config.render(record, index, action)}</React.Fragment>;

/**
 * 渲染更多按钮下拉菜单
 */
const renderMoreButton = (
  config: Extract<OprActionButtonConfig | ToolbarActionButtonConfig, { type: 'more' }>,
  record: any,
  index: number,
  action: ProTableActionType,
  handlers: ProTableNEventHandlers,
  refreshTable: () => void,
) => {
  const visibleActions = config.actions.filter((actionConfig) => {
    const visible =
      typeof actionConfig.visible === 'function' ? actionConfig.visible(record) : actionConfig.visible !== false;
    return visible;
  });

  if (visibleActions.length === 0) {
    return null;
  }

  const droplist = (
    <Menu>
      {visibleActions.map((actionConfig) => (
        <MenuItem key={actionConfig.key}>
          {renderOprActionButton(actionConfig, record, index, action, handlers, refreshTable)}
        </MenuItem>
      ))}
    </Menu>
  );

  return (
    <Dropdown
      key={config.key}
      droplist={droplist}
      trigger={config.trigger || 'click'}
      position={config.position || 'bottom'}
    >
      <Button
        type={config.buttonType || 'text'}
        status={config.status}
        icon={config.icon || <IconMore />}
        className={config.className}
        style={config.style}
      >
        {config.text || '更多'}
      </Button>
    </Dropdown>
  );
};

/**
 * 渲染操作列按钮
 */
export const renderOprActionButton = (
  config: OprActionButtonConfig,
  record: any,
  index: number,
  action: ProTableActionType,
  handlers: ProTableNEventHandlers,
  refreshTable: () => void,
): React.ReactNode => {
  // 检查显示条件
  const visible = typeof config.visible === 'function' ? config.visible(record) : config.visible !== false;

  if (!visible) {
    return null;
  }

  // 检查禁用状态
  const disabled = typeof config.disabled === 'function' ? config.disabled(record) : config.disabled === true;

  if (disabled) {
    return (
      <Button key={config.key} type='text' disabled>
        {config.text || getDefaultText(config.type)}
      </Button>
    );
  }

  switch (config.type) {
    case 'edit':
      return renderEditButton(config, record, handlers, action, refreshTable);
    case 'view':
      return renderViewButton(config, record, handlers);
    case 'delete':
      return renderDeleteButton(config, record, handlers, refreshTable);
    case 'jump':
      return renderJumpButton(config, record);
    case 'custom':
      return renderCustomButton(config, record, index, action);
    case 'more':
      return renderMoreButton(config, record, index, action, handlers, refreshTable);
    default:
      return null;
  }
};

/**
 * 渲染工具栏按钮
 */
export const renderToolbarActionButton = (
  config: ToolbarActionButtonConfig,
  handlers: ProTableNEventHandlers,
  action: ProTableActionType,
  refreshTable: () => void,
): React.ReactNode => {
  // 检查显示条件
  const visible = typeof config.visible === 'function' ? config.visible() : config.visible !== false;

  if (!visible) {
    return null;
  }

  // 检查禁用状态
  const disabled = typeof config.disabled === 'function' ? config.disabled() : config.disabled === true;

  if (disabled) {
    return (
      <Button key={config.key} type='secondary' disabled>
        {config.text || getDefaultText(config.type)}
      </Button>
    );
  }

  switch (config.type) {
    case 'add':
      return renderAddButton(config, handlers, action, refreshTable);
    case 'export':
      return renderExportButton(config, handlers);
    case 'import':
      return renderImportButton(config, handlers, refreshTable);
    case 'jump':
      return renderJumpButton(config);
    case 'custom':
      return renderCustomButton(config, {}, 0, action);
    case 'more':
      return renderMoreButton(config, {}, 0, action, handlers, refreshTable);
    default:
      return null;
  }
};

/**
 * 操作列按钮组组件
 */
export interface OprActionButtonsProps {
  actions: OprActionButtonConfig[];
  record: any;
  index: number;
  action: ProTableActionType;
  handlers: ProTableNEventHandlers;
  refreshTable: () => void;
  maxCount?: number;
  moreText?: string;
}

export const OprActionButtons: React.FC<OprActionButtonsProps> = ({
  actions,
  record,
  index,
  action,
  handlers,
  refreshTable,
  maxCount = 3,
  moreText = '更多',
}) => {
  const visibleActions = actions.filter((config) => {
    const visible = typeof config.visible === 'function' ? config.visible(record) : config.visible !== false;
    return visible;
  });

  if (visibleActions.length === 0) {
    return null;
  }

  // 如果按钮数量超过 maxCount，显示更多下拉菜单
  if (visibleActions.length > maxCount) {
    const mainActions = visibleActions.slice(0, maxCount - 1);
    const moreActions = visibleActions.slice(maxCount - 1);

    return (
      <Space size={8}>
        {mainActions.map((config) => renderOprActionButton(config, record, index, action, handlers, refreshTable))}
        <Dropdown
          droplist={
            <Menu>
              {moreActions.map((config) => (
                <MenuItem key={config.key}>
                  {renderOprActionButton(config, record, index, action, handlers, refreshTable)}
                </MenuItem>
              ))}
            </Menu>
          }
        >
          <Button type='text' icon={<IconMore />}>
            {moreText}
          </Button>
        </Dropdown>
      </Space>
    );
  }

  return (
    <Space size={8}>
      {visibleActions.map((config) => renderOprActionButton(config, record, index, action, handlers, refreshTable))}
    </Space>
  );
};

/**
 * 工具栏按钮组组件
 */
export interface ToolbarActionButtonsProps {
  leftActions?: ToolbarActionButtonConfig[];
  rightActions?: ToolbarActionButtonConfig[];
  handlers: ProTableNEventHandlers;
  action: ProTableActionType;
  refreshTable: () => void;
}

export const ToolbarActionButtons: React.FC<ToolbarActionButtonsProps> = ({
  leftActions = [],
  rightActions = [],
  handlers,
  action,
  refreshTable,
}) => (
  <>
    <Space>{leftActions.map((config) => renderToolbarActionButton(config, handlers, action, refreshTable))}</Space>
    <Space>{rightActions.map((config) => renderToolbarActionButton(config, handlers, action, refreshTable))}</Space>
  </>
);

export default OprActionButtons;
