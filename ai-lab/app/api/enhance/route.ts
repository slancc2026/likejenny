import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { editImage } from '@/lib/ai'
import { enhancePrompt } from '@/lib/prompts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // 从 Authorization header 获取 token
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const token = authHeader.replace('Bearer ', '')

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = await req.json()
  const { imageBase64, imageMediaType, cuisineType = 'light_food' } = body
  if (!imageBase64) return NextResponse.json({ error: '缺少图片' }, { status: 400 })

  // 检查积分
  const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single()
  if (!profile || profile.credits < 4) return NextResponse.json({ error: '积分不足' }, { status: 400 })

  const { data: task } = await supabase.from('tasks').insert({
    user_id: user.id, task_type: 'enhance', status: 'processing',
    input_data: { cuisineType }, credits_cost: 4,
  }).select().single()
  if (!task) return NextResponse.json({ error: '创建任务失败' }, { status: 500 })

  try {
    // 扣积分
    const newBalance = profile.credits - 4
    await supabase.from('profiles').update({ credits: newBalance }).eq('id', user.id)
    await supabase.from('credit_logs').insert({
      user_id: user.id, amount: -4, balance: newBalance,
      type: 'consume', description: '菜品精修', task_id: task.id,
    })

    // 调用 AI
    const prompt = enhancePrompt(cuisineType)
    const result = await editImage({ imageBase64, imageMediaType, prompt, quality: 'medium' })

    let finalUrl: string
    if (result.startsWith('http')) {
      // 方舟直接返回了 URL
      finalUrl = result
    } else {
      // 返回了 base64，上传到 Storage
      const filePath = `${user.id}/enhance/${task.id}/0.jpg`
      const bytes = Buffer.from(result, 'base64')
      await supabase.storage.from('generated-images').upload(filePath, bytes, { contentType: 'image/jpeg', upsert: true })
      const { data: urlData } = supabase.storage.from('generated-images').getPublicUrl(filePath)
      finalUrl = urlData.publicUrl
    }

    await supabase.from('tasks').update({ status: 'done', output_urls: [finalUrl], progress: 100 }).eq('id', task.id)
    return NextResponse.json({ taskId: task.id, url: finalUrl })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '生成失败'
    await supabase.from('tasks').update({ status: 'failed', error_msg: msg }).eq('id', task.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
