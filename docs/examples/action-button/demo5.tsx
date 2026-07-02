import { useRef, useState } from 'react';
import { EditButton, type EditButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

const userSchemas = [
  { name: 'name', label: '姓名', component: 'Input', required: true },
  { name: 'email', label: '邮箱', component: 'Input', required: true },
  {
    name: 'role',
    label: '角色',
    component: 'Select',
    componentProps: {
      options: [
        { value: 'admin', label: '管理员' },
        { value: 'user', label: '普通用户' },
      ],
    },
  },
];

export default () => {
  const editRef = useRef<EditButtonRef>(null);
  const [record, setRecord] = useState({ id: 1, name: '张三', email: 'a@b.com', role: 'admin' });

  return (
    <Space direction='vertical' size='medium' style={{ width: '100%' }}>
      <Space>
        <EditButton
          ref={editRef}
          text='编辑'
          title='编辑用户'
          schemas={userSchemas}
          getInitialValues={async () => {
            await new Promise((r) => setTimeout(r, 500));
            return record;
          }}
          onBeforeOpen={() => {
            Message.info('加载数据中...');
            return true;
          }}
          onSubmit={async (values) => {
            await new Promise((r) => setTimeout(r, 800));
            setRecord((prev) => ({ ...prev, ...values }));
            Message.success('编辑成功');
            return true;
          }}
        />
        <Button onClick={() => editRef.current?.open()}>通过 ref 打开</Button>
      </Space>
      <div>当前数据：{record.name}（{record.role}）</div>
    </Space>
  );
};
