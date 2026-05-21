import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { userId, amount } = await req.json()
  if (!userId || !amount || amount <= 0) return NextResponse.json({ error: '缺少参数' }, { status: 400 })

  const { data: profile, error } = await adminSupabase
    .from('profiles').select('credits').eq('id', userId).single()
  if (error || !profile) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const newBalance = profile.credits + amount
  await adminSupabase.from('profiles').update({ credits: newBalance }).eq('id', userId)
  await adminSupabase.from('credit_logs').insert({
    user_id: userId,
    amount,
    balance: newBalance,
    type: 'recharge',
    description: `管理员手动充值 ${amount} 积分`,
  })

  return NextResponse.json({ newBalance })
}
