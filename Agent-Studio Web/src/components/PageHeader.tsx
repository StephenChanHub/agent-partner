import { Space, Typography } from 'antd';
import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <Typography.Title level={2} className="page-title">
          {title}
        </Typography.Title>
        {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
      </div>
      {actions ? <Space>{actions}</Space> : null}
    </div>
  );
}
