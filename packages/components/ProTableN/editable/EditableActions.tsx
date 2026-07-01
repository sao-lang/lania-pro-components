import React from 'react';
import { Button, Space } from '@arco-design/web-react';
import type { EditableConfig, EditableTableInstance } from './types';

export interface EditableActionsProps<T = Record<string, unknown>> {
  /** 行 key */
  rowKey: string | number;
  /** 行数据 */
  record: T;
  /** 是否正在编辑 */
  isEditing: boolean;
  /** 是否正在保存 */
  saving?: boolean;
  /** 是否正在删除 */
  deleting?: boolean;
  /** 编辑配置 */
  config?: EditableConfig<T>;
  /** 可编辑表格实例 */
  instance: EditableTableInstance<T>;
}

/**
 * 可编辑表格操作列
 */
export const EditableActions = <T extends Record<string, unknown>>(props: EditableActionsProps<T>) => {
  const { rowKey, record, isEditing, saving, deleting, config, instance } = props;
  const { actionRender } = config || {};

  // 默认操作按钮
  const defaultActions = isEditing ? (
    <Space size='small'>
      <Button type='primary' size='small' loading={saving} onClick={() => instance.saveEditable(rowKey)}>
        保存
      </Button>
      <Button size='small' onClick={() => instance.cancelEditable(rowKey)}>
        取消
      </Button>
    </Space>
  ) : (
    <Space size='small'>
      <Button type='primary' size='small' onClick={() => instance.startEditable(rowKey)}>
        编辑
      </Button>
      <Button status='danger' size='small' loading={deleting} onClick={() => instance.deleteEditable(rowKey)}>
        删除
      </Button>
    </Space>
  );

  // 如果提供了自定义渲染函数，使用自定义渲染
  if (actionRender) {
    return <>{actionRender(record, config || {}, defaultActions)}</>;
  }

  return defaultActions;
};

export default EditableActions;
