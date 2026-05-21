'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { GeneratingOverlay } from '@/components/ui/generating-overlay'

export default function LogoPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  async function handleGenerate() {
    setLoading(true)
    setResults([])
    try {
      const res = await fetch('/api/logo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.urls)
      toast.success('3套LOGO方案生成完成！')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  function download(url: string, i: number) {
    const a = document.createElement('a'); a.href = url; a.download = `LOGO方案${i + 1}_${Date.now()}.jpg`; a.click()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-brand-text mb-1">品牌LOGO</h1>
        <p className="text-brand-muted text-sm">AI 生成3套LOGO方案，串行输出 · 消耗 15 积分</p>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-brand-text mb-1">基于您的品牌档案生成</p>
              <p className="text-sm text-brand-muted">将生成3个不同风格方向的LOGO，预计耗时 3-4 分钟</p>
            </div>
            <Button onClick={handleGenerate} loading={loading} disabled={loading} size="lg">
              生成3套方案 · 15积分
            </Button>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card><CardBody><GeneratingOverlay taskType="logo" estimatedSeconds={210} /></CardBody></Card>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {results.map((url, i) => (
            <Card key={i}>
              <CardHeader>
                <p className="font-medium text-brand-text text-sm">方案 {i + 1}</p>
                <p className="text-xs text-brand-muted mt-0.5">
                  {['简洁几何风', '优雅文字排版', '自然图文结合'][i]}
                </p>
              </CardHeader>
              <CardBody className="space-y-3">
                <img src={url} alt={`LOGO方案${i + 1}`} className="w-full rounded-xl border border-brand-border" />
                <Button onClick={() => download(url, i)} variant="secondary" className="w-full gap-2" size="sm">
                  <Download className="w-3.5 h-3.5" />下载方案{i + 1}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {['简洁几何风', '优雅文字排版', '自然图文结合'].map((style, i) => (
            <Card key={i} className="opacity-50">
              <CardHeader>
                <p className="font-medium text-brand-text text-sm">方案 {i + 1}</p>
                <p className="text-xs text-brand-muted mt-0.5">{style}</p>
              </CardHeader>
              <CardBody>
                <div className="w-full aspect-square rounded-xl bg-brand-bg flex items-center justify-center text-4xl">✨</div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
