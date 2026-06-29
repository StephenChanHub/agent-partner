import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import { AuditOutlined, CloudSyncOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { StudioReadinessItem } from '../types/api';

const items: StudioReadinessItem[] = [
  { key: 'api-contract', title: 'API Contract', status: 'READY', description: '统一响应、分页结构、错误格式和请求追踪 ID 已在前端固定。' },
  { key: 'provider', title: 'Provider Switch', status: 'RESERVED', description: 'DeepSeek / ElevenLabs 仍为 Mock，但前端不依赖 Mock 细节。' },
  { key: 'audit', title: 'Audit Trail', status: 'RESERVED', description: '危险操作已有双重确认，后续接入审计事件无需重写页面。' },
  { key: 'security', title: 'Security Guard', status: 'SANDBOX', description: '单管理员 JWT 已接入；多管理员 RBAC 后续可替换权限层。' },
];

const iconMap = {
  READY: <SafetyCertificateOutlined />,
  SANDBOX: <CloudSyncOutlined />,
  RESERVED: <AuditOutlined />,
  BLOCKED: <LockOutlined />,
};

const colorMap = {
  READY: 'green',
  SANDBOX: 'blue',
  RESERVED: 'gold',
  BLOCKED: 'red',
};

export function ProductionReadinessPanel() {
  return (
    <Card className="ios-card section-card" title="上线预留检查">
      <Row gutter={[14, 14]}>
        {items.map((item) => (
          <Col xs={24} md={12} xl={6} key={item.key}>
            <div className="readiness-tile">
              <Space align="start">
                <span className="readiness-icon">{iconMap[item.status]}</span>
                <Space direction="vertical" size={4}>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Tag color={colorMap[item.status]}>{item.status}</Tag>
                  <Typography.Text type="secondary">{item.description}</Typography.Text>
                </Space>
              </Space>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
