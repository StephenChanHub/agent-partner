import { DeleteOutlined, EditOutlined, KeyOutlined, PlayCircleOutlined, PlusOutlined, SoundOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Space, Table, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { API_BASE_URL } from '../../api/http';
import { DataToolbar } from '../../components/DataToolbar';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import type { VoiceProfile } from '../../types/api';
import { confirmDangerTwice } from '../../utils/confirmDangerTwice';

function resolveAudioUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

export function VoiceProfilesPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [apiKeyForm] = Form.useForm();

  const profiles = useQuery({
    queryKey: ['voice-profiles', keyword, status],
    queryFn: () => studioApi.voiceProfiles({ keyword, status: status === 'ALL' ? undefined : status }),
  });
  const ttsSettings = useQuery({
    queryKey: ['tts-settings'],
    queryFn: () => studioApi.ttsSettings(),
  });

  const saveApiKey = useMutation({
    mutationFn: (apiKey: string) => studioApi.updateTtsSettings({ apiKey }),
    onSuccess: async () => {
      message.success('ElevenLabs API Key 已保存');
      apiKeyForm.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['tts-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存 API Key 失败'),
  });

  const deleteApiKey = useMutation({
    mutationFn: () => studioApi.deleteTtsSettings(),
    onSuccess: async () => {
      message.success('ElevenLabs API Key 已删除');
      await queryClient.invalidateQueries({ queryKey: ['tts-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除 API Key 失败'),
  });

  const test = useMutation({
    mutationFn: (id: string) => studioApi.testVoiceProfile(id, 'Hello, I am Jarvis.'),
    onSuccess: async (result: any) => {
      message.success(`试听已生成（${result.latencyMs ?? '-'} ms）`);
      await queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '试听生成失败'),
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

  const deleteMutation = useMutation({
    mutationFn: studioApi.deleteVoiceProfile,
    onSuccess: async () => {
      message.success('Voice Profile 已删除');
      await queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败'),
  });

  const askDelete = (record: VoiceProfile) => confirmDangerTwice({
    modal,
    title: `删除 Voice Profile：${record.displayName}`,
    firstContent: '删除声音配置可能影响引用它的 Agent。',
    secondContent: '请再次确认删除。',
    onConfirm: () => deleteMutation.mutate(record.id),
  });

  const askDeleteApiKey = () => confirmDangerTwice({
    modal,
    title: '删除 ElevenLabs API Key',
    firstContent: '删除后所有 Voice Profile 将无法调用 ElevenLabs TTS。',
    secondContent: '请再次确认删除平台 API Key。',
    onConfirm: () => deleteApiKey.mutate(),
  });

  return (
    <div>
      <PageHeader
        title="Voice Profiles"
        description="平台共用一份 ElevenLabs API Key；每个 Voice Profile 配置 voiceId、modelId、输出格式和 voice settings。"
      />

      <Card className="ios-card" loading={ttsSettings.isLoading} style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space align="center" wrap>
            <KeyOutlined />
            <Typography.Title level={5} style={{ margin: 0 }}>ElevenLabs API Key</Typography.Title>
            {ttsSettings.data?.apiKeyConfigured
              ? <StatusTag value="ACTIVE" />
              : <Typography.Text type="danger">未配置</Typography.Text>}
          </Space>
          <Typography.Text type="secondary">
            当前状态：{ttsSettings.data?.apiKeyConfigured ? `已配置 ${ttsSettings.data.apiKeyMasked}` : '尚未配置，请先保存 API Key 后再生成试听。'}
          </Typography.Text>
          <Form
            form={apiKeyForm}
            layout="inline"
            onFinish={(values) => saveApiKey.mutate(values.apiKey)}
          >
            <Form.Item
              name="apiKey"
              rules={[{ required: true, message: '请输入 ElevenLabs API Key' }]}
              style={{ flex: 1, minWidth: 320 }}
            >
              <Input.Password placeholder="sk_xxx..." autoComplete="off" />
            </Form.Item>
            <Form.Item>
              <Space wrap>
                <Button type="primary" htmlType="submit" loading={saveApiKey.isPending}>保存 Key</Button>
                {ttsSettings.data?.apiKeyConfigured ? (
                  <Button danger icon={<DeleteOutlined />} loading={deleteApiKey.isPending} onClick={askDeleteApiKey}>
                    删除 Key
                  </Button>
                ) : null}
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>

      <DataToolbar
        searchPlaceholder="声音名称 / Voice ID"
        onSearch={setKeyword}
        statusOptions={[{ label: '全部', value: 'ALL' }, { label: '已发布', value: 'PUBLISHED' }, { label: '启用', value: 'ACTIVE' }, { label: '禁用', value: 'DISABLED' }]}
        statusValue={status}
        onStatusChange={setStatus}
        onRefresh={() => profiles.refetch()}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/voice-profiles/new')}>新建 Voice</Button>}
      />

      <Card className="ios-card">
        <Table<VoiceProfile>
          rowKey="id"
          loading={profiles.isLoading || profiles.isFetching}
          dataSource={profiles.data?.items ?? []}
          rowSelection={{ preserveSelectedRowKeys: true }}
          scroll={{ x: 1200 }}
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
            { title: 'Model', dataIndex: 'modelId' },
            { title: 'Format', dataIndex: 'outputFormat' },
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
                  <Button icon={<PlayCircleOutlined />} loading={test.isPending} onClick={() => test.mutate(record.id)}>生成试听</Button>
                  <Button onClick={() => publish.mutate(record.id)}>发布</Button>
                  <Button onClick={() => setDefault.mutate(record.id)}>设默认</Button>
                  <Button danger icon={<DeleteOutlined />} onClick={() => askDelete(record)}>删除</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
