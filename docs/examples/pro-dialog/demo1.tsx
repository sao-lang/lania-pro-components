import { ProDialog } from '@lania-pro-components/components';
import { Button } from '@arco-design/web-react';
import { useState } from 'react';

export const Demo1 = () => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Button onClick={() => setVisible(true)}>打开弹窗</Button>
      <ProDialog
        visible={visible}
        title='示例弹窗'
        onCancel={() => setVisible(false)}
        onOk={() => {
          setVisible(false);
          console.log('确认');
        }}
      >
        <p>这是弹窗内容</p>
      </ProDialog>
    </div>
  );
};
export default Demo1;
