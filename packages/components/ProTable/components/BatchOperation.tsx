/**
 * BatchOperation — 批量操作栏
 *
 * 渲染由 batchOperation.actions 配置的批量操作按钮组，
 * 每个按钮委托给 BatchButton 组件处理选中校验和执行回调。
 */
import React from 'react';
import { Space } from '@arco-design/web-react';
import { BatchButton } from '../../ActionButton';
import { useDataContext, useRootContext } from '../context';

/**
 * BatchOperation - 批量操作组件
 */
export const BatchOperation: React.FC = () => {
  const { action, selectedRowKeys, selectedRows } = useDataContext();
  const { props } = useRootContext();

  const { batchOperation } = props;

  if (!batchOperation || selectedRowKeys.length === 0) {
    return null;
  }

  const { show = true, render, actions } = batchOperation;

  if (!show) {
    return null;
  }

  if (render) {
    return (
      <div className='pro-table-batch-operation' style={{ marginBottom: 16 }}>
        {render(selectedRows, selectedRowKeys, action)}
      </div>
    );
  }

  return (
    <Space className='pro-table-batch-operation' style={{ marginBottom: 16 }}>
      {actions?.map((item) => {
        const disabled = typeof item.disabled === 'function' ? item.disabled(selectedRows) : item.disabled;

        return (
          <BatchButton
            key={item.key}
            text={item.text}
            type={item.danger ? 'primary' : 'secondary'}
            status={item.danger ? 'danger' : undefined}
            disabled={disabled}
            selectedRows={selectedRows}
            selectedKeys={selectedRowKeys}
            needSelection={false}
            needConfirm={false}
            onAction={async (rows, keys) => {
              item.onClick?.(rows, keys);
            }}
          />
        );
      })}
    </Space>
  );
};
