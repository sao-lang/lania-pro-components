import { ProSelect } from '@lania-pro-components/components';

const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
  { value: 'c', label: '选项 C' },
];

export default () => (
  <ProSelect
    options={options}
    multiple
    placeholder="请选择多个选项"
  />
);

