import { ProTable } from '@lania-pro-components/components';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    search: {},
  },
  {
    title: '状态',
    dataIndex: 'status',
    valueType: 'select',
    search: {
      options: [
        { value: 'active', label: '活跃' },
        { value: 'inactive', label: '不活跃' },
      ],
    },
  },
];

export const Demo3 = () => (
  <ProTable
    columns={columns}
    search={{}}
    request={(_params) =>
      Promise.resolve({
        data: [],
        total: 0,
      })
    }
  />
);

export default Demo3;
