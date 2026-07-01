# ProUpload

基于 Arco Design Upload 的增强版上传组件，支持图片/视频/文件上传，内置压缩、裁剪、预览等功能。

## 架构设计

```
ProUpload
├── 上传类型
│   ├── image - 图片上传（支持压缩、裁剪、预览）
│   ├── video - 视频上传（支持预览、封面）
│   └── file  - 文件上传（支持下载、预览）
│
├── 上传前处理
│   ├── 文件校验（类型、大小、尺寸、时长）
│   ├── 图片压缩（compressConfig）
│   └── 图片裁剪（cropConfig）
│
├── 上传流程
│   ├── 自动上传（autoUpload）
│   ├── 手动上传
│   ├── 失败重试（retryCount + retryInterval）
│   └── 自定义上传（customUpload）
│
├── 展示模式
│   ├── picture-card - 图片卡片模式
│   ├── picture-list - 图片列表模式
│   └── text - 文本列表模式
│
└── 高级功能
    ├── 拖拽上传（draggable）
    ├── 排序（sortable）
    ├── 总进度条（showTotalProgress）
    ├── 文件数显示（showCount）
    └── 自定义渲染（renderUploadButton、renderFileList）
```

## API 文档

### ProUploadProps（组件属性）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | `'image' \| 'video' \| 'file'` | `'image'` | 上传类型 |
| config | `UploadConfig` | - | 上传配置 |
| previewConfig | `PreviewConfig` | - | 预览配置 |
| userInfo | `UserInfoData` | - | 用户信息 |
| onChange | `(fileList) => void` | - | 文件列表变化回调 |
| beforeUpload | `(file) => BeforeUploadResult` | - | 上传前校验 |
| onSuccess | `(result, file) => void` | - | 上传成功回调 |
| onError | `(error, file) => void` | - | 上传失败回调 |
| onProgresChange | `(percent, file) => void` | - | 上传进度回调 |
| onRemove | `(file) => void \| boolean` | - | 移除文件回调 |
| onPreview | `(file) => void` | - | 预览文件回调 |
| customUpload | `(file) => Promise<{ url, name? }>` | - | 自定义上传方法 |
| showUploadButton | `boolean` | `true` | 是否显示上传按钮 |
| uploadButtonText | `string` | `'上传'` | 上传按钮文本 |
| uploadButtonIcon | `ReactNode` | - | 上传按钮图标 |
| renderUploadButton | `() => ReactNode` | - | 自定义上传按钮 |
| renderFileList | `(fileList) => ReactNode` | - | 自定义文件列表渲染 |
| listType | `'picture-card' \| 'picture-list' \| 'text'` | `'picture-card'` | 列表展示类型 |
| draggable | `boolean` | `false` | 是否启用拖拽上传 |
| dragText | `string` | `'点击或拖拽文件到此处'` | 拖拽区域文本 |
| dragDescription | `ReactNode` | - | 拖拽区域描述 |
| showFileInfo | `boolean` | `true` | 是否显示文件信息 |
| autoUpload | `boolean` | `true` | 是否自动上传 |
| tip | `ReactNode` | - | 提示信息 |
| showTotalProgress | `boolean` | `false` | 是否显示总进度条 |
| renderTotalProgress | `(percent) => ReactNode` | - | 自定义总进度条渲染 |
| sortable | `boolean` | `false` | 是否可排序 |
| onSort | `(fileList) => void` | - | 排序回调 |
| showCount | `boolean` | `false` | 是否显示文件数量 |
| countFormat | `string` | `'{current}/{max}'` | 数量格式 |
| emptyRender | `ReactNode` | - | 空状态渲染 |
| retryCount | `number` | `0` | 失败重试次数 |
| retryInterval | `number` | `3000` | 重试间隔（毫秒） |

同时继承 Arco Design `UploadProps` 的所有属性（accept、multiple、disabled 等）。

### UploadConfig（上传配置）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | `'image' \| 'video' \| 'file'` | `'image'` | 上传类型 |
| maxCount | `number` | `1` | 最大文件数量 |
| maxSize | `number` | `10` | 最大文件大小（MB） |
| accept | `string` | - | 允许的文件类型 |
| imageConfig | `{ maxWidth?, maxHeight?, minWidth?, minHeight?, limitSize? }` | - | 图片尺寸配置 |
| videoConfig | `{ maxDuration?, minDuration?, limitDuration? }` | - | 视频时长配置 |
| cropConfig | `ImageCropConfig` | - | 图片裁剪配置 |
| compressConfig | `ImageCompressConfig` | - | 图片压缩配置 |

