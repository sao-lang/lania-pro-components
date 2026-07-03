import { ProTable } from '@lania-pro-components/components';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
  },
  {
    title: '年龄',
    dataIndex: 'age',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
  },
];

export const Demo1 = () => (
  <ProTable
    columns={columns}
    request={() =>
      Promise.resolve({
        data: [
          { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com' },
          { id: 2, name: '李四', age: 30, email: 'lisi@example.com' },
        ],
        total: 2,
      })
    }
  />
);

export default Demo1;
