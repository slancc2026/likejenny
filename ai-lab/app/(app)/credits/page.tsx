'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreditLog {
  id: number
  amount: number
  balance: number
  type: string
  description: string
  created_at: string
}

export default function CreditsPage() {
  const [credits, setCredits] = useState(0)
  const [totalUsed, setTotalUsed] = useState(0)
  const [logs, setLogs] = useState<CreditLog[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const userId = data.session.user.id
      const { data: profile } = await supabase.from('profiles').select('credits, total_used').eq('id', userId).single()
      if (profile) { setCredits(profile.credits); setTotalUsed(profile.total_used) }
      const { data: logData } = await supabase.from('credit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30)
      if (logData) setLogs(logData)
    })
  }, [])

  const TYPE_LABEL: Record<string, string> = { register: '注册奖励', daily: '每日奖励', consume: '生成消耗', recharge: '积分充值' }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-brand-text mb-1">积分中心</h1>
        <p className="text-brand-muted text-sm">查看积分余额和消耗记录</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-brand-border p-6">
          <p className="text-xs text-brand-muted mb-2">当前积分</p>
          <p className="text-5xl font-display font-light text-brand-green-dark">{credits}</p>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border p-6">
          <p className="text-xs text-brand-muted mb-2">累计消耗</p>
          <p className="text-5xl font-display font-light text-brand-text">{totalUsed}</p>
        </div>
      </div>
      <div className="bg-gradient-to-r from-brand-green to-emerald-400 rounded-2xl p-6 mb-8 text-white">
        <p className="font-medium mb-1">积分充值</p>
        <p className="text-sm text-white/80 mb-4">充值功能即将开放，敬请期待</p>
        <div className="grid grid-cols-3 gap-3">
          {[{ credits: 50, price: 9.9 }, { credits: 150, price: 25 }, { credits: 500, price: 79 }].map(pkg => (
            <div key={pkg.credits} className="bg-white/20 rounded-xl p-3 text-center opacity-70">
              <p className="text-xl font-medium">{pkg.credits}</p>
              <p className="text-xs text-white/80">积分</p>
              <p className="text-sm mt-1">¥{pkg.price}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/60 mt-3 text-center">请联系管理员手动充值</p>
      </div>
      <h2 className="text-sm font-medium text-brand-muted mb-3 uppercase tracking-wide">积分流水</h2>
      <div className="bg-white rounded-2xl border border-brand-border divide-y divide-brand-border">
        {logs.length === 0 && <div className="py-8 text-center text-sm text-brand-muted">暂无记录</div>}
        {logs.map(log => (
          <div key={log.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm text-brand-text">{log.description || TYPE_LABEL[log.type]}</p>
              <p className="text-xs text-brand-muted">{new Date(log.created_at).toLocaleString('zh-CN')}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${log.amount > 0 ? 'text-brand-green-dark' : 'text-brand-text'}`}>
                {log.amount > 0 ? '+' : ''}{log.amount}
              </p>
              <p className="text-xs text-brand-muted">余额 {log.balance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
