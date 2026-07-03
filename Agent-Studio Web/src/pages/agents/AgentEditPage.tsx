import { ArrowLeftOutlined, AudioOutlined, DeleteOutlined, PictureOutlined, PlayCircleOutlined, PlusOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
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

type Props = { mode: 'create' | 'edit' };
type GalleryImage = { url: string; alt?: string; sortOrder?: number };
type GalleryVideo = { url: string; posterUrl?: string; title?: string; sortOrder?: number };

const emptyAgentPrompt = '你是一个 Jarvis Agent。请保持专业、简洁、可靠，先给结论，再给步骤。';

function resolveMediaUrl(url?: string) {
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
  const [draftImages, setDraftImages] = useState<GalleryImage[]>([]);
  const [draftVideos, setDraftVideos] = useState<GalleryVideo[]>([]);

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
          voiceProfileId: '00000000-0000-4000-8000-000000000101',
          configPrompt: emptyAgentPrompt,
        });
        setDraftImages([]);
        setDraftVideos([]);
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
    setDraftImages(record.manifest.social?.galleryImages ?? []);
    setDraftVideos(record.manifest.social?.galleryVideos ?? []);
  }, [agent.data, form, isEdit]);

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: 'agent-image' | 'agent-video' }) => studioApi.uploadMedia(file, kind),
    onError: (error) => message.error(error instanceof Error ? error.message : '媒体上传失败'),
  });

  const uploadFiles = async (files: FileList | null, type: 'image' | 'video') => {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;
    const kind = type === 'image' ? 'agent-image' : 'agent-video';
    try {
      const uploaded = await Promise.all(selected.map((file) => uploadMediaMutation.mutateAsync({ file, kind })));
      if (type === 'image') {
        setDraftImages((items) => [
          ...items,
          ...uploaded.map((file, index) => ({ url: file.url, alt: file.originalName, sortOrder: items.length + index + 1 })),
        ]);
      } else {
        setDraftVideos((items) => [
          ...items,
          ...uploaded.map((file, index) => ({ url: file.url, title: file.originalName, sortOrder: items.length + index + 1 })),
        ]);
      }
      message.success(`已上传 ${uploaded.length} 个媒体文件，并写入待保存的 Agent 媒体列表`);
    } finally {
      if (type === 'image' && imageInputRef.current) imageInputRef.current.value = '';
      if (type === 'video' && videoInputRef.current) videoInputRef.current.value = '';
    }
  };

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
          social: { galleryImages: draftImages, galleryVideos: draftVideos },
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
      message.success('Agent 已保存，客户端 Agent 卡片会读取最新发布数据');
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      await queryClient.invalidateQueries({ queryKey: ['agent', saved.id] });
      if (!isEdit) navigate(`/agents/${saved.id}/edit`, { replace: true });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  });

  const values = Form.useWatch([], form) ?? {};
  const record = agent.data;
  const previewName = values.name || record?.manifest.identity.name || 'New Agent';
  const previewDescription = values.description || record?.manifest.identity.description || 'Agent profile preview';
  const voiceItems = (voices.data?.items ?? []).filter(isPublishedVoice);
  const selectedVoice = voiceItems.find((voice) => voice.id === values.voiceProfileId) ?? voiceItems.find((voice) => voice.id === record?.manifest.voice?.profileId);
  const selectedVoiceAudioUrl = resolveMediaUrl(selectedVoice?.previewAudioUrl ?? selectedVoice?.previewUrl ?? record?.manifest.voice?.previewAudioUrl);

  const stats = useMemo(() => ({
    photos: draftImages.length,
    videos: draftVideos.length,
    status: record?.status ?? 'DRAFT',
  }), [draftImages.length, draftVideos.length, record?.status]);

  const removeImage = (index: number) => setDraftImages((items) => items.filter((_, itemIndex) => itemIndex !== index));
  const removeVideo = (index: number) => setDraftVideos((items) => items.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Agent Profile 编辑' : '新建 Agent Profile'}
        description="管理员创建和维护 Agent；媒体文件会上传到后端 media-storage，保存并发布后客户端卡片同步展示。"
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
              <div className="reserved-field-note">头像字段保留在 manifest.identity.avatarUrl；当前页面优先使用统一首字母头像，媒体展示由下方图片/视频管理。</div>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="modelProfileId" label="Model Profile" rules={[{ required: true }]}><Select options={(models.data?.items ?? []).map((m) => ({ label: m.displayName, value: m.id }))} /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="voiceProfileId" label="Voice Profile（仅已发布）" rules={[{ required: true }]}> 
                <Select loading={voices.isLoading} options={voiceItems.map((v) => ({ label: `${v.displayName} · ${v.provider}`, value: v.id }))} placeholder="选择已发布 Voice Profile" />
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
                  <Typography.Text type="secondary">Agent 保存 voice.profileId；试听音频来自 Voice Profile 的 previewAudioUrl。</Typography.Text>
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
            <Typography.Text type="secondary">上传后文件存储在后端 media-storage；点击保存 Agent 后写入 manifest.social，发布后用户端卡片同步展示。</Typography.Text>
          </div>
          <Space wrap>
            <Button icon={<PictureOutlined />} loading={uploadMediaMutation.isPending} onClick={() => imageInputRef.current?.click()}>上传照片</Button>
            <Button icon={<PlayCircleOutlined />} loading={uploadMediaMutation.isPending} onClick={() => videoInputRef.current?.click()}>上传视频</Button>
          </Space>
        </div>
        <input ref={imageInputRef} className="hidden-file-input" type="file" accept="image/*" multiple onChange={(event) => uploadFiles(event.target.files, 'image')} />
        <input ref={videoInputRef} className="hidden-file-input" type="file" accept="video/*" multiple onChange={(event) => uploadFiles(event.target.files, 'video')} />

        <Tabs
          defaultActiveKey="all"
          items={[
            { key: 'all', label: '全部', children: <MediaGrid images={draftImages} videos={draftVideos} onRemoveImage={removeImage} onRemoveVideo={removeVideo} /> },
            { key: 'photos', label: '照片', children: <MediaGrid images={draftImages} videos={[]} onRemoveImage={removeImage} onRemoveVideo={removeVideo} /> },
            { key: 'videos', label: '视频', children: <MediaGrid images={[]} videos={draftVideos} onRemoveImage={removeImage} onRemoveVideo={removeVideo} /> },
          ]}
        />
      </Card>
    </div>
  );
}

