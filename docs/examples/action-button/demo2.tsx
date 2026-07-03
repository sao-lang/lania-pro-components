import { BatchButton, ExportButton, ImportButton } from '@lania-pro-components/components';
import { Message } from '@arco-design/web-react';

const selectedRows = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
];
const selectedKeys = [1, 2];

export const Demo2 = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <BatchButton
      text='批量删除'
      status='danger'
      selectedRows={selectedRows}
      selectedKeys={selectedKeys}
      needConfirm
      confirmTitle='确认批量删除'
      confirmContent={(rows) => `确定要删除选中的 ${rows.length} 条数据吗？`}
      onAction={async (rows) => {
        Message.success(`已删除 ${rows.length} 条数据`);
        return true;
      }}
    />
    <ExportButton
      onExport={() => {
        Message.success('导出成功');
      }}
    />
    <ImportButton title='导入数据' uploadUrl='/api/users/import' />
  </div>
);

export default Demo2;
