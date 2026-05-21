import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await adminSupabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { model, messages } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: '缺少消息' }, { status: 400 })

  const BASE_URL = process.env.FANGZHOU_BASE_URL || 'https://api.aiyungc.cn/v1'
  const API_KEY = process.env.FANGZHOU_API_KEY!

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages,
        max_tokens: 2000,
        stream: false,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`模型调用失败: ${res.status} ${err}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '无响应'
    return NextResponse.json({ content })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '请求失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
