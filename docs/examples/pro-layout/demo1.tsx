import { ProLayout, PageHeader, Footer } from '@lania-pro-components/components';
import { Button, Breadcrumb } from '@arco-design/web-react';

export const Demo1 = () => (
  <ProLayout
    header={{ title: '订单管理', subTitle: '管理所有订单信息', description: '支持创建、编辑、删除订单' }}
    footer={{ position: 'right', children: <Button type='primary'>提交</Button> }}
  >
    <div style={{ padding: 24, background: 'var(--color-bg-2)', borderRadius: 6 }}>页面内容区域</div>
  </ProLayout>
);
