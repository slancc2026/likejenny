import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ImageIcon, FileText, Layers, Sparkles, Package, Zap, FolderOpen } from 'lucide-react'
import { CREDITS_COST } from '@/types'

const TOOLS = [
  { href: '/enhance', label: '菜品精修', desc: '一键提升菜品照片质感', icon: ImageIcon, cost: CREDITS_COST.enhance, color: 'bg-emerald-50 text-emerald-600' },
  { href: '/poster', label: '宣传海报', desc: '日常/节日/新品海报生成', icon: FileText, cost: CREDITS_COST.poster, color: 'bg-blue-50 text-blue-600' },
  { href: '/menu', label: '菜单设计', desc: '印刷级A4菜单一键生成', icon: Layers, cost: CREDITS_COST.menu, color: 'bg-violet-50 text-violet-600' },
  { href: '/logo', label: '品牌LOGO', desc: '3套方案任君选择', icon: Sparkles, cost: CREDITS_COST.logo, color: 'bg-amber-50 text-amber-600' },
  { href: '/packaging', label: '包装物料', desc: '品牌触点系统一键生成', icon: Package, cost: CREDITS_COST.packaging, color: 'bg-pink-50 text-pink-600' },
  { href: '/bundle', label: '一键全套', desc: '全部功能8折打包', icon: Zap, cost: CREDITS_COST.bundle, color: 'bg-orange-50 text-orange-600', hot: true },
]

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('credits, total_used').eq('id', user!.id).single()
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('id, task_type, status, created_at, output_urls')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="p-8 max-w-5xl">
      {/* 欢迎区 */}
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-brand-text mb-1">工作台</h1>
        <p className="text-brand-muted text-sm">选择工具，开始创作</p>
      </div>

      {/* 积分卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-brand-border p-5">
          <p className="text-xs text-brand-muted mb-1">当前积分</p>
          <p className="text-3xl font-display font-light text-brand-green-dark">{profile?.credits ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border p-5">
          <p className="text-xs text-brand-muted mb-1">累计消耗</p>
          <p className="text-3xl font-display font-light text-brand-text">{profile?.total_used ?? 0}</p>
        </div>
        <Link href="/assets" className="bg-white rounded-2xl border border-brand-border p-5 hover:border-brand-green transition-colors">
          <p className="text-xs text-brand-muted mb-1">我的素材</p>
          <div className="flex items-center gap-1 mt-1">
            <FolderOpen className="w-5 h-5 text-brand-green-dark" />
            <span className="text-sm text-brand-green-dark font-medium">查看全部 →</span>
          </div>
        </Link>
      </div>

      {/* 工具入口 */}
      <h2 className="text-sm font-medium text-brand-muted mb-4 tracking-wide uppercase">创作工具</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {TOOLS.map(tool => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-white rounded-2xl border border-brand-border p-5 hover:border-brand-green hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  {tool.hot && <span className="text-[9px] bg-brand-orange text-white px-1.5 py-0.5 rounded-full">HOT</span>}
                  <span className="text-xs text-brand-muted">{tool.cost}分</span>
                </div>
              </div>
              <p className="font-medium text-brand-text text-sm mb-1">{tool.label}</p>
              <p className="text-xs text-brand-muted">{tool.desc}</p>
            </Link>
          )
        })}
      </div>

      {/* 最近生成 */}
      {recentTasks && recentTasks.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-brand-muted mb-4 tracking-wide uppercase">最近生成</h2>
          <div className="grid grid-cols-3 gap-3">
            {recentTasks.map(task => (
              <div key={task.id} className="bg-white rounded-xl border border-brand-border overflow-hidden">
                {task.output_urls?.[0] ? (
                  <img src={task.output_urls[0]} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-brand-bg flex items-center justify-center text-brand-muted text-xs">
                    {task.status === 'processing' ? '生成中…' : task.status === 'failed' ? '生成失败' : '无预览'}
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-medium text-brand-text">{task.task_type}</p>
                  <p className="text-[10px] text-brand-muted">{new Date(task.created_at).toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
