import { Card, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import { fmtDate, fmtRmb, fmtTokens } from '../../utils/format';

export function RechargeOrdersPage() {
  const orders = useQuery({ queryKey: ['recharge-orders'], queryFn: () => studioApi.rechargeOrders() });
  return <div>
    <PageHeader title="充值订单" description="管理员端可查看 PAID / PENDING / EXPIRED；真实支付接口暂时预留。" />
    <Card className="ios-card"><Table rowKey="id" loading={orders.isLoading} dataSource={orders.data?.items ?? []} columns={[
      { title: '订单号', dataIndex: 'orderNo' },
      { title: '用户', dataIndex: 'userEmail' },
      { title: '金额', dataIndex: 'amountRmb', render: fmtRmb },
      { title: 'Agent Tokens', dataIndex: 'agentTokens', render: fmtTokens },
      { title: '状态', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
      { title: '支付方式', dataIndex: 'paymentMethod' },
      { title: '创建时间', dataIndex: 'createdAt', render: fmtDate },
      { title: '支付时间', dataIndex: 'paidAt', render: fmtDate },
    ]} /></Card>
  </div>;
}
