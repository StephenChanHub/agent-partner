import { App, Form, Input, InputNumber, Modal } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studioApi } from '../../api/studio';
import type { StudioUser } from '../../types/api';
import { fmtTokens } from '../../utils/format';

export function TokenAdjustModal({ user, open, onClose }: { user: StudioUser | null; open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: { amountAgentTokens: number; reason: string }) =>
      studioApi.adjustTokens(user!.id, values.amountAgentTokens, values.reason),
    onSuccess: async (res) => {
      message.success(`充值成功：余额 ${fmtTokens(res.balanceAfter)}`);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['token-transactions'] });
      form.resetFields();
      onClose();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败'),
  });

  return (
    <Modal
      title="增加 Agent Tokens"
      open={open}
      okText="确认充值"
      cancelText="取消"
      confirmLoading={mutation.isPending}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <div className="modal-user-summary">
        <strong>{user?.email}</strong>
        <span>当前余额：{fmtTokens(user?.balanceTokens)}</span>
      </div>
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="amountAgentTokens"
          label="增加数量"
          rules={[{ required: true, message: '请输入增加数量' }]}
        >
          <InputNumber min={1} max={100000} step={1000} addonAfter="Agent Tokens" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="reason"
          label="备注原因"
          rules={[{ required: true, message: '备注原因必填，方便后续审计' }]}
        >
          <Input.TextArea rows={3} placeholder="例如：线下收款充值" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
