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

  const { prompt, size = '1024x1024' } = await req.json()
  if (!prompt) return NextResponse.json({ error: '缺少描述词' }, { status: 400 })

  const BASE_URL = process.env.FANGZHOU_BASE_URL || 'https://api.aiyungc.cn/v1'
  const API_KEY = process.env.FANGZHOU_API_KEY!
  const MODEL = process.env.FANGZHOU_IMAGE_MODEL || 'gpt-image-2'

  try {
    const res = await fetch(`${BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        size,
        quality: 'medium',
        n: 1,
        response_format: 'b64_json',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`生图失败: ${res.status} ${err}`)
    }

    const data = await res.json()
    const b64 = data.data?.[0]?.b64_json
    if (!b64) throw new Error('未获取到图片数据')

    // 上传到 Supabase Storage
    const filePath = `${user.id}/chat/${Date.now()}.jpg`
    const bytes = Buffer.from(b64, 'base64')
    await adminSupabase.storage.from('generated-images').upload(filePath, bytes, {
      contentType: 'image/jpeg', upsert: true
    })
    const { data: urlData } = adminSupabase.storage.from('generated-images').getPublicUrl(filePath)

    return NextResponse.json({ url: urlData.publicUrl })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '生图失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
