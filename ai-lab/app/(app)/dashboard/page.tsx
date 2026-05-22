'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TOOLS = [
  { href: '/enhance', label: '菜品精修', emoji: '🥗', cost: 4, unit: '积分/张', desc: '上传原图，AI自动优化光线、色彩与质感', time: '~60s' },
  { href: '/poster', label: '宣传海报', emoji: '🎨', cost: 5, unit: '积分/张', desc: '日常/节日/新品三种场景，适配各平台尺寸', time: '~75s' },
  { href: '/menu', label: '菜单设计', emoji: '📋', cost: 8, unit: '积分', desc: '填入菜品列表，生成印刷级A4竖版菜单', time: '~90s' },
  { href: '/logo', label: '品牌 LOGO', emoji: '✦', cost: 15, unit: '积分', desc: '一次生成3套不同风格方案，高清矢量感输出', time: '~3min' },
  { href: '/packaging', label: '包装物料', emoji: '📦', cost: 20, unit: '积分', desc: '手提袋、纸杯、餐盒等品牌触点系统一键生成', time: '~120s' },
  { href: '/bundle', label: '一键全套', emoji: '⚡', cost: 40, unit: '积分', desc: '串行执行所有功能，一次性生成完整品牌物料', time: '~8min', featured: true },
]

interface RecentTask { id: string; task_type: string; output_urls: string[]; created_at: string }

export default function DashboardPage() {
  const [tasks, setTasks] = useState<RecentTask[]>([])
  const [stats, setStats] = useState({ totalUsed: 0, totalTasks: 0 })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const userId = data.session.user.id
      const { data: profile } = await supabase.from('profiles').select('total_used').eq('id', userId).single()
      const { data: taskData, count } = await supabase.from('tasks').select('id, task_type, output_urls, created_at', { count: 'exact' })
        .eq('user_id', userId).eq('status', 'done').not('output_urls', 'is', null)
        .order('created_at', { ascending: false }).limit(4)
      setStats({ totalUsed: profile?.total_used ?? 0, totalTasks: count ?? 0 })
      setTasks(taskData || [])
    })
  }, [])

  const TASK_LABELS: Record<string, string> = { enhance: '菜品精修', poster: '宣传海报', menu: '菜单设计', logo: '品牌LOGO', packaging: '包装物料', bundle: '一键全套' }

  return (
    <div className="p-7">
      {/* Hero */}
      <div className="border-[2px] border-brand-black p-7 mb-6 flex items-center justify-between bg-brand-black text-brand-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-8 opacity-5 pointer-events-none select-none">
          <span className="font-display text-[160px] leading-none">AI</span>
        </div>
        <div className="relative">
          <div className="text-[10px] font-bold tracking-[0.3em] text-brand-green uppercase mb-2">LIKEJENNY · AI VISUAL LAB</div>
          <h1 className="font-display text-5xl leading-none tracking-wide mb-3">
            用 AI 重新定义<br /><span className="text-brand-green">品牌视觉</span>
          </h1>
          <p className="text-xs text-gray-400">菜品精修 · 海报生成 · 菜单设计 · LOGO · 包装物料</p>
        </div>
        <div className="flex gap-8 relative flex-shrink-0">
          {[
            { num: stats.totalTasks, label: '累计生成' },
            { num: stats.totalUsed, label: '消耗积分' },
            { num: 6, label: '功能模块' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-5xl leading-none text-white">{s.num}</div>
              <div className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 工具网格 */}
      <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-3 flex items-center gap-3">
        创作工具 · TOOLS
        <div className="flex-1 h-[1.5px] bg-brand-gray-2" />
      </div>
      <div className="border-[2px] border-brand-black mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {TOOLS.map((tool, i) => (
          <Link key={tool.href} href={tool.href}
            className={`p-5 border-r-[2px] border-b-[2px] border-brand-black hover:bg-brand-gray transition-colors group relative
              ${i % 3 === 2 ? 'border-r-0' : ''}
              ${i >= 3 ? 'border-b-0' : ''}
              ${tool.featured ? 'bg-brand-yellow hover:bg-yellow-300' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 border-[2px] border-brand-black flex items-center justify-center text-xl transition-colors ${tool.featured ? 'bg-brand-black text-brand-yellow' : 'bg-brand-white group-hover:bg-brand-black group-hover:text-brand-white'}`}>
                {tool.emoji}
              </div>
              <div className="text-right">
                {tool.featured && <div className="bg-brand-red text-white text-[8px] font-black px-1.5 py-0.5 tracking-wider mb-1">8折优惠</div>}
                <div className="font-display text-3xl leading-none">{tool.cost}</div>
                <div className="text-[9px] text-gray-400 font-bold tracking-wider">{tool.unit}</div>
              </div>
            </div>
            <div className="font-black text-base mb-1.5">{tool.label}</div>
            <div className="text-xs text-gray-500 leading-relaxed mb-4">{tool.desc}</div>
            <div className="flex items-center justify-between border-t-[1.5px] border-brand-black pt-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                开始创作
                <span className={`w-5 h-5 flex items-center justify-center text-xs transition-colors ${tool.featured ? 'bg-brand-black text-brand-yellow' : 'bg-brand-black text-brand-white group-hover:bg-brand-green group-hover:text-brand-black'}`}>→</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">{tool.time}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Tips */}
      <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-3 flex items-center gap-3">
        使用须知 · TIPS <div className="flex-1 h-[1.5px] bg-brand-gray-2" />
      </div>
      <div className="border-[2px] border-brand-black mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { icon: '⏱', title: '生成需要等待', desc: 'AI图片生成约需60-120秒，请耐心等待，不要关闭页面' },
          { icon: '💾', title: '结果自动保存', desc: '所有生成结果自动存入「素材库」，随时可以下载' },
          { icon: '🔄', title: '失败自动退款', desc: '若生成失败，积分将自动退还至账户，无需手动申请' },
        ].map((tip, i) => (
          <div key={i} className={`p-4 flex gap-3 ${i < 2 ? 'border-r-[2px] border-brand-black' : ''}`}>
            <span className="text-xl flex-shrink-0 mt-0.5">{tip.icon}</span>
            <div>
              <div className="font-bold text-sm mb-1">{tip.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{tip.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 最近生成 */}
      {tasks.length > 0 && (
        <>
          <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-3 flex items-center gap-3">
            最近生成 · RECENT <div className="flex-1 h-[1.5px] bg-brand-gray-2" />
          </div>
          <div className="border-[2px] border-brand-black flex overflow-x-auto">
            {tasks.map(task => (
              <div key={task.id} className="flex-shrink-0 w-44 border-r-[2px] border-brand-black last:border-r-0">
                {task.output_urls?.[0] ? (
                  <img src={task.output_urls[0]} alt="" className="w-full aspect-square object-cover border-b-[2px] border-brand-black" />
                ) : (
                  <div className="w-full aspect-square bg-brand-gray border-b-[2px] border-brand-black flex items-center justify-center text-3xl">📷</div>
                )}
                <div className="p-3">
                  <div className="font-bold text-xs">{TASK_LABELS[task.task_type] || task.task_type}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(task.created_at).toLocaleDateString('zh-CN')}</div>
                </div>
              </div>
            ))}
            <Link href="/assets" className="flex-shrink-0 flex-1 min-w-32 flex items-center justify-center text-xs font-bold text-gray-400 hover:bg-brand-gray transition-colors p-6 border-r-0">
              查看全部 →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
