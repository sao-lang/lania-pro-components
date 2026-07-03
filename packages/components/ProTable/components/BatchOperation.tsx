/**
 * BatchOperation — 批量操作栏
 *
 * 在表格顶部（或底部）显示已选行数和批量操作按钮：
 * - 显示已选行数
 * - 清空选择
 * - 绑定工具栏中的批量操作按钮配置
 */
import React from 'react';
import { Space, Button, Alert } from '@arco-design/web-react';
import { useDataContext, useRootContext } from '../context';

/**
 * BatchOperation - 批量操作组件
 */
export const BatchOperation: React.FC = () => {
  const { action, selectedRowKeys, selectedRows, clearSelected } = useDataContext();
  const { props } = useRootContext();

  const { batchOperation } = props;

  if (!batchOperation || selectedRowKeys.length === 0) {
    return null;
  }

  const { show = true, render, actions } = batchOperation;

  if (!show) {
    return null;
  }

  // 自定义渲染
  if (render) {
    return (
      <div className='pro-table-batch-operation' style={{ marginBottom: 16 }}>
        {render(selectedRows, selectedRowKeys, action)}
      </div>
    );
  }

  return (
    <Alert
      className='pro-table-batch-operation'
      style={{ marginBottom: 16 }}
      type='info'
      content={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            已选择 <strong>{selectedRowKeys.length}</strong> 项
          </span>
          <Space>
            {actions?.map((item) => {
              const disabled = typeof item.disabled === 'function' ? item.disabled(selectedRows) : item.disabled;

              return (
                <Button
                  key={item.key}
                  type={item.danger ? 'primary' : 'secondary'}
                  status={item.danger ? 'danger' : undefined}
                  disabled={disabled}
                  onClick={() => item.onClick?.(selectedRows, selectedRowKeys)}
                >
                  {item.text}
                </Button>
              );
            })}
            <Button type='text' onClick={clearSelected}>
              取消选择
            </Button>
          </Space>
        </div>
      }
    />
  );
};
