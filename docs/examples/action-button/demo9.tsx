import { useRef, useState } from 'react';
import { ExportButton, type ExportButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

export default function Demo9() {
  const exportRef = useRef<ExportButtonRef>(null);
  const [count, setCount] = useState(0);

  return (
    <Space direction='vertical' size='medium' style={{ width: '100%' }}>
      <Space>
        <ExportButton
          ref={exportRef}
          text='导出数据'
          type='primary'
          onBeforeExport={() => {
            Message.info('即将开始导出...');
            return true;
          }}
          onExport={async () => {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setCount((c) => c + 1);
            Message.success('导出成功，文件已下载');
          }}
        />
        <ExportButton
          text='导出Excel'
          type='secondary'
          exportUrl='/api/users/export'
          params={{ status: 'active', keyword: '' }}
          fileName='用户列表.xlsx'
        />
        <Button onClick={() => exportRef.current?.export()}>通过 ref 触发</Button>
      </Space>
      <div>导出次数：{count}</div>
      <div>loading 状态：{exportRef.current?.loading ? '加载中' : '空闲'}</div>
    </Space>
  );
}
