import { Alert, Card, Col, List, Row, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloudSyncOutlined, DatabaseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader';
import { ProductionReadinessPanel } from '../../components/ProductionReadinessPanel';
import { API_BASE_URL } from '../../api/http';
import { APP_ENV } from '../../config/runtime';

const checklist = [
  { title: '真实 Provider Key', status: 'RESERVED', desc: 'DeepSeek / ElevenLabs 通过环境变量切换，不要求前端改代码。' },
  { title: '支付网关', status: 'RESERVED', desc: '微信 / 支付宝接口已预留；当前充值订单与余额流水逻辑不推翻。' },
  { title: '文件上传', status: 'RESERVED', desc: '头像、媒体、试听音频字段已预留；当前仅本地预览，不上传。' },
  { title: '审计日志', status: 'RESERVED', desc: '危险操作统一双重确认；后续接入 audit_events 表即可。' },
  { title: '权限模型', status: 'SANDBOX', desc: 'V1 单管理员；V2 可以在路由与菜单层接入 RBAC。' },
  { title: '备份与迁移', status: 'RESERVED', desc: '正式 MySQL/Redis 接入后补 migration、backup、restore runbook。' },
];

const colorMap: Record<string, string> = { READY: 'green', SANDBOX: 'blue', RESERVED: 'gold', BLOCKED: 'red' };

export function SystemReadinessPage() {
  return (
    <div>
      <PageHeader title="上线准备" description="将沙盒后台按正式上线边界组织：配置替换实现，页面逻辑不返工。" />
      <Alert
        className="ios-alert"
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        message="Production-ready without production data"
        description={`当前环境：${APP_ENV}，Core API：${API_BASE_URL}。本页面只做上线前结构检查，不连接真实业务数据。`}
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
                '所有头像/媒体/试听音频字段预留，但上传实现延后。',
                '所有 Mock 数据返回结构与正式 API 保持一致。',
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
