import React, { useCallback, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { IconEdit } from '@arco-design/web-react/icon';
import { ProDialog } from '../ProDialog';
import type { EditButtonProps } from './types';

/**
 * 编辑按钮组件
 * @description 点击后弹出表单弹窗，支持数据回填和编辑提交
 * @example
 * ```tsx
 * <EditButton
 *   text="编辑"
 *   title="编辑用户"
 *   schemas={[
 *     { name: 'name', label: '姓名', component: 'Input', required: true },
 *   ]}
 *   getInitialValues={() => record}
 *   onSubmit={async (values) => {
 *     await updateUser(record.id, values);
 *     return true;
 *   }}
 * />
 * ```
 */
export const EditButton: React.FC<EditButtonProps> = ({
  text = '编辑',
  title = '编辑',
  type = 'text',
  icon = <IconEdit />,
  width = 600,
  schemas,
  getInitialValues,
  formProps,
  dialogProps,
  onSubmit,
  onBeforeOpen,
  onAfterClose,
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
    setLoading(true);

    try {
      // 打开前的回调
      if (onBeforeOpen) {
        const shouldOpen = await onBeforeOpen();
        if (shouldOpen === false) {
          setLoading(false);
          return;
        }
      }

      // 获取初始数据
      const initialValues = await getInitialValues();

      // 打开表单弹窗
      ProDialog.form({
        title,
        width,
        schemas,
        initialValues,
        formProps: {
          layout: 'vertical',
          ...formProps,
        },
        onSubmit: async (values) => {
          const result = await onSubmit(values);
          // 返回 true 时自动关闭弹窗
          return result === true;
        },
        afterClose: onAfterClose,
        ...dialogProps,
      });
    } finally {
      setLoading(false);
    }
  }, [title, width, schemas, getInitialValues, formProps, dialogProps, onSubmit, onBeforeOpen, onAfterClose]);

  if (!visible) {
    return null;
  }

  return (
    <Button
      type={type}
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
    </Button>
  );
};

export default EditButton;
