import { ProSelect } from '@lania-pro-components/components';

const Demo = () => (
  <ProSelect
    mode='multiple'
    tagMode
    showSelectAll
    options={[
      { label: '前端', value: 'frontend', tagColor: 'blue' },
      { label: '后端', value: 'backend', tagColor: 'green' },
      { label: '测试', value: 'test', tagColor: 'orange' },
    ]}
    placeholder='请选择多个选项'
  />
);

export default Demo;
