import { ProQueryForm } from '@lania-pro-components/components';
import { Message } from '@arco-design/web-react';

export const Demo3 = () => (
  <ProQueryForm
    schemas={[
      { name: 'name', label: '名称', component: 'Input' },
      {
        name: 'category',
        label: '分类',
        component: 'Select',
        options: [
          { label: 'A类', value: 'A' },
          { label: 'B类', value: 'B' },
        ],
      },
    ]}
    onSearch={(params) => Message.success(`查询: ${JSON.stringify(params)}`)}
    layout='horizontal'
    column={2}
    searchButtonText='搜索'
    resetButtonText='清空'
  />
);
