import { ProLayout } from '@lania-pro-components/components';
import { Menu } from '@arco-design/web-react';
import { IconHome, IconCalendar, IconUser } from '@arco-design/web-react/icon';

const menuItems = [
  { key: '1', icon: <IconHome />, text: '首页' },
  { key: '2', icon: <IconCalendar />, text: '订单' },
  { key: '3', icon: <IconUser />, text: '用户' },
];

export const Demo2 = () => (
  <ProLayout
    layout='side'
    header={{ title: '管理后台' }}
    sider={{
      children: (
        <Menu style={{ border: 'none' }}>
          {menuItems.map((item) => (
            <Menu.Item key={item.key}>
              {item.icon}
              {item.text}
            </Menu.Item>
          ))}
        </Menu>
      ),
    }}
  >
    <div style={{ padding: 24, background: 'var(--color-bg-2)', borderRadius: 6 }}>Side 布局内容区</div>
  </ProLayout>
);
