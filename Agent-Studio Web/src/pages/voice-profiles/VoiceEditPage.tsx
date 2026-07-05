import { ArrowLeftOutlined, AudioOutlined, DeleteOutlined, PlayCircleOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { API_BASE_URL } from '../../api/http';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';

const modelIdOptions = [
  { label: 'eleven_v3', value: 'eleven_v3' },
  { label: 'eleven_multilingual_v2', value: 'eleven_multilingual_v2' },
  { label: 'eleven_turbo_v2_5', value: 'eleven_turbo_v2_5' },
];

const outputFormatOptions = [
  { label: 'mp3_44100_128', value: 'mp3_44100_128' },
  { label: 'mp3_22050_32', value: 'mp3_22050_32' },
  { label: 'pcm_16000', value: 'pcm_16000' },
];

const statusOptions = [
  { label: '已发布', value: 'PUBLISHED' },
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'DISABLED' },
  { label: '归档', value: 'ARCHIVED' },
];

const defaultFormValues = {
  provider: 'ELEVENLABS',
  displayName: '',
  voiceId: 'JBFqnCBsd6RMkjVDRZzb',
  modelId: 'eleven_v3',
  outputFormat: 'mp3_44100_128',
  previewAudioUrl: '',
  defaultSpeed: 1,
  defaultStability: 0.5,
  defaultSimilarityBoost: 0.75,
  status: 'PUBLISHED',
};

function resolveAudioUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

type Props = { mode: 'create' | 'edit' };

