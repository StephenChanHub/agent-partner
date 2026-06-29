import { App, Button, Card, Col, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Row, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import type { RechargePackage } from '../../types/api';
import { fmtRmb, fmtTokens } from '../../utils/format';

const quickDiscounts = [
  { label: '+10% 赠送', bonusPercent: 10 },
  { label: '+20% 赠送', bonusPercent: 20 },
  { label: '+50% 赠送', bonusPercent: 50 },
];

export function PricingPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RechargePackage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const pricing = useQuery({ queryKey: ['pricing'], queryFn: studioApi.pricing });
  const packages = useQuery({ queryKey: ['packages'], queryFn: studioApi.packages });
  const data: any = pricing.data ?? {};

  const refreshPackages = () => queryClient.invalidateQueries({ queryKey: ['packages'] });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        name: values.name,
        amountRmb: Number(values.amountRmb),
        agentTokens: Number(values.agentTokens),
        status: (values.status ? 'ACTIVE' : 'DISABLED') as RechargePackage['status'],
        sortOrder: Number(values.sortOrder ?? 100),
      };
      return editing ? studioApi.updatePackage(editing.id, payload) : studioApi.createPackage(payload);
    },
    onSuccess: async () => {
      message.success('套餐已保存');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      await refreshPackages();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studioApi.deletePackage(id),
    onSuccess: async () => {
      message.success('套餐已删除');
      await refreshPackages();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败'),
  });

  const discountMutation = useMutation({
    mutationFn: ({ id, bonusPercent, reset }: { id: string; bonusPercent?: number; reset?: boolean }) => studioApi.applyPackageDiscount(id, { bonusPercent, reset }),
    onSuccess: async () => {
      message.success('折扣快捷操作已应用');
      await refreshPackages();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '折扣操作失败'),
  });

  const openForm = (record?: RechargePackage) => {
    setEditing(record ?? null);
    setModalOpen(true);
    form.setFieldsValue(record ? {
      name: record.name,
      amountRmb: record.amountRmb,
      agentTokens: record.agentTokens,
      status: record.status === 'ACTIVE',
      sortOrder: record.sortOrder,
    } : {
      name: '',
      amountRmb: 10,
      agentTokens: 10000,
      status: true,
      sortOrder: 100,
    });
  };

  const columns: ColumnsType<RechargePackage> = [
    { title: '套餐', dataIndex: 'name', render: (value, record) => <Space direction="vertical" size={0}><b>{value}</b><span className="table-subtitle">{record.id}</span></Space> },
    { title: '金额', dataIndex: 'amountRmb', render: fmtRmb },
    { title: '基础 Tokens', dataIndex: 'baseTokens', render: fmtTokens },
    { title: '最终 Tokens', dataIndex: 'agentTokens', render: (value, record) => <Space><b>{fmtTokens(value)}</b>{record.bonusTokens > 0 && <Tag color="blue">+{fmtTokens(record.bonusTokens)}</Tag>}</Space> },
    { title: '折扣/赠送', dataIndex: 'discountPercent', render: (value) => value > 0 ? <Tag color="blue">+{value}%</Tag> : <Tag>无</Tag> },
    { title: '状态', dataIndex: 'status', render: (value) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{value === 'ACTIVE' ? '启用' : '停用'}</Tag> },
    {
      title: '快捷操作',
      render: (_, record) => (
        <Space wrap>
          {quickDiscounts.map((item) => (
            <Button size="small" key={item.bonusPercent} onClick={() => discountMutation.mutate({ id: record.id, bonusPercent: item.bonusPercent })}>{item.label}</Button>
          ))}
          <Button size="small" onClick={() => discountMutation.mutate({ id: record.id, reset: true })}>重置</Button>
        </Space>
      ),
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button onClick={() => openForm(record)}>编辑</Button>
          <Popconfirm title="确定删除这个充值套餐？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return <div>
    <PageHeader
      title="Pricing"
      description="Agent Tokens 计价规则与可编辑充值套餐。真实支付暂未接入，套餐 CRUD 只作用于沙盒 Mock 数据。"
      actions={<Button type="primary" onClick={() => openForm()}>新建套餐</Button>}
    />
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={9}>
        <Card className="ios-card" title="计价规则" loading={pricing.isLoading}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="币种">{data.currency}</Descriptions.Item>
            <Descriptions.Item label="兑换比例">1000 Agent Tokens = 1 RMB</Descriptions.Item>
            <Descriptions.Item label="倍率">{data.billingMultiplier}</Descriptions.Item>
            <Descriptions.Item label="文字最低余额">{fmtTokens(data.minimumBalance?.text)}</Descriptions.Item>
            <Descriptions.Item label="语音最低余额">{fmtTokens(data.minimumBalance?.voice)}</Descriptions.Item>
            <Descriptions.Item label="LLM 模式">{data.llm?.mode}</Descriptions.Item>
            <Descriptions.Item label="TTS 模式">{data.tts?.mode}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} lg={15}>
        <Card className="ios-card" title="充值套餐 CRUD + 折扣快捷操作">
          <Table rowKey="id" loading={packages.isLoading} dataSource={packages.data ?? []} columns={columns} scroll={{ x: 1080 }} />
        </Card>
      </Col>
    </Row>

    <Modal
      title={editing ? '编辑充值套餐' : '新建充值套餐'}
      open={modalOpen}
      onCancel={() => setModalOpen(false)}
      onOk={() => form.submit()}
      okButtonProps={{ loading: saveMutation.isPending }}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
        <Form.Item name="name" label="套餐名称" rules={[{ required: true }]}><Input placeholder="¥10 基础包" /></Form.Item>
        <Form.Item name="amountRmb" label="金额 RMB" rules={[{ required: true }]}><InputNumber min={1} precision={2} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="agentTokens" label="Agent Tokens" rules={[{ required: true }]}><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="sortOrder" label="排序"><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="status" label="启用" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  </div>;
}
