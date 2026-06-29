import { EditOutlined, PlayCircleOutlined, PlusOutlined, SoundOutlined } from '@ant-design/icons';
import { App, Button, Card, Space, Table, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { API_BASE_URL } from '../../api/http';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import type { VoiceProfile } from '../../types/api';

function resolveAudioUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

export function VoiceProfilesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const profiles = useQuery({ queryKey: ['voice-profiles'], queryFn: () => studioApi.voiceProfiles() });

  const test = useMutation({
    mutationFn: (id: string) => studioApi.testVoiceProfile(id, '你好，我是 Jarvis。'),
    onSuccess: () => message.success('Mock 试听已生成。真实 ElevenLabs 后续填入 Key 后接入。'),
  });
  const setDefault = useMutation({
    mutationFn: studioApi.setDefaultVoiceProfile,
    onSuccess: async () => {
      message.success('默认音色已更新');
      await queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
  });
  const publish = useMutation({
    mutationFn: studioApi.publishVoiceProfile,
    onSuccess: async () => {
      message.success('Voice Profile 已发布');
      await queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Voice Profiles"
        description="Voice Profile 负责 ElevenLabs 配置和试听样音；Agent 只引用已发布 Voice。"
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/voice-profiles/new')}>新建 Voice</Button>}
      />

      <Card className="ios-card">
        <Table<VoiceProfile>
          rowKey="id"
          loading={profiles.isLoading}
          dataSource={profiles.data?.items ?? []}
          columns={[
            {
              title: '声音',
              render: (_, record) => (
                <Space direction="vertical" size={2}>
                  <Space><SoundOutlined /> <b>{record.displayName}</b> {record.isDefault ? <StatusTag value="DEFAULT" /> : null}</Space>
                  <Typography.Text type="secondary" className="table-subtitle">{record.description || record.voiceId}</Typography.Text>
                </Space>
              ),
            },
            { title: 'Provider', dataIndex: 'provider', render: (v) => <StatusTag value={v} /> },
            { title: 'Voice ID', dataIndex: 'voiceId' },
            { title: '语言', dataIndex: 'language' },
            { title: '状态', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
            {
              title: '试听',
              render: (_, record) => {
                const audioUrl = resolveAudioUrl(record.previewAudioUrl ?? record.previewUrl);
                return audioUrl ? <audio className="inline-audio" controls src={audioUrl} /> : <Typography.Text type="secondary">暂无试听</Typography.Text>;
              },
            },
            {
              title: '操作',
              render: (_, record) => (
                <Space wrap>
                  <Button icon={<EditOutlined />} onClick={() => navigate(`/voice-profiles/${record.id}/edit`)}>编辑</Button>
                  <Button icon={<PlayCircleOutlined />} onClick={() => test.mutate(record.id)}>Mock 生成</Button>
                  <Button onClick={() => publish.mutate(record.id)}>发布</Button>
                  <Button onClick={() => setDefault.mutate(record.id)}>设默认</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
