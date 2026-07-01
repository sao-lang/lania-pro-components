import React, { useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { IconArrowRight } from '@arco-design/web-react/icon';
import type { JumpButtonProps } from './types';

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
 * ```
 */
export const JumpButton: React.FC<JumpButtonProps> = ({
  text = '跳转',
  type = 'text',
  icon = <IconArrowRight />,
  to,
  target = '_self',
  onBeforeJump,
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
    // 跳转前的回调
    if (onBeforeJump) {
      const shouldJump = await onBeforeJump();
      if (shouldJump === false) {
        return;
      }
    }

    // 执行跳转
    if (target === '_blank') {
      window.open(to, '_blank');
    } else {
      window.location.href = to;
    }
  }, [to, target, onBeforeJump]);

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

export default JumpButton;
