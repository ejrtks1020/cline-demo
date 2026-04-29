import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900', className)} {...props} />;
}
