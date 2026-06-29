import { Button, Card, Input, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import type { StudioUser } from '../../types/api';
import { fmtDate, fmtTokens } from '../../utils/format';
import { TokenAdjustModal } from './TokenAdjustModal';

export function UsersPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedUser, setSelectedUser] = useState<StudioUser | null>(null);
  const users = useQuery({ queryKey: ['users', keyword], queryFn: () => studioApi.users({ keyword }) });

  const columns = useMemo<ColumnsType<StudioUser>>(
    () => [
      { title: '邮箱', dataIndex: 'email', render: (_, record) => <Link to={`/users/${record.id}`}>{record.email}</Link> },
      { title: '昵称', dataIndex: 'nickname' },
      { title: '角色', dataIndex: 'role', render: (value) => <StatusTag value={value} /> },
      { title: '状态', dataIndex: 'status', render: (value) => <StatusTag value={value} /> },
      { title: '余额', dataIndex: 'balanceTokens', render: fmtTokens },
      { title: '已消耗', dataIndex: 'usedTokens', render: fmtTokens },
      { title: '最后上线', dataIndex: 'lastSeenAt', render: fmtDate },
      {
        title: '操作',
        render: (_, record) => (
          <Space>
            <Button onClick={() => setSelectedUser(record)}>增加 Tokens</Button>
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
        description="查看用户余额、消费与充值情况；沙盒阶段支持管理员手动增加 Agent Tokens。"
        actions={<Input.Search placeholder="邮箱 / 昵称" allowClear onSearch={setKeyword} />}
      />
      <Card className="ios-card">
        <Table
          rowKey="id"
          loading={users.isLoading}
          columns={columns}
          dataSource={users.data?.items ?? []}
          pagination={{ pageSize: 20, total: users.data?.pagination.total ?? 0 }}
        />
      </Card>
      <TokenAdjustModal user={selectedUser} open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
