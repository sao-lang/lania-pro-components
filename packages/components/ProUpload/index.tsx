import { forwardRef, useImperativeHandle, useRef, useState, useCallback, useMemo } from 'react';
import { Upload, Button, Message, Image, Modal, Progress, Space, Tooltip } from '@arco-design/web-react';
import type { UploadInstance } from '@arco-design/web-react/es/Upload';
import {
  IconPlus,
  IconDelete,
  IconEye,
  IconUpload,
  IconDownload,
  IconArrowUp,
  IconArrowDown,
} from '@arco-design/web-react/icon';
import type { ProUploadProps, ProUploadInstance, ProUploadFileItem, BeforeUploadResult } from './types';
import { isVideo } from '@lania-pro-components/utils';

/**
 * 默认文件类型配置
 */
const DEFAULT_ACCEPT_MAP: Record<string, string> = {
  image: 'image/*',
  video: 'video/*',
  file: '*',
};

/**
 * 检查文件类型
 */
const checkFileType = (file: File, type: string): boolean => {
  if (type === 'image') {
    return file.type.startsWith('image/');
  }
  if (type === 'video') {
    return file.type.startsWith('video/');
  }
  return true;
};

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * 图片压缩
 */
const compressImage = (
  file: File,
  config: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    type?: string;
  },
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      let { width, height } = img;
      const { maxWidth, maxHeight, quality = 0.8, type = 'image/jpeg' } = config;

      if (maxWidth && width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (maxHeight && height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        type,
        quality,
      );
    };
    img.onerror = () => reject(new Error('Image load error'));
    img.src = URL.createObjectURL(file);
  });

/**
 * ProUpload 组件 - 增强版上传组件
 */
