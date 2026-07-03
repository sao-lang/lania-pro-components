/**
 * CopyButton — 复制按钮组件
 *
 * 消费 ProTable/utils/columnRender 的 copyToClipboard（Arco Message 包装版）
 * 支持 text / tooltip / icon 配置
 */

import React, { useCallback } from 'react';
import { Tooltip } from '@arco-design/web-react';
import { IconCopy } from '@arco-design/web-react/icon';
import { copyToClipboard } from '../ProTable/utils/columnRender';

export interface CopyButtonProps {
  /** 要复制的文本 */
  text: string;
  /** 自定义提示文本 */
  tooltip?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, tooltip = '复制' }) => {
  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      copyToClipboard(text);
    },
    [text],
  );

  return (
    <Tooltip content={tooltip}>
      <IconCopy
        style={{
          cursor: 'pointer',
          color: 'var(--color-text-3)',
          fontSize: 12,
          flexShrink: 0,
        }}
        onClick={handleCopy}
      />
    </Tooltip>
  );
};
