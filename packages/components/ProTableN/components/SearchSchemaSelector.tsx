import React, { useState } from 'react';
import { Button, Select, Modal, Form, Input, Message, Space, Dropdown, Menu } from '@arco-design/web-react';
import { IconSave, IconDelete, IconDown, IconEdit } from '@arco-design/web-react/icon';
import type { SearchSchema } from '../hooks/useSearchSchema';

export interface SearchSchemaSelectorProps {
  /** 方案列表 */
  schemas: SearchSchema[];
  /** 当前选中的方案 key */
  currentSchema?: string;
  /** 切换方案回调 */
  onSwitch: (key: string) => void;
  /** 保存方案回调 */
  onSave: (name: string, params?: Record<string, unknown>) => void;
  /** 删除方案回调 */
  onDelete: (key: string) => void;
  /** 重命名方案回调 */
  onRename?: (key: string, newName: string) => void;
  /** 清空所有方案回调 */
  onClear?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 获取当前表单值的函数 */
  getCurrentParams?: () => Record<string, unknown>;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 查询方案选择器组件
 *
 * 提供可视化界面用于管理查询方案：
 * - 切换已保存的方案
 * - 保存当前查询条件为新方案
 * - 删除、重命名已有方案
 * - 清空所有方案
 *
 * @example
 * ```tsx
 * const { schemas, currentSchema, saveSchema, switchSchema, deleteSchema } = useSearchSchema({
 *   enabled: true,
 *   persistenceKey: 'my-table',
 * });
 *
 * <SearchSchemaSelector
 *   schemas={schemas}
 *   currentSchema={currentSchema}
 *   onSwitch={switchSchema}
 *   onSave={saveSchema}
 *   onDelete={deleteSchema}
 *   getCurrentParams={() => form.getFieldsValue()}
 * />
 * ```
 */
export const SearchSchemaSelector: React.FC<SearchSchemaSelectorProps> = ({
  schemas,
  currentSchema,
  onSwitch,
  onSave,
  onDelete,
  onRename,
  onClear,
  disabled = false,
  getCurrentParams,
  style,
  className,
}) => {
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [schemaName, setSchemaName] = useState('');
  const [renameKey, setRenameKey] = useState<string>('');
  const [renameValue, setRenameValue] = useState('');

  // 处理保存方案
  const handleSave = () => {
    if (!schemaName.trim()) {
      Message.warning('请输入方案名称');
      return;
    }

    // 检查是否已存在同名方案
    const existingSchema = schemas.find((s) => s.name === schemaName.trim());
    if (existingSchema) {
      Modal.confirm({
        title: '方案已存在',
        content: `查询方案 "${schemaName.trim()}" 已存在，是否覆盖？`,
        onOk: () => {
          onSave(schemaName.trim(), getCurrentParams?.());
          setSchemaName('');
          setSaveModalVisible(false);
          Message.success('方案保存成功');
        },
      });
      return;
    }

    onSave(schemaName.trim(), getCurrentParams?.());
    setSchemaName('');
    setSaveModalVisible(false);
    Message.success('方案保存成功');
  };

  // 处理删除方案
  const handleDelete = (key: string, name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除查询方案 "${name}" 吗？`,
      onOk: () => {
        onDelete(key);
        Message.success('方案删除成功');
      },
    });
  };

  // 处理重命名
  const handleRename = (key: string, currentName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRenameKey(key);
    setRenameValue(currentName);
    setRenameModalVisible(true);
  };

  // 确认重命名
  const confirmRename = () => {
    if (!renameValue.trim()) {
      Message.warning('请输入方案名称');
      return;
    }

    if (onRename) {
      onRename(renameKey, renameValue.trim());
      Message.success('重命名成功');
    }

    setRenameModalVisible(false);
    setRenameKey('');
    setRenameValue('');
  };

  // 处理清空所有方案
  const handleClear = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有查询方案吗？此操作不可恢复。',
      onOk: () => {
        onClear?.();
        Message.success('已清空所有方案');
      },
    });
  };

  // 管理菜单
  const manageMenu = (
    <Menu>
      {schemas.length === 0 ? (
        <Menu.Item key='empty' disabled>
          暂无保存的方案
        </Menu.Item>
      ) : (
        schemas.map((schema) => (
          <Menu.Item key={schema.key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: 200,
              }}
            >
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => onSwitch(schema.key)}
              >
                {schema.name}
              </span>
              <Space size={4}>
                {onRename && (
                  <Button
                    type='text'
                    size='mini'
                    icon={<IconEdit />}
                    onClick={(e) => handleRename(schema.key, schema.name, e)}
                  />
                )}
                <Button
                  type='text'
                  size='mini'
                  status='danger'
                  icon={<IconDelete />}
                  onClick={(e) => handleDelete(schema.key, schema.name, e)}
                />
              </Space>
            </div>
          </Menu.Item>
        ))
      )}
      {schemas.length > 0 && onClear && (
        <>
          <div style={{ margin: '8px 12px', borderTop: '1px solid #e5e6eb' }} />
          <Menu.Item key='clear-all' style={{ color: '#f53f3f' }} onClick={handleClear}>
            清空所有方案
          </Menu.Item>
        </>
      )}
    </Menu>
  );

  return (
    <>
      <Space style={style} className={className}>
        {schemas.length > 0 && (
          <Select
            placeholder='选择查询方案'
            value={currentSchema}
            onChange={onSwitch}
            style={{ width: 160 }}
            disabled={disabled}
            allowClear
            options={schemas.map((s) => ({ label: s.name, value: s.key }))}
          />
        )}
        <Button
          type='secondary'
          size='small'
          icon={<IconSave />}
          onClick={() => setSaveModalVisible(true)}
          disabled={disabled}
        >
          保存方案
        </Button>
        {schemas.length > 0 && (
          <Dropdown droplist={manageMenu} position='bl'>
            <Button type='text' size='small' icon={<IconDown />}>
              管理
            </Button>
          </Dropdown>
        )}
      </Space>

      {/* 保存方案弹窗 */}
      <Modal
        title='保存查询方案'
        visible={saveModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setSaveModalVisible(false);
          setSchemaName('');
        }}
        autoFocus={false}
        focusLock={true}
      >
        <Form>
          <Form.Item label='方案名称' required>
            <Input
              placeholder='请输入方案名称，如：最近7天的订单'
              value={schemaName}
              onChange={setSchemaName}
              onPressEnter={handleSave}
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重命名弹窗 */}
      <Modal
        title='重命名方案'
        visible={renameModalVisible}
        onOk={confirmRename}
        onCancel={() => {
          setRenameModalVisible(false);
          setRenameKey('');
          setRenameValue('');
        }}
        autoFocus={false}
        focusLock={true}
      >
        <Form>
          <Form.Item label='方案名称' required>
            <Input
              placeholder='请输入新的方案名称'
              value={renameValue}
              onChange={setRenameValue}
              onPressEnter={confirmRename}
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SearchSchemaSelector;
