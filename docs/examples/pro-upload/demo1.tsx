import { ProUpload } from '@lania-pro-components/components';

export const Demo1 = () => <ProUpload action='/api/upload' onChange={(file) => console.log('上传文件:', file)} />;

export default Demo1;
