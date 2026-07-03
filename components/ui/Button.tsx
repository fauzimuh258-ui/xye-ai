'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:bg-emerald-800',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:bg-zinc-900',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800',
  danger: 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-900',
};

export function Button({ variant = 'primary', type = 'button', className, children, disabled, ...props }: ButtonProps) {
  return (
    <button type={type} disabled={disabled} className={cn('inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60', VARIANT_CLASSES[variant], className)} {...props}>
      {children}
    </button>
  );
}
