import { ProForm } from '@lania-pro-components/components';
import { Input } from '@arco-design/web-react';

const schema = [
  {
    type: 'input',
    field: 'custom',
    label: '自定义输入',
    render: ({ field }) => (
      <Input
        {...field}
        prefix="¥"
        placeholder="请输入金额"
      />
    ),
  },
];

export default () => <ProForm schema={schema} />;