### ImageCropConfig（图片裁剪配置）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enable | `boolean` | `false` | 是否启用裁剪 |
| aspectRatio | `number` | - | 裁剪比例（如 1/1 正方形，16/9 宽屏） |
| minWidth | `number` | - | 最小裁剪宽度 |
| minHeight | `number` | - | 最小裁剪高度 |
| maxWidth | `number` | - | 最大裁剪宽度 |
| maxHeight | `number` | - | 最大裁剪高度 |
| freeCrop | `boolean` | `true` | 是否允许自由裁剪 |
| shape | `'rect' \| 'circle'` | `'rect'` | 裁剪区域形状 |

### ImageCompressConfig（图片压缩配置）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enable | `boolean` | `false` | 是否启用压缩 |
| maxWidth | `number` | - | 最大宽度 |
| maxHeight | `number` | - | 最大高度 |
| quality | `number` | `0.8` | 压缩质量 0-1 |
| type | `string` | `'image/jpeg'` | 输出类型 |

### ProUploadFileItem（文件项）

| 属性 | 类型 | 说明 |
|------|------|------|
| url | `string` | 文件 URL |
| name | `string` | 文件名 |
| status | `'init' \| 'uploading' \| 'done' \| 'error'` | 上传状态 |
| errorMessage | `string` | 错误信息 |
| fileType | `'image' \| 'video' \| 'file'` | 文件类型 |
| poster | `string` | 视频封面图 |
| description | `string` | 文件描述 |
| customData | `Record<string, any>` | 自定义数据 |
| 继承 Arco `UploadItem` 所有属性 | | |

## 使用示例

### 图片上传

```tsx
import { ProUpload } from '@/pro-components/ProUpload';

<ProUpload
  type="image"
  config={{
    maxCount: 5,
    maxSize: 5,
    imageConfig: {
      maxWidth: 1920,
      maxHeight: 1080,
    },
    compressConfig: {
      enable: true,
      maxWidth: 1200,
      quality: 0.8,
    },
  }}
  onChange={(fileList) => {
    const urls = fileList.map(f => f.url);
    console.log('上传完成:', urls);
  }}
/>
```

### 图片裁剪

```tsx
<ProUpload
  type="image"
  config={{
    maxCount: 1,
    cropConfig: {
      enable: true,
      aspectRatio: 1, // 正方形裁剪
      shape: 'circle',
      minWidth: 200,
      minHeight: 200,
    },
  }}
/>
```

### 视频上传

```tsx
<ProUpload
  type="video"
  config={{
    maxCount: 1,
    maxSize: 100,
    videoConfig: {
      maxDuration: 60, // 最长60秒
      limitDuration: true,
    },
  }}
/>
```

### 文件上传

```tsx
<ProUpload
  type="file"
  config={{
    maxCount: 10,
    maxSize: 50,
    accept: '.pdf,.doc,.docx,.xlsx',
  }}
  listType="text"
/>
```

### 拖拽上传

```tsx
<ProUpload
  draggable
  dragText="将文件拖拽到此处"
  dragDescription="支持 jpg、png、gif 格式，单文件不超过 5MB"
  config={{ maxCount: 10, maxSize: 5 }}
/>
```

### 自定义上传

```tsx
<ProUpload
  customUpload={async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return { url: data.url, name: data.name };
  }}
  onSuccess={(result, file) => {
    console.log('上传成功:', result);
  }}
/>
```

### 手动上传

```tsx
<ProUpload
  autoUpload={false}
  showUploadButton
  uploadButtonText="选择文件"
  beforeUpload={(file) => {
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, message: '文件大小不能超过 10MB' };
    }
    return { valid: true };
  }}
/>
```

### 排序

```tsx
<ProUpload
  sortable
  config={{ maxCount: 10 }}
  onSort={(fileList) => {
    // 排序后的文件列表
    console.log(fileList);
  }}
/>
```

### 总进度条 + 文件计数

```tsx
<ProUpload
  showTotalProgress
  showCount
  countFormat="已上传 {current}/{max}"
  config={{ maxCount: 10 }}
/>
```

### 与 ProFormN 集成

在表单 Schema 中使用 ProUpload：

```tsx
import { componentRegistry } from '@/pro-components/ProFormN/registry';

componentRegistry.register('ProUpload', ProUpload);

<ProForm
  schemas={[
    {
      name: 'images',
      label: '图片',
      component: 'ProUpload',
      componentProps: {
        type: 'image',
        config: { maxCount: 5, maxSize: 5 },
      },
    },
  ]}
/>
```