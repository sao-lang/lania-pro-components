import { useRef, useState } from 'react';
import { BatchButton, type BatchButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space, Table } from '@arco-design/web-react';

interface Row {
  id: number;
  name: string;
  email: string;
}

const dataSource: Row[] = [
  { id: 1, name: '张三', email: 'zhangsan@example.com' },
  { id: 2, name: '李四', email: 'lisi@example.com' },
  { id: 3, name: '王五', email: 'wangwu@example.com' },
];

export const Demo8 = () => {
  const batchRef = useRef<BatchButtonRef>(null);
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([1, 2]);
  const [selectedRows, setSelectedRows] = useState<Row[]>(dataSource.filter((r) => selectedKeys.includes(r.id)));
  const [data, setData] = useState(dataSource);

  const handleSelectionChange = (keys: (string | number)[]) => {
    setSelectedKeys(keys);
    setSelectedRows(data.filter((r) => keys.includes(r.id)));
  };

  return (
    <Space direction='vertical' size='medium' style={{ width: '100%' }}>
      <Space>
        <BatchButton
          ref={batchRef}
          text='批量删除'
          status='danger'
          selectedRows={selectedRows}
          selectedKeys={selectedKeys}
          needSelection
          minSelection={1}
          maxSelection={3}
          selectionWarning='请至少选择一条数据'
          needConfirm
          confirmTitle='确认批量删除'
          confirmContent={(rows) => `确定要删除选中的 ${(rows as Row[]).length} 条数据吗？`}
          onAction={async (rows) => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            const ids = (rows as Row[]).map((r) => r.id);
            setData((prev) => prev.filter((r) => !ids.includes(r.id)));
            setSelectedKeys([]);
            setSelectedRows([]);
            Message.success(`已删除 ${rows.length} 条数据`);
            return true;
          }}
        />
        {/* <BatchButton
          text='批量启用'
          selectedRows={selectedRows}
          selectedKeys={selectedKeys}
          needSelection
          onAction={async (rows) => {
            Message.success(`已启用 ${rows.length} 条数据`);
            return true;
          }}
        /> */}
        <Button
          onClick={() => {
            setSelectedKeys(dataSource.map((r) => r.id));
            setSelectedRows(dataSource);
          }}
        >
          批量启用
        </Button>
        <Button onClick={() => batchRef.current?.execute()}>通过 ref 触发</Button>
      </Space>
      <Table
        size='small'
        rowKey='id'
        data={data}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: '姓名', dataIndex: 'name' },
          { title: '邮箱', dataIndex: 'email' },
        ]}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedKeys,
          onChange: handleSelectionChange,
        }}
        pagination={false}
      />
      <div>已选择 {selectedKeys.length} 条数据</div>
    </Space>
  );
};

export default Demo8;
