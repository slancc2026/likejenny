'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { BrandSetupModal } from '@/components/brand-setup-modal'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [credits, setCredits] = useState(0)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkedIn, setCheckedIn] = useState(false)
  const [showBrandSetup, setShowBrandSetup] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const user = data.session.user
      setEmail(user.email ?? '')
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, last_daily_credit')
        .eq('id', user.id)
        .single()

      // 检测是否有品牌档案
      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!brand) setShowBrandSetup(true)

      if (profile) {
        const today = new Date().toISOString().split('T')[0]
        if (profile.last_daily_credit !== today) {
          const newCredits = (profile.credits ?? 0) + 1
          await supabase.from('profiles')
            .update({ credits: newCredits, last_daily_credit: today })
            .eq('id', user.id)
          await supabase.from('credit_logs').insert({
            user_id: user.id, amount: 1, balance: newCredits,
            type: 'daily', description: '每日签到奖励'
          })
          setCredits(newCredits)
          setCheckedIn(true)
        } else {
          setCredits(profile.credits ?? 0)
          setCheckedIn(true)
        }
      }
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-brand-white">
      <div className="border-[2px] border-brand-black px-8 py-4 font-display text-2xl tracking-widest animate-pulse">
        LOADING...
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-brand-white">
      {showBrandSetup && (
        <BrandSetupModal
          userId={userId}
          onComplete={() => setShowBrandSetup(false)}
        />
      )}
      <Sidebar credits={credits} email={email} checkedIn={checkedIn} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-12 border-b-[2px] border-brand-black bg-brand-white px-4 md:px-6 flex items-center justify-between flex-shrink-0">
          <div className="lg:hidden w-10" />
          <div className="hidden lg:flex items-center gap-2 font-mono text-xs text-gray-400 tracking-wider">
            <span>AI-LAB</span>
            <span>/</span>
            <span className="text-brand-black font-bold">WORKSPACE</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 border-[2px] border-brand-black px-2 md:px-3 py-1">
              <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
              <span className="text-[10px] font-bold tracking-wider hidden sm:block">系统正常</span>
              <span className="text-[10px] font-bold sm:hidden">●</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-brand-white">
          {children}
        </main>
        {/* 状态栏 */}
        <div className="h-7 border-t-[2px] border-brand-black bg-brand-black text-brand-white flex items-center px-5 gap-5 text-[9px] font-bold tracking-widest flex-shrink-0">
          <span className="text-brand-green">● API ONLINE</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-400">GPT IMAGE 2</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-400">ai.shengyuanhong.cn</span>
          <span className="ml-auto text-gray-500" id="status-clock"></span>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        function tick() {
          const el = document.getElementById('status-clock')
          if(el) el.textContent = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
        }
        tick(); setInterval(tick, 1000)
      `}} />
    </div>
  )
}
