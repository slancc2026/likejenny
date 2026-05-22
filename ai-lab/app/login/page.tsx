'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

type Tab = 'login' | 'register'

export default function LoginPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
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
      toast.error(msg.includes('Invalid') ? '邮箱或密码错误' : msg)
    } finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) { toast.error('两次密码不一致'); return }
    if (password.length < 6) { toast.error('密码至少6位'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      toast.success('注册成功！请查收验证邮件后登录')
      setTab('login')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '注册失败'
      toast.error(msg.includes('already') ? '该邮箱已注册' : msg)
    } finally { setLoading(false) }
  }

  const inputCls = "w-full px-4 py-3 border-[2px] border-brand-black bg-brand-white text-brand-black text-sm outline-none focus:bg-brand-gray transition-colors font-medium"

  return (
    <div className="min-h-screen bg-brand-white flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col w-1/2 bg-brand-black text-brand-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-center">
          <span className="font-display text-[280px] leading-none">AI</span>
        </div>

        <div className="relative">
          <div className="font-display text-5xl tracking-wide mb-2">莱珂珍妮</div>
          <div className="inline-block bg-brand-green border-[2px] border-brand-green text-brand-black text-[10px] font-black px-3 py-1 tracking-[0.3em] mb-10">AI VISUAL LAB</div>

          <h2 className="font-display text-5xl leading-tight mb-4">
            用 AI 重新定义<br /><span className="text-brand-green">餐饮品牌视觉</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-10">专为餐饮品牌打造的 AI 创作工具<br />菜品精修、海报设计、菜单、LOGO 一站搞定</p>

          <div className="space-y-0 border-[2px] border-gray-700">
            {[
              { emoji: '🥗', name: '菜品精修', desc: '60秒提升食物质感', cost: '4分/张' },
              { emoji: '🎨', name: '宣传海报', desc: '节日/日常/新品场景', cost: '5分/张' },
              { emoji: '📋', name: '菜单设计', desc: '印刷级A4菜单', cost: '8分' },
              { emoji: '⚡', name: '一键全套', desc: '完整品牌物料', cost: '40分' },
            ].map((f, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span>{f.emoji}</span>
                  <div>
                    <span className="font-bold text-sm">{f.name}</span>
                    <span className="text-gray-500 text-xs ml-2">{f.desc}</span>
                  </div>
                </div>
                <span className="text-brand-green font-mono text-xs font-bold">{f.cost}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-auto text-[10px] text-gray-600 tracking-wider">
          © 2026 河南盛塬宏品牌管理有限责任公司
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* 手机端logo */}
          <div className="lg:hidden mb-8">
            <div className="font-display text-3xl">莱珂珍妮</div>
            <div className="inline-block bg-brand-green border-[2px] border-brand-black text-[9px] font-black px-2 py-0.5 tracking-widest">AI LAB</div>
          </div>

          {/* Tab */}
          <div className="flex border-[2px] border-brand-black mb-8">
            <button onClick={() => setTab('login')}
              className={`flex-1 py-2.5 text-sm font-bold tracking-wider transition-colors ${tab === 'login' ? 'bg-brand-black text-brand-white' : 'hover:bg-brand-gray'}`}>
              登录
            </button>
            <button onClick={() => setTab('register')}
              className={`flex-1 py-2.5 text-sm font-bold tracking-wider border-l-[2px] border-brand-black transition-colors ${tab === 'register' ? 'bg-brand-black text-brand-white' : 'hover:bg-brand-gray'}`}>
              注册
            </button>
          </div>

          {tab === 'login' ? (
            <>
              <div className="mb-6">
                <div className="font-display text-4xl tracking-wide mb-1">欢迎回来</div>
                <p className="text-gray-400 text-sm">登录你的 AI 实验室账号</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">邮箱</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="your@email.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">密码</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••" className={inputCls + ' pr-10'} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-brand-black text-brand-white py-3.5 text-sm font-bold tracking-wider border-[2px] border-brand-black hover:bg-brand-green hover:text-brand-black transition-colors disabled:opacity-40">
                  {loading ? '登录中…' : '登录 →'}
                </button>
              </form>
              <p className="text-center text-xs text-gray-400 mt-5">
                没有账号？{' '}
                <button onClick={() => setTab('register')} className="text-brand-black font-bold underline">免费注册</button>
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="font-display text-4xl tracking-wide mb-1">创建账号</div>
                <p className="text-xs text-gray-400">注册即送 <span className="text-brand-black font-bold">10 积分</span>，每日签到再送 1 积分</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">邮箱</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="your@email.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">密码</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="至少6位" className={inputCls + ' pr-10'} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">确认密码</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    placeholder="再次输入密码" className={inputCls} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-brand-green text-brand-black py-3.5 text-sm font-bold tracking-wider border-[2px] border-brand-black hover:bg-yellow-300 transition-colors disabled:opacity-40">
                  {loading ? '注册中…' : '免费注册 →'}
                </button>
              </form>
              <div className="border-[2px] border-brand-gray mt-4 px-4 py-3">
                <p className="text-[10px] text-gray-400 text-center">
                  注册即表示同意 <span className="text-brand-black font-bold cursor-pointer">服务条款</span> 和 <span className="text-brand-black font-bold cursor-pointer">隐私政策</span>
                </p>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">
                已有账号？ <button onClick={() => setTab('login')} className="text-brand-black font-bold underline">直接登录</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
