'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { Users, Zap, FileText, LogOut, Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

// 用 service role key 的客户端（只在管理员页面用）
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'lkj-admin-2026'

interface User {
  id: string
  email: string
  created_at: string
  credits: number
  total_used: number
}

interface Task {
  id: string
  user_id: string
  task_type: string
  status: string
  credits_cost: number
  created_at: string
  output_urls: string[] | null
  user_email?: string
}

type Tab = 'users' | 'tasks'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  // 新建用户
  const [showNewUser, setShowNewUser] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newCredits, setNewCredits] = useState('20')

  // 充积分
  const [rechargeUserId, setRechargeUserId] = useState<string | null>(null)
  const [rechargeAmount, setRechargeAmount] = useState('50')

  // 展开任务图片
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      loadData()
    } else {
      toast.error('密码错误')
    }
  }

  async function loadData() {
    setLoading(true)
    const supabase = getAdminClient()
    try {
      // 获取用户列表（含邮箱）
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) setUsers(data.users)

      // 获取任务列表
      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, user_id, task_type, status, credits_cost, created_at, output_urls')
        .order('created_at', { ascending: false })
        .limit(100)
      setTasks(taskData || [])
    } finally {
      setLoading(false)
    }
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
      toast.success(`账号 ${newEmail} 创建成功，初始积分 ${newCredits}`)
      setNewEmail(''); setNewPassword(''); setNewCredits('20'); setShowNewUser(false)
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
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
    } finally {
      setLoading(false)
    }
  }

  const TASK_STATUS: Record<string, { label: string; color: string }> = {
    done: { label: '完成', color: 'bg-green-100 text-green-700' },
    processing: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
    failed: { label: '失败', color: 'bg-red-100 text-red-700' },
    pending: { label: '等待', color: 'bg-gray-100 text-gray-700' },
  }

  const TASK_LABELS: Record<string, string> = {
    enhance: '菜品精修', poster: '宣传海报', menu: '菜单设计',
    logo: '品牌LOGO', packaging: '包装物料', bundle: '一键全套'
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 w-80 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center mb-4">
            <span className="text-white text-lg">🔐</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900 mb-1">后台管理</h1>
          <p className="text-sm text-gray-500 mb-6">莱珂珍妮 AI 实验室</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="管理员密码"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 mb-3"
          />
          <button onClick={handleLogin}
            className="w-full bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
            进入后台
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <span className="text-white text-sm">✨</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">莱珂珍妮 AI 实验室</p>
            <p className="text-xs text-gray-500">后台管理系统</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={loadData} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />刷新
          </button>
          <button onClick={() => setAuthed(false)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500">
            <LogOut className="w-4 h-4" />退出
          </button>
        </div>
      </header>

      {/* 统计卡片 */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        {[
          { label: '用户总数', value: users.length, icon: Users, color: 'text-blue-500' },
          { label: '任务总数', value: tasks.length, icon: FileText, color: 'text-purple-500' },
          { label: '完成任务', value: tasks.filter(t => t.status === 'done').length, icon: Zap, color: 'text-green-500' },
          { label: '失败任务', value: tasks.filter(t => t.status === 'failed').length, icon: Zap, color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="px-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-4">
          {(['users', 'tasks'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              {t === 'users' ? '👥 用户管理' : '📋 任务记录'}
            </button>
          ))}
        </div>

        {/* 用户管理 */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-medium text-gray-900">用户列表</p>
              <button onClick={() => setShowNewUser(!showNewUser)}
                className="flex items-center gap-1.5 bg-green-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-600 transition-colors">
                <Plus className="w-4 h-4" />新建账号
              </button>
            </div>

            {/* 新建用户表单 */}
            {showNewUser && (
              <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                <p className="text-sm font-medium text-green-800 mb-3">新建用户账号</p>
                <div className="grid grid-cols-4 gap-3">
                  <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="邮箱地址"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-400" />
                  <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="初始密码" type="password"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-400" />
                  <input value={newCredits} onChange={e => setNewCredits(e.target.value)} placeholder="初始积分" type="number"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-400" />
                  <button onClick={handleCreateUser} disabled={loading}
                    className="bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
                    创建账号
                  </button>
                </div>
              </div>
            )}

            {/* 用户表格 */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['用户ID', '邮箱', '当前积分', '累计消耗', '注册时间', '操作'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <>
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-xs text-gray-400 font-mono">{user.id.slice(0, 12)}...</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                          <Zap className="w-3 h-3" />{user.credits}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">{user.total_used}</td>
                      <td className="px-6 py-3 text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString('zh-CN')}</td>
                      <td className="px-6 py-3">
                        <button onClick={() => setRechargeUserId(rechargeUserId === user.id ? null : user.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                          <Zap className="w-3 h-3" />充积分
                          {rechargeUserId === user.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>
                    {rechargeUserId === user.id && (
                      <tr key={user.id + '-recharge'} className="bg-blue-50">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-blue-700 font-medium">给 {user.email} 充积分：</p>
                            <input value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)}
                              type="number" placeholder="积分数量"
                              className="w-28 px-3 py-1.5 rounded-lg border border-blue-200 text-sm outline-none" />
                            <button onClick={() => handleRecharge(user.id)} disabled={loading}
                              className="bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50">
                              确认充值
                            </button>
                            <button onClick={() => setRechargeUserId(null)} className="text-sm text-gray-500">取消</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 任务记录 */}
        {tab === 'tasks' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="font-medium text-gray-900">最近 100 条任务</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['任务类型', '状态', '积分消耗', '用户ID', '创建时间', '结果'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map(task => {
                  const statusInfo = TASK_STATUS[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-700' }
                  return (
                    <>
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{TASK_LABELS[task.task_type] || task.task_type}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{task.credits_cost} 分</td>
                        <td className="px-6 py-3 text-xs text-gray-400 font-mono">{task.user_id.slice(0, 12)}...</td>
                        <td className="px-6 py-3 text-xs text-gray-400">{new Date(task.created_at).toLocaleString('zh-CN')}</td>
                        <td className="px-6 py-3">
                          {task.output_urls?.length ? (
                            <button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                              className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                              查看图片 {expandedTask === task.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                      </tr>
                      {expandedTask === task.id && task.output_urls && (
                        <tr key={task.id + '-imgs'} className="bg-purple-50">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="flex gap-3 flex-wrap">
                              {task.output_urls.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt="" className="h-24 w-auto rounded-lg border border-purple-200 object-cover hover:opacity-80 transition-opacity" />
                                </a>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="h-8" />
    </div>
  )
}
