import { ProSelect } from '@lania-pro-components/components';
import { Avatar } from '@arco-design/web-react';

const users = [
  { label: '张三', value: 1, email: 'zhangsan@example.com' },
  { label: '李四', value: 2, email: 'lisi@example.com' },
  { label: '王五', value: 3, email: 'wangwu@example.com' },
];

const Demo = () => (
  <ProSelect
    options={users}
    placeholder='选择用户'
    optionRender={(option) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar size={24}>{String(option.label)[0]}</Avatar>
        <div>
          <div>{String(option.label)}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{option.email as string}</div>
        </div>
      </div>
    )}
  />
);

export default Demo;
