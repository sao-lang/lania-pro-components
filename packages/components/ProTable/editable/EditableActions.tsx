/**
 * EditableActions — 编辑操作按钮
 *
 * 在可编辑表格行中渲染编辑/保存/取消等操作按钮：
 * - 编辑模式：显示保存/取消按钮
 * - 预览模式：显示编辑/删除按钮
 * - 支持自定义按钮文本
 */
/**
 * EditableActions — 可编辑表格操作按钮
 *
 * 在可编辑表格的操作列中渲染编辑/保存/取消按钮：
 * - 预览模式：显示"编辑"按钮（可点击进入编辑状态）
 * - 编辑模式：显示"保存"/"取消"按钮
 * - 支持隐藏编辑/删除按钮、自定义按钮文本
 *
 * 按钮点击后调用 useEditableTable 暴露的 startEditable / saveEditable / cancelEditable 方法。
 */
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
