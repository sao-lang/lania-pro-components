import { ProSelect } from '@lania-pro-components/components';

const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
  { value: 'c', label: '选项 C' },
];

export const Demo3 = () => <ProSelect options={options} mode='multiple' placeholder='请选择多个选项' />;
export default Demo3;
