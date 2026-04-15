import { cn } from '../lib/cn'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700',
    secondary:
      'bg-white/5 text-white hover:bg-white/10 border border-white/10',
    ghost: 'text-white/80 hover:text-white hover:bg-white/5',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-base',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}

