import { Alert, Button, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloudServerOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { studioApi } from '../api/studio';
import { API_BASE_URL } from '../api/http';
import { APP_ENV, isSandboxEnv } from '../config/runtime';

export function EnvironmentBanner() {
  const ready = useQuery({ queryKey: ['ready'], queryFn: studioApi.ready, refetchInterval: 30000 });
  const sandbox = isSandboxEnv();

  return (
    <Alert
      className="environment-banner"
      type={sandbox ? 'info' : 'warning'}
      showIcon
      icon={<CloudServerOutlined />}
      message={
        <Space wrap>
          <Typography.Text strong>{sandbox ? 'Sandbox Mode' : 'Production Guarded Mode'}</Typography.Text>
          <Tag color={ready.data ? 'green' : ready.isError ? 'red' : 'gold'} icon={ready.data ? <CheckCircleOutlined /> : undefined}>
            Core {ready.data ? 'Ready' : ready.isError ? 'Offline' : 'Checking'}
          </Tag>
          <Tag color="blue">{APP_ENV}</Tag>
        </Space>
      }
      description={
        <Space direction="vertical" size={2}>
          <span>当前 API：{API_BASE_URL}</span>
          <span>所有正式上线能力均采用预留式结构：接口、确认流、错误处理、审计字段先稳定，真实 Provider / 支付 / 文件上传后续替换实现。</span>
        </Space>
      }
      action={<Button size="small" icon={<ReloadOutlined />} onClick={() => ready.refetch()}>重试</Button>}
    />
  );
}
