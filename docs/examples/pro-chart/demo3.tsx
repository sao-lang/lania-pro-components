import { ProChart } from '@lania-pro-components/components';

const ratioData = [
  { name: '直接访问', value: 335 },
  { name: '邮件营销', value: 310 },
  { name: '联盟广告', value: 234 },
  { name: '视频广告', value: 135 },
  { name: '搜索引擎', value: 1548 },
];

export const Demo3 = () => (
  <ProChart adapter='echarts' type='pie' dataSource={ratioData} xField='name' yField='value' style={{ height: 320 }} />
);
