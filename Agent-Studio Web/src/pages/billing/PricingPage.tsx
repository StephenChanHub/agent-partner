import { App, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { studioApi } from '../../api/studio';
import { PageHeader } from '../../components/PageHeader';
import type { PricingRule, RechargePackage } from '../../types/api';
import { fmtRmb, fmtTokens } from '../../utils/format';
import { confirmDangerTwice } from '../../utils/confirmDangerTwice';

const quickDiscounts = [
  { label: '+10% 赠送', bonusPercent: 10 },
  { label: '+20% 赠送', bonusPercent: 20 },
  { label: '+50% 赠送', bonusPercent: 50 },
];

const ruleGroups = ['CORE', 'BALANCE', 'VOICE', 'LLM', 'TTS', 'SYSTEM'];
const valueTypes = ['NUMBER', 'STRING', 'BOOLEAN'];

function renderRuleValue(rule: PricingRule) {
  const value = typeof rule.value === 'boolean' ? (rule.value ? 'true' : 'false') : String(rule.value);
  return <Space><b>{value}</b>{rule.unit ? <Tag>{rule.unit}</Tag> : null}</Space>;
}

export function PricingPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [editingPackage, setEditingPackage] = useState<RechargePackage | null>(null);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [packageForm] = Form.useForm();
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleForm] = Form.useForm();

  const pricing = useQuery({ queryKey: ['pricing'], queryFn: studioApi.pricing });
  const packages = useQuery({ queryKey: ['packages'], queryFn: studioApi.packages });
  const rules = useQuery({ queryKey: ['pricing-rules'], queryFn: studioApi.pricingRules });

  const refreshPackages = () => queryClient.invalidateQueries({ queryKey: ['packages'] });
  const refreshRules = () => queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });

  const savePackageMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        name: values.name,
        amountRmb: Number(values.amountRmb),
        agentTokens: Number(values.agentTokens),
        status: (values.status ? 'ACTIVE' : 'DISABLED') as RechargePackage['status'],
        sortOrder: Number(values.sortOrder ?? 100),
      };
      return editingPackage ? studioApi.updatePackage(editingPackage.id, payload) : studioApi.createPackage(payload);
    },
    onSuccess: async () => {
      message.success('套餐已保存');
      setPackageModalOpen(false);
      setEditingPackage(null);
      packageForm.resetFields();
      await refreshPackages();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  });

  const deletePackageMutation = useMutation({
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

  const saveRuleMutation = useMutation({
    mutationFn: async (values: any) => {
      const rawValue = values.value;
      const typedValue = values.valueType === 'NUMBER' ? Number(rawValue) : values.valueType === 'BOOLEAN' ? rawValue === true || rawValue === 'true' : String(rawValue ?? '');
      const payload = {
        ...values,
        value: typedValue,
        editable: Boolean(values.editable),
        sortOrder: Number(values.sortOrder ?? 100),
      };
      return editingRule ? studioApi.updatePricingRule(editingRule.id, payload) : studioApi.createPricingRule(payload);
    },
    onSuccess: async () => {
      message.success('计费规则已保存');
      setRuleModalOpen(false);
      setEditingRule(null);
      ruleForm.resetFields();
      await refreshRules();
      await queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => studioApi.deletePricingRule(id),
    onSuccess: async () => {
      message.success('计费规则已删除');
      await refreshRules();
      await queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败'),
  });

  const openPackageForm = (record?: RechargePackage) => {
    setEditingPackage(record ?? null);
    setPackageModalOpen(true);
    packageForm.setFieldsValue(record ? {
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

  const openRuleForm = (record?: PricingRule) => {
    setEditingRule(record ?? null);
    setRuleModalOpen(true);
    ruleForm.setFieldsValue(record ? {
      ...record,
      editable: record.editable,
    } : {
      key: '',
      label: '',
      group: 'CORE',
      valueType: 'NUMBER',
      value: 0,
      unit: '',
      description: '',
      editable: true,
      status: 'ACTIVE',
      sortOrder: 100,
    });
  };

  const askDeletePackage = (record: RechargePackage) => confirmDangerTwice({
    modal,
    title: `删除套餐：${record.name}`,
    firstContent: '删除套餐会让用户端充值页面不再展示这个套餐。沙盒阶段会从 Mock 数据中移除。',
    secondContent: '这是第二次确认。请确认你真的要删除这个充值套餐。',
    onConfirm: () => deletePackageMutation.mutate(record.id),
  });

  const askDeleteRule = (record: PricingRule) => confirmDangerTwice({
    modal,
    title: `删除计费规则：${record.label}`,
    firstContent: '删除计费规则可能影响价格展示和后续结算逻辑。核心规则建议停用而不是删除。',
    secondContent: '这是第二次确认。请确认你真的要删除这个计费规则。',
    onConfirm: () => deleteRuleMutation.mutate(record.id),
  });

  const packageColumns: ColumnsType<RechargePackage> = [
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
          <Button icon={<EditOutlined />} onClick={() => openPackageForm(record)}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => askDeletePackage(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  const ruleColumns: ColumnsType<PricingRule> = [
    { title: '规则', render: (_, record) => <Space direction="vertical" size={0}><b>{record.label}</b><span className="table-subtitle">{record.key}</span></Space> },
    { title: '分组', dataIndex: 'group', render: (value) => <Tag color="blue">{value}</Tag> },
    { title: '值', render: (_, record) => renderRuleValue(record) },
    { title: '状态', dataIndex: 'status', render: (value) => <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{value === 'ACTIVE' ? '启用' : '停用'}</Tag> },
    { title: '可编辑', dataIndex: 'editable', render: (value) => value ? <Tag color="green">YES</Tag> : <Tag>READONLY</Tag> },
    { title: '说明', dataIndex: 'description', ellipsis: true },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openRuleForm(record)}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => askDeleteRule(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  const data: any = pricing.data ?? {};

  return <div>
    <PageHeader
      title="Pricing"
      description="充值套餐与核心计费规则都支持 CRUD；LLM/TTS provider mode 暂作为展示字段，不强制做 CRUD。"
      actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => openRuleForm()}>新建计费规则</Button>}
    />
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card className="ios-card" loading={pricing.isLoading}>
          <Space direction="vertical" size={6}>
            <Typography.Text strong>当前生效规则快照</Typography.Text>
            <Typography.Text type="secondary">
              兑换比例：{data.agentTokensPerRmb ?? 1000} Agent Tokens / RMB ｜ 计费倍率：{data.billingMultiplier ?? 1.5} ｜ 文字最低余额：{fmtTokens(data.minimumTextBalance)} ｜ 语音最低余额：{fmtTokens(data.minimumVoiceBalance)}
            </Typography.Text>
          </Space>
        </Card>
      </Col>
      <Col xs={24}>
        <Tabs
          items={[
            {
              key: 'rules',
              label: '计费规则 CRUD',
              children: <Card className="ios-card" title="Billing Pricing Rules"><Table rowKey="id" loading={rules.isLoading} dataSource={rules.data ?? []} columns={ruleColumns} scroll={{ x: 1080 }} /></Card>,
            },
            {
              key: 'packages',
              label: '充值套餐 CRUD',
              children: <Card className="ios-card" title="充值套餐 CRUD + 折扣快捷操作" extra={<Button type="primary" onClick={() => openPackageForm()}>新建套餐</Button>}><Table rowKey="id" loading={packages.isLoading} dataSource={packages.data ?? []} columns={packageColumns} scroll={{ x: 1080 }} /></Card>,
            },
          ]}
        />
      </Col>
    </Row>

    <Modal
      title={editingPackage ? '编辑充值套餐' : '新建充值套餐'}
      open={packageModalOpen}
      onCancel={() => setPackageModalOpen(false)}
      onOk={() => packageForm.submit()}
      okButtonProps={{ loading: savePackageMutation.isPending }}
      destroyOnClose
    >
      <Form form={packageForm} layout="vertical" onFinish={(values) => savePackageMutation.mutate(values)}>
        <Form.Item name="name" label="套餐名称" rules={[{ required: true }]}><Input placeholder="¥10 基础包" /></Form.Item>
        <Form.Item name="amountRmb" label="金额 RMB" rules={[{ required: true }]}><InputNumber min={1} precision={2} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="agentTokens" label="Agent Tokens" rules={[{ required: true }]}><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="sortOrder" label="排序"><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="status" label="启用" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>

    <Modal
      title={editingRule ? '编辑计费规则' : '新建计费规则'}
      open={ruleModalOpen}
      onCancel={() => setRuleModalOpen(false)}
      onOk={() => ruleForm.submit()}
      okButtonProps={{ loading: saveRuleMutation.isPending }}
      destroyOnClose
    >
      <Form form={ruleForm} layout="vertical" onFinish={(values) => saveRuleMutation.mutate(values)}>
        <Form.Item name="label" label="显示名称" rules={[{ required: true }]}><Input placeholder="计费倍率" /></Form.Item>
        <Form.Item name="key" label="规则 Key" rules={[{ required: true }]}><Input placeholder="billingMultiplier" disabled={Boolean(editingRule)} /></Form.Item>
        <Form.Item name="group" label="分组" rules={[{ required: true }]}><Select options={ruleGroups.map((value) => ({ value, label: value }))} /></Form.Item>
        <Form.Item name="valueType" label="值类型" rules={[{ required: true }]}><Select options={valueTypes.map((value) => ({ value, label: value }))} /></Form.Item>
        <Form.Item name="value" label="值" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="unit" label="单位"><Input placeholder="Agent Tokens / RMB / % / chars" /></Form.Item>
        <Form.Item name="description" label="说明"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="sortOrder" label="排序"><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="status" label="状态"><Select options={[{ value: 'ACTIVE', label: '启用' }, { value: 'DISABLED', label: '停用' }]} /></Form.Item>
        <Form.Item name="editable" label="允许编辑" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  </div>;
}
