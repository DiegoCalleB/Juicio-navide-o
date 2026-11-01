import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-3xl border border-court-line bg-court-card p-5 ${className}`} {...rest} />;
}
