import React, { useCallback, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { IconDelete } from '@arco-design/web-react/icon';
import { ProDialog } from '../ProDialog';
import type { DeleteButtonProps } from './types';

/**
 * 删除按钮组件
 * @description 点击后弹出二次确认弹窗，确认后执行删除操作
 * @example
 * ```tsx
 * <DeleteButton
 *   text="删除"
 *   confirmTitle="确认删除"
 *   confirmContent="确定要删除这条数据吗？删除后无法恢复。"
 *   onDelete={async () => {
 *     await deleteUser(record.id);
 *     return true;
 *   }}
 * />
 * ```
 */
export const DeleteButton: React.FC<DeleteButtonProps> = ({
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

  const handleClick = useCallback(() => {
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

  if (!visible) {
    return null;
  }

  return (
    <Button
      type={type}
      status={status}
      icon={icon}
      loading={loading}
      onClick={handleClick}
      style={style}
      className={className}
      disabled={disabled}
      size={size}
      shape={shape}
      ghost={ghost}
      autoInsertSpace={autoInsertSpace}
    >
      {text}
    </Button>
  );
};

export default DeleteButton;
