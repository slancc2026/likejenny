import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-brand-black text-brand-white flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="font-display text-7xl tracking-wide mb-2">莱珂珍妮</div>
        <div className="inline-block bg-brand-green border-[2px] border-brand-green text-brand-black text-[10px] font-black px-3 py-1 tracking-[0.3em] mb-8">AI VISUAL LAB</div>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">用 AI 重新定义餐饮品牌视觉<br />菜品精修 · 宣传海报 · 菜单设计 · 品牌LOGO</p>
        <Link href="/login"
          className="inline-flex items-center gap-2 bg-brand-green text-brand-black px-8 py-4 font-bold text-sm tracking-wider border-[2px] border-brand-green hover:bg-brand-yellow transition-colors">
          进入工作台 →
        </Link>
        <p className="mt-8 text-[10px] text-gray-600 tracking-wider">© 2026 河南盛塬宏品牌管理有限责任公司</p>
      </div>
    </main>
  )
}
