import { ProDescriptions } from '@lania-pro-components/components';
import { Tag } from '@arco-design/web-react';

const orderData = {
  orderNo: 'ORD20260704001',
  amount: 1234.5,
  status: 1,
  createTime: '2026-07-04 10:00:00',
  remark: '加急处理',
};

const statusEnum = {
  1: { text: '待支付', color: 'orange' },
  2: { text: '已支付', color: 'green' },
  3: { text: '已发货', color: 'blue' },
  4: { text: '已完成', color: 'gray' },
};

export const Demo1 = () => (
  <ProDescriptions
    columns={[
      { title: '订单号', dataIndex: 'orderNo', valueType: 'text', copyable: true },
      { title: '金额', dataIndex: 'amount', valueType: 'money' },
      { title: '状态', dataIndex: 'status', valueType: 'enum', valueEnum: statusEnum },
      { title: '创建时间', dataIndex: 'createTime', valueType: 'dateTime' },
      { title: '备注', dataIndex: 'remark', valueType: 'text' },
    ]}
    dataSource={orderData}
    bordered
    column={2}
  />
);
