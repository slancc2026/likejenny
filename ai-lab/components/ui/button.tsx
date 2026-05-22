'use client'
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-bold tracking-wide transition-all duration-100 border-[2px] border-brand-black disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-px',
          {
            'bg-brand-black text-brand-white hover:bg-brand-green hover:text-brand-black': variant === 'primary',
            'bg-brand-white text-brand-black hover:bg-brand-gray': variant === 'secondary',
            'bg-transparent text-brand-black hover:bg-brand-gray border-transparent': variant === 'ghost',
            'bg-brand-red text-white border-brand-red hover:bg-red-700': variant === 'danger',
            'bg-brand-yellow text-brand-black hover:bg-yellow-400': variant === 'yellow',
          },
          {
            'text-xs px-3 py-1.5': size === 'sm',
            'text-sm px-5 py-2.5': size === 'md',
            'text-sm px-8 py-3.5': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
