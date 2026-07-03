import { useProTable, ProTable } from '@lania-pro-components/components';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
  },
  {
    title: '部门',
    dataIndex: 'department',
  },
];

export const Demo2 = () => {
  const { bindingProps, Provider } = useProTable({
    columns,
    request: async ({ current, pageSize, params }) => {
      console.log('请求参数:', { current, pageSize, params });
      return {
        data: [
          { id: 1, name: '王五', department: '研发部' },
          { id: 2, name: '赵六', department: '产品部' },
        ],
        total: 2,
      };
    },
  });

  return (
    <Provider>
      <ProTable {...bindingProps} />
    </Provider>
  );
};

export default Demo2;
