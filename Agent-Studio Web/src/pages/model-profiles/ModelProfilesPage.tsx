import { App, Button, Card, Drawer, Form, Input, InputNumber, Space, Table, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { studioApi } from '../../api/studio';
import { DataToolbar } from '../../components/DataToolbar';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import type { ModelProfile } from '../../types/api';
import { confirmDangerTwice } from '../../utils/confirmDangerTwice';

export function ModelProfilesPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const profiles = useQuery({ queryKey: ['model-profiles', keyword, status], queryFn: () => studioApi.modelProfiles({ keyword, status: status === 'ALL' ? undefined : status }) });
  const [editing, setEditing] = useState<ModelProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const invalidate = async () => { await queryClient.invalidateQueries({ queryKey: ['model-profiles'] }); };

  const save = useMutation({
    mutationFn: (values: any) => editing ? studioApi.updateModelProfile(editing.id, values) : studioApi.createModelProfile(values),
    onSuccess: async () => { message.success('Model Profile 已保存'); await invalidate(); setOpen(false); form.resetFields(); },
  });
  const test = useMutation({ mutationFn: (id: string) => studioApi.testModelProfile(id, 'Hello Jarvis'), onSuccess: () => message.success('Mock 测试通过') });
  const setDefault = useMutation({ mutationFn: studioApi.setDefaultModelProfile, onSuccess: async () => { message.success('默认模型已更新'); await invalidate(); } });
  const enableMut = useMutation({ mutationFn: studioApi.enableModelProfile, onSuccess: async () => { message.success('已启用'); await invalidate(); } });
  const disableMut = useMutation({ mutationFn: studioApi.disableModelProfile, onSuccess: async () => { message.success('已禁用'); await invalidate(); } });
  const deleteMutation = useMutation({
    mutationFn: studioApi.deleteModelProfile,
    onSuccess: async () => { message.success('Model Profile 已删除'); await invalidate(); },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败'),
  });

  const openForm = (record?: ModelProfile) => {
    setEditing(record ?? null);
    setOpen(true);
    form.setFieldsValue(record ? {
      ...record,
      apiKey: '', // never prefill — user types new key to change
    } : { provider: 'DEEPSEEK', modelName: 'deepseek-chat', defaultTemperature: 0.7, defaultMaxTokens: 512 });
  };
  const askDelete = (record: ModelProfile) => confirmDangerTwice({
    modal,
    title: `删除 Model Profile：${record.displayName}`,
    firstContent: '删除模型配置可能影响引用它的 Agent。',
    secondContent: '请再次确认删除。',
    onConfirm: () => deleteMutation.mutate(record.id),
  });

  return <div>
    <PageHeader title="Model Profiles" description="管理 AI 模型配置（API Key、模型名称等）。设为默认后，用户端聊天将使用该配置调用大模型。" />
    <DataToolbar
      searchPlaceholder="模型名称 / Provider"
      onSearch={setKeyword}
      statusOptions={[{ label: '全部', value: 'ALL' }, { label: '启用', value: 'ACTIVE' }, { label: '禁用', value: 'DISABLED' }]}
      statusValue={status}
      onStatusChange={setStatus}
      onRefresh={() => profiles.refetch()}
      actions={<Button type="primary" onClick={() => openForm()}>新建模型配置</Button>}
    />
    <Card className="ios-card"><Table rowKey="id" loading={profiles.isLoading || profiles.isFetching} dataSource={profiles.data?.items ?? []} rowSelection={{ preserveSelectedRowKeys: true }} scroll={{ x: 1100 }} columns={[
      { title: '名称', dataIndex: 'displayName' },
      { title: 'Provider', dataIndex: 'provider', render: (v) => <StatusTag value={v} /> },
      { title: 'Model', dataIndex: 'modelName' },
      { title: 'Base URL', dataIndex: 'baseUrl', render: (v) => v || '-' },
      { title: '状态', dataIndex: 'status', render: (v) => v === 'ACTIVE' ? <Tag color="green">启用</Tag> : <Tag color="default">禁用</Tag> },
      { title: 'Key', render: (_, r) => r.apiKeyConfigured ? (r.apiKeyMasked || '已配置') : '未配置' },
      { title: '默认', dataIndex: 'isDefault', render: (v) => v ? <StatusTag value="ACTIVE" /> : '-' },
      { title: '操作', render: (_, r) => <Space wrap>
        <Button icon={<EditOutlined />} onClick={() => openForm(r)}>编辑</Button>
        <Button onClick={() => test.mutate(r.id)}>测试</Button>
        <Button onClick={() => setDefault.mutate(r.id)}>设默认</Button>
        {r.status === 'ACTIVE'
          ? <Button icon={<PauseCircleOutlined />} onClick={() => disableMut.mutate(r.id)}>禁用</Button>
          : <Button icon={<PlayCircleOutlined />} onClick={() => enableMut.mutate(r.id)}>启用</Button>
        }
        <Button danger icon={<DeleteOutlined />} onClick={() => askDelete(r)}>删除</Button>
      </Space> },
    ]} /></Card>
    <Drawer title={editing ? '编辑 Model Profile' : '新建 Model Profile'} open={open} width={560} onClose={() => setOpen(false)} extra={<Button type="primary" loading={save.isPending} onClick={() => form.submit()}>保存</Button>}>
      <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
        <Form.Item name="displayName" label="显示名称" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="provider" label="Provider" rules={[{ required: true }]}><Input placeholder="DEEPSEEK / GEMINI / OPENAI" /></Form.Item>
        <Form.Item name="modelName" label="Model Name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="baseUrl" label="Base URL"><Input placeholder="https://api.deepseek.com" /></Form.Item>
        <Form.Item name="apiKey" label={editing?.apiKeyConfigured ? 'API Key（已配置 ' + (editing.apiKeyMasked || '****') + '，留空保持不变）' : 'API Key'}>
          <Input.Password placeholder={editing?.apiKeyConfigured ? '留空则保持不变' : 'sk-xxx'} />
        </Form.Item>
        <Form.Item name="defaultTemperature" label="Temperature"><InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="defaultMaxTokens" label="Max Tokens"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
      </Form>
    </Drawer>
  </div>;
}
