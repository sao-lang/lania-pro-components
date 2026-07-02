import { AddButton, EditButton, DeleteButton, ViewButton } from '@lania-pro-components/components';
import { Message } from '@arco-design/web-react';

const currentRecord = { id: 1, name: '张三', email: 'zhangsan@example.com' };

const userSchemas = [
  { name: 'name', label: '姓名', component: 'Input', required: true },
  { name: 'email', label: '邮箱', component: 'Input', required: true },
];

export default () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <AddButton
      title='新增用户'
      schemas={userSchemas}
      onSubmit={async (values) => {
        Message.success(`新增成功：${values.name}`);
        return true;
      }}
    />
    <EditButton
      title='编辑用户'
      schemas={userSchemas}
      getInitialValues={() => currentRecord}
      onSubmit={async (values) => {
        Message.success(`编辑成功：${values.name}`);
        return true;
      }}
    />
    <DeleteButton
      onDelete={async () => {
        Message.success('删除成功');
        return true;
      }}
    />
    <ViewButton
      title='用户详情'
      renderContent={() => (
        <div style={{ padding: '8px 0', lineHeight: 2 }}>
          <p>姓名：{currentRecord.name}</p>
          <p>邮箱：{currentRecord.email}</p>
        </div>
      )}
    />
  </div>
);
