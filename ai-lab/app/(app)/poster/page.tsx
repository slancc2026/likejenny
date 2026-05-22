'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { GeneratingOverlay } from '@/components/ui/generating-overlay'
import { createClient } from '@/lib/supabase/client'

const POSTER_TYPES = [
  { value: 'daily', label: '日常推广', desc: '品牌日常宣传' },
  { value: 'festival', label: '节日推广', desc: '节日氛围营销' },
  { value: 'newproduct', label: '新品推广', desc: '新品上市宣传' },
]
const PLATFORMS = [
  { value: 'wechat', label: '朋友圈', size: '1:1', apiSize: '1024x1024' },
  { value: 'xiaohongshu', label: '小红书', size: '3:4', apiSize: '1024x1365' },
  { value: 'douyin', label: '抖音', size: '9:16', apiSize: '1024x1820' },
  { value: 'meituan', label: '美团', size: '1:1', apiSize: '1024x1024' },
]

const inputCls = "w-full px-4 py-2.5 border-[2px] border-brand-black bg-brand-white text-sm font-medium outline-none focus:bg-brand-gray transition-colors"

export default function PosterPage() {
  const [posterType, setPosterType] = useState('daily')
  const [platform, setPlatform] = useState('wechat')
  const [dishName, setDishName] = useState('')
  const [price, setPrice] = useState('')
  const [festival, setFestival] = useState('')
  const [dishDesc, setDishDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const BASE_URL = process.env.NEXT_PUBLIC_FANGZHOU_BASE_URL || 'https://api.aiyungc.cn/v1'
  const API_KEY = process.env.NEXT_PUBLIC_FANGZHOU_API_KEY!
  const MODEL = process.env.NEXT_PUBLIC_FANGZHOU_IMAGE_MODEL || 'gpt-image-2'

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null))
  }, [])

  async function deductCredits(cost: number): Promise<boolean> {
    const supabase = createClient()
    if (!userId) return false
    const { data: p } = await supabase.from('profiles').select('credits').eq('id', userId).single()
    if (!p || p.credits < cost) {
      toast.error(`积分不足（需要${cost}分，当前${p?.credits ?? 0}分）`, { action: { label: '去充值', onClick: () => window.location.href = '/credits' } })
      return false
    }
    const nb = p.credits - cost
    await supabase.from('profiles').update({ credits: nb }).eq('id', userId)
    await supabase.from('credit_logs').insert({ user_id: userId, amount: -cost, balance: nb, type: 'consume', description: '宣传海报' })
    return true
  }

  async function refundCredits(cost: number) {
    const supabase = createClient()
    if (!userId) return
    const { data: p } = await supabase.from('profiles').select('credits').eq('id', userId).single()
    if (!p) return
    const nb = p.credits + cost
    await supabase.from('profiles').update({ credits: nb }).eq('id', userId)
    await supabase.from('credit_logs').insert({ user_id: userId, amount: cost, balance: nb, type: 'recharge', description: '宣传海报失败退款' })
  }

  async function handleGenerate() {
    if (!dishName || !price) { toast.error('请填写菜品名和价格'); return }
    if (posterType === 'festival' && !festival) { toast.error('请填写节日名称'); return }
    const ok = await deductCredits(5)
    if (!ok) return

    setLoading(true)
    const platformObj = PLATFORMS.find(p => p.value === platform)!
    const prompts: Record<string, string> = {
      daily: `餐厅日常宣传图，主推菜品：${dishName}，价格¥${price}，清新ins风格，专业餐饮宣传图，食欲感强，品牌名莱珂珍妮清晰显示，商业级质感`,
      festival: `${festival}主题餐厅营销海报，节日氛围感强，主推：${dishName} 限时¥${price}，品牌名莱珂珍妮醒目显示，清新ins风格`,
      newproduct: `餐厅新品上市宣传图，新品：${dishName}，定价¥${price}，${dishDesc}，突出新品概念，视觉冲击力强，清新ins风格，商业级质感`,
    }

    try {
      const res = await fetch(`${BASE_URL}/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: MODEL, prompt: prompts[posterType], size: platformObj.apiSize, quality: 'medium', n: 1, response_format: 'b64_json' }),
      })
      if (!res.ok) { const e = await res.text(); throw new Error(`生成失败: ${e}`) }
      const data = await res.json()
      const url = data.data?.[0]?.url
      const b64 = data.data?.[0]?.b64_json
      const imgSrc = url || (b64 ? `data:image/jpeg;base64,${b64}` : null)
      if (!imgSrc) throw new Error('未获取到图片')
      setResult(imgSrc)
      toast.success('海报生成完成！')
    } catch (err: unknown) {
      await refundCredits(5)
      toast.error(err instanceof Error ? err.message : '生成失败，积分已退还')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-7 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide mb-1">宣传海报</h1>
        <p className="text-gray-400 text-sm">AI 生成专业宣传海报 · 消耗 5 积分</p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-4">
          {/* 类型 */}
          <div className="border-[2px] border-brand-black">
            <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">海报类型</div>
            <div className="p-4 space-y-2">
              {POSTER_TYPES.map(t => (
                <button key={t.value} onClick={() => setPosterType(t.value)}
                  className={`w-full text-left px-4 py-3 border-[2px] transition-all ${posterType === t.value ? 'bg-brand-black text-brand-white border-brand-black' : 'border-brand-gray hover:border-brand-black'}`}>
                  <span className="font-bold text-sm">{t.label}</span>
                  <span className="text-xs ml-2 opacity-60">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {/* 平台 */}
          <div className="border-[2px] border-brand-black">
            <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">发布平台</div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {PLATFORMS.map(p => (
                <button key={p.value} onClick={() => setPlatform(p.value)}
                  className={`py-2.5 border-[2px] text-sm font-bold transition-all ${platform === p.value ? 'bg-brand-black text-brand-white border-brand-black' : 'border-brand-gray hover:border-brand-black'}`}>
                  {p.label} <span className="text-xs font-normal opacity-60">{p.size}</span>
                </button>
              ))}
            </div>
          </div>
          {/* 信息 */}
          <div className="border-[2px] border-brand-black">
            <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">海报信息</div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">菜品名称 *</label>
                <input value={dishName} onChange={e => setDishName(e.target.value)} placeholder="如：牛油果沙拉" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">价格 *</label>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="如：28" className={inputCls} />
              </div>
              {posterType === 'festival' && (
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">节日名称 *</label>
                  <input value={festival} onChange={e => setFestival(e.target.value)} placeholder="如：元旦、情人节" className={inputCls} />
                </div>
              )}
              {posterType === 'newproduct' && (
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">菜品描述</label>
                  <textarea value={dishDesc} onChange={e => setDishDesc(e.target.value)} placeholder="如：低卡高蛋白，健康又美味" rows={2} className={inputCls + ' resize-none'} />
                </div>
              )}
              <button onClick={handleGenerate} disabled={loading}
                className="w-full bg-brand-black text-brand-white py-3.5 text-sm font-bold tracking-wider border-[2px] border-brand-black hover:bg-brand-green hover:text-brand-black transition-colors disabled:opacity-40">
                {loading ? '生成中…' : '生成海报 · 5积分 →'}
              </button>
            </div>
          </div>
        </div>
        {/* 结果 */}
        <div className="border-[2px] border-brand-black">
          <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">生成结果</div>
          <div className="p-5">
            {loading ? <GeneratingOverlay taskType="poster" estimatedSeconds={80} /> :
              result ? (
                <div className="space-y-4">
                  <img src={result} alt="海报" className="w-full border-[2px] border-brand-black" />
                  <button onClick={() => { const a = document.createElement('a'); a.href = result!; a.download = `海报_${Date.now()}.jpg`; a.click() }}
                    className="w-full flex items-center justify-center gap-2 py-3 border-[2px] border-brand-black font-bold text-sm hover:bg-brand-gray transition-colors">
                    <Download className="w-4 h-4" />下载图片
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-5xl mb-4">🎨</div>
                  <p className="text-sm font-bold">填写信息后点击生成</p>
                  <p className="text-xs text-gray-400 mt-1">预计等待 60-90 秒</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
