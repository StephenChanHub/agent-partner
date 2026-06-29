import { Card, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import { fmtDate, fmtTokens } from '../../utils/format';

export function TokenTransactionsPage() {
  const transactions = useQuery({ queryKey: ['token-transactions'], queryFn: () => studioApi.tokenTransactions() });
  return <div>
    <PageHeader title="余额流水" description="所有余额变化都必须通过流水解释，禁止只改 users.balance_tokens。" />
    <Card className="ios-card"><Table rowKey="id" loading={transactions.isLoading} dataSource={transactions.data?.items ?? []} columns={[
      { title: '用户', dataIndex: 'userEmail' },
      { title: '类型', dataIndex: 'type', render: (v) => <StatusTag value={v} /> },
      { title: '方向', dataIndex: 'direction', render: (v) => <StatusTag value={v} /> },
      { title: '数量', dataIndex: 'amountTokens', render: fmtTokens },
      { title: '变更前', dataIndex: 'balanceBefore', render: fmtTokens },
      { title: '变更后', dataIndex: 'balanceAfter', render: fmtTokens },
      { title: '操作管理员', dataIndex: 'operatorAdminId' },
      { title: '备注', dataIndex: 'description' },
      { title: '时间', dataIndex: 'createdAt', render: fmtDate },
    ]} /></Card>
  </div>;
}
