import { ProDescriptions } from '@lania-pro-components/components';

const productData = {
  name: '高级蓝牙耳机',
  price: 299.0,
  category: '电子产品',
  stock: 1200,
  sales: 580,
};

export const Demo3 = () => (
  <ProDescriptions
    columns={[
      { title: '商品名称', dataIndex: 'name', valueType: 'text' },
      { title: '价格', dataIndex: 'price', valueType: 'money' },
      { title: '分类', dataIndex: 'category' },
      { title: '库存', dataIndex: 'stock', valueType: 'number' },
      { title: '销量', dataIndex: 'sales', valueType: 'number' },
    ]}
    dataSource={productData}
    layout='inline'
  />
);
