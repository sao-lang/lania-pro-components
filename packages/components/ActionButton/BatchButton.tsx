import React, { useCallback, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { IconSelectAll } from '@arco-design/web-react/icon';
import { ProDialog } from '../ProDialog';
import type { BatchButtonProps } from './types';

/**
 * 批量操作按钮组件
 * @description 支持批量操作，可配置选中检查、二次确认等功能
 * @example
 * ```tsx
 * <BatchButton
 *   text="批量删除"
 *   status="danger"
 *   selectedRows={selectedRows}
 *   selectedKeys={selectedKeys}
 *   needSelection={true}
 *   needConfirm={true}
 *   confirmTitle="确认批量删除"
 *   confirmContent={(rows) => `确定要删除选中的 ${rows.length} 条数据吗？`}
 *   onAction={async (rows, keys) => {
 *     await batchDelete(keys);
 *     return true;
 *   }}
 * />
 * ```
 */
export const BatchButton: React.FC<BatchButtonProps> = ({
  text = '批量操作',
  type = 'secondary',
  status,
  icon = <IconSelectAll />,
  selectedRows,
  selectedKeys,
  needSelection = true,
  minSelection = 1,
  maxSelection,
  selectionWarning = '请至少选择一条数据',
  needConfirm = false,
  confirmTitle = '确认操作',
  confirmContent,
  dialogProps,
  onAction,
  visible = true,
  style,
  className,
  disabled,
  size,
  shape,
  ghost,
  autoInsertSpace,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    // 检查是否选中
    if (needSelection) {
      if (selectedKeys.length < minSelection) {
        ProDialog.message.warning(selectionWarning);
        return;
      }

      if (maxSelection && selectedKeys.length > maxSelection) {
        ProDialog.message.warning(`最多只能选择 ${maxSelection} 条数据`);
        return;
      }
    }

    // 二次确认
    if (needConfirm) {
      const content =
        typeof confirmContent === 'function'
          ? confirmContent(selectedRows)
          : confirmContent || `确定要对选中的 ${selectedKeys.length} 条数据进行操作吗？`;

      ProDialog.confirm({
        title: confirmTitle,
        content,
        onConfirm: async () => {
          setLoading(true);
          try {
            const result = await onAction(selectedRows, selectedKeys);
            return result !== false;
          } finally {
            setLoading(false);
          }
        },
        ...dialogProps,
      });
    } else {
      // 直接执行
      setLoading(true);
      try {
        await onAction(selectedRows, selectedKeys);
      } finally {
        setLoading(false);
      }
    }
  }, [
    needSelection,
    selectedKeys,
    selectedRows,
    minSelection,
    maxSelection,
    selectionWarning,
    needConfirm,
    confirmTitle,
    confirmContent,
    dialogProps,
    onAction,
  ]);

  if (!visible) {
    return null;
  }

  return (
    <Button
      type={type}
      status={status}
      icon={icon}
      loading={loading}
      onClick={handleClick as unknown as () => void}
      style={style}
      className={className}
      disabled={disabled}
      size={size}
      shape={shape}
      ghost={ghost}
      autoInsertSpace={autoInsertSpace}
    >
      {text}
      {selectedKeys.length > 0 && ` (${selectedKeys.length})`}
    </Button>
  );
};

export default BatchButton;
