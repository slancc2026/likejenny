'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Log { id: number; amount: number; balance: number; type: string; description: string; created_at: string }

export default function CreditsPage() {
  const [credits, setCredits] = useState(0)
  const [totalUsed, setTotalUsed] = useState(0)
  const [logs, setLogs] = useState<Log[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const userId = data.session.user.id
      const { data: p } = await supabase.from('profiles').select('credits,total_used').eq('id', userId).single()
      if (p) { setCredits(p.credits); setTotalUsed(p.total_used) }
      const { data: l } = await supabase.from('credit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30)
      if (l) setLogs(l)
    })
  }, [])

  const TYPE_LABEL: Record<string, string> = { register: '注册奖励', daily: '每日签到', consume: '生成消耗', recharge: '积分充值' }

  return (
    <div className="p-7 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide mb-1">积分中心</h1>
        <p className="text-gray-400 text-sm">查看积分余额和消耗记录</p>
      </div>
      {/* 余额 */}
      <div className="grid grid-cols-2 gap-0 border-[2px] border-brand-black mb-6">
        <div className="p-6 border-r-[2px] border-brand-black">
          <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-2">当前积分</div>
          <div className="font-display text-6xl text-brand-green">{credits}</div>
        </div>
        <div className="p-6">
          <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-2">累计消耗</div>
          <div className="font-display text-6xl">{totalUsed}</div>
        </div>
      </div>
      {/* 充值 */}
      <div className="border-[2px] border-brand-black mb-6 bg-brand-black text-brand-white p-6">
        <div className="font-bold mb-1">积分充值</div>
        <p className="text-xs text-gray-400 mb-5">充值功能即将开放，敬请期待</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[{ c: 50, p: 9.9 }, { c: 150, p: 25 }, { c: 500, p: 79 }].map(pkg => (
            <div key={pkg.c} className="border-[2px] border-gray-600 p-3 text-center opacity-50">
              <div className="font-display text-3xl text-brand-green">{pkg.c}</div>
              <div className="text-xs text-gray-400 mb-1">积分</div>
              <div className="font-bold text-sm">¥{pkg.p}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 text-center">请联系管理员手动充值</p>
      </div>
      {/* 流水 */}
      <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-3 flex items-center gap-3">
        积分流水 · HISTORY <div className="flex-1 h-[1.5px] bg-brand-gray-2" />
      </div>
      <div className="border-[2px] border-brand-black divide-y-[2px] divide-brand-black">
        {logs.length === 0 && <div className="py-8 text-center text-sm text-gray-400">暂无记录</div>}
        {logs.map(log => (
          <div key={log.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium">{log.description || TYPE_LABEL[log.type]}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{new Date(log.created_at).toLocaleString('zh-CN')}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold text-sm ${log.amount > 0 ? 'text-brand-green' : ''}`}>{log.amount > 0 ? '+' : ''}{log.amount}</p>
              <p className="text-xs text-gray-400">余额 {log.balance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
