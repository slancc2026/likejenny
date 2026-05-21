import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/ai'
import { logoPrompt } from '@/lib/prompts'
import { uploadGeneratedImage } from '@/lib/storage'
import { deductCredits } from '@/lib/credits'
import { LKJ_DEFAULT_BRAND } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { data: brandData } = await supabase
    .from('brand_profiles').select('*').eq('user_id', user.id).eq('is_default', true).single()
  const brand = brandData || { ...LKJ_DEFAULT_BRAND, id: 0, user_id: user.id, created_at: '', is_default: true }

  const { data: task } = await supabase.from('tasks').insert({
    user_id: user.id, task_type: 'logo', status: 'processing',
    input_data: { brand_name: brand.brand_name }, credits_cost: 15,
  }).select().single()
  if (!task) return NextResponse.json({ error: '创建任务失败' }, { status: 500 })

  try {
    await deductCredits(user.id, 'logo', task.id)

    // 串行生成 3 个方案（每个约 60-90s）
    const urls: string[] = []
    for (let i = 0; i < 3; i++) {
      await supabase.from('tasks').update({ progress: i * 33 }).eq('id', task.id)
      const prompt = logoPrompt(brand, i)
      const [b64] = await generateImage({ prompt, size: '1024x1024', quality: 'medium' })
      const url = await uploadGeneratedImage(user.id, 'logo', task.id, b64, i)
      urls.push(url)
    }

    await supabase.from('tasks').update({ status: 'done', output_urls: urls, progress: 100 }).eq('id', task.id)
    return NextResponse.json({ taskId: task.id, urls })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '生成失败'
    await supabase.from('tasks').update({ status: 'failed', error_msg: msg }).eq('id', task.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
