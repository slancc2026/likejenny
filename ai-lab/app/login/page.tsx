'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const REGISTRATION_OPEN = process.env.NEXT_PUBLIC_REGISTRATION_OPEN === 'true'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('注册成功！请查收验证邮件')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '操作失败'
      toast.error(msg === 'Invalid login credentials' ? '邮箱或密码错误' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-green-dark p-12 text-white">
        <div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl mb-8">✨</div>
          <h1 className="font-display text-4xl font-light mb-4 leading-snug">莱珂珍妮<br />AI 实验室</h1>
          <p className="text-white/70 text-sm leading-relaxed">
            用 AI 重新定义餐饮品牌视觉<br />
            60 秒生成专业级菜品海报
          </p>
        </div>
        <div className="space-y-3">
          {['菜品精修 · 4积分/张', '宣传海报 · 5积分/张', '菜单设计 · 8积分', '品牌LOGO · 15积分'].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-medium text-brand-text mb-1">
            {isSignUp ? '创建账号' : '欢迎回来'}
          </h2>
          <p className="text-brand-muted text-sm mb-8">
            {isSignUp ? '注册后即可使用 AI 创作工具' : '登录您的 AI 实验室账号'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text text-sm outline-none focus:border-brand-green transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text text-sm outline-none focus:border-brand-green transition-colors"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {isSignUp ? '注册' : '登录'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {isSignUp ? (
              <p className="text-sm text-brand-muted">
                已有账号？{' '}
                <button onClick={() => setIsSignUp(false)} className="text-brand-green-dark font-medium hover:underline">
                  去登录
                </button>
              </p>
            ) : REGISTRATION_OPEN ? (
              <p className="text-sm text-brand-muted">
                没有账号？{' '}
                <button onClick={() => setIsSignUp(true)} className="text-brand-green-dark font-medium hover:underline">
                  立即注册
                </button>
              </p>
            ) : (
              <p className="text-sm text-brand-muted bg-brand-bg rounded-xl px-4 py-3">
                暂未开放注册，请联系管理员获取账号
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
