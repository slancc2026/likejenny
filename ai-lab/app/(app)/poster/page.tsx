'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Download, Info } from 'lucide-react'
import { GeneratingOverlay } from '@/components/ui/generating-overlay'
import { createClient } from '@/lib/supabase/client'
import { posterPrompt, BrandProfile } from '@/lib/prompts'
import Link from 'next/link'

const POSTER_TYPES = [
  { value: 'daily',      label: '日常推广', desc: '品牌日常宣传' },
  { value: 'festival',   label: '节日推广', desc: '节日氛围营销' },
  { value: 'newproduct', label: '新品推广', desc: '新品上市宣传' },
]
const PLATFORMS = [
  { value: 'wechat',        label: '朋友圈',  size: '1:1',  apiSize: '1024x1024' },
  { value: 'xiaohongshu',   label: '小红书',  size: '3:4',  apiSize: '1024x1365' },
  { value: 'douyin',        label: '抖音',    size: '9:16', apiSize: '1024x1820' },
  { value: 'meituan',       label: '美团',    size: '1:1',  apiSize: '1024x1024' },
]

const inputCls = "w-full px-4 py-2.5 border-[2px] border-brand-black bg-white text-sm font-medium outline-none focus:border-brand-green transition-colors"

export default function PosterPage() {
  const [posterType, setPosterType] = useState('daily')
  const [platform, setPlatform] = useState('wechat')
  const [dishName, setDishName] = useState('')
  const [price, setPrice] = useState('')
  const [festival, setFestival] = useState('')
  const [dishDesc, setDishDesc] = useState('')
  const [copyTitle, setCopyTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [brand, setBrand] = useState<BrandProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const BASE_URL = process.env.NEXT_PUBLIC_FANGZHOU_BASE_URL || 'https://api.aiyungc.cn/v1'
  const API_KEY = process.env.NEXT_PUBLIC_FANGZHOU_API_KEY!
  const MODEL = process.env.NEXT_PUBLIC_FANGZHOU_IMAGE_MODEL || 'gpt-image-2'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      setUserId(data.session.user.id)
      // 从 DB 读取品牌档案（避坑：不信任前端传参，从 DB 读中文）
      const { data: b } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', data.session.user.id)
        .single()
      if (b) setBrand(b as BrandProfile)
    })
  }, [])

  async function deductCredits(cost: number): Promise<boolean> {
    const supabase = createClient()
    if (!userId) return false
    const { data: p } = await supabase.from('profiles').select('credits').eq('id', userId).single()
    if (!p || p.credits < cost) {
      toast.error(`积分不足（需要${cost}分，当前${p?.credits ?? 0}分）`, {
        action: { label: '去充值', onClick: () => window.location.href = '/credits' }
      })
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
    if (!dishName.trim()) { toast.error('请填写菜品名称'); return }
    if (!price.trim()) { toast.error('请填写价格'); return }
    if (posterType === 'festival' && !festival.trim()) { toast.error('请填写节日名称'); return }
    if (!brand) {
      toast.error('请先设置品牌档案', { action: { label: '去设置', onClick: () => window.location.href = '/brand' } })
      return
    }

    const ok = await deductCredits(5)
    if (!ok) return
    setLoading(true)

    const platformObj = PLATFORMS.find(p => p.value === platform)!
    // 从 DB 读取的 brand 生成结构化 Prompt
    const prompt = posterPrompt(brand, {
      posterType: posterType as 'daily' | 'festival' | 'newproduct',
      platform,
      dishName: dishName.trim(),
      price: price.trim(),
      festival: festival.trim() || undefined,
      dishDesc: dishDesc.trim() || undefined,
      copyTitle: copyTitle.trim() || undefined,
    })

    try {
      const res = await fetch(`${BASE_URL}/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: MODEL, prompt, size: platformObj.apiSize, quality: 'medium', n: 1 }),
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-7 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide mb-1">宣传海报</h1>
        <p className="text-gray-400 text-sm">AI 生成专业宣传海报 · 消耗 5 积分</p>
      </div>

      {/* 品牌档案提示 */}
      {!brand && (
        <div className="border-[2px] border-brand-yellow bg-yellow-50 px-5 py-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-yellow flex-shrink-0" />
            <p className="text-sm font-medium">设置品牌档案后，海报会自动带入你的品牌名和风格偏好</p>
          </div>
          <Link href="/brand" className="text-xs font-bold border-[2px] border-brand-black px-3 py-1.5 hover:bg-brand-black hover:text-white transition-colors whitespace-nowrap ml-4">
            去设置 →
          </Link>
        </div>
      )}
      {brand && (
        <div className="border-[2px] border-brand-green bg-green-50 px-5 py-3 mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-brand-green">✓ 使用品牌档案：<span className="font-black">{brand.brand_name}</span> · {brand.cuisine_type === 'light_food' ? '轻食健康' : brand.cuisine_type}</p>
          <Link href="/brand" className="text-xs text-gray-400 hover:text-brand-black">修改 →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <div className="space-y-4">
          {/* 类型 */}
          <div className="border-[2px] border-brand-black">
            <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">海报类型</div>
            <div className="p-4 space-y-2">
              {POSTER_TYPES.map(t => (
                <button key={t.value} onClick={() => setPosterType(t.value)}
                  className={`w-full text-left px-4 py-3 border-[2px] transition-all ${posterType === t.value ? 'bg-brand-black text-white border-brand-black' : 'border-brand-gray hover:border-brand-black'}`}>
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
                  className={`py-2.5 border-[2px] text-sm font-bold transition-all ${platform === p.value ? 'bg-brand-black text-white border-brand-black' : 'border-brand-gray hover:border-brand-black'}`}>
                  {p.label} <span className="text-xs font-normal opacity-60">{p.size}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 信息 */}
          <div className="border-[2px] border-brand-black">
            <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">海报内容</div>
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
                  <input value={festival} onChange={e => setFestival(e.target.value)} placeholder="如：元旦、情人节、五一" className={inputCls} />
                </div>
              )}
              {posterType === 'newproduct' && (
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">产品特点</label>
                  <textarea value={dishDesc} onChange={e => setDishDesc(e.target.value)} placeholder="如：低卡高蛋白，健康又美味" rows={2} className={inputCls + ' resize-none'} />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">主标题文案（选填）</label>
                <input value={copyTitle} onChange={e => setCopyTitle(e.target.value)} placeholder="如：今日限定、新品来了" className={inputCls} />
                <p className="text-[10px] text-gray-400 mt-1">不填则由 AI 自动生成</p>
              </div>
              <button onClick={handleGenerate} disabled={loading}
                className="w-full bg-brand-black text-white py-3.5 text-sm font-bold tracking-wider border-[2px] border-brand-black hover:bg-brand-green hover:text-brand-black transition-colors disabled:opacity-40">
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
                  <button onClick={() => setResult(null)}
                    className="w-full py-2 text-xs text-gray-400 border border-brand-gray hover:border-brand-black transition-colors">
                    重新生成
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
