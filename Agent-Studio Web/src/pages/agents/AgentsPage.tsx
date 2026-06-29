import { App, Avatar, Button, Card, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import type { AgentRecord } from '../../types/api';
import { fmtDate } from '../../utils/format';

export function AgentsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const agents = useQuery({ queryKey: ['agents'], queryFn: () => studioApi.agents() });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'publish' | 'disable' }) =>
      action === 'publish' ? studioApi.publishAgent(id) : studioApi.disableAgent(id),
    onSuccess: async () => {
      message.success('状态已更新');
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '状态更新失败'),
  });

  const columns = useMemo<ColumnsType<AgentRecord>>(() => [
    {
      title: 'Agent',
      render: (_, record) => (
        <Space>
          <Avatar size={44} src={record.manifest.identity.avatarUrl}>
            {record.manifest.identity.name?.slice(0, 1)}
          </Avatar>
          <div>
            <Typography.Text strong>{record.manifest.identity.name}</Typography.Text>
            <div className="table-subtitle">{record.manifest.identity.description || 'No description'}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Slug', dataIndex: 'slug' },
    { title: '状态', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
    { title: '版本', dataIndex: 'version' },
    { title: '更新时间', dataIndex: 'updatedAt', render: fmtDate },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button type="primary" ghost onClick={() => navigate(`/agents/${record.id}/edit`)}>进入编辑页</Button>
          <Button onClick={() => actionMutation.mutate({ id: record.id, action: 'publish' })}>发布</Button>
          <Button danger onClick={() => actionMutation.mutate({ id: record.id, action: 'disable' })}>禁用</Button>
        </Space>
      ),
    },
  ], [actionMutation, navigate]);

  return (
    <div>
      <PageHeader
        title="Agent 管理"
        description="Agent 列表只负责入口；Agent 的详细编辑进入独立 Studio Profile 页面完成。"
        actions={<Button type="primary" onClick={() => navigate('/agents/new')}>新建 Agent</Button>}
      />
      <Card className="ios-card">
        <Table rowKey="id" loading={agents.isLoading} dataSource={agents.data?.items ?? []} columns={columns} />
      </Card>
    </div>
  );
}
