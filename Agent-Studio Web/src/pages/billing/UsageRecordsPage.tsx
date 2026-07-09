import { Card, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import { fmtDate, fmtTokens } from '../../utils/format';

export function UsageRecordsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const usage = useQuery({
    queryKey: ['usage-records', page],
    queryFn: () => studioApi.usageRecords({ page, pageSize }),
  });

  return <div>
    <PageHeader title="Usage 记录" description="文字 / 语音 Runtime 消费明细，包含阶梯扣费和利润率。" />
    <Card className="ios-card"><Table
      rowKey="id"
      loading={usage.isLoading}
      dataSource={Array.isArray(usage.data?.items) ? usage.data.items : []}
      pagination={{
        current: page,
        pageSize,
        total: usage.data?.pagination?.total ?? 0,
        showSizeChanger: false,
        onChange: (p) => setPage(p),
      }}
      columns={[
        { title: '用户', dataIndex: 'userEmail' },
        { title: 'Agent', dataIndex: 'agentSlug' },
        { title: '模式', dataIndex: 'mode', render: (v) => <StatusTag value={v} /> },
        { title: 'Provider', dataIndex: 'provider' },
        { title: 'Model', dataIndex: 'model' },
        { title: 'Input', dataIndex: 'inputTokens' },
        { title: 'Output', dataIndex: 'outputTokens' },
        { title: 'TTS Chars', dataIndex: 'ttsCharacters' },
        { title: '扣费', dataIndex: 'costTokens', render: fmtTokens },
        { title: '时间', dataIndex: 'createdAt', render: fmtDate },
      ]}
    /></Card>
  </div>;
}
