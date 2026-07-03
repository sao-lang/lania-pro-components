import { ProDescriptions } from '@lania-pro-components/components';

const userData = {
  phone: '13812345678',
  email: 'user@example.com',
  idCard: '110101199001011234',
  name: '张三',
};

export const Demo2 = () => (
  <ProDescriptions
    columns={[
      { title: '姓名', dataIndex: 'name', valueType: 'text' },
      { title: '手机号', dataIndex: 'phone', valueType: 'text', masking: true, copyable: true },
      { title: '邮箱', dataIndex: 'email', valueType: 'text', masking: true, copyable: true },
      { title: '身份证', dataIndex: 'idCard', valueType: 'text', masking: true },
    ]}
    dataSource={userData}
    layout='grid'
    column={2}
    cardContainer={{ title: '用户信息', bordered: true }}
  />
);
