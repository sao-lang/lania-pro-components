/**
 * 批量操作按钮组件
 *
 * 封装了"选择校验 → 可选二次确认 → 执行批量操作"的完整交互流程。
 * 支持选中数量上下限校验、自定义警告文案、二次确认弹窗。
 * 通过 ref.execute() 进行命令式调用，ref 同时暴露 selectedKeys/selectedRows 的 setter。
 */
import React, { useCallback, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
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
      onClick,
      visible = true,
      ...restProps
    },
    ref,
  ) => {
    const [loading, setLoading] = useState(false);
    const [innerSelectedKeys, setInnerSelectedKeys] = useState(selectedKeys);
    const [innerSelectedRows, setInnerSelectedRows] = useState(selectedRows);

    const handleExecute = useCallback(async () => {
      if (needSelection) {
        if (innerSelectedKeys.length < minSelection) {
          ProDialog.message.warning(selectionWarning);
          return;
        }

        if (maxSelection && innerSelectedKeys.length > maxSelection) {
          ProDialog.message.warning(`最多只能选择 ${maxSelection} 条数据`);
          return;
        }
      }

      if (needConfirm) {
        const content =
          typeof confirmContent === 'function'
            ? confirmContent(innerSelectedRows)
            : confirmContent || `确定要对选中的 ${innerSelectedRows.length} 条数据进行操作吗？`;

        ProDialog.confirm({
          title: confirmTitle,
          content,
          onConfirm: async () => {
            setLoading(true);
            try {
              const result = await onAction(innerSelectedRows, innerSelectedKeys);
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
          await onAction(innerSelectedRows, innerSelectedKeys);
        } finally {
          setLoading(false);
        }
      }
    }, [
      needSelection,
      innerSelectedKeys,
      innerSelectedRows,
      minSelection,
      maxSelection,
      selectionWarning,
      needConfirm,
      confirmTitle,
      confirmContent,
      dialogProps,
      onAction,
    ]);

    useEffect(() => {
      setInnerSelectedKeys(selectedKeys);
    }, [selectedKeys]);

    useEffect(() => {
      setInnerSelectedRows(selectedRows);
    }, [selectedRows]);

    useImperativeHandle(
      ref,
      () => ({
        execute: handleExecute,
        loading,
        setSelectedKeys: setInnerSelectedKeys,
        setSelectedRows: setInnerSelectedRows,
      }),
      [handleExecute, loading],
    );

    const handleClick = useCallback(
      (e: Event) => {
        onClick?.(e);
        void handleExecute();
      },
      [onClick, handleExecute],
    );

    if (!visible) {
      return null;
    }

    return (
      <Button type={type} status={status} icon={icon} loading={loading} onClick={handleClick} {...restProps}>
        {text}
      </Button>
    );
  },
);

BatchButton.displayName = 'BatchButton';

export default BatchButton;
