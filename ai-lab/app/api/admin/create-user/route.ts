import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { email, password, credits = 20 } = await req.json()
  if (!email || !password) return NextResponse.json({ error: '缺少参数' }, { status: 400 })

  // 创建用户
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // 设置初始积分
  await adminSupabase.from('profiles').update({ credits }).eq('id', data.user.id)

  // 写积分流水
  await adminSupabase.from('credit_logs').insert({
    user_id: data.user.id,
    amount: credits,
    balance: credits,
    type: 'register',
    description: '管理员创建账号赠送积分',
  })

  return NextResponse.json({ userId: data.user.id, email })
}
