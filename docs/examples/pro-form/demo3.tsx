import { ProForm } from '@lania-pro-components/components';
import { Input } from '@arco-design/web-react';

const schema = [
  {
    name: 'custom',
    label: '自定义输入',
    render: ({ field }: { field: Record<string, unknown> }) => <Input {...field} prefix='¥' placeholder='请输入金额' />,
  },
];

export const Demo3 = () => <ProForm schemas={schema} />;

export default Demo3;
