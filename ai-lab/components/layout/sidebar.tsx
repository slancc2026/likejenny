'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Sparkles, ImageIcon, FileText, Layers, Package, Zap,
  FolderOpen, CreditCard, LayoutDashboard, LogOut, MessageSquare, Menu, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { label: '创作工具', type: 'separator' },
  { href: '/chat', label: 'AI 对话', icon: MessageSquare },
  { href: '/enhance', label: '菜品精修', icon: ImageIcon, cost: 4 },
  { href: '/poster', label: '宣传海报', icon: FileText, cost: 5 },
  { href: '/menu', label: '菜单设计', icon: Layers, cost: 8 },
  { href: '/logo', label: '品牌LOGO', icon: Sparkles, cost: 15 },
  { href: '/packaging', label: '包装物料', icon: Package, cost: 20 },
  { href: '/bundle', label: '一键全套', icon: Zap, cost: 40, hot: true },
  { label: '我的', type: 'separator' },
  { href: '/assets', label: '素材库', icon: FolderOpen },
  { href: '/credits', label: '积分充值', icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // 路由切换时关闭侧边栏（手机）
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-brand-border flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text leading-tight">莱珂珍妮</p>
            <p className="text-xs text-brand-muted leading-tight">AI 实验室</p>
          </div>
        </Link>
        {/* 手机端关闭按钮 */}
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-brand-muted hover:text-brand-text">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item, i) => {
          if (item.type === 'separator') {
            return (
              <p key={i} className="text-[10px] text-brand-muted px-2 pt-4 pb-1 tracking-widest uppercase">
                {item.label}
              </p>
            )
          }
          if (!item.href) return null
          const Icon = item.icon!
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all duration-150',
                active ? 'bg-brand-bg text-brand-text font-medium' : 'text-brand-muted hover:bg-brand-bg hover:text-brand-text'
              )}>
              <span className="flex items-center gap-2.5">
                <Icon className={clsx('w-4 h-4', active ? 'text-brand-green-dark' : '')} />
                {item.label}
              </span>
              <span className="flex items-center gap-1">
                {item.hot && <span className="text-[9px] bg-brand-orange text-white px-1.5 py-0.5 rounded-full font-medium">HOT</span>}
                {item.cost && <span className="text-[10px] text-brand-muted">{item.cost}分</span>}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* 退出 */}
      <div className="px-3 py-3 border-t border-brand-border">
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-sm text-brand-muted hover:bg-red-50 hover:text-red-500 transition-colors">
          <LogOut className="w-4 h-4" />退出登录
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* PC端：固定侧边栏 */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white border-r border-brand-border h-screen sticky top-0 flex-col">
        {navContent}
      </aside>

      {/* 手机端：汉堡按钮 */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-9 h-9 bg-white border border-brand-border rounded-xl flex items-center justify-center shadow-sm text-brand-text hover:bg-brand-bg transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* 手机端：遮罩 */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 手机端：抽屉侧边栏 */}
      <aside className={clsx(
        'lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-xl transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {navContent}
      </aside>
    </>
  )
}
