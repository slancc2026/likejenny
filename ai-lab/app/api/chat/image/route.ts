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

  const { prompt, size = '1024x1024', model = 'gpt-image-2', imageBase64, imageMediaType } = await req.json()
  if (!prompt) return NextResponse.json({ error: '缺少描述词' }, { status: 400 })

  const BASE_URL = process.env.FANGZHOU_BASE_URL || 'https://api.aiyungc.cn/v1'
  const API_KEY = process.env.FANGZHOU_API_KEY!

  try {
    let b64: string

    if (imageBase64) {
      // 图生图：调用 /images/edits，不传 negative_prompt，不传 response_format
      const byteString = Buffer.from(imageBase64, 'base64')
      const blob = new Blob([byteString], { type: imageMediaType || 'image/jpeg' })
      const formData = new FormData()
      formData.append('image', blob, 'image.jpg')
      formData.append('model', model)
      formData.append('prompt', prompt)
      formData.append('size', '1024x1024')
      formData.append('quality', 'medium')
      // ⚠️ 不传 negative_prompt，不传 response_format

      const res = await fetch(`${BASE_URL}/images/edits`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`图生图失败: ${res.status} ${err}`)
      }
      const data = await res.json()
      // 兼容返回 url 或 b64_json
      if (data.data?.[0]?.url) {
        return NextResponse.json({ url: data.data[0].url })
      }
      b64 = data.data?.[0]?.b64_json
    } else {
      // 文生图：调用 /images/generations
      const res = await fetch(`${BASE_URL}/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({ model, prompt, size, quality: 'medium', n: 1, response_format: 'b64_json' }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`文生图失败: ${res.status} ${err}`)
      }
      const data = await res.json()
      b64 = data.data?.[0]?.b64_json
    }

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
