import { Alert, Card, Col, List, Row, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloudSyncOutlined, DatabaseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader';
import { ProductionReadinessPanel } from '../../components/ProductionReadinessPanel';
import { API_BASE_URL } from '../../api/http';
import { APP_ENV } from '../../config/runtime';

const checklist = [
  { title: '三端链路', status: 'READY', desc: '用户端 / Studio / Core 已统一改为环境变量驱动的 API 链路，Sealos 分离域名可直接联调。' },
  { title: '数据库初始化', status: 'READY', desc: '空库初始化 SQL 已生成到根目录 `sql.md`，目标库为 partner_db。' },
  { title: '真实 Provider Key', status: 'SANDBOX', desc: 'DeepSeek / ElevenLabs 通过环境变量切换，不要求前端改代码。' },
  { title: '支付网关', status: 'RESERVED', desc: '微信 / 支付宝接口已预留；当前充值订单与余额流水逻辑不推翻。' },
  { title: '文件上传', status: 'SANDBOX', desc: '媒体与试听字段链路已存在；当前仍以本地/临时文件方式为主。' },
  { title: '权限与审计', status: 'SANDBOX', desc: '单管理员和双重确认已在位；多管理员 RBAC 与审计事件后续继续接入。' },
];

const colorMap: Record<string, string> = { READY: 'green', SANDBOX: 'blue', RESERVED: 'gold', BLOCKED: 'red' };

export function SystemReadinessPage() {
  return (
    <div>
      <PageHeader title="上线准备" description="复核三端链路、数据库初始化与环境切换是否已满足 Sealos 联调要求。" />
      <Alert
        className="ios-alert"
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        message="Production-ready without production data"
        description={`当前环境：${APP_ENV}，Core API：${API_BASE_URL}。当前检查重点是三端地址、数据库初始化 SQL、以及上线时只通过环境变量切换 Provider / Core 连接。`}
      />
      <ProductionReadinessPanel />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="ios-card section-card" title="上线不返工原则">
            <List
              dataSource={[
                '所有接口通过 api/studio.ts 聚合，页面不直接写 URL。',
                '所有危险操作使用 confirmDangerTwice，后续可直接接入审计日志。',
                '所有环境地址来自 .env，不写死生产域名。',
                '用户端与 Studio 统一通过 VITE_API_BASE_URL 指向 Core，不再猜测同域端口。',
                '数据库空库可直接执行根目录 sql.md 初始化完整 schema。',
              ]}
              renderItem={(item) => <List.Item><Space><CheckCircleOutlined className="success-icon" />{item}</Space></List.Item>}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="ios-card section-card" title="正式上线预留项">
            <List
              dataSource={checklist}
              renderItem={(item) => (
                <List.Item>
                  <Space align="start">
                    {item.status === 'SANDBOX' ? <CloudSyncOutlined className="info-icon" /> : <DatabaseOutlined className="warning-icon" />}
                    <Space direction="vertical" size={2}>
                      <Space><Typography.Text strong>{item.title}</Typography.Text><Tag color={colorMap[item.status]}>{item.status}</Tag></Space>
                      <Typography.Text type="secondary">{item.desc}</Typography.Text>
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
