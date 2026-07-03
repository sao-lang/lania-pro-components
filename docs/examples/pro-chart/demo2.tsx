import { ProChart } from '@lania-pro-components/components';

const salesData = [
  { category: '电子产品', amount: 4500, group: '直营' },
  { category: '服装', amount: 3200, group: '直营' },
  { category: '食品', amount: 2800, group: '直营' },
  { category: '电子产品', amount: 3800, group: '加盟' },
  { category: '服装', amount: 2100, group: '加盟' },
  { category: '食品', amount: 1600, group: '加盟' },
];

export const Demo2 = () => (
  <ProChart
    adapter='echarts'
    type='bar'
    dataSource={salesData}
    xField='category'
    yField='amount'
    seriesField='group'
    style={{ height: 320 }}
  />
);
