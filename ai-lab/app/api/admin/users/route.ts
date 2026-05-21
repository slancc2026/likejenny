import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  // 获取所有用户（含邮箱）
  const { data: authUsers, error } = await adminSupabase.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 获取所有 profiles
  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('id, credits, total_used, created_at')

  const profileMap = new Map((profiles || []).map((p: { id: string; credits: number; total_used: number; created_at: string }) => [p.id, p]))

  const users = authUsers.users.map(u => {
    const profile = profileMap.get(u.id)
    return {
      id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      credits: profile?.credits ?? 0,
      total_used: profile?.total_used ?? 0,
    }
  })

  return NextResponse.json({ users })
}
