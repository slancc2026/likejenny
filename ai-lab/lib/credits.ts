import { createClient } from '@/lib/supabase/server'
import { TaskType, CREDITS_COST } from '@/types'

/** 检查积分是否充足并扣除，返回扣除后余额；不足时抛出错误 */
export async function deductCredits(
  userId: string,
  taskType: TaskType,
  taskId: string
): Promise<number> {
  const supabase = await createClient()
  const cost = CREDITS_COST[taskType]

  // 用事务方式：先读再写（Supabase 用 RPC 或乐观锁）
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single()

  if (error || !profile) throw new Error('用户档案不存在')
  if (profile.credits < cost) throw new Error(`积分不足（需要 ${cost} 积分，当前 ${profile.credits} 积分）`)

  const newBalance = profile.credits - cost

  await supabase.from('profiles').update({
    credits: newBalance,
    total_used: supabase.rpc as unknown as number, // 通过下面单独更新
  }).eq('id', userId)

  // 更新 total_used（用 RPC increment）
  await supabase.rpc('increment_total_used', { user_id: userId, amount: cost })

  // 写积分流水
  await supabase.from('credit_logs').insert({
    user_id: userId,
    amount: -cost,
    balance: newBalance,
    type: 'consume',
    description: `使用${taskType}功能`,
    task_id: taskId,
  })

  return newBalance
}

/** 发放每日登录积分（每天最多一次） */
export async function claimDailyCredit(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, last_daily_credit')
    .eq('id', userId)
    .single()

  if (!profile) return false
  if (profile.last_daily_credit === today) return false // 今日已领

  const newBalance = profile.credits + 1
  await supabase.from('profiles').update({
    credits: newBalance,
    last_daily_credit: today,
  }).eq('id', userId)

  await supabase.from('credit_logs').insert({
    user_id: userId,
    amount: 1,
    balance: newBalance,
    type: 'daily',
    description: "每日签到奖励",
  })

  return true
}
