import { ProUpload } from '@lania-pro-components/components';

export default () => (
  <ProUpload
    action="/api/upload"
    onChange={(file) => console.log('上传文件:', file)}
  />
);

