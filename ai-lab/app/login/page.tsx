'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles, Eye, EyeOff } from 'lucide-react'

type Tab = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败'
      toast.error(msg === 'Invalid login credentials' ? '邮箱或密码错误，请重试' : msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) { toast.error('两次密码不一致'); return }
    if (password.length < 6) { toast.error('密码至少6位'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` }
      })
      if (error) throw error
      toast.success('注册成功！请查收验证邮件后登录')
      setTab('login')
      setPassword('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '注册失败'
      toast.error(msg.includes('already registered') ? '该邮箱已注册，请直接登录' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-green-dark p-12 text-white relative overflow-hidden">
        {/* 装饰圆 */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">莱珂珍妮</p>
              <p className="text-xs text-white/60">AI 实验室</p>
            </div>
          </div>

          <h1 className="font-display text-4xl font-light mb-4 leading-snug">
            用 AI 重新定义<br />餐饮品牌视觉
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-10">
            专为餐饮品牌打造的 AI 创作工具<br />
            菜品精修、海报设计、菜单、LOGO 一站搞定
          </p>

          <div className="space-y-3">
            {[
              { emoji: '🥗', text: '菜品精修 · 60秒提升食物质感', sub: '4 积分/张' },
              { emoji: '🎨', text: '宣传海报 · 节日/日常/新品', sub: '5 积分/张' },
              { emoji: '📋', text: '菜单设计 · 印刷级A4菜单', sub: '8 积分' },
              { emoji: '✨', text: '品牌LOGO · 3套方案', sub: '15 积分' },
            ].map(f => (
              <div key={f.text} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span>{f.emoji}</span>
                  <span className="text-sm">{f.text}</span>
                </div>
                <span className="text-xs text-white/50">{f.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-6 text-sm text-white/50">
            <span>© 2026 河南盛塬宏品牌管理有限责任公司</span>
          </div>
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo（手机端显示） */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-green-dark flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-brand-text">莱珂珍妮 AI 实验室</span>
          </div>

          {/* Tab 切换 */}
          <div className="flex gap-1 bg-brand-bg rounded-xl p-1 mb-8">
            <button onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'login' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}>
              登录
            </button>
            <button onClick={() => setTab('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'register' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}>
              注册
            </button>
          </div>

          {tab === 'login' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-medium text-brand-text mb-1">欢迎回来</h2>
                <p className="text-brand-muted text-sm">登录您的 AI 实验室账号</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">邮箱</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text text-sm outline-none focus:border-brand-green transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">密码</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text text-sm outline-none focus:border-brand-green transition-colors pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-brand-orange text-white py-3 rounded-full text-sm font-medium hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? '登录中…' : '登录'}
                </button>
              </form>
              <p className="text-center text-sm text-brand-muted mt-6">
                没有账号？{' '}
                <button onClick={() => setTab('register')} className="text-brand-green-dark font-medium hover:underline">
                  免费注册
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-medium text-brand-text mb-1">创建账号</h2>
                <p className="text-brand-muted text-sm">注册即送 <span className="text-brand-orange font-medium">10 积分</span>，每日签到再送 1 积分</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">邮箱</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text text-sm outline-none focus:border-brand-green transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">密码</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="至少6位"
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text text-sm outline-none focus:border-brand-green transition-colors pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">确认密码</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    placeholder="再次输入密码"
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text text-sm outline-none focus:border-brand-green transition-colors" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-brand-orange text-white py-3 rounded-full text-sm font-medium hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? '注册中…' : '免费注册'}
                </button>
              </form>
              <div className="mt-4 p-3 bg-brand-bg rounded-xl border border-brand-border">
                <p className="text-xs text-brand-muted text-center">
                  注册即表示同意 <span className="text-brand-green-dark cursor-pointer hover:underline">服务条款</span> 和 <span className="text-brand-green-dark cursor-pointer hover:underline">隐私政策</span>
                </p>
              </div>
              <p className="text-center text-sm text-brand-muted mt-4">
                已有账号？{' '}
                <button onClick={() => setTab('login')} className="text-brand-green-dark font-medium hover:underline">
                  直接登录
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
