import { ProQueryForm } from '@lania-pro-components/components';
import { Message } from '@arco-design/web-react';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
];

export const Demo2 = () => (
  <ProQueryForm
    schemas={[
      { name: 'keyword', label: '关键词', component: 'Input', placeholder: '请输入搜索关键词' },
      { name: 'status', label: '状态', component: 'Select', options: statusOptions },
      { name: 'dateRange', label: '日期范围', component: 'DatePicker.RangePicker' },
    ]}
    onSearch={(params) => Message.success(`查询参数: ${JSON.stringify(params)}`)}
    onReset={() => Message.info('已重置')}
    layout='inline'
    collapsible
    defaultCollapsed
  />
);
