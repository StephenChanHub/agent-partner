import { Button, Card, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { DataToolbar } from '../../components/DataToolbar';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import type { StudioUser } from '../../types/api';
import { fmtDate, fmtTokens } from '../../utils/format';
import { TokenAdjustModal } from './TokenAdjustModal';

const statusOptions = [
  { label: '全部', value: 'ALL' },
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'DISABLED' },
  { label: '归档', value: 'ARCHIVED' },
];

export function UsersPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<StudioUser | null>(null);
  const users = useQuery({
    queryKey: ['users', keyword, status],
    queryFn: () => studioApi.users({ keyword, status: status === 'ALL' ? undefined : status }),
  });

  const columns = useMemo<ColumnsType<StudioUser>>(
    () => [
      { title: '邮箱', dataIndex: 'email', render: (_, record) => <Link to={`/users/${record.id}`}>{record.email}</Link> },
      { title: '昵称', dataIndex: 'nickname' },
      { title: '角色', dataIndex: 'role', render: (value) => <StatusTag value={value} /> },
      { title: '状态', dataIndex: 'status', render: (value) => <StatusTag value={value} /> },
      { title: '余额', dataIndex: 'balanceTokens', render: fmtTokens, sorter: (a, b) => a.balanceTokens - b.balanceTokens },
      { title: '已消耗', dataIndex: 'usedTokens', render: fmtTokens, sorter: (a, b) => a.usedTokens - b.usedTokens },
      { title: '最后上线', dataIndex: 'lastSeenAt', render: fmtDate },
      {
        title: '操作',
        fixed: 'right',
        render: (_, record) => (
          <Space>
            <Button type="primary" ghost onClick={() => setSelectedUser(record)}>增加 Tokens</Button>
            <Link to={`/users/${record.id}`}>详情</Link>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="用户管理"
        description="查看用户余额、消费与充值情况；沙盒阶段支持管理员手动增加 Agent Tokens，正式上线可接入审计日志。"
      />
      <DataToolbar
        searchPlaceholder="邮箱 / 昵称"
        onSearch={setKeyword}
        statusOptions={statusOptions}
        statusValue={status}
        onStatusChange={setStatus}
        onRefresh={() => users.refetch()}
      />
      <Card className="ios-card">
        <Table
          rowKey="id"
          loading={users.isLoading || users.isFetching}
          columns={columns}
          dataSource={users.data?.items ?? []}
          rowSelection={{ preserveSelectedRowKeys: true }}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 20, total: users.data?.pagination.total ?? 0, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
      <TokenAdjustModal user={selectedUser} open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
