import type { UploadProps, ImageProps } from '@arco-design/web-react';
import type { UploadItem } from '@arco-design/web-react/es/Upload';
import type { ReactNode } from 'react';

/**
 * 上传文件类型
 */
export type UploadFileType = 'image' | 'video' | 'file';

/**
 * 上传状态
 */
export type UploadStatus = 'init' | 'uploading' | 'done' | 'error';

/**
 * 上传文件项
 */
export interface ProUploadFileItem extends UploadItem {
  /**
   * 错误信息
   */
  errorMessage?: string;
  /**
   * 文件类型
   */
  fileType?: UploadFileType;
  /**
   * 自定义数据
   */
  customData?: Record<string, unknown>;
  /**
   * 视频封面图
   */
  poster?: string;
  /**
   * 文件描述
   */
  description?: string;
}

/**
 * 上传前校验结果
 */
export interface BeforeUploadResult {
  /**
   * 是否通过校验
   */
  valid: boolean;
  /**
   * 错误信息
   */
  message?: string;
}

/**
 * 图片裁剪配置
 */
export interface ImageCropConfig {
  /**
   * 是否启用裁剪
   * @default false
   */
  enable?: boolean;
  /**
   * 裁剪比例
   * @example 1 / 1  // 正方形
   * @example 16 / 9 // 宽屏
   */
  aspectRatio?: number;
  /**
   * 最小裁剪宽度
   */
  minWidth?: number;
  /**
   * 最小裁剪高度
   */
  minHeight?: number;
  /**
   * 最大裁剪宽度
   */
  maxWidth?: number;
  /**
   * 最大裁剪高度
   */
  maxHeight?: number;
  /**
   * 是否允许自由裁剪
   * @default true
   */
  freeCrop?: boolean;
  /**
   * 裁剪区域形状
   * @default 'rect'
   */
  shape?: 'rect' | 'circle';
}

/**
 * 图片压缩配置
 */
export interface ImageCompressConfig {
  /**
   * 是否启用压缩
   * @default false
   */
  enable?: boolean;
  /**
   * 最大宽度
   */
  maxWidth?: number;
  /**
   * 最大高度
   */
  maxHeight?: number;
  /**
   * 压缩质量 0-1
   * @default 0.8
   */
  quality?: number;
  /**
   * 输出类型
   * @default 'image/jpeg'
   */
  type?: string;
}

/**
 * 上传配置
 */
export interface UploadConfig {
  /**
   * 上传类型
   * @default 'image'
   */
  type?: UploadFileType;
  /**
   * 最大文件数量
   * @default 1
   */
  maxCount?: number;
  /**
   * 最大文件大小（MB）
   * @default 10
   */
  maxSize?: number;
  /**
   * 允许的文件类型
   */
  accept?: string;
  /**
   * 图片上传配置
   */
  imageConfig?: {
    /**
     * 最大宽度
     */
    maxWidth?: number;
    /**
     * 最大高度
     */
    maxHeight?: number;
    /**
     * 最小宽度
     */
    minWidth?: number;
    /**
     * 最小高度
     */
    minHeight?: number;
    /**
     * 是否限制尺寸
     */
    limitSize?: boolean;
  };
  /**
   * 视频上传配置
   */
  videoConfig?: {
    /**
     * 最大时长（秒）
     */
    maxDuration?: number;
    /**
     * 最小时长（秒）
     */
    minDuration?: number;
    /**
     * 是否限制时长
     */
    limitDuration?: boolean;
  };
  /**
   * 图片裁剪配置
   */
  cropConfig?: ImageCropConfig;
  /**
   * 图片压缩配置
   */
  compressConfig?: ImageCompressConfig;
}

/**
 * 预览配置
 */
export interface PreviewConfig {
  /**
   * 是否启用预览
   * @default true
   */
  enable?: boolean;
  /**
   * 图片预览配置
   */
  imageProps?: Omit<ImageProps, 'src'>;
  /**
   * 是否显示缩略图
   * @default true
   */
  showThumbnail?: boolean;
  /**
   * 缩略图宽度
   * @default 100
   */
  thumbnailWidth?: number;
  /**
   * 缩略图高度
   * @default 100
   */
  thumbnailHeight?: number;
  /**
   * 是否显示删除按钮
   * @default true
   */
  showDelete?: boolean;
  /**
   * 是否显示下载按钮
   * @default false
   */
  showDownload?: boolean;
  /**
   * 自定义预览渲染
   * @param file 文件项
   * @returns 自定义预览内容
   */
  renderPreview?: (file: ProUploadFileItem) => ReactNode;
}

/**
 * ProUpload 组件属性
 */
