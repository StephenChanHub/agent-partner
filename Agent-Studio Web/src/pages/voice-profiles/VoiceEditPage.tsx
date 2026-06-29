import { ArrowLeftOutlined, AudioOutlined, DeleteOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { API_BASE_URL } from '../../api/http';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';

const providerOptions = [
  { label: 'Mock TTS', value: 'MOCK' },
  { label: 'ElevenLabs', value: 'ELEVENLABS' },
  { label: 'OpenAI', value: 'OPENAI' },
  { label: 'Azure', value: 'AZURE' },
  { label: 'Local', value: 'LOCAL' },
  { label: 'Custom', value: 'CUSTOM' },
];

function resolveAudioUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

type Props = {
  mode: 'create' | 'edit';
};

export function VoiceEditPage({ mode }: Props) {
  const { id } = useParams();
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localAudioUrl, setLocalAudioUrl] = useState<string>();
  const [localAudioName, setLocalAudioName] = useState<string>();

  const voice = useQuery({
    queryKey: ['voice-profile', id],
    queryFn: () => studioApi.voiceProfile(id as string),
    enabled: isEdit && Boolean(id),
  });

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue({
        provider: 'MOCK',
        displayName: '',
        voiceId: 'mock_voice_jarvis',
        modelId: 'mock-tts',
        outputFormat: 'mp3_44100_128',
        language: 'zh-CN',
        previewAudioUrl: '',
        defaultSpeed: 1,
        defaultStability: 0.5,
        defaultSimilarityBoost: 0.75,
        status: 'DRAFT',
      });
      return;
    }
    const record = voice.data;
    if (!record) return;
    form.setFieldsValue({
      ...record,
      previewAudioUrl: record.previewAudioUrl ?? record.previewUrl,
    });
  }, [form, isEdit, voice.data]);

  useEffect(() => () => {
    if (localAudioUrl?.startsWith('blob:')) URL.revokeObjectURL(localAudioUrl);
  }, [localAudioUrl]);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        previewAudioUrl: values.previewAudioUrl || undefined,
      };
      // 本地选择的试听音频只用于当前浏览器预览，不随保存提交。
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
  const currentAudioUrl = localAudioUrl || remotePreviewUrl;
  const previewTitle = values.displayName || voice.data?.displayName || 'New Voice Profile';
  const provider = values.provider || voice.data?.provider || 'MOCK';

  const onLocalAudioChange = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (localAudioUrl?.startsWith('blob:')) URL.revokeObjectURL(localAudioUrl);
    setLocalAudioUrl(URL.createObjectURL(file));
    setLocalAudioName(file.name);
    message.info('已添加本地试听音频预览。沙盒阶段不会上传到 Ubuntu Core，也不会写入后端。');
  };

  const clearLocalAudio = () => {
    if (localAudioUrl?.startsWith('blob:')) URL.revokeObjectURL(localAudioUrl);
    setLocalAudioUrl(undefined);
    setLocalAudioName(undefined);
  };

  const statusValue = useMemo(() => voice.data?.status ?? values.status ?? 'DRAFT', [values.status, voice.data?.status]);

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Voice Profile 编辑' : '新建 Voice Profile'}
        description="独立管理声音配置和试听样音；本地上传的试听音频只做浏览器预览，不上传虚拟机。"
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/voice-profiles')}>返回列表</Button>
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
              <StatusTag value={provider} />
              <StatusTag value={statusValue} />
            </Space>
            <Typography.Paragraph type="secondary" className="voice-description">
              Voice Profile 是声音资源的主人。Agent 只保存 voice.profileId，并通过这里的 previewAudioUrl 展示试听。
            </Typography.Paragraph>
            <div className="voice-audio-panel">
              {currentAudioUrl ? <audio controls src={currentAudioUrl} /> : <Typography.Text type="secondary">暂无试听音频</Typography.Text>}
              {localAudioName ? <Typography.Text type="secondary">本地预览：{localAudioName}</Typography.Text> : null}
            </div>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} className="voice-profile-form">
          <Row gutter={[18, 8]}>
            <Col xs={24} md={12}>
              <Form.Item name="displayName" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}><Input placeholder="温柔女声" /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="provider" label="Provider" rules={[{ required: true }]}><Select options={providerOptions} /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="voiceId" label="Voice ID" rules={[{ required: true, message: '请输入 Voice ID' }]}><Input placeholder="ElevenLabs voice id / mock voice id" /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="modelId" label="Model ID"><Input placeholder="eleven_v3 / eleven_multilingual_v2 / mock-tts" /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="outputFormat" label="输出格式"><Input placeholder="mp3_44100_128" /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="language" label="语言"><Input placeholder="zh-CN" /></Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="说明"><Input.TextArea rows={3} placeholder="用于说明这个声音的风格、适用 Agent 和限制" /></Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="previewAudioUrl" label="Preview Audio URL"><Input placeholder="后端已有试听音频地址；本地上传预览不会写入这里" /></Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="defaultSpeed" label="Speed"><InputNumber min={0.5} max={2} step={0.1} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="defaultStability" label="Stability"><InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="defaultSimilarityBoost" label="Similarity Boost"><InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card className="ios-card voice-local-preview-card">
        <div className="media-toolbar">
          <div>
            <Typography.Title level={4}>试听音频本地预览</Typography.Title>
            <Typography.Text type="secondary">选择本地 mp3 / wav / m4a 只会生成浏览器 object URL，不上传到 Ubuntu Core。</Typography.Text>
          </div>
          <Space wrap>
            <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>选择本地音频</Button>
            <Button icon={<DeleteOutlined />} disabled={!localAudioUrl} onClick={clearLocalAudio}>移除本地预览</Button>
          </Space>
        </div>
        <input ref={fileInputRef} className="hidden-file-input" type="file" accept="audio/*" onChange={(event) => onLocalAudioChange(event.target.files)} />
        <div className="voice-upload-note">
          <b>沙盒规则：</b>保存 Voice Profile 时不会提交本地音频文件。后续真实上传再预留接口 <code>POST /studio/voice-profiles/:id/preview-audio</code>。
        </div>
      </Card>
    </div>
  );
}
