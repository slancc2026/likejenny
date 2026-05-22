import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('bg-brand-white border-[2px] border-brand-black', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('px-6 py-4 border-b-[2px] border-brand-black font-bold text-sm tracking-wide uppercase', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('p-6', className)} {...props}>{children}</div>
}
