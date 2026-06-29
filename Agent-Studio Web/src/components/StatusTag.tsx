import { Tag } from 'antd';

const colorMap: Record<string, string> = {
  ACTIVE: 'green',
  PUBLISHED: 'blue',
  DRAFT: 'gold',
  DISABLED: 'default',
  PAID: 'green',
  PENDING: 'gold',
  EXPIRED: 'default',
  CREDIT: 'green',
  DEBIT: 'red',
  VOICE: 'purple',
  TEXT: 'blue',
  ADMIN: 'blue',
  USER: 'default',
};

export function StatusTag({ value }: { value?: string | null }) {
  const text = value || '-';
  return <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
}
