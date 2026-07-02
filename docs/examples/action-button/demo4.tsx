import { useRef, useState } from 'react';
import { AddButton, type AddButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

const userSchemas = [
  { name: 'name', label: '姓名', component: 'Input', required: true },
  { name: 'email', label: '邮箱', component: 'Input', required: true },
  {
    name: 'gender',
    label: '性别',
    component: 'Select',
    componentProps: {
      options: [
        { value: 'male', label: '男' },
        { value: 'female', label: '女' },
      ],
    },
  },
  { name: 'age', label: '年龄', component: 'InputNumber' },
];

export default function Demo4() {
  const addButtonRef = useRef<AddButtonRef>(null);
  const [count, setCount] = useState(0);

  return (
    <Space direction='vertical' size='medium' style={{ width: '100%' }}>
      <Space>
        <AddButton
          ref={addButtonRef}
          text='新增用户'
          type='primary'
          title='新增用户'
          width={600}
          schemas={userSchemas}
          initialValues={{ gender: 'male' }}
          onBeforeOpen={() => {
            Message.info('打开前回调');
            return true;
          }}
          onSubmit={async (values) => {
            await new Promise((r) => setTimeout(r, 800));
            setCount((c) => c + 1);
            Message.success(`新增成功：${values.name}`);
            return true;
          }}
          onAfterClose={() => Message.info('弹窗已关闭')}
        />
        <Button onClick={() => addButtonRef.current?.open()}>通过 ref 打开</Button>
      </Space>
      <div>新增次数：{count}</div>
    </Space>
  );
}
