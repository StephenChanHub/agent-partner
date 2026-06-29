import {
  AppstoreOutlined,
  BankOutlined,
  DashboardOutlined,
  LogoutOutlined,
  RobotOutlined,
  SettingOutlined,
  SoundOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, Space, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { API_BASE_URL } from '../api/http';
import { AvatarInitial } from '../components/AvatarInitial';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
  { key: '/agents', icon: <RobotOutlined />, label: 'Agent 管理' },
  { key: '/model-profiles', icon: <AppstoreOutlined />, label: 'Model Profiles' },
  { key: '/voice-profiles', icon: <SoundOutlined />, label: 'Voice Profiles' },
  {
    key: 'billing',
    icon: <WalletOutlined />,
    label: 'Billing',
    children: [
      { key: '/billing/recharge-orders', label: '充值订单' },
      { key: '/billing/token-transactions', label: '余额流水' },
      { key: '/billing/usage-records', label: 'Usage 记录' },
      { key: '/billing/pricing', label: 'Pricing' },
    ],
  },
];

export function StudioLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedMenuKey = location.pathname.startsWith('/agents') ? '/agents' : location.pathname;
  const admin = useAuthStore((state) => state.admin);
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <Layout className="studio-shell">
      <Sider width={268} className="studio-sider">
        <div className="brand-block">
          <div className="brand-icon"><BankOutlined /></div>
          <div>
            <div className="brand-title">Jarvis Studio</div>
            <div className="brand-subtitle">Sandbox Admin</div>
          </div>
        </div>
        <Menu
          className="studio-menu"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          defaultOpenKeys={['billing']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="studio-header">
          <div>
            <Typography.Text className="header-kicker">Mac Local → UTM Ubuntu Core</Typography.Text>
            <div className="header-api">{API_BASE_URL}</div>
          </div>
          <Space>
            <AvatarInitial className="admin-avatar" name={admin?.nickname || admin?.email || 'Jarvis Admin'} />
            <div className="admin-meta">
              <div>{admin?.nickname || 'Jarvis Admin'}</div>
              <small>{admin?.email}</small>
            </div>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                clearSession();
                navigate('/login');
              }}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content className="studio-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
