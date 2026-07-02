import { Button, Card, Popconfirm, Space, Table, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import { fmtDate, fmtRmb, fmtTokens } from '../../utils/format';
import type { RechargeOrder } from '../../types/api';

export function RechargeOrdersPage() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const orders = useQuery({ queryKey: ['recharge-orders'], queryFn: () => studioApi.rechargeOrders() });

  const refreshOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['recharge-orders'] });
    queryClient.invalidateQueries({ queryKey: ['token-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const confirmMutation = useMutation({
    mutationFn: (id: string) => studioApi.confirmRechargeOrder(id),
    onSuccess: (result) => {
      messageApi.success(result.alreadyPaid ? '该订单已经充值到账。' : '充值已确认，用户 Tokens 已到账。');
      refreshOrders();
    },
    onError: (error) => {
      messageApi.error(error instanceof Error ? error.message : '确认充值失败');
      refreshOrders();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studioApi.deleteRechargeOrder(id),
    onSuccess: () => {
      messageApi.success('订单已删除。');
      refreshOrders();
    },
    onError: (error) => messageApi.error(error instanceof Error ? error.message : '删除订单失败'),
  });

  return <div>
    {contextHolder}
    <PageHeader title="充值订单" description="用户点击 Payed 后生成 Pending 订单；5 分钟未确认自动取消；管理员确认充值后用户 Tokens 到账。" />
    <Card className="ios-card"><Table<RechargeOrder> rowKey="id" loading={orders.isLoading} dataSource={orders.data?.items ?? []} columns={[
      { title: '订单号', dataIndex: 'orderNo' },
      { title: '用户', dataIndex: 'userEmail' },
      { title: '金额', dataIndex: 'amountRmb', render: fmtRmb },
      { title: 'Agent Tokens', dataIndex: 'agentTokens', render: fmtTokens },
      { title: '状态', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
      { title: '支付方式', dataIndex: 'paymentMethod' },
      { title: '创建时间', dataIndex: 'createdAt', render: fmtDate },
      { title: '过期时间', dataIndex: 'expiresAt', render: fmtDate },
      { title: '到账时间', dataIndex: 'paidAt', render: fmtDate },
      {
        title: '操作',
        fixed: 'right',
        width: 210,
        render: (_, record) => (
          <Space>
            <Popconfirm
              title="确认给该用户充值到账？"
              description={`确认后将给用户增加 ${fmtTokens(record.agentTokens)} Agent Tokens。`}
              okText="确认充值"
              cancelText="取消"
              disabled={record.status !== 'PENDING'}
              onConfirm={() => confirmMutation.mutate(record.id)}
            >
              <Button type="primary" disabled={record.status !== 'PENDING'} loading={confirmMutation.isPending}>
                确认充值
              </Button>
            </Popconfirm>
            <Popconfirm
              title="删除该充值订单？"
              description="删除订单不会回滚已到账的 Tokens。"
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => deleteMutation.mutate(record.id)}
            >
              <Button danger loading={deleteMutation.isPending}>删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ]} scroll={{ x: 1280 }} /></Card>
  </div>;
}
