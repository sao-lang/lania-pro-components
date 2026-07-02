import { useRef, useState } from 'react';
import { DeleteButton, type DeleteButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

export default () => {
  const deleteRef = useRef<DeleteButtonRef>(null);
  const [deleted, setDeleted] = useState(false);
  const [item] = useState({ id: 1, name: '用户A' });

  return (
    <Space direction='vertical' size='medium' style={{ width: '100%' }}>
      <Space>
        <DeleteButton
          ref={deleteRef}
          text='删除'
          type='primary'
          status='danger'
          confirmTitle='确认删除'
          confirmContent={`确定要删除「${item.name}」吗？删除后无法恢复。`}
          okText='确认删除'
          cancelText='取消'
          okButtonProps={{ status: 'danger' }}
          onDelete={async () => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            setDeleted(true);
            Message.success('删除成功');
            return true;
          }}
        />
        <Button onClick={() => deleteRef.current?.openConfirm()}>通过 ref 触发</Button>
      </Space>
      <div>状态：{deleted ? '已删除' : '未删除'}</div>
    </Space>
  );
};
