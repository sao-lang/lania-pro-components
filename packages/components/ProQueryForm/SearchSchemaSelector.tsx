import React, { useState } from 'react';
import { Button, Select, Modal, Form, Input, Message, Space, Dropdown, Menu } from '@arco-design/web-react';
import { IconSave, IconDelete, IconDown, IconEdit } from '@arco-design/web-react/icon';
import type { PresetItem } from '@lania-pro-components/shared';

export interface SearchSchemaSelectorProps {
  schemas: PresetItem<Record<string, unknown>>[];
  currentSchema?: string;
  onSwitch: (key: string) => void;
  onSave: (name: string, params?: Record<string, unknown>) => void;
  onDelete: (key: string) => void;
  onRename?: (key: string, newName: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  getCurrentParams?: () => Record<string, unknown>;
  style?: React.CSSProperties;
  className?: string;
}

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

  const handleSave = () => {
    if (!schemaName.trim()) {
      Message.warning('请输入方案名称');
      return;
    }

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

  const handleDelete = (key: string, name: string, e?: Event) => {
    (e as unknown as React.MouseEvent)?.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除查询方案 "${name}" 吗？`,
      onOk: () => {
        onDelete(key);
        Message.success('方案删除成功');
      },
    });
  };

  const handleRename = (key: string, currentName: string, e?: Event) => {
    (e as unknown as React.MouseEvent)?.stopPropagation();
    setRenameKey(key);
    setRenameValue(currentName);
    setRenameModalVisible(true);
  };

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
