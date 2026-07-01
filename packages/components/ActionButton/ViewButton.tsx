import React, { useCallback } from 'react';
import { Button } from '@arco-design/web-react';
import { IconEye } from '@arco-design/web-react/icon';
import { ProDialog } from '../ProDialog';
import type { ViewButtonProps } from './types';

/**
 * 查看按钮组件
 * @description 点击后弹出详情弹窗，展示自定义内容
 * @example
 * ```tsx
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
 * ```
 */
export const ViewButton: React.FC<ViewButtonProps> = ({
  text = '查看',
  title = '查看详情',
  type = 'text',
  icon = <IconEye />,
  width = 600,
  renderContent,
  dialogProps,
  visible = true,
  style,
  className,
  disabled,
  size,
  shape,
  ghost,
  autoInsertSpace,
}) => {
  const handleClick = useCallback(() => {
    // 打开详情弹窗
    ProDialog.open({
      title,
      width,
      content: renderContent(),
      showOk: false,
      cancelText: '关闭',
      ...dialogProps,
    });
  }, [title, width, renderContent, dialogProps]);

  if (!visible) {
    return null;
  }

  return (
    <Button
      type={type}
      icon={icon}
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

export default ViewButton;
