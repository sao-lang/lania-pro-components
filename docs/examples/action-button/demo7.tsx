import { useRef } from 'react';
import { ViewButton, type ViewButtonRef } from '@lania-pro-components/components';
import { Button, Descriptions, Space, Tag } from '@arco-design/web-react';

const record = {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  role: '管理员',
  status: 'active',
  createTime: '2024-01-15 10:30:00',
  department: '技术部',
};

export default function Demo7() {
  const viewRef = useRef<ViewButtonRef>(null);

  return (
    <Space direction='vertical' size='medium' style={{ width: '100%' }}>
      <Space>
        <ViewButton
          ref={viewRef}
          text='查看详情'
          type='text'
          title='用户详情'
          width={700}
          renderContent={() => (
            <div style={{ padding: '8px 0' }}>
              <Descriptions
                column={2}
                data={[
                  { label: '姓名', value: record.name },
                  { label: '邮箱', value: record.email },
                  { label: '角色', value: record.role },
                  {
                    label: '状态',
                    value: <Tag color='green'>{record.status === 'active' ? '启用' : '禁用'}</Tag>,
                  },
                  { label: '部门', value: record.department },
                  { label: '创建时间', value: record.createTime },
                ]}
              />
            </div>
          )}
        />
        <Button onClick={() => viewRef.current?.open()}>通过 ref 打开</Button>
      </Space>
    </Space>
  );
}
