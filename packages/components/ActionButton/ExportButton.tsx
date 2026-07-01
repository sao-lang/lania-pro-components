import React, { useCallback, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { IconDownload } from '@arco-design/web-react/icon';
import type { ExportButtonProps } from './types';

/**
 * 导出按钮组件
 * @description 点击后执行导出操作，支持自定义导出方法或导出地址
 * @example
 * ```tsx
 * // 使用导出地址
 * <ExportButton
 *   text="导出Excel"
 *   exportUrl="/api/users/export"
 *   params={{ status: 'active' }}
 *   fileName="用户列表.xlsx"
 * />
 *
 * // 使用自定义导出方法
 * <ExportButton
 *   text="导出数据"
 *   onExport={async () => {
 *     const data = await fetchExportData();
 *     downloadFile(data, '导出数据.xlsx');
 *   }}
 * />
 * ```
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
  text = '导出',
  type = 'secondary',
  icon = <IconDownload />,
  exportUrl,
  params,
  fileName,
  onExport,
  onBeforeExport,
  visible = true,
  style,
  className,
  timeout,
  headers,
  disabled,
  size,
  shape,
  ghost,
  autoInsertSpace,
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    // 导出前的回调
    if (onBeforeExport) {
      const shouldExport = await onBeforeExport();
      if (shouldExport === false) {
        return;
      }
    }

    setLoading(true);

    try {
      if (onExport) {
        // 使用自定义导出方法
        await onExport();
      } else if (exportUrl) {
        // 使用默认导出方式
        await defaultExport(exportUrl, params, fileName, { timeout, headers });
      }
    } finally {
      setLoading(false);
    }
  }, [exportUrl, params, fileName, onExport, onBeforeExport, timeout, headers]);

  if (!visible) {
    return null;
  }

  return (
    <Button
      type={type}
      icon={icon}
      loading={loading}
      onClick={handleExport as unknown as () => void}
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

/**
 * 默认导出方法
 */
async function defaultExport(
  url: string,
  params?: Record<string, unknown>,
  fileName?: string,
  options?: {
    timeout?: number;
    headers?: Record<string, string>;
  },
): Promise<void> {
  const { timeout = 60000, headers = {} } = options || {};

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 构建查询参数
    const queryParams = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';

    // 发起请求
    const response = await fetch(url + queryParams, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`导出失败: ${response.status} ${response.statusText}`);
    }

    // 获取文件名
    const contentDisposition = response.headers.get('content-disposition');
    const downloadFileName =
      fileName || (contentDisposition ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') : 'download');

    // 下载文件
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadFileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } finally {
    clearTimeout(timeoutId);
  }
}

export default ExportButton;
