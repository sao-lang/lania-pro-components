import { useProDialog } from '@lania-pro-components/components';
import { Button } from '@arco-design/web-react';

export const Demo2 = () => {
  const { open } = useProDialog({
    title: '快捷弹窗',
    content: <p>使用 useProDialog 打开的弹窗</p>,
    onOk: () => {
      console.log('弹窗确认');
    },
  });

  return <Button onClick={() => open()}>打开快捷弹窗</Button>;
};

export default Demo2;
