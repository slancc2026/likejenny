import Link from 'next/link'
import { ImageIcon, FileText, Layers, Sparkles, Package, Zap } from 'lucide-react'

const TOOLS = [
  { href: '/enhance', label: '菜品精修', desc: '一键提升菜品照片质感', icon: ImageIcon, cost: 4, color: 'bg-emerald-50 text-emerald-600' },
  { href: '/poster', label: '宣传海报', desc: '日常/节日/新品海报生成', icon: FileText, cost: 5, color: 'bg-blue-50 text-blue-600' },
  { href: '/menu', label: '菜单设计', desc: '印刷级A4菜单一键生成', icon: Layers, cost: 8, color: 'bg-violet-50 text-violet-600' },
  { href: '/logo', label: '品牌LOGO', desc: '3套方案任君选择', icon: Sparkles, cost: 15, color: 'bg-amber-50 text-amber-600' },
  { href: '/packaging', label: '包装物料', desc: '品牌触点系统一键生成', icon: Package, cost: 20, color: 'bg-pink-50 text-pink-600' },
  { href: '/bundle', label: '一键全套', desc: '全部功能8折打包', icon: Zap, cost: 40, color: 'bg-orange-50 text-orange-600' },
]

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-brand-text mb-1">工作台</h1>
        <p className="text-brand-muted text-sm">选择工具，开始创作</p>
      </div>
      <h2 className="text-sm font-medium text-brand-muted mb-4 tracking-wide uppercase">创作工具</h2>
      <div className="grid grid-cols-3 gap-4">
        {TOOLS.map(tool => {
          const Icon = tool.icon
          return (
            <Link key={tool.href} href={tool.href}
              className="group bg-white rounded-2xl border border-brand-border p-5 hover:border-brand-green hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-brand-muted">{tool.cost}分</span>
              </div>
              <p className="font-medium text-brand-text text-sm mb-1">{tool.label}</p>
              <p className="text-xs text-brand-muted">{tool.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
