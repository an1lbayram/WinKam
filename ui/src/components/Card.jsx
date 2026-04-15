import { cn } from '../lib/cn'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.65)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-5 pb-3', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return (
    <div className={cn('text-base font-semibold text-white', className)} {...props} />
  )
}

export function CardDescription({ className, ...props }) {
  return (
    <div
      className={cn('mt-1 text-sm text-white/60', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}

