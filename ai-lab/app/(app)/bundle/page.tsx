'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'

const STEPS = [
  { key: 'poster', label: '宣传海报', cost: 5, emoji: '🎨' },
  { key: 'menu', label: '菜单设计', cost: 8, emoji: '📋' },
  { key: 'logo', label: '品牌LOGO×3', cost: 15, emoji: '✨' },
  { key: 'packaging', label: '包装物料', cost: 20, emoji: '📦' },
]

type StepStatus = 'idle' | 'running' | 'done' | 'failed'

export default function BundlePage() {
  const [running, setRunning] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>({})
  const [results, setResults] = useState<Record<string, string[]>>({})
  const [dishName, setDishName] = useState('')
  const [price, setPrice] = useState('')

  function setStep(key: string, status: StepStatus) {
    setStatuses(s => ({ ...s, [key]: status }))
  }

  async function runStep(key: string, body: object): Promise<string[]> {
    setStep(key, 'running')
    const res = await fetch(`/api/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setStep(key, 'failed'); throw new Error(data.error) }
    setStep(key, 'done')
    const urls = data.urls || (data.url ? [data.url] : [])
    setResults(r => ({ ...r, [key]: urls }))
    return urls
  }

  async function handleBundle() {
    if (!dishName || !price) { toast.error('请填写菜品名和价格'); return }
    setRunning(true)
    setStatuses({}); setResults({})
    try {
      await runStep('poster', { posterType: 'daily', platform: 'wechat', dishName, price })
      await runStep('menu', { dishes: `【主推】\n  ${dishName} ¥${price}` })
      await runStep('logo', {})
      await runStep('packaging', {})
      toast.success('🎉 全套品牌物料生成完成！')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '某步骤失败，请重试')
    } finally {
      setRunning(false)
    }
  }

  const totalDone = Object.values(statuses).filter(s => s === 'done').length

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-medium text-brand-text">一键全套</h1>
          <span className="text-xs bg-brand-orange text-white px-2 py-0.5 rounded-full font-medium">8折优惠</span>
        </div>
        <p className="text-brand-muted text-sm">串行生成完整品牌物料 · 消耗 40 积分（原价 48 积分）</p>
      </div>

      {/* 基本信息 */}
      <Card className="mb-6">
        <CardHeader><p className="font-medium text-brand-text text-sm">基本信息</p></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-brand-muted mb-1 block">主推菜品</label>
              <input value={dishName} onChange={e => setDishName(e.target.value)} placeholder="如：牛油果沙拉"
                className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-green bg-white" />
            </div>
            <div>
              <label className="text-xs text-brand-muted mb-1 block">菜品价格</label>
              <div className="flex items-center gap-1 bg-white border border-brand-border rounded-xl px-3 py-2">
                <span className="text-brand-muted text-sm">¥</span>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="28"
                  className="flex-1 text-sm outline-none text-brand-text" />
              </div>
            </div>
          </div>
          <Button onClick={handleBundle} loading={running} disabled={running} className="w-full" size="lg">
            {running ? `生成中 (${totalDone}/${STEPS.length})…` : '开始一键生成 · 40积分'}
          </Button>
        </CardBody>
      </Card>

      {/* 步骤进度 */}
      <div className="space-y-3">
        {STEPS.map(step => {
          const status = statuses[step.key] || 'idle'
          return (
            <Card key={step.key}>
              <CardBody className="py-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{step.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-brand-text text-sm">{step.label}</p>
                    <p className="text-xs text-brand-muted">{step.cost} 积分</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'idle' && <Circle className="w-5 h-5 text-brand-border" />}
                    {status === 'running' && <Loader2 className="w-5 h-5 text-brand-orange animate-spin" />}
                    {status === 'done' && <CheckCircle2 className="w-5 h-5 text-brand-green-dark" />}
                    {status === 'failed' && <span className="text-xs text-red-400">失败</span>}
                  </div>
                </div>
                {status === 'done' && results[step.key]?.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {results[step.key].map((url, i) => (
                      <img key={i} src={url} alt="" className="h-20 w-auto rounded-lg border border-brand-border flex-shrink-0 object-cover" />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
