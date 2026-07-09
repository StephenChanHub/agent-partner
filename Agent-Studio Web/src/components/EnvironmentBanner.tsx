import { Alert, Button, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloudServerOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { studioApi } from '../api/studio';
import { API_BASE_URL } from '../api/http';
import { APP_ENV, isSandboxEnv } from '../config/runtime';

export function EnvironmentBanner() {
  const ready = useQuery({ queryKey: ['ready'], queryFn: studioApi.ready, refetchInterval: 30000 });
  const sandbox = isSandboxEnv();
  const consoleOrigin = typeof window !== 'undefined' ? window.location.origin : 'N/A';

  return (
    <Alert
      className="environment-banner"
      type={sandbox ? 'info' : 'warning'}
      showIcon
      icon={<CloudServerOutlined />}
      message={
        <Space wrap>
          <Typography.Text strong>{sandbox ? 'Sealos Devbox / Sandbox' : 'Production Guarded Mode'}</Typography.Text>
          <Tag color={ready.data ? 'green' : ready.isError ? 'red' : 'gold'} icon={ready.data ? <CheckCircleOutlined /> : undefined}>
            Core {ready.data ? 'Ready' : ready.isError ? 'Offline' : 'Checking'}
          </Tag>
          <Tag color="blue">{APP_ENV}</Tag>
        </Space>
      }
      description={
        <Space direction="vertical" size={2}>
          <span>当前控制台：{consoleOrigin}</span>
          <span>当前 Core API：{API_BASE_URL}</span>
          <span>当前链路：Studio 页面 → Core API → MySQL / Provider。上线时只替换环境变量，不改页面调用结构。</span>
        </Space>
      }
      action={<Button size="small" icon={<ReloadOutlined />} onClick={() => ready.refetch()}>重试</Button>}
    />
  );
}
