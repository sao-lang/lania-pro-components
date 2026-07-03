/**
 * 新增按钮组件
 *
 * 封装了"点击按钮 → 打开表单弹窗 → 提交"的完整交互流程。
 * 基于 ProDialog.form 打开 Schema 驱动的表单弹窗，支持自定义字段配置和提交逻辑。
 * 可通过 ref.open() 进行命令式调用。
 */
import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { ProDialog } from '../ProDialog';
import type { AddButtonProps, AddButtonRef } from './types';

/**
 * 新增按钮组件
 * @description 点击后弹出表单弹窗，支持自定义表单配置和提交逻辑
 * @example
 * ```tsx
 * // 基础用法
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
 *
 * // 通过 ref 手动触发
 * const addButtonRef = useRef<AddButtonRef>(null);
 * <AddButton ref={addButtonRef} ... />
 * // 调用
 * addButtonRef.current?.open();
 * ```
 */
export const AddButton = forwardRef<AddButtonRef, AddButtonProps>(
  (
    {
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
      onClick,
      visible = true,
      ...restProps
    },
    ref,
  ) => {
    const handleOpen = useCallback(async () => {
      if (onBeforeOpen) {
        const shouldOpen = await onBeforeOpen();
        if (shouldOpen === false) {
          return;
        }
      }

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
    }, [title, width, schemas, initialValues, formProps, dialogProps, onSubmit, onBeforeOpen, onAfterClose]);

    useImperativeHandle(
      ref,
      () => ({
        open: handleOpen,
      }),
      [handleOpen],
    );

    const handleClick = useCallback(
      (e: Event) => {
        onClick?.(e);
        void handleOpen();
      },
      [onClick, handleOpen],
    );

    if (!visible) {
      return null;
    }

    return (
      <Button type={type} icon={icon} onClick={handleClick} {...restProps}>
        {text}
      </Button>
    );
  },
);

AddButton.displayName = 'AddButton';

export default AddButton;