export function VoiceEditPage({ mode }: Props) {
  const { id } = useParams();
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const voice = useQuery({
    queryKey: ['voice-profile', id],
    queryFn: () => studioApi.voiceProfile(id as string),
    enabled: isEdit && Boolean(id),
  });

  const ttsSettings = useQuery({
    queryKey: ['tts-settings'],
    queryFn: () => studioApi.ttsSettings(),
  });

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue(defaultFormValues);
      return;
    }
    const record = voice.data;
    if (!record) return;
    form.setFieldsValue({
      ...record,
      provider: 'ELEVENLABS',
      previewAudioUrl: record.previewAudioUrl ?? record.previewUrl,
    });
  }, [form, isEdit, voice.data]);

  const uploadAudioMutation = useMutation({
    mutationFn: (file: File) => studioApi.uploadMedia(file, 'voice-preview'),
    onSuccess: (file) => {
      form.setFieldsValue({ previewAudioUrl: file.url });
      message.success('试听音频已上传');
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '试听音频上传失败'),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        provider: 'ELEVENLABS',
        previewAudioUrl: values.previewAudioUrl || undefined,
      };
      return isEdit && id ? studioApi.updateVoiceProfile(id, payload) : studioApi.createVoiceProfile(payload);
    },
    onSuccess: async (saved) => {
      message.success('Voice Profile 已保存');
      await queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
      await queryClient.invalidateQueries({ queryKey: ['voice-profile', saved.id] });
      if (!isEdit) navigate(`/voice-profiles/${saved.id}/edit`, { replace: true });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  });

  const testMutation = useMutation({
    mutationFn: () => studioApi.testVoiceProfile(id as string, 'Hello, I am Jarvis.'),
    onSuccess: async (result: any) => {
      form.setFieldsValue({ previewAudioUrl: result.previewAudioUrl ?? result.audioUrl });
      message.success(`ElevenLabs 试听已生成（${result.latencyMs ?? '-'} ms）`);
      await queryClient.invalidateQueries({ queryKey: ['voice-profile', id] });
      await queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '试听生成失败'),
  });

  const publishMutation = useMutation({
    mutationFn: () => studioApi.publishVoiceProfile(id as string),
    onSuccess: async () => {
      message.success('Voice Profile 已发布');
      await queryClient.invalidateQueries({ queryKey: ['voice-profile', id] });
      await queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
  });

  const values = Form.useWatch([], form) ?? {};
  const remotePreviewUrl = resolveAudioUrl(values.previewAudioUrl ?? voice.data?.previewAudioUrl ?? voice.data?.previewUrl);
  const previewTitle = values.displayName || voice.data?.displayName || 'New Voice Profile';
  const statusValue = useMemo(() => voice.data?.status ?? values.status ?? 'PUBLISHED', [values.status, voice.data?.status]);

  const onAudioChange = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    uploadAudioMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearPreviewAudio = () => {
    form.setFieldsValue({ previewAudioUrl: '' });
  };

  const handleGeneratePreview = async () => {
    if (!isEdit || !id) {
      message.warning('请先保存 Voice Profile，再生成 ElevenLabs 试听。');
      return;
    }
    if (!ttsSettings.data?.apiKeyConfigured) {
      message.error('请先在 Voice Profiles 列表页配置 ElevenLabs API Key。');
      return;
    }
    try {
      await form.validateFields(['voiceId', 'modelId', 'outputFormat', 'defaultSpeed', 'defaultStability', 'defaultSimilarityBoost']);
      await saveMutation.mutateAsync(form.getFieldsValue());
      testMutation.mutate();
    } catch {
      message.error('请先补全必填的 ElevenLabs 参数。');
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Voice Profile 编辑' : '新建 Voice Profile'}
        description="ElevenLabs 平台级 API Key 在列表页统一配置；这里维护 voiceId、modelId、输出格式和 voice settings。"
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/voice-profiles')}>返回列表</Button>
            {isEdit ? (
              <Button
                icon={<PlayCircleOutlined />}
                loading={testMutation.isPending || saveMutation.isPending}
                onClick={() => void handleGeneratePreview()}
              >
                生成 ElevenLabs 试听
              </Button>
            ) : null}
            {isEdit ? <Button onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}>发布 Voice</Button> : null}
            <Button type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} onClick={() => form.submit()}>保存 Voice</Button>
          </Space>
        }
      />

      <Card className="ios-card voice-profile-editor" loading={voice.isLoading}>
        <div className="voice-hero">
          <div className="voice-orb"><AudioOutlined /></div>
          <div className="voice-hero-main">
            <Space align="center" wrap>
              <Typography.Title level={2} className="voice-title">{previewTitle}</Typography.Title>
              <StatusTag value="ELEVENLABS" />
              <StatusTag value={statusValue} />
            </Space>
            <Typography.Paragraph type="secondary" className="voice-description">
              Voice Profile 引用 ElevenLabs voiceId；speed / stability / similarity_boost 会传入 ElevenLabs voice_settings。
            </Typography.Paragraph>
            <div className="voice-audio-panel">
              {remotePreviewUrl ? <audio controls src={remotePreviewUrl} /> : <Typography.Text type="secondary">暂无试听音频</Typography.Text>}
            </div>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} className="voice-profile-form">
          <Form.Item name="provider" hidden initialValue="ELEVENLABS"><Input /></Form.Item>
          <Row gutter={[18, 8]}>
            <Col xs={24} md={12}>
              <Form.Item name="displayName" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
                <Input placeholder="Jarvis Male Voice" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="状态"><Select options={statusOptions} /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="voiceId"
                label="Voice ID"
                rules={[{ required: true, message: '请输入 ElevenLabs Voice ID' }]}
                extra="在 ElevenLabs Voice Library 中复制 voice_id，例如 George: JBFqnCBsd6RMkjVDRZzb"
              >
                <Input placeholder="JBFqnCBsd6RMkjVDRZzb" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="modelId" label="Model ID" rules={[{ required: true, message: '请选择 Model ID' }]}>
                <Select options={modelIdOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="outputFormat" label="Output Format" rules={[{ required: true, message: '请选择输出格式' }]}>
                <Select options={outputFormatOptions} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="说明">
                <Input.TextArea rows={3} placeholder="说明这个声音的风格、适用 Agent 和限制" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="previewAudioUrl" label="Preview Audio URL">
                <Input placeholder="生成试听或上传音频后自动填入 /media/files/voice-preview/..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="defaultSpeed"
                label="Speed"
                rules={[{ required: true, message: '请输入 Speed' }]}
                extra="ElevenLabs voice_settings.speed，建议 0.7 - 1.2"
              >
                <InputNumber min={0.5} max={2} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="defaultStability"
                label="Stability"
                rules={[{ required: true, message: '请输入 Stability' }]}
                extra="ElevenLabs voice_settings.stability，0 - 1"
              >
                <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="defaultSimilarityBoost"
                label="Similarity Boost"
                rules={[{ required: true, message: '请输入 Similarity Boost' }]}
                extra="ElevenLabs voice_settings.similarity_boost，0 - 1"
              >
                <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card className="ios-card voice-local-preview-card">
        <div className="media-toolbar">
          <div>
            <Typography.Title level={4}>手动上传试听音频</Typography.Title>
            <Typography.Text type="secondary">也可以直接上传 mp3 / wav / m4a 作为 previewAudioUrl。</Typography.Text>
          </div>
          <Space wrap>
            <Button icon={<UploadOutlined />} loading={uploadAudioMutation.isPending} onClick={() => fileInputRef.current?.click()}>上传试听音频</Button>
            <Button icon={<DeleteOutlined />} onClick={clearPreviewAudio}>清空 Preview URL</Button>
          </Space>
        </div>
        <input ref={fileInputRef} className="hidden-file-input" type="file" accept="audio/*" onChange={(event) => onAudioChange(event.target.files)} />
      </Card>
    </div>
  );
}
