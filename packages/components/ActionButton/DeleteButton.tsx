/**
 * 删除按钮组件
 *
 * 封装了"点击按钮 → 弹出二次确认弹窗 → 执行删除"的完整交互流程。
 * 支持自定义确认文案、按钮文本，删除过程中显示 loading 状态。
 * 可通过 ref.openConfirm() 进行命令式调用。
 */
import React, { useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@arco-design/web-react';
import { IconDelete } from '@arco-design/web-react/icon';
import { ProDialog } from '../ProDialog';
import type { DeleteButtonProps, DeleteButtonRef } from './types';

/**
 * 删除按钮组件
 * @description 点击后弹出二次确认弹窗，确认后执行删除操作
 * @example
 * ```tsx
 * // 基础用法
 * <DeleteButton
 *   text="删除"
 *   confirmTitle="确认删除"
 *   confirmContent="确定要删除这条数据吗？删除后无法恢复。"
 *   onDelete={async () => {
 *     await deleteUser(record.id);
 *     return true;
 *   }}
 * />
 *
 * // 通过 ref 手动触发
 * const deleteButtonRef = useRef<DeleteButtonRef>(null);
 * <DeleteButton ref={deleteButtonRef} ... />
 * // 调用
 * deleteButtonRef.current?.openConfirm();
 * ```
 */
export const DeleteButton = forwardRef<DeleteButtonRef, DeleteButtonProps>(
  (
    {
      text = '删除',
      type = 'text',
      status = 'danger',
      icon = <IconDelete />,
      confirmTitle = '确认删除',
      confirmContent = '确定要删除这条数据吗？删除后无法恢复。',
      okText = '确认删除',
      cancelText = '取消',
      okButtonProps,
      dialogProps,
      onDelete,
      onClick,
      visible = true,
      ...restProps
    },
    ref,
  ) => {
    const [loading, setLoading] = useState(false);

    const handleOpenConfirm = useCallback(() => {
      const content = typeof confirmContent === 'function' ? confirmContent() : confirmContent;

      ProDialog.confirm({
        title: confirmTitle,
        content,
        okText,
        cancelText,
        okButtonProps: {
          status: 'danger',
          ...okButtonProps,
        },
        onConfirm: async () => {
          setLoading(true);
          try {
            const result = await onDelete();
            return result !== false;
          } finally {
            setLoading(false);
          }
        },
        ...dialogProps,
      });
    }, [confirmTitle, confirmContent, okText, cancelText, okButtonProps, dialogProps, onDelete]);

    useImperativeHandle(
      ref,
      () => ({
        openConfirm: handleOpenConfirm,
        loading,
      }),
      [handleOpenConfirm, loading],
    );

    const handleClick = useCallback(
      (e: Event) => {
        onClick?.(e);
        handleOpenConfirm();
      },
      [onClick, handleOpenConfirm],
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

DeleteButton.displayName = 'DeleteButton';

export default DeleteButton;
