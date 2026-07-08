import React from 'react';
import { FileQuestion, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  icon: Icon = FileQuestion,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-64 border rounded-lg border-dashed">
      <Icon className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
