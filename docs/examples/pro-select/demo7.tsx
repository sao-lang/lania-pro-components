import { ProSelect } from '@lania-pro-components/components';
import type { ProSelectOption } from '@lania-pro-components/components/ProSelect/types';

const options = [
  { name: '选项1', id: 1, category: '分组A' },
  { name: '选项2', id: 2, category: '分组A' },
] as unknown as ProSelectOption[];

const Demo = () => (
  <ProSelect
    fieldNames={{ label: 'name', value: 'id', group: 'category' }}
    options={options}
    placeholder='自定义字段映射'
  />
);

export default Demo;
