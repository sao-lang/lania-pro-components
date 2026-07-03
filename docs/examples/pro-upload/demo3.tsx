import { ProUpload } from '@lania-pro-components/components';

export const Demo3 = () => (
  <ProUpload
    action='/api/upload'
    accept='image/*'
    listType='picture-card'
    onChange={(file) => console.log('图片上传:', file)}
  />
);

export default Demo3;
