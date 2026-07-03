/**
 * 跳转按钮组件
 *
 * 封装了"点击按钮 → 页面跳转"的完整交互流程。
 * 支持当前窗口跳转和新窗口打开两种方式，可通过 onBeforeJump 在跳转前进行拦截校验。
 * 可通过 ref.jump() 进行命令式调用。
 */
import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@arco-design/web-react';
import { IconArrowRight } from '@arco-design/web-react/icon';
import { useActionButton } from '@lania-pro-components/shared';
import type { JumpButtonProps, JumpButtonRef } from './types';

/**
 * 跳转按钮组件
 * @description 点击后跳转到指定页面，支持内部路由或外部链接
 * @example
 * ```tsx
 * // 内部跳转
 * <JumpButton
 *   text="查看详情"
 *   to="/users/123"
 * />
 *
 * // 外部链接
 * <JumpButton
 *   text="访问官网"
 *   to="https://example.com"
 *   target="_blank"
 * />
 *
 * // 通过 ref 手动触发
 * const jumpButtonRef = useRef<JumpButtonRef>(null);
 * <JumpButton ref={jumpButtonRef} ... />
 * // 调用
 * jumpButtonRef.current?.jump();
 * ```
 */
export const JumpButton = forwardRef<JumpButtonRef, JumpButtonProps>(
  (
    {
      text = '跳转',
      type = 'text',
      icon = <IconArrowRight />,
      to,
      target = '_self',
      onBeforeJump,
      onClick,
      visible = true,
      ...restProps
    },
    ref,
  ) => {
    const handleJump = useCallback(async () => {
      if (onBeforeJump) {
        const shouldJump = await onBeforeJump();
        if (shouldJump === false) {
          return;
        }
      }

      if (target === '_blank') {
        window.open(to, '_blank');
      } else {
        window.location.href = to;
      }
    }, [to, target, onBeforeJump]);

    useImperativeHandle(
      ref,
      () => ({
        jump: handleJump,
      }),
      [handleJump],
    );

    const { handleClick, shouldRender } = useActionButton({
      visible,
      onClick,
      onTrigger: handleJump,
    });

    if (!shouldRender) return null;

    return (
      <Button type={type} icon={icon} onClick={handleClick} {...restProps}>
        {text}
      </Button>
    );
  },
);

JumpButton.displayName = 'JumpButton';

export default JumpButton;
