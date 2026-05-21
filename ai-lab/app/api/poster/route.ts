import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/ai'
import { posterPrompt } from '@/lib/prompts'
import { uploadGeneratedImage } from '@/lib/storage'
import { deductCredits } from '@/lib/credits'
import { LKJ_DEFAULT_BRAND } from '@/types'

const SIZE_MAP: Record<string, '1024x1024' | '1024x1365' | '1024x1820'> = {
  'wechat': '1024x1024',
  'xiaohongshu': '1024x1365',
  'douyin': '1024x1820',
  'meituan': '1024x1024',
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = await req.json()
  const { posterType, platform, dishName, price, festival, dishDesc } = body

  // 读取品牌档案
  const { data: brandData } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  const brand = brandData || { ...LKJ_DEFAULT_BRAND, id: 0, user_id: user.id, created_at: '', is_default: true }
  const size = SIZE_MAP[platform] || '1024x1024'

  const { data: task } = await supabase.from('tasks').insert({
    user_id: user.id,
    task_type: 'poster',
    status: 'processing',
    input_data: { posterType, platform, dishName, price, festival, dishDesc },
    credits_cost: 5,
  }).select().single()

  if (!task) return NextResponse.json({ error: '创建任务失败' }, { status: 500 })

  try {
    await deductCredits(user.id, 'poster', task.id)

    const prompt = posterPrompt(brand, posterType, { dish_name: dishName, price, festival, dish_desc: dishDesc })
    const [b64] = await generateImage({ prompt, size, quality: 'medium' })
    const url = await uploadGeneratedImage(user.id, 'poster', task.id, b64, 0)

    await supabase.from('tasks').update({ status: 'done', output_urls: [url], progress: 100 }).eq('id', task.id)
    return NextResponse.json({ taskId: task.id, url })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '生成失败'
    await supabase.from('tasks').update({ status: 'failed', error_msg: msg }).eq('id', task.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
