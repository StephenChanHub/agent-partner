import { Avatar } from 'antd';

export function getInitial(value?: string) {
  const trimmed = (value ?? 'J').trim();
  return (trimmed[0] ?? 'J').toUpperCase();
}

export function AvatarInitial({
  name,
  size = 44,
  className,
  large = false,
}: {
  name?: string;
  size?: number;
  className?: string;
  large?: boolean;
}) {
  return (
    <Avatar
      size={size}
      className={['avatar-initial', large ? 'avatar-initial-large' : '', className ?? ''].filter(Boolean).join(' ')}
    >
      {getInitial(name)}
    </Avatar>
  );
}
