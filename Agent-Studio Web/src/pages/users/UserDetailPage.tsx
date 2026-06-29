import { Card, Col, Row, Skeleton, Table, Tabs } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import { fmtDate, fmtRmb, fmtTokens } from '../../utils/format';

export function UserDetailPage() {
  const { id = '' } = useParams();
  const user = useQuery({ queryKey: ['user', id], queryFn: () => studioApi.user(id), enabled: Boolean(id) });
  const transactions = useQuery({ queryKey: ['user-transactions', id], queryFn: () => studioApi.userTransactions(id), enabled: Boolean(id) });
  const orders = useQuery({ queryKey: ['user-orders', id], queryFn: () => studioApi.userRechargeOrders(id), enabled: Boolean(id) });
  const usage = useQuery({ queryKey: ['user-usage-records', id], queryFn: () => studioApi.userUsageRecords(id), enabled: Boolean(id) });

  if (user.isLoading) return <Skeleton active />;

  return (
    <div>
      <PageHeader title={user.data?.email ?? '用户详情'} description="用户余额、充值订单、余额流水和 Usage 记录。" />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card className="metric-card" title="余额">{fmtTokens(user.data?.balanceTokens)}</Card></Col>
        <Col xs={24} md={8}><Card className="metric-card" title="已消耗">{fmtTokens(user.data?.usedTokens)}</Card></Col>
        <Col xs={24} md={8}><Card className="metric-card" title="状态"><StatusTag value={user.data?.status} /></Card></Col>
      </Row>
      <Card className="ios-card section-card">
        <Tabs
          items={[
            {
              key: 'orders',
              label: '充值订单',
              children: (
                <Table rowKey="id" loading={orders.isLoading} dataSource={orders.data?.items ?? []} columns={[
                  { title: '订单号', dataIndex: 'orderNo' },
                  { title: '金额', dataIndex: 'amountRmb', render: fmtRmb },
                  { title: 'Tokens', dataIndex: 'agentTokens', render: fmtTokens },
                  { title: '状态', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
                  { title: '创建时间', dataIndex: 'createdAt', render: fmtDate },
                ]} />
              ),
            },
            {
              key: 'transactions',
              label: '余额流水',
              children: (
                <Table rowKey="id" loading={transactions.isLoading} dataSource={transactions.data?.items ?? []} columns={[
                  { title: '类型', dataIndex: 'type', render: (v) => <StatusTag value={v} /> },
                  { title: '方向', dataIndex: 'direction', render: (v) => <StatusTag value={v} /> },
                  { title: '数量', dataIndex: 'amountTokens', render: fmtTokens },
                  { title: '变更后', dataIndex: 'balanceAfter', render: fmtTokens },
                  { title: '备注', dataIndex: 'description' },
                  { title: '时间', dataIndex: 'createdAt', render: fmtDate },
                ]} />
              ),
            },
            {
              key: 'usage',
              label: 'Usage',
              children: (
                <Table rowKey="id" loading={usage.isLoading} dataSource={usage.data?.items ?? []} columns={[
                  { title: 'Agent', dataIndex: 'agentSlug' },
                  { title: '模式', dataIndex: 'mode', render: (v) => <StatusTag value={v} /> },
                  { title: '模型', dataIndex: 'model' },
                  { title: '扣费', dataIndex: 'costTokens', render: fmtTokens },
                  { title: '时间', dataIndex: 'createdAt', render: fmtDate },
                ]} />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
