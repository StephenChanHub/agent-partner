import './InitialAvatar.css';

type InitialAvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

export function InitialAvatar({ name, size = 'md', className = '' }: InitialAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || 'A';

  return (
    <div className={`initial-avatar initial-avatar--${size} ${className}`} aria-label={`${name} avatar`}>
      {initial}
    </div>
  );
}
