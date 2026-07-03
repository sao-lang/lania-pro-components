/**
 * 查看按钮组件
 *
 * 封装了"点击按钮 → 打开详情展示弹窗"的完整交互流程。
 * 弹窗内容通过 renderContent 自定义渲染，不包含表单，纯展示用途。
 * 可通过 ref.open() 进行命令式调用。
 */
import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@arco-design/web-react';
import { IconEye } from '@arco-design/web-react/icon';
import { useActionButton } from '@lania-pro-components/shared';
import { ProDialog } from '../ProDialog';
import type { ViewButtonProps, ViewButtonRef } from './types';

/**
 * 查看按钮组件
 * @description 点击后弹出详情弹窗，展示自定义内容
 * @example
 * ```tsx
 * // 基础用法
 * <ViewButton
 *   text="查看"
 *   title="用户详情"
 *   renderContent={() => (
 *     <div>
 *       <p>姓名: {record.name}</p>
 *       <p>邮箱: {record.email}</p>
 *     </div>
 *   )}
 * />
 *
 * // 通过 ref 手动触发
 * const viewButtonRef = useRef<ViewButtonRef>(null);
 * <ViewButton ref={viewButtonRef} ... />
 * // 调用
 * viewButtonRef.current?.open();
 * ```
 */
export const ViewButton = forwardRef<ViewButtonRef, ViewButtonProps>(
  (
    {
      text = '查看',
      title = '查看详情',
      type = 'text',
      icon = <IconEye />,
      width = 600,
      renderContent,
      dialogProps,
      onClick,
      visible = true,
      ...restProps
    },
    ref,
  ) => {
    const handleOpen = useCallback(() => {
      ProDialog.open({
        title,
        width,
        content: renderContent(),
        showOk: false,
        cancelText: '关闭',
        ...dialogProps,
      });
    }, [title, width, renderContent, dialogProps]);

    useImperativeHandle(
      ref,
      () => ({
        open: handleOpen,
      }),
      [handleOpen],
    );

    const { handleClick, shouldRender } = useActionButton({
      visible,
      onClick,
      onTrigger: handleOpen,
    });

    if (!shouldRender) return null;

    return (
      <Button type={type} icon={icon} onClick={handleClick} {...restProps}>
        {text}
      </Button>
    );
  },
);

ViewButton.displayName = 'ViewButton';

export default ViewButton;
