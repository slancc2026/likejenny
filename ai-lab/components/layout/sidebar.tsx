'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: '工作台', emoji: '⬡' },
  { type: 'sep', label: '创作工具' },
  { href: '/chat', label: 'AI 对话', emoji: '💬' },
  { href: '/enhance', label: '菜品精修', emoji: '🥗', cost: '4分' },
  { href: '/poster', label: '宣传海报', emoji: '🎨', cost: '5分' },
  { href: '/menu', label: '菜单设计', emoji: '📋', cost: '8分' },
  { href: '/logo', label: '品牌 LOGO', emoji: '✦', cost: '15分' },
  { href: '/packaging', label: '包装物料', emoji: '📦', cost: '20分' },
  { href: '/bundle', label: '一键全套', emoji: '⚡', hot: true },
  { type: 'sep', label: '我的' },
  { href: '/brand', label: '品牌档案', emoji: '🏷️' },
  { href: '/assets', label: '素材库', emoji: '🗂' },
  { href: '/credits', label: '积分充值', emoji: '💳' },
]

interface SidebarContentProps {
  credits: number
  email: string
  onClose?: () => void
  onLogout: () => void
  pathname: string
  checkedIn: boolean
}

function SidebarContent({ credits, email, onClose, onLogout, pathname, checkedIn }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-brand-white">
      {/* Logo */}
      <div className="px-5 py-5 border-b-[2px] border-brand-black flex items-center justify-between">
        <Link href="/dashboard" onClick={onClose}>
          <div className="font-display text-2xl tracking-wide leading-tight">莱珂珍妮</div>
          <div className="inline-block bg-brand-green border-[2px] border-brand-black text-[9px] font-bold px-2 py-0.5 tracking-widest mt-1">AI LAB · BETA</div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="border-[2px] border-brand-black p-1.5 hover:bg-brand-gray transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto">
        {NAV.map((item, i) => {
          if (item.type === 'sep') {
            return (
              <div key={i} className="px-5 pt-4 pb-1 text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase border-b border-brand-gray">
                {item.label}
              </div>
            )
          }
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href!} onClick={onClose}
              className={clsx(
                'flex items-center justify-between px-5 py-2.5 border-l-4 transition-all text-sm font-medium',
                active
                  ? 'bg-brand-black text-brand-white border-brand-green'
                  : 'border-transparent hover:bg-brand-gray hover:border-brand-black'
              )}>
              <span className="flex items-center gap-2.5">
                <span>{item.emoji}</span>
                {item.label}
              </span>
              {item.hot && <span className="bg-brand-red text-white text-[8px] font-black px-1.5 py-0.5 tracking-wider">HOT</span>}
              {item.cost && <span className={clsx('text-[10px] font-mono', active ? 'text-brand-gray-2' : 'text-gray-400')}>{item.cost}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t-[2px] border-brand-black">
        {/* 签到 */}
        <div className={clsx('px-5 py-2.5 text-xs font-bold flex items-center justify-between border-b-[2px] border-brand-black',
          checkedIn ? 'bg-brand-green' : 'bg-brand-yellow')}>
          <span>{checkedIn ? '⚡ 今日签到已领取 +1' : '⚡ 点击领取今日签到积分'}</span>
          <span>{checkedIn ? '✓ 已领' : '+1分'}</span>
        </div>

        {/* 积分 */}
        <div className="px-5 py-3 flex items-center justify-between border-b-[2px] border-brand-black">
          <div>
            <div className="font-display text-4xl leading-none">{credits}</div>
            <div className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">当前积分</div>
          </div>
          <Link href="/credits" onClick={onClose}
            className="bg-brand-green border-[2px] border-brand-black px-4 py-2 text-xs font-bold hover:bg-yellow-300 transition-colors">
            去充值 →
          </Link>
        </div>

        {/* 用户 */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-black text-brand-white flex items-center justify-center text-sm font-bold border-[2px] border-brand-black">
              {email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="text-xs text-gray-500 truncate max-w-[110px]">{email}</span>
          </div>
          <button onClick={onLogout}
            className="text-[10px] font-bold text-gray-400 border-[1.5px] border-gray-300 px-2 py-1 hover:bg-brand-red hover:text-white hover:border-brand-red transition-all">
            退出
          </button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ credits, email, checkedIn }: { credits: number; email: string; checkedIn: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* PC */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 border-r-[2px] border-brand-black h-screen sticky top-0 flex-col">
        <SidebarContent credits={credits} email={email} onLogout={handleLogout} pathname={pathname} checkedIn={checkedIn} />
      </aside>

      {/* 手机汉堡按钮 */}
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 bg-brand-white border-[2px] border-brand-black flex items-center justify-center hover:bg-brand-gray transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      {/* 手机遮罩 */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      {/* 手机抽屉 */}
      <aside className={clsx(
        'lg:hidden fixed top-0 left-0 h-full w-64 z-50 border-r-[2px] border-brand-black shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent credits={credits} email={email} onClose={() => setOpen(false)} onLogout={handleLogout} pathname={pathname} checkedIn={checkedIn} />
      </aside>
    </>
  )
}
