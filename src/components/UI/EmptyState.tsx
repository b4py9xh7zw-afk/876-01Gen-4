import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'gold' | 'secondary';
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 mb-6">
        {icon || <Inbox className="h-10 w-10 text-brand-300" />}
      </div>
      <h3 className="font-serif text-lg font-semibold text-brand-700 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-brand-400 max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button variant={action.variant || 'gold'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
