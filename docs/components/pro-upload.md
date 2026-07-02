# ProUpload

上传组件，支持文件上传、拖拽上传、预览等功能。

## API

### 类型定义

#### UploadFileType

上传文件类型：`'image' | 'video' | 'file'`

#### UploadStatus

上传状态：`'init' | 'uploading' | 'done' | 'error'`

#### ProUploadFileItem

上传文件项，继承自 `UploadItem`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `errorMessage` | `string` | - | 错误信息 |
| `fileType` | `UploadFileType` | - | 文件类型 |
| `customData` | `Record<string, unknown>` | - | 自定义数据 |
| `poster` | `string` | - | 视频封面图 |
| `description` | `string` | - | 文件描述 |

#### BeforeUploadResult

上传前校验结果。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `valid` | `boolean` | - | 是否通过校验 |
| `message` | `string` | - | 错误信息 |

### 配置项

#### UploadConfig

上传配置。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `UploadFileType` | `'image'` | 上传类型 |
| `maxCount` | `number` | `1` | 最大文件数量 |
| `maxSize` | `number` | `10` | 最大文件大小（MB） |
| `accept` | `string` | - | 允许的文件类型 |
| `imageConfig` | `{ maxWidth?, maxHeight?, minWidth?, minHeight?, limitSize? }` | - | 图片上传配置 |
| `videoConfig` | `{ maxDuration?, minDuration?, limitDuration? }` | - | 视频上传配置 |
| `cropConfig` | `ImageCropConfig` | - | 图片裁剪配置 |
| `compressConfig` | `ImageCompressConfig` | - | 图片压缩配置 |

#### ImageCropConfig

图片裁剪配置。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable` | `boolean` | `false` | 是否启用裁剪 |
| `aspectRatio` | `number` | - | 裁剪比例 |
| `minWidth` | `number` | - | 最小裁剪宽度 |
| `minHeight` | `number` | - | 最小裁剪高度 |
| `maxWidth` | `number` | - | 最大裁剪宽度 |
| `maxHeight` | `number` | - | 最大裁剪高度 |
| `freeCrop` | `boolean` | `true` | 是否允许自由裁剪 |
| `shape` | `'rect' \| 'circle'` | `'rect'` | 裁剪区域形状 |

#### ImageCompressConfig

图片压缩配置。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable` | `boolean` | `false` | 是否启用压缩 |
| `maxWidth` | `number` | - | 最大宽度 |
| `maxHeight` | `number` | - | 最大高度 |
| `quality` | `number` | `0.8` | 压缩质量 0-1 |
| `type` | `string` | `'image/jpeg'` | 输出类型 |

#### PreviewConfig

