import React from 'react';
import { cn } from '@/lib/utils';

export function SectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        'text-xs font-semibold uppercase tracking-wider mb-3 text-slate-400',
        className,
      )}
    >
      {children}
    </h2>
  );
}
