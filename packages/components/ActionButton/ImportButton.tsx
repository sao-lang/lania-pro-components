import React, { useCallback, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Button, Upload } from '@arco-design/web-react';
import { IconUpload } from '@arco-design/web-react/icon';
import { ProDialog } from '../ProDialog';
import type { ImportButtonProps, ImportButtonRef } from './types';

/**
 * 导入按钮组件
 * @description 点击后弹出上传弹窗，支持文件上传
 * @example
 * ```tsx
 * // 基础用法
 * <ImportButton
 *   text="批量导入"
 *   title="导入用户"
 *   uploadUrl="/api/users/import"
 *   accept=".xlsx,.xls"
 *   onSuccess={(result) => {
 *     Message.success('导入成功');
 *   }}
 * />
 *
 * // 通过 ref 手动触发
 * const importButtonRef = useRef<ImportButtonRef>(null);
 * <ImportButton ref={importButtonRef} ... />
 * // 打开弹窗
 * importButtonRef.current?.open();
 * // 执行上传
 * const success = await importButtonRef.current?.upload();
 * ```
 */
export const ImportButton = forwardRef<ImportButtonRef, ImportButtonProps>(
  (
    {
      text = '导入',
      type = 'secondary',
      icon = <IconUpload />,
      uploadUrl,
      uploadParams,
      accept = '.xlsx,.xls,.csv',
      multiple = false,
      title = '导入数据',
      width = 500,
      dialogProps,
      renderUpload,
      onSuccess,
      onImportError,
      visible = true,
      ...restProps
    },
    ref,
  ) => {
    const [fileList, setFileList] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const uploadRef = useRef<{ close: () => void } | null>(null);

    const getFileKey = (file: File): string => `${file.name}-${file.size}-${file.lastModified}`;

    const handleUpload = useCallback(async () => {
      if (fileList.length === 0) {
        ProDialog.message.warning('请选择要上传的文件');
        return false;
      }

      setUploading(true);

      try {
        const formData = new FormData();
        fileList.forEach((file) => {
          formData.append('file', file);
        });

        if (uploadParams) {
          Object.entries(uploadParams).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
        }

        const response = await fetch(uploadUrl || '', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        const result = (await response.json()) as unknown;
        ProDialog.message.success('导入成功');
        onSuccess?.(result);
        setFileList([]);
        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('上传失败');
        ProDialog.message.error(err.message);
        onImportError?.(err);
        return false;
      } finally {
        setUploading(false);
      }
    }, [fileList, uploadUrl, uploadParams, onSuccess, onImportError]);

    const handleOpen = useCallback(() => {
      setFileList([]);

      const dialog = ProDialog.open({
        title,
        width,
        content: renderUpload ? (
          renderUpload()
        ) : (
          <Upload
            drag
            accept={accept}
            multiple={multiple}
            customRequest={({ file, onSuccess: onUploadSuccess }) => {
              const originFile = (file as unknown as { originFile?: File }).originFile || file;
              const fileKey = getFileKey(originFile);
              const isDuplicate = fileList.some((f) => getFileKey(f) === fileKey);

              if (!isDuplicate) {
                setFileList((prev) => [...prev, originFile]);
              } else {
                ProDialog.message.warning('该文件已添加');
              }
              onUploadSuccess?.();
            }}
            onRemove={(file) => {
              const fileToRemove = fileList.find((f) => {
                const originalFile = file as unknown as { originFile?: File };
                if (originalFile.originFile) {
                  return getFileKey(originalFile.originFile) === getFileKey(f);
                }
                return f.name === file.name;
              });

              if (fileToRemove) {
                const fileKey = getFileKey(fileToRemove);
                setFileList((prev) => prev.filter((f) => getFileKey(f) !== fileKey));
              }
              return true;
            }}
            fileList={fileList.map((file, index) => ({
              uid: String(index),
              name: file.name,
              status: 'done' as const,
              originFile: file,
            }))}
            tip='支持 Excel、CSV 格式文件'
          />
        ),
        onOk: handleUpload,
        confirmLoading: uploading,
        ...dialogProps,
      });

      uploadRef.current = dialog;
    }, [title, width, renderUpload, accept, multiple, fileList, handleUpload, uploading, dialogProps]);

    useImperativeHandle(
      ref,
      () => ({
        open: handleOpen,
        loading: uploading,
      }),
      [handleOpen, uploading],
    );

    if (!visible) {
      return null;
    }

    return (
      <Button type={type} icon={icon} onClick={handleOpen} {...restProps}>
        {text}
      </Button>
    );
  },
);

ImportButton.displayName = 'ImportButton';

export default ImportButton;
