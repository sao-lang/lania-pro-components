import { JumpButton } from '@lania-pro-components/components';
import { Message } from '@arco-design/web-react';

export const Demo3 = () => {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <JumpButton
        text='跳转新页面'
        to='https://github.com'
        target='_blank'
        onBeforeJump={() => {
          Message.info('即将在新标签页打开');
          return true;
        }}
      />
      <JumpButton
        text='拦截跳转'
        to='/detail'
        onBeforeJump={() => {
          Message.warning('已通过 onBeforeJump 拦截跳转');
          return false;
        }}
      />
    </div>
  );
};

export default Demo3;
