import React, { useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@arco-design/web-react';
import { IconSelectAll } from '@arco-design/web-react/icon';
import { ProDialog } from '../ProDialog';
import type { BatchButtonProps, BatchButtonRef } from './types';

/**
 * 批量操作按钮组件
 * @description 支持批量操作，可配置选中检查、二次确认等功能
 * @example
 * ```tsx
 * // 基础用法
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
 *
 * // 通过 ref 手动触发
 * const batchButtonRef = useRef<BatchButtonRef>(null);
 * <BatchButton ref={batchButtonRef} ... />
 * // 调用
 * batchButtonRef.current?.execute();
 * ```
 */
export const BatchButton = forwardRef<BatchButtonRef, BatchButtonProps>(
  (
    {
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
      ...restProps
    },
    ref,
  ) => {
    const [loading, setLoading] = useState(false);

    const handleExecute = useCallback(async () => {
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

    useImperativeHandle(
      ref,
      () => ({
        execute: handleExecute,
        loading,
      }),
      [handleExecute, loading],
    );

    if (!visible) {
      return null;
    }

    return (
      <Button type={type} status={status} icon={icon} loading={loading} onClick={handleExecute} {...restProps}>
        {text}
      </Button>
    );
  },
);

BatchButton.displayName = 'BatchButton';

export default BatchButton;
