import { ProUpload } from '@lania-pro-components/components';

export const Demo2 = () => <ProUpload action='/api/upload' drag onChange={(file) => console.log('拖拽上传:', file)} />;

export default Demo2;
