/**
 * ActionButtonRenderer — 操作列按钮渲染器
 *
 * 根据 ActionButton 配置渲染表格操作列的按钮组：
 * - 支持 8 种预定义按钮类型（add/edit/view/delete/export/import/jump/more）
 * - 超出 maxCount 自动折叠到"更多"下拉菜单
 * - 按钮显隐/禁用支持函数式配置（根据行数据动态判断）
 * - onClick 回调传入行数据和 table action
 */
/**
 * ActionButtonRenderer — 表格操作列按钮渲染器
 *
 * 根据配置在表格操作列中渲染按钮组。
 * 支持 8 种预定义按钮类型：
 * - add/edit/view/delete: 对应 ProDialog 弹窗操作
 * - export/import: 对应导出/导入操作
 * - jump: 页面跳转操作
 * - custom: 自定义渲染
 * - more: 下拉菜单聚合
 *
 * 按钮显隐/禁用支持函数式配置（传入行数据动态计算），
 * 超出 maxCount 的按钮自动折叠到"更多"下拉菜单中。
 * 点击按钮时的回调携带行数据（record）和索引（index）。
 */
import React from 'react';
import { Space, Button, Dropdown, Menu } from '@arco-design/web-react';
import { IconMore } from '@arco-design/web-react/icon';
import { ProDialog } from '../../ProDialog';
import {
  AddButton,
  EditButton,
  ViewButton,
  DeleteButton,
  ExportButton,
  ImportButton,
  JumpButton,
} from '../../ActionButton';
import type { ProTableActionType } from '../types';
import type { OprActionButtonConfig, ToolbarActionButtonConfig, ProTableNEventHandlers } from '../types-action-button';

const { Item: MenuItem } = Menu;

/** ActionButton 组件的 type 直接兼容 ButtonProps，无需转换 */

/**
 * 渲染新增按钮 — 委托给 AddButton 组件
 */
const renderAddButton = (
  config: Extract<ToolbarActionButtonConfig, { type: 'add' }>,
  handlers: ProTableNEventHandlers,
  action: ProTableActionType,
  refreshTable: () => void,
) => (
  <AddButton
    key={config.key}
    text={config.text}
    type={config.buttonType || 'primary'}
    icon={config.icon}
    title={config.title}
    width={config.width}
    schemas={config.schemas}
    formProps={config.formProps as Record<string, unknown>}
    dialogProps={config.dialogProps}
    className={config.className}
    style={config.style}
    onSubmit={async (values) => {
      if (handlers.onCreate) {
        const result = await handlers.onCreate(values);
        if (result !== false) {
          refreshTable();
          return true;
        }
      }
      return false;
    }}
  />
);

/**
 * 渲染编辑按钮 — 委托给 EditButton 组件
 */
const renderEditButton = (
  config: Extract<OprActionButtonConfig, { type: 'edit' }>,
  record: Record<string, unknown>,
  handlers: ProTableNEventHandlers,
  action: ProTableActionType,
  refreshTable: () => void,
) => {
  const getInitialValues = (): Record<string, unknown> => {
    if (config.dataMap) {
      const values: Record<string, unknown> = {};
      Object.entries(config.dataMap).forEach(([formField, dataField]) => {
        values[formField] = record[dataField];
      });
      return values;
    }
    return record as Record<string, unknown>;
  };

  const id = ((record.id as string | number | undefined) || (record.key as string | number | undefined)) as
    string | number;

  return (
    <EditButton
      key={config.key}
      text={config.text}
      type={config.buttonType || 'text'}
      status={config.status}
      icon={config.icon}
      title={config.title}
      width={config.width}
      schemas={config.schemas}
      formProps={config.formProps as Record<string, unknown>}
      dialogProps={config.dialogProps}
      className={config.className}
      style={config.style}
      getInitialValues={getInitialValues}
      onSubmit={async (values) => {
        if (handlers.onEdit) {
          const result = await handlers.onEdit(id, values);
          if (result !== false) {
            refreshTable();
            return true;
          }
        }
        return false;
      }}
    />
  );
};

/**
 * 渲染查看按钮 — 委托给 ViewButton 组件
 * schemas 模式下通过 renderContent 内嵌 ProForm 只读表单
 */