export interface ProUploadProps
  extends Omit<
    UploadProps,
    'fileList' | 'onChange' | 'customRequest' | 'onProgress' | 'onPreview' | 'onRemove' | 'beforeUpload'
  > {
  /**
   * 文件列表
   */
  fileList?: ProUploadFileItem[];
  /**
   * 上传类型
   * @default 'image'
   */
  type?: UploadFileType;
  /**
   * 上传配置
   */
  config?: UploadConfig;
  /**
   * 预览配置
   */
  previewConfig?: PreviewConfig;
  /**
   * 文件列表变化回调
   * @param fileList 文件列表
   */
  onChange?: (fileList: ProUploadFileItem[]) => void;
  /**
   * 上传前校验
   * @param file 文件对象
   * @returns 校验结果或 Promise
   */
  beforeUpload?: (file: File) => BeforeUploadResult | Promise<BeforeUploadResult>;
  /**
   * 上传成功回调
   * @param file 文件项
   * @param url 上传后的URL
   */
  onSuccess?: (file: ProUploadFileItem, url: string) => void;
  /**
   * 上传失败回调
   * @param file 文件项
   * @param error 错误信息
   */
  onError?: (file: ProUploadFileItem, error: string) => void;
  /**
   * 上传进度回调
   * @param file 文件项
   * @param percent 上传进度 0-100
   */
  onProgresChange?: (file: ProUploadFileItem, percent: number) => void;
  /**
   * 文件删除回调
   * @param file 文件项
   */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  onRemove?: (file: ProUploadFileItem) => void | Promise<boolean>;
  /**
   * 文件预览回调
   * @param file 文件项
   */
  onPreview?: (file: ProUploadFileItem) => void;
  /**
   * 自定义上传函数
   * @param file 文件对象
   * @param onProgress 进度回调
   * @returns 上传后的URL
   */
  customUpload?: (file: File, onProgress: (percent: number) => void) => Promise<string>;
  /**
   * 上传过程中的回调钩子
   * @param options 上传状态信息
   */
  onRequest?: (options: {
    file: ProUploadFileItem;
    status: 'start' | 'progress' | 'success' | 'error';
    percent?: number;
    url?: string;
    errorMessage?: string;
  }) => void;
  /**
   * 是否显示上传按钮
   * @default true
   */
  showUploadButton?: boolean;
  /**
   * 上传按钮文本
   * @default '上传'
   */
  uploadButtonText?: string;
  /**
   * 上传按钮图标
   */
  uploadButtonIcon?: ReactNode;
  /**
   * 自定义上传按钮渲染
   */
  renderUploadButton?: () => ReactNode;
  /**
   * 自定义文件列表渲染
   * @param files 文件列表
   * @param props 上传列表属性
   */
  renderFileList?: (
    files: ProUploadFileItem[],
    props: {
      onRemove: (file: ProUploadFileItem) => void;
      onPreview: (file: ProUploadFileItem) => void;
    },
  ) => ReactNode;
  /**
   * 列表类型
   * @default 'picture-card'
   */
  listType?: 'text' | 'picture-list' | 'picture-card';
  /**
   * 是否支持拖拽上传
   * @default false
   */
  draggable?: boolean;
  /**
   * 拖拽区域提示文本
   */
  dragText?: string;
  /**
   * 拖拽区域提示描述
   */
  dragDescription?: string;
  /**
   * 是否显示文件信息
   * @default true
   */
  showFileInfo?: boolean;
  /**
   * 是否自动上传
   * @default true
   */
  autoUpload?: boolean;
  /**
   * 上传提示信息
   */
  tip?: ReactNode;
  /**
   * 上传区域类名
   */
  uploadClassName?: string;
  /**
   * 上传区域样式
   */
  uploadStyle?: React.CSSProperties;
  /**
   * 是否显示总进度
   * @default false
   */
  showTotalProgress?: boolean;
  /**
   * 总进度渲染
   * @param percent 总进度 0-100
   * @param successCount 成功数量
   * @param totalCount 总数量
   */
  renderTotalProgress?: (percent: number, successCount: number, totalCount: number) => ReactNode;
  /**
   * 是否支持排序
   * @default false
   */
  sortable?: boolean;
  /**
   * 文件排序回调
   * @param newFileList 排序后的文件列表
   */
  onSort?: (newFileList: ProUploadFileItem[]) => void;
  /**
   * 空状态渲染
   */
  emptyRender?: ReactNode;
  /**
   * 是否显示文件计数
   * @default false
   */
  showCount?: boolean;
  /**
   * 文件计数格式
   * @default '{current}/{max}'
   */
  countFormat?: string;
  /**
   * 错误重试次数
   * @default 0
   */
  retryCount?: number;
  /**
   * 重试间隔（毫秒）
   * @default 3000
   */
  retryInterval?: number;
}

/**
 * ProUpload 实例
 */
export interface ProUploadInstance {
  /**
   * 上传所有待上传文件
   */
  upload: () => Promise<void>;
  /**
   * 清空文件列表
   */
  clear: () => void;
  /**
   * 获取文件列表
   */
  getFileList: () => ProUploadFileItem[];
  /**
   * 设置文件列表
   * @param fileList 文件列表
   */
  setFileList: (fileList: ProUploadFileItem[]) => void;
  /**
   * 移除指定文件
   * @param file 文件项或uid
   */
  remove: (file: ProUploadFileItem | string) => void;
  /**
   * 手动触发文件选择
   */
  openFileDialog: () => void;
  /**
   * 预览指定文件
   * @param file 文件项或uid
   */
  preview: (file: ProUploadFileItem | string) => void;
  /**
   * 重试上传失败的文件
   */
  retry: () => Promise<void>;
  /**
   * 获取上传统计
   */
  getStats: () => {
    total: number;
    uploading: number;
    success: number;
    error: number;
    pending: number;
  };
}
