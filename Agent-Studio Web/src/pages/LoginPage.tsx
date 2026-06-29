import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { studioApi } from '../api/studio';
import { useAuthStore } from '../store/auth.store';
import { API_BASE_URL } from '../api/http';

export function LoginPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setSession = useAuthStore((state) => state.setSession);
  const defaultEmail = import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@jarvis.local';

  return (
    <div className="login-page">
      <div className="login-orb orb-a" />
      <div className="login-orb orb-b" />
      <Card className="login-card">
        <div className="login-logo">J</div>
        <Typography.Title level={2} className="login-title">Jarvis Studio</Typography.Title>
        <Typography.Paragraph type="secondary" className="login-subtitle">
          iOS 风格管理员控制台 · Sandbox Mode
        </Typography.Paragraph>
        <Alert
          className="login-alert"
          type="info"
          showIcon
          message="后端 API"
          description={API_BASE_URL}
        />
        <Form
          layout="vertical"
          initialValues={{ email: defaultEmail, password: 'admin123456' }}
          onFinish={async (values) => {
            try {
              const res = await studioApi.login(values.email, values.password);
              setSession({ accessToken: res.accessToken, admin: res.user });
              message.success('管理员登录成功');
              navigate('/dashboard');
            } catch (error) {
              message.error(error instanceof Error ? error.message : '登录失败');
            }
          }}
        >
          <Form.Item name="email" label="管理员邮箱" rules={[{ required: true, message: '请输入管理员邮箱' }]}>
            <Input prefix={<MailOutlined />} size="large" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            登录 Jarvis Studio
          </Button>
        </Form>
      </Card>
    </div>
  );
}
