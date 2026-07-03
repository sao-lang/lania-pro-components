import { ProSelect } from '@lania-pro-components/components';

const options = [
  { value: 'option1', label: '选项一' },
  { value: 'option2', label: '选项二' },
  { value: 'option3', label: '选项三' },
];

const Demo = () => (
  <ProSelect options={options} placeholder='请选择' onChange={(value) => console.log('选中:', value)} />
);

export default Demo;
