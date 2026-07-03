import { Modal } from '@arco-design/web-react';
import { Button } from '@arco-design/web-react';

export const Demo3 = () => {
  const handleConfirm = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: () => {
        console.log('删除成功');
      },
    });
  };

  return (
    <Button status='danger' onClick={handleConfirm}>
      删除
    </Button>
  );
};

export default Demo3;
