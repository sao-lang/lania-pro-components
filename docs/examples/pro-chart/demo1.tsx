import { ProChart } from '@lania-pro-components/components';

const chartData = [
  { month: '1月', value: 120 },
  { month: '2月', value: 200 },
  { month: '3月', value: 150 },
  { month: '4月', value: 80 },
  { month: '5月', value: 70 },
  { month: '6月', value: 110 },
];

export const Demo1 = () => (
  <ProChart
    adapter='echarts'
    type='line'
    dataSource={chartData}
    xField='month'
    yField='value'
    style={{ height: 320 }}
  />
);