const renderViewButton = (
  config: Extract<OprActionButtonConfig, { type: 'view' }> & {
    schemas?: unknown[];
    dataMap?: Record<string, string>;
    formProps?: Record<string, unknown>;
  },
  record: Record<string, unknown>,
  handlers: ProTableNEventHandlers,
) => {
  const getInitialValues = (): Record<string, unknown> => {
    if (config.dataMap) {
      const values: Record<string, unknown> = {};
      Object.entries(config.dataMap).forEach(([formField, dataField]) => {
        values[formField] = record[dataField];
      });
      return values;
    }
    return record as Record<string, unknown>;
  };

  const title = config.title || '查看详情';
  const width = config.width || 600;

  if (config.schemas) {
    // schemas 模式: 使用 ProDialog.form 只读展示
    const initialValues = getInitialValues();
    const handleClick = () => {
      ProDialog.form({
        title,
        width,
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
    };

    return (
      <Button
        key={config.key}
        type={config.buttonType || 'text'}
        status={config.status}
        icon={config.icon}
        onClick={handleClick}
        className={config.className}
        style={config.style}
      >
        {config.text || '查看'}
      </Button>
    );
  }

  // renderContent 模式
  return (
    <ViewButton
      key={config.key}
      text={config.text}
      type={config.buttonType || 'text'}
      status={config.status}
      icon={config.icon}
      title={title}
      width={width}
      dialogProps={config.dialogProps}
      className={config.className}
      style={config.style}
      renderContent={() => {
        if (handlers.onView) {
          handlers.onView(record);
        }
        return config.renderContent ? config.renderContent(record) : null;
      }}
    />
  );
};

/**
 * 渲染删除按钮 — 委托给 DeleteButton 组件
 */
const renderDeleteButton = (
  config: Extract<OprActionButtonConfig, { type: 'delete' }>,
  record: Record<string, unknown>,
  handlers: ProTableNEventHandlers,
  refreshTable: () => void,
) => {
  const idField = config.idField || 'id';
  const id = record[idField] as string | number;

  return (
    <DeleteButton
      key={config.key}
      text={config.text}
      type={config.buttonType || 'text'}
      status={config.status || 'danger'}
      icon={config.icon}
      confirmTitle={config.confirmTitle}
      confirmContent={
        typeof config.confirmContent === 'function' ? config.confirmContent(record) : config.confirmContent
      }
      okText={config.okText}
      cancelText={config.cancelText}
      dialogProps={config.dialogProps}
      className={config.className}
      style={config.style}
      onDelete={async () => {
        if (handlers.onDelete) {
          const result = await handlers.onDelete(id);
          if (result !== false) {
            refreshTable();
            return true;
          }
        }
        return false;
      }}
    />
  );
};

/**
 * 渲染导出按钮 — 委托给 ExportButton 组件
 */
const renderExportButton = (
  config: Extract<ToolbarActionButtonConfig, { type: 'export' }>,
  handlers: ProTableNEventHandlers,
) => {
  const onExport = handlers.onExport;
  return (
    <ExportButton
      key={config.key}
      text={config.text}
      type={config.buttonType || 'secondary'}
      status={config.status}
      icon={config.icon}
      exportUrl={config.exportUrl}
      params={config.params}
      className={config.className}
      style={config.style}
      onExport={onExport ? () => onExport() : undefined}
    />
  );
};

/**
 * 渲染导入按钮 — 委托给 ImportButton 组件
 * 有 uploadUrl 时使用默认 Upload，否则通过 renderUpload 使用 handlers.onImport
 */
const renderImportButton = (
  config: Extract<ToolbarActionButtonConfig, { type: 'import' }>,
  handlers: ProTableNEventHandlers,
  refreshTable: () => void,
) => {
  const onImport = handlers.onImport;
  return (
    <ImportButton
      key={config.key}
      text={config.text}
      type={config.buttonType || 'secondary'}
      status={config.status}
      icon={config.icon}
      title={config.title}
      width={config.width}
      accept={config.accept}
      dialogProps={config.dialogProps}
      uploadUrl={config.uploadUrl}
      uploadParams={config.uploadParams}
      className={config.className}
      style={config.style}
      onSuccess={() => refreshTable()}
      renderUpload={
        onImport
          ? () => (
              <div style={{ padding: '20px 0' }}>
                <input
                  type='file'
                  accept={config.accept || '.xlsx,.xls,.csv'}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await onImport(file);
                      refreshTable();
                    }
                  }}
                />
              </div>
            )
          : undefined
      }
    />
  );
};

/**
 * 渲染跳转按钮 — 委托给 JumpButton 组件
 * paramsMap 逻辑在外部计算 URL 后传入
 */
const renderJumpButton = (
  config: Extract<OprActionButtonConfig | ToolbarActionButtonConfig, { type: 'jump' }>,
  record?: Record<string, unknown>,
) => {
  let url = config.to;
  if (config.paramsMap && record) {
    Object.entries(config.paramsMap).forEach(([param, field]) => {
      url = url.replace(`{${param}}`, String((record as Record<string, unknown>)[field] || ''));
    });
  } else if (record) {
    url = url.replace(/{(\w+)}/g, (match, key: string) => String((record as Record<string, unknown>)[key] || match));
  }

  return (
    <JumpButton
      key={config.key}
      text={config.text}
      type={config.buttonType || 'text'}
      status={config.status}
      icon={config.icon}
      to={url}
      target={config.target}
      className={config.className}
      style={config.style}
    />
  );
};

/**
 * 渲染自定义按钮
 */
const renderCustomButton = (
  config: Extract<OprActionButtonConfig | ToolbarActionButtonConfig, { type: 'custom' }>,
  record: Record<string, unknown>,
  index: number,
  action: ProTableActionType,
) => <React.Fragment key={config.key}>{config.render(record, index, action)}</React.Fragment>;

/**
 * 渲染更多按钮下拉菜单
 */
const renderMoreButton = (
  config: Extract<OprActionButtonConfig | ToolbarActionButtonConfig, { type: 'more' }>,
  record: Record<string, unknown>,
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
  record: Record<string, unknown>,
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

  // 检查禁用状态 — ActionButton 组件的 disabled 不会阻止内部 onClick，需提前拦截
  const disabled = typeof config.disabled === 'function' ? config.disabled(record) : config.disabled === true;

  if (disabled) {
    return (
      <Button key={config.key} type='text' disabled>
        {config.text}
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
        {config.text}
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
  record: Record<string, unknown>;
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
