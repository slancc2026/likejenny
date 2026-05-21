import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/ai'
import { menuPrompt } from '@/lib/prompts'
import { uploadGeneratedImage } from '@/lib/storage'
import { deductCredits } from '@/lib/credits'
import { LKJ_DEFAULT_BRAND } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { dishes } = await req.json() // dishes: string（格式化好的菜品文本）

  const { data: brandData } = await supabase
    .from('brand_profiles').select('*').eq('user_id', user.id).eq('is_default', true).single()
  const brand = brandData || { ...LKJ_DEFAULT_BRAND, id: 0, user_id: user.id, created_at: '', is_default: true }

  const { data: task } = await supabase.from('tasks').insert({
    user_id: user.id, task_type: 'menu', status: 'processing',
    input_data: { dishes }, credits_cost: 8,
  }).select().single()
  if (!task) return NextResponse.json({ error: '创建任务失败' }, { status: 500 })

  try {
    await deductCredits(user.id, 'menu', task.id)
    const prompt = menuPrompt(brand, dishes)
    const [b64] = await generateImage({ prompt, size: '1024x1536', quality: 'high' })
    const url = await uploadGeneratedImage(user.id, 'menu', task.id, b64, 0)
    await supabase.from('tasks').update({ status: 'done', output_urls: [url], progress: 100 }).eq('id', task.id)
    return NextResponse.json({ taskId: task.id, url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '生成失败'
    await supabase.from('tasks').update({ status: 'failed', error_msg: msg }).eq('id', task.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
