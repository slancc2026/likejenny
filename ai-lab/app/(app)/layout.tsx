import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { CreditsBadge } from '@/components/ui/credits-badge'
import { claimDailyCredit } from '@/lib/credits'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, last_daily_credit')
    .eq('id', user.id)
    .single()

  // 尝试发放每日积分（静默，不影响渲染）
  if (profile) {
    const today = new Date().toISOString().split('T')[0]
    if (profile.last_daily_credit !== today) {
      claimDailyCredit(user.id).catch(() => {})
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-14 border-b border-brand-border bg-white px-6 flex items-center justify-between flex-shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <CreditsBadge credits={profile?.credits ?? 0} />
            <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-sm font-medium">
              {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
