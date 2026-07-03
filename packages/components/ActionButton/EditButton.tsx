/**
 * 编辑按钮组件
 *
 * 封装了"点击按钮 → 加载初始数据 → 打开表单弹窗（数据回填） → 提交"的完整交互流程。
 * 通过 getInitialValues 异步获取回填数据，弹窗加载期间显示 loading 状态。
 * 可通过 ref.open() 进行命令式调用。
 */
import React, { useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@arco-design/web-react';
import { IconEdit } from '@arco-design/web-react/icon';
import { useActionButton } from '@lania-pro-components/shared';
import { ProDialog } from '../ProDialog';
import type { EditButtonProps, EditButtonRef } from './types';

/**
 * 编辑按钮组件
 * @description 点击后弹出表单弹窗，支持数据回填和编辑提交
 * @example
 * ```tsx
 * // 基础用法
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
 *
 * // 通过 ref 手动触发
 * const editButtonRef = useRef<EditButtonRef>(null);
 * <EditButton ref={editButtonRef} ... />
 * // 调用
 * editButtonRef.current?.open();
 * ```
 */
export const EditButton = forwardRef<EditButtonRef, EditButtonProps>(
  (
    {
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
      onClick,
      visible = true,
      ...restProps
    },
    ref,
  ) => {
    const [loading, setLoading] = useState(false);

    const handleOpen = useCallback(async () => {
      setLoading(true);

      try {
        if (onBeforeOpen) {
          const shouldOpen = await onBeforeOpen();
          if (shouldOpen === false) {
            setLoading(false);
            return;
          }
        }

        const initialValues = await getInitialValues();

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
            return result === true;
          },
          afterClose: onAfterClose,
          ...dialogProps,
        });
      } finally {
        setLoading(false);
      }
    }, [title, width, schemas, getInitialValues, formProps, dialogProps, onSubmit, onBeforeOpen, onAfterClose]);

    useImperativeHandle(
      ref,
      () => ({
        open: handleOpen,
        loading,
      }),
      [handleOpen, loading],
    );

    const { handleClick, shouldRender } = useActionButton({
      visible,
      onClick,
      onTrigger: handleOpen,
    });

    if (!shouldRender) return null;

    return (
      <Button type={type} icon={icon} loading={loading} onClick={handleClick} {...restProps}>
        {text}
      </Button>
    );
  },
);

EditButton.displayName = 'EditButton';

export default EditButton;
