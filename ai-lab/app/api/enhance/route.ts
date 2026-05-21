import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { editImage } from '@/lib/ai'
import { enhancePrompt } from '@/lib/prompts'
import { uploadGeneratedImage } from '@/lib/storage'
import { deductCredits } from '@/lib/credits'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = await req.json()
  const { imageBase64, imageMediaType, cuisineType = 'light_food' } = body

  if (!imageBase64) return NextResponse.json({ error: '缺少图片' }, { status: 400 })

  // 创建任务记录
  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      task_type: 'enhance',
      status: 'processing',
      input_data: { cuisineType },
      credits_cost: 4,
    })
    .select()
    .single()

  if (taskErr || !task) return NextResponse.json({ error: '创建任务失败' }, { status: 500 })

  try {
    // 扣除积分
    await deductCredits(user.id, 'enhance', task.id)

    // 调用 AI（图生图，绝对不传 negative_prompt）
    const prompt = enhancePrompt(cuisineType)
    const b64 = await editImage({ imageBase64, imageMediaType, prompt, quality: 'medium' })

    // 上传到 Storage
    const url = await uploadGeneratedImage(user.id, 'enhance', task.id, b64, 0)

    // 更新任务
    await supabase.from('tasks').update({
      status: 'done',
      output_urls: [url],
      progress: 100,
    }).eq('id', task.id)

    return NextResponse.json({ taskId: task.id, url })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '生成失败'
    await supabase.from('tasks').update({ status: 'failed', error_msg: msg }).eq('id', task.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
