import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import { AuditOutlined, CloudSyncOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { StudioReadinessItem } from '../types/api';

const items: StudioReadinessItem[] = [
  { key: 'api-contract', title: 'API Contract', status: 'READY', description: '用户端与 Studio 均已固定通过后端 API 访问，不再依赖前端内置 Mock 结构。' },
  { key: 'database', title: 'Database Schema', status: 'READY', description: '空库初始化 SQL 已生成到仓库根目录 `sql.md`，可直接导入 partner_db。' },
  { key: 'provider', title: 'Provider Switch', status: 'SANDBOX', description: 'LLM / TTS 通过环境变量切换；页面层不再关心具体 Provider 地址。' },
  { key: 'security', title: 'Security Guard', status: 'SANDBOX', description: '当前为单管理员 JWT；多管理员 RBAC 和审计扩展仍可在现有结构上继续接入。' },
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
