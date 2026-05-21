'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { GeneratingOverlay } from '@/components/ui/generating-overlay'

export default function PackagingPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/packaging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.url)
      toast.success('包装物料生成完成！')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-brand-text mb-1">包装物料</h1>
        <p className="text-brand-muted text-sm">AI 生成完整品牌触点系统 · 消耗 20 积分</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {['手提袋', '纸杯', '餐盒', '贴纸', '菜单卡', '场景图'].map(item => (
          <div key={item} className="flex items-center gap-2 text-sm text-brand-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
            {item}
          </div>
        ))}
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-brand-text mb-1">一键生成品牌触点系统</p>
              <p className="text-sm text-brand-muted">包含6+品牌物料，设计机构提案风格，预计 90-120 秒</p>
            </div>
            <Button onClick={handleGenerate} loading={loading} disabled={loading} size="lg">
              生成物料 · 20积分
            </Button>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card><CardBody><GeneratingOverlay taskType="packaging" estimatedSeconds={120} /></CardBody></Card>
      ) : result ? (
        <Card>
          <CardHeader><p className="font-medium text-brand-text text-sm">品牌触点系统</p></CardHeader>
          <CardBody className="space-y-4">
            <img src={result} alt="包装物料" className="w-full rounded-xl border border-brand-border" />
            <Button onClick={() => { const a = document.createElement('a'); a.href = result!; a.download = `品牌物料_${Date.now()}.jpg`; a.click() }}
              variant="secondary" className="w-full gap-2">
              <Download className="w-4 h-4" />下载物料图
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-brand-muted text-sm">点击生成，AI 将一次性输出完整品牌触点系统</p>
        </div>
      )}
    </div>
  )
}
