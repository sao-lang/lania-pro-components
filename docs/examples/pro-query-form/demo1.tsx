import { ProQueryForm } from '@lania-pro-components/components';
import { Message } from '@arco-design/web-react';

const tableColumns = [
  { title: '姓名', dataIndex: 'name', valueType: 'text' as const },
  { title: '年龄', dataIndex: 'age', valueType: 'number' as const },
  {
    title: '状态',
    dataIndex: 'status',
    valueType: 'select' as const,
    valueEnum: { 1: { text: '启用' }, 0: { text: '禁用' } },
  },
  { title: '创建时间', dataIndex: 'createTime', valueType: 'dateTime' as const },
];

export const Demo1 = () => (
  <ProQueryForm
    columns={tableColumns}
    onSearch={(params) => Message.success(`查询参数: ${JSON.stringify(params)}`)}
    onReset={() => Message.info('已重置')}
    layout='inline'
  />
);
