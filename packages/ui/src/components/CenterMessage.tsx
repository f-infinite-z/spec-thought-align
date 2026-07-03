import React from 'react';

export function CenterMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center text-slate-300">{children}</div>
    </div>
  );
}
