import { Button, Input, Segmented, Space } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

type DataToolbarProps = {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  statusOptions?: Array<{ label: string; value: string }>;
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  onRefresh?: () => void;
  actions?: ReactNode;
};

export function DataToolbar({
  searchPlaceholder = '搜索',
  onSearch,
  statusOptions,
  statusValue,
  onStatusChange,
  onRefresh,
  actions,
}: DataToolbarProps) {
  return (
    <div className="data-toolbar">
      <Space wrap>
        {onSearch ? (
          <Input.Search
            allowClear
            className="toolbar-search"
            prefix={<SearchOutlined />}
            placeholder={searchPlaceholder}
            onSearch={onSearch}
          />
        ) : null}
        {statusOptions?.length ? (
          <Segmented
            value={statusValue}
            options={statusOptions}
            onChange={(value) => onStatusChange?.(String(value))}
          />
        ) : null}
      </Space>
      <Space wrap>
        {actions}
        {onRefresh ? <Button icon={<ReloadOutlined />} onClick={onRefresh}>刷新</Button> : null}
      </Space>
    </div>
  );
}