预览配置。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable` | `boolean` | `true` | 是否启用预览 |
| `type` | `'modal' \| 'drawer' \| 'inline'` | `'modal'` | 预览类型 |
| `imageProps` | `Omit<ImageProps, 'src'>` | - | 图片预览配置 |
| `showThumbnail` | `boolean` | `true` | 是否显示缩略图 |
| `thumbnailWidth` | `number` | `100` | 缩略图宽度 |
| `thumbnailHeight` | `number` | `100` | 缩略图高度 |
| `showDelete` | `boolean` | `true` | 是否显示删除按钮 |
| `showDownload` | `boolean` | `false` | 是否显示下载按钮 |
| `renderPreview` | `(file) => ReactNode` | - | 自定义预览渲染 |

### ProUploadProps

继承自 `Omit<UploadProps, 'fileList' | 'onChange' | 'customRequest' | 'onProgress' | 'onPreview' | 'onRemove' | 'beforeUpload'>`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fileList` | `ProUploadFileItem[]` | - | 文件列表 |
| `type` | `UploadFileType` | `'image'` | 上传类型 |
| `config` | `UploadConfig` | - | 上传配置 |
| `previewConfig` | `PreviewConfig` | - | 预览配置 |
| `onChange` | `(fileList) => void` | - | 文件列表变化回调 |
| `beforeUpload` | `(file) => BeforeUploadResult \| Promise<...>` | - | 上传前校验 |
| `onSuccess` | `(file, url) => void` | - | 上传成功回调 |
| `onError` | `(file, error) => void` | - | 上传失败回调 |
| `onProgresChange` | `(file, percent) => void` | - | 上传进度回调 |
| `onRemove` | `(file) => void \| Promise<boolean>` | - | 文件删除回调 |
| `onPreview` | `(file) => void` | - | 文件预览回调 |
| `customUpload` | `(file, onProgress) => Promise<string>` | - | 自定义上传函数 |
| `onRequest` | `(options) => void` | - | 上传过程中的回调钩子 |
| `showUploadButton` | `boolean` | `true` | 是否显示上传按钮 |
| `uploadButtonText` | `string` | `'上传'` | 上传按钮文本 |
| `uploadButtonIcon` | `ReactNode` | - | 上传按钮图标 |
| `renderUploadButton` | `() => ReactNode` | - | 自定义上传按钮渲染 |
| `renderFileList` | `(files, props) => ReactNode` | - | 自定义文件列表渲染 |
| `listType` | `'text' \| 'picture-list' \| 'picture-card'` | `'picture-card'` | 列表类型 |
| `draggable` | `boolean` | `false` | 是否支持拖拽上传 |
| `dragText` | `string` | - | 拖拽区域提示文本 |
| `dragDescription` | `string` | - | 拖拽区域提示描述 |
| `showFileInfo` | `boolean` | `true` | 是否显示文件信息 |
| `autoUpload` | `boolean` | `true` | 是否自动上传 |
| `tip` | `ReactNode` | - | 上传提示信息 |
| `uploadClassName` | `string` | - | 上传区域类名 |
| `uploadStyle` | `CSSProperties` | - | 上传区域样式 |
| `showTotalProgress` | `boolean` | `false` | 是否显示总进度 |
| `renderTotalProgress` | `(percent, successCount, totalCount) => ReactNode` | - | 总进度渲染 |
| `sortable` | `boolean` | `false` | 是否支持排序 |
| `onSort` | `(newFileList) => void` | - | 文件排序回调 |
| `emptyRender` | `ReactNode` | - | 空状态渲染 |
| `showCount` | `boolean` | `false` | 是否显示文件计数 |
| `countFormat` | `string` | `'{current}/{max}'` | 文件计数格式 |
| `retryCount` | `number` | `0` | 错误重试次数 |
| `retryInterval` | `number` | `3000` | 重试间隔（毫秒） |

### ProUploadInstance

上传实例对象，提供上传操作方法。

| 方法 | 说明 |
| --- | --- |
| `upload()` | 上传所有待上传文件 |
| `clear()` | 清空文件列表 |
| `getFileList()` | 获取文件列表 |
| `setFileList(fileList)` | 设置文件列表 |
| `remove(file)` | 移除指定文件（支持文件项或uid） |
| `openFileDialog()` | 手动触发文件选择 |
| `preview(file)` | 预览指定文件（支持文件项或uid） |
| `retry()` | 重试上传失败的文件 |
| `getStats()` | 获取上传统计 `{ total, uploading, success, error, pending }` |

## 基本用法

<ReactWrapper :component="ProUploadDemo1" />

```tsx
import { ProUpload } from '@lania-pro-components/components';

const Demo = () => (
  <ProUpload
    action="/api/upload"
    onChange={(file) => console.log('上传文件:', file)}
  />
);
```

## 拖拽上传

<ReactWrapper :component="ProUploadDemo2" />

```tsx
import { ProUpload } from '@lania-pro-components/components';

const Demo = () => (
  <ProUpload
    action="/api/upload"
    drag
    onChange={(file) => console.log('拖拽上传:', file)}
  />
);
```

## 图片预览

<ReactWrapper :component="ProUploadDemo3" />

```tsx
import { ProUpload } from '@lania-pro-components/components';

const Demo = () => (
  <ProUpload
    action="/api/upload"
    accept="image/*"
    showPreview
    onChange={(file) => console.log('图片上传:', file)}
  />
);
```

<script setup lang="ts">
import ReactWrapper from '../.vitepress/theme/ReactWrapper.vue';
import ProUploadDemo1 from '../examples/pro-upload/demo1';
import ProUploadDemo2 from '../examples/pro-upload/demo2';
import ProUploadDemo3 from '../examples/pro-upload/demo3';
</script>

