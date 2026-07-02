import { ProUpload } from '@lania-pro-components/components';

export default () => (
  <ProUpload
    action="/api/upload"
    accept="image/*"
    showPreview
    onChange={(file) => console.log('图片上传:', file)}
  />
);

