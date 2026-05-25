'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import {
  Users, Zap, FileText, LogOut, Plus, RefreshCw,
  ChevronDown, ChevronUp, Search, X, TrendingUp,
  AlertCircle, CheckCircle, Clock, BarChart2, Download
} from 'lucide-react'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'lkj-admin-2026'

interface User {
  id: string; email: string; created_at: string
  credits: number; total_used: number; last_daily_credit: string | null
}
interface Task {
  id: string; user_id: string; task_type: string; status: string
  credits_cost: number; created_at: string; output_urls: string[] | null
  error_msg?: string
}
interface CreditLog {
  id: number; user_id: string; amount: number; balance: number
  type: string; description: string; created_at: string
}

type Tab = 'overview' | 'users' | 'tasks' | 'credits'

const TASK_TYPE_LABELS: Record<string, string> = {
  enhance: '菜品精修', poster: '宣传海报', menu: '菜单设计',
  logo: '品牌LOGO', packaging: '包装物料', bundle: '一键全套', chat: 'AI对话'
}
const TASK_TYPE_COST: Record<string, number> = {
  enhance: 4, poster: 5, menu: 8, logo: 15, packaging: 20, bundle: 40
}

const inputCls = "w-full px-4 py-2.5 border-[2px] border-brand-black bg-white text-sm font-medium outline-none focus:border-brand-green transition-colors"

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [creditLogs, setCreditLogs] = useState<CreditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // 用户操作
  const [showNewUser, setShowNewUser] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newCredits, setNewCredits] = useState('20')
  const [rechargeUserId, setRechargeUserId] = useState<string | null>(null)
  const [rechargeAmount, setRechargeAmount] = useState('50')
  const [userSearch, setUserSearch] = useState('')

  // 任务操作
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [taskTypeFilter, setTaskTypeFilter] = useState('all')
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = getAdminClient()
    try {
      const [usersRes, tasksRes, logsRes] = await Promise.all([
        fetch('/api/admin/users'),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('credit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      ])
      const usersData = await usersRes.json()
      if (usersData.users) setUsers(usersData.users)
      if (tasksRes.data) setTasks(tasksRes.data)
      if (logsRes.data) setCreditLogs(logsRes.data)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  function handleLogin() {
    if (password === ADMIN_PASSWORD) { setAuthed(true); loadData() }
    else toast.error('密码错误')
  }

  async function handleCreateUser() {
    if (!newEmail || !newPassword) { toast.error('请填写邮箱和密码'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, credits: parseInt(newCredits) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`账号 ${newEmail} 创建成功`)
      setNewEmail(''); setNewPassword(''); setNewCredits('20'); setShowNewUser(false)
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '创建失败')
    } finally { setLoading(false) }
  }

  async function handleRecharge(userId: string) {
    const amount = parseInt(rechargeAmount)
    if (!amount || amount <= 0) { toast.error('请输入正确的积分数'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`充值 ${amount} 积分成功`)
      setRechargeUserId(null)
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '充值失败')
    } finally { setLoading(false) }
  }

  // ── 统计计算 ──
  const totalCreditsConsumed = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.credits_cost || 0), 0)
  const totalCreditsRemaining = users.reduce((s, u) => s + (u.credits || 0), 0)
  const tasksByType = Object.entries(TASK_TYPE_LABELS).map(([type, label]) => ({
    type, label, count: tasks.filter(t => t.task_type === type).length,
    done: tasks.filter(t => t.task_type === type && t.status === 'done').length,
  })).filter(t => t.count > 0)

  // 今日数据
  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter(t => t.created_at?.startsWith(today))
  const todayUsers = users.filter(u => u.created_at?.startsWith(today))

  // 过滤用户
  const filteredUsers = users.filter(u =>
    !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  // 过滤任务
  const filteredTasks = tasks.filter(t =>
    (taskTypeFilter === 'all' || t.task_type === taskTypeFilter) &&
    (taskStatusFilter === 'all' || t.status === taskStatusFilter)
  )

  // 成功率
  const successRate = tasks.length > 0
    ? Math.round(tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0

  // ── 登录页 ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="font-display text-4xl text-white tracking-wide mb-1">莱珂珍妮</div>
            <div className="inline-block bg-brand-green text-brand-black text-[9px] font-black px-2 py-0.5 tracking-[0.3em]">ADMIN · 后台管理</div>
          </div>
          <div className="border-[2px] border-gray-700 bg-brand-black p-6">
            <div className="text-[9px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-4">AUTHORIZATION REQUIRED</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="管理员密码"
              className="w-full px-4 py-3 bg-transparent border-[2px] border-gray-700 text-white text-sm outline-none focus:border-brand-green transition-colors mb-4 placeholder-gray-600"
            />
            <button onClick={handleLogin}
              className="w-full bg-brand-green text-brand-black py-3 text-sm font-bold tracking-wider border-[2px] border-brand-green hover:bg-brand-yellow transition-colors">
              进入后台 →
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-700 mt-4 tracking-wider">ai.shengyuanhong.cn · ADMIN</p>
        </div>
      </div>
    )
  }

  // ── 主界面 ──
  return (
    <div className="min-h-screen bg-brand-white">
      {/* 顶部栏 */}
      <header className="bg-brand-black border-b-[2px] border-brand-black px-5 h-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="font-display text-lg text-white tracking-wide">莱珂珍妮</div>
          <div className="text-[9px] font-bold tracking-[0.25em] text-brand-green uppercase">ADMIN PANEL</div>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-[10px] text-gray-500 font-mono hidden md:block">
              更新于 {lastRefresh.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-brand-green transition-colors border border-gray-700 px-3 py-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />刷新
          </button>
          <button onClick={() => setAuthed(false)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-brand-red transition-colors border border-gray-700 px-3 py-1.5">
            <LogOut className="w-3.5 h-3.5" />退出
          </button>
        </div>
      </header>

      {/* 导航 Tab */}
      <div className="bg-brand-black border-b-[2px] border-brand-black px-5 flex gap-0 overflow-x-auto">
        {([
          { key: 'overview', label: '数据总览', icon: BarChart2 },
          { key: 'users',    label: '用户管理', icon: Users },
          { key: 'tasks',    label: '任务记录', icon: FileText },
          { key: 'credits',  label: '积分流水', icon: Zap },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all whitespace-nowrap ${
              tab === key ? 'text-brand-green border-brand-green' : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="p-5">

        {/* ── 数据总览 ── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {/* 核心指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-[2px] border-brand-black">
              {[
                { label: '注册用户', value: users.length, sub: `今日+${todayUsers.length}`, accent: false },
                { label: '累计任务', value: tasks.length, sub: `今日+${todayTasks.length}`, accent: false },
                { label: '积分消耗', value: totalCreditsConsumed, sub: '全部完成任务', accent: true },
                { label: '任务成功率', value: `${successRate}%`, sub: `${tasks.filter(t=>t.status==='done').length}/${tasks.length}`, accent: false },
              ].map((s, i) => (
                <div key={i} className={`p-5 border-r-[2px] last:border-r-0 border-brand-black ${i % 2 === 1 ? 'border-r-0 md:border-r-[2px]' : ''}`}>
                  <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-2">{s.label}</div>
                  <div className={`font-display text-4xl leading-none mb-1 ${s.accent ? 'text-brand-green' : ''}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-400">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* 今日快报 + 积分概况 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-[2px] border-brand-black">
              <div className="p-5 border-r-[2px] border-brand-black">
                <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-4">今日快报 · TODAY</div>
                <div className="space-y-3">
                  {[
                    { label: '新增用户', value: todayUsers.length, unit: '人' },
                    { label: '生成任务', value: todayTasks.length, unit: '次' },
                    { label: '成功完成', value: todayTasks.filter(t=>t.status==='done').length, unit: '次' },
                    { label: '积分消耗', value: todayTasks.filter(t=>t.status==='done').reduce((s,t)=>s+(t.credits_cost||0),0), unit: '分' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-brand-gray last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="font-bold text-sm">{item.value} <span className="text-gray-400 font-normal">{item.unit}</span></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-4">积分概况 · CREDITS</div>
                <div className="space-y-3">
                  {[
                    { label: '用户剩余积分总量', value: totalCreditsRemaining, unit: '分' },
                    { label: '历史消耗积分总量', value: totalCreditsConsumed, unit: '分', accent: true },
                    { label: '平均每用户余额', value: users.length ? Math.round(totalCreditsRemaining/users.length) : 0, unit: '分' },
                    { label: '失败任务数', value: tasks.filter(t=>t.status==='failed').length, unit: '次' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-brand-gray last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className={`font-bold text-sm ${item.accent ? 'text-brand-green' : ''}`}>{item.value} <span className="text-gray-400 font-normal">{item.unit}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 功能使用分布 */}
            {tasksByType.length > 0 && (
              <div className="border-[2px] border-brand-black">
                <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">功能使用分布 · USAGE</div>
                <div className="p-5">
                  <div className="space-y-3">
                    {tasksByType.sort((a,b) => b.count - a.count).map(item => {
                      const pct = tasks.length > 0 ? Math.round(item.count / tasks.length * 100) : 0
                      return (
                        <div key={item.type} className="flex items-center gap-4">
                          <div className="w-20 text-sm font-bold flex-shrink-0">{item.label}</div>
                          <div className="flex-1 h-3 bg-brand-gray border-[1.5px] border-brand-black relative">
                            <div className="absolute inset-y-0 left-0 bg-brand-black" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="w-24 text-right font-mono text-xs text-gray-400">
                            {item.count}次 · {pct}%
                          </div>
                          <div className="w-16 text-right text-[10px] text-brand-green font-bold">
                            {item.done}/{item.count}成功
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 用户积分排行 */}
            <div className="border-[2px] border-brand-black">
              <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widests uppercase flex items-center justify-between">
                <span>用户积分排行 · LEADERBOARD</span>
                <span className="text-gray-400 font-normal">按当前余额</span>
              </div>
              <div>
                {[...users].sort((a,b) => b.credits - a.credits).slice(0, 5).map((user, i) => (
                  <div key={user.id} className="flex items-center gap-4 px-5 py-3 border-b border-brand-gray last:border-0 hover:bg-brand-gray transition-colors">
                    <div className={`w-6 h-6 flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-brand-yellow text-brand-black' : i < 3 ? 'bg-brand-black text-white' : 'bg-brand-gray text-gray-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{user.email}</div>
                      <div className="text-[10px] text-gray-400">注册 {new Date(user.created_at).toLocaleDateString('zh-CN')}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-display text-xl text-brand-green">{user.credits}</div>
                      <div className="text-[9px] text-gray-400">余额</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm">{user.total_used}</div>
                      <div className="text-[9px] text-gray-400">消耗</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 用户管理 ── */}
        {tab === 'users' && (
          <div className="space-y-4">
            {/* 操作栏 */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex items-center gap-3 border-[2px] border-brand-black bg-white px-4 py-2.5 flex-1 max-w-sm">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="搜索邮箱..." className="flex-1 text-sm outline-none" />
                {userSearch && <button onClick={() => setUserSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
              <button onClick={() => setShowNewUser(!showNewUser)}
                className="flex items-center gap-2 bg-brand-black text-white text-sm font-bold px-5 py-2.5 border-[2px] border-brand-black hover:bg-brand-green hover:text-brand-black transition-colors">
                <Plus className="w-4 h-4" />新建账号
              </button>
            </div>

            {/* 新建用户 */}
            {showNewUser && (
              <div className="border-[2px] border-brand-green bg-green-50 p-5">
                <div className="text-xs font-bold tracking-widest uppercase mb-4 text-brand-green">新建用户账号</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="邮箱地址" className={inputCls} />
                  <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="初始密码" type="password" className={inputCls} />
                  <input value={newCredits} onChange={e => setNewCredits(e.target.value)} placeholder="初始积分" type="number" className={inputCls} />
                  <div className="flex gap-2">
                    <button onClick={handleCreateUser} disabled={loading}
                      className="flex-1 bg-brand-black text-white text-sm font-bold border-[2px] border-brand-black hover:bg-brand-green hover:text-brand-black transition-colors disabled:opacity-40 py-2.5">
                      创建
                    </button>
                    <button onClick={() => setShowNewUser(false)}
                      className="px-4 border-[2px] border-brand-black text-sm font-bold hover:bg-brand-gray transition-colors">
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 用户列表 */}
            <div className="border-[2px] border-brand-black overflow-hidden">
              <div className="px-5 py-3 border-b-[2px] border-brand-black bg-brand-black text-white grid grid-cols-12 gap-4 text-[9px] font-bold tracking-[0.2em] uppercase">
                <div className="col-span-4">用户邮箱</div>
                <div className="col-span-2 text-center">当前积分</div>
                <div className="col-span-2 text-center">累计消耗</div>
                <div className="col-span-2">注册时间</div>
                <div className="col-span-2 text-right">操作</div>
              </div>
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">没有找到用户</div>
              )}
              {filteredUsers.map(user => (
                <div key={user.id}>
                  <div className="px-5 py-3.5 border-b border-brand-gray hover:bg-brand-gray transition-colors grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div className="text-sm font-medium truncate">{user.email}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{user.id.slice(0,16)}…</div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-display text-2xl text-brand-green">{user.credits}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-bold text-sm">{user.total_used}</span>
                    </div>
                    <div className="col-span-2 text-xs text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button onClick={() => setRechargeUserId(rechargeUserId === user.id ? null : user.id)}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 border-[2px] transition-all ${rechargeUserId === user.id ? 'bg-brand-black text-white border-brand-black' : 'border-brand-gray hover:border-brand-black'}`}>
                        <Zap className="w-3 h-3" />充积分
                      </button>
                    </div>
                  </div>
                  {rechargeUserId === user.id && (
                    <div className="px-5 py-4 bg-yellow-50 border-b-[2px] border-brand-yellow flex flex-wrap items-center gap-3">
                      <span className="text-sm font-bold">给 <span className="text-brand-green">{user.email}</span> 充积分</span>
                      <input value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)}
                        type="number" placeholder="积分数量"
                        className="w-32 px-3 py-2 border-[2px] border-brand-black text-sm outline-none focus:border-brand-green" />
                      <button onClick={() => handleRecharge(user.id)} disabled={loading}
                        className="bg-brand-black text-white text-sm font-bold px-5 py-2 border-[2px] border-brand-black hover:bg-brand-green hover:text-brand-black transition-colors disabled:opacity-40">
                        确认充值
                      </button>
                      <button onClick={() => setRechargeUserId(null)}
                        className="text-sm text-gray-400 hover:text-brand-black transition-colors">
                        取消
                      </button>
                      {/* 快捷金额 */}
                      <div className="flex gap-2 ml-2">
                        {[20, 50, 100, 200].map(n => (
                          <button key={n} onClick={() => setRechargeAmount(String(n))}
                            className="text-[10px] font-bold px-2 py-1 border border-brand-gray hover:border-brand-black transition-colors">
                            +{n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 任务记录 ── */}
        {tab === 'tasks' && (
          <div className="space-y-4">
            {/* 过滤栏 */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-1">
                {['all', ...Object.keys(TASK_TYPE_LABELS)].map(type => (
                  <button key={type} onClick={() => setTaskTypeFilter(type)}
                    className={`text-xs font-bold px-3 py-2 border-[2px] transition-all ${taskTypeFilter === type ? 'bg-brand-black text-white border-brand-black' : 'border-brand-gray hover:border-brand-black'}`}>
                    {type === 'all' ? '全部类型' : TASK_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {[['all','全部状态'],['done','完成'],['failed','失败'],['processing','进行中']].map(([val, label]) => (
                  <button key={val} onClick={() => setTaskStatusFilter(val)}
                    className={`text-xs font-bold px-3 py-2 border-[2px] transition-all ${taskStatusFilter === val ? 'bg-brand-black text-white border-brand-black' : 'border-brand-gray hover:border-brand-black'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400 ml-auto">{filteredTasks.length} 条记录</span>
            </div>

            <div className="border-[2px] border-brand-black overflow-hidden">
              <div className="px-5 py-3 border-b-[2px] border-brand-black bg-brand-black text-white grid grid-cols-12 gap-3 text-[9px] font-bold tracking-[0.2em] uppercase">
                <div className="col-span-2">功能类型</div>
                <div className="col-span-1 text-center">状态</div>
                <div className="col-span-1 text-center">积分</div>
                <div className="col-span-3">用户</div>
                <div className="col-span-3">时间</div>
                <div className="col-span-2 text-right">结果</div>
              </div>
              {filteredTasks.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">暂无任务记录</div>
              )}
              {filteredTasks.map(task => {
                const statusMap: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
                  done:       { label: '完成', icon: CheckCircle,  cls: 'text-brand-green' },
                  failed:     { label: '失败', icon: AlertCircle,  cls: 'text-brand-red' },
                  processing: { label: '进行中', icon: Clock,      cls: 'text-blue-500' },
                  pending:    { label: '等待', icon: Clock,        cls: 'text-gray-400' },
                }
                const st = statusMap[task.status] || statusMap.pending
                const Icon = st.icon
                const user = users.find(u => u.id === task.user_id)
                return (
                  <div key={task.id}>
                    <div className="px-5 py-3 border-b border-brand-gray hover:bg-brand-gray transition-colors grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-2">
                        <span className="font-bold text-sm">{TASK_TYPE_LABELS[task.task_type] || task.task_type}</span>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className={`flex items-center justify-center gap-1 text-xs font-bold ${st.cls}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="col-span-1 text-center font-mono text-sm font-bold">{task.credits_cost || '—'}</div>
                      <div className="col-span-3 text-xs text-gray-500 truncate">
                        {user?.email || task.user_id.slice(0, 16) + '…'}
                      </div>
                      <div className="col-span-3 text-xs text-gray-400 font-mono">
                        {new Date(task.created_at).toLocaleString('zh-CN')}
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        {task.output_urls?.length ? (
                          <button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 border-[2px] transition-all ${expandedTask === task.id ? 'bg-brand-black text-white border-brand-black' : 'border-brand-gray hover:border-brand-black'}`}>
                            <Download className="w-3 h-3" />
                            {expandedTask === task.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        ) : task.status === 'failed' && task.error_msg ? (
                          <span className="text-[10px] text-brand-red truncate max-w-[100px]" title={task.error_msg}>
                            {task.error_msg.slice(0, 20)}…
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </div>
                    {expandedTask === task.id && task.output_urls && (
                      <div className="px-5 py-4 bg-brand-gray border-b-[2px] border-brand-black flex gap-3 flex-wrap">
                        {task.output_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" className="h-28 w-auto border-[2px] border-brand-black object-cover hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 积分流水 ── */}
        {tab === 'credits' && (
          <div className="space-y-4">
            {/* 流水汇总 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-[2px] border-brand-black">
              {[
                { label: '总流水条数', value: creditLogs.length },
                { label: '充值记录', value: creditLogs.filter(l => l.type === 'recharge' || l.type === 'register' || l.type === 'daily').length },
                { label: '消耗记录', value: creditLogs.filter(l => l.type === 'consume').length },
                { label: '今日流水', value: creditLogs.filter(l => l.created_at?.startsWith(today)).length },
              ].map((s, i) => (
                <div key={i} className="p-4 border-r-[2px] last:border-r-0 border-brand-black">
                  <div className="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-1">{s.label}</div>
                  <div className="font-display text-3xl">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="border-[2px] border-brand-black overflow-hidden">
              <div className="px-5 py-3 border-b-[2px] border-brand-black bg-brand-black text-white grid grid-cols-12 gap-3 text-[9px] font-bold tracking-[0.2em] uppercase">
                <div className="col-span-3">用户</div>
                <div className="col-span-2 text-center">变动</div>
                <div className="col-span-2 text-center">余额</div>
                <div className="col-span-2">类型</div>
                <div className="col-span-3">描述/时间</div>
              </div>
              {creditLogs.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">暂无流水记录</div>
              )}
              {creditLogs.map(log => {
                const user = users.find(u => u.id === log.user_id)
                const typeMap: Record<string, { label: string; cls: string }> = {
                  consume:  { label: '消耗', cls: 'text-brand-red' },
                  recharge: { label: '充值', cls: 'text-brand-green' },
                  register: { label: '注册', cls: 'text-blue-500' },
                  daily:    { label: '签到', cls: 'text-brand-yellow' },
                }
                const tp = typeMap[log.type] || { label: log.type, cls: 'text-gray-400' }
                return (
                  <div key={log.id} className="px-5 py-3 border-b border-brand-gray hover:bg-brand-gray transition-colors grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3 text-xs text-gray-500 truncate">
                      {user?.email || log.user_id.slice(0, 16) + '…'}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`font-bold text-sm ${log.amount > 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                        {log.amount > 0 ? '+' : ''}{log.amount}
                      </span>
                    </div>
                    <div className="col-span-2 text-center font-mono text-sm">{log.balance}</div>
                    <div className="col-span-2">
                      <span className={`text-xs font-bold ${tp.cls}`}>{tp.label}</span>
                    </div>
                    <div className="col-span-3">
                      <div className="text-xs text-gray-500 truncate">{log.description}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{new Date(log.created_at).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-brand-black border-t-[2px] border-brand-black h-7 flex items-center px-5 gap-5 text-[9px] font-bold tracking-widest z-40">
        <span className="text-brand-green">● ADMIN ONLINE</span>
        <span className="text-gray-600">·</span>
        <span className="text-gray-500">ai.shengyuanhong.cn</span>
        <span className="text-gray-600">·</span>
        <span className="text-gray-500">{users.length} 用户 · {tasks.length} 任务</span>
        <span className="ml-auto text-gray-500" id="admin-clock"></span>
      </div>
      <div className="h-7" />

      <script dangerouslySetInnerHTML={{ __html: `
        function tick(){const e=document.getElementById('admin-clock');if(e)e.textContent=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
        tick();setInterval(tick,1000)
      `}} />
    </div>
  )
}
