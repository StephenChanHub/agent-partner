import { CheckCircleOutlined, CloudServerOutlined, RobotOutlined, TeamOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Card, Col, Row, Skeleton, Statistic, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { studioApi } from '../api/studio';
import { PageHeader } from '../components/PageHeader';
import { ProductionReadinessPanel } from '../components/ProductionReadinessPanel';
import { fmtRmb, fmtTokens } from '../utils/format';

export function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: studioApi.dashboard });
  const health = useQuery({ queryKey: ['health'], queryFn: studioApi.health });

  if (dashboard.isLoading) return <Skeleton active />;
  const data = dashboard.data;

  return (
    <div>
      <PageHeader title="Dashboard" description="Jarvis Studio 沙盒总览，确认管理员端和 Core 的联调状态。" />
      <Alert
        className="ios-alert"
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        message="Sandbox Ready"
        description="管理员端当前只连接 Mock API，不接真实 DeepSeek、ElevenLabs、微信或支付宝。"
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="用户总数" value={data?.users.total ?? 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Agent 数量" value={data?.agents.total ?? 0} prefix={<RobotOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="今日充值" value={fmtRmb(data?.billing.todayRechargeRmb ?? 0)} prefix={<WalletOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="今日消耗" value={fmtTokens(data?.billing.todayUsedAgentTokens ?? 0)} prefix={<CloudServerOutlined />} />
          </Card>
        </Col>
      </Row>
      <ProductionReadinessPanel />
      <Card className="ios-card section-card" title="Core Runtime">
        <div className="runtime-line">
          <span>Provider Mode</span>
          <Tag color="blue">{data?.runtime.providerMode ?? 'mock'}</Tag>
        </div>
        <div className="runtime-line">
          <span>Ready for Admin Studio</span>
          <Tag color={data?.runtime.readyForAdminStudio ? 'green' : 'red'}>{String(data?.runtime.readyForAdminStudio)}</Tag>
        </div>
        <div className="runtime-line">
          <span>Health</span>
          <Tag color={health.data ? 'green' : 'gold'}>{health.data ? 'OK' : 'Checking'}</Tag>
        </div>
      </Card>
    </div>
  );
}
