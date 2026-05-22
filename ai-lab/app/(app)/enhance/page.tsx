'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { Upload, Download, RotateCcw, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { GeneratingOverlay } from '@/components/ui/generating-overlay'
import { createClient } from '@/lib/supabase/client'

type CuisineType = 'light_food' | 'chinese'

const ENHANCE_PROMPTS: Record<CuisineType, string> = {
  light_food: `Professional food photography enhancement,
clean white marble surface, bright natural lighting from upper left,
fresh healthy aesthetic, shallow depth of field with soft bokeh,
commercial quality suitable for restaurant menu,
vibrant but natural colors, crisp sharp details, appetizing presentation`,
  chinese: `Transform into professional Chinese restaurant advertisement photo,
warm wooden surface, dramatic warm lighting, rich colors,
commercial menu quality, appetizing`,
}

export default function EnhancePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cuisineType, setCuisineType] = useState<CuisineType>('light_food')
  const [dragging, setDragging] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const BASE_URL = process.env.NEXT_PUBLIC_FANGZHOU_BASE_URL || 'https://api.aiyungc.cn/v1'
  const API_KEY = process.env.NEXT_PUBLIC_FANGZHOU_API_KEY!
  const MODEL = process.env.NEXT_PUBLIC_FANGZHOU_IMAGE_MODEL || 'gpt-image-2'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null)
    })
  }, [])

  function handleFile(f: File) {
    if (!f.type.startsWith('image/')) { toast.error('请上传图片文件'); return }
    if (f.size > 20 * 1024 * 1024) { toast.error('图片不能超过20MB'); return }
    setFile(f); setResult(null)
    const img = document.createElement('img')
    const url = URL.createObjectURL(f)
    img.onload = () => {
      const MAX = 1024
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (!blob) return
        const reader = new FileReader()
        reader.onload = e => setPreview(e.target?.result as string)
        reader.readAsDataURL(blob)
      }, 'image/jpeg', 0.85)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  async function deductCredits(cost: number): Promise<boolean> {
    const supabase = createClient()
    if (!userId) return false
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', userId).single()
    if (!profile || profile.credits < cost) {
      toast.error(`积分不足（需要 ${cost} 积分，当前 ${profile?.credits ?? 0} 积分）`, {
        action: { label: '去充值', onClick: () => window.location.href = '/credits' }
      })
      return false
    }
    const newBalance = profile.credits - cost
    await supabase.from('profiles').update({ credits: newBalance }).eq('id', userId)
    await supabase.from('credit_logs').insert({
      user_id: userId, amount: -cost, balance: newBalance,
      type: 'consume', description: '菜品精修'
    })
    return true
  }

  async function refundCredits(cost: number) {
    const supabase = createClient()
    if (!userId) return
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', userId).single()
    if (!profile) return
    const newBalance = profile.credits + cost
    await supabase.from('profiles').update({ credits: newBalance }).eq('id', userId)
    await supabase.from('credit_logs').insert({
      user_id: userId, amount: cost, balance: newBalance,
      type: 'recharge', description: '菜品精修失败退款'
    })
  }

  async function handleEnhance() {
    if (!file || !preview) { toast.error('请先上传图片'); return }
    if (!userId) { toast.error('请先登录'); return }

    // 先扣积分
    const ok = await deductCredits(4)
    if (!ok) return

    setLoading(true)
    try {
      const base64 = preview.split(',')[1]
      const byteString = atob(base64)
      const bytes = new Uint8Array(byteString.length)
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i)
      const blob = new Blob([bytes], { type: file.type })

      const formData = new FormData()
      formData.append('image', blob, 'image.jpg')
      formData.append('model', MODEL)
      formData.append('prompt', ENHANCE_PROMPTS[cuisineType])
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
        throw new Error(`生成失败: ${res.status} ${err}`)
      }

      const data = await res.json()
      const imgUrl = data.data?.[0]?.url || null
      const imgB64 = data.data?.[0]?.b64_json || null

      if (imgUrl) {
        setResult(imgUrl)
      } else if (imgB64) {
        setResult(`data:image/jpeg;base64,${imgB64}`)
      } else {
        throw new Error('未获取到图片')
      }

      // 保存任务记录
      const supabase = createClient()
      await supabase.from('tasks').insert({
        user_id: userId, task_type: 'enhance', status: 'done',
        input_data: { cuisineType }, output_urls: [imgUrl || ''],
        credits_cost: 4, progress: 100,
      })

      toast.success('精修完成！')
    } catch (err: unknown) {
      // 失败退积分
      await refundCredits(4)
      toast.error(err instanceof Error ? err.message : '生成失败，积分已退还')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!result) return
    if (result.startsWith('data:')) {
      const a = document.createElement('a'); a.href = result; a.download = `精修图_${Date.now()}.jpg`; a.click()
    } else {
      window.open(result, '_blank')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-brand-text mb-1">菜品精修</h1>
        <p className="text-brand-muted text-sm">上传菜品原图，AI 自动提升质感 · 消耗 4 积分</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><p className="font-medium text-brand-text text-sm">上传原图</p></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-xs text-brand-muted">菜品类型</p>
                <div className="group relative">
                  <Info className="w-3 h-3 text-brand-muted cursor-help" />
                  <div className="absolute left-4 -top-1 w-48 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    影响 AI 的布光方式和图像风格，轻食用白色大理石背景，中式用暖木质背景
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {[{ value: 'light_food', label: '轻食/沙拉' }, { value: 'chinese', label: '中式菜品' }].map(opt => (
                  <button key={opt.value} onClick={() => setCuisineType(opt.value as CuisineType)}
                    className={`flex-1 py-2 rounded-xl text-sm border transition-all ${cuisineType === opt.value ? 'border-brand-green bg-emerald-50 text-brand-green-dark font-medium' : 'border-brand-border text-brand-muted hover:border-brand-green'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
              onDrop={onDrop} onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${dragging ? 'border-brand-green bg-emerald-50' : 'border-brand-border hover:border-brand-green'}`}
              style={{ minHeight: 240 }}>
              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {preview ? (
                <img src={preview} alt="原图" className="w-full h-full object-contain" style={{ maxHeight: 320 }} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-brand-muted" />
                  </div>
                  <p className="text-sm font-medium text-brand-text mb-1">点击或拖拽上传</p>
                  <p className="text-xs text-brand-muted">支持 JPG / PNG，最大 20MB</p>
                </div>
              )}
            </div>

            <Button onClick={handleEnhance} disabled={!file || loading} loading={loading} className="w-full" size="lg">
              {loading ? '精修中…' : '开始精修 · 4积分'}
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><p className="font-medium text-brand-text text-sm">精修结果</p></CardHeader>
          <CardBody>
            {loading ? <GeneratingOverlay taskType="enhance" estimatedSeconds={90} /> :
              result ? (
                <div className="space-y-4">
                  <img src={result} alt="精修图" className="w-full rounded-xl border border-brand-border" />
                  <div className="flex gap-2">
                    <Button onClick={handleDownload} variant="secondary" className="flex-1 gap-2">
                      <Download className="w-4 h-4" />下载图片
                    </Button>
                    <Button onClick={() => { setResult(null) }} variant="ghost"><RotateCcw className="w-4 h-4" /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-4xl mb-3">🥗</div>
                  <p className="text-sm text-brand-muted">精修结果将在这里显示</p>
                  <p className="text-xs text-brand-muted mt-1">预计等待 60-90 秒</p>
                </div>
              )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 md:mt-6 grid grid-cols-3 gap-3">
        {[
          { emoji: '💡', title: '光线优化', desc: '自动补光，模拟专业摄影棚效果' },
          { emoji: '🎨', title: '色彩增强', desc: '提升饱和度，让菜品更鲜艳诱人' },
          { emoji: '✨', title: '细节锐化', desc: '提升清晰度，展现菜品纹理质感' },
        ].map(item => (
          <div key={item.title} className="bg-white rounded-xl border border-brand-border p-4">
            <span className="text-xl">{item.emoji}</span>
            <p className="text-sm font-medium text-brand-text mt-2 mb-1">{item.title}</p>
            <p className="text-xs text-brand-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
