import { App, Button, Card, Drawer, Form, Input, InputNumber, Space, Table } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import type { ModelProfile } from '../../types/api';
import { confirmDangerTwice } from '../../utils/confirmDangerTwice';

export function ModelProfilesPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const profiles = useQuery({ queryKey: ['model-profiles'], queryFn: studioApi.modelProfiles });
  const [editing, setEditing] = useState<ModelProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const save = useMutation({
    mutationFn: (values: any) => editing ? studioApi.updateModelProfile(editing.id, values) : studioApi.createModelProfile(values),
    onSuccess: async () => { message.success('Model Profile 已保存'); await queryClient.invalidateQueries({ queryKey: ['model-profiles'] }); setOpen(false); form.resetFields(); },
  });
  const test = useMutation({ mutationFn: (id: string) => studioApi.testModelProfile(id, 'Hello Jarvis'), onSuccess: () => message.success('Mock 测试通过') });
  const setDefault = useMutation({ mutationFn: studioApi.setDefaultModelProfile, onSuccess: async () => { message.success('默认模型已更新'); await queryClient.invalidateQueries({ queryKey: ['model-profiles'] }); } });
  const deleteMutation = useMutation({
    mutationFn: studioApi.deleteModelProfile,
    onSuccess: async () => { message.success('Model Profile 已删除'); await queryClient.invalidateQueries({ queryKey: ['model-profiles'] }); },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败'),
  });

  const openForm = (record?: ModelProfile) => { setEditing(record ?? null); setOpen(true); form.setFieldsValue(record ?? { provider: 'MOCK', modelName: 'jarvis-mock-chat', defaultTemperature: 0.7, defaultMaxTokens: 512 }); };
  const askDelete = (record: ModelProfile) => confirmDangerTwice({
    modal,
    title: `删除 Model Profile：${record.displayName}`,
    firstContent: '删除模型配置可能影响引用它的 Agent。生产环境应先检查引用关系；沙盒阶段会直接从 Mock 数据中移除。',
    secondContent: '这是第二次确认。请确认你真的要删除这个 Model Profile。',
    onConfirm: () => deleteMutation.mutate(record.id),
  });

  return <div>
    <PageHeader title="Model Profiles" description="DeepSeek API Key 先预留；沙盒阶段使用 Mock LLM。删除操作需要警告与再次确认。" actions={<Button type="primary" onClick={() => openForm()}>新建模型配置</Button>} />
    <Card className="ios-card"><Table rowKey="id" loading={profiles.isLoading} dataSource={profiles.data?.items ?? []} columns={[
      { title: '名称', dataIndex: 'displayName' },
      { title: 'Provider', dataIndex: 'provider', render: (v) => <StatusTag value={v} /> },
      { title: 'Model', dataIndex: 'modelName' },
      { title: 'Base URL', dataIndex: 'baseUrl' },
      { title: 'Key', render: (_, r) => r.apiKeyConfigured ? (r.apiKeyMasked || '已配置') : '未配置' },
      { title: '默认', dataIndex: 'isDefault', render: (v) => v ? <StatusTag value="ACTIVE" /> : '-' },
      { title: '操作', render: (_, r) => <Space wrap><Button icon={<EditOutlined />} onClick={() => openForm(r)}>编辑</Button><Button onClick={() => test.mutate(r.id)}>测试</Button><Button onClick={() => setDefault.mutate(r.id)}>设默认</Button><Button danger icon={<DeleteOutlined />} onClick={() => askDelete(r)}>删除</Button></Space> },
    ]} /></Card>
    <Drawer title={editing ? '编辑 Model Profile' : '新建 Model Profile'} open={open} width={560} onClose={() => setOpen(false)} extra={<Button type="primary" loading={save.isPending} onClick={() => form.submit()}>保存</Button>}>
      <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
        <Form.Item name="displayName" label="显示名称" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="provider" label="Provider" rules={[{ required: true }]}><Input placeholder="MOCK / DEEPSEEK" /></Form.Item>
        <Form.Item name="modelName" label="Model Name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="baseUrl" label="Base URL"><Input /></Form.Item>
        <Form.Item name="apiKey" label="API Key（预留，可为空）"><Input.Password /></Form.Item>
        <Form.Item name="defaultTemperature" label="Temperature"><InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="defaultMaxTokens" label="Max Tokens"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
      </Form>
    </Drawer>
  </div>;
}
