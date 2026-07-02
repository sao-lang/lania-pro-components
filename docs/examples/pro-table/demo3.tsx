import { ProTable } from '@lania-pro-components/components';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
  },
  {
    title: '状态',
    dataIndex: 'status',
  },
];

const searchSchema = [
  {
    type: 'input',
    field: 'name',
    label: '姓名',
  },
  {
    type: 'select',
    field: 'status',
    label: '状态',
    options: [
      { value: 'active', label: '活跃' },
      { value: 'inactive', label: '不活跃' },
    ],
  },
];

export default () => (
  <ProTable
    columns={columns}
    searchSchema={searchSchema}
    request={(params) =>
      Promise.resolve({
        list: [],
        total: 0,
      })
    }
  />
);

