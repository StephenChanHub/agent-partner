import { App, Button, Card, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { AvatarInitial } from '../../components/AvatarInitial';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import type { AgentRecord } from '../../types/api';
import { fmtDate } from '../../utils/format';
import { confirmDangerTwice } from '../../utils/confirmDangerTwice';

export function AgentsPage() {
  const { message, modal } = App.useApp();
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

  const deleteMutation = useMutation({
    mutationFn: studioApi.deleteAgent,
    onSuccess: async () => {
      message.success('Agent 已删除');
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败'),
  });

  const askDelete = (record: AgentRecord) => {
    confirmDangerTwice({
      modal,
      title: `删除 Agent：${record.manifest.identity.name}`,
      firstContent: '删除后该 Agent 将从 Studio 列表移除，用户端也无法再选择它。沙盒阶段会从 Mock 数据中移除。',
      secondContent: '这是第二次确认。请确认你真的要删除这个 Agent，而不是禁用它。',
      onConfirm: () => deleteMutation.mutate(record.id),
    });
  };

  const columns = useMemo<ColumnsType<AgentRecord>>(() => [
    {
      title: 'Agent',
      render: (_, record) => (
        <Space>
          <AvatarInitial size={44} name={record.manifest.identity.name} />
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
        <Space wrap>
          <Button type="primary" ghost icon={<EditOutlined />} onClick={() => navigate(`/agents/${record.id}/edit`)}>编辑</Button>
          <Button onClick={() => actionMutation.mutate({ id: record.id, action: 'publish' })}>发布</Button>
          <Button danger onClick={() => actionMutation.mutate({ id: record.id, action: 'disable' })}>禁用</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => askDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ], [actionMutation, deleteMutation, navigate, modal]);

  return (
    <div>
      <PageHeader
        title="Agent 管理"
        description="Agent 列表只负责入口；头像统一为 #0D21A5 蓝底白字，头像图片字段预留但当前不开放。"
        actions={<Button type="primary" onClick={() => navigate('/agents/new')}>新建 Agent</Button>}
      />
      <Card className="ios-card">
        <Table rowKey="id" loading={agents.isLoading} dataSource={agents.data?.items ?? []} columns={columns} />
      </Card>
    </div>
  );
}
