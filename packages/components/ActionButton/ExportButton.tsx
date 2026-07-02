import React, { useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@arco-design/web-react';
import { IconDownload } from '@arco-design/web-react/icon';
import type { ExportButtonProps, ExportButtonRef } from './types';

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
 *
 * // 通过 ref 手动触发
 * const exportButtonRef = useRef<ExportButtonRef>(null);
 * <ExportButton ref={exportButtonRef} ... />
 * // 调用
 * exportButtonRef.current?.export();
 * ```
 */
export const ExportButton = forwardRef<ExportButtonRef, ExportButtonProps>(
  (
    {
      text = '导出',
      type = 'secondary',
      icon = <IconDownload />,
      exportUrl,
      params,
      fileName,
      onExport,
      onBeforeExport,
      visible = true,
      timeout,
      headers,
      onClick,
      ...restProps
    },
    ref,
  ) => {
    const [loading, setLoading] = useState(false);

    const handleExport = useCallback(async () => {
      if (onBeforeExport) {
        const shouldExport = await onBeforeExport();
        if (shouldExport === false) {
          return;
        }
      }

      setLoading(true);

      try {
        if (onExport) {
          await onExport();
        } else if (exportUrl) {
          await defaultExport(exportUrl, params, fileName, { timeout, headers });
        }
      } finally {
        setLoading(false);
      }
    }, [exportUrl, params, fileName, onExport, onBeforeExport, timeout, headers]);

    useImperativeHandle(
      ref,
      () => ({
        export: handleExport,
        loading,
      }),
      [handleExport, loading],
    );

    const handleClick = useCallback(
      (e: Event) => {
        onClick?.(e);
        void handleExport();
      },
      [onClick, handleExport],
    );

    if (!visible) {
      return null;
    }

    return (
      <Button type={type} icon={icon} loading={loading} onClick={handleClick} {...restProps}>
        {text}
      </Button>
    );
  },
);

ExportButton.displayName = 'ExportButton';

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const queryParams = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';

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

    const contentDisposition = response.headers.get('content-disposition');
    const downloadFileName =
      fileName || (contentDisposition ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') : 'download');

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
