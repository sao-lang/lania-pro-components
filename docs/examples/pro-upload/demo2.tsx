import { ProUpload } from '@lania-pro-components/components';

export default () => (
  <ProUpload
    action="/api/upload"
    drag
    onChange={(file) => console.log('拖拽上传:', file)}
  />
);

