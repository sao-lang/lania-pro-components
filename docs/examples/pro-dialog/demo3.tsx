import { useProDialog } from '@lania-pro-components/components';
import { Button } from '@arco-design/web-react';

export default () => {
  const { confirm } = useProDialog();

  const handleConfirm = () => {
    confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: () => {
        console.log('删除成功');
      },
    });
  };

  return <Button type="danger" onClick={handleConfirm}>删除</Button>;
};

