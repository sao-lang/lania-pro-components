import { ProLayout } from '@lania-pro-components/components';
import { Button } from '@arco-design/web-react';

export const Demo3 = () => (
  <ProLayout
    layout='side'
    header={{ title: '混合布局' }}
    sider={{ children: <div style={{ padding: 16 }}>侧边菜单</div> }}
    footer={{ position: 'center', children: <Button>取消</Button> }}
  >
    <div style={{ padding: 24, background: 'var(--color-bg-2)', borderRadius: 6 }}>
      <h3>完整布局</h3>
      <p>包含 PageHeader + Sider + Content + Footer</p>
    </div>
  </ProLayout>
);