function MediaGrid({
  images,
  videos,
  onRemoveImage,
  onRemoveVideo,
}: {
  images: GalleryImage[];
  videos: GalleryVideo[];
  onRemoveImage: (index: number) => void;
  onRemoveVideo: (index: number) => void;
}) {
  const hasItems = images.length || videos.length;
  if (!hasItems) {
    return (
      <div className="empty-media-grid">
        <PlusOutlined />
        <div>还没有媒体。请从管理员端上传照片或视频。</div>
      </div>
    );
  }

  return (
    <div className="agent-media-grid">
      {images.map((item, index) => (
        <div className="media-tile" key={`image_${item.url}_${index}`}>
          <img src={resolveMediaUrl(item.url)} alt={item.alt || 'Agent image'} />
          <span className="media-badge">已保存照片</span>
          <Button size="small" danger icon={<DeleteOutlined />} className="remove-media-button" onClick={() => onRemoveImage(index)}>移除</Button>
        </div>
      ))}
      {videos.map((item, index) => (
        <div className="media-tile" key={`video_${item.url}_${index}`}>
          <video src={resolveMediaUrl(item.url)} poster={resolveMediaUrl(item.posterUrl)} muted controls />
          <span className="media-badge">已保存视频</span>
          <Button size="small" danger icon={<DeleteOutlined />} className="remove-media-button" onClick={() => onRemoveVideo(index)}>移除</Button>
        </div>
      ))}
    </div>
  );
}
