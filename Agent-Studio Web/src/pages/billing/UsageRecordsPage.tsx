import { Card, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import { fmtDate, fmtTokens } from '../../utils/format';

export function UsageRecordsPage() {
  const usage = useQuery({ queryKey: ['usage-records'], queryFn: () => studioApi.usageRecords() });
  return <div>
    <PageHeader title="Usage 记录" description="查看文字 / 语音 Runtime 的 Mock 消费明细。" />
    <Card className="ios-card"><Table rowKey="id" loading={usage.isLoading} dataSource={usage.data?.items ?? []} columns={[
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
    ]} /></Card>
  </div>;
}
