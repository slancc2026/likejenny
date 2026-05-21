'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export function CreditsBadge({ credits }: { credits: number }) {
  return (
    <Link href="/credits" className="flex items-center gap-1.5 bg-brand-bg border border-brand-border rounded-full px-3 py-1.5 hover:border-brand-green transition-colors">
      <Zap className="w-3.5 h-3.5 text-brand-orange" />
      <span className="text-sm font-medium text-brand-text">{credits}</span>
      <span className="text-xs text-brand-muted">积分</span>
    </Link>
  )
}