const ProUploadComponent = forwardRef<ProUploadInstance, ProUploadProps>(
  (
    {
      fileList: controlledFileList,
      type = 'image',
      config = {},
      previewConfig = {},
      onChange,
      beforeUpload,
      onSuccess,
      onError,
      onProgresChange,
      onRemove,
      onPreview,
      customUpload,
      onRequest,
      showUploadButton = true,
      uploadButtonText = '上传',
      uploadButtonIcon,
      renderUploadButton,
      renderFileList,
      listType = 'picture-card',
      draggable = false,
      dragText = '点击或拖拽文件到此处',
      dragDescription,
      showFileInfo = true,
      autoUpload = true,
      tip,
      uploadClassName,
      uploadStyle,
      showTotalProgress = false,
      renderTotalProgress,
      sortable = false,
      onSort,
      emptyRender,
      showCount = false,
      countFormat = '{current}/{max}',
      retryCount = 0,
      retryInterval = 3000,
      disabled,
      multiple,
      ...restProps
    },
    ref,
  ) => {
    const [fileList, setFileList] = useState<ProUploadFileItem[]>(controlledFileList || []);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewFile, setPreviewFile] = useState<ProUploadFileItem | null>(null);
    const uploadRef = useRef<UploadInstance>(null);
    const retryMapRef = useRef<Map<string, number>>(new Map());

    const finalFileList = controlledFileList !== undefined ? controlledFileList : fileList;

    const {
      maxCount = 1,
      maxSize = 10,
      accept,
      imageConfig,
      videoConfig,
      compressConfig,
    } = useMemo(() => ({ ...config, type }), [config, type]);

    const finalPreviewConfig = useMemo(
      () => ({
        enable: true,
        type: 'modal',
        showThumbnail: true,
        thumbnailWidth: 100,
        thumbnailHeight: 100,
        showDelete: true,
        showDownload: false,
        ...previewConfig,
      }),
      [previewConfig],
    );

    const finalAccept = accept || DEFAULT_ACCEPT_MAP[type];

    // 更新文件列表
    const updateFileList = useCallback(
      (newFileList: ProUploadFileItem[] | ((prev: ProUploadFileItem[]) => ProUploadFileItem[])) => {
        const updatedList = typeof newFileList === 'function' ? newFileList(finalFileList) : newFileList;
        if (controlledFileList === undefined) {
          setFileList(updatedList);
        }
        onChange?.(updatedList);
      },
      [finalFileList, controlledFileList, onChange],
    );

    // 校验文件
    const validateFile = useCallback(
      async (file: File): Promise<BeforeUploadResult> => {
        if (!checkFileType(file, type)) {
          return {
            valid: false,
            message: `请上传${type === 'image' ? '图片' : type === 'video' ? '视频' : '文件'}格式`,
          };
        }

        if (maxSize && file.size > maxSize * 1024 * 1024) {
          return { valid: false, message: `文件大小不能超过 ${maxSize}MB` };
        }

        if (type === 'image' && imageConfig?.limitSize) {
          const result = await new Promise<BeforeUploadResult>((resolve) => {
            const img = document.createElement('img');
            img.onload = () => {
              const { maxWidth, maxHeight, minWidth, minHeight } = imageConfig;
              if (maxWidth && img.width > maxWidth) {
                resolve({
                  valid: false,
                  message: `图片宽度不能超过 ${maxWidth}px`,
                });
                return;
              }
              if (maxHeight && img.height > maxHeight) {
                resolve({
                  valid: false,
                  message: `图片高度不能超过 ${maxHeight}px`,
                });
                return;
              }
              if (minWidth && img.width < minWidth) {
                resolve({
                  valid: false,
                  message: `图片宽度不能小于 ${minWidth}px`,
                });
                return;
              }
              if (minHeight && img.height < minHeight) {
                resolve({
                  valid: false,
                  message: `图片高度不能小于 ${minHeight}px`,
                });
                return;
              }
              resolve({ valid: true });
            };
            img.onerror = () => resolve({ valid: false, message: '图片加载失败' });
            img.src = URL.createObjectURL(file);
          });
          if (!result.valid) {
            return result;
          }
        }

        if (type === 'video' && videoConfig?.limitDuration) {
          const result = await new Promise<BeforeUploadResult>((resolve) => {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
              const { maxDuration, minDuration } = videoConfig;
              if (maxDuration && video.duration > maxDuration) {
                resolve({
                  valid: false,
                  message: `视频时长不能超过 ${maxDuration}秒`,
                });
                return;
              }
              if (minDuration && video.duration < minDuration) {
                resolve({
                  valid: false,
                  message: `视频时长不能小于 ${minDuration}秒`,
                });
                return;
              }
              resolve({ valid: true });
            };
            video.onerror = () => resolve({ valid: false, message: '视频加载失败' });
            video.src = URL.createObjectURL(file);
          });
          if (!result.valid) {
            return result;
          }
        }

        if (beforeUpload) {
          const result = await beforeUpload(file);
          return result;
        }

        return { valid: true };
      },
      [type, maxSize, imageConfig, videoConfig, beforeUpload],
    );

    // 处理上传
    const handleUpload = useCallback(
      async (fileItem: ProUploadFileItem) => {
        const file = fileItem.originFile;
        if (!file) {
          return;
        }

        // 图片压缩
        let processedFile = file;
        if (type === 'image' && compressConfig?.enable) {
          try {
            const compressedBlob = await compressImage(file, compressConfig);
            processedFile = new File([compressedBlob], file.name, {
              type: compressedBlob.type,
            });
          } catch (error) {
            console.warn('图片压缩失败，使用原图:', error);
          }
        }

        onRequest?.({ file: fileItem, status: 'start', percent: 0 });

        updateFileList((prev) =>
          prev.map((item) => (item.uid === fileItem.uid ? { ...item, status: 'uploading', percent: 0 } : item)),
        );

        const attemptUpload = async (): Promise<string> => {
          if (!customUpload) {
            throw new Error('请配置 customUpload 上传函数');
          }

          return customUpload(processedFile, (percent) => {
            updateFileList((prev) => prev.map((item) => (item.uid === fileItem.uid ? { ...item, percent } : item)));
            onProgresChange?.(fileItem, percent);
            onRequest?.({ file: fileItem, status: 'progress', percent });
          });
        };

        try {
          const url = await attemptUpload();
          updateFileList((prev) =>
            prev.map((item) => (item.uid === fileItem.uid ? { ...item, status: 'done', url, percent: 100 } : item)),
          );
          retryMapRef.current.delete(fileItem.uid);
          onRequest?.({ file: fileItem, status: 'success', percent: 100, url });
          onSuccess?.(fileItem, url);
        } catch (error) {
          const currentRetry = retryMapRef.current.get(fileItem.uid) || 0;
          if (currentRetry < retryCount) {
            retryMapRef.current.set(fileItem.uid, currentRetry + 1);
            setTimeout(() => handleUpload(fileItem), retryInterval);
          } else {
            const errorMessage = error instanceof Error ? error.message : '上传失败';
            updateFileList((prev) =>
              prev.map((item) => (item.uid === fileItem.uid ? { ...item, status: 'error', errorMessage } : item)),
            );
            retryMapRef.current.delete(fileItem.uid);
            onRequest?.({ file: fileItem, status: 'error', errorMessage });
            onError?.(fileItem, errorMessage);
          }
        }
      },
      [
        type,
        compressConfig,
        customUpload,
        onRequest,
        retryCount,
        retryInterval,
        updateFileList,
        onProgresChange,
        onSuccess,
        onError,
      ],
    );

    // 上传所有待上传文件
    const upload = useCallback(async () => {
      const pendingFiles = finalFileList.filter((item) => item.status === 'init');
      await Promise.all(pendingFiles.map((file) => handleUpload(file)));
    }, [finalFileList, handleUpload]);

    // 清空文件列表
    const clear = useCallback(() => {
      updateFileList([]);
      retryMapRef.current.clear();
    }, [updateFileList]);

    // 移除文件
    const remove = useCallback(
      async (file: ProUploadFileItem | string) => {
        const uid = typeof file === 'string' ? file : file.uid;
        const fileItem = finalFileList.find((item) => item.uid === uid);
        if (!fileItem) {
          return;
        }

        if (onRemove) {
          const result = await onRemove(fileItem);
          if (result === false) {
            return;
          }
        }

        updateFileList((prev) => prev.filter((item) => item.uid !== uid));
        retryMapRef.current.delete(uid);
      },
      [finalFileList, onRemove, updateFileList],
    );

    // 移动文件位置（排序）
    const moveFile = useCallback(
      (uid: string, direction: 'up' | 'down') => {
        updateFileList((prev) => {
          const newList = [...prev];
          const index = newList.findIndex((item) => item.uid === uid);
          if (index === -1) {
            return prev;
          }

          if (direction === 'up' && index > 0) {
            [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
          } else if (direction === 'down' && index < newList.length - 1) {
            [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
          }

          onSort?.(newList);
          return newList;
        });
      },
      [updateFileList, onSort],
    );

    // 打开文件选择对话框
    interface UploadRefInternal {
      uploadRef?: HTMLElement | null;
    }

    const openFileDialog = useCallback(() => {
      if (uploadRef.current) {
        const uploadElement = (uploadRef.current as unknown as UploadRefInternal)?.uploadRef;
        if (uploadElement?.click) {
          uploadElement.click();
        }
      }

      const container = document.querySelector('.arco-upload');
      const input = container?.querySelector<HTMLInputElement>('input[type="file"]');
      if (input) {
        input.click();
      }
    }, []);

    // 预览文件
    const preview = useCallback(
      (file: ProUploadFileItem | string) => {
        const uid = typeof file === 'string' ? file : file.uid;
        const fileItem = finalFileList.find((item) => item.uid === uid);
        if (fileItem) {
          setPreviewFile(fileItem);
          setPreviewVisible(true);
          onPreview?.(fileItem);
        }
      },
      [finalFileList, onPreview],
    );

    // 重试失败的文件
    const retry = useCallback(async () => {
      const failedFiles = finalFileList.filter((item) => item.status === 'error');
      retryMapRef.current.clear();
      await Promise.all(failedFiles.map((file) => handleUpload(file)));
    }, [finalFileList, handleUpload]);

    // 获取上传统计
    const getStats = useCallback(() => {
      const stats = {
        total: finalFileList.length,
        uploading: 0,
        success: 0,
        error: 0,
        pending: 0,
      };
      finalFileList.forEach((item) => {
        switch (item.status) {
          case 'uploading':
            stats.uploading++;
            break;
          case 'done':
            stats.success++;
            break;
          case 'error':
            stats.error++;
            break;
          default:
            stats.pending++;
        }
      });
      return stats;
    }, [finalFileList]);

    // 暴露实例方法
    useImperativeHandle(ref, () => ({
      upload,
      clear,
      getFileList: () => finalFileList,
      setFileList: updateFileList,
      remove,
      openFileDialog,
      preview,
      retry,
      getStats,
    }));

    // 处理文件列表变化
    const handleChange = useCallback(
      (newFileList: ProUploadFileItem[], file: ProUploadFileItem) => {
        if (file.originFile && file.status === 'init') {
          validateFile(file.originFile).then((result) => {
            if (!result.valid) {
              Message.error(result.message || '文件校验失败');
              updateFileList((prev) => prev.filter((item) => item.uid !== file.uid));
              return;
            }

            if (maxCount && finalFileList.length >= maxCount && !multiple) {
              Message.error(`最多只能上传 ${maxCount} 个文件`);
              updateFileList((prev) => prev.filter((item) => item.uid !== file.uid));
              return;
            }

            updateFileList(newFileList);

            if (autoUpload) {
              handleUpload(file);
            }
          });
        } else {
          updateFileList(newFileList);
        }
      },
      [validateFile, maxCount, multiple, finalFileList.length, autoUpload, handleUpload, updateFileList],
    );

    // 处理移除
    const handleRemove = useCallback(
      async (file: ProUploadFileItem) => {
        await remove(file);
        return true;
      },
      [remove],
    );

    // 渲染预览
    const renderPreviewModal = useCallback(() => {
      if (!previewFile) {
        return null;
      }
      const isVideoFile = isVideo(previewFile.url || previewFile.name || '');

      return (
        <Modal
          visible={previewVisible}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          style={{ width: isVideoFile ? 800 : 'auto' }}
          unmountOnExit
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            {isVideoFile ? (
              <video
                src={previewFile.url}
                poster={previewFile.poster}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
            ) : (
              <Image
                src={previewFile.url}
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                {...finalPreviewConfig.imageProps}
              />
            )}
          </div>
        </Modal>
      );
    }, [previewFile, previewVisible, finalPreviewConfig.imageProps]);

    // 渲染上传按钮
    const renderButton = useCallback(() => {
      if (renderUploadButton) {
        return renderUploadButton();
      }

      const icon = uploadButtonIcon || <IconPlus />;

      if (listType === 'picture-card') {
        return (
          <div style={{ textAlign: 'center' }}>
            {icon}
            <div style={{ marginTop: 8 }}>{uploadButtonText}</div>
          </div>
        );
      }

      return (
        <Button icon={icon} disabled={disabled}>
          {uploadButtonText}
        </Button>
      );
    }, [renderUploadButton, uploadButtonIcon, uploadButtonText, listType, disabled]);

    // 渲染自定义文件列表
    const renderUploadList = useCallback(
      (files: ProUploadFileItem[], _props: object) => {
        if (renderFileList) {
          return renderFileList(files, {
            onRemove: remove,
            onPreview: preview,
          });
        }

        if (files.length === 0 && emptyRender) {
          return emptyRender;
        }

        if (listType === 'text') {
          return (
            <div style={{ marginTop: 8 }}>
              {files.map((file) => (
                <div
                  key={file.uid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: '1px solid #f0f0f0',
                    background: file.status === 'error' ? '#fff2f0' : 'transparent',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </span>
                  <span style={{ marginLeft: 8, color: '#86909c', fontSize: 12 }}>
                    {formatFileSize(file.originFile?.size || 0)}
                  </span>
                  {file.status === 'uploading' && (
                    <Progress size='small' percent={file.percent || 0} style={{ width: 100, marginLeft: 8 }} />
                  )}
                  {file.status === 'error' && (
                    <Tooltip content={file.errorMessage}>
                      <span style={{ marginLeft: 8, color: '#f53f3f' }}>上传失败</span>
                    </Tooltip>
                  )}
                  <Space size='small' style={{ marginLeft: 8 }}>
                    {sortable && (
                      <>
                        <Button
                          type='text'
                          size='small'
                          icon={<IconArrowUp />}
                          onClick={() => moveFile(file.uid, 'up')}
                          disabled={files.indexOf(file) === 0}
                        />
                        <Button
                          type='text'
                          size='small'
                          icon={<IconArrowDown />}
                          onClick={() => moveFile(file.uid, 'down')}
                          disabled={files.indexOf(file) === files.length - 1}
                        />
                      </>
                    )}
                    {finalPreviewConfig.enable && file.url && (
                      <Button type='text' size='small' icon={<IconEye />} onClick={() => preview(file)} />
                    )}
                    {finalPreviewConfig.showDownload && file.url && (
                      <Button
                        type='text'
                        size='small'
                        icon={<IconDownload />}
                        onClick={() => window.open(file.url, '_blank')}
                      />
                    )}
                    {finalPreviewConfig.showDelete && (
                      <Button type='text' size='small' icon={<IconDelete />} onClick={() => remove(file)} />
                    )}
                  </Space>
                </div>
              ))}
            </div>
          );
        }

        return null;
      },
      [renderFileList, listType, finalPreviewConfig, preview, remove, sortable, moveFile, emptyRender],
    );

    // 渲染总进度
    const renderTotalProgressBar = useCallback(() => {
      if (!showTotalProgress) {
        return null;
      }

      const stats = getStats();
      const totalPercent = stats.total > 0 ? Math.round((stats.success * 100 + stats.uploading * 50) / stats.total) : 0;

      if (renderTotalProgress) {
        return renderTotalProgress(totalPercent, stats.success, stats.total);
      }

      return (
        <div style={{ marginBottom: 16 }}>
          <Progress
            percent={totalPercent}
            formatText={() => `${stats.success}/${stats.total}`}
            status={stats.error > 0 ? 'error' : 'success'}
          />
        </div>
      );
    }, [showTotalProgress, getStats, renderTotalProgress]);

    // 渲染文件计数
    const renderCount = useCallback(() => {
      if (!showCount) {
        return null;
      }
      const text = countFormat.replace('{current}', String(finalFileList.length)).replace('{max}', String(maxCount));
      return <div style={{ marginTop: 8, color: '#86909c', fontSize: 12 }}>{text}</div>;
    }, [showCount, countFormat, finalFileList.length, maxCount]);

    // 渲染拖拽区域
    const renderDragger = useCallback(
      () => (
        <Upload
          {...restProps}
          ref={uploadRef}
          fileList={finalFileList}
          accept={finalAccept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          onRemove={handleRemove}
          renderUploadList={renderUploadList}
          customRequest={() => {}}
          drag
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <IconUpload style={{ fontSize: 48, color: '#c9cdd4' }} />
            <div style={{ marginTop: 16, color: '#1d2129', fontSize: 16 }}>{dragText}</div>
            {dragDescription && <div style={{ marginTop: 8, color: '#86909c', fontSize: 14 }}>{dragDescription}</div>}
            {showFileInfo && (
              <div style={{ marginTop: 8, color: '#86909c', fontSize: 12 }}>
                支持 {type === 'image' ? 'JPG、PNG、GIF' : type === 'video' ? 'MP4、MOV' : '任意'} 格式， 单个文件不超过{' '}
                {maxSize}MB
              </div>
            )}
          </div>
        </Upload>
      ),
      [
        restProps,
        finalFileList,
        finalAccept,
        multiple,
        disabled,
        handleChange,
        handleRemove,
        renderUploadList,
        dragText,
        dragDescription,
        showFileInfo,
        type,
        maxSize,
      ],
    );

    // 渲染普通上传
    const renderUpload = useCallback(
      () => (
        <Upload
          {...restProps}
          ref={uploadRef}
          fileList={finalFileList}
          accept={finalAccept}
          multiple={multiple}
          disabled={disabled}
          listType={listType}
          onChange={handleChange}
          onRemove={handleRemove}
          renderUploadList={renderUploadList}
          customRequest={() => {}}
        >
          {showUploadButton && finalFileList.length < maxCount ? renderButton() : null}
        </Upload>
      ),
      [
        restProps,
        finalFileList,
        finalAccept,
        multiple,
        disabled,
        listType,
        handleChange,
        handleRemove,
        renderUploadList,
        showUploadButton,
        maxCount,
        renderButton,
      ],
    );

    return (
      <div className={uploadClassName} style={uploadStyle}>
        {renderTotalProgressBar()}
        {draggable ? renderDragger() : renderUpload()}
        {renderCount()}
        {tip && <div style={{ marginTop: 8, color: '#86909c', fontSize: 12 }}>{tip}</div>}
        {renderPreviewModal()}
      </div>
    );
  },
);

ProUploadComponent.displayName = 'ProUpload';

export const ProUpload = ProUploadComponent;
export type { ProUploadProps, ProUploadInstance, ProUploadFileItem, BeforeUploadResult } from './types';
export default ProUpload;
