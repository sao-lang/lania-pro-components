import { useRef, useState } from 'react';
import { ImportButton, type ImportButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

export default () => {
  const importRef = useRef<ImportButtonRef>(null);
  const [successCount, setSuccessCount] = useState(0);

  return (
    <Space direction='vertical' size='medium' style={{ width: '100%' }}>
      <Space>
        <ImportButton
          ref={importRef}
          text='导入用户'
          type='primary'
          title='批量导入用户'
          width={500}
          uploadUrl='/api/users/import'
          uploadParams={{ type: 'user' }}
          accept='.xlsx,.xls,.csv'
          multiple
          onSuccess={(result) => {
            setSuccessCount((c) => c + 1);
            Message.success('导入成功');
            console.log('导入结果:', result);
          }}
          onImportError={(error) => {
            Message.error(`导入失败：${error.message}`);
          }}
        />
        <Button onClick={() => importRef.current?.open()}>通过 ref 打开</Button>
      </Space>
      <div>成功导入次数：{successCount}</div>
    </Space>
  );
};
