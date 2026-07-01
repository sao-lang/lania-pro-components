import React, { useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { ProDialog } from '../ProDialog';
import type { AddButtonProps } from './types';

/**
 * 新增按钮组件
 * @description 点击后弹出表单弹窗，支持自定义表单配置和提交逻辑
 * @example
 * ```tsx
 * <AddButton
 *   text="新增用户"
 *   title="新增用户"
 *   schemas={[
 *     { name: 'name', label: '姓名', component: 'Input', required: true },
 *   ]}
 *   onSubmit={async (values) => {
 *     await createUser(values);
 *     return true; // 返回 true 关闭弹窗
 *   }}
 * />
 * ```
 */
export const AddButton: React.FC<AddButtonProps> = ({
  text = '新增',
  title = '新增',
  type = 'primary',
  icon = <IconPlus />,
  width = 600,
  schemas,
  initialValues,
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
  const handleClick = useCallback(async () => {
    // 打开前的回调
    if (onBeforeOpen) {
      const shouldOpen = await onBeforeOpen();
      if (shouldOpen === false) {
        return;
      }
    }

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
  }, [title, width, schemas, initialValues, formProps, dialogProps, onSubmit, onBeforeOpen, onAfterClose]);

  if (!visible) {
    return null;
  }

  return (
    <Button
      type={type}
      icon={icon}
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

export default AddButton;
