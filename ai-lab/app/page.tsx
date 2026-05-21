import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 rounded-2xl bg-brand-green mx-auto mb-6 flex items-center justify-center text-white text-2xl">✨</div>
        <h1 className="font-display text-3xl font-light text-brand-text mb-2">莱珂珍妮 AI 实验室</h1>
        <p className="text-brand-muted mb-8 text-sm leading-relaxed">用 AI 重新定义餐饮品牌视觉<br />菜品精修 · 宣传海报 · 菜单设计 · 品牌LOGO</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-brand-orange text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-orange-500 transition-colors"
        >
          进入工作台 →
        </Link>
        <p className="mt-6 text-xs text-brand-muted">
          © 2025 河南盛塬宏品牌管理有限责任公司
        </p>
      </div>
    </main>
  )
}
