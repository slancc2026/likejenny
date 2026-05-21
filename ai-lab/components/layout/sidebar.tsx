'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Sparkles, ImageIcon, FileText, Layers, Package, Zap,
  FolderOpen, CreditCard, LayoutDashboard, LogOut, MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { label: '─── 创作工具', type: 'separator' },
  { href: '/chat', label: 'AI 对话', icon: MessageSquare },
  { href: '/enhance', label: '菜品精修', icon: ImageIcon, cost: 4 },
  { href: '/poster', label: '宣传海报', icon: FileText, cost: 5 },
  { href: '/menu', label: '菜单设计', icon: Layers, cost: 8 },
  { href: '/logo', label: '品牌LOGO', icon: Sparkles, cost: 15 },
  { href: '/packaging', label: '包装物料', icon: Package, cost: 20 },
  { href: '/bundle', label: '一键全套', icon: Zap, cost: 40, hot: true },
  { label: '─── 我的', type: 'separator' },
  { href: '/assets', label: '素材库', icon: FolderOpen },
  { href: '/credits', label: '积分充值', icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-brand-border h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-brand-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text leading-tight">莱珂珍妮</p>
            <p className="text-xs text-brand-muted leading-tight">AI 实验室</p>
          </div>
        </Link>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item, i) => {
          if (item.type === 'separator') {
            return (
              <p key={i} className="text-[10px] text-brand-muted px-2 pt-4 pb-1 tracking-widest uppercase">
                {item.label?.replace('─── ', '')}
              </p>
            )
          }
          if (!item.href) return null
          const Icon = item.icon!
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl mb-0.5 text-sm transition-all duration-150',
                active
                  ? 'bg-brand-bg text-brand-text font-medium'
                  : 'text-brand-muted hover:bg-brand-bg hover:text-brand-text'
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={clsx('w-4 h-4', active ? 'text-brand-green-dark' : '')} />
                {item.label}
              </span>
              <span className="flex items-center gap-1">
                {item.hot && (
                  <span className="text-[9px] bg-brand-orange text-white px-1.5 py-0.5 rounded-full font-medium">HOT</span>
                )}
                {item.cost && (
                  <span className="text-[10px] text-brand-muted">{item.cost}分</span>
                )}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* 退出 */}
      <div className="px-3 py-3 border-t border-brand-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-sm text-brand-muted hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </aside>
  )
}
