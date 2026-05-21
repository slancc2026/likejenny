'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Download, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { GeneratingOverlay } from '@/components/ui/generating-overlay'

const POSTER_TYPES = [
  { value: 'daily', label: '日常推广', desc: '品牌日常宣传' },
  { value: 'festival', label: '节日推广', desc: '节日氛围营销' },
  { value: 'newproduct', label: '新品推广', desc: '新品上市宣传' },
]
const PLATFORMS = [
  { value: 'wechat', label: '朋友圈', size: '1:1' },
  { value: 'xiaohongshu', label: '小红书', size: '3:4' },
  { value: 'douyin', label: '抖音', size: '9:16' },
  { value: 'meituan', label: '美团', size: '1:1' },
]

export default function PosterPage() {
  const [posterType, setPosterType] = useState('daily')
  const [platform, setPlatform] = useState('wechat')
  const [dishName, setDishName] = useState('')
  const [price, setPrice] = useState('')
  const [festival, setFestival] = useState('')
  const [dishDesc, setDishDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleGenerate() {
    if (!dishName || !price) { toast.error('请填写菜品名和价格'); return }
    if (posterType === 'festival' && !festival) { toast.error('请填写节日名称'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posterType, platform, dishName, price, festival, dishDesc }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.url)
      toast.success('海报生成完成！')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-brand-text mb-1">宣传海报</h1>
        <p className="text-brand-muted text-sm">AI 生成专业宣传海报 · 消耗 5 积分</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* 海报类型 */}
          <Card>
            <CardHeader><p className="font-medium text-brand-text text-sm">海报类型</p></CardHeader>
            <CardBody className="space-y-2">
              {POSTER_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setPosterType(t.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    posterType === t.value
                      ? 'border-brand-green bg-emerald-50'
                      : 'border-brand-border hover:border-brand-green'
                  }`}
                >
                  <p className={`text-sm font-medium ${posterType === t.value ? 'text-brand-green-dark' : 'text-brand-text'}`}>{t.label}</p>
                  <p className="text-xs text-brand-muted">{t.desc}</p>
                </button>
              ))}
            </CardBody>
          </Card>

          {/* 平台选择 */}
          <Card>
            <CardHeader><p className="font-medium text-brand-text text-sm">发布平台</p></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`py-2.5 rounded-xl border text-sm transition-all ${
                      platform === p.value
                        ? 'border-brand-green bg-emerald-50 text-brand-green-dark font-medium'
                        : 'border-brand-border text-brand-muted hover:border-brand-green'
                    }`}
                  >
                    {p.label}
                    <span className="text-xs ml-1 opacity-60">{p.size}</span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* 信息填写 */}
          <Card>
            <CardHeader><p className="font-medium text-brand-text text-sm">海报信息</p></CardHeader>
            <CardBody className="space-y-3">
              <div>
                <label className="text-xs text-brand-muted mb-1 block">菜品名称 *</label>
                <input value={dishName} onChange={e => setDishName(e.target.value)} placeholder="如：牛油果沙拉"
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-green bg-white" />
              </div>
              <div>
                <label className="text-xs text-brand-muted mb-1 block">价格 *</label>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="如：28"
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-green bg-white" />
              </div>
              {posterType === 'festival' && (
                <div>
                  <label className="text-xs text-brand-muted mb-1 block">节日名称 *</label>
                  <input value={festival} onChange={e => setFestival(e.target.value)} placeholder="如：元旦、情人节"
                    className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-green bg-white" />
                </div>
              )}
              {posterType === 'newproduct' && (
                <div>
                  <label className="text-xs text-brand-muted mb-1 block">菜品描述</label>
                  <textarea value={dishDesc} onChange={e => setDishDesc(e.target.value)} placeholder="如：低卡高蛋白，健康又美味" rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-green bg-white resize-none" />
                </div>
              )}
              <Button onClick={handleGenerate} loading={loading} disabled={loading} className="w-full" size="lg">
                生成海报 · 5积分
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* 结果 */}
        <Card>
          <CardHeader><p className="font-medium text-brand-text text-sm">生成结果</p></CardHeader>
          <CardBody>
            {loading ? (
              <GeneratingOverlay taskType="poster" estimatedSeconds={80} />
            ) : result ? (
              <div className="space-y-4">
                <img src={result} alt="海报" className="w-full rounded-xl border border-brand-border" />
                <div className="flex gap-2">
                  <Button onClick={() => { const a = document.createElement('a'); a.href = result!; a.download = `海报_${Date.now()}.jpg`; a.click() }}
                    variant="secondary" className="flex-1 gap-2">
                    <Download className="w-4 h-4" />下载图片
                  </Button>
                  <Button onClick={() => setResult(null)} variant="ghost"><RotateCcw className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-4xl mb-3">🎨</div>
                <p className="text-sm text-brand-muted">填写信息后点击生成</p>
                <p className="text-xs text-brand-muted mt-1">预计等待 60-90 秒</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
