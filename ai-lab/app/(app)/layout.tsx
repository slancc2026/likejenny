'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [credits, setCredits] = useState<number | null>(null)
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/login')
        return
      }
      const user = data.session.user
      setEmail(user.email ?? '')
      const { data: profile } = await supabase
        .from('profiles').select('credits').eq('id', user.id).single()
  // 尝试发放每日签到积分（静默）
    if (profile) {
      const today = new Date().toISOString().split('T')[0]
      if (profile.last_daily_credit !== today) {
        // 每日签到 +1 积分
        const newCredits = (profile.credits ?? 0) + 1
        supabase.from('profiles').update({ credits: newCredits, last_daily_credit: today }).eq('id', userId).then(() => {
          supabase.from('credit_logs').insert({
            user_id: userId, amount: 1, balance: newCredits,
            type: 'daily', description: '每日签到奖励'
          }).then(() => {})
        })
        setCredits(newCredits)
      } else {
        setCredits(profile?.credits ?? 0)
      }
    }
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-brand-bg">
      <div className="text-brand-muted text-sm">加载中…</div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-brand-border bg-white px-6 flex items-center justify-between flex-shrink-0">
          <div className="lg:hidden w-9" />{/* 手机端占位，给汉堡按钮留空间 */}
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <Link href="/credits" className="flex items-center gap-1.5 bg-brand-bg border border-brand-border rounded-full px-3 py-1.5 hover:border-brand-green transition-colors">
              <Zap className="w-3.5 h-3.5 text-brand-orange" />
              <span className="text-sm font-medium text-brand-text">{credits ?? 0}</span>
              <span className="text-xs text-brand-muted">积分</span>
            </Link>
            <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-sm font-medium">
              {email?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
