import { ArrowLeftOutlined, AudioOutlined, PictureOutlined, PlayCircleOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Form, Input, Row, Select, Space, Tabs, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studioApi } from '../../api/studio';
import { API_BASE_URL } from '../../api/http';
import { AvatarInitial } from '../../components/AvatarInitial';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import type { AgentRecord, VoiceProfile } from '../../types/api';

type LocalMedia = {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
};

type Props = {
  mode: 'create' | 'edit';
};

const emptyAgentPrompt = '你是一个 Jarvis Agent。请保持专业、简洁、可靠，先给结论，再给步骤。';

function resolveAudioUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function isPublishedVoice(voice: VoiceProfile) {
  return voice.status === 'PUBLISHED' || voice.status === 'ACTIVE';
}

export function AgentEditPage({ mode }: Props) {
  const { id } = useParams();
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [localMedia, setLocalMedia] = useState<LocalMedia[]>([]);

  const agent = useQuery({
    queryKey: ['agent', id],
    queryFn: () => studioApi.agent(id as string),
    enabled: isEdit && Boolean(id),
  });
  const models = useQuery({ queryKey: ['model-profiles'], queryFn: studioApi.modelProfiles });
  const voices = useQuery({ queryKey: ['voice-profiles'], queryFn: () => studioApi.voiceProfiles({ status: 'PUBLISHED' }) });

  useEffect(() => {
    const record = agent.data;
    if (!record) {
      if (!isEdit) {
        form.setFieldsValue({
          name: '',
          slug: '',
          description: '',
          modelProfileId: 'model_profile_mock_default',
          voiceProfileId: 'voice_profile_mock_default',
          configPrompt: emptyAgentPrompt,
        });
      }
      return;
    }
    form.setFieldsValue({
      name: record.manifest.identity.name,
      slug: record.slug,
      description: record.manifest.identity.description,
      modelProfileId: record.manifest.model?.profileId,
      voiceProfileId: record.manifest.voice?.profileId,
      configPrompt: record.manifest.config?.prompt,
    });
  }, [agent.data, form, isEdit]);

  useEffect(() => {
    return () => {
      localMedia.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [localMedia]);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const current = agent.data;
      const selectedVoice = (voices.data?.items ?? []).find((voice) => voice.id === values.voiceProfileId);
      const payload = {
        slug: values.slug,
        manifest: {
          identity: {
            name: values.name,
            slug: values.slug,
            description: values.description ?? '',
            avatarUrl: current?.manifest.identity.avatarUrl ?? '',
          },
          social: current?.manifest.social ?? { galleryImages: [], galleryVideos: [] },
          model: { profileId: values.modelProfileId },
          voice: {
            profileId: values.voiceProfileId,
            displayName: selectedVoice?.displayName,
            previewAudioUrl: selectedVoice?.previewAudioUrl ?? selectedVoice?.previewUrl,
          },
          config: { prompt: values.configPrompt },
        },
      };
      return isEdit && id ? studioApi.updateAgent(id, payload) : studioApi.createAgent(payload);
    },
    onSuccess: async (saved) => {
      message.success('Agent 已保存');
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      await queryClient.invalidateQueries({ queryKey: ['agent', saved.id] });
      if (!isEdit) navigate(`/agents/${saved.id}/edit`, { replace: true });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  });

  const values = Form.useWatch([], form) ?? {};
  const record = agent.data;
  const existingImages = record?.manifest.social?.galleryImages ?? [];
  const existingVideos = record?.manifest.social?.galleryVideos ?? [];
  const previewName = values.name || record?.manifest.identity.name || 'New Agent';
  const previewDescription = values.description || record?.manifest.identity.description || 'Agent profile preview';
  const voiceItems = (voices.data?.items ?? []).filter(isPublishedVoice);
  const selectedVoice = voiceItems.find((voice) => voice.id === values.voiceProfileId) ?? voiceItems.find((voice) => voice.id === record?.manifest.voice?.profileId);
  const selectedVoiceAudioUrl = resolveAudioUrl(selectedVoice?.previewAudioUrl ?? selectedVoice?.previewUrl ?? record?.manifest.voice?.previewAudioUrl);

  const stats = useMemo(() => ({
    photos: existingImages.length + localMedia.filter((item) => item.type === 'image').length,
    videos: existingVideos.length + localMedia.filter((item) => item.type === 'video').length,
    status: record?.status ?? 'DRAFT',
  }), [existingImages.length, existingVideos.length, localMedia, record?.status]);

  const addLocalFiles = (files: FileList | null, type: 'image' | 'video') => {
    if (!files?.length) return;
    const next = Array.from(files).map((file) => ({
      id: `${type}_${Date.now()}_${file.name}`,
      type,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setLocalMedia((items) => [...next, ...items]);
    message.info('已添加本地预览。沙盒阶段不会上传到 Ubuntu Core，也不会写入服务器。');
  };

  const removeLocalMedia = (id: string) => {
    setLocalMedia((items) => {
      const target = items.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return items.filter((item) => item.id !== id);
    });
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Agent Profile 编辑' : '新建 Agent Profile'}
        description="Instagram 风格 Agent 主页编辑器：上方基本资料和已发布 Voice 选择，下方媒体展示；本地媒体只做浏览器预览。"
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/agents')}>返回列表</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} onClick={() => form.submit()}>保存 Agent</Button>
          </Space>
        }
      />

      <Card className="ios-card agent-profile-card" loading={agent.isLoading}>
        <div className="agent-profile-hero">
          <AvatarInitial size={112} name={previewName} large className="agent-profile-avatar" />
          <div className="agent-profile-main">
            <Space align="center" wrap>
              <Typography.Title level={2} className="agent-profile-name">{previewName}</Typography.Title>
              <StatusTag value={stats.status} />
            </Space>
            <div className="agent-profile-stats">
              <span><b>{stats.photos}</b> photos</span>
              <span><b>{stats.videos}</b> videos</span>
              <span><b>{record?.version ?? '0.1.0'}</b> version</span>
            </div>
            <Typography.Paragraph className="agent-profile-bio">{previewDescription}</Typography.Paragraph>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} className="agent-profile-form">
          <Row gutter={[18, 8]}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入 Agent 名称' }]}><Input placeholder="Jarvis" /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="slug" label="Slug" rules={[{ required: true, message: '请输入 slug' }]}><Input placeholder="jarvis" /></Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="个人简介 / 描述"><Input.TextArea rows={3} placeholder="展示在 Agent 主页上的简介" /></Form.Item>
            </Col>
            <Col xs={24}>
              <div className="reserved-field-note">
                头像图片字段与接口已预留，但 V1.7.3 管理端不开放头像 URL / 上传入口；头像统一使用蓝底白色首字符。
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="modelProfileId" label="Model Profile" rules={[{ required: true }]}><Select options={(models.data?.items ?? []).map((m) => ({ label: m.displayName, value: m.id }))} /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="voiceProfileId" label="Voice Profile（仅已发布）" rules={[{ required: true }]}>
                <Select
                  loading={voices.isLoading}
                  options={voiceItems.map((v) => ({ label: `${v.displayName} · ${v.provider}`, value: v.id }))}
                  placeholder="选择已发布 Voice Profile"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <div className="selected-voice-preview">
                <div className="selected-voice-icon"><AudioOutlined /></div>
                <div className="selected-voice-content">
                  <Space wrap>
                    <b>{selectedVoice?.displayName ?? '未选择 Voice Profile'}</b>
                    {selectedVoice ? <StatusTag value={selectedVoice.provider} /> : null}
                    {selectedVoice ? <StatusTag value={selectedVoice.status} /> : null}
                  </Space>
                  <Typography.Text type="secondary">
                    Agent 只保存 voice.profileId；试听音频来自 VoiceProfile.previewAudioUrl。
                  </Typography.Text>
                  {selectedVoiceAudioUrl ? <audio controls src={selectedVoiceAudioUrl} /> : <Typography.Text type="secondary">暂无试听音频</Typography.Text>}
                </div>
              </div>
            </Col>
            <Col xs={24}>
              <Form.Item name="configPrompt" label="Config Prompt" rules={[{ required: true }]}><Input.TextArea rows={8} placeholder="Agent 的完整设定、能力边界和回复风格" /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card className="ios-card agent-media-card">
        <div className="media-toolbar">
          <div>
            <Typography.Title level={4}>媒体展示</Typography.Title>
            <Typography.Text type="secondary">照片 / 视频只做页面展示预览；本地选择文件不会上传到 UTM Ubuntu。</Typography.Text>
          </div>
          <Space wrap>
            <Button icon={<PictureOutlined />} onClick={() => imageInputRef.current?.click()}>添加照片预览</Button>
            <Button icon={<PlayCircleOutlined />} onClick={() => videoInputRef.current?.click()}>添加视频预览</Button>
          </Space>
        </div>
        <input ref={imageInputRef} className="hidden-file-input" type="file" accept="image/*" multiple onChange={(event) => addLocalFiles(event.target.files, 'image')} />
        <input ref={videoInputRef} className="hidden-file-input" type="file" accept="video/*" multiple onChange={(event) => addLocalFiles(event.target.files, 'video')} />

        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: '全部',
              children: <MediaGrid existingImages={existingImages} existingVideos={existingVideos} localMedia={localMedia} onRemoveLocal={removeLocalMedia} />,
            },
            {
              key: 'photos',
              label: '照片',
              children: <MediaGrid existingImages={existingImages} existingVideos={[]} localMedia={localMedia.filter((item) => item.type === 'image')} onRemoveLocal={removeLocalMedia} />,
            },
            {
              key: 'videos',
              label: '视频',
              children: <MediaGrid existingImages={[]} existingVideos={existingVideos} localMedia={localMedia.filter((item) => item.type === 'video')} onRemoveLocal={removeLocalMedia} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}

function MediaGrid({
  existingImages,
  existingVideos,
  localMedia,
  onRemoveLocal,
}: {
  existingImages: NonNullable<AgentRecord['manifest']['social']>['galleryImages'] | undefined;
  existingVideos: NonNullable<AgentRecord['manifest']['social']>['galleryVideos'] | undefined;
  localMedia: LocalMedia[];
  onRemoveLocal: (id: string) => void;
}) {
  const savedImages = existingImages ?? [];
  const savedVideos = existingVideos ?? [];
  const hasItems = savedImages.length || savedVideos.length || localMedia.length;
  if (!hasItems) {
    return (
      <div className="empty-media-grid">
        <PlusOutlined />
        <div>还没有媒体。先添加本地照片或视频预览。</div>
      </div>
    );
  }

  return (
    <div className="agent-media-grid">
      {savedImages.map((item, index) => (
        <div className="media-tile" key={`image_${item.url}_${index}`}>
          <img src={item.url} alt={item.alt || 'Agent image'} />
          <span className="media-badge">已保存照片</span>
        </div>
      ))}
      {savedVideos.map((item, index) => (
        <div className="media-tile" key={`video_${item.url}_${index}`}>
          <video src={item.url} poster={item.posterUrl} muted controls />
          <span className="media-badge">已保存视频</span>
        </div>
      ))}
      {localMedia.map((item) => (
        <div className="media-tile local" key={item.id}>
          {item.type === 'image' ? <img src={item.url} alt={item.name} /> : <video src={item.url} muted controls />}
          <span className="media-badge local">本地预览</span>
          <Button size="small" danger className="remove-media-button" onClick={() => onRemoveLocal(item.id)}>移除</Button>
        </div>
      ))}
    </div>
  );
}
