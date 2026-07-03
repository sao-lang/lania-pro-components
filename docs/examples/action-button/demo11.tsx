import { useRef } from 'react';
import { JumpButton, type JumpButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

export const Demo11 = () => {
  const jumpRef = useRef<JumpButtonRef>(null);

  return (
    <Space direction='vertical' size='medium' style={{ width: '100%' }}>
      <Space>
        <JumpButton
          text='新标签页打开'
          to='https://github.com'
          target='_blank'
          onBeforeJump={() => {
            Message.info('即将跳转到 GitHub');
            return true;
          }}
        />
        <JumpButton
          text='拦截跳转'
          to='/detail'
          target='_self'
          onBeforeJump={() => {
            Message.warning('已拦截跳转，onBeforeJump 返回 false');
            return false;
          }}
        />
        <Button onClick={() => jumpRef.current?.jump()}>通过 ref 跳转</Button>
      </Space>
      <JumpButton ref={jumpRef} text='ref 绑定的跳转按钮' to='https://www.npmjs.com' target='_blank' />
    </Space>
  );
};

export default Demo11;
